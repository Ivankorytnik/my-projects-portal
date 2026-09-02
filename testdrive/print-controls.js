'use strict';

(() => {
  const DOCS = [
    {kind:'poa', label:'Доверенность'},
    {kind:'questionnaire', label:'Анкета клиента'},
    {kind:'consent', label:'СОПД'}
  ];

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function clampCopies(input) {
    let n = Number.parseInt(input.value, 10);
    if (!Number.isFinite(n)) n = 1;
    n = Math.max(1, Math.min(20, n));
    input.value = String(n);
    return n;
  }

  function syncAllCheckbox() {
    const master = $('#tdPrintAll');
    if (!master) return;
    const checks = $$('[data-print-doc]');
    const selected = checks.filter(x => x.checked).length;
    master.checked = selected === checks.length;
    master.indeterminate = selected > 0 && selected < checks.length;
  }

  function updateSummary() {
    const out = $('#tdPrintSummary');
    if (!out) return;
    const parts = [];
    let total = 0;
    DOCS.forEach(doc => {
      const check = $(`[data-print-doc="${doc.kind}"]`);
      const input = $(`[data-print-copies="${doc.kind}"]`);
      if (!check || !input || !check.checked) return;
      const n = clampCopies(input);
      total += n;
      parts.push(`${doc.label}: ${n}`);
    });
    out.textContent = total ? `К печати: ${parts.join(' · ')}. Всего экземпляров: ${total}.` : 'Выберите хотя бы один документ.';
    const button = $('#tdPrintBtn');
    if (button) button.disabled = total === 0;
    syncAllCheckbox();
  }

  function buildPrintRoot() {
    let root = $('#tdPrintRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tdPrintRoot';
      root.setAttribute('aria-hidden','true');
      document.body.appendChild(root);
    }
    root.replaceChildren();
    let count = 0;
    DOCS.forEach(doc => {
      const check = $(`[data-print-doc="${doc.kind}"]`);
      const input = $(`[data-print-copies="${doc.kind}"]`);
      if (!check?.checked || !input) return;
      const source = $(`[data-doc-panel="${doc.kind}"] .td-doc-paper`);
      if (!source) return;
      const copies = clampCopies(input);
      for (let i = 0; i < copies; i++) {
        const page = source.cloneNode(true);
        page.classList.add('td-print-copy');
        page.dataset.printKind = doc.kind;
        page.dataset.printCopy = String(i + 1);
        root.appendChild(page);
        count++;
      }
    });
    return count;
  }

  function printSelected() {
    const count = buildPrintRoot();
    const status = $('#tdPrintStatus');
    if (!count) {
      if (status) status.textContent = 'Выберите хотя бы один документ для печати.';
      return;
    }
    if (status) status.textContent = `Подготовлено к печати: ${count} экз. Открываю системное окно печати...`;
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }

  function makeRow(doc) {
    const row = document.createElement('div');
    row.className = 'td-print-row';

    const label = document.createElement('label');
    label.className = 'td-print-doc';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = true;
    check.dataset.printDoc = doc.kind;
    const text = document.createElement('span');
    text.textContent = doc.label;
    label.append(check,text);

    const copiesWrap = document.createElement('label');
    copiesWrap.className = 'td-print-copies';
    const copiesText = document.createElement('span');
    copiesText.textContent = 'Экземпляров';
    const copies = document.createElement('input');
    copies.type = 'number';
    copies.min = '1';
    copies.max = '20';
    copies.step = '1';
    copies.value = '1';
    copies.inputMode = 'numeric';
    copies.dataset.printCopies = doc.kind;
    copiesWrap.append(copiesText,copies);

    check.addEventListener('change',() => {
      copies.disabled = !check.checked;
      updateSummary();
    });
    copies.addEventListener('input',updateSummary);
    copies.addEventListener('change',updateSummary);

    row.append(label,copiesWrap);
    return row;
  }

  function mount() {
    const preview = $('.preview-panel');
    const docActions = $('.doc-actions',preview || document);
    if (!preview || !docActions || $('#tdPrintBox')) return !!$('#tdPrintBox');

    const box = document.createElement('section');
    box.id = 'tdPrintBox';
    box.className = 'td-print-box';

    const head = document.createElement('div');
    head.className = 'td-print-head';
    const title = document.createElement('div');
    title.innerHTML = '<strong>Печать документов</strong><span>Выберите документы и количество экземпляров</span>';
    const masterLabel = document.createElement('label');
    masterLabel.className = 'td-print-all';
    const master = document.createElement('input');
    master.id = 'tdPrintAll';
    master.type = 'checkbox';
    master.checked = true;
    masterLabel.append(master,document.createTextNode(' Все документы'));
    head.append(title,masterLabel);

    const rows = document.createElement('div');
    rows.className = 'td-print-rows';
    DOCS.forEach(doc => rows.appendChild(makeRow(doc)));

    const summary = document.createElement('div');
    summary.id = 'tdPrintSummary';
    summary.className = 'td-print-summary';

    const actions = document.createElement('div');
    actions.className = 'td-print-actions';
    const printBtn = document.createElement('button');
    printBtn.id = 'tdPrintBtn';
    printBtn.type = 'button';
    printBtn.className = 'btn primary';
    printBtn.textContent = 'Печать выбранного';
    printBtn.addEventListener('click',printSelected);
    const currentBtn = document.createElement('button');
    currentBtn.type = 'button';
    currentBtn.className = 'btn secondary';
    currentBtn.textContent = 'Только текущая вкладка';
    currentBtn.addEventListener('click',() => {
      const active = $('[data-doc-tab][aria-selected="true"]')?.dataset.docTab || 'poa';
      $$('[data-print-doc]').forEach(ch => {
        ch.checked = ch.dataset.printDoc === active;
        const input = $(`[data-print-copies="${ch.dataset.printDoc}"]`);
        if (input) input.disabled = !ch.checked;
      });
      updateSummary();
    });
    actions.append(printBtn,currentBtn);

    const status = document.createElement('div');
    status.id = 'tdPrintStatus';
    status.className = 'status';
    status.textContent = 'Печать ещё не запускалась.';

    master.addEventListener('change',() => {
      $$('[data-print-doc]').forEach(ch => {
        ch.checked = master.checked;
        const input = $(`[data-print-copies="${ch.dataset.printDoc}"]`);
        if (input) input.disabled = !ch.checked;
      });
      updateSummary();
    });

    box.append(head,rows,summary,actions,status);
    docActions.before(box);
    updateSummary();
    return true;
  }

  function boot() {
    if (!mount()) setTimeout(boot,250);
  }

  window.addEventListener('afterprint',() => {
    const status = $('#tdPrintStatus');
    if (status) status.textContent = 'Окно печати закрыто. Можно изменить выбор и напечатать ещё раз.';
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
