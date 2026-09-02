'use strict';

(() => {
  const FIELD_SELECTOR = '[data-f]';
  const BLOCKED_ACTIONS = new Set(['saveDocsBtn','downloadZipBtn','tdPrintBtn']);
  let mounted = false;

  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function labelFor(el) {
    const label = el.closest('.field')?.querySelector('label');
    return label?.textContent?.replace(/\s*\*\s*$/, '').trim() || el.dataset.f || 'Поле';
  }

  function isEmpty(el) {
    return !String(el.value ?? '').trim();
  }

  function mark(el) {
    const field = el.closest('.field');
    if (!field) return;
    field.classList.add('required-field');
    el.required = true;
    const empty = isEmpty(el);
    field.classList.toggle('required-empty', empty);
    el.classList.toggle('required-empty-control', empty);
    el.setAttribute('aria-required', 'true');
    el.setAttribute('aria-invalid', empty ? 'true' : 'false');
  }

  function missingFields() {
    const items = $$(FIELD_SELECTOR);
    items.forEach(mark);
    return items.filter(isEmpty);
  }

  function setRequiredBlocked(button, blocked) {
    if (!button) return;
    if (blocked) {
      button.disabled = true;
      button.dataset.requiredDisabled = '1';
      button.title = 'Сначала заполните все обязательные поля';
    } else if (button.dataset.requiredDisabled === '1') {
      button.disabled = false;
      delete button.dataset.requiredDisabled;
      button.removeAttribute('title');
    }
  }

  function update() {
    const missing = missingFields();
    const blocked = missing.length > 0;

    setRequiredBlocked(document.getElementById('saveDocsBtn'), blocked);
    setRequiredBlocked(document.getElementById('downloadZipBtn'), blocked);

    const badge = document.getElementById('readinessBadge');
    const status = document.getElementById('validationStatus');

    if (blocked) {
      if (badge) {
        badge.textContent = 'Не готово';
        badge.classList.remove('ready');
      }
      if (status) {
        const names = missing.map(labelFor);
        status.className = 'status warn required-summary';
        status.textContent = `Обязательные поля: не заполнено ${missing.length}. ${names.slice(0, 7).join(', ')}${names.length > 7 ? '…' : ''}`;
      }
    } else if (typeof window.render === 'function') {
      window.render();
    }

    return missing;
  }

  function focusFirstMissing() {
    const first = update()[0];
    if (!first) return false;
    first.scrollIntoView({behavior:'smooth', block:'center'});
    setTimeout(() => first.focus({preventScroll:true}), 250);
    return true;
  }

  function interceptBlockedAction(event) {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target || !BLOCKED_ACTIONS.has(target.id)) return;
    const missing = update();
    if (!missing.length) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    focusFirstMissing();
  }

  function boot() {
    if (mounted) return;
    mounted = true;
    $$(FIELD_SELECTOR).forEach(el => {
      mark(el);
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });
    document.addEventListener('click', interceptBlockedAction, true);
    document.getElementById('clearBtn')?.addEventListener('click', () => setTimeout(update, 0));
    update();
    setInterval(update, 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
