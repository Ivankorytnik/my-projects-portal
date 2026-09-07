(() => {
  const SEARCH_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-search';
  const WRITE_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-calendar-write';
  const PUBLISHABLE_KEY = 'sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F';

  const btn = document.getElementById('forceSearchButton');
  const lastSearch = document.getElementById('lastActivitySearch');
  const result = document.getElementById('lastSearchResult');
  const diagnostic = document.getElementById('searchDiagnostic');
  const candidates = document.getElementById('searchCandidates');
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
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderCandidates(events) {
    if (!candidates) return;
    if (!Array.isArray(events) || !events.length) {
      candidates.innerHTML = '';
      return;
    }
    candidates.innerHTML = `<div class="panel" style="margin-top:14px"><div class="panel-head"><div><p class="eyebrow">НАЙДЕНО</p><h2>Новые мероприятия — подтвердите добавление</h2></div></div>${events.map((e,i)=>`<div class="compact-item" style="align-items:flex-start;gap:14px"><div style="flex:1"><strong>${esc(e.name)}</strong><div class="reminder-meta">${esc(e.date)} · ${esc(e.city)} · скоринг ${esc(e.score)}/100</div><div class="reminder-meta" style="margin-top:6px">${esc(e.reason || e.audience || '')}</div>${e.source?`<div class="reminder-meta" style="margin-top:4px">Источник: ${esc(e.source)}</div>`:''}</div><div class="event-actions"><button data-add-candidate="${i}" class="primary">Добавить</button><button data-skip-candidate="${i}">Пропустить</button></div></div>`).join('')}</div>`;
    candidates.querySelectorAll('[data-add-candidate]').forEach(b => b.onclick = () => addCandidate(events[Number(b.dataset.addCandidate)], b));
    candidates.querySelectorAll('[data-skip-candidate]').forEach(b => b.onclick = () => {
      b.closest('.compact-item')?.remove();
      if (!candidates.querySelector('.compact-item')) candidates.innerHTML = '';
    });
  }

  async function addCandidate(event, button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Добавление…';
    try {
      const response = await fetch(WRITE_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'apikey': PUBLISHABLE_KEY,
          'authorization': `Bearer ${PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ event: {
          ...event,
          priority: Number(event.score) >= 85 ? 'A' : 'B',
          dateStatus: 'Требует проверки',
          next: 'Проверить организатора и определить формат участия'
        }})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || data.error || `HTTP ${response.status}`);
      if (data.duplicate || data.skipped) {
        showDiagnostic('warning', 'Мероприятие уже есть в Google Sheets', `${event.name} не добавлено повторно.`);
      } else {
        showDiagnostic('success', 'Добавлено в Google Sheets', `${event.name} записано в основную таблицу. Перечитываем календарь…`);
      }
      button.closest('.compact-item')?.remove();
      if (typeof window.syncAtomGoogleSheets === 'function') {
        setTimeout(() => window.syncAtomGoogleSheets(), 500);
      }
      if (!candidates.querySelector('.compact-item')) candidates.innerHTML = '';
    } catch (error) {
      button.disabled = false;
      button.textContent = original;
      showDiagnostic('error', 'Не удалось записать в Google Sheets', error?.message || 'Неизвестная ошибка записи.');
    }
  }

  function renderResult(events) {
    if (!Array.isArray(events) || events.length === 0) {
      if (result) result.textContent = 'Новых мероприятий не найдено';
      renderCandidates([]);
      showDiagnostic('success', 'Поиск выполнен', 'Новых мероприятий для добавления не найдено. Новый поиск запускается только вручную кнопкой.');
      return;
    }
    const names = events.map(e => typeof e === 'string' ? e : e.name).filter(Boolean);
    if (result) result.textContent = `Найдено новых мероприятий: ${events.length}`;
    renderCandidates(events);
    showDiagnostic('success', 'Поиск выполнен', `Найдено ${events.length}. Ничего не добавлено автоматически — выберите «Добавить» у нужных мероприятий.`);
  }

  function renderError(data, status) {
    if (!result) return;
    const rawMessage = String(data?.message || data?.error || '').trim();
    renderCandidates([]);
    if (data?.error === 'api_credits_exhausted' || /credits|quota|баланс|кредит/i.test(rawMessage)) {
      result.textContent = 'Основной AI недоступен: закончился лимит API.';
      showDiagnostic('warning', 'AI временно недоступен', 'После пополнения баланса запустите новый поиск кнопкой.');
      return;
    }
    if (status === 401 || status === 403) {
      result.textContent = 'Ошибка доступа к сервису поиска.';
      showDiagnostic('error', 'Сервис поиска не авторизован', `HTTP ${status}.`);
      return;
    }
    if (status === 429) {
      result.textContent = 'Слишком много запросов. Повторите позже.';
      showDiagnostic('warning', 'Достигнут лимит запросов', 'Автоматических повторных запросов нет.');
      return;
    }
    if (status === 503 || status === 502 || status === 504) {
      result.textContent = 'Сервис поиска временно недоступен.';
      showDiagnostic('warning', `Временная недоступность сервиса · HTTP ${status}`, 'Новый поиск запускается только кнопкой «Запустить поиск сейчас».');
      return;
    }
    result.textContent = rawMessage || 'Не удалось выполнить поиск.';
    showDiagnostic('error', 'Ошибка поиска', `${rawMessage || 'Неизвестная ошибка'}${status ? ` · HTTP ${status}` : ''}`);
  }

  async function runSearch() {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Поиск…';
    clearDiagnostic();
    renderCandidates([]);
    if (result) result.textContent = 'Идет поиск новых мероприятий…';
    showDiagnostic('info', 'Поиск запущен вручную', 'После поиска вы сами подтверждаете, что записать в Google Sheets.');
    try {
      const existingNames = (window.EVENTS || (typeof EVENTS !== 'undefined' ? EVENTS : [])).map(e => e && e.name).filter(Boolean);
      const response = await fetch(SEARCH_URL, {
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
      const events = data.newEvents || [];
      renderResult(events);
      localStorage.setItem('atomB2BManualSearch', JSON.stringify({ searchedAt: data.searchedAt || '', newEvents: events }));
    } catch (error) {
      console.error('ATOM forced search failed:', error);
      if (result) result.textContent = 'Нет связи с сервисом поиска.';
      showDiagnostic('error', 'Не удалось подключиться к поиску', `${error?.message || 'Сетевая ошибка'}.`);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  btn.addEventListener('click', runSearch);

  const cached = JSON.parse(localStorage.getItem('atomB2BManualSearch') || 'null');
  if (cached) {
    if (lastSearch && cached.searchedAt) lastSearch.textContent = cached.searchedAt;
    if (Array.isArray(cached.newEvents)) renderCandidates(cached.newEvents);
  }
})();
