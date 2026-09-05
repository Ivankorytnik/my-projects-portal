(() => {
  const SPREADSHEET_ID = '1Y-50RQGjUb7sQkJpLLx46MEUfQoAANYEEdyUW1RoA3U';
  const SHEET_NAME = 'Календарь';
  const LAST_SYNC_KEY = 'atomB2BLastSheetsSync';

  const cityRegions = {
    'Москва': 'Москва',
    'Казань': 'Республика Татарстан',
    'Екатеринбург': 'Свердловская область',
    'Санкт-Петербург': 'Санкт-Петербург',
    'Тюмень': 'Тюменская область'
  };

  function parseStartDate(label) {
    if (!label) return '';
    const text = String(label).trim();
    const full = text.match(/(\d{1,2})[.](\d{1,2})(?:[.]|[^\d]*)(\d{4})/);
    if (full) return `${full[3]}-${String(full[2]).padStart(2,'0')}-${String(full[1]).padStart(2,'0')}`;

    const shortWithYear = text.match(/^(\d{1,2})[.](\d{1,2}).*?(\d{4})$/);
    if (shortWithYear) return `${shortWithYear[3]}-${String(shortWithYear[2]).padStart(2,'0')}-${String(shortWithYear[1]).padStart(2,'0')}`;

    const rangeYear = text.match(/^(\d{1,2})[.](\d{1,2}).*?(\d{4})$/);
    if (rangeYear) return `${rangeYear[3]}-${String(rangeYear[2]).padStart(2,'0')}-${String(rangeYear[1]).padStart(2,'0')}`;

    const months = {январь:'01',февраль:'02',март:'03',апрель:'04',май:'05',июнь:'06',июль:'07',август:'08',сентябрь:'09',октябрь:'10',ноябрь:'11',декабрь:'12'};
    const monthYear = text.toLowerCase().match(/(январь|февраль|март|апрель|май|июнь|июль|август|сентябрь|октябрь|ноябрь|декабрь)\s+(\d{4})/);
    if (monthYear) return `${monthYear[2]}-${months[monthYear[1]]}-01`;
    return '';
  }

  function cellText(cell) {
    if (!cell) return '';
    if (typeof cell.f !== 'undefined') return String(cell.f);
    if (typeof cell.v !== 'undefined' && cell.v !== null) return String(cell.v);
    return '';
  }

  function inferValue(audience) {
    const a = audience || '';
    return a ? `Концентрация целевой B2B-аудитории: ${a}.` : 'Доступ к целевой B2B-аудитории и потенциальным ЛПР.';
  }

  function inferAtom(format, next) {
    if (format) return `Использовать формат: ${format}.`;
    return next || 'Назначить встречи, показать АТОМ и конвертировать интерес в пилоты.';
  }

  function tableToEvents(table) {
    if (!table || !Array.isArray(table.cols) || !Array.isArray(table.rows)) return [];
    const headers = table.cols.map(c => String(c.label || '').trim());
    const index = name => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const idx = {
      date:index('Дата'), name:index('Мероприятие'), city:index('Город'), audience:index('Аудитория'),
      format:index('Формат участия'), score:index('Скоринг 0-100'), priority:index('Приоритет'), next:index('Следующий шаг')
    };
    if (idx.name < 0 || idx.date < 0) return [];

    return table.rows.map(row => {
      const c = row.c || [];
      const dateLabel = cellText(c[idx.date]);
      const name = cellText(c[idx.name]);
      const city = idx.city >= 0 ? cellText(c[idx.city]) : '';
      const audience = idx.audience >= 0 ? cellText(c[idx.audience]) : '';
      const format = idx.format >= 0 ? cellText(c[idx.format]) : '';
      const next = idx.next >= 0 ? cellText(c[idx.next]) : '';
      const score = idx.score >= 0 ? Number(cellText(c[idx.score])) || 0 : 0;
      const priority = idx.priority >= 0 ? cellText(c[idx.priority]) || 'B' : 'B';
      return {
        date: parseStartDate(dateLabel),
        dateLabel,
        name,
        city,
        region: cityRegions[city] || city || 'Не указан',
        audience,
        score,
        priority,
        next,
        value: inferValue(audience),
        atom: inferAtom(format, next)
      };
    }).filter(e => e.name && e.dateLabel);
  }

  function formatStamp(date) {
    return date.toLocaleString('ru-RU', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  function setSyncUI(status, stamp) {
    const syncValue = document.getElementById('systemSheetsSync');
    const activityValue = document.getElementById('systemActivitiesUpdated');
    const btn = document.getElementById('syncSheetsButton');
    if (syncValue) {
      syncValue.textContent = status === 'ok' ? stamp : status === 'loading' ? 'синхронизация…' : 'ошибка доступа';
      syncValue.classList.toggle('system-warning', status !== 'ok');
    }
    if (activityValue && status === 'ok') activityValue.textContent = stamp;
    if (btn) {
      btn.disabled = status === 'loading';
      btn.textContent = status === 'loading' ? 'Синхронизация…' : 'Синхронизировать';
    }
  }

  function applySyncedEvents(items) {
    if (!items.length) throw new Error('Google Sheets вернул пустой календарь');
    EVENTS.splice(0, EVENTS.length, ...items);
    localStorage.setItem('atomB2BSyncedEvents', JSON.stringify(items));
    const stamp = formatStamp(new Date());
    localStorage.setItem(LAST_SYNC_KEY, stamp);
    setSyncUI('ok', stamp);
    if (typeof initFilters === 'function') initFilters();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderEvents === 'function') renderEvents();
  }

  window.atomSheetsSyncCallback = function(response) {
    try {
      if (!response || response.status === 'error') throw new Error('Нет доступа к таблице');
      applySyncedEvents(tableToEvents(response.table));
    } catch (err) {
      console.error('ATOM Google Sheets sync:', err);
      setSyncUI('error');
    } finally {
      const old = document.getElementById('atomSheetsSyncScript');
      if (old) old.remove();
    }
  };

  function sync() {
    setSyncUI('loading');
    const old = document.getElementById('atomSheetsSyncScript');
    if (old) old.remove();
    const script = document.createElement('script');
    script.id = 'atomSheetsSyncScript';
    script.src = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=responseHandler:atomSheetsSyncCallback`;
    script.onerror = () => setSyncUI('error');
    document.head.appendChild(script);
  }

  const cached = JSON.parse(localStorage.getItem('atomB2BSyncedEvents') || 'null');
  if (Array.isArray(cached) && cached.length) EVENTS.splice(0, EVENTS.length, ...cached);

  const stamp = localStorage.getItem(LAST_SYNC_KEY);
  if (stamp) setSyncUI('ok', stamp);

  const btn = document.getElementById('syncSheetsButton');
  if (btn) btn.addEventListener('click', sync);

  window.syncAtomGoogleSheets = sync;
})();
