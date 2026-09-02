'use strict';

(() => {
  const DB_NAME = 'TestDriveDocTemplates';
  const STORE = 'templates';
  const VERSION_KEY = 'templateVersion';
  const KINDS = ['poa','questionnaire','consent'];

  function openDb() {
    return new Promise((resolve,reject) => {
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbGet(key) {
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function dbPut(key,value) {
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(value,key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async function dbClear() {
    const db = await openDb();
    return new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
  function status(text, mode='') {
    if (typeof setStatus === 'function') setStatus('#templatesStatus',text,mode);
    else {
      const el = document.querySelector('#templatesStatus');
      if (el) el.textContent = text;
    }
  }
  async function loadSavedTemplates() {
    try {
      const map = new Map();
      for (const kind of KINDS) {
        const row = await dbGet(kind);
        if (row?.blob) map.set(kind,new File([row.blob],row.name || TEMPLATE_NAMES[kind],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      }
      if (map.size === 3) {
        state.templates = map;
        const version = await dbGet(VERSION_KEY);
        status(`Активны сохранённые шаблоны${version ? ` · ${version}` : ''}. Персональные данные в хранилище шаблонов не записываются.`,'ok');
        render();
        return true;
      }
    } catch (_) {}
    return false;
  }
  async function loadSiteTemplates() {
    try {
      const manifestRes = await fetch('./templates/manifest.json',{cache:'no-store',credentials:'same-origin'});
      if (!manifestRes.ok) throw new Error('manifest');
      const manifest = await manifestRes.json();
      const map = new Map();
      for (const kind of KINDS) {
        const name = manifest.templates?.[kind] || TEMPLATE_NAMES[kind];
        const res = await fetch(`./templates/${encodeURIComponent(name)}`,{cache:'no-store',credentials:'same-origin'});
        if (!res.ok) throw new Error(name);
        const blob = await res.blob();
        map.set(kind,new File([blob],name,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      }
      state.templates = map;
      status(`Штатные шаблоны сайта загружены · версия ${manifest.version || manifest.updated || 'текущая'}.`,'ok');
      render();
      return true;
    } catch (_) {
      status('Штатные шаблоны ещё не опубликованы. Нажмите «Обновить шаблоны» и выберите 3 DOCX.','warn');
      render();
      return false;
    }
  }
  async function saveFiles(files) {
    const byName = new Map([...files].map(f => [f.name.toLowerCase(),f]));
    const selected = new Map();
    for (const kind of KINDS) {
      const expected = TEMPLATE_NAMES[kind].toLowerCase();
      const file = byName.get(expected);
      if (file) selected.set(kind,file);
    }
    if (selected.size !== 3) throw new Error('Выберите 3 файла: poa_template.docx, questionnaire_template.docx и consent_template.docx.');
    for (const [kind,file] of selected) await dbPut(kind,{name:file.name,blob:file,lastModified:file.lastModified});
    const stamp = new Intl.DateTimeFormat('ru-RU',{dateStyle:'short',timeStyle:'short'}).format(new Date());
    await dbPut(VERSION_KEY,`обновлено ${stamp}`);
    state.templates = selected;
    status(`Шаблоны обновлены и сохранены только в этом браузере · ${stamp}.`,'ok');
    render();
  }
  function addSecurityLinks() {
    const actions = document.querySelector('.top-actions');
    if (actions && !actions.querySelector('.pdn-security-link')) {
      const a = document.createElement('a');
      a.href = './security.html';
      a.className = 'btn ghost pdn-security-link';
      a.textContent = 'Безопасность ПДн';
      actions.insertBefore(a, document.querySelector('#lockBtn'));
    }
    const banner = document.querySelector('.security-banner > div');
    if (banner && !banner.querySelector('.pdn-more-link')) {
      const more = document.createElement('a');
      more.href = './security.html';
      more.className = 'pdn-more-link';
      more.textContent = 'Почему это безопасно →';
      more.style.cssText = 'display:inline-block;margin-top:8px;color:#08776f;font-weight:700;text-decoration:none;font-size:13px';
      banner.appendChild(more);
    }
  }
  function addUi() {
    addSecurityLinks();
    const card = document.querySelector('.setup-card');
    const input = document.querySelector('#templateFilesInput');
    const oldBtn = document.querySelector('#chooseTemplatesBtn');
    if (!card || !input) return;
    if (oldBtn) oldBtn.style.display = 'none';
    const p = card.querySelector('p');
    if (p) p.textContent = 'Штатные Word-шаблоны загружаются с сайта автоматически. Если форма изменилась, нажмите «Обновить шаблоны» и выберите новые 3 DOCX. Новая версия сохранится только в этом браузере.';
    const wrap = document.createElement('div');
    wrap.className = 'doc-actions template-actions';
    const update = document.createElement('button');
    update.type='button'; update.className='btn secondary'; update.textContent='Обновить шаблоны';
    const site = document.createElement('button');
    site.type='button'; site.className='btn ghost'; site.textContent='Вернуть версию сайта';
    wrap.append(update,site);
    input.parentElement.style.display='none';
    input.multiple=true;
    update.addEventListener('click',() => input.click());
    input.addEventListener('change',async e => {
      try { await saveFiles(e.target.files || []); }
      catch(err) { status(err.message || 'Не удалось обновить шаблоны.','warn'); }
      finally { input.value=''; }
    },{capture:true});
    site.addEventListener('click',async() => {
      if (!confirm('Вернуть штатные шаблоны сайта? Локально обновлённые шаблоны будут удалены.')) return;
      await dbClear();
      await loadSiteTemplates();
    });
    card.insertBefore(wrap,document.querySelector('#templatesStatus'));
  }
  async function boot() {
    addUi();
    const saved = await loadSavedTemplates();
    if (!saved) await loadSiteTemplates();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
