'use strict';

const APP_VERSION = '4.4';
const PAGE_COUNT = 9;
const MANAGER_STORAGE_KEY = 'atom_kp_saved_managers_v1';
const PDF_PAGE_WIDTH = 1190.13;
const PDF_PAGE_HEIGHT = 1684.12;

const COLOR_ORDER = [
  'Атом — сине-зелёный, фирменный бирюзовый',
  'Фотон — белый',
  'Нейтрон — чёрный',
  'Герц — фиолетовый',
  'Квант — светло-голубой'
];

const state = { articles: [], templateManifest: {}, selectedArticle: null, busy: false, savedManagers: [] };
const el = {};

const ARTICLE_RULES = Object.freeze({
  purpose: 'Личное пользование',
  purposeCode: 'F1',
  modifications: ['C3', 'C5'],
  equipmentCodes: Object.freeze({
    'Комбинированный черный|Нет': 'CB',
    'Комбинированный черный|Да': 'CB2',
    'Комбинированный бежевый|Нет': 'CH',
    'Комбинированный бежевый|Да': 'CH2'
  }),
  colorCodes: Object.freeze({
    'Сине-зелёный, фирменный бирюзовый': 'B9-1',
    'Белый': 'W1-1',
    'Чёрный': 'Z4',
    'Фиолетовый': 'V7-1',
    'Светло-голубой': 'G3-1'
  }),
  templateKeys: Object.freeze({
    'Сине-зелёный, фирменный бирюзовый': 'personal_turquoise',
    'Белый': 'personal_white',
    'Чёрный': 'personal_black',
    'Фиолетовый': 'personal_purple',
    'Светло-голубой': 'personal_light_blue'
  })
});

window.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheElements();
  setDefaultDates();
  loadSavedManagers();
  refreshManagerProfiles();
  attachEvents();
  try {
    const [articlesResponse, manifestResponse] = await Promise.all([
      fetch(`data/articles.json?v=${APP_VERSION}`, { cache: 'no-store' }),
      fetch(`templates/manifest.json?v=${APP_VERSION}`, { cache: 'no-store' })
    ]);
    if (!articlesResponse.ok) throw new Error('Не удалось загрузить справочник артикулов.');
    if (!manifestResponse.ok) throw new Error('Не удалось загрузить список шаблонов PDF.');
    state.articles = await articlesResponse.json();
    state.templateManifest = await manifestResponse.json();
    validateArticleCatalog(state.articles);
    initialiseSelectors();
    setMessage('Генератор PDF готов к работе.', 'success');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Не удалось запустить генератор.', 'error');
  }
}

function cacheElements() {
  const ids = ['purpose','modification','bodyColor','interiorColor','tint','article','templateInfo','articleDecode','client','basePrice','specialPrice','modelYear','deliveryDate','validTo','manager','phone','email','managerProfile','deleteManagerProfile','managerSaveInfo','generateButton','progressArea','progressBar','progressText','message'];
  for (const id of ids) el[id] = document.getElementById(id);
}

function setDefaultDates() {
  const today = new Date();
  const delivery = new Date(today); delivery.setMonth(delivery.getMonth() + 3);
  const valid = new Date(today); valid.setDate(valid.getDate() + 14);
  el.deliveryDate.value = toDateInput(delivery);
  el.validTo.value = toDateInput(valid);
}

function attachEvents() {
  el.purpose.addEventListener('change', () => refreshAfter('purpose'));
  el.modification.addEventListener('change', () => refreshAfter('modification'));
  el.bodyColor.addEventListener('change', () => refreshAfter('bodyColor'));
  el.interiorColor.addEventListener('change', () => refreshAfter('interiorColor'));
  el.tint.addEventListener('change', updateSelectedArticle);
  el.managerProfile.addEventListener('change', applySelectedManagerProfile);
  el.deleteManagerProfile.addEventListener('click', deleteSelectedManagerProfile);
  for (const field of [el.manager, el.phone, el.email]) {
    field.addEventListener('input', markManagerAsEdited);
  }
  el.generateButton.addEventListener('click', generatePdf);
}

