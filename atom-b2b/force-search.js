(() => {
  const FUNCTION_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-search';
  const PUBLISHABLE_KEY = 'sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F';

  const btn = document.getElementById('forceSearchButton');
  const lastSearch = document.getElementById('lastActivitySearch');
  const result = document.getElementById('lastSearchResult');
  const diagnostic = document.getElementById('searchDiagnostic');
  if (!btn) return;

  function showDiagnostic(kind, title, details) {
    if (!diagnostic) return;
    diagnostic.className = `search-diagnostic ${kind}`;
    diagnostic.innerHTML = `<strong>${title}</strong>${details ? `<div>${details}</div>` : ''}`;
  }

  function clearDiagnostic() {
    if (!diagnostic) return;
    diagnostic.className = 'search-diagnostic hidden';
    diagnostic.textContent = '';
  }

  function renderResult(events) {
    if (!Array.isArray(events) || events.length === 0) {
      if (result) result.textContent = 'Новых мероприятий не найдено';
      showDiagnostic('success', 'Поиск выполнен', 'Сервис ответил корректно, но новых мероприятий для добавления не найдено. Новый поиск запускается только вручную кнопкой.');
      return;
    }
    const names = events.map(e => typeof e === 'string' ? e : e.name).filter(Boolean);
    if (result) {
      result.textContent = names.length === 1
        ? `Найдено новое мероприятие: ${names[0]}`
        : `Найдено новых мероприятий: ${names.length} · ${names.join(' · ')}`;
    }
    showDiagnostic('success', 'Поиск выполнен', `Получено новых мероприятий: ${names.length || events.length}. Новый поиск запускается только вручную кнопкой.`);
  }

  function renderError(data, status) {
    if (!result) return;
    const rawMessage = String(data?.message || data?.error || '').trim();

    if (data?.error === 'api_credits_exhausted' || /credits|quota|баланс|кредит/i.test(rawMessage)) {
      result.textContent = 'Основной AI недоступен: закончился лимит API.';
      showDiagnostic('warning', 'AI временно недоступен', 'Причина: исчерпан лимит API. Календарь и ручное добавление продолжают работать. После пополнения баланса запустите новый поиск кнопкой.');
      return;
    }
    if (status === 401 || status === 403) {
      result.textContent = 'Ошибка доступа к сервису поиска.';
      showDiagnostic('error', 'Сервис поиска не авторизован', `HTTP ${status}. Проверьте ключ/права Supabase Edge Function. Автоматических повторных запросов нет.`);
      return;
    }
    if (status === 429) {
      result.textContent = 'Слишком много запросов. Повторите позже.';
      showDiagnostic('warning', 'Достигнут лимит запросов', 'Автоматическая повторная проверка отключена. Когда будете готовы, запустите новый поиск кнопкой «Запустить поиск сейчас».');
      return;
    }
    if (status === 503 || status === 502 || status === 504) {
      result.textContent = 'Сервис поиска временно недоступен.';
      showDiagnostic('warning', `Временная недоступность сервиса · HTTP ${status}`, 'Автоматическая проверка отключена. Календарь и ручное добавление работают. Новый поиск запускается только кнопкой «Запустить поиск сейчас».');
      return;
    }
    if (rawMessage) {
      result.textContent = rawMessage;
      showDiagnostic('error', 'Ошибка поиска', `${rawMessage}${status ? ` · HTTP ${status}` : ''}. Автоматических повторных запросов нет.`);
      return;
    }
    result.textContent = 'Не удалось выполнить поиск.';
    showDiagnostic('error', 'Неизвестная ошибка поиска', status ? `HTTP ${status}. Новый поиск запускается только вручную кнопкой.` : 'Ответ сервиса не содержит описания ошибки. Новый поиск запускается только вручную кнопкой.');
  }

  async function runSearch() {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Поиск…';
    clearDiagnostic();
    if (result) result.textContent = 'Идет принудительный поиск новых мероприятий…';
    showDiagnostic('info', 'Поиск запущен вручную', 'Проверяем сервис поиска и источники мероприятий. После завершения никаких автоматических повторов не будет.');

    try {
      const existingNames = (window.EVENTS || (typeof EVENTS !== 'undefined' ? EVENTS : []))
        .map(e => e && e.name).filter(Boolean);

      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': PUBLISHABLE_KEY,
          'authorization': `Bearer ${PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ existingNames })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        renderError(data, response.status);
        return;
      }

      if (lastSearch && data.searchedAt) lastSearch.textContent = data.searchedAt;
      renderResult(data.newEvents || []);
      localStorage.setItem('atomB2BManualSearch', JSON.stringify({
        searchedAt: data.searchedAt || '',
        newEvents: data.newEvents || []
      }));
    } catch (error) {
      console.error('ATOM forced search failed:', error);
      if (result) result.textContent = 'Нет связи с сервисом поиска.';
      const text = error && error.message ? error.message : 'Сетевая ошибка';
      showDiagnostic('error', 'Не удалось подключиться к поиску', `${text}. Автоматическая проверка отключена. Новый поиск можно запустить только кнопкой.`);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  btn.addEventListener('click', runSearch);

  const cached = JSON.parse(localStorage.getItem('atomB2BManualSearch') || 'null');
  if (cached) {
    if (lastSearch && cached.searchedAt) lastSearch.textContent = cached.searchedAt;
    if (Array.isArray(cached.newEvents)) renderResult(cached.newEvents);
  }
})();
