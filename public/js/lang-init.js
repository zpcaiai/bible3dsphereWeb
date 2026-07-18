/* 语言：在渲染前依据用户偏好（app-lang）修正 <html lang>，利于无障碍与翻译。
   由 index.html 通过 <script src> 引入（外置以便收紧 CSP：script-src 去除 'unsafe-inline'）。 */
(function () {
  try {
    var saved = window.localStorage.getItem('app-lang');
    var lang = saved || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    if (lang === 'en') {
      var title = 'Soul Planet · Spiritual Awareness and Companionship';
      var description = 'A spiritual companionship PWA for daily devotion, prayer, Bible reading, mission maps, and Christian community.';
      document.title = title;
      var values = {
        'meta[name="description"]': description,
        'meta[property="og:site_name"]': 'Soul Planet',
        'meta[property="og:title"]': title,
        'meta[property="og:description"]': description,
        'meta[property="og:locale"]': 'en_US',
        'meta[name="twitter:title"]': title,
        'meta[name="twitter:description"]': description
      };
      Object.keys(values).forEach(function (selector) {
        var element = document.querySelector(selector);
        if (element) element.setAttribute('content', values[selector]);
      });
      var manifest = document.querySelector('link[rel="manifest"]');
      if (manifest) manifest.setAttribute('href', '/manifest-en.webmanifest');
    }
  } catch (e) { /* ignore */ }
})();
