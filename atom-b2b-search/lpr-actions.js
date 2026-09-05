(function(){
 const CONTACT_ENDPOINT='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-lpr-contact';
 const verified={
  'Ростелеком':{lpr:'Татьяна Карасева',role:'Вице-президент, директор по закупкам',grade:'A'},
  'МТС':{lpr:'Юлия Трухчева',role:'Директор по закупкам',grade:'A'},
  'МегаФон':{lpr:'Алексей Крутицкий',role:'Директор по закупкам и логистике',grade:'A'},
  'билайн':{lpr:'Нина Тер-Михайлова',role:'Руководитель закупочного направления',grade:'B'},
  'Интер РАО':{lpr:'Сергей Виноградов',role:'Руководитель Центра снабжения / закупочного центра',grade:'A'}
 };
 const norm=v=>String(v||'').toLowerCase().replace(/[«»"'()\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
 function findLpr(c){
  if(c.lpr||c.lprName)return {lpr:c.lpr||c.lprName,role:c.lprRole||c.role||'',grade:c.lprGrade||c.lprConfidence||'B'};
  const key=Object.keys(verified).find(k=>norm(k)===norm(c.name));
  return key?verified[key]:{lpr:'ЛПР уточняется',role:'Fleet / Transport / Administrative / Procurement',grade:'C'};
 }
 window.getCompanyLpr=findLpr;
 function patchData(){
  const data=typeof allCompanies==='function'?allCompanies():[];
  data.forEach(c=>{const x=findLpr(c);if(!c.lpr)c.lpr=x.lpr;if(!c.lprRole)c.lprRole=x.role;if(!c.lprGrade)c.lprGrade=x.grade;});
 }
 function contactHtml(c){
  const phone=c.phone||'';const email=c.email||'';const type=c.contactType||'';
  return `<div class="contact-cell"><div>${phone||'<span class="muted">телефон —</span>'}</div><div>${email?`<a href="mailto:${email}">${email}</a>`:'<span class="muted">e-mail —</span>'}</div>${type?`<div class="meta">${type==='direct_business'?'прямой деловой':'корпоративный вход'}</div>`:''}<button class="mini-btn contact-search-btn" data-company="${String(c.name).replaceAll('"','&quot;')}">${phone||email?'Обновить контакты':'Найти контакты ЛПР'}</button></div>`;
 }
 function patchSearch(){
  if(typeof renderSearch!=='function')return;
  window.renderSearch=function(){
   patchData();
   const data=filtered();
   document.getElementById('resultCount').textContent='Найдено: '+data.length;
   document.getElementById('companiesTable').innerHTML=`<div class="company-row header lpr-grid"><div>Компания</div><div>ЛПР</div><div>Телефон / e-mail</div><div>Отрасль</div><div>Скоринг</div><div>Прогноз АТОМ</div><div></div></div>`+(data.length?data.map(c=>{const l=findLpr(c);return `<div class="company-row lpr-grid"><div><div class="company-name">${c.name}</div><div class="meta">${c.region||'—'}</div></div><div><div class="lpr-name">${l.lpr}</div><div class="meta">${l.role||'—'} · ${l.grade}</div></div><div>${contactHtml(c)}</div><div>${c.sector||'—'}</div><div><b>${c.score}</b> · ${priority(c.score)}</div><div>${fmt(c.atomMin)}–${fmt(c.atomMax)}</div><div class="company-actions"><button class="mini-btn" onclick='openCompany(${JSON.stringify(c.name)})'>Открыть</button><button class="mini-btn ${state.saved.includes(c.name)?'saved':''}" onclick='toggleSaved(${JSON.stringify(c.name)})'>★</button></div></div>`}).join(''):'<div class="empty">Подходящие компании не найдены.</div>');
   bindContactButtons();
  };
 }
 function persistCompany(c){
  if(c.custom||c.discovered){const i=state.custom.findIndex(x=>norm(x.name)===norm(c.name));if(i>=0)state.custom[i]=c;}
  try{localStorage.setItem('atomB2BSearchCustom',JSON.stringify(state.custom));}catch(e){}
  try{localStorage.setItem('atomB2BContactCache:'+norm(c.name),JSON.stringify({phone:c.phone||'',email:c.email||'',contactType:c.contactType||'',contactLabel:c.contactLabel||'',contactSource:c.contactSource||'',contactNote:c.contactNote||''}));}catch(e){}
 }
 function hydrateContactCache(){
  (typeof allCompanies==='function'?allCompanies():[]).forEach(c=>{try{const raw=localStorage.getItem('atomB2BContactCache:'+norm(c.name));if(raw){const v=JSON.parse(raw);Object.assign(c,v);}}catch(e){}});
 }
 async function searchContacts(name,btn){
  const c=typeof allCompanies==='function'?allCompanies().find(x=>x.name===name):null;if(!c)return;
  const l=findLpr(c);const old=btn.textContent;btn.disabled=true;btn.textContent='Ищу…';
  try{
   const r=await fetch(CONTACT_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:c.name,lprName:l.lpr,lprRole:l.role})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'contact_search_failed');
   const x=d.contact||{};c.phone=x.phone||'';c.email=x.email||'';c.contactType=x.contactType||'not_found';c.contactLabel=x.contactLabel||'';c.contactSource=x.sourceGeneral||x.sourcePhone||x.sourceEmail||'';c.contactNote=x.note||'';persistCompany(c);renderSearch();
  }catch(e){console.error(e);btn.textContent='Ошибка поиска';setTimeout(()=>{btn.textContent=old;btn.disabled=false;},1800);return;}
 }
 function bindContactButtons(){document.querySelectorAll('.contact-search-btn').forEach(btn=>{btn.onclick=()=>searchContacts(btn.dataset.company,btn);});}
 function patchModal(){
  const old=window.openCompany;
  window.openCompany=function(name){old(name);const c=typeof allCompanies==='function'?allCompanies().find(x=>x.name===name):null;if(!c)return;const l=findLpr(c);const box=document.getElementById('companyDetails');if(!box)return;const s=document.createElement('div');s.className='detail-section';s.innerHTML=`<h3>ЛПР</h3><p><strong>${l.lpr}</strong><br>${l.role||'—'} · достоверность ${l.grade}</p><p style="margin-top:8px"><strong>Телефон:</strong> ${c.phone||'не найден'}<br><strong>E-mail:</strong> ${c.email||'не найден'}</p>${c.contactNote?`<p>${c.contactNote}</p>`:''}${c.contactSource?`<p><a href="${c.contactSource}" target="_blank" rel="noopener">Источник контакта</a></p>`:''}<button class="secondary modal-contact-search" data-company="${String(c.name).replaceAll('"','&quot;')}">${c.phone||c.email?'Обновить контакты ЛПР':'Найти контакты ЛПР'}</button>`;box.insertBefore(s,box.firstChild);const b=s.querySelector('.modal-contact-search');b.onclick=async()=>{await searchContacts(c.name,b);window.closeCompany();window.openCompany(c.name);};};
 }
 function patchStyles(){const st=document.createElement('style');st.textContent='.company-row.lpr-grid{grid-template-columns:1.15fr 1.05fr 1.15fr .72fr .48fr .62fr .48fr}.lpr-name{font-weight:700;font-size:12px}.lpr-grid .meta{line-height:1.3}.contact-cell{font-size:12px;line-height:1.35}.contact-cell a{color:inherit}.contact-cell .muted{color:#9aa0a6}.contact-search-btn{margin-top:6px;white-space:nowrap}@media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.2fr 1.05fr 1.15fr .55fr .6fr}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(7){display:none}}@media(max-width:760px){.company-row.lpr-grid{grid-template-columns:1.1fr 1fr 1.1fr}.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(6){display:none}}';document.head.append(st);}
 hydrateContactCache();patchData();patchSearch();patchModal();patchStyles();
 if(typeof setView==='function')setView('search');if(typeof renderSearch==='function')renderSearch();
})();
