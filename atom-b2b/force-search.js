(() => {
  const FUNCTION_URL = 'https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-search';
  const PUBLISHABLE_KEY = 'sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F';

  const btn = document.getElementById('forceSearchButton');
  const lastSearch = document.getElementById('lastActivitySearch');
  const result = document.getElementById('lastSearchResult');
  if (!btn) return;

  function renderResult(events) {
    if (!Array.isArray(events) || events.length === 0) {
      if (result) result.textContent = 'Новых мероприятий не найдено';
      return;
    }
    const names = events.map(e => typeof e === 'string' ? e : e.name).filter(Boolean);
    if (result) {
      result.textContent = names.length === 1
        ? `Найдено новое мероприятие: ${names[0]}`
        : `Найдено новых мероприятий: ${names.length} · ${names.join(' · ')}`;
    }
  }

  async function runSearch() {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Поиск…';
    if (result) result.textContent = 'Идет принудительный поиск новых мероприятий…';

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
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);

      if (lastSearch && data.searchedAt) lastSearch.textContent = data.searchedAt;
      renderResult(data.newEvents || []);
      localStorage.setItem('atomB2BManualSearch', JSON.stringify({
        searchedAt: data.searchedAt || '',
        newEvents: data.newEvents || []
      }));
    } catch (error) {
      console.error('ATOM forced search failed:', error);
      if (result) result.textContent = 'Ошибка поиска. Попробуйте еще раз.';
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
