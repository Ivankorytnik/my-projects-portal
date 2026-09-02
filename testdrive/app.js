'use strict';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fields = $$('[data-f]');
const checks = $$('[data-c]');
const REQUIRED = [
  ['fullName','ФИО'],['phone','Телефон'],['birthDate','Дата рождения'],
  ['passportSeries','Серия паспорта'],['passportNumber','Номер паспорта'],
  ['passportIssuedBy','Кем выдан паспорт'],['passportIssueDate','Дата выдачи паспорта'],
  ['passportCode','Код подразделения'],['registrationAddress','Адрес регистрации'],
  ['driverLicense','Водительское удостоверение'],['driverLicenseIssueDate','Дата выдачи ВУ'],
  ['driverCategory','Категория ВУ'],['carModel','Модель автомобиля'],['vin','VIN'],
  ['plate','Госномер'],['managerName','Сопровождающий менеджер'],
  ['poaNumber','Номер доверенности'],['poaDate','Дата доверенности'],
  ['poaValidUntil','Срок действия доверенности'],['companyRepName','Представитель организации']
];
const TEMPLATE_NAMES = {
  poa: 'poa_template.docx',
  questionnaire: 'questionnaire_template.docx',
  consent: 'consent_template.docx'
};
const OUTPUT_NAMES = {
  poa: '01_Доверенность.docx',
  questionnaire: '02_Анкета_клиента.docx',
  consent: '03_Согласие_на_обработку_ПДн.docx'
};
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

const state = {
  pinHash: null,
  locked: true,
  lastActivity: Date.now(),
  lastSensitiveEdit: Date.now(),
  templates: new Map(),
  outputHandle: null,
  textDetector: null,
  textDetectorAvailable: false,
  busy: false
};

