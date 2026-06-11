// callNotes.js — 通话记录（连续转写）+ 多人聚合，双引擎：
//   web      浏览器 Web Speech API（免费、低延迟；Chrome/Edge 质量好）
//   deepgram 云转写（nova-2，8 秒分段上传；准确率更高，浏览器不支持/识别质量差时的降级通道）
// 引擎选择：偏好 'auto'（默认，Web Speech 不可用或连续出错时自动降级）| 'deepgram'（强制云转写）。
// 每人只转写自己的发言（说话人归属准确、不录他人音频）；
// 各端转写行经 LiveKit 数据通道广播，全房间共同拼出带名字的完整记录。

let recognition = null
let active = false
let engine = 'web'       // 当前会话实际引擎
let selfName = ''
let curLang = 'zh-CN'
let webFatalErrors = 0   // Web Speech 连续致命错误计数（→ 自动降级）
let buffer = []          // [{ t: epochMs, name, text, remote }]
let lineSink = null      // 本地新行回调（通话组件用它广播到房间）
const listeners = new Set()

// Deepgram 引擎状态
let dgStream = null
let dgRecorder = null
let dgTimer = null
const DG_SEGMENT_MS = 8000
// 与 App.jsx 同模式：Vite 构建期静态替换 env
const DG_KEY = import.meta.env?.VITE_DEEPGRAM_API_KEY || 'a87cbb2d1ec9b07a456fb55319a104731924b12f'

export function isSupported() {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}
export function deepgramAvailable() {
  return typeof window !== 'undefined' && !!window.MediaRecorder && !!DG_KEY
}

// ── 引擎偏好（localStorage 持久化）──
export function preferredEngine() {
  try { return localStorage.getItem('call-notes-engine') || 'auto' } catch { return 'auto' }
}
export function setPreferredEngine(v) {
  try { localStorage.setItem('call-notes-engine', v === 'deepgram' ? 'deepgram' : 'auto') } catch { /* noop */ }
  notify()
}

function notify() { listeners.forEach((cb) => { try { cb(getState()) } catch { /* noop */ } }) }

export function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb) }

export function getState() {
  return { active, engine, preferred: preferredEngine(), lines: buffer.length, supported: isSupported() || deepgramAvailable() }
}

/** 设置本地新行回调（用于广播给房间其他人）；由通话组件在连接/离房时设置与清除 */
export function setLineSink(fn) { lineSink = fn }

/** 接收其他参会者广播来的转写行（去重：同名同文 3 秒内只收一次） */
export function addRemoteLine(name, text) {
  const tx = String(text || '').trim()
  if (!tx) return
  const now = Date.now()
  const dup = buffer.some((l) => l.name === name && l.text === tx && now - l.t < 3000)
  if (dup) return
  buffer.push({ t: now, name: String(name || '').slice(0, 40), text: tx.slice(0, 500), remote: true })
  notify()
}

function pushLocal(text) {
  const line = { t: Date.now(), name: selfName, text, remote: false }
  buffer.push(line)
  if (lineSink) { try { lineSink(line) } catch { /* noop */ } }
  notify()
}

// ── 引擎一：Web Speech ──────────────────────────────────────────────────────
function startWeb(lang) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SR()
  recognition.lang = lang
  recognition.continuous = true
  recognition.interimResults = false
  recognition.onresult = (ev) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i]
      if (r.isFinal && r[0]?.transcript?.trim()) {
        webFatalErrors = 0
        pushLocal(r[0].transcript.trim())
      }
    }
  }
  // 浏览器会在静音后自动停：active 期间自动重启保持连续
  recognition.onend = () => { if (active && engine === 'web') { try { recognition.start() } catch { /* noop */ } } }
  recognition.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { active = false; notify(); return }
    // 'no-speech' 是正常静音；network/audio-capture 等连续出现 → 自动降级到云转写
    if (e.error && e.error !== 'no-speech' && e.error !== 'aborted') {
      webFatalErrors += 1
      if (webFatalErrors >= 2 && preferredEngine() === 'auto' && deepgramAvailable()) {
        try { recognition.onend = null; recognition.stop() } catch { /* noop */ }
        recognition = null
        startDeepgram().then((ok) => { if (!ok) { active = false } ; notify() })
      }
    }
  }
  try { recognition.start(); return true } catch { return false }
}

