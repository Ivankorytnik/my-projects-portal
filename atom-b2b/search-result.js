(() => {
  fetch('activity-status.json?v=' + Date.now(), {cache: 'no-store'})
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      const el = document.getElementById('lastSearchResult');
      if (!el) return;
      const list = Array.isArray(data.newEvents) ? data.newEvents.filter(Boolean) : [];
      if (list.length === 1) el.textContent = 'Найдено новое мероприятие: ' + list[0];
      else if (list.length > 1) el.textContent = 'Найдено новых мероприятий: ' + list.length + ' · ' + list.join(' · ');
      else el.textContent = 'Новых мероприятий не найдено';
    })
    .catch(() => {});
})();
