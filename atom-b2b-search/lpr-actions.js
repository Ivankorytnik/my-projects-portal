(function atomGoogleSheetContacts(){
  'use strict';

  const SPREADSHEET_ID = '1v0DiMltTOFb_3SSkigH6RPXOZdEVFpIKG5XBatTCz2g';
  const SHEET_NAME = 'TOP-50';
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1v0DiMltTOFb_3SSkigH6RPXOZdEVFpIKG5XBatTCz2g/edit#gid=978672615';
  const DASH = '—';
  let records = [];

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
        email: clean(raw.email),
        social: clean(raw.social),
        procurement: clean(raw.procurement),
        outreach: clean(raw.outreach),
        pilot: clean(raw.pilot),
        why: clean(raw.why),
        next: clean(raw.next),
        source1: clean(raw.source1),
        source2: clean(raw.source2),
        checked: clean(raw.checked),
        comment: clean(raw.comment),
        added: clean(raw.added)
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
      checkedAt: row.checked || row.added || '',
      sheetCompany: row.company,
      social: row.social,
      procurement: row.procurement,
      outreach: row.outreach,
      pilot: row.pilot,
      why: row.why,
      next: row.next,
      comment: row.comment
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
    const checked = contact.checkedAt ? `<div class="meta">проверено в таблице: ${esc(contact.checkedAt)}</div>` : '';
    const label = contact.found ? 'Обновить из Google Таблицы' : 'Проверить Google Таблицу';
    return `<div class="contact-cell"><div>${phone}</div><div>${email}</div>${checked}<button class="mini-btn contact-sheet-btn" data-company="${esc(company.name)}">${label}</button></div>`;
  }

  function recordFromValues(row){
    return {
      company: clean(row[1]),
      lpr: clean(row[8]),
      role: clean(row[9]),
      grade: clean(row[10]),
      phone: clean(row[11]),
      email: clean(row[12]),
      social: clean(row[13]),
      procurement: clean(row[14]),
      outreach: clean(row[15]),
      pilot: clean(row[16]),
      why: clean(row[17]),
      next: clean(row[18]),
      source1: clean(row[19]),
      source2: clean(row[20]),
      checked: clean(row[21]),
      comment: clean(row[22]),
      added: clean(row[23])
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
        range: 'A1:X',
        headers: '1',
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
        records = [];
        patchData();
        if (typeof renderSearch === 'function') renderSearch();
        setSourceStatus('Google Таблица недоступна');
        if (!options.silent) notify('Не удалось загрузить Google Таблицу. Контактные данные не подменялись другими источниками.', 'error', 7000);
        return {status: 'error', count: 0};
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
    if (result.status === 'error') {
      notify('Не удалось загрузить Google Таблицу. Контакты оставлены пустыми.', 'error');
    } else if (contact && contact.found) {
      notify(`${name}: данные обновлены из Google Таблицы.`);
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
      section.innerHTML = `<h3>ЛПР и контакты</h3><p><strong>${esc(contact.lpr)}</strong><br>${esc(contact.role)} · достоверность ${esc(contact.grade)}</p><p><strong>Телефон:</strong> ${esc(contact.phone || 'не указан')}<br><strong>E-mail:</strong> ${esc(contact.email || 'не указан')}</p>${contact.checkedAt ? `<p class="meta">Проверено в Google Таблице: ${esc(contact.checkedAt)}</p>` : ''}<p><a href="${SHEET_URL}" target="_blank" rel="noopener">Открыть Google Таблицу TOP-50</a></p>${contact.comment ? `<p>${esc(contact.comment)}</p>` : ''}<button class="secondary modal-refresh-sheet" data-company="${esc(company.name)}">Обновить из Google Таблицы</button>`;
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
  setSourceStatus('Загрузка Google Таблицы…');
  bind();
  if (typeof setView === 'function') setView('search');
  if (typeof renderSearch === 'function') renderSearch();
  syncFromGoogleSheet({silent: true});
})();