function safeText(v, max = 900) {
  return String(v ?? '').replace(/\0/g,'').replace(/[\r\n\t]+/g,' ').replace(/\s{2,}/g,' ').trim().slice(0,max);
}
function getData() {
  const d = {};
  fields.forEach(el => d[el.dataset.f] = safeText(el.value, el.tagName === 'TEXTAREA' ? 700 : 300));
  checks.forEach(el => d[el.dataset.c] = !!el.checked);
  return d;
}
function setField(name, value, markOcr = false) {
  const el = document.querySelector(`[data-f="${name}"]`);
  if (!el || value == null || String(value).trim() === '') return false;
  const incoming = String(value).trim();
  const current = el.value.trim();
  if (!current || current === incoming || (name === 'driverCategory' && markOcr)) {
    el.value = incoming;
    if (markOcr) el.classList.add('ocr-filled');
    return true;
  }
  return false;
}
function formatDateIso(v) {
  if (!v) return '';
  const d = new Date(v + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU').format(d);
}
function dateParts(v) {
  if (!v) return {day:'____',month:'_______',year:'2026'};
  const d = new Date(v + 'T00:00:00');
  return {day:String(d.getDate()).padStart(2,'0'),month:months[d.getMonth()],year:String(d.getFullYear())};
}
function shortName(name) {
  const parts = safeText(name,120).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] || '';
  let initials = '';
  for (let i = 1; i < Math.min(parts.length,3); i++) initials += parts[i].slice(0,1).toUpperCase() + '.';
  return `${parts[0]} ${initials}`.trim();
}
function ageFrom(v) {
  if (!v) return null;
  const b = new Date(v + 'T00:00:00');
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a;
}
function buildContext() {
  const d = getData();
  const ctx = {...d};
  ctx.birthDateText = formatDateIso(d.birthDate);
  ctx.passportIssueDateText = formatDateIso(d.passportIssueDate);
  ctx.driverLicenseIssueDateText = formatDateIso(d.driverLicenseIssueDate);
  ctx.companyRepPoaDateText = formatDateIso(d.companyRepPoaDate);
  ctx.poaDateText = formatDateIso(d.poaDate);
  ctx.testDriveDateText = formatDateIso(d.testDriveDate) || formatDateIso(new Date().toISOString().slice(0,10));
  ctx.passportCombined = [d.passportSeries,d.passportNumber].filter(Boolean).join(' ');
  ctx.companyRepShort = shortName(d.companyRepName);
  const valid = dateParts(d.poaValidUntil);
  ctx.poaValidUntilDay = valid.day;
  ctx.poaValidUntilMonth = valid.month;
  ctx.poaValidUntilYear = valid.year;
  ctx.salutationMr = d.salutation === 'Господин' ? '[X]' : '[ ]';
  ctx.salutationMs = d.salutation === 'Госпожа' ? '[X]' : '[ ]';
  ctx.consentEmailMark = d.consentEmail ? '[X]' : '[ ]';
  ctx.consentSmsMark = d.consentSms ? '[X]' : '[ ]';
  ctx.consentPhoneMark = d.consentPhone ? '[X]' : '[ ]';
  ctx.consentPostMark = d.consentPost ? '[X]' : '[ ]';
  ctx.consentMessengerMark = d.consentMessenger ? '[X]' : '[ ]';
  Object.keys(ctx).forEach(k => { if (typeof ctx[k] !== 'boolean') ctx[k] = safeText(ctx[k],900); });
  return ctx;
}
function validateData() {
  const d = getData();
  const missing = REQUIRED.filter(([k]) => !d[k]).map(([,label]) => label);
  if (d.passportSeries && !/^\d{4}$/.test(d.passportSeries)) missing.push('Серия паспорта: 4 цифры');
  if (d.passportNumber && !/^\d{6}$/.test(d.passportNumber)) missing.push('Номер паспорта: 6 цифр');
  return missing;
}
function markActivity(sensitive = false) {
  state.lastActivity = Date.now();
  if (sensitive) state.lastSensitiveEdit = Date.now();
}
function setStatus(selector, text, mode = '') {
  const el = $(selector);
  if (!el) return;
  el.textContent = text;
  el.className = 'status' + (mode ? ` ${mode}` : '');
}
function render() {
  const d = getData();
  const age = ageFrom(d.birthDate);
  const years = Number(d.drivingYears);
  if (age == null || !d.drivingYears) setStatus('#eligibilityStatus','Возраст и стаж пока не проверены.');
  else if (age >= 25 && years >= 5) setStatus('#eligibilityStatus',`Возраст ${age}, стаж ${years} лет. Базовое ограничение по возрасту и стажу не срабатывает.`,'ok');
  else setStatus('#eligibilityStatus',`Внимание: возраст ${age}, стаж ${years} лет. Проверьте внутренние правила допуска.`,'warn');

  const preview = [
    ['ФИО',d.fullName],['Телефон',d.phone],['Email',d.email],['Дата рождения',formatDateIso(d.birthDate)],
    ['Паспорт',[d.passportSeries,d.passportNumber].filter(Boolean).join(' ')],['Кем выдан',d.passportIssuedBy],
    ['Дата выдачи паспорта',formatDateIso(d.passportIssueDate)],['Код подразделения',d.passportCode],['Адрес регистрации',d.registrationAddress],
    ['Водительское удостоверение',d.driverLicense],['Дата выдачи ВУ',formatDateIso(d.driverLicenseIssueDate)],['Категория',d.driverCategory],
    ['Автомобиль',d.carModel],['VIN',d.vin],['Госномер',d.plate],['Менеджер',d.managerName],['Дата тест-драйва',formatDateIso(d.testDriveDate)]
  ];
  const dl = $('#previewList');
  dl.textContent = '';
  preview.forEach(([label,value]) => {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value || '—';
    dl.append(dt,dd);
  });

  const missing = validateData();
  const ready = missing.length === 0 && state.templates.size === 3;
  const badge = $('#readinessBadge');
  badge.textContent = ready ? 'Готово' : 'Не готово';
  badge.classList.toggle('ready',ready);
  if (!state.templates.size) setStatus('#validationStatus','Сначала выберите три локальных Word-шаблона.','warn');
  else if (missing.length) setStatus('#validationStatus','Не заполнено: ' + missing.slice(0,8).join(', ') + (missing.length > 8 ? '...' : ''),'warn');
  else setStatus('#validationStatus','Все обязательные поля заполнены. Можно формировать комплект.','ok');
}

