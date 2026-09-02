'use strict';
(() => {
  function addLink() {
    const actions = document.querySelector('.top-actions');
    if (!actions || document.querySelector('.pdn-security-link')) return;
    const a = document.createElement('a');
    a.href = './security.html';
    a.className = 'btn ghost pdn-security-link';
    a.textContent = 'Безопасность ПДн';
    a.setAttribute('aria-label','Открыть описание безопасности персональных данных');
    actions.insertBefore(a, document.querySelector('#lockBtn'));

    const banner = document.querySelector('.security-banner > div');
    if (banner && !banner.querySelector('.pdn-more-link')) {
      const more = document.createElement('a');
      more.href = './security.html';
      more.className = 'pdn-more-link';
      more.textContent = 'Почему это безопасно →';
      more.style.cssText = 'display:inline-block;margin-top:8px;color:#08776f;font-weight:700;text-decoration:none;font-size:13px';
      banner.appendChild(more);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',addLink);
  else addLink();
})();
