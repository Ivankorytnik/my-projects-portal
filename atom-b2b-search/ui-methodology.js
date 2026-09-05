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
          if(emailNode){
            emailCell.appendChild(emailNode);
          }else{
            emailCell.innerHTML='<span class="muted">—</span>';
          }
        }else{
          emailCell.innerHTML='<span class="muted">—</span>';
        }
        row.insertBefore(emailCell,children[3]);
      }
      row.dataset.emailSplit='1';
    });
  }

  function wrapRenderSearch(){
    if(typeof window.renderSearch!=='function')return;
    const original=window.renderSearch;
    window.renderSearch=function(){
      original();
      splitEmailColumn();
    };
    window.renderSearch();
  }

  function makeModal(){
    if(document.getElementById('methodologyModal'))return;
    const modal=document.createElement('div');
    modal.id='methodologyModal';
    modal.className='modal hidden';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`
      <div class="modal-card modal-large methodology-card">
        <div class="modal-head">
          <div><p class="eyebrow">МЕТОДИКА</p><h2 id="methodologyTitle">Как считается</h2></div>
          <button type="button" id="closeMethodologyModal" class="icon-btn">×</button>
        </div>
        <div id="methodologyBody"></div>
      </div>`;
    document.body.appendChild(modal);
    const close=()=>{modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');};
    document.getElementById('closeMethodologyModal').onclick=close;
    modal.onclick=e=>{if(e.target===modal)close();};
  }

  const forecastHtml=`
    <div class="method-intro">Прогноз АТОМ — это <strong>аналитическая оценка потенциала закупки на 12–24 месяца</strong> после успешного пилота. Это не подтверждённый план закупки компании.</div>
    <div class="method-formula">Прогноз АТОМ = адресуемый корпоративный парк × коэффициент внедрения</div>
    <div class="method-grid">
      <article><strong>1. Адресуемый парк</strong><p>Считаются только легковые и городские служебные автомобили, которые реально можно заменить АТОМом. Спецтехника, внедорожный транспорт, грузовой парк и такси исключаются.</p></article>
      <article><strong>2. EV-fit маршрутов</strong><p>Чем больше регулярных городских маршрутов, фиксированных баз и возвратов на парковку, тем выше потенциальная доля АТОМ.</p></article>
      <article><strong>3. Зарядная готовность</strong><p>Собственные парковки, офисы, базы и доступ к ЭЗС повышают реалистичный объём внедрения.</p></article>
      <article><strong>4. Закупочная модель</strong><p>Централизованные закупки и крупные единые контракты дают больший верхний диапазон, чем фрагментированные региональные закупки.</p></article>
      <article><strong>5. Пилот → масштабирование</strong><p>Нижняя граница — консервативный сценарий после пилота. Верхняя — реалистичное масштабирование при положительном TCO и эксплуатационных KPI.</p></article>
      <article><strong>6. Типичный коэффициент</strong><p>Ориентир для первого цикла обычно около 5–15% адресуемого парка, но коэффициент корректируется по отрасли, маршрутам, зарядке и зрелости закупок.</p></article>
    </div>
    <div class="method-note">Пример: адресуемый парк 1 000–1 500 автомобилей × реалистичный коэффициент внедрения 8–12% → ориентир примерно 80–180 АТОМ.</div>`;

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
      .email-cell{font-size:12px;line-height:1.35;min-width:0;overflow-wrap:anywhere}
      .email-cell a{color:inherit;text-decoration:none}.email-cell a:hover{text-decoration:underline}
      .nav-method-separator{height:1px;background:rgba(255,255,255,.09);margin:10px 10px}
      .nav-info-btn{font-size:12px!important;opacity:.9}
      .methodology-card{max-width:880px}
      .method-intro{font-size:15px;line-height:1.55;margin-bottom:18px}
      .method-formula{padding:14px 16px;border-radius:10px;background:#f3f6e9;font-weight:800;margin-bottom:18px}
      .method-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      .method-grid article{padding:14px;border:1px solid #e5e7ea;border-radius:10px}.method-grid p{margin:7px 0 0;font-size:13px;line-height:1.5;color:#5f646b}
      .method-note{margin-top:18px;padding:13px 15px;border-left:3px solid #a8d23b;background:#f8faf5;font-size:13px;line-height:1.5}
      .score-method-list{border:1px solid #e5e7ea;border-radius:10px;overflow:hidden}.score-method-list>div{display:flex;justify-content:space-between;gap:18px;padding:11px 14px;border-bottom:1px solid #eceef0}.score-method-list>div:last-child{border-bottom:0}.score-method-list span{font-size:13px}.score-method-list strong{white-space:nowrap}
      .method-scale{display:grid;gap:8px;margin-top:16px}.method-scale>div{display:grid;grid-template-columns:140px 1fr;gap:14px;padding:11px 14px;background:#f7f8f8;border-radius:8px;font-size:13px}
      @media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.15fr 1fr .78fr 1fr .5fr .55fr!important}.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(8){display:none}}
      @media(max-width:760px){.method-grid{grid-template-columns:1fr}.method-scale>div{grid-template-columns:1fr}.company-row.lpr-grid{grid-template-columns:1.05fr 1fr 1fr!important}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(6),.company-row.lpr-grid>:nth-child(7){display:none}}
    `;
    document.head.appendChild(s);
  }

  styles();
  makeModal();
  addMenuButtons();
  wrapRenderSearch();
})();
