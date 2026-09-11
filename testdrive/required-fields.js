'use strict';

(() => {
  const DOCS = [
    {kind:'poa', label:'Доверенность'},
    {kind:'questionnaire', label:'Анкета ТД'},
    {kind:'consent', label:'СОПД'}
  ];

  const REQUIRED_BY_DOC = {
    poa: [
      ['fullName','ФИО'],
      ['passportSeries','Серия паспорта'],
      ['passportNumber','Номер паспорта'],
      ['passportIssuedBy','Кем выдан паспорт'],
      ['passportIssueDate','Дата выдачи паспорта'],
      ['passportCode','Код подразделения'],
      ['driverLicense','Водительское удостоверение'],
      ['driverLicenseIssueDate','Дата выдачи ВУ'],
      ['driverCategory','Категория ВУ'],
      ['driverIssuedBy','Кем выдано ВУ / ГИБДД'],
      ['carModel','Модель автомобиля'],
      ['vin','VIN'],
      ['plate','Госномер'],
      ['carYear','Год выпуска'],
      ['bodyNumber','Номер кузова'],
      ['chassis','Шасси'],
      ['pts','ПТС'],
      ['sts','СТС'],
      ['poaNumber','Номер доверенности'],
      ['poaDate','Дата доверенности'],
      ['poaValidUntil','Срок действия доверенности'],
      ['companyRepRole','Должность представителя организации'],
      ['companyRepName','ФИО представителя организации'],
      ['companyRepPoaNo','Номер доверенности представителя'],
      ['companyRepPoaDate','Дата доверенности представителя']
    ],
    questionnaire: [
      ['fullName','ФИО'],
      ['phone','Телефон'],
      ['email','Email'],
      ['passportSeries','Серия паспорта'],
      ['passportNumber','Номер паспорта'],
      ['passportIssuedBy','Кем выдан паспорт'],
      ['passportIssueDate','Дата выдачи паспорта'],
      ['passportCode','Код подразделения'],
      ['registrationAddress','Адрес регистрации'],
      ['carModel','Модель автомобиля'],
      ['vin','VIN'],
      ['plate','Госномер'],
      ['managerName','Сопровождающий менеджер'],
      ['testDriveDate','Дата тест-драйва']
    ],
    consent: [
      ['salutation','Обращение'],
      ['fullName','ФИО'],
      ['phone','Телефон'],
      ['email','Email'],
      ['birthDate','Дата рождения']
    ]
  };

  const selectedDocs = new Set(DOCS.map(doc => doc.kind));
  let mounted = false;
  let printWired = false;
  let exportBusy = false;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function selectedKinds() {
    return DOCS.map(doc => doc.kind).filter(kind => selectedDocs.has(kind));
  }

  function docLabel(kind) {
    return DOCS.find(doc => doc.kind === kind)?.label || kind;
  }

  function requiredRows(kinds = selectedKinds()) {
    const rows = [];
    const seen = new Set();
    kinds.forEach(kind => {
      (REQUIRED_BY_DOC[kind] || []).forEach(row => {
        if (seen.has(row[0])) return;
        seen.add(row[0]);
        rows.push(row);
      });
    });

    if (kinds.includes('consent') && $('[data-c="consentMessenger"]')?.checked && !seen.has('messenger')) {
      rows.push(['messenger','Мессенджер']);
    }
    return rows;
  }

  function validateSelectedData(kinds = selectedKinds()) {
    const d = typeof getData === 'function' ? getData() : {};
    const rows = requiredRows(kinds);
    const required = new Set(rows.map(([key]) => key));
    const missing = rows.filter(([key]) => !String(d[key] ?? '').trim()).map(([,label]) => label);

    if (required.has('passportSeries') && d.passportSeries && !/^\d{4}$/.test(d.passportSeries)) {
      missing.push('Серия паспорта: 4 цифры');
    }
    if (required.has('passportNumber') && d.passportNumber && !/^\d{6}$/.test(d.passportNumber)) {
      missing.push('Номер паспорта: 6 цифр');
    }
    return missing;
  }

  function isEmpty(el) {
    return !String(el.value ?? '').trim();
  }

  function applyRequiredState() {
    const required = new Set(requiredRows().map(([key]) => key));
    $$('[data-f]').forEach(el => {
      const field = el.closest('.field');
      if (!field) return;
      const active = required.has(el.dataset.f);
      field.classList.toggle('required-field', active);
      el.required = active;

      if (active) {
        const empty = isEmpty(el);
        field.classList.toggle('required-empty', empty);
        el.classList.toggle('required-empty-control', empty);
        el.setAttribute('aria-required','true');
        el.setAttribute('aria-invalid',empty ? 'true' : 'false');
      } else {
        field.classList.remove('required-empty');
        el.classList.remove('required-empty-control');
        el.removeAttribute('aria-required');
        el.removeAttribute('aria-invalid');
      }
    });
  }

  function missingControls(kinds = selectedKinds()) {
    const required = new Set(requiredRows(kinds).map(([key]) => key));
    return $$('[data-f]').filter(el => required.has(el.dataset.f) && isEmpty(el));
  }

  function focusFirstMissing(kinds = selectedKinds()) {
    const first = missingControls(kinds)[0];
    if (!first) return false;
    first.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(() => first.focus({preventScroll:true}),250);
    return true;
  }

  function templatesReady(kinds = selectedKinds()) {
    if (typeof state === 'undefined' || !state?.templates) return false;
    return kinds.every(kind => state.templates.has(kind));
  }

  function syncSelectionButtons() {
    $$('[data-output-doc]').forEach(button => {
      const on = selectedDocs.has(button.dataset.outputDoc);
      button.setAttribute('aria-selected',String(on));
      button.setAttribute('aria-pressed',String(on));
      button.textContent = `${on ? '✓ ' : ''}${docLabel(button.dataset.outputDoc)}`;
    });
  }

  function updatePrintSummary() {
    const out = $('#tdPrintSummary');
    if (!out) return;
    const parts = [];
    let total = 0;
    DOCS.forEach(doc => {
      const check = $(`[data-print-doc="${doc.kind}"]`);
      const input = $(`[data-print-copies="${doc.kind}"]`);
      if (!check || !input || !check.checked) return;
      let n = Number.parseInt(input.value,10);
      if (!Number.isFinite(n)) n = 1;
      n = Math.max(1,Math.min(20,n));
      input.value = String(n);
      total += n;
      parts.push(`${doc.label}: ${n}`);
    });
    out.textContent = total ? `К печати: ${parts.join(' · ')}. Всего экземпляров: ${total}.` : 'Выберите хотя бы один документ.';

    const master = $('#tdPrintAll');
    if (master) {
      const checks = $$('[data-print-doc]');
      const count = checks.filter(ch => ch.checked).length;
      master.checked = count === checks.length;
      master.indeterminate = count > 0 && count < checks.length;
    }
  }

  function syncPrintFromSelection() {
    const selected = new Set(selectedKinds());
    $$('[data-print-doc]').forEach(check => {
      check.checked = selected.has(check.dataset.printDoc);
      const copies = $(`[data-print-copies="${check.dataset.printDoc}"]`);
      if (copies) copies.disabled = !check.checked;
    });
    updatePrintSummary();
  }

  function syncActions() {
    const kinds = selectedKinds();
    const count = kinds.length;
    const missing = validateSelectedData(kinds);
    const readyTemplates = templatesReady(kinds);
    const blocked = missing.length > 0 || !readyTemplates;

    const save = $('#saveDocsBtn');
    const zip = $('#downloadZipBtn');
    if (save) {
      save.textContent = `Сформировать и сохранить ${count} DOCX`;
      save.disabled = blocked || exportBusy;
      save.title = blocked ? 'Заполните обязательные поля для выбранных документов' : '';
    }
    if (zip) {
      zip.textContent = `Скачать ZIP с ${count} DOCX`;
      zip.disabled = blocked || exportBusy;
      zip.title = blocked ? 'Заполните обязательные поля для выбранных документов' : '';
    }

    const badge = $('#readinessBadge');
    const status = $('#validationStatus');
    if (badge) {
      badge.textContent = blocked ? 'Не готово' : 'Готово';
      badge.classList.toggle('ready',!blocked);
    }
    if (status) {
      if (missing.length) {
        status.className = 'status warn required-summary';
        status.textContent = `Для выбранных документов не заполнено ${missing.length}: ${missing.slice(0,8).join(', ')}${missing.length > 8 ? '...' : ''}`;
      } else if (!readyTemplates) {
        const absent = kinds.filter(kind => typeof state === 'undefined' || !state?.templates?.has(kind)).map(docLabel);
        status.className = 'status warn required-summary';
        status.textContent = `Не загружены шаблоны: ${absent.join(', ')}.`;
      } else {
        status.className = 'status ok required-summary';
        status.textContent = `Все обязательные поля для выбранных документов заполнены. Выбрано: ${count}.`;
      }
    }

    const printKinds = $$('[data-print-doc]').filter(ch => ch.checked).map(ch => ch.dataset.printDoc);
    const printButton = $('#tdPrintBtn');
    if (printButton && printKinds.length) {
      printButton.disabled = validateSelectedData(printKinds).length > 0;
      printButton.title = printButton.disabled ? 'Заполните обязательные поля для документов, выбранных к печати' : '';
    }
  }

  function updateAll() {
    applyRequiredState();
    syncSelectionButtons();
    syncActions();
  }

  function setSelection(kinds) {
    const valid = DOCS.map(doc => doc.kind).filter(kind => kinds.includes(kind));
    if (!valid.length) return false;
    selectedDocs.clear();
    valid.forEach(kind => selectedDocs.add(kind));
    syncPrintFromSelection();
    updateAll();
    if (typeof window.render === 'function') window.render();
    syncActions();
    return true;
  }

  function setDocumentSelected(kind,on) {
    if (!DOCS.some(doc => doc.kind === kind)) return false;
    const next = new Set(selectedDocs);
    if (on) next.add(kind);
    else next.delete(kind);
    if (!next.size) return false;
    return setSelection([...next]);
  }

  function showSelectionHint(text) {
    const hint = $('#tdOutputHint');
    if (!hint) return;
    const normal = 'Выберите документы для формирования. Можно выбрать 1, 2 или 3.';
    hint.textContent = text;
    if (text !== normal) setTimeout(() => { if (hint) hint.textContent = normal; },1800);
  }

  function mountSelectionUi() {
    if ($('#tdOutputDocs')) return true;
    const previewCard = $('.preview-card.live-doc-preview-card') || $('.preview-card');
    const previewTabs = previewCard?.querySelector('.td-doc-tabs');
    if (!previewCard || !previewTabs) return false;

    const hint = document.createElement('div');
    hint.id = 'tdOutputHint';
    hint.className = 'td-live-note';
    hint.textContent = 'Выберите документы для формирования. Можно выбрать 1, 2 или 3.';

    const controls = document.createElement('div');
    controls.id = 'tdOutputDocs';
    controls.className = 'td-doc-tabs';
    controls.setAttribute('aria-label','Документы для формирования');

    DOCS.forEach(doc => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'td-doc-tab';
      button.dataset.outputDoc = doc.kind;
      button.setAttribute('aria-selected','true');
      button.setAttribute('aria-pressed','true');
      button.textContent = `✓ ${doc.label}`;
      button.title = `Включить или исключить документ «${doc.label}» из комплекта`;
      button.addEventListener('click',() => {
        const next = !selectedDocs.has(doc.kind);
        if (!setDocumentSelected(doc.kind,next)) {
          showSelectionHint('Нужно оставить выбранным хотя бы один документ.');
          syncSelectionButtons();
        }
      });
      controls.appendChild(button);
    });

    const previewHint = document.createElement('div');
    previewHint.className = 'td-live-note';
    previewHint.textContent = 'Предпросмотр документа:';

    previewTabs.before(hint,controls,previewHint);
    syncSelectionButtons();
    return true;
  }

  function wirePrintControls() {
    const box = $('#tdPrintBox');
    if (!box || printWired) return false;
    printWired = true;

    $$('[data-print-doc]',box).forEach(check => {
      check.addEventListener('change',() => {
        const chosen = $$('[data-print-doc]',box).filter(ch => ch.checked).map(ch => ch.dataset.printDoc);
        if (!chosen.length) {
          const active = $('[data-doc-tab][aria-selected="true"]')?.dataset.docTab || selectedKinds()[0] || 'poa';
          setSelection([active]);
          showSelectionHint('Нужно оставить выбранным хотя бы один документ.');
        } else {
          setSelection(chosen);
        }
        syncPrintFromSelection();
      });
    });

    const master = $('#tdPrintAll',box);
    if (master) {
      master.addEventListener('change',() => {
        const chosen = $$('[data-print-doc]',box).filter(ch => ch.checked).map(ch => ch.dataset.printDoc);
        if (chosen.length) setSelection(chosen);
        else {
          const active = $('[data-doc-tab][aria-selected="true"]')?.dataset.docTab || 'poa';
          setSelection([active]);
          showSelectionHint('Нельзя снять выбор со всех документов. Оставлен текущий документ.');
        }
        syncPrintFromSelection();
      });
    }

    const currentButton = $$('button',box).find(button => button.textContent.trim() === 'Только текущая вкладка');
    if (currentButton) {
      currentButton.addEventListener('click',() => {
        const active = $('[data-doc-tab][aria-selected="true"]')?.dataset.docTab || 'poa';
        setSelection([active]);
        syncPrintFromSelection();
      });
    }

    syncPrintFromSelection();
    return true;
  }

  async function buildSelectedDocuments() {
    if (typeof state === 'undefined') throw new Error('Состояние приложения недоступно. Обновите страницу.');
    if (state.busy || exportBusy) throw new Error('Формирование уже выполняется.');

    const kinds = selectedKinds();
    if (!kinds.length) throw new Error('Выберите хотя бы один документ.');
    const absent = kinds.filter(kind => !state.templates.has(kind));
    if (absent.length) throw new Error(`Не загружены шаблоны: ${absent.map(docLabel).join(', ')}.`);

    const missing = validateSelectedData(kinds);
    if (missing.length) throw new Error('Не заполнено: ' + missing.slice(0,8).join(', ') + (missing.length > 8 ? '...' : ''));

    state.busy = true;
    exportBusy = true;
    updateAll();
    try {
      const ctx = buildContext();
      const docs = new Map();
      for (const kind of kinds) {
        const bytes = await fillDocx(state.templates.get(kind),ctx);
        docs.set(kind,bytes);
      }
      return docs;
    } finally {
      state.busy = false;
      exportBusy = false;
      updateAll();
    }
  }

  async function saveSelectedDocuments(docs) {
    if (!state.outputHandle) throw new Error('Папка хранения не выбрана.');
    if (!$('#localFolderConfirm')?.checked) throw new Error('Подтвердите, что выбранная папка локальная и не синхронизируется с облаком.');

    const root = await state.outputHandle.getDirectoryHandle('Тестдрайв',{create:true});
    const d = getData();
    const date = formatDateIso(d.testDriveDate) || formatDateIso(new Date().toISOString().slice(0,10));
    const folderName = safeFilePart(`${d.fullName} ${date}`);
    const participant = await root.getDirectoryHandle(folderName,{create:true});

    for (const [kind,bytes] of docs.entries()) {
      await saveBytesToHandle(participant,OUTPUT_NAMES[kind],bytes);
    }
    return `Тестдрайв / ${folderName}`;
  }

  function buildSelectedZip(docs) {
    const entries = [...docs.entries()].map(([kind,data]) => ({name:OUTPUT_NAMES[kind],data}));
    return writeZip(entries);
  }

  async function runSave() {
    const count = selectedKinds().length;
    try {
      setStatus('#exportStatus',`Формирую ${count} DOCX локально в браузере...`,'busy');
      const docs = await buildSelectedDocuments();
      const folder = await saveSelectedDocuments(docs);
      setStatus('#exportStatus',`Готово. ${docs.size} DOCX сохранено в ${folder}.`,'ok');
    } catch (e) {
      setStatus('#exportStatus',e?.message || 'Не удалось сформировать документы.','warn');
      focusFirstMissing();
    } finally {
      updateAll();
    }
  }

  async function runZip() {
    const count = selectedKinds().length;
    try {
      setStatus('#exportStatus',`Формирую ZIP с ${count} DOCX локально в браузере...`,'busy');
      const docs = await buildSelectedDocuments();
      const zip = buildSelectedZip(docs);
      const d = getData();
      const name = `TestDrive_${safeFilePart(d.fullName)}_${(d.testDriveDate || new Date().toISOString().slice(0,10))}.zip`;
      downloadBlob(new Blob([zip],{type:'application/zip'}),name);
      setStatus('#exportStatus',`ZIP сформирован локально. В архиве: ${docs.size} DOCX.`,'ok');
    } catch (e) {
      setStatus('#exportStatus',e?.message || 'Не удалось сформировать ZIP.','warn');
      focusFirstMissing();
    } finally {
      updateAll();
    }
  }

  function interceptActions(event) {
    const target = event.target instanceof Element ? event.target.closest('button') : null;
    if (!target) return;

    if (target.id === 'saveDocsBtn' || target.id === 'downloadZipBtn') {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (target.disabled) return;
      if (target.id === 'saveDocsBtn') void runSave();
      else void runZip();
      return;
    }

    if (target.id === 'tdPrintBtn') {
      const kinds = $$('[data-print-doc]').filter(ch => ch.checked).map(ch => ch.dataset.printDoc);
      const missing = validateSelectedData(kinds.length ? kinds : selectedKinds());
      if (!missing.length) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      focusFirstMissing(kinds.length ? kinds : selectedKinds());
    }
  }

  function setVersionText() {
    const meta = $('.title-wrap span');
    if (meta) meta.textContent = 'v0.4.0 · обязательные поля по выбранным документам · локальная обработка';
    const footer = $('footer');
    if (footer) footer.textContent = 'TestDrive_Doc Web v0.4.0 · 11.09.2026 · обязательные поля по выбранным документам';
  }

  function boot() {
    if (mounted) return;
    mounted = true;

    window.validateData = validateSelectedData;
    window.TestDriveDocs = {
      getSelected: selectedKinds,
      isSelected: kind => selectedDocs.has(kind),
      setSelected: setDocumentSelected,
      setSelection,
      getRequiredFields: () => requiredRows().map(([key,label]) => ({key,label}))
    };

    setVersionText();
    document.addEventListener('click',interceptActions,true);
    $$('[data-f]').forEach(el => {
      el.addEventListener('input',updateAll);
      el.addEventListener('change',updateAll);
    });
    $$('[data-c]').forEach(el => el.addEventListener('change',updateAll));
    $('#clearBtn')?.addEventListener('click',() => setTimeout(updateAll,0));

    const mountExtras = () => {
      mountSelectionUi();
      wirePrintControls();
      updateAll();
    };
    mountExtras();
    setTimeout(mountExtras,250);
    setTimeout(mountExtras,800);
    setInterval(() => {
      if (!$('#tdOutputDocs')) mountSelectionUi();
      if (!printWired) wirePrintControls();
      updateAll();
    },700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();