function initialiseSelectors() {
  setOptions(el.purpose, unique(state.articles.map(item => item.purpose)));
  refreshAfter('purpose');
}


function loadSavedManagers() {
  try {
    const raw = localStorage.getItem(MANAGER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    state.savedManagers = Array.isArray(parsed)
      ? parsed.filter(item => item && item.id && item.name && item.phone && item.email)
      : [];
  } catch (error) {
    console.warn('Не удалось прочитать сохранённых менеджеров.', error);
    state.savedManagers = [];
  }
}

function persistSavedManagers() {
  try {
    localStorage.setItem(MANAGER_STORAGE_KEY, JSON.stringify(state.savedManagers));
    return true;
  } catch (error) {
    console.warn('Не удалось сохранить менеджера в браузере.', error);
    return false;
  }
}

function refreshManagerProfiles(selectedId = '') {
  const select = el.managerProfile;
  if (!select) return;
  select.innerHTML = '';
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = state.savedManagers.length ? 'Новый менеджер' : 'Сохранённых менеджеров пока нет';
  select.appendChild(emptyOption);

  const sorted = [...state.savedManagers].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  for (const profile of sorted) {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = `${profile.name} · ${profile.phone}`;
    select.appendChild(option);
  }
  select.value = state.savedManagers.some(item => item.id === selectedId) ? selectedId : '';
  el.deleteManagerProfile.disabled = !select.value;
}

function applySelectedManagerProfile() {
  const profile = state.savedManagers.find(item => item.id === el.managerProfile.value);
  el.deleteManagerProfile.disabled = !profile;
  if (!profile) return;
  el.manager.value = profile.name;
  el.phone.value = profile.phone;
  el.email.value = profile.email;
  el.managerSaveInfo.textContent = `Выбран сохранённый менеджер: ${profile.name}.`;
}

function markManagerAsEdited() {
  if (el.managerProfile.value) {
    el.managerProfile.value = '';
    el.deleteManagerProfile.disabled = true;
  }
  el.managerSaveInfo.textContent = 'Менеджер сохранится автоматически после успешного формирования PDF.';
}

function managerProfileId(profile) {
  return `${profile.name}|${profile.phone}|${profile.email}`.toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ').trim();
}

function saveManagerProfile(input) {
  const profile = {
    name: input.manager.trim(),
    phone: input.phone.trim(),
    email: input.email.trim()
  };
  if (!profile.name || !profile.phone || !profile.email) {
    el.managerSaveInfo.textContent = 'Чтобы сохранить менеджера, заполните ФИО, телефон и email.';
    return false;
  }

  const emailKey = profile.email.toLocaleLowerCase('ru-RU');
  const phoneKey = profile.phone.replace(/\D/g, '');
  const existingIndex = state.savedManagers.findIndex(item =>
    item.email.toLocaleLowerCase('ru-RU') === emailKey ||
    (item.name.toLocaleLowerCase('ru-RU') === profile.name.toLocaleLowerCase('ru-RU') && item.phone.replace(/\D/g, '') === phoneKey)
  );
  const saved = { ...profile, id: managerProfileId(profile), updatedAt: new Date().toISOString() };
  if (existingIndex >= 0) state.savedManagers.splice(existingIndex, 1, saved);
  else state.savedManagers.push(saved);

  if (!persistSavedManagers()) {
    el.managerSaveInfo.textContent = 'Браузер запретил сохранение менеджера. Проверьте настройки хранения данных.';
    return false;
  }
  refreshManagerProfiles(saved.id);
  el.managerSaveInfo.textContent = `Менеджер ${saved.name} сохранён в этом браузере.`;
  return true;
}

function deleteSelectedManagerProfile() {
  const id = el.managerProfile.value;
  const profile = state.savedManagers.find(item => item.id === id);
  if (!profile) return;
  if (!window.confirm(`Удалить менеджера «${profile.name}» из сохранённого списка?`)) return;
  state.savedManagers = state.savedManagers.filter(item => item.id !== id);
  persistSavedManagers();
  refreshManagerProfiles();
  el.managerSaveInfo.textContent = `Менеджер ${profile.name} удалён из сохранённого списка.`;
}

function refreshAfter(level) {
  const purposeRows = state.articles.filter(item => item.purpose === el.purpose.value);
  if (level === 'purpose') setOptions(el.modification, unique(purposeRows.map(item => item.modification)));
  const modRows = purposeRows.filter(item => item.modification === el.modification.value);
  if (level === 'purpose' || level === 'modification') {
    const colors = unique(modRows.map(item => item.bodyColorDisplay));
    colors.sort((a,b) => orderIndex(COLOR_ORDER,a) - orderIndex(COLOR_ORDER,b));
    setOptions(el.bodyColor, colors);
  }
  const colorRows = modRows.filter(item => item.bodyColorDisplay === el.bodyColor.value);
  if (['purpose','modification','bodyColor'].includes(level)) setOptions(el.interiorColor, unique(colorRows.map(item => item.interiorColor)));
  const interiorRows = colorRows.filter(item => item.interiorColor === el.interiorColor.value);
  if (['purpose','modification','bodyColor','interiorColor'].includes(level)) setOptions(el.tint, unique(interiorRows.map(item => item.tint)), ['Нет','Да']);
  updateSelectedArticle();
}

function updateSelectedArticle() {
  state.selectedArticle = state.articles.find(item =>
    item.purpose === el.purpose.value && item.modification === el.modification.value && item.bodyColorDisplay === el.bodyColor.value && item.interiorColor === el.interiorColor.value && item.tint === el.tint.value
  ) || null;
  if (!state.selectedArticle) {
    el.article.textContent = 'Для выбранного сочетания артикул не найден';
    el.templateInfo.textContent = '';
    el.articleDecode.textContent = '';
    el.generateButton.disabled = true;
    return;
  }
  const row = state.selectedArticle;
  el.article.textContent = row.article;
  el.templateInfo.textContent = `Будет сформировано полное КП PDF: ${row.bodyColorDisplay}`;
  el.articleDecode.textContent = articleBreakdown(row);
  el.generateButton.disabled = state.busy;
}

function articleBreakdown(row) {
  return [
    'АМ — модель АТОМ; A1 — базовый код модели.',
    `F1 — назначение: ${row.purpose}; ${row.modification} — модификация.`,
    `${row.equipmentCode} — комплектация: салон ${row.interiorColor}; тонировка: ${row.tint}.`,
    `${row.colorCode} — цвет кузова: ${row.bodyColorDisplay}.`
  ].join('\n');
}

function expectedArticleFor(row) {
  const equipmentCode = ARTICLE_RULES.equipmentCodes[`${row.interiorColor}|${row.tint}`];
  const colorCode = ARTICLE_RULES.colorCodes[row.bodyColor];
  if (!equipmentCode || !colorCode) return null;
  return `АМ-A1${ARTICLE_RULES.purposeCode}${row.modification}-${equipmentCode}\\${colorCode}`;
}

function validateArticleRow(row, index = -1) {
  const prefix = index >= 0 ? `Строка справочника ${index + 1}` : 'Выбранный артикул';
  if (row.purpose !== ARTICLE_RULES.purpose) throw new Error(`${prefix}: неверное назначение.`);
  if (!ARTICLE_RULES.modifications.includes(row.modification)) throw new Error(`${prefix}: неверная модификация ${row.modification}.`);

  const expectedEquipment = ARTICLE_RULES.equipmentCodes[`${row.interiorColor}|${row.tint}`];
  if (!expectedEquipment) throw new Error(`${prefix}: недопустимое сочетание салона и тонировки.`);
  if (row.equipmentCode !== expectedEquipment) throw new Error(`${prefix}: код комплектации должен быть ${expectedEquipment}, получено ${row.equipmentCode}.`);

  const expectedColor = ARTICLE_RULES.colorCodes[row.bodyColor];
  if (!expectedColor) throw new Error(`${prefix}: неизвестный цвет кузова.`);
  if (row.colorCode !== expectedColor) throw new Error(`${prefix}: код цвета должен быть ${expectedColor}, получено ${row.colorCode}.`);

  const expectedTemplate = ARTICLE_RULES.templateKeys[row.bodyColor];
  if (row.templateKey !== expectedTemplate) throw new Error(`${prefix}: неверный цветовой шаблон.`);

  const expectedArticle = expectedArticleFor(row);
  if (row.article !== expectedArticle) throw new Error(`${prefix}: ожидался артикул ${expectedArticle}, получено ${row.article}.`);
  return true;
}

function validateArticleCatalog(rows) {
  if (!Array.isArray(rows)) throw new Error('Справочник артикулов имеет неверный формат.');
  const expectedCount = ARTICLE_RULES.modifications.length * Object.keys(ARTICLE_RULES.colorCodes).length * 2 * 2;
  if (rows.length !== expectedCount) throw new Error(`В справочнике должно быть ${expectedCount} комбинаций, найдено ${rows.length}.`);

  const keys = new Set();
  rows.forEach((row, index) => {
    validateArticleRow(row, index);
    const key = [row.purpose, row.modification, row.bodyColor, row.interiorColor, row.tint].join('|');
    if (keys.has(key)) throw new Error(`В справочнике найден повтор комбинации: ${key}.`);
    keys.add(key);
  });

  const interiors = ['Комбинированный черный', 'Комбинированный бежевый'];
  const tints = ['Нет', 'Да'];
  for (const modification of ARTICLE_RULES.modifications) {
    for (const bodyColor of Object.keys(ARTICLE_RULES.colorCodes)) {
      for (const interiorColor of interiors) {
        for (const tint of tints) {
          const key = [ARTICLE_RULES.purpose, modification, bodyColor, interiorColor, tint].join('|');
          if (!keys.has(key)) throw new Error(`В справочнике отсутствует комбинация: ${key}.`);
        }
      }
    }
  }
  return true;
}

async function generatePdf() {
  if (!state.selectedArticle || state.busy) return;
  try {
    validateInputs();
    setBusy(true);
    setMessage('', '');
    const row = state.selectedArticle;
    validateArticleRow(row);
    const input = collectInputData();
    const template = state.templateManifest[row.templateKey];
    if (!template || !template.basePath) throw new Error('Для выбранного цвета не найден шаблон PDF.');

    const jpegPages = [];
    for (let pageNo = 1; pageNo <= PAGE_COUNT; pageNo += 1) {
      setProgress(4 + Math.round((pageNo - 1) / PAGE_COUNT * 74), `Подготовка страницы ${pageNo} из ${PAGE_COUNT}...`);
      const path = `${template.basePath}/page-${pageNo}.jpg?v=${APP_VERSION}`;
      if ([1,8,9].includes(pageNo)) jpegPages.push(await renderDynamicPage(path, pageNo, row, input));
      else jpegPages.push(await fetchBytes(path));
    }

    setProgress(82, 'Сборка PDF...');
    const pdfBytes = buildImagePdf(jpegPages, 1819, 2573, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = buildFileName(row);
    downloadBlob(blob, fileName);
    saveManagerProfile(input);
    setProgress(100, 'Готово. PDF отправлен на скачивание.');
    setMessage(`КП сформировано: ${fileName}`, 'success');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Не удалось сформировать PDF.', 'error');
    setProgress(0, 'Формирование остановлено.');
  } finally {
    setBusy(false);
  }
}

async function renderDynamicPage(path, pageNo, row, input) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Не удалось загрузить страницу шаблона: ${path}`);
  const blob = await response.blob();
  const image = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (pageNo === 1) drawPage1(ctx, input);
  if (pageNo === 8) drawPage8(ctx, row, input);
  if (pageNo === 9) drawPage9(ctx, input);

  if (typeof image.close === 'function') image.close();
  const outBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  return new Uint8Array(await outBlob.arrayBuffer());
}

function drawPage1(ctx, input) {
  fillWhite(ctx, 70, 455, 1660, 80);
  drawFittedText(ctx, `Уважаемый/ая ${input.client || 'КОНТАКТНОЕ ЛИЦО'}!`, { x:80, y:458, w:1635, h:74, size:38, minSize:22, align:'left' });
}

function drawPage8(ctx, row, input) {
  // Код модели, модельный год и версия. Полностью очищаем исходные значения.
  fillWhite(ctx, 50, 400, 1720, 190);
  drawFittedText(ctx, 'Код модели', { x:110, y:420, w:420, h:52, size:31, minSize:22, align:'center', weight:'700' });
  drawFittedText(ctx, row.article, { x:110, y:490, w:420, h:55, size:26, minSize:16, align:'center' });
  drawFittedText(ctx, 'Модельный год', { x:620, y:420, w:460, h:52, size:31, minSize:22, align:'center', weight:'700' });
  drawFittedText(ctx, String(input.modelYear), { x:620, y:490, w:460, h:55, size:29, minSize:20, align:'center' });
  drawFittedText(ctx, 'Версия', { x:1190, y:420, w:400, h:52, size:31, minSize:22, align:'center', weight:'700' });
  drawFittedText(ctx, row.modification, { x:1190, y:490, w:400, h:55, size:29, minSize:20, align:'center' });

  // Индивидуальное оборудование. Полностью очищаем две колонки значений,
  // затем печатаем все атрибуты строго по центрам строк.
  const tintCode = row.tint === 'Да' ? '2' : '-';
  fillWhite(ctx, 680, 860, 360, 505);
  fillWhite(ctx, 1060, 860, 690, 505);
  const rows = [
    { y:870, code:row.colorCode, value:row.bodyColor },
    { y:990, code:row.equipmentCode, value:row.interiorColor },
    { y:1110, code:row.modification, value:'Версия для личного пользования' },
    { y:1230, code:tintCode, value:row.tint }
  ];
  for (const item of rows) {
    drawFittedText(ctx, item.code, { x:700, y:item.y, w:320, h:80, size:29, minSize:18, align:'center' });
    drawFittedText(ctx, item.value, { x:1080, y:item.y, w:650, h:80, size:27, minSize:16, align:'center' });
  }
  fillWhite(ctx, 40, 1350, 1710, 55);
  drawLine(ctx, 82, 1378, 1730, 1378, 3);

  // Базовая цена.
  fillWhite(ctx, 1280, 1450, 430, 85);
  drawFittedText(ctx, formatRub(input.basePrice, true), { x:1290, y:1455, w:410, h:75, size:31, minSize:19, align:'right' });

  // Специальная цена. Заголовок не перекрываем.
  fillWhite(ctx, 60, 1690, 1120, 115);
  drawFittedText(ctx, `${formatRub(input.specialPrice, false)} (включая НДС)`, { x:75, y:1700, w:1090, h:95, size:52, minSize:26, align:'left' });

  // Срок действия КП. Очищаем всю строку, поэтому никаких фрагментов справа не остаётся.
  fillWhite(ctx, 0, 1820, 1120, 112);
  drawFittedText(ctx, 'Данное предложение действительно до:', { x:48, y:1830, w:520, h:28, size:15, minSize:12, align:'left' });
  drawFittedText(ctx, formatDate(input.validTo), { x:48, y:1870, w:260, h:36, size:24, minSize:17, align:'left' });

  // Ориентировочная дата поставки.
  fillWhite(ctx, 1300, 1940, 380, 75);
  drawFittedText(ctx, `${formatDate(input.deliveryDate)} г.`, { x:1310, y:1945, w:355, h:65, size:30, minSize:18, align:'right' });
}
function drawPage9(ctx, input) {
  fillWhite(ctx, 70, 1260, 900, 150);
  const manager = input.manager || 'ФИО МЕНЕДЖЕРА ПО ПРОДАЖАМ';
  const phone = input.phone || '+7 (___) ___-__-__';
  const email = input.email || 'email@atom.team';
  drawFittedText(ctx, `Ваш менеджер, ${manager}`, { x:82, y:1268, w:860, h:38, size:28, minSize:18, align:'left' });
  drawFittedText(ctx, `Телефон: ${phone}`, { x:82, y:1312, w:860, h:38, size:27, minSize:18, align:'left' });
  drawFittedText(ctx, `Email: ${email}`, { x:82, y:1356, w:860, h:38, size:27, minSize:18, align:'left' });
}
function fillWhite(ctx, x, y, w, h) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x,y,w,h); ctx.restore(); }
function drawLine(ctx, x1,y1,x2,y2,width) { ctx.save(); ctx.strokeStyle='#000'; ctx.lineWidth=width; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }

function drawFittedText(ctx, text, options) {
  const { x,y,w,h,size,minSize=12,align='left',weight='400' } = options;
  let fontSize = size;
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  while (fontSize > minSize) {
    ctx.font = `${weight} ${fontSize}px Arial, Helvetica, sans-serif`;
    if (ctx.measureText(String(text)).width <= w - 8) break;
    fontSize -= 1;
  }
  ctx.font = `${weight} ${fontSize}px Arial, Helvetica, sans-serif`;
  let tx = x + 4;
  if (align === 'center') tx = x + w / 2;
  if (align === 'right') tx = x + w - 4;
  ctx.fillText(String(text), tx, y + h / 2, w - 8);
  ctx.restore();
}

async function blobToImage(blob) {
  if ('createImageBitmap' in window) return createImageBitmap(blob);
  return new Promise((resolve,reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не удалось открыть изображение страницы.')); };
    img.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Не удалось сформировать страницу PDF.')), type, quality));
}

async function fetchBytes(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Не удалось загрузить страницу шаблона: ${path}`);
  return new Uint8Array(await response.arrayBuffer());
}

