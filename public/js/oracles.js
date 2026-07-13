(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var panels = {};
  tabs.forEach(function (t) { panels[t.getAttribute('data-target')] = document.getElementById('panel-' + t.getAttribute('data-target')); });
  function activate(id, push) {
    if (!panels[id]) return;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-target') === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    Object.keys(panels).forEach(function (k) { panels[k].classList.toggle('is-active', k === id); });
    if (push && window.history && history.replaceState) history.replaceState(null, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { activate(t.getAttribute('data-target'), true); }); });
  var order = tabs.map(function (t) { return t.getAttribute('data-target'); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (['INPUT', 'TEXTAREA'].indexOf((document.activeElement || {}).tagName) > -1) return;
    var cur = -1; order.forEach(function (id, i) { if (panels[id].classList.contains('is-active')) cur = i; });
    if (cur < 0) return;
    var next = e.key === 'ArrowLeft' ? cur - 1 : cur + 1;
    if (next < 0) next = order.length - 1; if (next >= order.length) next = 0;
    activate(order[next], true); tabs[next].focus();
  });
  var h = (location.hash || '').replace('#', ''); if (h && panels[h]) activate(h, false);
  var root = document.documentElement, btn = document.getElementById('themeToggle');
  function current() { return root.getAttribute('data-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
  btn.addEventListener('click', function () { var n = current() === 'dark' ? 'light' : 'dark'; root.setAttribute('data-theme', n); try { localStorage.setItem('oracles-theme', n); } catch (e) {} });
  try { var saved = localStorage.getItem('oracles-theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
})();

(function () {
  var synth = window.speechSynthesis;
  var bar = document.getElementById('ttsBar');
  var toggleBtn = document.getElementById('ttsToggle');
  var stopBtn = document.getElementById('ttsStop');
  var rateBtn = document.getElementById('ttsRate');
  var voiceSel = document.getElementById('ttsVoice');
  if (!synth || !bar || !('SpeechSynthesisUtterance' in window)) { if (bar) bar.style.display = 'none'; return; }
  var rates = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1];
  var rateIdx = 2;
  var PITCH = 0.82;
  var queue = [], qi = 0, speaking = false, paused = false, curEl = null;
  var voices = [], chosen = null, userPicked = false;
  var engine = 'cloud';
  var CLOUD_URL = '/api/tts';
  var CLOUD_VOICE = 'zh-CN-YunjianNeural';
  var audio = new Audio();
  audio.preload = 'auto';
  var cloudFailed = false;
  function edgeRate() { var pct = Math.round((rates[rateIdx] - 1) * 100); return (pct >= 0 ? '+' : '') + pct + '%'; }
  function cloudSrc(t) { return CLOUD_URL + '?voice=' + encodeURIComponent(CLOUD_VOICE) + '&rate=' + encodeURIComponent(edgeRate()) + '&pitch=' + encodeURIComponent('-4Hz') + '&text=' + encodeURIComponent(t); }
  function prefetch(idx) { if (idx < queue.length) { try { fetch(cloudSrc(queue[idx].text)).catch(function () {}); } catch (e) {} } }
  function playCloud() {
    if (!speaking) return;
    if (qi >= queue.length) { stop(); return; }
    var item = queue[qi];
    highlight(item.el);
    audio.playbackRate = 1;
    audio.src = cloudSrc(item.text);
    prefetch(qi + 1);
    var p = audio.play(); if (p && p.catch) p.catch(function () {});
  }
  function previewCloud() {
    try { synth.cancel(); } catch (e) {} try { audio.pause(); } catch (e) {}
    audio.playbackRate = 1;
    audio.src = cloudSrc('公义如大水滚滚，公义如江河滔滔。');
    var p = audio.play(); if (p && p.catch) p.catch(function () {});
  }
  function fallbackToLocal() {
    cloudFailed = true; engine = 'local';
    if (!chosen) chosen = voices[0] || null;
    var ix = chosen ? voices.indexOf(chosen) : -1;
    if (ix >= 0) voiceSel.value = String(ix);
    if (speaking && !paused) speakNext();
  }
  audio.addEventListener('ended', function () { if (engine === 'cloud' && speaking && !paused) { qi++; playCloud(); } });
  audio.addEventListener('error', function () { if (engine === 'cloud' && speaking) fallbackToLocal(); });
  var MALE = /(yunjian|yunyang|yunxi|yunze|yunhao|kangkang|云健|云扬|云希|云泽|康康|male|男)/i;
  var FEMALE = /(tingting|ting-?ting|huihui|xiaoxiao|xiaoyi|xiaomeng|mei-?jia|sin-?ji|yaoyao|female|女|婷婷|晓晓|慧慧)/i;
  var HQ = /(neural|natural|online|enhanced|premium|plus)/i;
  var BLOCK = /^\s*(eddy|grandpa|grandma|flo|reed|rocko|sandy|shelley|mei-?jia|meijia)\b/i;
  function isZh(v) { return /^zh([-_]|$)/i.test(v.lang || ''); }
  function score(v) {
    var n = (v.name || '') + ' ' + (v.lang || ''), s = 0;
    if (MALE.test(n)) s += 100;
    if (HQ.test(n)) s += 45;
    if (/zh[-_]?CN|Hans/i.test(v.lang || '')) s += 20;
    if (/google/i.test(n)) s += 10;
    if (FEMALE.test(n)) s -= 70;
    return s;
  }
  function loadVoices() {
    var all = synth.getVoices() || [];
    voices = all.filter(function (v) { return isZh(v) && !BLOCK.test(v.name || ''); });
    if (!voices.length) voices = all.filter(function (v) { return !BLOCK.test(v.name || ''); });
    voices.sort(function (a, b) { return score(b) - score(a); });
    voiceSel.innerHTML = '';
    var oc = document.createElement('option'); oc.value = 'cloud'; oc.textContent = '☁ 云健·云端男声'; voiceSel.appendChild(oc);
    voices.forEach(function (v, i) {
      var o = document.createElement('option');
      o.value = String(i);
      var tag = MALE.test(v.name) ? '♂ ' : (FEMALE.test(v.name) ? '♀ ' : '');
      var nm = (v.name || '').replace(/Microsoft |Online|\(Natural\)/g, '').replace(/\s+/g, ' ').trim();
      o.textContent = tag + nm + (HQ.test(v.name) ? ' ·高清' : '');
      voiceSel.appendChild(o);
    });
    if (!chosen && voices.length) chosen = voices[0];
    if (!userPicked) { engine = 'cloud'; voiceSel.value = 'cloud'; }
    else if (engine === 'cloud') { voiceSel.value = 'cloud'; }
    else if (chosen) { var ix = voices.indexOf(chosen); if (ix >= 0) voiceSel.value = String(ix); }
  }
  loadVoices();
  if (typeof synth.onvoiceschanged !== 'undefined') synth.onvoiceschanged = loadVoices;
  function previewVoice() {
    try { synth.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance('公义如大水滚滚，公义如江河滔滔。');
    u.lang = 'zh-CN'; if (chosen) u.voice = chosen; u.rate = rates[rateIdx]; u.pitch = PITCH;
    synth.speak(u);
  }
  voiceSel.addEventListener('change', function () {
    userPicked = true;
    if (voiceSel.value === 'cloud') { engine = 'cloud'; cloudFailed = false; if (!speaking) previewCloud(); return; }
    engine = 'local'; chosen = voices[parseInt(voiceSel.value, 10)] || null; if (!speaking) previewVoice();
  });
  function activePanel() { return document.querySelector('.panel.is-active'); }
  function chunkText(text, max) {
    var out = [], buf = '', i, ch, ender;
    for (i = 0; i < text.length; i++) {
      ch = text.charAt(i); buf += ch;
      ender = (ch === '。' || ch === '！' || ch === '？' || ch === '；' || ch === '：' || ch === '…' || ch === '”');
      if (buf.length >= max && ender) { out.push(buf); buf = ''; }
    }
    if (buf) out.push(buf);
    var fin = [], k, c;
    for (k = 0; k < out.length; k++) { c = out[k]; while (c.length > max * 1.8) { fin.push(c.slice(0, max)); c = c.slice(max); } if (c) fin.push(c); }
    return fin;
  }
  function buildQueue(panel) {
    queue = []; qi = 0;
    if (!panel) return;
    var els = Array.prototype.slice.call(panel.querySelectorAll('.panel-title, .notice p, .sec, .sec-sub, .stanza'));
    els.forEach(function (el) {
      var clone = el.cloneNode(true);
      Array.prototype.slice.call(clone.querySelectorAll('.cite')).forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
      var text = (clone.textContent || '').replace(/\s+/g, '').trim();
      if (!text) return;
      chunkText(text, 150).forEach(function (t) { queue.push({ el: el, text: t }); });
    });
  }
  function highlight(el) {
    if (curEl && curEl !== el) curEl.classList.remove('reading');
    curEl = el;
    if (!el) return;
    el.classList.add('reading');
    var r = el.getBoundingClientRect();
    if (r.top < 76 || r.bottom > (window.innerHeight - 96)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function speakNext() {
    if (!speaking) return;
    if (qi >= queue.length) { stop(); return; }
    var item = queue[qi];
    highlight(item.el);
    var u = new SpeechSynthesisUtterance(item.text);
    u.lang = 'zh-CN'; if (chosen) u.voice = chosen; u.rate = rates[rateIdx]; u.pitch = PITCH;
    u.onend = function () { qi++; if (speaking && !paused) speakNext(); };
    u.onerror = function () { qi++; if (speaking && !paused) speakNext(); };
    synth.speak(u);
  }
  function start() {
    try { synth.cancel(); } catch (e) {} try { audio.pause(); } catch (e) {}
    buildQueue(activePanel());
    if (!queue.length) return;
    speaking = true; paused = false; qi = 0; setUI();
    if (engine === 'cloud' && !cloudFailed) playCloud(); else speakNext();
  }
  function pauseSpeak() { if (speaking && !paused) { paused = true; try { synth.pause(); } catch (e) {} try { audio.pause(); } catch (e) {} setUI(); } }
  function resumeSpeak() { if (speaking && paused) { paused = false; try { synth.resume(); } catch (e) {} if (engine === 'cloud') { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } setUI(); } }
  function stop() { speaking = false; paused = false; try { synth.cancel(); } catch (e) {} try { audio.pause(); } catch (e) {} if (curEl) { curEl.classList.remove('reading'); curEl = null; } qi = 0; queue = []; setUI(); }
  function setUI() {
    if (!speaking) { toggleBtn.textContent = '▶ 朗读'; bar.classList.remove('active'); }
    else if (paused) { toggleBtn.textContent = '▶ 继续'; bar.classList.add('active'); }
    else { toggleBtn.textContent = '⏸ 暂停'; bar.classList.add('active'); }
    rateBtn.textContent = rates[rateIdx].toFixed(1) + '×';
  }
  toggleBtn.addEventListener('click', function () { if (!speaking) start(); else if (paused) resumeSpeak(); else pauseSpeak(); });
  stopBtn.addEventListener('click', stop);
  rateBtn.addEventListener('click', function () { rateIdx = (rateIdx + 1) % rates.length; setUI(); });
  var mo = new MutationObserver(function (muts) { for (var i = 0; i < muts.length; i++) { if (muts[i].attributeName === 'class') { if (speaking) stop(); return; } } });
  Array.prototype.slice.call(document.querySelectorAll('.panel')).forEach(function (p) { mo.observe(p, { attributes: true, attributeFilter: ['class'] }); });
  setInterval(function () { if (speaking && !paused) { try { synth.resume(); } catch (e) {} } }, 9000);
  window.addEventListener('beforeunload', function () { try { synth.cancel(); } catch (e) {} });
  setUI();
})();
