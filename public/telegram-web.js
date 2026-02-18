// Telegram Web App SDK stub for local development
window.Telegram = window.Telegram || {};
window.Telegram.WebApp = window.Telegram.WebApp || {
  ready: function() {},
  expand: function() {},
  close: function() {},
  initData: '',
  initDataUnsafe: {},
  platform: 'unknown',
  colorScheme: 'dark',
  themeParams: {},
  isExpanded: true,
  viewportHeight: window.innerHeight,
  viewportStableHeight: window.innerHeight,
  MainButton: {
    text: '',
    isVisible: false,
    show: function() { this.isVisible = true; },
    hide: function() { this.isVisible = false; },
    onClick: function() {},
  },
};
console.log('[DEV] Telegram Web App stub loaded');
