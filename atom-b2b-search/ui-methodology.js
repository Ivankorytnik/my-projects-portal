(function(){
  function splitEmailColumn(){
    const table=document.getElementById('companiesTable');
    if(!table)return;
    const rows=[...table.querySelectorAll('.company-row')];
    rows.forEach((row,index)=>{
      if(row.dataset.emailSplit==='1')return;
      const children=[...row.children];
      if(children.length<7)return;
      if(index===0 || row.classList.contains('header')){
        children[2].textContent='Телефон';
        const emailHead=document.createElement('div');
        emailHead.textContent='E-mail';
        row.insertBefore(emailHead,children[3]);
      }else{
        const contactCell=children[2];
        const contact=contactCell.querySelector('.contact-cell');
        const emailCell=document.createElement('div');
        emailCell.className='email-cell';
        if(contact){
          const inner=[...contact.children];
          const emailNode=inner[1];
          if(emailNode){ emailCell.appendChild(emailNode); }
          else emailCell.innerHTML='<span class="muted">—</span>';
        }else emailCell.innerHTML='<span class="muted">—</span>';
        row.insertBefore(emailCell,children[3]);
      }
      row.dataset.emailSplit='1';
    });
  }

  function wrapRenderSearch(){
    if(typeof window.renderSearch!=='function')return;
    const original=window.renderSearch;
    window.renderSearch=function(){ original(); splitEmailColumn(); };
    window.renderSearch();
  }

  function makeModal(){
    if(document.getElementById('methodologyModal'))return;
    const modal=document.createElement('div');
    modal.id='methodologyModal';
    modal.className='modal hidden';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="modal-card modal-large methodology-card"><div class="modal-head"><div><p class="eyebrow">МЕТОДИКА</p><h2 id="methodologyTitle">Как считается</h2></div><button type="button" id="closeMethodologyModal" class="icon-btn">×</button></div><div id="methodologyBody"></div></div>`;
    document.body.appendChild(modal);
    const close=()=>{modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');};
    document.getElementById('closeMethodologyModal').onclick=close;
    modal.onclick=e=>{if(e.target===modal)close();};
  }

  const forecastHtml=`
    <div class="method-intro">Прогноз АТОМ — это <strong>аналитическая оценка потенциала закупки на 12–24 месяца</strong> после успешного пилота. Это не подтверждённый план закупки компании.</div>
    <div class="method-note"><strong>Что именно оцениваем:</strong> сначала определяем текущий собственный или контролируемый легковой парк компании, затем выделяем из него автомобили, реально подходящие под АТОМ, и только после этого считаем возможный объём закупки.</div>

    <div class="method-formula">Прогноз АТОМ = адресуемый собственный/контролируемый легковой парк × EV-fit × доля машин в цикле обновления × реалистичная доля АТОМ</div>

    <h3 class="method-subtitle">1. Откуда знаем, сколько автомобилей сейчас в парке</h3>
    <div class="method-warning"><strong>Важно:</strong> точное количество собственных автомобилей публично раскрывается редко. Поэтому в базе используется диапазон <strong>Парк min–max</strong>. Если прямого подтверждения нет, это аналитическая оценка, а не установленный факт.</div>
    <div class="method-grid">
      <article><strong>A. Прямое раскрытие</strong><p>Годовой отчёт, ESG/отчёт об устойчивом развитии, презентация компании, официальный пресс-релиз, тендер или закупочная документация, где прямо указано количество автомобилей. Это самый сильный источник.</p></article>
      <article><strong>B. Тендеры на ОСАГО / КАСКО</strong><p>В закупке страхования часто указывается количество транспортных средств или прикладывается перечень машин. Например, лот на страхование 740 легковых автомобилей даёт сильное подтверждение масштаба парка.</p></article>
      <article><strong>C. Закупки топлива</strong><p>Если известен годовой объём топлива, парк можно оценить через формулу: литры топлива ÷ средний расход ÷ средний годовой пробег. Полученный диапазон обязательно сверяется с другими признаками.</p></article>
      <article><strong>D. ТО, ремонт, шины, телематика</strong><p>Количество комплектов шин, лицензий телематики, топливных карт, машин в договоре на ТО/ремонт или шиномонтаж часто позволяет восстановить масштаб парка.</p></article>
      <article><strong>E. Лизинг и закупка автомобилей</strong><p>Смотрим объём регулярных закупок за несколько лет. Например, если компания ежегодно заменяет 120–150 машин при цикле владения 4–5 лет, общий легковой парк может быть порядка 500–750 автомобилей.</p></article>
      <article><strong>F. Масштаб бизнеса</strong><p>Число филиалов, объектов, инженеров, региональных менеджеров, медпредставителей и других разъездных сотрудников используется как контроль здравого смысла, а не как самостоятельное доказательство.</p></article>
    </div>

    <h3 class="method-subtitle">2. Как получаем Парк min–max</h3>
    <div class="method-steps">
      <div><strong>Шаг 1.</strong><span>Собираем все доступные признаки парка и переводим их в количество машин.</span></div>
      <div><strong>Шаг 2.</strong><span>Отделяем собственные/лизинговые корпоративные автомобили от партнёрского транспорта.</span></div>
      <div><strong>Шаг 3.</strong><span>Исключаем грузовики, автобусы, спецтехнику, карьерную и внедорожную технику, такси и каршеринг.</span></div>
      <div><strong>Шаг 4.</strong><span><b>Парк min</b> — консервативное количество автомобилей, которое можно обосновать наиболее надёжно.</span></div>
      <div><strong>Шаг 5.</strong><span><b>Парк max</b> — разумная верхняя граница с учётом филиалов и подразделений, но без механического суммирования всей техники группы.</span></div>
    </div>

    <h3 class="method-subtitle">3. Достоверность оценки парка</h3>
    <div class="method-scale"><div><strong>A · высокая</strong><span>Есть прямое количество машин или свежая закупочная документация, позволяющая практически точно его восстановить.</span></div><div><strong>B · средняя</strong><span>Есть 2–3 независимых косвенных признака: страхование, топливо, ТО, лизинг, телематика, регулярные закупки.</span></div><div><strong>C · оценка</strong><span>Прямых данных нет; диапазон построен по масштабу бизнеса, типу сотрудников и аналогам. Такое значение обязательно нужно уточнять у компании.</span></div></div>

    <h3 class="method-subtitle">4. Что такое адресуемый парк для АТОМ</h3>
    <div class="method-note"><strong>Общий автопарк ≠ парк для АТОМ.</strong> Из общего количества оставляем только легковые служебные автомобили с подходящим сценарием: городские инженерные бригады, региональные менеджеры, медпредставители, административный транспорт, офис–объект и другие маршруты с предсказуемым ежедневным пробегом и возможностью зарядки.</div>

    <h3 class="method-subtitle">5. Как из адресуемого парка получается прогноз АТОМ</h3>
    <div class="method-grid">
      <article><strong>EV-fit маршрутов</strong><p>Оцениваем долю машин, которые ездят преимущественно по городу, имеют регулярный пробег, возврат на базу и не требуют тяжёлого бездорожья или сверхдальних поездок.</p></article>
      <article><strong>Зарядная готовность</strong><p>Собственные парковки, офисы, базы, депо и доступная электрическая мощность увеличивают реалистичный объём внедрения.</p></article>
      <article><strong>Цикл обновления парка</strong><p>Не предполагаем замену всего парка сразу. При типичном цикле владения 3–5 лет в ближайшие 12–24 месяца в закупку попадёт только часть машин.</p></article>
      <article><strong>Доля АТОМ</strong><p>Даже среди подходящих машин часть останется ДВС/гибридами или будет закуплена у конкурентов. Поэтому в прогноз закладывается реалистичная доля АТОМ, а не 100% замещение.</p></article>
    </div>

    <div class="method-example"><strong>Пример расчёта.</strong> Оценочный собственный легковой парк компании — 1 000–1 500 автомобилей. Из них около 60% подходят под городской EV-сценарий → 600–900 машин. В ближайшие 24 месяца обновится 35–45% → примерно 210–405 машин. Если после успешного пилота АТОМ сможет занять 30–45% этой закупки, прогноз составит примерно <strong>60–180 АТОМ</strong>.</div>

    <h3 class="method-subtitle">6. Какие данные должны подтверждать расчёт по каждой компании</h3>
    <div class="method-checklist"><span>Источник оценки парка</span><span>Дата/год источника</span><span>Парк min</span><span>Парк max</span><span>Достоверность A/B/C</span><span>Что исключено из общего парка</span><span>Адресуемая доля</span><span>Комментарий к прогнозу АТОМ</span></div>

    <div class="method-warning bottom"><strong>Для текущей базы:</strong> многие значения Парк min–max являются аналитическими оценками. Их нельзя представлять как подтверждённое количество собственных автомобилей компании. Первый квалификационный вопрос клиенту: «Сколько легковых служебных автомобилей находится в собственном или лизинговом парке и сколько из них обычно обновляется ежегодно?»</div>`;

  const scoreHtml=`
    <div class="method-intro">Скоринг показывает, <strong>насколько компания привлекательна для B2B-продажи АТОМ</strong>. Максимум — 100 баллов.</div>
    <div class="score-method-list">
      <div><span>Масштаб адресуемого парка</span><strong>до 20</strong></div>
      <div><span>Пригодность маршрутов для EV</span><strong>до 20</strong></div>
      <div><span>Готовность зарядной инфраструктуры</span><strong>до 15</strong></div>
      <div><span>Зрелость и централизация закупок</span><strong>до 15</strong></div>
      <div><span>Доступность ЛПР и закупочного входа</span><strong>до 10</strong></div>
      <div><span>Вероятность запуска пилота</span><strong>до 10</strong></div>
      <div><span>Потенциал масштабирования после пилота</span><strong>до 10</strong></div>
    </div>
    <div class="method-scale"><div><strong>90–100 · A</strong><span>Идти в работу в первую очередь</span></div><div><strong>80–89 · B</strong><span>Сильная цель, требуется уточнение отдельных факторов</span></div><div><strong>до 79 · C</strong><span>Нужна дополнительная квалификация перед активным выходом</span></div></div>
    <div class="method-note">Скоринг — приоритизация, а не вероятность сделки. Он пересматривается, когда появляются свежие данные о парке, ЛПР, закупках, маршрутах или зарядной инфраструктуре.</div>`;

  function openMethod(type){
    makeModal();
    const modal=document.getElementById('methodologyModal');
    document.getElementById('methodologyTitle').textContent=type==='forecast'?'Как считается прогноз АТОМ':'Как считается скоринг';
    document.getElementById('methodologyBody').innerHTML=type==='forecast'?forecastHtml:scoreHtml;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
  }

  function addMenuButtons(){
    const nav=document.querySelector('.sidebar nav');
    if(!nav || document.getElementById('forecastMethodButton'))return;
    const sep=document.createElement('div');sep.className='nav-method-separator';
    const forecast=document.createElement('button');forecast.id='forecastMethodButton';forecast.className='nav-btn nav-info-btn';forecast.textContent='Как считается прогноз';
    const score=document.createElement('button');score.id='scoreMethodButton';score.className='nav-btn nav-info-btn';score.textContent='Как считается скоринг';
    forecast.onclick=()=>openMethod('forecast');score.onclick=()=>openMethod('score');
    nav.append(sep,forecast,score);
  }

  function styles(){
    const s=document.createElement('style');
    s.textContent=`
      .company-row.lpr-grid{grid-template-columns:1.12fr 1.02fr .78fr 1fr .62fr .46fr .58fr .44fr!important}
      .email-cell{font-size:12px;line-height:1.35;min-width:0;overflow-wrap:anywhere}.email-cell a{color:inherit;text-decoration:none}.email-cell a:hover{text-decoration:underline}
      .nav-method-separator{height:1px;background:rgba(255,255,255,.09);margin:10px 10px}.nav-info-btn{font-size:12px!important;opacity:.9}
      .methodology-card{max-width:980px;max-height:90vh;overflow:auto}.method-intro{font-size:15px;line-height:1.55;margin-bottom:18px}.method-formula{padding:14px 16px;border-radius:10px;background:#f3f6e9;font-weight:800;margin-bottom:18px}.method-subtitle{font-size:16px;margin:22px 0 10px}.method-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.method-grid article{padding:14px;border:1px solid #e5e7ea;border-radius:10px}.method-grid p{margin:7px 0 0;font-size:13px;line-height:1.5;color:#5f646b}.method-note,.method-warning,.method-example{margin-top:14px;padding:13px 15px;border-radius:9px;font-size:13px;line-height:1.55}.method-note{border-left:3px solid #a8d23b;background:#f8faf5}.method-warning{border-left:3px solid #e2a11f;background:#fff9ed}.method-warning.bottom{margin-top:20px}.method-example{border-left:3px solid #4d79d8;background:#f5f8ff}.method-steps{display:grid;gap:7px}.method-steps>div{display:grid;grid-template-columns:85px 1fr;gap:10px;padding:10px 12px;background:#f7f8f8;border-radius:8px;font-size:13px}.method-checklist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.method-checklist span{padding:9px 11px;background:#f7f8f8;border-radius:8px;font-size:13px}.score-method-list{border:1px solid #e5e7ea;border-radius:10px;overflow:hidden}.score-method-list>div{display:flex;justify-content:space-between;gap:18px;padding:11px 14px;border-bottom:1px solid #eceef0}.score-method-list>div:last-child{border-bottom:0}.score-method-list span{font-size:13px}.score-method-list strong{white-space:nowrap}.method-scale{display:grid;gap:8px;margin-top:16px}.method-scale>div{display:grid;grid-template-columns:140px 1fr;gap:14px;padding:11px 14px;background:#f7f8f8;border-radius:8px;font-size:13px}
      @media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.15fr 1fr .78fr 1fr .5fr .55fr!important}.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(8){display:none}}
      @media(max-width:760px){.method-grid,.method-checklist{grid-template-columns:1fr}.method-scale>div,.method-steps>div{grid-template-columns:1fr}.company-row.lpr-grid{grid-template-columns:1.05fr 1fr 1fr!important}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(6),.company-row.lpr-grid>:nth-child(7){display:none}}
    `;
    document.head.appendChild(s);
  }

  styles();makeModal();addMenuButtons();wrapRenderSearch();
})();