function buildImagePdf(jpegPages, imageWidth, imageHeight, pageWidth, pageHeight) {
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [];
  let length = 0;
  const push = bytes => { chunks.push(bytes); length += bytes.length; };
  const ascii = text => enc.encode(text);
  push(ascii('%PDF-1.4\n'));
  push(new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A]));

  const objectCount = 2 + jpegPages.length * 3;
  const pageIds = jpegPages.map((_,i) => 3 + i * 3);
  const writeObject = (id, bodyChunks) => {
    offsets[id] = length;
    push(ascii(`${id} 0 obj\n`));
    for (const part of bodyChunks) push(typeof part === 'string' ? ascii(part) : part);
    push(ascii('\nendobj\n'));
  };

  writeObject(1, [`<< /Type /Catalog /Pages 2 0 R >>`]);
  writeObject(2, [`<< /Type /Pages /Count ${jpegPages.length} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`]);

  jpegPages.forEach((jpegBytes,index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    writeObject(pageId, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`]);
    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`;
    writeObject(contentId, [`<< /Length ${ascii(content).length} >>\nstream\n${content}endstream`]);
    writeObject(imageId, [
      `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
      jpegBytes,
      '\nendstream'
    ]);
  });

  const xrefOffset = length;
  push(ascii(`xref\n0 ${objectCount + 1}\n`));
  push(ascii('0000000000 65535 f \n'));
  for (let id = 1; id <= objectCount; id += 1) push(ascii(`${String(offsets[id]).padStart(10,'0')} 00000 n \n`));
  push(ascii(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`));
  return concatUint8Arrays(chunks, length);
}

function concatUint8Arrays(parts, total) {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}

function collectInputData() {
  const basePrice = parseRub(el.basePrice.value);
  const specialPrice = el.specialPrice.value.trim() ? parseRub(el.specialPrice.value) : basePrice;
  return { client:el.client.value.trim(), basePrice, specialPrice, modelYear:Number(el.modelYear.value), deliveryDate:el.deliveryDate.value, validTo:el.validTo.value, manager:el.manager.value.trim(), phone:el.phone.value.trim(), email:el.email.value.trim() };
}

function validateInputs() {
  if (!state.selectedArticle) throw new Error('Выберите характеристики автомобиля.');
  if (!el.deliveryDate.value) throw new Error('Укажите дату поставки.');
  if (!el.validTo.value) throw new Error('Укажите срок действия КП.');
  parseRub(el.basePrice.value);
  if (el.specialPrice.value.trim()) parseRub(el.specialPrice.value);
  const year = Number(el.modelYear.value);
  if (!Number.isInteger(year) || year < 2026 || year > 2035) throw new Error('Проверьте модельный год.');
}

function parseRub(value) {
  const normalized = String(value).replace(/[^0-9,.-]/g,'').replace(',','.');
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error(`Не удалось распознать цену: ${value}`);
  return number;
}

function formatRub(value, decimals) {
  const formatted = new Intl.NumberFormat('ru-RU',{ minimumFractionDigits:decimals?2:0, maximumFractionDigits:decimals?2:0 }).format(value);
  return `${formatted} руб.`;
}

function formatDate(isoDate) { const [year,month,day] = isoDate.split('-'); return `${day}.${month}.${year}`; }
function buildFileName(row) {
  const client = safeFileName(el.client.value.trim() || 'Клиент');
  const color = safeFileName(row.bodyColorDisplay);
  const article = safeFileName(row.article);
  const stamp = new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
  return `KP_ATOM_${client}_${color}_${article}_${stamp}.pdf`;
}
function safeFileName(value) { return String(value).replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'').slice(0,90) || 'file'; }
function downloadBlob(blob,fileName) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000); }

