(() => {
  'use strict';
  const core = document.createElement('script');
  core.src = './app-core-v160.js?build=v1.6.0-prompter-link';
  core.async = false;
  document.head.appendChild(core);
})();
