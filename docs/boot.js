(function () {
  var app = window.__feiyuMount(document.getElementById('app'));
  var initial = (navigator.language || 'zh').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  var button = document.getElementById('lang');
  function sync() {
    var active = app.getLocale();
    button.textContent = active === 'zh' ? 'EN' : '中文';
    document.documentElement.lang = active === 'zh' ? 'zh-CN' : 'en';
  }
  app.setLocale(initial);
  sync();
  button.addEventListener('click', function () {
    app.setLocale(app.getLocale() === 'zh' ? 'en' : 'zh');
    sync();
  });
})();
