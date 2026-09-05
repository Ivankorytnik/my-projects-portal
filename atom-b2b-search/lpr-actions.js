(function(){
 const verified={
  'Ростелеком':{lpr:'Татьяна Карасева',role:'Вице-президент, директор по закупкам',grade:'A'},
  'МТС':{lpr:'Юлия Трухчева',role:'Директор по закупкам',grade:'A'},
  'МегаФон':{lpr:'Алексей Крутицкий',role:'Директор по закупкам и логистике',grade:'A'},
  'билайн':{lpr:'Нина Тер-Михайлова',role:'Руководитель закупочного направления',grade:'B'},
  'Интер РАО':{lpr:'Сергей Виноградов',role:'Руководитель Центра снабжения / закупочного центра',grade:'A'}
 };
 const norm=v=>String(v||'').toLowerCase().replace(/[«»"'()\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
 function findLpr(c){
  if(c.lpr||c.lprName)return {lpr:c.lpr||c.lprName,role:c.lprRole||c.role||'',grade:c.lprGrade||'B'};
  const key=Object.keys(verified).find(k=>norm(k)===norm(c.name));
  return key?verified[key]:{lpr:'ЛПР уточняется',role:'Fleet / Transport / Administrative / Procurement',grade:'C'};
 }
 window.getCompanyLpr=findLpr;
 function patchData(){
  const data=typeof allCompanies==='function'?allCompanies():[];
  data.forEach(c=>{const x=findLpr(c);if(!c.lpr)c.lpr=x.lpr;if(!c.lprRole)c.lprRole=x.role;if(!c.lprGrade)c.lprGrade=x.grade;});
 }
 function patchSearch(){
  if(typeof renderSearch!=='function')return;
  const original=renderSearch;
  window.renderSearch=function(){
   patchData();
   const data=filtered();
   document.getElementById('resultCount').textContent='Найдено: '+data.length;
   document.getElementById('companiesTable').innerHTML=`<div class="company-row header lpr-grid"><div>Компания</div><div>ЛПР</div><div>Отрасль</div><div>Скоринг</div><div>Прогноз АТОМ</div><div></div></div>`+(data.length?data.map(c=>{const l=findLpr(c);return `<div class="company-row lpr-grid"><div><div class="company-name">${c.name}</div><div class="meta">${c.region||'—'}</div></div><div><div class="lpr-name">${l.lpr}</div><div class="meta">${l.role||'—'} · ${l.grade}</div></div><div>${c.sector||'—'}</div><div><b>${c.score}</b> · ${priority(c.score)}</div><div>${fmt(c.atomMin)}–${fmt(c.atomMax)}</div><div class="company-actions"><button class="mini-btn" onclick='openCompany(${JSON.stringify(c.name)})'>Открыть</button><button class="mini-btn ${state.saved.includes(c.name)?'saved':''}" onclick='toggleSaved(${JSON.stringify(c.name)})'>★</button></div></div>`}).join(''):'<div class="empty">Подходящие компании не найдены.</div>');
  };
  document.getElementById('companySearch').addEventListener('input',window.renderSearch);
  ['sectorFilter','scoreFilter','volumeFilter','priorityFilter','sortFilter'].forEach(id=>document.getElementById(id).addEventListener('change',window.renderSearch));
 }
 function patchModal(){
  const old=window.openCompany;
  window.openCompany=function(name){old(name);const c=typeof allCompanies==='function'?allCompanies().find(x=>x.name===name):null;if(!c)return;const l=findLpr(c);const box=document.getElementById('companyDetails');if(!box)return;const s=document.createElement('div');s.className='detail-section';s.innerHTML=`<h3>ЛПР</h3><p><strong>${l.lpr}</strong><br>${l.role||'—'} · достоверность ${l.grade}</p>`;box.insertBefore(s,box.firstChild);};
 }
 function patchStyles(){const st=document.createElement('style');st.textContent='.company-row.lpr-grid{grid-template-columns:1.25fr 1.15fr .8fr .5fr .7fr .55fr}.lpr-name{font-weight:700;font-size:12px}.lpr-grid .meta{line-height:1.3}@media(max-width:1000px){.company-row.lpr-grid{grid-template-columns:1.3fr 1.2fr .65fr .65fr}.company-row.lpr-grid>:nth-child(3),.company-row.lpr-grid>:nth-child(6){display:none}}@media(max-width:640px){.company-row.lpr-grid{grid-template-columns:1.2fr 1fr .55fr}.company-row.lpr-grid>:nth-child(4){display:none}}';document.head.append(st);}
 patchData();patchSearch();patchModal();patchStyles();
 if(typeof setView==='function')setView('search');
 if(typeof renderSearch==='function')renderSearch();
})();