function setOptions(select,values,preferredOrder=[]) {
  const current=select.value; let items=unique(values.filter(Boolean));
  if (preferredOrder.length) items.sort((a,b)=>orderIndex(preferredOrder,a)-orderIndex(preferredOrder,b));
  select.innerHTML='';
  for (const value of items) { const option=document.createElement('option'); option.value=value; option.textContent=value; select.appendChild(option); }
  if (items.includes(current)) select.value=current; else if (items.length) select.value=items[0];
  select.disabled=items.length<=1;
}
function unique(values){ return [...new Set(values)]; }
function orderIndex(order,value){ const index=order.indexOf(value); return index===-1?Number.MAX_SAFE_INTEGER:index; }
function setBusy(value){ state.busy=value; el.generateButton.disabled=value||!state.selectedArticle; el.generateButton.textContent=value?'Формирование PDF...':'Сформировать и скачать PDF'; el.progressArea.hidden=!value&&Number(el.progressBar.style.width.replace('%',''))===0; }
function setProgress(percent,text){ el.progressArea.hidden=false; el.progressBar.style.width=`${Math.max(0,Math.min(100,percent))}%`; el.progressText.textContent=text; }
function setMessage(text,type){ el.message.textContent=text; el.message.className='message'; if(type) el.message.classList.add(`message--${type}`); }
function toDateInput(date){ const local=new Date(date.getTime()-date.getTimezoneOffset()*60000); return local.toISOString().slice(0,10); }
