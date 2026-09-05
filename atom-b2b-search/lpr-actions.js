(function atomGoogleSheetContacts(SNAPSHOT){
  'use strict';

  const SPREADSHEET_ID = '1v0DiMltTOFb_3SSkigH6RPXOZdEVFpIKG5XBatTCz2g';
  const SHEET_NAME = 'TOP-50';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1v0DiMltTOFb_3SSkigH6RPXOZdEVFpIKG5XBatTCz2g/edit#gid=978672615';
  const DASH = '—';
  let records = normalizeRecords(SNAPSHOT.records);
  let sourceMode = 'snapshot';

  const norm = value => String(value || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'()\-–—/\\]/g, ' ')
    .replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const clean = value => {
    const text = String(value == null ? '' : value).trim();
    return /^(—|-|–)$/.test(text) ? '' : text;
  };

  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const stamp = () => new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date()).replace(',', '');

  function normalizeRecords(items){
    const seen = new Set();
    const out = [];
    (Array.isArray(items) ? items : []).forEach(raw => {
      const company = clean(raw.company);
      const key = norm(company);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push({
        company,
        lpr: clean(raw.lpr),
        role: clean(raw.role),
        grade: clean(raw.grade),
        phone: clean(raw.phone),
        email: clean(raw.email)
      });
    });
    return out;
  }

  function findRecord(companyName){
    const key = norm(companyName);
    if (!key) return null;
    const exact = records.find(row => norm(row.company) === key);
    if (exact) return exact;
    if (key.length < 3) return null;
    return records.find(row => {
      const rowKey = norm(row.company);
      return rowKey.length >= 3 && (rowKey.includes(key) || key.includes(rowKey));
    }) || null;
  }

  function current(company){
    const row = findRecord(company.name);
    if (!row) {
      return {
        found: false,
        lpr: 'Нет данных в Google Таблице',
        role: DASH,
        grade: DASH,
        phone: '',
        email: '',
        checkedAt: '',
        sheetCompany: ''
      };
    }
    return {
      found: true,
      lpr: row.lpr || 'ЛПР не указан',
      role: row.role || DASH,
      grade: row.grade || DASH,
      phone: row.phone,
      email: row.email,
      checkedAt: '',
      sheetCompany: row.company
    };
  }

  window.getCompanyLpr = company => current(company);

  function apply(company, contact){
    company.lpr = contact.lpr;
    company.lprRole = contact.role;
    company.lprGrade = contact.grade;
    company.phone = contact.phone || '';
    company.email = contact.email || '';
    company.checkedAt = contact.checkedAt || '';
    company.contactSource = SHEET_URL;
    company.contactSourceMode = 'google_sheet';
    company.sheetCompany = contact.sheetCompany || '';
  }

  function patchData(){
    if (typeof allCompanies !== 'function') return;
    allCompanies().forEach(company => apply(company, current(company)));
  }

  function notify(message, kind = 'ok', ttl = 5200){
    let node = document.getElementById('lprRefreshNotice');
    if (!node) {
      node = document.createElement('div');
      node.id = 'lprRefreshNotice';
      node.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:9999;max-width:480px;padding:14px 16px;border-radius:10px;background:#111;color:#fff;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.25)';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.background = kind === 'error' ? '#8b1e1e' : kind === 'same' ? '#444' : '#111';
    clearTimeout(window.__lprNoticeTimer);
    window.__lprNoticeTimer = setTimeout(() => node.remove(), ttl);
  }

  function ensureSourceStatus(){
    const meta = document.querySelector('.integration-meta');
    if (!meta) return;
    const existing = document.getElementById('sheetContactsStatus');
    if (existing) return;
    const first = meta.querySelector('strong');
    if (first) {
      first.id = 'sheetContactsStatus';
      return;
    }
    const span = document.createElement('span');
    span.innerHTML = 'Контакты: <strong id="sheetContactsStatus">Google Таблица TOP-50</strong>';
    meta.appendChild(span);
  }

  function setSourceStatus(text){
    ensureSourceStatus();
    const node = document.getElementById('sheetContactsStatus');
    if (node) node.textContent = text;
  }

  function displayEmail(email){
    if (!email) return '<span class="muted">e-mail —</span>';
    const safe = esc(email);
    if (/^[^\s;,@]+@[^\s;,@]+\.[^\s;,@]+$/.test(email)) {
      return `<a href="mailto:${encodeURIComponent(email)}">${safe}</a>`;
    }
    return safe;
  }

  function contactHtml(company){
    const contact = current(company);
    const phone = contact.phone ? esc(contact.phone) : '<span class="muted">телефон —</span>';
    const email = displayEmail(contact.email);
    const label = contact.found ? 'Обновить из Google Таблицы' : 'Проверить Google Таблицу';
    return `<div class="contact-cell"><div>${phone}</div><div>${email}</div><button class="mini-btn contact-sheet-btn" data-company="${esc(company.name)}">${label}</button></div>`;
  }

  function recordFromValues(row){
    return {
      company: clean(row[0]),
      lpr: clean(row[1]),
      role: clean(row[2]),
      grade: clean(row[3]),
      phone: clean(row[4]),
      email: clean(row[5])
    };
  }

  function parseGviz(payload){
    if (!payload || payload.status === 'error' || !payload.table || !Array.isArray(payload.table.rows)) {
      throw new Error('invalid_google_sheet_response');
    }
    const parsed = payload.table.rows.map(row => {
      const values = (row.c || []).map(cell => {
        if (!cell) return '';
        if (cell.f != null) return cell.f;
        return cell.v == null ? '' : cell.v;
      });
      return recordFromValues(values);
    });
    return normalizeRecords(parsed);
  }

  function loadLiveSheet(){
    return new Promise((resolve, reject) => {
      const callback = `__atomSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement('script');
      let finished = false;
      let timer = null;
      const cleanup = () => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        try { delete window[callback]; } catch (error) { window[callback] = undefined; }
        script.remove();
      };
      const fail = error => {
        cleanup();
        reject(error instanceof Error ? error : new Error(String(error || 'google_sheet_load_failed')));
      };
      window[callback] = payload => {
        try {
          const next = parseGviz(payload);
          if (!next.length) throw new Error('empty_google_sheet');
          cleanup();
          resolve(next);
        } catch (error) {
          fail(error);
        }
      };
      script.async = true;
      script.onerror = () => fail(new Error('google_sheet_network_error'));
      const params = new URLSearchParams({
        sheet: SHEET_NAME,
        headers: '1',
        tq: 'select B,I,J,K,L,M',
        tqx: `out:json;responseHandler:${callback}`
      });
      script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`;
      timer = setTimeout(() => fail(new Error('google_sheet_timeout')), 12000);
      document.head.appendChild(script);
    });
  }

  function setLoading(active, clickedButton){
    const top = document.getElementById('refreshAllContactsButton');
    const buttons = [top, clickedButton].filter((button, index, list) => button && list.indexOf(button) === index);
    buttons.forEach(button => {
      if (active) {
        if (!button.dataset.sheetLabel) button.dataset.sheetLabel = button.textContent;
        button.disabled = true;
        button.textContent = 'Загружаю из Google Таблицы…';
      } else {
        button.disabled = false;
        button.textContent = button.dataset.sheetLabel || (button === top ? 'Загрузить контакты из Google Таблицы' : 'Обновить из Google Таблицы');
      }
    });
  }

  async function syncFromGoogleSheet(options = {}){
    if (window.__atomSheetSyncPromise) return window.__atomSheetSyncPromise;
    const clickedButton = options.button || null;
    setLoading(true, clickedButton);
    window.__atomSheetSyncPromise = (async () => {
      try {
        const next = await loadLiveSheet();
        records = next;
        sourceMode = 'live';
        const syncedAt = stamp();
        localStorage.setItem('atomB2BLastContactsRefresh', syncedAt);
        patchData();
        if (typeof renderSearch === 'function') renderSearch();
        if (typeof renderDashboard === 'function') renderDashboard();
        setSourceStatus(`Google Таблица · ${records.length} строк · ${syncedAt}`);
        if (!options.silent) notify(`Контакты загружены из Google Таблицы: ${records.length} строк.`);
        return {status: 'live', count: records.length};
      } catch (error) {
        console.warn('Google Sheet contacts', error);
        patchData();
        if (typeof renderSearch === 'function') renderSearch();
        const label = sourceMode === 'live' ? 'последняя загруженная версия' : `снимок ${SNAPSHOT.generatedAt}`;
        setSourceStatus(`Google Таблица · ${label}`);
        if (!options.silent) notify(`Google Таблица сейчас недоступна. Сохранён ${label}; другие источники не использовались.`, 'same', 7000);
        return {status: sourceMode, count: records.length};
      } finally {
        setLoading(false, clickedButton);
        window.__atomSheetSyncPromise = null;
      }
    })();
    return window.__atomSheetSyncPromise;
  }

  async function refreshCompany(name, button){
    const result = await syncFromGoogleSheet({silent: true, button});
    const company = typeof allCompanies === 'function' ? allCompanies().find(item => item.name === name) : null;
    const contact = company ? current(company) : null;
    if (contact && contact.found) {
      notify(`${name}: данные обновлены из Google Таблицы (${result.status === 'live' ? 'актуальная версия' : 'сохранённый снимок'}).`);
    } else {
      notify(`${name}: строка не найдена в Google Таблице TOP-50.`, 'same');
    }
  }

  window.syncFromGoogleSheet = syncFromGoogleSheet;
  window.refreshAllAtomContacts = () => syncFromGoogleSheet({silent: false});

  function bind(){
    document.querySelectorAll('.contact-sheet-btn').forEach(button => {
      button.onclick = () => refreshCompany(button.dataset.company, button);
    });
    const all = document.getElementById('refreshAllContactsButton');
    if (all) all.onclick = window.refreshAllAtomContacts;
  }

  function patchSearch(){
    window.renderSearch = function(){
      patchData();
      const data = filtered();
      document.getElementById('resultCount').textContent = 'Найдено: ' + data.length;
      document.getElementById('companiesTable').innerHTML =
        '<div class="company-row header lpr-grid"><div>Компания</div><div>ЛПР</div><div>Телефон / e-mail</div><div>Отрасль</div><div>Скоринг</div><div>Прогноз АТОМ</div><div></div></div>' +
        (data.length ? data.map(company =>
          `<div class="company-row lpr-grid"><div><div class="company-name">${esc(company.name)}</div><div class="meta">${esc(company.region || DASH)}</div></div><div><div class="lpr-name">${esc(company.lpr)}</div><div class="meta">${esc(company.lprRole || DASH)} · ${esc(company.lprGrade || DASH)}</div></div><div>${contactHtml(company)}</div><div>${esc(company.sector || DASH)}</div><div><b>${esc(company.score)}</b> · ${esc(priority(company.score))}</div><div>${esc(fmt(company.atomMin))}–${esc(fmt(company.atomMax))}</div><div class="company-actions"><button class="mini-btn" onclick='openCompany(${JSON.stringify(company.name)})'>Открыть</button><button class="mini-btn ${state.saved.includes(company.name) ? 'saved' : ''}" onclick='toggleSaved(${JSON.stringify(company.name)})'>★</button></div></div>`
        ).join('') : '<div class="empty">Подходящие компании не найдены.</div>');
      bind();
    };
  }

  function patchModal(){
    const originalOpen = window.openCompany;
    window.openCompany = function(name){
      const company = typeof allCompanies === 'function' ? allCompanies().find(item => item.name === name) : null;
      if (company) apply(company, current(company));
      originalOpen(name);
      if (!company) return;
      const contact = current(company);
      const box = document.getElementById('companyDetails');
      if (!box) return;
      const section = document.createElement('div');
      section.className = 'detail-section';
      section.innerHTML = `<h3>ЛПР и контакты</h3><p><strong>${esc(contact.lpr)}</strong><br>${esc(contact.role)} · достоверность ${esc(contact.grade)}</p><p><strong>Телефон:</strong> ${esc(contact.phone || 'не указан')}<br><strong>E-mail:</strong> ${esc(contact.email || 'не указан')}</p><p><a href="${SHEET_URL}" target="_blank" rel="noopener">Открыть Google Таблицу TOP-50</a></p><button class="secondary modal-refresh-sheet" data-company="${esc(company.name)}">Обновить из Google Таблицы</button>`;
      box.insertBefore(section, box.firstChild);
      const button = section.querySelector('.modal-refresh-sheet');
      button.onclick = async () => {
        await refreshCompany(company.name, button);
        window.closeCompany();
        window.openCompany(company.name);
      };
    };
  }

  const style = document.createElement('style');
  style.textContent = '.company-row.lpr-grid{grid-template-columns:1.15fr 1.05fr 1.15fr .72fr .48fr .62fr .48fr}.lpr-name{font-weight:700;font-size:12px}.contact-cell{font-size:12px;line-height:1.35}.contact-cell .muted{color:#9aa0a6}.contact-sheet-btn{margin-top:6px;white-space:nowrap}@media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.2fr 1.05fr 1.15fr .55fr .6fr}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(7){display:none}}';
  document.head.appendChild(style);

  patchData();
  patchSearch();
  patchModal();
  ensureSourceStatus();
  setSourceStatus(`Google Таблица · снимок ${SNAPSHOT.generatedAt}`);
  bind();
  if (typeof setView === 'function') setView('search');
  if (typeof renderSearch === 'function') renderSearch();
  syncFromGoogleSheet({silent: true});
})({"generatedAt":"05.09.2026 17:58 МСК","records":[{"company":"ПАО «Россети»","lpr":"Екатерина Григорьева","role":"Директор по закупкам","grade":"A","phone":"88002001881;84957109333","email":"info@fsk-ees.ru"},{"company":"Ростелеком","lpr":"Татьяна Карасёва","role":"Вице-президент, директор по закупкам","grade":"A","phone":"84999998283","email":"rostelecom@rt.ru"},{"company":"МТС","lpr":"Юлия Трухчева","role":"Директор по закупкам и трансформации","grade":"B","phone":"84952232025","email":"ir@mts.ru"},{"company":"МегаФон","lpr":"Алексей Крутицкий","role":"Директор по закупкам и логистике","grade":"B","phone":"88005500555","email":""},{"company":"билайн / ПАО «ВымпелКом»","lpr":"Нина Тер-Михайлова","role":"Директор дирекции по закупкам и логистике","grade":"B","phone":"88007002843","email":"services@beeline.ru"},{"company":"T2","lpr":"Евгений Леонов","role":"Руководитель центра компетенций закупок (маркетинг/медиа/оборудование)","grade":"B","phone":"84959797611;79515200611","email":""},{"company":"Россети Московский регион","lpr":"Алексей Фомин","role":"Директор по логистике и материально-техническому обеспечению","grade":"A","phone":"84956624070;84953634070","email":"client@rossetimr.ru"},{"company":"Интер РАО","lpr":"Сергей Виноградов","role":"Член Правления — руководитель Центра снабжения; гендиректор «Интер РАО — Центр управления закупками»","grade":"A","phone":"84956648840","email":"akkred@interrao.ru"},{"company":"Т Плюс","lpr":"Руслан Хальфин","role":"Директор по закупкам и логистике (последнее публичное подтверждение)","grade":"C","phone":"84959805900;84957400000","email":"info@tplusgroup.ru"},{"company":"РусГидро","lpr":"Владимир Николашин","role":"Директор департамента закупок, маркетинга и ценообразования","grade":"A","phone":"88003338000","email":"office@rushydro.ru"},{"company":"Газпром нефть","lpr":"Оксана Великан","role":"Руководитель Центра закупок «Газпромнефть — Региональные продажи»","grade":"A","phone":"88123633152;88007003152","email":"info@gazprom-neft.ru"},{"company":"Эн+","lpr":"Давид Погосбеков","role":"Первый заместитель генерального директора по коммерции и капитальному строительству","grade":"A","phone":"84956427937","email":"info@enplus.ru"},{"company":"X5 Group","lpr":"Марина Живоглазова","role":"Руководитель некоммерческих закупок","grade":"A","phone":"84956628888","email":"info.tender@x5.ru"},{"company":"Магнит","lpr":"Руководитель некоммерческих закупок","role":"Имя публично не подтверждено","grade":"C","phone":"88612109810","email":"info@magnit.ru"},{"company":"Лемана ПРО","lpr":"Елизавета Казанцева","role":"Директор по непродуктовым / некоммерческим закупкам","grade":"A","phone":"88007000099;84959610160","email":""},{"company":"Ozon","lpr":"Елена Блиндяева","role":"Директор по закупкам","grade":"A","phone":"","email":""},{"company":"ВкусВилл","lpr":"Антон Чижов","role":"Управляющий директор по качеству и закупкам","grade":"B","phone":"84956638602","email":"info@vkusvill.ru"},{"company":"Лента","lpr":"Директор по обеспечению бизнеса / непрямым закупкам","role":"Имя публично не подтверждено","grade":"C","phone":"88123806131","email":"dob@lenta.com"},{"company":"М.Видео-Эльдорадо","lpr":"Руслан Аиткулов","role":"Директор по закупкам","grade":"A","phone":"","email":"tender@mvideo.ru"},{"company":"ПИК","lpr":"Константин Яникович","role":"Вице-президент по закупкам и логистике","grade":"A","phone":"84955059733","email":"dz@pik.ru"},{"company":"ГК «Самолет»","lpr":"Артём Блинов","role":"Директор по закупкам и тендерам","grade":"B","phone":"84959671313","email":"info@samolet.ru"},{"company":"ГК ФСК","lpr":"Александр Ткаченко","role":"Вице-президент — директор департамента закупок","grade":"B","phone":"84956601555","email":"tender@fsk.ru"},{"company":"Донстрой","lpr":"Юрий Сухарь","role":"Руководитель управления материально-технического снабжения","grade":"B","phone":"84959254747","email":""},{"company":"Sminex","lpr":"Руководитель закупок оборудования/непрямых закупок","role":"Имя публично не подтверждено","grade":"C","phone":"84956444010","email":"tenders@sminex.com"},{"company":"ГК А101","lpr":"Елена Леликова","role":"Директор по закупкам","grade":"A","phone":"84991101873","email":"lelikova_e@a101.ru;zakupki@a101.ru;snab@a101.ru"},{"company":"Пулково / ООО «Воздушные Ворота Северной Столицы»","lpr":"Станислав Лученков","role":"Директор дирекции по снабжению","grade":"A","phone":"88123243444","email":"office@pulkovo-airport.com"},{"company":"Внуково","lpr":"Павел Слободенюк","role":"Директор по закупкам","grade":"A","phone":"84959375555","email":""},{"company":"РЖД","lpr":"Ирина Митичкина","role":"Начальник Центральной дирекции закупок и снабжения","grade":"B","phone":"84992629901","email":"rzd@rzd.ru"},{"company":"ВТБ","lpr":"Игорь Маринюк","role":"Начальник управления закупок / руководитель категорийных закупок","grade":"A","phone":"84957397799","email":"corp@vtb.ru"},{"company":"Альфа-Банк","lpr":"Виктор Бояркин","role":"Директор по закупкам","grade":"A","phone":"84957555858","email":"mail@alfabank.ru"},{"company":"Россельхозбанк","lpr":"Яна Лысова","role":"Директор по закупкам","grade":"A","phone":"84953630553","email":"zayavki@rshb.ru"},{"company":"ДОМ.РФ","lpr":"Диляра Баширова","role":"Директор по закупкам","grade":"B","phone":"84957754740","email":"mailbox@domrf.ru"},{"company":"Московская биржа","lpr":"Анна Ермакова","role":"Директор по закупкам","grade":"B","phone":"84953633232","email":"clients@moex.com"},{"company":"Сбер","lpr":"Руководитель центра снабжения / непрямых закупок","role":"Актуальное имя публично не подтверждено","grade":"C","phone":"0321;88005555777","email":"sberbank@sberbank.ru"},{"company":"Ингосстрах","lpr":"Мария Маринина","role":"Руководитель департамента закупок","grade":"A","phone":"88001007755;84959565555","email":"ingos24@ingos.ru"},{"company":"VK","lpr":"Ксения Масчан","role":"Заместитель вице-президента по экономике и финансам, директор по закупкам и логистике","grade":"B","phone":"","email":"office@vk.company;sales@vk.company"},{"company":"Авито","lpr":"Наталья Бетяева","role":"Директор департамента закупок","grade":"B","phone":"84952283630;88006000001","email":"partners@avito.ru;sales@avito.ru"},{"company":"BIOCAD","lpr":"Юрий Невоструев","role":"Руководитель закупочного направления / закупок непроизводственных материалов","grade":"A","phone":"88123804933","email":"biocad@biocad.ru"},{"company":"Биннофарм Групп","lpr":"Валерий Оратовский","role":"Руководитель тендерного и закупочного обеспечения","grade":"B","phone":"84956464334;84951375727","email":"info@binnopharmgroup.ru"},{"company":"Р-Фарм","lpr":"Заместитель директора по снабжению / руководитель непрямых закупок","role":"Имя требует верификации","grade":"C","phone":"84959567937;84959567938","email":"info@rpharm.ru"},{"company":"Фармстандарт","lpr":"Директор по закупкам / административный директор","role":"Имя публично не подтверждено","grade":"C","phone":"84959700030","email":"info@pharmstd.ru"},{"company":"ПРОМОМЕД","lpr":"Директор по закупкам / операционный директор","role":"Имя публично не подтверждено","grade":"C","phone":"84956402528","email":"reception@promomed.pro"},{"company":"Генериум","lpr":"Руководитель закупок","role":"Имя публично не подтверждено","grade":"C","phone":"84959884794","email":"generium@generium.ru;bd@generium.ru"},{"company":"Северсталь","lpr":"Вячеслав Греков","role":"Руководитель направления закупок","grade":"A","phone":"88202530900;84959267766","email":"severstal@severstal.com"},{"company":"Уралкалий","lpr":"Алексей Чернышев","role":"Заместитель директора по закупкам","grade":"A","phone":"84957302371","email":"russia-sales@uralkali.com;uralkali@uralkali.com"},{"company":"Уралхим","lpr":"Евгений Дацко","role":"Заместитель директора по закупкам","grade":"A","phone":"84957218989;83422071150","email":"td.info@uralchem.ru"},{"company":"ЦЕМРОС","lpr":"Денис Назаров","role":"Директор по закупкам и логистике","grade":"A","phone":"88007006363;84957375500;84957952580","email":"info@cemros.ru"},{"company":"АЛРОСА","lpr":"Максим Бульший","role":"Директор Центра закупок","grade":"A","phone":"84956209250;84954117525","email":"zakupki@alrosa.ru;info@alrosa.ru"},{"company":"ММК","lpr":"Алексей Кузьмин","role":"Коммерческий директор","grade":"B","phone":"88007750005;83519242388","email":"snab@mmk.ru"},{"company":"Росатом","lpr":"Роман Зимонас","role":"Директор по закупкам / МТО / качеству (требуется актуальная верификация)","grade":"C","phone":"84999494042;84959336040","email":"info@rosatom.ru"}]});