fields.forEach(el => el.addEventListener('input',() => { el.classList.remove('ocr-filled'); markActivity(true); render(); }));
fields.forEach(el => el.addEventListener('change',() => { markActivity(true); render(); }));
checks.forEach(el => el.addEventListener('change',() => { markActivity(true); render(); }));
document.addEventListener('mousemove',() => markActivity(false),{passive:true});
document.addEventListener('keydown',() => markActivity(false));
document.addEventListener('click',() => markActivity(false));

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pin));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}
function showLock(mode = 'unlock') {
  state.locked = true;
  $('#lockScreen').classList.remove('hidden');
  $('#pinInput').value = '';
  $('#pinError').textContent = '';
  if (mode === 'create') {
    $('#lockTitle').textContent = 'Защищённая сессия';
    $('#lockText').textContent = 'Создайте PIN из 4-12 цифр. PIN существует только в памяти этой вкладки и исчезает после её закрытия.';
    $('#pinButton').textContent = 'Создать PIN и войти';
    $('#pinButton').dataset.mode = 'create';
  } else {
    $('#lockTitle').textContent = 'Экран заблокирован';
    $('#lockText').textContent = 'Введите PIN текущей сессии. Данные остаются только в памяти этой вкладки.';
    $('#pinButton').textContent = 'Разблокировать';
    $('#pinButton').dataset.mode = 'unlock';
  }
  setTimeout(() => $('#pinInput').focus(),0);
}
async function handlePin() {
  const pin = $('#pinInput').value;
  if (!/^\d{4,12}$/.test(pin)) { $('#pinError').textContent = 'Используйте 4-12 цифр.'; return; }
  const hash = await hashPin(pin);
  if ($('#pinButton').dataset.mode === 'create') {
    state.pinHash = hash;
    state.locked = false;
    $('#lockScreen').classList.add('hidden');
    markActivity();
  } else if (hash === state.pinHash) {
    state.locked = false;
    $('#lockScreen').classList.add('hidden');
    markActivity();
  } else $('#pinError').textContent = 'Неверный PIN.';
}
$('#pinButton').addEventListener('click',handlePin);
$('#pinInput').addEventListener('keydown',e => { if (e.key === 'Enter') handlePin(); });
$('#lockBtn').addEventListener('click',() => showLock('unlock'));

function clearSensitive(confirmFirst = false) {
  if (confirmFirst && !confirm('Очистить персональные данные текущего участника?')) return;
  const preserve = new Set(['carModel','carYear','chassis','managerName','poaNumber','poaDate','poaValidUntil','companyRepRole','companyRepName','companyRepPoaNo','companyRepPoaDate','vin','plate','bodyNumber','pts','sts','testDriveDate']);
  fields.forEach(el => { if (!preserve.has(el.dataset.f)) el.value = ''; el.classList.remove('ocr-filled'); });
  checks.forEach(el => el.checked = false);
  state.lastSensitiveEdit = Date.now();
  setStatus('#ocrStatus',state.textDetectorAvailable ? 'Данные клиента очищены. Локальный OCR готов.' : 'Данные клиента очищены. OCR браузера недоступен, поля можно заполнить вручную.');
  render();
}
$('#clearBtn').addEventListener('click',() => clearSensitive(true));
setInterval(() => {
  if (!state.pinHash || state.locked) return;
  const now = Date.now();
  const lockMs = Number($('#lockMinutes').value) * 60000;
  const wipeMs = Number($('#wipeMinutes').value) * 60000;
  if (now - state.lastSensitiveEdit > wipeMs) { clearSensitive(false); showLock('unlock'); return; }
  if (now - state.lastActivity > lockMs) showLock('unlock');
},15000);
window.addEventListener('beforeunload',() => {
  fields.forEach(el => el.value = '');
  checks.forEach(el => el.checked = false);
  state.pinHash = null;
  state.templates.clear();
  state.outputHandle = null;
});

async function readTemplateFilesFromDirectory(dirHandle) {
  let target = dirHandle;
  try {
    const nested = await dirHandle.getDirectoryHandle('templates');
    target = nested;
  } catch (_) {}
  const map = new Map();
  for (const [kind,name] of Object.entries(TEMPLATE_NAMES)) {
    const fileHandle = await target.getFileHandle(name);
    const file = await fileHandle.getFile();
    map.set(kind,file);
  }
  return map;
}
async function chooseTemplates() {
  if (!window.showDirectoryPicker) {
    setStatus('#templatesStatus','Этот браузер не даёт выбрать папку. Используйте выбор трёх DOCX ниже.','warn');
    return;
  }
  try {
    const dir = await window.showDirectoryPicker({mode:'read'});
    state.templates = await readTemplateFilesFromDirectory(dir);
    setStatus('#templatesStatus','Загружены локально 3 шаблона. На сайт они не отправлялись.','ok');
    render();
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    setStatus('#templatesStatus','Не найдены poa_template.docx, questionnaire_template.docx и consent_template.docx. Выберите папку templates из TestDrive_Doc.','warn');
  }
}
$('#chooseTemplatesBtn').addEventListener('click',chooseTemplates);
$('#templateFilesInput').addEventListener('change',e => {
  const byName = new Map([...e.target.files].map(f => [f.name.toLowerCase(),f]));
  const map = new Map();
  Object.entries(TEMPLATE_NAMES).forEach(([kind,name]) => { const f = byName.get(name.toLowerCase()); if (f) map.set(kind,f); });
  if (map.size === 3) {
    state.templates = map;
    setStatus('#templatesStatus','Выбраны 3 локальных шаблона. На сайт они не отправлялись.','ok');
  } else setStatus('#templatesStatus','Нужно выбрать именно 3 файла: poa_template.docx, questionnaire_template.docx, consent_template.docx.','warn');
  e.target.value = '';
  render();
});

