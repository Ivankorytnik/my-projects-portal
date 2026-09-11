'use strict';

(() => {
  const DOCS = [
    {kind:'poa', label:'Доверенность'},
    {kind:'questionnaire', label:'Анкета ТД'},
    {kind:'consent', label:'СОПД'},
    {kind:'obligation', label:'Письменное обязательство'}
  ];

  const REQUIRED_BY_DOC = {
    poa: [
      ['fullName','ФИО'],['passportSeries','Серия паспорта'],['passportNumber','Номер паспорта'],
      ['passportIssuedBy','Кем выдан паспорт'],['passportIssueDate','Дата выдачи паспорта'],['passportCode','Код подразделения'],
      ['driverLicense','Водительское удостоверение'],['driverLicenseIssueDate','Дата выдачи ВУ'],['driverCategory','Категория ВУ'],
      ['driverIssuedBy','Кем выдано ВУ / ГИБДД'],['carModel','Модель автомобиля'],['vin','VIN'],['plate','Госномер'],
      ['carYear','Год выпуска'],['bodyNumber','Номер кузова'],['chassis','Шасси'],['pts','ПТС'],['sts','СТС'],
      ['poaNumber','Номер доверенности'],['poaDate','Дата доверенности'],['poaValidUntil','Срок действия доверенности'],
      ['companyRepRole','Должность представителя организации'],['companyRepName','ФИО представителя организации'],
      ['companyRepPoaNo','Номер доверенности представителя'],['companyRepPoaDate','Дата доверенности представителя']
    ],
    questionnaire: [
      ['fullName','ФИО'],['phone','Телефон'],['email','Email'],['passportSeries','Серия паспорта'],['passportNumber','Номер паспорта'],
      ['passportIssuedBy','Кем выдан паспорт'],['passportIssueDate','Дата выдачи паспорта'],['passportCode','Код подразделения'],
      ['registrationAddress','Адрес регистрации'],['carModel','Модель автомобиля'],['vin','VIN'],['plate','Госномер'],
      ['managerName','Сопровождающий менеджер'],['testDriveDate','Дата тест-драйва']
    ],
    consent: [
      ['salutation','Обращение'],['fullName','ФИО'],['phone','Телефон'],['email','Email'],['birthDate','Дата рождения']
    ],
    obligation: [
      ['fullName','ФИО'],['passportSeries','Серия паспорта'],['passportNumber','Номер паспорта'],
      ['passportIssuedBy','Кем выдан паспорт'],['passportCode','Код подразделения'],['birthDate','Дата рождения'],
      ['birthPlace','Место рождения'],['registrationAddress','Адрес регистрации'],['testDriveDate','Дата тест-драйва']
    ]
  };

  const selectedDocs = new Set(DOCS.map(doc => doc.kind));
  let mounted = false;
  let printWired = false;
  let exportBusy = false;
  let updateQueued = false;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  try {
    TEMPLATE_NAMES.obligation = 'written_obligation_template.docx';
    OUTPUT_NAMES.obligation = '04_Письменное_обязательство.docx';
  } catch (_) {}

  function selectedKinds() {
    return DOCS.map(doc => doc.kind).filter(kind => selectedDocs.has(kind));
  }
  function docLabel(kind) { return DOCS.find(doc => doc.kind === kind)?.label || kind; }

  function requiredRows(kinds = selectedKinds()) {
    const rows=[]; const seen=new Set();
    kinds.forEach(kind => (REQUIRED_BY_DOC[kind] || []).forEach(row => {
      if (!seen.has(row[0])) { seen.add(row[0]); rows.push(row); }
    }));
    if (kinds.includes('consent') && $('[data-c="consentMessenger"]')?.checked && !seen.has('messenger')) rows.push(['messenger','Мессенджер']);
    return rows;
  }

  function validateSelectedData(kinds = selectedKinds()) {
    const d = typeof getData === 'function' ? getData() : {};
    const rows = requiredRows(kinds);
    const required = new Set(rows.map(([key]) => key));
    const missing = rows.filter(([key]) => !String(d[key] ?? '').trim()).map(([,label]) => label);
    if (required.has('passportSeries') && d.passportSeries && !/^\d{4}$/.test(d.passportSeries)) missing.push('Серия паспорта: 4 цифры');
    if (required.has('passportNumber') && d.passportNumber && !/^\d{6}$/.test(d.passportNumber)) missing.push('Номер паспорта: 6 цифр');
    return missing;
  }

  function isEmpty(el) { return !String(el?.value ?? '').trim(); }
  function applyRequiredState() {
    const required = new Set(requiredRows().map(([key]) => key));
    $$('[data-f]').forEach(el => {
      const field=el.closest('.field'); if (!field) return;
      const active=required.has(el.dataset.f); const empty=active && isEmpty(el);
      field.classList.toggle('required-field',active);
      field.classList.toggle('required-empty',empty);
      el.classList.toggle('required-empty-control',empty);
      el.required=active;
      if (active) { el.setAttribute('aria-required','true'); el.setAttribute('aria-invalid',empty?'true':'false'); }
      else { el.removeAttribute('aria-required'); el.removeAttribute('aria-invalid'); }
    });
  }

  function missingControls(kinds = selectedKinds()) {
    const required=new Set(requiredRows(kinds).map(([key]) => key));
    return $$('[data-f]').filter(el => required.has(el.dataset.f) && isEmpty(el));
  }
  function focusFirstMissing(kinds = selectedKinds()) {
    const first=missingControls(kinds)[0]; if (!first) return false;
    first.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>first.focus({preventScroll:true}),250); return true;
  }
  function templatesReady(kinds = selectedKinds()) {
    return typeof state !== 'undefined' && !!state?.templates && kinds.every(kind => state.templates.has(kind));
  }

  function syncSelectionButtons() {
    $$('[data-output-doc]').forEach(button => {
      const on=selectedDocs.has(button.dataset.outputDoc);
      button.setAttribute('aria-selected',String(on)); button.setAttribute('aria-pressed',String(on));
      button.textContent=`${on ? '✓ ' : ''}${docLabel(button.dataset.outputDoc)}`;
    });
  }

  function updatePrintSummaryFallback() {
    const out=$('#tdPrintSummary'); if (!out) return;
    const parts=[]; let total=0;
    DOCS.forEach(doc => {
      const ch=$(`[data-print-doc="${doc.kind}"]`); const input=$(`[data-print-copies="${doc.kind}"]`);
      if (!ch?.checked || !input) return;
      let n=parseInt(input.value,10); if (!Number.isFinite(n)) n=1; n=Math.max(1,Math.min(20,n)); input.value=String(n);
      total+=n; parts.push(`${doc.label}: ${n}`);
    });
    out.textContent=total ? `К печати: ${parts.join(' · ')}. Всего экземпляров: ${total}.` : 'Выберите хотя бы один документ.';
    const master=$('#tdPrintAll'); if (master) {
      const checks=$$('[data-print-doc]'); const n=checks.filter(ch=>ch.checked).length;
      master.checked=n===checks.length; master.indeterminate=n>0 && n<checks.length;
    }
  }

  function syncPrintFromSelection() {
    const selected=new Set(selectedKinds());
    $$('[data-print-doc]').forEach(ch => {
      ch.checked=selected.has(ch.dataset.printDoc);
      const input=$(`[data-print-copies="${ch.dataset.printDoc}"]`); if (input) input.disabled=!ch.checked;
    });
    updatePrintSummaryFallback();
  }

  function syncActions() {
    const kinds=selectedKinds(); const count=kinds.length; const missing=validateSelectedData(kinds); const readyTemplates=templatesReady(kinds);
    const blocked=missing.length>0 || !readyTemplates;
    const save=$('#saveDocsBtn'), zip=$('#downloadZipBtn');
    if (save) { save.textContent=`Сформировать и сохранить ${count} DOCX`; save.disabled=blocked||exportBusy; save.title=blocked?'Заполните обязательные поля для выбранных документов':''; }
    if (zip) { zip.textContent=`Скачать ZIP с ${count} DOCX`; zip.disabled=blocked||exportBusy; zip.title=blocked?'Заполните обязательные поля для выбранных документов':''; }
    const badge=$('#readinessBadge'), status=$('#validationStatus');
    if (badge) { badge.textContent=blocked?'Не готово':'Готово'; badge.classList.toggle('ready',!blocked); }
    if (status) {
      if (missing.length) { status.className='status warn required-summary'; status.textContent=`Для выбранных документов не заполнено ${missing.length}: ${missing.slice(0,8).join(', ')}${missing.length>8?'...':''}`; }
      else if (!readyTemplates) { const absent=kinds.filter(kind=>!state?.templates?.has(kind)).map(docLabel); status.className='status warn required-summary'; status.textContent=`Не загружены шаблоны: ${absent.join(', ')}.`; }
      else { status.className='status ok required-summary'; status.textContent=`Все обязательные поля для выбранных документов заполнены. Выбрано: ${count}.`; }
    }
    const printKinds=$$('[data-print-doc]').filter(ch=>ch.checked).map(ch=>ch.dataset.printDoc); const printBtn=$('#tdPrintBtn');
    if (printBtn) { const pm=printKinds.length ? validateSelectedData(printKinds) : ['Выберите документ']; printBtn.disabled=pm.length>0; printBtn.title=printBtn.disabled?'Заполните обязательные поля для документов, выбранных к печати':''; }
  }

  function updateAll() { applyRequiredState(); syncSelectionButtons(); syncActions(); }
  function scheduleUpdate() {
    if (updateQueued) return; updateQueued=true;
    requestAnimationFrame(() => { updateQueued=false; updateAll(); window.TestDriveBatch?.refresh?.(); });
  }

  function setSelection(kinds) {
    const valid=DOCS.map(doc=>doc.kind).filter(kind=>kinds.includes(kind)); if (!valid.length) return false;
    selectedDocs.clear(); valid.forEach(kind=>selectedDocs.add(kind)); syncPrintFromSelection(); updateAll();
    if (typeof window.render === 'function') window.render(); window.TestDriveBatch?.refresh?.(); return true;
  }
  function setDocumentSelected(kind,on) {
    if (!DOCS.some(doc=>doc.kind===kind)) return false;
    const next=new Set(selectedDocs); on ? next.add(kind) : next.delete(kind); if (!next.size) return false; return setSelection([...next]);
  }
  function showSelectionHint(text) {
    const hint=$('#tdOutputHint'); if (!hint) return;
    const normal='Выберите документы для формирования. Можно выбрать от 1 до 4.'; hint.textContent=text;
    if (text!==normal) setTimeout(()=>{ if (hint) hint.textContent=normal; },1800);
  }

  function mountSelectionUi() {
    const previewCard=$('.preview-card.live-doc-preview-card') || $('.preview-card');
    const previewTabs=previewCard?.querySelector('.td-doc-tabs[role="tablist"]') || previewCard?.querySelector('.td-doc-tabs');
    if (!previewCard || !previewTabs) return false;
    let controls=$('#tdOutputDocs');
    if (!controls) {
      const hint=document.createElement('div'); hint.id='tdOutputHint'; hint.className='td-live-note'; hint.textContent='Выберите документы для формирования. Можно выбрать от 1 до 4.';
      controls=document.createElement('div'); controls.id='tdOutputDocs'; controls.className='td-doc-tabs'; controls.setAttribute('aria-label','Документы для формирования');
      const previewHint=document.createElement('div'); previewHint.className='td-live-note'; previewHint.textContent='Предпросмотр документа:';
      previewTabs.before(hint,controls,previewHint);
    }
    DOCS.forEach(doc => {
      if (controls.querySelector(`[data-output-doc="${doc.kind}"]`)) return;
      const button=document.createElement('button'); button.type='button'; button.className='td-doc-tab'; button.dataset.outputDoc=doc.kind;
      button.addEventListener('click',()=>{ const next=!selectedDocs.has(doc.kind); if (!setDocumentSelected(doc.kind,next)) { showSelectionHint('Нужно оставить выбранным хотя бы один документ.'); syncSelectionButtons(); } });
      controls.appendChild(button);
    });
    syncSelectionButtons(); return true;
  }

  function wirePrintControls() {
    const box=$('#tdPrintBox'); if (!box) return false;
    if (!printWired) {
      printWired=true;
      box.addEventListener('change',event => {
        if (!event.target?.matches?.('[data-print-doc],#tdPrintAll')) return;
        const chosen=$$('[data-print-doc]',box).filter(ch=>ch.checked).map(ch=>ch.dataset.printDoc);
        if (!chosen.length) { const active=$('[data-doc-tab][aria-selected="true"]')?.dataset.docTab || selectedKinds()[0] || 'poa'; setSelection([active]); showSelectionHint('Нужно оставить выбранным хотя бы один документ.'); }
        else setSelection(chosen);
        syncPrintFromSelection();
      });
    }
    syncPrintFromSelection(); return true;
  }

  function augmentContext(ctx) {
    const d=typeof getData==='function'?getData():{};
    const td=typeof dateParts==='function'?dateParts(d.testDriveDate):{day:'____',month:'_______',year:'2026'};
    ctx.testDriveDateDay=td.day; ctx.testDriveDateMonth=td.month; ctx.testDriveDateYear=td.year; return ctx;
  }

  async function buildSelectedDocuments() {
    if (typeof state==='undefined') throw new Error('Состояние приложения недоступно. Обновите страницу.');
    if (state.busy || exportBusy) throw new Error('Формирование уже выполняется.');
    const kinds=selectedKinds(); const absent=kinds.filter(kind=>!state.templates.has(kind));
    if (absent.length) throw new Error(`Не загружены шаблоны: ${absent.map(docLabel).join(', ')}.`);
    const missing=validateSelectedData(kinds); if (missing.length) throw new Error('Не заполнено: '+missing.slice(0,8).join(', ')+(missing.length>8?'...':''));
    state.busy=true; exportBusy=true; updateAll();
    try {
      const ctx=augmentContext(buildContext()); const docs=new Map();
      for (const kind of kinds) docs.set(kind,await fillDocx(state.templates.get(kind),ctx));
      return docs;
    } finally { state.busy=false; exportBusy=false; updateAll(); }
  }

  async function saveSelectedDocuments(docs) {
    if (!state.outputHandle) throw new Error('Папка хранения не выбрана.');
    if (!$('#localFolderConfirm')?.checked) throw new Error('Подтвердите, что выбранная папка локальная и не синхронизируется с облаком.');
    const root=await state.outputHandle.getDirectoryHandle('Тестдрайв',{create:true}); const d=getData();
    const date=formatDateIso(d.testDriveDate)||formatDateIso(new Date().toISOString().slice(0,10)); const folderName=safeFilePart(`${d.fullName} ${date}`);
    const participant=await root.getDirectoryHandle(folderName,{create:true});
    for (const [kind,bytes] of docs.entries()) await saveBytesToHandle(participant,OUTPUT_NAMES[kind],bytes);
    return `Тестдрайв / ${folderName}`;
  }
  function buildSelectedZip(docs) { return writeZip([...docs.entries()].map(([kind,data])=>({name:OUTPUT_NAMES[kind],data}))); }

  async function runSave() {
    const count=selectedKinds().length;
    try { setStatus('#exportStatus',`Формирую ${count} DOCX локально в браузере...`,'busy'); const docs=await buildSelectedDocuments(); const folder=await saveSelectedDocuments(docs); setStatus('#exportStatus',`Готово. ${docs.size} DOCX сохранено в ${folder}.`,'ok'); }
    catch(e) { setStatus('#exportStatus',e?.message||'Не удалось сформировать документы.','warn'); focusFirstMissing(); }
    finally { updateAll(); }
  }
  async function runZip() {
    const count=selectedKinds().length;
    try { setStatus('#exportStatus',`Формирую ZIP с ${count} DOCX локально в браузере...`,'busy'); const docs=await buildSelectedDocuments(); const zip=buildSelectedZip(docs); const d=getData(); const name=`TestDrive_${safeFilePart(d.fullName)}_${d.testDriveDate||new Date().toISOString().slice(0,10)}.zip`; downloadBlob(new Blob([zip],{type:'application/zip'}),name); setStatus('#exportStatus',`ZIP сформирован локально. В архиве: ${docs.size} DOCX.`,'ok'); }
    catch(e) { setStatus('#exportStatus',e?.message||'Не удалось сформировать ZIP.','warn'); focusFirstMissing(); }
    finally { updateAll(); }
  }

  function interceptActions(event) {
    const target=event.target instanceof Element?event.target.closest('button'):null; if (!target) return;
    if (target.id==='saveDocsBtn' || target.id==='downloadZipBtn') {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); if (target.disabled) return;
      target.id==='saveDocsBtn' ? void runSave() : void runZip(); return;
    }
    if (target.id==='tdPrintBtn') {
      const kinds=$$('[data-print-doc]').filter(ch=>ch.checked).map(ch=>ch.dataset.printDoc); const missing=validateSelectedData(kinds.length?kinds:selectedKinds());
      if (!missing.length) return; event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); focusFirstMissing(kinds.length?kinds:selectedKinds());
    }
  }

  function loadObligationAssets() {
    if (!document.querySelector('link[data-obligation-css]')) { const link=document.createElement('link'); link.rel='stylesheet'; link.href='obligation-template.css?v=043'; link.dataset.obligationCss='1'; document.head.appendChild(link); }
    if (!document.querySelector('script[data-obligation-js]')) { const script=document.createElement('script'); script.src='obligation-template.js?v=043'; script.defer=false; script.dataset.obligationJs='1'; script.onload=()=>refresh(); document.body.appendChild(script); }
  }
  function setVersionText() {
    const meta=$('.title-wrap span'); if (meta) meta.textContent='v0.4.3 · 4 шаблона · локальная обработка';
    const footer=$('footer'); if (footer) footer.textContent='TestDrive_Doc Web v0.4.3 · 11.09.2026 · 4 шаблона документов';
  }
  function refresh() { mountSelectionUi(); wirePrintControls(); updateAll(); window.TestDriveBatch?.refresh?.(); }

  function boot() {
    if (mounted) return; mounted=true;
    window.validateData=validateSelectedData;
    window.TestDriveDocs={getSelected:selectedKinds,isSelected:kind=>selectedDocs.has(kind),setSelected:setDocumentSelected,setSelection,refresh,getRequiredFields:()=>requiredRows().map(([key,label])=>({key,label}))};
    setVersionText(); loadObligationAssets(); document.addEventListener('click',interceptActions,true);
    document.addEventListener('input',event=>{ if (event.target?.matches?.('[data-f]')) scheduleUpdate(); },true);
    document.addEventListener('change',event=>{ if (event.target?.matches?.('[data-f],[data-c]')) scheduleUpdate(); },true);
    $('#clearBtn')?.addEventListener('click',()=>setTimeout(scheduleUpdate,0));
    refresh(); requestAnimationFrame(refresh); setTimeout(refresh,250); setTimeout(refresh,900);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();