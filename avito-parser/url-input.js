(() => {
  const input = document.getElementById('sourceUrl');
  const pasteBtn = document.getElementById('pasteUrlBtn');
  const parseBtn = document.getElementById('parseBtn');
  const status = document.getElementById('urlInputStatus');
  if (!input || !parseBtn) return;

  function extractUrl(value) {
    let text = String(value || '').trim();
    if (!text) return '';
    const match = text.match(/https?:\/\/[^\s]+/i);
    if (match) text = match[0];
    text = text.replace(/[)\],;]+$/g, '');
    if (!/^https?:\/\//i.test(text) && /(^|\.)avito\.ru\//i.test(text)) text = 'https://' + text;
    return text;
  }

  function normalizeAvitoUrl(value) {
    const candidate = extractUrl(value);
    if (!candidate) return { ok: false, message: 'Вставьте ссылку из адресной строки Avito.' };
    let url;
    try { url = new URL(candidate); }
    catch { return { ok: false, message: 'Не удалось распознать ссылку.' }; }

    const host = url.hostname.toLowerCase();
    const isAvito = host === 'avito.ru' || host.endsWith('.avito.ru') || host === 'avito.onelink.me';
    if (!isAvito) return { ok: false, message: 'Нужна ссылка Avito.' };

    url.hash = '';
    return { ok: true, url: url.toString() };
  }

  function show(result) {
    if (!status) return;
    if (!input.value.trim()) { status.textContent = ''; status.className = ''; return; }
    status.textContent = result.ok ? 'Ссылка Avito распознана — можно запускать парсинг.' : result.message;
    status.className = result.ok ? 'url-input-ok' : 'url-input-error';
  }

  function normalizeInPlace() {
    const result = normalizeAvitoUrl(input.value);
    if (result.ok) input.value = result.url;
    show(result);
    return result;
  }

  pasteBtn?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text;
      normalizeInPlace();
      input.focus();
    } catch {
      input.focus();
      status.textContent = 'Нажмите Ctrl+V и вставьте ссылку из Avito.';
      status.className = 'url-input-error';
    }
  });

  input.addEventListener('paste', () => setTimeout(normalizeInPlace, 0));
  input.addEventListener('blur', normalizeInPlace);
  input.addEventListener('input', () => {
    if (!input.value.trim() && status) { status.textContent = ''; status.className = ''; }
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const result = normalizeInPlace();
      if (result.ok) parseBtn.click();
    }
  });

  parseBtn.addEventListener('click', e => {
    const result = normalizeInPlace();
    if (!result.ok) {
      e.preventDefault();
      e.stopImmediatePropagation();
      input.focus();
    }
  }, true);
})();
