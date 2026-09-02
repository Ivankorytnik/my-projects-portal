'use strict';

(() => {
  let active = 'poa';
  let lastSignature = '';
  let mounted = false;

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const byField = (name) => document.querySelector(`[data-f="${name}"]`)?.value?.trim() || '';
  const byCheck = (name) => !!document.querySelector(`[data-c="${name}"]`)?.checked;
  const dateText = (v) => {
    if (!v) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
  };
  const fill = (v, empty='не заполнено') => `<span class="td-doc-fill${v ? '' : ' empty'}">${esc(v || empty)}</span>`;
  const mark = (yes) => `<span class="td-check-mark" aria-hidden="true">${yes ? '☒' : '☐'}</span>`;

  function data() {
    return {
      fullName: byField('fullName'), phone: byField('phone'), email: byField('email'), birthDate: dateText(byField('birthDate')),
      passportSeries: byField('passportSeries'), passportNumber: byField('passportNumber'), passportIssuedBy: byField('passportIssuedBy'),
      passportIssueDate: dateText(byField('passportIssueDate')), passportCode: byField('passportCode'), registrationAddress: byField('registrationAddress'), actualAddress: byField('actualAddress'),
      driverLicense: byField('driverLicense'), driverLicenseIssueDate: dateText(byField('driverLicenseIssueDate')), driverCategory: byField('driverCategory'), driverIssuedBy: byField('driverIssuedBy'),
      carModel: byField('carModel'), vin: byField('vin'), plate: byField('plate'), carYear: byField('carYear'), bodyNumber: byField('bodyNumber'), chassis: byField('chassis'), pts: byField('pts'), sts: byField('sts'),
      managerName: byField('managerName'), poaNumber: byField('poaNumber'), poaDate: dateText(byField('poaDate')), poaValidUntil: dateText(byField('poaValidUntil')),
      companyRepRole: byField('companyRepRole'), companyRepName: byField('companyRepName'), companyRepPoaNo: byField('companyRepPoaNo'), companyRepPoaDate: dateText(byField('companyRepPoaDate')), testDriveDate: dateText(byField('testDriveDate')),
      salutation: byField('salutation'), messenger: byField('messenger'),
      consentEmail: byCheck('consentEmail'), consentSms: byCheck('consentSms'), consentPhone: byCheck('consentPhone'), consentPost: byCheck('consentPost'), consentMessenger: byCheck('consentMessenger')
    };
  }

  function row(label, value) {
    return `<div class="td-doc-row"><div class="td-doc-label">${esc(label)}</div><div>${fill(value)}</div></div>`;
  }

  function poa(d) {
    const passport = [d.passportSeries,d.passportNumber].filter(Boolean).join(' ');
    return `<div class="td-doc-sheet">
      <div class="td-doc-kicker">АКЦИОНЕРНОЕ ОБЩЕСТВО «КАМА» (АО «Кама»)<br>Российская Федерация, г. Москва</div>
      <h3 class="td-doc-title">ДОВЕРЕННОСТЬ № ${fill(d.poaNumber,'Б/Н')}</h3>
      <div class="td-doc-subtitle">Дата: ${fill(d.poaDate)}</div>
      <p class="td-doc-text">Акционерное общество «КАМА», в лице ${fill(d.companyRepRole,'должность представителя')} ${fill(d.companyRepName,'ФИО представителя')}, действующего на основании доверенности № ${fill(d.companyRepPoaNo)} от ${fill(d.companyRepPoaDate)}, имеет в собственности следующее транспортное средство:</p>
      <div class="td-doc-section">
        ${row('Марка и модель',d.carModel)}${row('Государственный регистрационный знак',d.plate)}${row('VIN',d.vin)}${row('Год выпуска',d.carYear)}${row('Номер шасси (рамы)',d.chassis)}${row('Номер кузова (кабины)',d.bodyNumber)}${row('ПТС',d.pts)}${row('СТС',d.sts)}
      </div>
      <div class="td-doc-section"><h4>НАСТОЯЩИМ УПОЛНОМОЧИВАЕТ</h4>
        <p class="td-doc-text">${fill(d.fullName,'ФИО доверенного лица')}, паспорт ${fill(passport)}, выдан ${fill(d.passportIssueDate)} ${fill(d.passportIssuedBy)}, код подразделения ${fill(d.passportCode)}, водительское удостоверение ${fill(d.driverLicense)}, выдано ${fill(d.driverLicenseIssueDate)}, ГИБДД ${fill(d.driverIssuedBy)}, категория ${fill(d.driverCategory)}.</p>
        <ul class="td-doc-list"><li>осуществлять управление и пользование Автомобилем;</li><li>являться законным представителем Общества в ГИБДД и страховых компаниях;</li><li>следить за техническим состоянием Автомобиля;</li><li>выполнять действия, связанные с данным поручением.</li></ul>
      </div>
      <p class="td-doc-text">Настоящая Доверенность выдана сроком действия до ${fill(d.poaValidUntil)} включительно без права передоверия другим лицам.</p>
      <div class="td-doc-sign"><div><div class="td-doc-line"></div>Подпись Доверенного лица</div><div><div class="td-doc-line"></div>${fill(d.companyRepName,'ФИО представителя')}</div></div>
      <div class="td-doc-file">01_Доверенность.docx · предварительный просмотр заполняемых полей</div>
    </div>`;
  }

  function questionnaire(d) {
    return `<div class="td-doc-sheet">
      <h3 class="td-doc-title">АНКЕТА КЛИЕНТА</h3><div class="td-doc-subtitle">для предоставления Электромобиля Атом в краткосрочный тест-драйв</div>
      ${row('ФИО',d.fullName)}${row('Контактный телефон',d.phone)}${row('E-mail',d.email)}${row('Серия паспорта',d.passportSeries)}${row('Номер паспорта',d.passportNumber)}${row('Кем выдан',d.passportIssuedBy)}${row('Дата выдачи',d.passportIssueDate)}${row('Код подразделения',d.passportCode)}${row('Адрес регистрации',d.registrationAddress)}${row('Фактический адрес',d.actualAddress)}
      <div class="td-doc-section">${row('Модель электромобиля',d.carModel)}${row('VIN',d.vin)}${row('Гос. номер',d.plate)}${row('ФИО сопровождающего менеджера',d.managerName)}${row('Дата тест-драйва',d.testDriveDate)}</div>
      <div class="td-doc-section"><h4>Правила предоставления автомобилей АО «Кама» в краткосрочный тест-драйв</h4>
        <p class="td-doc-text">Клиент получает Электромобиль с целью ознакомления с его потребительскими свойствами и осуществляет поездку только в сопровождении ответственного сотрудника.</p>
        <p class="td-doc-text">Клиент обязан соблюдать Правила дорожного движения, бережно обращаться с Электромобилем и выполнять рекомендации сопровождающего менеджера.</p>
        <p class="td-doc-text">АО «Кама» вправе отказать в предоставлении Электромобиля лицу моложе 25 лет и/или со стажем вождения менее 5 лет.</p>
        <p class="td-doc-text">С Правилами предоставления Электромобилей АО «Кама» в краткосрочный тест-драйв ознакомлен, согласен и обязуюсь соблюдать.</p>
      </div>
      <div class="td-doc-sign"><div>ФИО<br>${fill(d.fullName)}</div><div>Подпись<div class="td-doc-line"></div></div></div>
      <div class="td-doc-file">02_Анкета_клиента.docx · предварительный просмотр заполняемых полей</div>
    </div>`;
  }

  function consent(d) {
    return `<div class="td-doc-sheet">
      <h3 class="td-doc-title">СОГЛАСИЕ НА ОБРАБОТКУ ПЕРСОНАЛЬНЫХ ДАННЫХ</h3>
      <p class="td-doc-text">Уважаемый клиент, данные используются для коммуникаций, приглашений на мероприятия и направления информации в соответствии с выбранными ниже вариантами связи.</p>
      ${row('Обращение',d.salutation)}${row('Фамилия Имя Отчество',d.fullName)}${row('Мобильный телефон',d.phone)}${row('Адрес электронной почты',d.email)}${row('Дата рождения',d.birthDate)}
      <div class="td-doc-section"><h4>Согласие на варианты связи</h4><div class="td-consent-grid">
        <div class="td-check-line">${mark(d.consentEmail)} Электронная почта</div><div class="td-check-line">${mark(d.consentSms)} СМС</div>
        <div class="td-check-line">${mark(d.consentPhone)} Телефон (звонки)</div><div class="td-check-line">${mark(d.consentPost)} Почта</div>
        <div class="td-check-line">${mark(d.consentMessenger)} Мессенджеры: ${fill(d.messenger,'не указан')}</div>
      </div></div>
      <div class="td-doc-section"><h4>Условия обработки</h4>
        <p class="td-doc-text">Настоящим клиент выражает согласие на обработку АО «КАМА» предоставленных персональных данных в целях, предусмотренных штатной формой согласия.</p>
        <p class="td-doc-text">Обработка осуществляется с соблюдением требований законодательства Российской Федерации и условий полного документа СОПД.</p>
      </div>
      <div class="td-doc-sign"><div>ФИО<br>${fill(d.fullName)}</div><div>Подпись<div class="td-doc-line"></div></div></div>
      <div class="td-doc-file">03_Согласие_на_обработку_ПДн.docx · предварительный просмотр заполняемых полей</div>
    </div>`;
  }

  function renderLive(force=false) {
    if (!mounted) return;
    const d = data();
    const sig = JSON.stringify(d);
    if (!force && sig === lastSignature) return;
    lastSignature = sig;
    const views = {poa:poa(d),questionnaire:questionnaire(d),consent:consent(d)};
    Object.entries(views).forEach(([kind,html]) => {
      const panel = document.querySelector(`[data-doc-panel="${kind}"]`);
      if (panel) panel.innerHTML = html;
    });
  }

  function select(kind) {
    active = kind;
    document.querySelectorAll('[data-doc-tab]').forEach(btn => btn.setAttribute('aria-selected', String(btn.dataset.docTab === kind)));
    document.querySelectorAll('[data-doc-panel]').forEach(panel => panel.hidden = panel.dataset.docPanel !== kind);
  }

  function mount() {
    const card = document.querySelector('.preview-card');
    const oldList = document.querySelector('#previewList');
    if (!card || !oldList || card.dataset.liveDocs === '1') return false;
    card.dataset.liveDocs = '1';
    card.classList.add('live-doc-preview-card');
    oldList.classList.add('td-doc-hidden-list');
    const title = card.querySelector('.preview-title');
    if (title) title.textContent = 'Документы в реальном времени';
    const note = document.createElement('div');
    note.className = 'td-live-note';
    note.textContent = 'Поля с жёлтым фоном заполняются из карточки участника и меняются сразу при вводе.';
    const tabs = document.createElement('div');
    tabs.className = 'td-doc-tabs';
    tabs.setAttribute('role','tablist');
    const items = [['poa','Доверенность'],['questionnaire','Анкета клиента'],['consent','СОПД']];
    items.forEach(([kind,label]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'td-doc-tab'; b.dataset.docTab = kind; b.setAttribute('role','tab'); b.setAttribute('aria-selected',String(kind===active)); b.textContent = label;
      b.addEventListener('click',() => select(kind));
      tabs.appendChild(b);
    });
    const stage = document.createElement('div');
    stage.className = 'td-doc-stage';
    items.forEach(([kind]) => {
      const panel = document.createElement('div');
      panel.className = 'td-doc-panel'; panel.dataset.docPanel = kind; panel.setAttribute('role','tabpanel'); panel.hidden = kind !== active;
      stage.appendChild(panel);
    });
    oldList.before(note,tabs,stage);
    mounted = true;
    renderLive(true);
    return true;
  }

  function boot() {
    if (!mount()) {
      setTimeout(boot,250);
      return;
    }
    document.addEventListener('input',() => renderLive(),true);
    document.addEventListener('change',() => renderLive(),true);
    document.querySelector('#clearBtn')?.addEventListener('click',() => setTimeout(() => renderLive(true),0));
    document.querySelector('#passportPhoto')?.addEventListener('change',() => setTimeout(() => renderLive(true),800));
    document.querySelector('#licensePhoto')?.addEventListener('change',() => setTimeout(() => renderLive(true),800));
    setInterval(() => renderLive(),350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
