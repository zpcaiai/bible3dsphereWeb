/* 语言：在渲染前依据用户偏好（app-lang）修正 <html lang>，利于无障碍与翻译。
   由 index.html 通过 <script src> 引入（外置以便收紧 CSP：script-src 去除 'unsafe-inline'）。 */
(function () {
  try {
    var saved = window.localStorage.getItem('app-lang');
    var lang = saved || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  } catch (e) { /* ignore */ }
})();
