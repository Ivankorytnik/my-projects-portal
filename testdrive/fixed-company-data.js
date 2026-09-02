'use strict';

(() => {
  const FIXED = {
    companyRepRole: 'Менеджера по развитию бизнеса',
    companyRepName: 'Чибрикина Андрея Владимировича',
    companyRepPoaNo: 'ОП0001',
    companyRepPoaDate: '2026-06-24'
  };

  function applyFixedCompanyData() {
    Object.entries(FIXED).forEach(([name, value]) => {
      const el = document.querySelector(`[data-f="${name}"]`);
      if (!el) return;
      el.value = value;
      el.disabled = true;
      el.setAttribute('aria-readonly', 'true');
      el.title = 'Фиксированные данные. Не изменяются менеджером.';
      const label = el.closest('.field')?.querySelector('label');
      if (label && !label.dataset.fixedMarked) {
        label.textContent = `${label.textContent} · фиксировано`;
        label.dataset.fixedMarked = '1';
      }
      el.dispatchEvent(new Event('input', {bubbles:true}));
      el.dispatchEvent(new Event('change', {bubbles:true}));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixedCompanyData, {once:true});
  } else {
    applyFixedCompanyData();
  }
})();