async function chooseOutput() {
  if (!window.showDirectoryPicker) {
    setStatus('#outputStatus','Прямое сохранение в папку недоступно. Используйте кнопку «Скачать ZIP».','warn');
    return;
  }
  try {
    state.outputHandle = await window.showDirectoryPicker({mode:'readwrite'});
    $('#localFolderConfirm').checked = false;
    setStatus('#outputStatus',`Выбрана папка «${state.outputHandle.name}». Подтвердите, что она не синхронизируется с облаком.`,'warn');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    setStatus('#outputStatus','Не удалось выбрать папку. Используйте ZIP.','warn');
  }
}
$('#chooseOutputBtn').addEventListener('click',chooseOutput);
$('#localFolderConfirm').addEventListener('change',() => {
  if (state.outputHandle && $('#localFolderConfirm').checked) setStatus('#outputStatus',`Папка «${state.outputHandle.name}» подтверждена как локальная.`,'ok');
  else if (state.outputHandle) setStatus('#outputStatus',`Папка «${state.outputHandle.name}» выбрана, но локальность не подтверждена.`,'warn');
});

function xmlEscape(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function replacePlaceholders(xml, ctx) {
  let out = xml;
  for (const [key,value] of Object.entries(ctx)) {
    const token = `{{${key}}}`;
    if (out.includes(token)) out = out.split(token).join(xmlEscape(value));
  }
  return out;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function u16(view,off,v){view.setUint16(off,v,true)}
function u32(view,off,v){view.setUint32(off,v >>> 0,true)}
function concatBytes(chunks) {
  const len = chunks.reduce((a,b) => a + b.length,0);
  const out = new Uint8Array(len);
  let off = 0; chunks.forEach(b => { out.set(b,off); off += b.length; });
  return out;
}
function dosDateTime(date = new Date()) {
  const year = Math.max(1980,date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds()/2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth()+1) << 5) | date.getDate();
  return {time:dosTime,date:dosDate};
}
async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function readZip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const dv = new DataView(arrayBuffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0,bytes.length - 65557); i--) {
    if (dv.getUint32(i,true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('DOCX повреждён: не найден ZIP-каталог.');
  const count = dv.getUint16(eocd + 10,true);
  const cdOffset = dv.getUint32(eocd + 16,true);
  let p = cdOffset;
  const entries = [];
  const decoder = new TextDecoder('utf-8');
  for (let i = 0; i < count; i++) {
    if (dv.getUint32(p,true) !== 0x02014b50) throw new Error('DOCX повреждён: ошибка ZIP-каталога.');
    const flags = dv.getUint16(p+8,true);
    const method = dv.getUint16(p+10,true);
    const crc = dv.getUint32(p+16,true);
    const csize = dv.getUint32(p+20,true);
    const usize = dv.getUint32(p+24,true);
    const nameLen = dv.getUint16(p+28,true);
    const extraLen = dv.getUint16(p+30,true);
    const commentLen = dv.getUint16(p+32,true);
    const localOffset = dv.getUint32(p+42,true);
    const nameBytes = bytes.slice(p+46,p+46+nameLen);
    const name = decoder.decode(nameBytes);
    if (dv.getUint32(localOffset,true) !== 0x04034b50) throw new Error('DOCX повреждён: ошибка локального ZIP-заголовка.');
    const localNameLen = dv.getUint16(localOffset+26,true);
    const localExtraLen = dv.getUint16(localOffset+28,true);
    const dataOffset = localOffset + 30 + localNameLen + localExtraLen;
    const packed = bytes.slice(dataOffset,dataOffset+csize);
    let data;
    if (method === 0) data = packed;
    else if (method === 8) data = await inflateRaw(packed);
    else throw new Error(`DOCX использует неподдерживаемый метод ZIP ${method}.`);
    if (usize !== data.length && !(flags & 0x08)) throw new Error(`Ошибка размера файла внутри DOCX: ${name}`);
    if (crc32(data) !== crc) throw new Error(`Ошибка контрольной суммы внутри DOCX: ${name}`);
    entries.push({name,data});
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
function writeZip(entries) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  const dt = dosDateTime();
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    u32(lv,0,0x04034b50); u16(lv,4,20); u16(lv,6,0x0800); u16(lv,8,0); u16(lv,10,dt.time); u16(lv,12,dt.date);
    u32(lv,14,crc); u32(lv,18,data.length); u32(lv,22,data.length); u16(lv,26,name.length); u16(lv,28,0); local.set(name,30);
    locals.push(local,data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv,0,0x02014b50); u16(cv,4,20); u16(cv,6,20); u16(cv,8,0x0800); u16(cv,10,0); u16(cv,12,dt.time); u16(cv,14,dt.date);
    u32(cv,16,crc); u32(cv,20,data.length); u32(cv,24,data.length); u16(cv,28,name.length); u16(cv,30,0); u16(cv,32,0); u16(cv,34,0); u16(cv,36,0); u32(cv,38,0); u32(cv,42,offset); central.set(name,46);
    centrals.push(central);
    offset += local.length + data.length;
  }
  const centralBytes = concatBytes(centrals);
  const localBytes = concatBytes(locals);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  u32(ev,0,0x06054b50); u16(ev,4,0); u16(ev,6,0); u16(ev,8,entries.length); u16(ev,10,entries.length);
  u32(ev,12,centralBytes.length); u32(ev,16,localBytes.length); u16(ev,20,0);
  return concatBytes([localBytes,centralBytes,eocd]);
}
async function fillDocx(file, ctx) {
  const entries = await readZip(await file.arrayBuffer());
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  let replacements = 0;
  for (const entry of entries) {
    if (!entry.name.toLowerCase().endsWith('.xml')) continue;
    let text = decoder.decode(entry.data);
    const before = text;
    text = replacePlaceholders(text,ctx);
    if (text !== before) {
      entry.data = encoder.encode(text);
      replacements++;
    }
  }
  if (!replacements) throw new Error(`В шаблоне ${file.name} не найдены поля {{...}}. Проверьте, что выбран шаблон из TestDrive_Doc.`);
  return writeZip(entries);
}
async function buildDocuments() {
  if (state.busy) throw new Error('Формирование уже выполняется.');
  if (state.templates.size !== 3) throw new Error('Сначала выберите три локальных Word-шаблона.');
  const missing = validateData();
  if (missing.length) throw new Error('Не заполнено: ' + missing.slice(0,8).join(', ') + (missing.length > 8 ? '...' : ''));
  state.busy = true;
  try {
    const ctx = buildContext();
    const docs = new Map();
    for (const kind of ['poa','questionnaire','consent']) {
      const bytes = await fillDocx(state.templates.get(kind),ctx);
      docs.set(kind,bytes);
    }
    return docs;
  } finally { state.busy = false; }
}
function safeFilePart(s) {
  return safeText(s,100).replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').trim() || 'Участник';
}
async function saveBytesToHandle(dirHandle,name,bytes) {
  const fh = await dirHandle.getFileHandle(name,{create:true});
  const writable = await fh.createWritable();
  try { await writable.write(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})); }
  finally { await writable.close(); }
}
async function saveDocumentsToFolder(docs) {
  if (!state.outputHandle) throw new Error('Папка хранения не выбрана.');
  if (!$('#localFolderConfirm').checked) throw new Error('Подтвердите, что выбранная папка локальная и не синхронизируется с облаком.');
  const root = await state.outputHandle.getDirectoryHandle('Тестдрайв',{create:true});
  const d = getData();
  const folderName = safeFilePart(`${d.fullName} ${formatDateIso(d.testDriveDate) || formatDateIso(new Date().toISOString().slice(0,10))}`);
  const participant = await root.getDirectoryHandle(folderName,{create:true});
  for (const kind of ['poa','questionnaire','consent']) await saveBytesToHandle(participant,OUTPUT_NAMES[kind],docs.get(kind));
  return `Тестдрайв / ${folderName}`;
}
function downloadBlob(blob,name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url),30000);
}
function buildDocsZip(docs) {
  const entries = ['poa','questionnaire','consent'].map(kind => ({name:OUTPUT_NAMES[kind],data:docs.get(kind)}));
  return writeZip(entries);
}
$('#saveDocsBtn').addEventListener('click',async() => {
  try {
    setStatus('#exportStatus','Формирую 3 DOCX локально в браузере...','busy');
    const docs = await buildDocuments();
    const folder = await saveDocumentsToFolder(docs);
    setStatus('#exportStatus',`Готово. 3 документа сохранены в ${folder}.`,'ok');
  } catch (e) { setStatus('#exportStatus',e.message || 'Не удалось сформировать документы.','warn'); }
});
$('#downloadZipBtn').addEventListener('click',async() => {
  try {
    setStatus('#exportStatus','Формирую ZIP локально в браузере...','busy');
    const docs = await buildDocuments();
    const zip = buildDocsZip(docs);
    const d = getData();
    const name = `TestDrive_${safeFilePart(d.fullName)}_${(d.testDriveDate || new Date().toISOString().slice(0,10))}.zip`;
    downloadBlob(new Blob([zip],{type:'application/zip'}),name);
    setStatus('#exportStatus','ZIP сформирован локально. После передачи удалите лишние копии документов.','ok');
  } catch (e) { setStatus('#exportStatus',e.message || 'Не удалось сформировать ZIP.','warn'); }
});

