(() => {
  function renderRecommendationsTable() {
    const root = document.getElementById('recommendations');
    if (!root || typeof EVENTS === 'undefined' || typeof statusOf !== 'function' || typeof STATUS_NEXT === 'undefined') return;

    const future = EVENTS
      .filter(e => daysUntil(e.date) >= 0)
      .filter(e => statusOf(e.name) !== 'rejected' && statusOf(e.name) !== 'summary_uploaded')
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    root.innerHTML = `
      <div class="recommendations-table-wrap">
        <table class="recommendations-table">
          <thead>
            <tr>
              <th class="col-num">№</th>
              <th>Мероприятие</th>
              <th class="col-date">Дата</th>
              <th>Что делать сейчас</th>
              <th>Value</th>
              <th>Для АТОМ</th>
              <th class="col-score">Скоринг</th>
            </tr>
          </thead>
          <tbody>
            ${future.map((e, i) => `
              <tr>
                <td class="col-num">${i + 1}</td>
                <td><strong>${e.name}</strong></td>
                <td class="col-date"><strong>${e.dateLabel || fmtDate(e.date)}</strong></td>
                <td>${STATUS_NEXT[statusOf(e.name)]}</td>
                <td>${e.value}</td>
                <td>${e.atom}</td>
                <td class="col-score"><strong>${e.score}/100</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  const originalRenderDashboard = renderDashboard;
  renderDashboard = function () {
    originalRenderDashboard();
    renderRecommendationsTable();
  };

  renderRecommendationsTable();
})();