// ── 引擎二：Deepgram 云转写（分段上传，段间无缝衔接）────────────────────────
function pickMime() {
  const cands = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const m of cands) { try { if (window.MediaRecorder?.isTypeSupported?.(m)) return m } catch { /* noop */ } }
  return ''
}

async function dgTranscribe(blob, contentType) {
  const url = 'https://api.deepgram.com/v1/listen'
    + '?model=nova-2&detect_language=true&punctuate=true&smart_format=true'
  const doFetch = () => fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${DG_KEY}`, 'Content-Type': contentType || 'audio/webm' },
    body: blob,
  })
  try {
    let res = await doFetch()
    if (!res.ok && res.status >= 500) { await new Promise((r) => setTimeout(r, 600)); res = await doFetch() }
    if (!res.ok) return
    const tx = (await res.json()).results?.channels?.[0]?.alternatives?.[0]?.transcript
    if (tx?.trim()) pushLocal(tx.trim())
  } catch { /* 单段失败丢弃，不中断会话 */ }
}

function dgLoopSegment() {
  if (!active || engine !== 'deepgram' || !dgStream) return
  const mime = pickMime()
  let rec
  try { rec = mime ? new MediaRecorder(dgStream, { mimeType: mime }) : new MediaRecorder(dgStream) }
  catch { active = false; notify(); return }
  dgRecorder = rec
  const chunks = []
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
  rec.onstop = () => {
    const used = (rec.mimeType || mime || 'audio/webm').split(';')[0]
    const blob = new Blob(chunks, { type: used })
    dgLoopSegment() // 立刻开下一段录音；本段转写并行进行
    if (blob.size > 4000) dgTranscribe(blob, used) // 太小≈纯静音，不浪费请求
  }
  try { rec.start() } catch { active = false; notify(); return }
  dgTimer = setTimeout(() => { try { rec.state !== 'inactive' && rec.stop() } catch { /* noop */ } }, DG_SEGMENT_MS)
}

async function startDeepgram() {
  try {
    dgStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
  } catch { return false }
  engine = 'deepgram'
  active = true
  notify()
  dgLoopSegment()
  return true
}

// ── 公共控制 ────────────────────────────────────────────────────────────────
export function startNotes(lang = 'zh-CN', name = '') {
  if (active) return false
  selfName = String(name || '').slice(0, 40)
  curLang = lang
  webFatalErrors = 0
  const pref = preferredEngine()
  const useDg = pref === 'deepgram' || !isSupported()
  if (useDg) {
    if (!deepgramAvailable()) return false
    startDeepgram()
    return true // getUserMedia 异步；失败会经 notify 把 active 置回 false
  }
  engine = 'web'
  const ok = startWeb(lang)
  active = ok
  notify()
  return ok
}

export function stopNotes() {
  active = false
  try { recognition?.stop() } catch { /* noop */ }
  recognition = null
  if (dgTimer) { clearTimeout(dgTimer); dgTimer = null }
  try { dgRecorder && dgRecorder.state !== 'inactive' && dgRecorder.stop() } catch { /* noop */ }
  dgRecorder = null
  try { dgStream?.getTracks().forEach((tk) => tk.stop()) } catch { /* noop */ }
  dgStream = null
  // lineSink 由通话组件管理（连接时设、离房时清），暂停记录不清
  notify()
}

/** 全文：多人时按时间排序、带名字前缀 */
export function getTranscript() {
  const sorted = [...buffer].sort((a, b) => a.t - b.t)
  const multi = new Set(sorted.map((l) => l.name).filter(Boolean)).size > 1
  return sorted
    .map((l) => (multi && l.name ? `${l.name}：${l.text}` : l.name && l.remote ? `${l.name}：${l.text}` : l.text))
    .join('\n')
}

export function hasNotes() { return buffer.length > 0 }

export function clearNotes() { buffer = []; notify() }
