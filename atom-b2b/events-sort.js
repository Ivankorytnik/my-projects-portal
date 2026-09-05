(() => {
  function compareByNearestDate(a, b) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const da = new Date(a.date + 'T00:00:00');
    const db = new Date(b.date + 'T00:00:00');
    const aFuture = da >= today;
    const bFuture = db >= today;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    if (aFuture && bFuture) return da - db;
    return db - da;
  }

  function compareByScore(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return compareByNearestDate(a, b);
  }

  const originalRenderEvents = renderEvents;

  renderEvents = function () {
    const q = document.getElementById('eventSearch').value.toLowerCase();
    const p = document.getElementById('priorityFilter').value;
    const s = document.getElementById('statusFilter').value;
    const region = regionFilter.value;
    const city = cityFilter.value;
    const year = yearFilter.value;
    const minScore = scoreFilter.value === 'all' ? 0 : Number(scoreFilter.value);
    const sortMode = document.getElementById('sortFilter')?.value || 'date';

    const rows = EVENTS.filter(e =>
      (p === 'all' || e.priority === p) &&
      (s === 'all' || statusOf(e.name) === s) &&
      (region === 'all' || e.region === region) &&
      (city === 'all' || e.city === city) &&
      (year === 'all' || e.date.startsWith(year)) &&
      e.score >= minScore &&
      (`${e.name} ${e.city} ${e.region} ${e.audience}`.toLowerCase().includes(q))
    );

    rows.sort(sortMode === 'score' ? compareByScore : compareByNearestDate);

    document.getElementById('filterResultCount').textContent = `Найдено мероприятий: ${rows.length}`;
    document.getElementById('eventsTable').innerHTML = `
      <div class="event-row header">
        <div>Мероприятие</div><div>Город</div><div>Дата</div><div>Скоринг</div><div>Приоритет</div><div>Этап</div><div>Действия</div>
      </div>` + (rows.length ? rows.map(e => `
      <div class="event-row">
        <div>
          <strong>${e.name}</strong>
          <div class="reminder-meta">${e.region} · ${e.audience}</div>
          <div class="next-action">Следующий шаг: ${STATUS_NEXT[statusOf(e.name)]}</div>
        </div>
        <div class="event-city"><strong>${e.city || '—'}</strong></div>
        <div>${e.dateLabel}</div>
        <div>${e.score}/100</div>
        <div><span class="badge ${e.priority === 'A' ? 'a' : ''}">${e.priority}</span></div>
        <div><select data-status="${encodeURIComponent(e.name)}">${Object.entries(STATUS_LABELS).map(([k, v]) => `<option value="${k}" ${statusOf(e.name) === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="event-actions"><button data-remind="${encodeURIComponent(e.name)}">Напомнить</button></div>
      </div>`).join('') : '<div class="empty-filter">По выбранным фильтрам мероприятий нет.</div>');

    document.querySelectorAll('[data-status]').forEach(el => el.onchange = () => {
      const n = decodeURIComponent(el.dataset.status);
      eventStatus[n] = el.value;
      save();
      renderDashboard();
      renderEvents();
    });
    document.querySelectorAll('[data-remind]').forEach(el => el.onclick = () => openReminder(decodeURIComponent(el.dataset.remind)));
  };

  const sort = document.getElementById('sortFilter');
  if (sort) sort.addEventListener('input', renderEvents);

  const reset = document.getElementById('resetFilters');
  if (reset) {
    const previousReset = reset.onclick;
    reset.onclick = () => {
      if (typeof previousReset === 'function') previousReset();
      if (sort) sort.value = 'date';
      renderEvents();
    };
  }

  renderEvents();
})();
