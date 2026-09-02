'use strict';

(() => {
  const DB_NAME = 'TestDriveDocReferenceData';
  const STORE_NAME = 'reference';
  const MANAGERS_KEY = 'managers';
  const CARS_KEY = 'cars';

  const DEFAULT_MANAGERS = [{
    fullName: 'Чибрикина Андрея Владимировича',
    role: 'Менеджера по развитию бизнеса',
    poaNo: 'ОП0001',
    poaDate: '2026-06-24',
    managerName: ''
  }];

  const ALIASES = {
    managers: {
      fullName: ['фио','фамилия имя отчество','менеджер','представитель','фио представителя','companyrepname'],
      role: ['должность','роль','должность представителя','companyreprole'],
      poaNo: ['доверенность','номер доверенности','№ доверенности','номер доверенности представителя','доверенность номер','companyreppoano'],
      poaDate: ['дата доверенности','дата доверенности представителя','доверенность дата','companyreppoadate'],
      managerName: ['фио сопровождающего','сопровождающий менеджер','фио для анкеты','managername']
    },
    cars: {
      plate: ['госномер','гос номер','государственный номер','регистрационный знак','государственный регистрационный знак','номер автомобиля','plate'],
      carModel: ['модель','марка и модель','модель автомобиля','марка модель','carmodel'],
      vin: ['vin','вин','идентификационный номер'],
      carYear: ['год','год выпуска','caryear'],
      bodyNumber: ['кузов','номер кузова','номер кузова кабины','bodynumber'],
      chassis: ['шасси','номер шасси','рама','номер рамы','chassis'],
      pts: ['птс','паспорт транспортного средства','pts'],
      sts: ['стс','свидетельство о регистрации','свидетельство о регистрации транспортного средства','sts']
    }
  };

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const state = {managers: [], cars: []};

  function norm(v) {
    return String(v ?? '')
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/№/g, 'номер')
      .replace(/[^a-zа-я0-9]+/g, '');
  }

  function text(v) {
    return String(v ?? '').replace(/^\uFEFF/, '').trim();
  }

  function aliasSet(type, field) {
    return new Set((ALIASES[type]?.[field] || []).map(norm));
  }

  function pickObject(obj, type, field) {
    const wanted = aliasSet(type, field);
    for (const [k, v] of Object.entries(obj || {})) {
      if (wanted.has(norm(k))) return text(v);
    }
    return '';
  }

  function normalizeDate(value) {
    const raw = text(value);
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    let m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(raw);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    m = /^(\d{4})[.\/](\d{1,2})[.\/](\d{1,2})$/.exec(raw);
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    const num = Number(raw.replace(',', '.'));
    if (Number.isFinite(num) && num > 20000 && num < 90000) {
      const ms = Date.UTC(1899, 11, 30) + Math.round(num) * 86400000;
      return new Date(ms).toISOString().slice(0,10);
    }
    return raw;
  }

  function parseDelimited(rawText) {
    const src = String(rawText || '').replace(/^\uFEFF/, '');
    const firstLine = src.split(/\r?\n/).find(line => line.trim()) || '';
    const candidates = [';', '\t', ','];
    let delimiter = ';';
    let best = -1;
    for (const d of candidates) {
      const count = firstLine.split(d).length - 1;
      if (count > best) { best = count; delimiter = d; }
    }

    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (ch === '"') {
        if (quoted && src[i + 1] === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) {
        row.push(cell); cell = '';
      } else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && src[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(v => String(v).trim() !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    if (row.some(v => String(v).trim() !== '')) rows.push(row);
    return rows;
  }

  function colIndex(ref) {
    const letters = String(ref || '').match(/^[A-Z]+/i)?.[0]?.toUpperCase() || 'A';
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return Math.max(0, n - 1);
  }

  async function unzipXlsx(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Не удалось прочитать XLSX: не найден ZIP-каталог.');
    const count = view.getUint16(eocd + 10, true);
    let pos = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder('utf-8');
    const entries = new Map();

    for (let i = 0; i < count; i++) {
      if (view.getUint32(pos, true) !== 0x02014b50) throw new Error('Повреждён XLSX-файл.');
      const method = view.getUint16(pos + 10, true);
      const compressedSize = view.getUint32(pos + 20, true);
      const nameLen = view.getUint16(pos + 28, true);
      const extraLen = view.getUint16(pos + 30, true);
      const commentLen = view.getUint16(pos + 32, true);
      const localOffset = view.getUint32(pos + 42, true);
      const name = decoder.decode(bytes.slice(pos + 46, pos + 46 + nameLen));

      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('Повреждён локальный заголовок XLSX.');
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      entries.set(name, {method, data: bytes.slice(dataStart, dataStart + compressedSize)});
      pos += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  async function inflateEntry(entry) {
    if (!entry) return '';
    let out;
    if (entry.method === 0) out = entry.data;
    else if (entry.method === 8) {
      if (!('DecompressionStream' in window)) throw new Error('Этот браузер не умеет читать XLSX локально. Сохраните файл как CSV.');
      const stream = new Blob([entry.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      out = new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error(`Неподдерживаемый метод сжатия XLSX: ${entry.method}.`);
    return new TextDecoder('utf-8').decode(out);
  }

  async function parseXlsx(file) {
    const entries = await unzipXlsx(file);
    const parser = new DOMParser();
    let shared = [];
    if (entries.has('xl/sharedStrings.xml')) {
      const xml = parser.parseFromString(await inflateEntry(entries.get('xl/sharedStrings.xml')), 'application/xml');
      shared = [...xml.getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent || '').join(''));
    }

    const sheetName = [...entries.keys()].filter(n => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n)).sort((a,b) => a.localeCompare(b, undefined, {numeric:true}))[0];
    if (!sheetName) throw new Error('В XLSX не найден лист с данными.');
    const sheetXml = parser.parseFromString(await inflateEntry(entries.get(sheetName)), 'application/xml');
    const rows = [];
    for (const rowEl of [...sheetXml.getElementsByTagName('row')]) {
      const row = [];
      for (const c of [...rowEl.getElementsByTagName('c')]) {
        const idx = colIndex(c.getAttribute('r'));
        const type = c.getAttribute('t') || '';
        let v = '';
        if (type === 'inlineStr') v = [...c.getElementsByTagName('t')].map(t => t.textContent || '').join('');
        else {
          const raw = c.getElementsByTagName('v')[0]?.textContent || '';
          v = type === 's' ? (shared[Number(raw)] ?? '') : raw;
        }
        row[idx] = v;
      }
      if (row.some(v => text(v))) rows.push(row);
    }
    return rows;
  }

  function headerScore(row, type) {
    const values = (row || []).map(norm);
    let score = 0;
    for (const field of Object.keys(ALIASES[type])) {
      const wanted = aliasSet(type, field);
      if (values.some(v => wanted.has(v))) score++;
    }
    return score;
  }

  function tableToObjects(table, type) {
    if (!Array.isArray(table) || !table.length) return [];
    let headerIndex = 0;
    let bestScore = -1;
    for (let i = 0; i < Math.min(table.length, 12); i++) {
      const score = headerScore(table[i], type);
      if (score > bestScore) { bestScore = score; headerIndex = i; }
    }
    const headers = (table[headerIndex] || []).map(text);
    return table.slice(headerIndex + 1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = row?.[i] ?? ''; });
      return obj;
    }).filter(obj => Object.values(obj).some(v => text(v)));
  }

  function normalizeManagers(objects) {
    const result = [];
    for (const obj of objects) {
      const rec = {
        fullName: pickObject(obj, 'managers', 'fullName'),
        role: pickObject(obj, 'managers', 'role'),
        poaNo: pickObject(obj, 'managers', 'poaNo'),
        poaDate: normalizeDate(pickObject(obj, 'managers', 'poaDate')),
        managerName: pickObject(obj, 'managers', 'managerName')
      };
      if (rec.fullName) result.push(rec);
    }
    return result;
  }

  function normalizeCars(objects) {
    const result = [];
    for (const obj of objects) {
      const rec = {
        plate: pickObject(obj, 'cars', 'plate'),
        carModel: pickObject(obj, 'cars', 'carModel'),
        vin: pickObject(obj, 'cars', 'vin'),
        carYear: pickObject(obj, 'cars', 'carYear'),
        bodyNumber: pickObject(obj, 'cars', 'bodyNumber'),
        chassis: pickObject(obj, 'cars', 'chassis'),
        pts: pickObject(obj, 'cars', 'pts'),
        sts: pickObject(obj, 'cars', 'sts')
      };
      if (rec.plate) result.push(rec);
    }
    return result;
  }

  async function parseFile(file, type) {
    const name = file.name.toLowerCase();
    let objects;
    if (name.endsWith('.json')) {
      const parsed = JSON.parse(await file.text());
      const data = Array.isArray(parsed) ? parsed : (parsed[type] || parsed.items || []);
      if (!Array.isArray(data)) throw new Error('JSON должен содержать массив строк справочника.');
      objects = data;
    } else if (name.endsWith('.xlsx')) {
      objects = tableToObjects(await parseXlsx(file), type);
    } else if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) {
      objects = tableToObjects(parseDelimited(await file.text()), type);
    } else {
      throw new Error('Поддерживаются XLSX, CSV и JSON.');
    }
    const result = type === 'managers' ? normalizeManagers(objects) : normalizeCars(objects);
    if (!result.length) throw new Error(type === 'managers' ? 'Не найдена колонка ФИО или строки менеджеров.' : 'Не найдена колонка Госномер или строки автомобилей.');
    return result;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function dbGet(key) {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) { return null; }
  }

  async function dbSet(key, value) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function setField(name, value, readOnly=true) {
    const el = $(`[data-f="${name}"]`);
    if (!el) return;
    el.value = value || '';
    el.readOnly = readOnly;
    el.classList.toggle('ref-locked-field', readOnly);
    el.dispatchEvent(new Event('input', {bubbles:true}));
    el.dispatchEvent(new Event('change', {bubbles:true}));
  }

  function setFieldsReadOnly(names, readOnly) {
    names.forEach(name => {
      const el = $(`[data-f="${name}"]`);
      if (!el) return;
      el.readOnly = readOnly;
      el.classList.toggle('ref-locked-field', readOnly);
    });
  }

  function applyManager(rec) {
    if (!rec) {
      setFieldsReadOnly(['companyRepRole','companyRepName','companyRepPoaNo','companyRepPoaDate'], false);
      return;
    }
    setField('companyRepRole', rec.role, true);
    setField('companyRepName', rec.fullName, true);
    setField('companyRepPoaNo', rec.poaNo, true);
    setField('companyRepPoaDate', rec.poaDate, true);
    if (rec.managerName) setField('managerName', rec.managerName, false);
  }

  function applyCar(rec) {
    const names = ['plate','carModel','vin','carYear','bodyNumber','chassis','pts','sts'];
    if (!rec) { setFieldsReadOnly(names, false); return; }
    names.forEach(name => setField(name, rec[name], true));
  }

  function formatManagerDetail(rec) {
    if (!rec) return '';
    const date = rec.poaDate ? rec.poaDate.split('-').reverse().join('.') : 'дата не указана';
    return `${rec.role || 'Должность не указана'} · доверенность № ${rec.poaNo || 'не указана'} от ${date}`;
  }

  function formatCarDetail(rec) {
    if (!rec) return '';
    return `${rec.carModel || 'Модель не указана'} · VIN ${rec.vin || 'не указан'} · СТС ${rec.sts || 'не указано'}`;
  }

  function fillSelect(select, items, type, selectedKey='') {
    const current = selectedKey || select.value;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = type === 'managers' ? 'Выберите менеджера' : 'Выберите госномер';
    select.appendChild(placeholder);
    items.forEach((item, index) => {
      const opt = document.createElement('option');
      opt.value = String(index);
      opt.textContent = type === 'managers' ? item.fullName : item.plate;
      select.appendChild(opt);
    });
    const manual = document.createElement('option');
    manual.value = '__manual__';
    manual.textContent = 'Ручной ввод';
    select.appendChild(manual);
    if ([...select.options].some(o => o.value === current)) select.value = current;
  }

  function downloadSample(type) {
    const content = type === 'managers'
      ? '\uFEFFФИО;Должность;Номер доверенности;Дата доверенности;ФИО сопровождающего\nЧибрикина Андрея Владимировича;Менеджера по развитию бизнеса;ОП0001;24.06.2026;\n'
      : '\uFEFFГосномер;Модель;VIN;Год выпуска;Номер кузова;Шасси;ПТС;СТС\nТ546НК977;Атом;;;;;;;\n';
    const blob = new Blob([content], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'managers' ? 'TestDrive_Менеджеры_образец.csv' : 'TestDrive_Автомобили_образец.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makeReferenceBox(type) {
    const isManager = type === 'managers';
    const box = document.createElement('div');
    box.className = 'ref-box';
    box.dataset.refType = type;

    const title = document.createElement('div');
    title.className = 'ref-title';
    title.innerHTML = `<strong>${isManager ? 'Справочник менеджеров и доверенностей' : 'Справочник автомобилей'}</strong><span>${isManager ? 'Выберите менеджера, остальные реквизиты подставятся автоматически.' : 'Выберите госномер, данные автомобиля подставятся автоматически.'}</span>`;

    const controls = document.createElement('div');
    controls.className = 'ref-controls';

    const selectWrap = document.createElement('label');
    selectWrap.className = 'ref-select-wrap';
    const selectLabel = document.createElement('span');
    selectLabel.textContent = isManager ? 'Менеджер' : 'Госномер';
    const select = document.createElement('select');
    select.id = isManager ? 'managerReferenceSelect' : 'carReferenceSelect';
    selectWrap.append(selectLabel, select);

    const uploadLabel = document.createElement('label');
    uploadLabel.className = 'btn secondary ref-upload-btn';
    uploadLabel.textContent = isManager ? 'Загрузить список менеджеров' : 'Загрузить список авто';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx,.csv,.tsv,.txt,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json';
    fileInput.hidden = true;
    uploadLabel.appendChild(fileInput);

    const sampleBtn = document.createElement('button');
    sampleBtn.type = 'button';
    sampleBtn.className = 'btn ghost ref-sample-btn';
    sampleBtn.textContent = 'Скачать образец CSV';
    sampleBtn.addEventListener('click', () => downloadSample(type));

    controls.append(selectWrap, uploadLabel, sampleBtn);

    const detail = document.createElement('div');
    detail.className = 'ref-detail';
    detail.id = isManager ? 'managerReferenceDetail' : 'carReferenceDetail';

    const status = document.createElement('div');
    status.className = 'ref-status';
    status.id = isManager ? 'managerReferenceStatus' : 'carReferenceStatus';
    status.textContent = 'Справочник хранится только в этом браузере.';

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      status.textContent = `Читаю ${file.name}...`;
      status.className = 'ref-status';
      try {
        const list = await parseFile(file, type);
        state[type] = list;
        await dbSet(isManager ? MANAGERS_KEY : CARS_KEY, list);
        fillSelect(select, list, type);
        select.value = '';
        detail.textContent = '';
        if (isManager) applyManager(null); else applyCar(null);
        status.textContent = `${file.name}: загружено ${list.length}. Выберите ${isManager ? 'менеджера' : 'автомобиль'} из списка.`;
        status.className = 'ref-status ok';
      } catch (err) {
        status.textContent = err?.message || 'Не удалось прочитать файл.';
        status.className = 'ref-status warn';
      } finally {
        fileInput.value = '';
      }
    });

    select.addEventListener('change', () => {
      if (select.value === '__manual__' || select.value === '') {
        if (isManager) applyManager(null); else applyCar(null);
        detail.textContent = select.value === '__manual__' ? 'Ручной ввод включён.' : '';
        return;
      }
      const rec = state[type][Number(select.value)];
      if (isManager) {
        applyManager(rec);
        detail.textContent = formatManagerDetail(rec);
      } else {
        applyCar(rec);
        detail.textContent = formatCarDetail(rec);
      }
    });

    box.append(title, controls, detail, status);
    return box;
  }

  function findSectionByField(fieldName) {
    return $(`[data-f="${fieldName}"]`)?.closest('.section') || null;
  }

  async function mount() {
    const managerSection = findSectionByField('companyRepName');
    const carSection = findSectionByField('plate');
    if (!managerSection || !carSection) return false;

    if (!managerSection.querySelector('[data-ref-type="managers"]')) {
      const h3 = managerSection.querySelector('h3');
      h3?.after(makeReferenceBox('managers'));
    }
    if (!carSection.querySelector('[data-ref-type="cars"]')) {
      const h3 = carSection.querySelector('h3');
      h3?.after(makeReferenceBox('cars'));
    }

    const savedManagers = await dbGet(MANAGERS_KEY);
    const savedCars = await dbGet(CARS_KEY);
    state.managers = Array.isArray(savedManagers) && savedManagers.length ? savedManagers : DEFAULT_MANAGERS.slice();
    state.cars = Array.isArray(savedCars) ? savedCars : [];

    const managerSelect = $('#managerReferenceSelect');
    const carSelect = $('#carReferenceSelect');
    fillSelect(managerSelect, state.managers, 'managers');
    fillSelect(carSelect, state.cars, 'cars');

    if (state.managers.length) {
      managerSelect.value = '0';
      applyManager(state.managers[0]);
      $('#managerReferenceDetail').textContent = formatManagerDetail(state.managers[0]);
      $('#managerReferenceStatus').textContent = savedManagers ? `Локальный справочник: ${state.managers.length} менеджер(ов).` : 'Загружен базовый менеджер. Список можно заменить файлом XLSX/CSV.';
    }

    const currentPlate = $(`[data-f="plate"]`)?.value?.trim();
    const carIndex = currentPlate ? state.cars.findIndex(c => c.plate === currentPlate) : -1;
    if (carIndex >= 0) {
      carSelect.value = String(carIndex);
      applyCar(state.cars[carIndex]);
      $('#carReferenceDetail').textContent = formatCarDetail(state.cars[carIndex]);
    } else {
      carSelect.value = '__manual__';
      applyCar(null);
    }
    $('#carReferenceStatus').textContent = state.cars.length ? `Локальный справочник: ${state.cars.length} автомобиль(ей).` : 'Список автомобилей пока не загружен. Можно использовать ручной ввод.';
    return true;
  }

  function boot() {
    mount().then(ok => { if (!ok) setTimeout(boot, 250); }).catch(() => setTimeout(boot, 500));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
