(function(){
 const CONTACT_ENDPOINT='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-lpr-contact';
 const base={
  'ПАО «Россети»':['Екатерина Григорьева','Директор по закупкам','A','',''],
  'Ростелеком':['Татьяна Карасёва','Вице-президент, директор по закупкам','A','',''],
  'МТС':['Юлия Трухчева','Директор по закупкам и трансформации','B','',''],
  'МегаФон':['Алексей Крутицкий','Директор по закупкам и логистике','B','',''],
  'билайн':['Нина Тер-Михайлова','Директор дирекции по закупкам и логистике','B','',''],
  'T2':['Евгений Леонов','Руководитель центра компетенций закупок','B','',''],
  'Россети Московский регион':['Алексей Фомин','Директор по логистике и материально-техническому обеспечению','A','84956624070;84953634070','client@rossetimr.ru'],
  'Интер РАО':['Сергей Виноградов','Руководитель Центра снабжения / закупочного центра','A','84956648840','akkred@interrao.ru'],
  'Т Плюс':['Руслан Хальфин','Директор по закупкам и логистике','C','',''],
  'РусГидро':['Владимир Николашин','Директор департамента закупок, маркетинга и ценообразования','A','88003338000','office@rushydro.ru'],
  'Газпром нефть':['Оксана Великан','Руководитель Центра закупок «Газпромнефть — Региональные продажи»','A','',''],
  'X5 Group':['Марина Живоглазова','Руководитель некоммерческих закупок','A','84956628888','info.tender@x5.ru'],
  'Магнит':['Руководитель некоммерческих закупок','Имя публично не подтверждено','C','88612109810','info@magnit.ru'],
  'Лемана ПРО':['Елизавета Казанцева','Директор по непродуктовым / некоммерческим закупкам','A','',''],
  'Ozon':['Елена Блиндяева','Директор по закупкам','A','',''],
  'ВкусВилл':['Антон Чижов','Управляющий директор по качеству и закупкам','B','84956638602','info@vkusvill.ru'],
  'Лента':['Директор по обеспечению бизнеса / непрямым закупкам','Имя публично не подтверждено','C','88123806131','dob@lenta.com'],
  'М.Видео-Эльдорадо':['Руслан Аиткулов','Директор по закупкам','A','','tender@mvideo.ru'],
  'ПИК':['Константин Яникович','Вице-президент по закупкам и логистике','A','84955059733','dz@pik.ru'],
  'Самолет':['Артём Блинов','Директор по закупкам и тендерам','B','84959671313','info@samolet.ru'],
  'ГК ФСК':['Александр Ткаченко','Вице-президент — директор департамента закупок','B','84956601555','tender@fsk.ru'],
  'Донстрой':['Юрий Сухарь','Руководитель управления материально-технического снабжения','B','84959254747',''],
  'Sminex':['Руководитель закупок оборудования/непрямых закупок','Имя публично не подтверждено','C','84956444010','tenders@sminex.com'],
  'ГК А101':['Елена Леликова','Директор по закупкам','A','',''],
  'Пулково / ВВСС':['Станислав Лученков','Директор дирекции по снабжению','A','88123243444',''],
  'Внуково':['Павел Слободенюк','Директор по закупкам','A','',''],
  'РЖД':['Ирина Митичкина','Начальник Центральной дирекции закупок и снабжения','B','',''],
  'ВТБ':['Игорь Маринюк','Начальник управления закупок / руководитель категорийных закупок','A','84957397799','corp@vtb.ru'],
  'Альфа-Банк':['Виктор Бояркин','Директор по закупкам','A','84957555858','mail@alfabank.ru'],
  'Россельхозбанк':['Яна Лысова','Директор по закупкам','A','84953630553','zayavki@rshb.ru'],
  'ДОМ.РФ':['Диляра Баширова','Директор по закупкам','B','',''],
  'Московская биржа':['Анна Ермакова','Директор по закупкам','B','',''],
  'Сбер':['Руководитель центра снабжения / непрямых закупок','Актуальное имя публично не подтверждено','C','',''],
  'Ингосстрах':['Мария Маринина','Руководитель департамента закупок','A','',''],
  'VK':['Ксения Масчан','Директор по закупкам и логистике','B','',''],
  'Авито':['Наталья Бетяева','Директор департамента закупок','B','',''],
  'BIOCAD':['Юрий Невоструев','Руководитель закупочного направления','A','',''],
  'Биннофарм Групп':['Валерий Оратовский','Руководитель тендерного и закупочного обеспечения','B','',''],
  'Северсталь':['Вячеслав Греков','Руководитель направления закупок','A','',''],
  'Уралкалий':['Алексей Чернышев','Заместитель директора по закупкам','A','',''],
  'Уралхим':['Евгений Дацко','Заместитель директора по закупкам','A','',''],
  'ЦЕМРОС':['Денис Назаров','Директор по закупкам и логистике','A','',''],
  'АЛРОСА':['Максим Бульший','Директор Центра закупок','A','',''],
  'ММК':['Алексей Кузьмин','Коммерческий директор','B','',''],
  'Росатом':['Роман Зимонас','Директор по закупкам / МТО / качеству — требуется верификация','C','','']
 };
 const norm=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'()\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
 const eq=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
 const now=()=>new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date()).replace(',','');
 function baseRecord(name){const n=norm(name);const k=Object.keys(base).find(x=>{const nx=norm(x);return nx===n||nx.includes(n)||n.includes(nx)});if(!k)return null;const [lpr,role,grade,phone,email]=base[k];return {lpr,role,grade,phone,email};}
 function cacheKey(name){return 'atomB2BFullContact:'+norm(name)}
 function historyKey(name){return 'atomB2BContactHistory:'+norm(name)}
 function readCache(name){try{return JSON.parse(localStorage.getItem(cacheKey(name))||'null')}catch(e){return null}}
 function writeCache(name,v){localStorage.setItem(cacheKey(name),JSON.stringify(v));}
 function readHistory(name){try{return JSON.parse(localStorage.getItem(historyKey(name))||'[]')}catch(e){return []}}
 function addHistory(name,item){const h=readHistory(name);h.unshift(item);localStorage.setItem(historyKey(name),JSON.stringify(h.slice(0,20)));}
 function current(c){const cached=readCache(c.name);if(cached)return cached;const b=baseRecord(c.name);if(b)return {...b,contactType:'',contactSource:'',contactNote:'',checkedAt:''};return {lpr:c.lpr||c.lprName||'ЛПР уточняется',role:c.lprRole||c.role||'Fleet / Transport / Administrative / Procurement',grade:c.lprGrade||c.lprConfidence||'C',phone:c.phone||'',email:c.email||'',contactType:c.contactType||'',contactSource:c.contactSource||'',contactNote:c.contactNote||'',checkedAt:c.checkedAt||''};}
 window.getCompanyLpr=c=>current(c);
 function apply(c,x){c.lpr=x.lpr;c.lprRole=x.role;c.lprGrade=x.grade;c.phone=x.phone||'';c.email=x.email||'';c.contactType=x.contactType||'';c.contactSource=x.contactSource||'';c.contactNote=x.contactNote||'';c.checkedAt=x.checkedAt||'';}
 function patchData(){if(typeof allCompanies!=='function')return;allCompanies().forEach(c=>apply(c,current(c)));}
 function notify(text,kind='ok'){
  let n=document.getElementById('lprRefreshNotice');if(!n){n=document.createElement('div');n.id='lprRefreshNotice';n.style.cssText='position:fixed;right:20px;bottom:20px;z-index:9999;max-width:420px;padding:14px 16px;border-radius:10px;background:#111;color:#fff;font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.25)';document.body.appendChild(n);}n.textContent=text;n.style.background=kind==='error'?'#8b1e1e':kind==='same'?'#444':'#111';clearTimeout(window.__lprNoticeTimer);window.__lprNoticeTimer=setTimeout(()=>n.remove(),4200);
 }
 function contactHtml(c){return `<div class="contact-cell"><div>${c.phone||'<span class="muted">телефон —</span>'}</div><div>${c.email?`<a href="mailto:${c.email}">${c.email}</a>`:'<span class="muted">e-mail —</span>'}</div>${c.checkedAt?`<div class="meta">проверено ${c.checkedAt}</div>`:''}<button class="mini-btn contact-search-btn" data-company="${String(c.name).replaceAll('"','&quot;')}">${c.phone||c.email?'Обновить контакты':'Найти контакты ЛПР'}</button></div>`;}
 async function refresh(name,btn){
  const c=allCompanies().find(x=>x.name===name);if(!c)return;const old=current(c);const oldText=btn.textContent;btn.disabled=true;btn.textContent='Проверяю ЛПР и контакты…';
  try{
   const r=await fetch(CONTACT_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:c.name,lprName:old.lpr,lprRole:old.role,phone:old.phone,email:old.email})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'refresh_failed');
   const fresh={lpr:d.lpr?.name||old.lpr,role:d.lpr?.role||old.role,grade:d.lpr?.confidence||old.grade,phone:d.contact?.phone||'',email:d.contact?.email||'',contactType:d.contact?.contactType||'',contactSource:d.lpr?.source||d.contact?.sourceGeneral||d.contact?.sourcePhone||d.contact?.sourceEmail||'',contactNote:d.contact?.note||'',checkedAt:now()};
   const changes=[];[['ЛПР','lpr'],['должность','role'],['достоверность','grade'],['телефон','phone'],['e-mail','email']].forEach(([label,key])=>{if(!eq(old[key],fresh[key]))changes.push(`${label}: ${old[key]||'—'} → ${fresh[key]||'—'}`);});
   if(!changes.length){fresh.phone=old.phone;fresh.email=old.email;fresh.contactType=old.contactType;fresh.contactSource=d.lpr?.source||old.contactSource;fresh.contactNote=d.contact?.note||old.contactNote;writeCache(c.name,fresh);apply(c,fresh);notify(`Данные не изменились. ЛПР и контакты ${c.name} актуальны. Проверено ${fresh.checkedAt}.`,'same');}
   else{addHistory(c.name,{at:fresh.checkedAt,before:old,after:fresh,changes});writeCache(c.name,fresh);apply(c,fresh);notify(`Обновлено: ${c.name}. ${changes.join(' | ')}`,'ok');}
   try{localStorage.setItem('atomB2BContactCache:'+norm(c.name),JSON.stringify({phone:c.phone,email:c.email,contactType:c.contactType,contactSource:c.contactSource,contactNote:c.contactNote}));}catch(e){}
   renderSearch();
  }catch(e){console.error(e);notify('Не удалось обновить ЛПР и контакты. Попробуйте ещё раз.','error');btn.disabled=false;btn.textContent=oldText;}
 }
 function bind(){document.querySelectorAll('.contact-search-btn').forEach(b=>b.onclick=()=>refresh(b.dataset.company,b));}
 function patchSearch(){window.renderSearch=function(){patchData();const data=filtered();document.getElementById('resultCount').textContent='Найдено: '+data.length;document.getElementById('companiesTable').innerHTML=`<div class="company-row header lpr-grid"><div>Компания</div><div>ЛПР</div><div>Телефон / e-mail</div><div>Отрасль</div><div>Скоринг</div><div>Прогноз АТОМ</div><div></div></div>`+(data.length?data.map(c=>`<div class="company-row lpr-grid"><div><div class="company-name">${c.name}</div><div class="meta">${c.region||'—'}</div></div><div><div class="lpr-name">${c.lpr}</div><div class="meta">${c.lprRole||'—'} · ${c.lprGrade||'C'}</div></div><div>${contactHtml(c)}</div><div>${c.sector||'—'}</div><div><b>${c.score}</b> · ${priority(c.score)}</div><div>${fmt(c.atomMin)}–${fmt(c.atomMax)}</div><div class="company-actions"><button class="mini-btn" onclick='openCompany(${JSON.stringify(c.name)})'>Открыть</button><button class="mini-btn ${state.saved.includes(c.name)?'saved':''}" onclick='toggleSaved(${JSON.stringify(c.name)})'>★</button></div></div>`).join(''):'<div class="empty">Подходящие компании не найдены.</div>');bind();};}
 function patchModal(){const oldOpen=window.openCompany;window.openCompany=function(name){oldOpen(name);const c=allCompanies().find(x=>x.name===name);if(!c)return;apply(c,current(c));const box=document.getElementById('companyDetails');if(!box)return;const history=readHistory(c.name);const s=document.createElement('div');s.className='detail-section';s.innerHTML=`<h3>ЛПР и контакты</h3><p><strong>${c.lpr}</strong><br>${c.lprRole} · достоверность ${c.lprGrade}</p><p><strong>Телефон:</strong> ${c.phone||'не найден'}<br><strong>E-mail:</strong> ${c.email||'не найден'}</p>${c.checkedAt?`<p class="meta">Последняя проверка: ${c.checkedAt}</p>`:''}${c.contactNote?`<p>${c.contactNote}</p>`:''}<button class="secondary modal-refresh-lpr" data-company="${String(c.name).replaceAll('"','&quot;')}">Обновить ЛПР и контакты</button>${history.length?`<details style="margin-top:12px"><summary>История изменений (${history.length})</summary>${history.slice(0,5).map(h=>`<div class="meta" style="margin-top:8px">${h.at}: ${h.changes.join('; ')}</div>`).join('')}</details>`:''}`;box.insertBefore(s,box.firstChild);const b=s.querySelector('.modal-refresh-lpr');b.onclick=async()=>{await refresh(c.name,b);window.closeCompany();window.openCompany(c.name);};};}
 const st=document.createElement('style');st.textContent='.company-row.lpr-grid{grid-template-columns:1.15fr 1.05fr 1.15fr .72fr .48fr .62fr .48fr}.lpr-name{font-weight:700;font-size:12px}.contact-cell{font-size:12px;line-height:1.35}.contact-cell .muted{color:#9aa0a6}.contact-search-btn{margin-top:6px;white-space:nowrap}@media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.2fr 1.05fr 1.15fr .55fr .6fr}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(7){display:none}}';document.head.append(st);
 patchData();patchSearch();patchModal();if(typeof setView==='function')setView('search');if(typeof renderSearch==='function')renderSearch();
})();
