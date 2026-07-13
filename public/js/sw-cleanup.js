/* 清理旧版 Service Worker（仅在检测到旧版本时执行一次）。
   由 index.html 通过 <script src> 引入（外置以便收紧 CSP：script-src 去除 'unsafe-inline'）。 */
(function () {
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  var CACHE_KEY = 'emotion-sphere-cache-cleared-v1';
  if (lsGet(CACHE_KEY)) return; // 已清理过，不再执行
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      var hasOldSW = regs.some(function (r) {
        return r.scope && r.scope.includes(window.location.hostname) &&
               r.active && !r.active.scriptURL.includes('emotion-sphere-2025');
      });
      if (hasOldSW) {
        regs.forEach(function (r) {
          if (r.scope && r.scope.includes(window.location.hostname)) { r.unregister(); }
        });
        if ('caches' in window) {
          caches.keys().then(function (names) {
            names.forEach(function (name) { caches.delete(name); });
          });
        }
        lsSet(CACHE_KEY, 'true');
        window.location.reload(); // 软刷新一次以应用清理
      }
    }).catch(function () { /* ignore */ });
  }
  lsSet(CACHE_KEY, 'true'); // 标记已执行
})();
