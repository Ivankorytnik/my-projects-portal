(() => {
  const SCORING = [
    {name:'Доступ к ЛПР',weight:30,desc:'Доля и уровень лиц, принимающих решение: CEO/COO, закупки, fleet, логистика, регионы.'},
    {name:'Соответствие B2B-сегментам АТОМ',weight:25,desc:'Насколько аудитория совпадает с целями: корпоративные парки, такси, логистика, ритейл, девелопмент, госкомпании.'},
    {name:'Потенциал встреч и пилотов',weight:20,desc:'Вероятность получить конкретные встречи, расчеты TCO, тесты, пилоты и закупочный интерес.'},
    {name:'Возможность показать автомобиль',weight:10,desc:'Стенд, тест-драйв, welcome/VIP-зона, официальный автомобиль мероприятия.'},
    {name:'Стратегический / GR-эффект',weight:10,desc:'Регионы, госструктуры, отраслевые ассоциации, федеральные площадки, PR и партнерства.'},
    {name:'Экономика участия',weight:5,desc:'Соотношение затрат, масштаба аудитории и ожидаемой конверсии в B2B-возможности.'}
  ];

  function renderScoring() {
    const root = document.getElementById('scoringMethod');
    if (!root) return;
    root.innerHTML = `
      <div class="scoring-table-wrap">
        <table class="scoring-table">
          <thead><tr><th>Критерий</th><th>Вес</th><th>Как оценивается</th></tr></thead>
          <tbody>${SCORING.map(x=>`<tr><td><strong>${x.name}</strong></td><td>${x.weight}</td><td>${x.desc}</td></tr>`).join('')}</tbody>
          <tfoot><tr><td><strong>Итого</strong></td><td><strong>100</strong></td><td>Финальный скоринг мероприятия = сумма баллов по шести критериям.</td></tr></tfoot>
        </table>
      </div>`;
  }

  renderScoring();
})();
