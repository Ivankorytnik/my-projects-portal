'use strict';

(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  const FIELD_ALIASES = {
    fullName:['фио','фамилия имя отчество','клиент','участник'],
    phone:['телефон','мобильный телефон','контактный телефон'],
    email:['email','e-mail','электронная почта','почта'],
    birthDate:['дата рождения','рождение'],
    drivingYears:['стаж','стаж лет','водительский стаж'],
    salutation:['обращение','пол'],
    messenger:['мессенджер'],
    passportSeries:['серия паспорта','паспорт серия','серия'],
    passportNumber:['номер паспорта','паспорт номер','номер'],
    passportIssuedBy:['кем выдан паспорт','кем выдан','орган выдачи паспорта'],
    passportIssueDate:['дата выдачи паспорта','паспорт дата выдачи'],
    passportCode:['код подразделения','подразделение'],
    registrationAddress:['адрес регистрации','регистрация'],
    actualAddress:['фактический адрес','адрес проживания'],
    driverLicense:['ву','водительское удостоверение','серия номер ву','номер ву'],
    driverLicenseIssueDate:['дата выдачи ву','ву дата выдачи'],
    driverCategory:['категория ву','категория'],
    driverIssuedBy:['кем выдано ву','гибдд','орган выдачи ву']
  };

  const REQUIRED_ROW_FIELDS = ['fullName','passportSeries','passportNumber','passportIssuedBy','passportIssueDate','passportCode','driverLicense','driverLicenseIssueDate','driverCategory','driverIssuedBy'];
  const state = {rows:[], sourceName:'', selected:new Set()};

  function norm(v) {
    return String(v ?? '')
      .replace(/^\uFEFF/,'')
      .trim()
      .toLowerCase()
      .replace(/ё/g,'е')
      .replace(/№/g,'номер')
      .replace(/[^a-zа-я0-9]+/g,'');
  }
  function text(v){ return String(v ?? '').replace(/^\uFEFF/,'').trim(); }

  function aliasMap() {
    const map = new Map();
    Object.entries(FIELD_ALIASES).forEach(([field,aliases]) => {
      aliases.forEach(alias => map.set(norm(alias),field));
      map.set(norm(field),field);
    });
    return map;
  }
  const HEADER_MAP = aliasMap();

  function normalizeDate(value) {
    const raw = text(value);
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    let m = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(raw);
    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    m = /^(\d{4})[.\/](\d{1,2})[.\/](\d{1,2})$/.exec(raw);
    if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    const num = Number(raw.replace(',','.'));
    if (Number.isFinite(num) && num > 20000 && num < 90000) {
      const ms = Date.UTC(1899,11,30) + Math.round(num) * 86400000;
      return new Date(ms).toISOString().slice(0,10);
    }
    return raw;
  }

  function parseDelimited(rawText) {
    const src = String(rawText || '').replace(/^\uFEFF/,'');
    const firstLine = src.split(/\r?\n/).find(line => line.trim()) || '';
    const candidates = [';','\t',','];
    let delimiter=';', best=-1;
    for (const d of candidates) {
      const count = firstLine.split(d).length - 1;
      if (count > best) { best=count; delimiter=d; }
    }
    const rows=[]; let row=[]; let cell=''; let quoted=false;
    for (let i=0;i<src.length;i++) {
      const ch=src[i];
      if (ch === '"') {
        if (quoted && src[i+1] === '"') { cell += '"'; i++; }
        else quoted = !quoted;
      } else if (ch === delimiter && !quoted) {
        row.push(cell); cell='';
      } else if ((ch === '\n' || ch === '\r') && !quoted) {
        if (ch === '\r' && src[i+1] === '\n') i++;
        row.push(cell); cell='';
        if (row.some(v => text(v))) rows.push(row);
        row=[];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(v => text(v))) rows.push(row);
    return rows;
  }

  function colIndex(ref) {
    const letters = String(ref || '').match(/^[A-Z]+/i)?.[0]?.toUpperCase() || 'A';
    let n=0;
    for (const ch of letters) n=n*26+(ch.charCodeAt(0)-64);
    return Math.max(0,n-1);
  }

  async function unzipXlsx(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd=-1;
    for (let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) {
      if (view.getUint32(i,true) === 0x06054b50) { eocd=i; break; }
    }
    if (eocd < 0) throw new Error('Не удалось прочитать XLSX: не найден ZIP-каталог.');
    const count=view.getUint16(eocd+10,true);
    let pos=view.getUint32(eocd+16,true);
    const decoder=new TextDecoder('utf-8');
    const entries=new Map();
    for (let i=0;i<count;i++) {
      if (view.getUint32(pos,true) !== 0x02014b50) throw new Error('Повреждён XLSX-файл.');
      const method=view.getUint16(pos+10,true);
      const compressedSize=view.getUint32(pos+20,true);
      const nameLen=view.getUint16(pos+28,true);
      const extraLen=view.getUint16(pos+30,true);
      const commentLen=view.getUint16(pos+32,true);
      const localOffset=view.getUint32(pos+42,true);
      const name=decoder.decode(bytes.slice(pos+46,pos+46+nameLen));
      if (view.getUint32(localOffset,true) !== 0x04034b50) throw new Error('Повреждён локальный заголовок XLSX.');
      const localNameLen=view.getUint16(localOffset+26,true);
      const localExtraLen=view.getUint16(localOffset+28,true);
      const dataStart=localOffset+30+localNameLen+localExtraLen;
      entries.set(name,{method,data:bytes.slice(dataStart,dataStart+compressedSize)});
      pos += 46+nameLen+extraLen+commentLen;
    }
    return entries;
  }

  async function inflateEntry(entry) {
    if (!entry) return '';
    let out;
    if (entry.method === 0) out=entry.data;
    else if (entry.method === 8) {
      if (!('DecompressionStream' in window)) throw new Error('Этот браузер не умеет читать XLSX локально. Сохраните файл как CSV.');
      const stream=new Blob([entry.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      out=new Uint8Array(await new Response(stream).arrayBuffer());
    } else throw new Error(`Неподдерживаемый метод сжатия XLSX: ${entry.method}.`);
    return new TextDecoder('utf-8').decode(out);
  }

  async function parseXlsx(file) {
    const entries=await unzipXlsx(file);
    const parser=new DOMParser();
    let shared=[];
    if (entries.has('xl/sharedStrings.xml')) {
      const xml=parser.parseFromString(await inflateEntry(entries.get('xl/sharedStrings.xml')),'application/xml');
      shared=[...xml.getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent || '').join(''));
    }
    const sheetName=[...entries.keys()].filter(n => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}))[0];
    if (!sheetName) throw new Error('В XLSX не найден лист с данными.');
    const sheetXml=parser.parseFromString(await inflateEntry(entries.get(sheetName)),'application/xml');
    const rows=[];
    for (const rowEl of [...sheetXml.getElementsByTagName('row')]) {
      const row=[];
      for (const c of [...rowEl.getElementsByTagName('c')]) {
        const idx=colIndex(c.getAttribute('r'));
        const type=c.getAttribute('t') || '';
        let v='';
        if (type === 'inlineStr') v=[...c.getElementsByTagName('t')].map(t => t.textContent || '').join('');
        else {
          const raw=c.getElementsByTagName('v')[0]?.textContent || '';
          v=type === 's' ? (shared[Number(raw)] ?? '') : raw;
        }
        row[idx]=v;
      }
      if (row.some(v => text(v))) rows.push(row);
    }
    return rows;
  }

  function detectHeaderIndex(table) {
    let bestIndex=0,bestScore=-1;
    for (let i=0;i<Math.min(table.length,15);i++) {
      const score=(table[i] || []).reduce((sum,v)=>sum+(HEADER_MAP.has(norm(v))?1:0),0);
      if (score > bestScore) { bestScore=score; bestIndex=i; }
    }
    if (bestScore < 4) throw new Error('Не удалось определить заголовки. Нужны минимум ФИО, паспорт и ВУ.');
    return bestIndex;
  }

  function tableToRows(table) {
    const headerIndex=detectHeaderIndex(table);
    const headers=(table[headerIndex] || []).map(v => HEADER_MAP.get(norm(v)) || '');
    const out=[];
    table.slice(headerIndex+1).forEach((row,idx) => {
      const rec={_row:headerIndex+idx+2};
      headers.forEach((field,i) => { if (field) rec[field]=text(row?.[i]); });
      if (!Object.keys(rec).some(k => k !== '_row' && text(rec[k]))) return;
      ['birthDate','passportIssueDate','driverLicenseIssueDate'].forEach(k => { if (rec[k]) rec[k]=normalizeDate(rec[k]); });
      if (!rec.driverCategory) rec.driverCategory='B';
      if (rec.salutation) {
        const n=norm(rec.salutation);
        if (n === 'м' || n.includes('муж')) rec.salutation='Господин';
        else if (n === 'ж' || n.includes('жен')) rec.salutation='Госпожа';
      }
      out.push(rec);
    });
    return out;
  }

  async function parseFile(file) {
    const name=file.name.toLowerCase();
    if (name.endsWith('.xlsx')) return tableToRows(await parseXlsx(file));
    if (name.endsWith('.csv') || name.endsWith('.tsv') || name.endsWith('.txt')) return tableToRows(parseDelimited(await file.text()));
    throw new Error('Поддерживаются XLSX, CSV и TSV.');
  }

  function rowErrors(row, kinds) {
    const required=new Set();
    const add = key => required.add(key);
    if (kinds.includes('poa')) {
      ['fullName','passportSeries','passportNumber','passportIssuedBy','passportIssueDate','passportCode','driverLicense','driverLicenseIssueDate','driverCategory','driverIssuedBy'].forEach(add);
    }
    if (kinds.includes('questionnaire')) {
      ['fullName','phone','email','passportSeries','passportNumber','passportIssuedBy','passportIssueDate','passportCode','registrationAddress'].forEach(add);
    }
    if (kinds.includes('consent')) {
      ['fullName','phone','email','birthDate','salutation'].forEach(add);
    }
    const missing=[];
    required.forEach(key => { if (!text(row[key])) missing.push(key); });
    if (row.passportSeries && !/^\d{4}$/.test(row.passportSeries)) missing.push('passportSeriesFormat');
    if (row.passportNumber && !/^\d{6}$/.test(row.passportNumber)) missing.push('passportNumberFormat');
    return missing;
  }

  const LABELS={
    fullName:'ФИО',phone:'Телефон',email:'Email',birthDate:'Дата рождения',salutation:'Обращение',registrationAddress:'Адрес регистрации',
    passportSeries:'Серия паспорта',passportNumber:'Номер паспорта',passportIssuedBy:'Кем выдан паспорт',passportIssueDate:'Дата выдачи паспорта',passportCode:'Код подразделения',
    driverLicense:'ВУ',driverLicenseIssueDate:'Дата выдачи ВУ',driverCategory:'Категория ВУ',driverIssuedBy:'Кем выдано ВУ',passportSeriesFormat:'Серия паспорта = 4 цифры',passportNumberFormat:'Номер паспорта = 6 цифр'
  };

  function currentKinds() {
    return window.TestDriveDocs?.getSelected?.() || ['poa','questionnaire','consent'];
  }

  function mergeWithBase(row) {
    const base=typeof getData === 'function' ? getData() : {};
    return {...base,...row};
  }

  function fmtDate(v) {
    if (!v) return '';
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
  }
  function shortName(name) {
    const parts=String(name||'').trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return parts[0] || '';
    return `${parts[0]} ${(parts[1]?.[0]||'')}.${(parts[2]?.[0]||'')}.`;
  }
  function dateParts(v) {
    const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return m ? {day:m[3],month:months[Number(m[2])-1],year:m[1]} : {day:'____',month:'_______',year:'2026'};
  }

  function contextForRow(row) {
    const d=mergeWithBase(row);
    const ctx={...d};
    ctx.birthDateText=fmtDate(d.birthDate);
    ctx.passportIssueDateText=fmtDate(d.passportIssueDate);
    ctx.driverLicenseIssueDateText=fmtDate(d.driverLicenseIssueDate);
    ctx.companyRepPoaDateText=fmtDate(d.companyRepPoaDate);
    ctx.poaDateText=fmtDate(d.poaDate);
    ctx.testDriveDateText=fmtDate(d.testDriveDate) || fmtDate(new Date().toISOString().slice(0,10));
    ctx.passportCombined=[d.passportSeries,d.passportNumber].filter(Boolean).join(' ');
    ctx.companyRepShort=shortName(d.companyRepName);
    const valid=dateParts(d.poaValidUntil);
    ctx.poaValidUntilDay=valid.day;ctx.poaValidUntilMonth=valid.month;ctx.poaValidUntilYear=valid.year;
    ctx.salutationMr=d.salutation === 'Господин' ? '[X]' : '[ ]';
    ctx.salutationMs=d.salutation === 'Госпожа' ? '[X]' : '[ ]';
    ctx.consentEmailMark=d.consentEmail ? '[X]' : '[ ]';
    ctx.consentSmsMark=d.consentSms ? '[X]' : '[ ]';
    ctx.consentPhoneMark=d.consentPhone ? '[X]' : '[ ]';
    ctx.consentPostMark=d.consentPost ? '[X]' : '[ ]';
    ctx.consentMessengerMark=d.consentMessenger ? '[X]' : '[ ]';
    return ctx;
  }

  function applyContextToClone(clone,ctx) {
    Object.entries(ctx).forEach(([key,val]) => {
      if (typeof val === 'boolean') return;
      clone.querySelectorAll(`[data-o="${key}"]`).forEach(el => el.textContent=val || '');
    });
  }

  function selectedRows() {
    return state.rows.filter((_,idx) => state.selected.has(idx));
  }

  function renderTable() {
    const host=$('#tdBatchTableHost');
    const summary=$('#tdBatchSummary');
    const printBtn=$('#tdBatchPrintBtn');
    if (!host || !summary || !printBtn) return;
    host.replaceChildren();
    if (!state.rows.length) {
      const empty=document.createElement('div');empty.className='td-batch-empty';empty.textContent='Загрузите XLSX или CSV. Каждая строка = один участник.';host.appendChild(empty);
      summary.className='td-batch-summary';summary.textContent='Пакет не загружен.';printBtn.disabled=true;return;
    }

    const kinds=currentKinds();
    const table=document.createElement('table');table.className='td-batch-table';
    const head=document.createElement('thead');
    head.innerHTML='<tr><th><input id="tdBatchAll" class="td-batch-check" type="checkbox"></th><th>Строка</th><th>ФИО</th><th>Паспорт</th><th>ВУ</th><th>Телефон / Email</th><th>Статус</th><th>Ошибки</th><th></th></tr>';
    table.appendChild(head);
    const body=document.createElement('tbody');
    let validSelected=0, invalid=0;
    state.rows.forEach((row,idx) => {
      const errs=rowErrors(row,kinds);
      const valid=!errs.length;
      if (!valid) invalid++;
      if (valid && state.selected.has(idx)) validSelected++;
      const tr=document.createElement('tr');if(!valid)tr.className='is-invalid';
      const checkTd=document.createElement('td');
      const check=document.createElement('input');check.type='checkbox';check.className='td-batch-check';check.checked=state.selected.has(idx);check.disabled=!valid;
      check.addEventListener('change',()=>{if(check.checked)state.selected.add(idx);else state.selected.delete(idx);renderTable();});checkTd.appendChild(check);
      const cells=[
        String(row._row || idx+2),
        row.fullName || '',
        [row.passportSeries,row.passportNumber].filter(Boolean).join(' '),
        row.driverLicense || '',
        [row.phone,row.email].filter(Boolean).join(' / '),
        valid ? 'Готово' : 'Ошибка',
        errs.map(e=>LABELS[e] || e).join(', ')
      ];
      tr.appendChild(checkTd);
      cells.forEach((val,i)=>{const td=document.createElement('td');td.textContent=val;if(i===5)td.className=`td-batch-status ${valid?'ok':'warn'}`;if(i===6)td.className='td-batch-errors';tr.appendChild(td);});
      const actionTd=document.createElement('td');actionTd.className='td-batch-row-actions';
      const loadBtn=document.createElement('button');loadBtn.type='button';loadBtn.textContent='В карточку';loadBtn.addEventListener('click',()=>loadIntoCard(row));actionTd.appendChild(loadBtn);tr.appendChild(actionTd);
      body.appendChild(tr);
    });
    table.appendChild(body);host.appendChild(table);

    const validCount=state.rows.length-invalid;
    summary.className=`td-batch-summary ${invalid ? 'warn' : 'ok'}`;
    summary.textContent=`Загружено ${state.rows.length}. Готово ${validCount}. С ошибками ${invalid}. Выбрано к печати ${validSelected}. Документы на человека: ${kinds.length}.`;
    printBtn.disabled=validSelected===0;
    printBtn.textContent=`Подготовить к печати (${validSelected} чел.)`;

    const all=$('#tdBatchAll');
    if (all) {
      const validIndexes=state.rows.map((row,idx)=>({idx,valid:!rowErrors(row,kinds).length})).filter(x=>x.valid).map(x=>x.idx);
      const selectedValid=validIndexes.filter(i=>state.selected.has(i)).length;
      all.checked=validIndexes.length>0 && selectedValid===validIndexes.length;
      all.indeterminate=selectedValid>0 && selectedValid<validIndexes.length;
      all.addEventListener('change',()=>{
        validIndexes.forEach(i=>{if(all.checked)state.selected.add(i);else state.selected.delete(i);});
        renderTable();
      });
    }
  }

  function loadIntoCard(row) {
    Object.entries(row).forEach(([key,val]) => {
      if (key.startsWith('_')) return;
      const el=$(`[data-f="${key}"]`);
      if (!el || val == null) return;
      el.value=String(val);
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    });
  }

  function downloadSample() {
    const content='\uFEFFФИО;Телефон;Email;Дата рождения;Обращение;Серия паспорта;Номер паспорта;Кем выдан паспорт;Дата выдачи паспорта;Код подразделения;Адрес регистрации;Водительское удостоверение;Дата выдачи ВУ;Категория ВУ;Кем выдано ВУ\nИванов Иван Иванович;89991234567;ivanov@example.ru;01.01.1990;Господин;4510;123456;ОВД района;10.10.2015;770-001;Москва;77 11 123456;15.05.2020;B;ГИБДД 7700\n';
    const blob=new Blob([content],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='TestDrive_Пакет_участников_образец.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function buildPrintRoot() {
    let root=$('#tdPrintRoot');
    if (!root) {root=document.createElement('div');root.id='tdPrintRoot';root.setAttribute('aria-hidden','true');document.body.appendChild(root);} else root.replaceChildren();
    const kinds=currentKinds();
    let pages=0;
    selectedRows().forEach(row => {
      const ctx=contextForRow(row);
      kinds.forEach(kind => {
        const source=$(`[data-doc-panel="${kind}"] .td-doc-paper`);
        if (!source) return;
        const page=source.cloneNode(true);
        page.classList.add('td-print-copy');
        page.dataset.printKind=kind;
        applyContextToClone(page,ctx);
        root.appendChild(page);pages++;
      });
    });
    return pages;
  }

  function printBatch() {
    const kinds=currentKinds();
    const invalidSelected=selectedRows().filter(row => rowErrors(row,kinds).length);
    if (invalidSelected.length) { renderTable(); return; }
    const pages=buildPrintRoot();
    const status=$('#tdBatchPrintStatus');
    if (!pages) { if(status)status.textContent='Нет готовых строк для печати.'; return; }
    if (status) status.textContent=`Подготовлено страниц: ${pages}. Открываю системное окно печати...`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>window.print()));
  }

  async function handleFile(file) {
    const summary=$('#tdBatchSummary');
    try {
      summary.className='td-batch-summary';summary.textContent=`Читаю ${file.name}...`;
      const rows=await parseFile(file);
      if (!rows.length) throw new Error('В файле нет строк с участниками.');
      state.rows=rows;state.sourceName=file.name;state.selected.clear();
      const kinds=currentKinds();
      rows.forEach((row,idx)=>{if(!rowErrors(row,kinds).length)state.selected.add(idx);});
      renderTable();
    } catch(e) {
      state.rows=[];state.selected.clear();renderTable();summary.className='td-batch-summary warn';summary.textContent=e?.message || 'Не удалось прочитать файл.';
    }
  }

  function mount() {
    if ($('#tdBatchBox')) return true;
    const preview=$('.preview-panel');
    if (!preview) return false;
    const box=document.createElement('section');box.id='tdBatchBox';box.className='td-batch-box';
    box.innerHTML=`<div class="td-batch-head"><div><strong>Массовая загрузка участников</strong><span>XLSX / CSV: одна строка = один человек. Паспорт и ВУ загружаются списком и остаются только в памяти этой вкладки.</span></div><div class="td-batch-count" id="tdBatchCount"></div></div><div class="td-batch-actions"><label class="btn secondary td-batch-upload">Загрузить список<input id="tdBatchFile" type="file" accept=".xlsx,.csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"></label><button class="btn ghost" id="tdBatchSampleBtn" type="button">Скачать образец таблицы</button><button class="btn ghost" id="tdBatchClearBtn" type="button">Очистить пакет</button></div><div id="tdBatchSummary" class="td-batch-summary">Пакет не загружен.</div><div id="tdBatchTableHost"></div><div class="td-batch-bottom"><div class="td-batch-security">ПДн из таблицы не сохраняются в IndexedDB/localStorage и не отправляются в сеть.</div><button id="tdBatchPrintBtn" class="btn primary" type="button" disabled>Подготовить к печати</button></div><div id="tdBatchPrintStatus" class="status">Пакетная печать ещё не запускалась.</div>`;
    const printBox=$('#tdPrintBox');
    if (printBox) printBox.before(box); else preview.querySelector('.doc-actions')?.before(box);
    $('#tdBatchFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)void handleFile(file);e.target.value='';});
    $('#tdBatchSampleBtn').addEventListener('click',downloadSample);
    $('#tdBatchClearBtn').addEventListener('click',()=>{state.rows=[];state.selected.clear();renderTable();$('#tdBatchPrintStatus').textContent='Пакет очищен.';});
    $('#tdBatchPrintBtn').addEventListener('click',printBatch);
    renderTable();
    return true;
  }

  function refresh(){ if(mount()) renderTable(); }
  window.TestDriveBatch={refresh,getRows:()=>state.rows.slice()};
  document.addEventListener('change',e=>{
    if (e.target?.matches?.('[data-output-doc],[data-print-doc],#tdPrintAll')) setTimeout(refresh,0);
  },true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>{mount();setTimeout(mount,300);},{once:true});
  else {mount();setTimeout(mount,300);}
})();