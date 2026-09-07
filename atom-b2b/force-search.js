(() => {
  const FUNCTION_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-search';
  const PUBLISHABLE_KEY = 'sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F';
  const RETRY_MS = 5 * 60 * 1000;

  const btn = document.getElementById('forceSearchButton');
  const lastSearch = document.getElementById('lastActivitySearch');
  const result = document.getElementById('lastSearchResult');
  const diagnostic = document.getElementById('searchDiagnostic');
  if (!btn) return;

  let retryTimer = null;
  let retryTick = null;
  let retryAt = 0;
  let recovering = false;

  const pad = n => String(n).padStart(2, '0');
  function formatLocalTime(ts = Date.now()) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

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

  function clearRetry() {
    if (retryTimer) clearTimeout(retryTimer);
    if (retryTick) clearInterval(retryTick);
    retryTimer = null;
    retryTick = null;
    retryAt = 0;
  }

  function renderCountdown(status = 503) {
    if (!retryAt) return;
    const left = Math.max(0, retryAt - Date.now());
    const totalSec = Math.ceil(left / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    showDiagnostic(
      'warning',
      `Временная недоступность сервиса · HTTP ${status}`,
      `Календарь и ручное добавление работают. Следующая автоматическая проверка: через ${min}:${pad(sec)} · в ${formatLocalTime(retryAt)}.`
    );
  }

  function scheduleRetry(status = 503) {
    clearRetry();
    retryAt = Date.now() + RETRY_MS;
    renderCountdown(status);
    retryTick = setInterval(() => renderCountdown(status), 1000);
    retryTimer = setTimeout(() => {
      clearRetry();
      recovering = true;
      runSearch(true);
    }, RETRY_MS);
  }

  function renderResult(events, wasRecovery = false) {
    if (!Array.isArray(events) || events.length === 0) {
      if (result) result.textContent = 'Новых мероприятий не найдено';
      const title = wasRecovery ? `Сервис восстановлен в ${formatLocalTime()}` : 'Поиск выполнен';
      showDiagnostic('success', title, 'Сервис ответил корректно, но новых мероприятий для добавления не найдено.');
      return;
    }
    const names = events.map(e => typeof e === 'string' ? e : e.name).filter(Boolean);
    if (result) {
      result.textContent = names.length === 1
        ? `Найдено новое мероприятие: ${names[0]}`
        : `Найдено новых мероприятий: ${names.length} · ${names.join(' · ')}`;
    }
    const title = wasRecovery ? `Сервис восстановлен в ${formatLocalTime()}` : 'Поиск выполнен';
    showDiagnostic('success', title, `Получено новых мероприятий: ${names.length || events.length}.`);
  }

  function renderError(data, status) {
    if (!result) return;
    const rawMessage = String(data?.message || data?.error || '').trim();

    if (data?.error === 'api_credits_exhausted' || /credits|quota|баланс|кредит/i.test(rawMessage)) {
      clearRetry();
      result.textContent = 'Основной AI недоступен: закончился лимит API.';
      showDiagnostic('warning', 'AI временно недоступен', 'Причина: исчерпан лимит API. Календарь и ручное добавление продолжают работать. Пополните API-баланс и запустите поиск повторно.');
      return;
    }
    if (status === 401 || status === 403) {
      clearRetry();
      result.textContent = 'Ошибка доступа к сервису поиска.';
      showDiagnostic('error', 'Сервис поиска не авторизован', `HTTP ${status}. Проверьте ключ/права Supabase Edge Function.`);
      return;
    }
    if (status === 429) {
      result.textContent = 'Слишком много запросов. Повторим автоматически.';
      scheduleRetry(status);
      return;
    }
    if (status === 503 || status === 502 || status === 504) {
      result.textContent = 'Сервис поиска временно недоступен. Автопроверка включена.';
      scheduleRetry(status);
      return;
    }
    clearRetry();
    if (rawMessage) {
      result.textContent = rawMessage;
      showDiagnostic('error', 'Ошибка поиска', `${rawMessage}${status ? ` · HTTP ${status}` : ''}`);
      return;
    }
    result.textContent = 'Не удалось выполнить поиск.';
    showDiagnostic('error', 'Неизвестная ошибка поиска', status ? `HTTP ${status}. Попробуйте еще раз.` : 'Ответ сервиса не содержит описания ошибки.');
  }

  async function runSearch(isAutoRetry = false) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = isAutoRetry ? 'Автопроверка…' : 'Поиск…';
    if (!isAutoRetry) clearRetry();
    clearDiagnostic();
    if (result) result.textContent = isAutoRetry ? 'Автоматическая проверка доступности сервиса…' : 'Идет принудительный поиск новых мероприятий…';
    showDiagnostic('info', isAutoRetry ? 'Автоматическая проверка' : 'Поиск запущен', 'Проверяем сервис поиска и источники мероприятий.');

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

      clearRetry();
      if (lastSearch && data.searchedAt) lastSearch.textContent = data.searchedAt;
      renderResult(data.newEvents || [], isAutoRetry || recovering);
      recovering = false;
      localStorage.setItem('atomB2BManualSearch', JSON.stringify({
        searchedAt: data.searchedAt || '',
        newEvents: data.newEvents || []
      }));
    } catch (error) {
      console.error('ATOM forced search failed:', error);
      if (result) result.textContent = 'Нет связи с сервисом поиска. Автопроверка включена.';
      scheduleRetry(0);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  btn.addEventListener('click', () => runSearch(false));

  const cached = JSON.parse(localStorage.getItem('atomB2BManualSearch') || 'null');
  if (cached) {
    if (lastSearch && cached.searchedAt) lastSearch.textContent = cached.searchedAt;
    if (Array.isArray(cached.newEvents)) renderResult(cached.newEvents);
  }
})();