function ocrDateToIso(value) {
  const m = String(value||'').match(/(?<!\d)(\d{2})[.\-/](\d{2})[.\-/](\d{4})(?!\d)/);
  if (!m) return '';
  const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
  const dt = new Date(Date.UTC(y,mo-1,d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo-1 || dt.getUTCDate() !== d || y < 1900 || y > 2100) return '';
  return `${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function normalizeNamePiece(value) {
  const v = safeText(value,80).replace(/[^А-Яа-яЁёA-Za-z\- ]/g,' ').replace(/\s{2,}/g,' ').trim();
  if (!v) return '';
  return v.toLowerCase().split(/([ -])/).map(p => /^[а-яёa-z]/i.test(p) ? p.charAt(0).toUpperCase()+p.slice(1) : p).join('');
}
function getOcrLines(text) { return String(text||'').split(/\r?\n/).map(x => safeText(x,260)).filter(Boolean); }
function findOcrLabelValue(lines, regexes, maxNext=1) {
  for (let i=0;i<lines.length;i++) {
    const line=lines[i];
    for (const regex of regexes) {
      const m=line.match(regex);
      if (m) {
        const rest=safeText(m[1]||'',180);
        if (rest && rest.length>=2) return rest;
        for (let j=1;j<=maxNext && i+j<lines.length;j++) if (safeText(lines[i+j],180)) return safeText(lines[i+j],180);
      }
    }
  }
  return '';
}
function parsePassportOcr(text) {
  const lines=getOcrLines(text), compact=safeText(text,20000); const fields={},warnings=[];
  const surname=normalizeNamePiece(findOcrLabelValue(lines,[/ФАМИЛИ[ЯИ]\s*[:.\-]?\s*(.*)$/i]));
  const name=normalizeNamePiece(findOcrLabelValue(lines,[/(?<!ФАМИЛ)\bИМЯ\b\s*[:.\-]?\s*(.*)$/i]));
  const patronymic=normalizeNamePiece(findOcrLabelValue(lines,[/ОТЧЕСТВ[ОА]\s*[:.\-]?\s*(.*)$/i]));
  if (surname && name) fields.fullName=`${surname} ${name} ${patronymic}`.trim();
  let m=compact.match(/ДАТА\s+РОЖДЕНИ[ЯИ]\D{0,25}(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i); if(m) fields.birthDate=ocrDateToIso(m[1]);
  m=compact.match(/ДАТА\s+ВЫДАЧИ\D{0,25}(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i); if(m) fields.passportIssueDate=ocrDateToIso(m[1]);
  m=compact.match(/КОД\s+ПОДРАЗДЕЛЕНИ[ЯИ]\D{0,20}(\d{3})\s*[- ]?\s*(\d{3})/i); if(m) fields.passportCode=`${m[1]}-${m[2]}`;
  m=compact.match(/(?<!\d)(\d{2})\s*(\d{2})\s*(?:№|N)?\s*(\d{6})(?!\d)/i); if(m){fields.passportSeries=m[1]+m[2];fields.passportNumber=m[3];}
  m=compact.match(/ПАСПОРТ\s+ВЫДАН\s+(.{4,260}?)(?=ДАТА\s+ВЫДАЧИ|КОД\s+ПОДРАЗДЕЛЕНИ[ЯИ]|ЛИЧНЫЙ\s+КОД|ПОДПИСЬ|$)/i); if(m) fields.passportIssuedBy=safeText(m[1],300);
  m=compact.match(/(?:МЕСТО\s+ЖИТЕЛЬСТВА|ЗАРЕГИСТРИРОВАН(?:А|О)?|АДРЕС\s+РЕГИСТРАЦИИ)\s*[:.\-]?\s*(.{5,300}?)(?=ДАТА\s+РЕГИСТРАЦИИ|ПОДПИСЬ|СНЯТ|$)/i); if(m) fields.registrationAddress=safeText(m[1],400); else warnings.push('Адрес регистрации может быть на другой странице паспорта.');
  if (/\bМУЖ\.?\b|\bМУЖСК/i.test(compact)) fields.salutation='Господин'; else if (/\bЖЕН\.?\b|\bЖЕНСК/i.test(compact)) fields.salutation='Госпожа';
  if (!fields.passportSeries || !fields.passportNumber) warnings.push('Серия и номер паспорта распознаны неуверенно. Проверьте вручную.');
  return {fields,warnings};
}
function parseLicenseOcr(text) {
  const lines=getOcrLines(text), compact=safeText(text,20000); const fields={},warnings=[];
  let m=compact.match(/(?:^|\s)5[.\s:]\D{0,30}(\d{2})\s*(\d{2})\s*(\d{6})(?!\d)/i); if(!m) m=compact.match(/(?<!\d)(\d{2})\s*(\d{2})\s*(\d{6})(?!\d)/); if(m) fields.driverLicense=`${m[1]} ${m[2]} ${m[3]}`;
  m=compact.match(/4\s*[AА]\s*[.\s:]\D{0,15}(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i); if(m) fields.driverLicenseIssueDate=ocrDateToIso(m[1]);
  m=compact.match(/4\s*[CС]\s*[.\s:]\s*(.{2,100}?)(?=\s+5[.\s:]|\s+5\s|$)/i); if(m) fields.driverIssuedBy=safeText(m[1],140);
  const catLine=findOcrLabelValue(lines,[/^9\s*[:.\-]?\s*(.*)$/i]); if(catLine){const cats=[...catLine.toUpperCase().matchAll(/(?<![A-ZА-Я])(A1|A|B1|BE|B|C1E|C1|CE|C|D1E|D1|DE|D|M|TM|TB)(?![A-ZА-Я])/g)].map(x=>x[1]); if(cats.length) fields.driverCategory=[...new Set(cats)].join(', ');}
  m=compact.match(/(?:^|\s)3[.\s:]\D{0,50}(\d{2}[.\-/]\d{2}[.\-/]\d{4})/i); if(m) fields.birthDate=ocrDateToIso(m[1]);
  const s1=normalizeNamePiece(findOcrLabelValue(lines,[/^1\s*[:.\-]?\s*(.*)$/i])); const s2=normalizeNamePiece(findOcrLabelValue(lines,[/^2\s*[:.\-]?\s*(.*)$/i])); if(s1&&s2&&/[А-Яа-яЁё]/.test(s1+s2)) fields.fullName=`${s1} ${s2}`;
  if(!fields.driverLicense) warnings.push('Номер ВУ не удалось уверенно выделить.');
  return {fields,warnings};
}
async function initTextDetector() {
  try {
    if (!('TextDetector' in window)) throw new Error('нет API');
    if (typeof TextDetector.availability === 'function' && typeof TextDetector.create === 'function') {
      const availability = await TextDetector.availability({languages:['ru']});
      if (availability === 'unavailable') throw new Error('нет русского OCR');
      state.textDetector = await TextDetector.create({languages:['ru']});
    } else state.textDetector = new TextDetector();
    state.textDetectorAvailable = true;
    setStatus('#ocrStatus','Локальный OCR браузера доступен. Фото не будут отправляться в сеть.','ok');
  } catch (_) {
    state.textDetector = null;
    state.textDetectorAvailable = false;
    setStatus('#ocrStatus','Локальный OCR браузера недоступен. Облачный OCR отключён из соображений безопасности. Заполните поля вручную или используйте десктопную версию.','warn');
  }
}
async function detectText(file) {
  if (!state.textDetectorAvailable || !state.textDetector) throw new Error('Локальный OCR браузера недоступен.');
  if (!file || file.size > 18*1024*1024) throw new Error('Фото не выбрано или превышает 18 МБ.');
  const bitmap = await createImageBitmap(file);
  try {
    const results = await state.textDetector.detect(bitmap);
    return results.map(x => safeText(x.rawValue,500)).filter(Boolean).join('\n');
  } finally { if (bitmap.close) bitmap.close(); }
}
function applyOcrFields(recognized, source) {
  let applied=0,conflicts=0;
  Object.entries(recognized||{}).forEach(([name,value]) => {
    const el=document.querySelector(`[data-f="${name}"]`); if(!el || !value) return;
    const incoming=String(value).trim(),current=el.value.trim();
    if(!current || current===incoming || (source==='license'&&name==='driverCategory')) { el.value=incoming;el.classList.add('ocr-filled');applied++; }
    else conflicts++;
  });
  markActivity(true);render();return {applied,conflicts};
}
async function handlePassport(files) {
  const list=[...files].slice(0,3); if(!list.length)return;
  if(!state.textDetectorAvailable){setStatus('#ocrStatus','OCR браузера недоступен. Фото не отправлено. Заполните паспорт вручную.','warn');$('#passportPhoto').value='';return;}
  let applied=0,conflicts=0,warnings=[];
  try {
    for(let i=0;i<list.length;i++){
      setStatus('#ocrStatus',`Распознаю паспорт локально: ${i+1} из ${list.length}...`,'busy');
      const text=await detectText(list[i]); const parsed=parsePassportOcr(text); const a=applyOcrFields(parsed.fields,'passport'); applied+=a.applied;conflicts+=a.conflicts;warnings.push(...parsed.warnings);
    }
    let msg=`Паспорт обработан локально. Заполнено полей: ${applied}. Обязательно сверьте жёлтые поля с оригиналом.`; if(conflicts)msg+=` ${conflicts} заполненных ранее полей не перезаписаны.`; if(warnings.length)msg+=' '+[...new Set(warnings)].join(' ');
    setStatus('#ocrStatus',msg,'ok');
  } catch(e){setStatus('#ocrStatus',e.message || 'Не удалось распознать паспорт.','warn');} finally { $('#passportPhoto').value=''; }
}
async function handleLicense(file) {
  if(!file)return;
  if(!state.textDetectorAvailable){setStatus('#ocrStatus','OCR браузера недоступен. Фото не отправлено. Заполните ВУ вручную.','warn');$('#licensePhoto').value='';return;}
  try {
    setStatus('#ocrStatus','Распознаю ВУ локально...','busy'); const text=await detectText(file); const parsed=parseLicenseOcr(text); const a=applyOcrFields(parsed.fields,'license');
    let msg=`ВУ обработано локально. Заполнено полей: ${a.applied}. Обязательно сверьте жёлтые поля с оригиналом.`; if(a.conflicts)msg+=` ${a.conflicts} заполненных ранее полей не перезаписаны.`; if(parsed.warnings.length)msg+=' '+parsed.warnings.join(' '); setStatus('#ocrStatus',msg,'ok');
  } catch(e){setStatus('#ocrStatus',e.message || 'Не удалось распознать ВУ.','warn');} finally { $('#licensePhoto').value=''; }
}
$('#passportPhoto').addEventListener('change',e => handlePassport(e.target.files));
$('#licensePhoto').addEventListener('change',e => handleLicense(e.target.files?.[0]));

function initCompatibility() {
  const parts=[];
  parts.push(window.showDirectoryPicker ? 'папки ✓' : 'папки: ZIP');
  parts.push(typeof DecompressionStream === 'function' ? 'DOCX ✓' : 'DOCX ✕');
  $('#compatStatus').textContent=parts.join(' · ');
}
const today = new Date().toISOString().slice(0,10);
setField('testDriveDate',today); setField('poaDate',today);
initCompatibility(); initTextDetector(); render(); showLock('create');
