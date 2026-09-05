(function(){
 const CONTACT_ENDPOINT='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-lpr-contact';
 const sheetLpr={
  'ПАО «Россети»':{lpr:'Екатерина Григорьева',role:'Директор по закупкам',grade:'A'},
  'Ростелеком':{lpr:'Татьяна Карасёва',role:'Вице-президент, директор по закупкам',grade:'A'},
  'МТС':{lpr:'Юлия Трухчева',role:'Директор по закупкам и трансформации',grade:'B'},
  'МегаФон':{lpr:'Алексей Крутицкий',role:'Директор по закупкам и логистике',grade:'B'},
  'билайн / ПАО «ВымпелКом»':{lpr:'Нина Тер-Михайлова',role:'Директор дирекции по закупкам и логистике',grade:'B'},
  'T2':{lpr:'Евгений Леонов',role:'Руководитель центра компетенций закупок',grade:'B'},
  'Россети Московский регион':{lpr:'Алексей Фомин',role:'Директор по логистике и материально-техническому обеспечению',grade:'A',phone:'+7 (495) 662-40-70; +7 (495) 363-40-70',email:'client@rossetimr.ru'},
  'Интер РАО':{lpr:'Сергей Виноградов',role:'Член Правления — руководитель Центра снабжения; гендиректор закупочного центра',grade:'A',phone:'+7 (495) 664-88-40 доб. 33-83',email:'akkred@interrao.ru'},
  'Т Плюс':{lpr:'Руслан Хальфин',role:'Директор по закупкам и логистике (последнее публичное подтверждение)',grade:'C'},
  'РусГидро':{lpr:'Владимир Николашин',role:'Директор департамента закупок, маркетинга и ценообразования',grade:'A',phone:'8 800 333-80-00',email:'office@rushydro.ru'},
  'Газпром нефть':{lpr:'Оксана Великан',role:'Руководитель Центра закупок «Газпромнефть — Региональные продажи»',grade:'A'},
  'Эн+':{lpr:'Давид Погосбеков',role:'Первый заместитель генерального директора по коммерции и капитальному строительству',grade:'A'},
  'X5 Group':{lpr:'Марина Живоглазова',role:'Руководитель некоммерческих закупок',grade:'A',phone:'+7 (495) 662-88-88',email:'info.tender@x5.ru'},
  'Магнит':{lpr:'Руководитель некоммерческих закупок',role:'Имя публично не подтверждено',grade:'C',phone:'+7 (861) 210-98-10',email:'info@magnit.ru'},
  'Лемана ПРО':{lpr:'Елизавета Казанцева',role:'Директор по непродуктовым / некоммерческим закупкам',grade:'A'},
  'Ozon':{lpr:'Елена Блиндяева',role:'Директор по закупкам',grade:'A'},
  'ВкусВилл':{lpr:'Антон Чижов',role:'Управляющий директор по качеству и закупкам',grade:'B',phone:'+7 (495) 663-86-02',email:'info@vkusvill.ru'},
  'Лента':{lpr:'Директор по обеспечению бизнеса / непрямым закупкам',role:'Имя публично не подтверждено',grade:'C',phone:'+7 (812) 380-61-31',email:'dob@lenta.com'},
  'М.Видео-Эльдорадо':{lpr:'Руслан Аиткулов',role:'Директор по закупкам',grade:'A',email:'tender@mvideo.ru'},
  'ПИК':{lpr:'Константин Яникович',role:'Вице-президент по закупкам и логистике',grade:'A',phone:'+7 (495) 505-97-33',email:'dz@pik.ru'},
  'ГК «Самолет»':{lpr:'Артём Блинов',role:'Директор по закупкам и тендерам',grade:'B',phone:'+7 (495) 967-13-13',email:'info@samolet.ru'},
  'ГК ФСК':{lpr:'Александр Ткаченко',role:'Вице-президент — директор департамента закупок',grade:'B',phone:'+7 (495) 660-15-55',email:'tender@fsk.ru'},
  'Донстрой':{lpr:'Юрий Сухарь',role:'Руководитель управления материально-технического снабжения',grade:'B',phone:'+7 (495) 925-47-47'},
  'Sminex':{lpr:'Руководитель закупок оборудования/непрямых закупок',role:'Имя публично не подтверждено',grade:'C',phone:'+7 (495) 644-40-10 доб. 2280/2281',email:'tenders@sminex.com'},
  'ГК А101':{lpr:'Елена Леликова',role:'Директор по закупкам',grade:'A'},
  'Пулково / ООО «Воздушные Ворота Северной Столицы»':{lpr:'Станислав Лученков',role:'Директор дирекции по снабжению',grade:'A',phone:'+7 (812) 324-34-44'},
  'Внуково':{lpr:'Павел Слободенюк',role:'Директор по закупкам',grade:'A'},
  'РЖД':{lpr:'Ирина Митичкина',role:'Начальник Центральной дирекции закупок и снабжения',grade:'B'},
  'ВТБ':{lpr:'Игорь Маринюк',role:'Начальник управления закупок / руководитель категорийных закупок',grade:'A',phone:'+7 (495) 739-77-99',email:'corp@vtb.ru'},
  'Альфа-Банк':{lpr:'Виктор Бояркин',role:'Директор по закупкам',grade:'A',phone:'+7 (495) 755-58-58',email:'mail@alfabank.ru'},
  'Россельхозбанк':{lpr:'Яна Лысова',role:'Директор по закупкам',grade:'A',phone:'+7 (495) 363-05-53 доб. 3412',email:'zayavki@rshb.ru'},
  'ДОМ.РФ':{lpr:'Диляра Баширова',role:'Директор по закупкам',grade:'B'},
  'Московская биржа':{lpr:'Анна Ермакова',role:'Директор по закупкам',grade:'B'},
  'Сбер':{lpr:'Руководитель центра снабжения / непрямых закупок',role:'Актуальное имя публично не подтверждено',grade:'C'},
  'Ингосстрах':{lpr:'Мария Маринина',role:'Руководитель департамента закупок',grade:'A'},
  'VK':{lpr:'Ксения Масчан',role:'Заместитель вице-президента по экономике и финансам, директор по закупкам и логистике',grade:'B'},
  'Авито':{lpr:'Наталья Бетяева',role:'Директор департамента закупок',grade:'B'},
  'BIOCAD':{lpr:'Юрий Невоструев',role:'Руководитель закупочного направления / закупок непроизводственных материалов',grade:'A'},
  'Биннофарм Групп':{lpr:'Валерий Оратовский',role:'Руководитель тендерного и закупочного обеспечения',grade:'B'},
  'Р-Фарм':{lpr:'Заместитель директора по снабжению / руководитель непрямых закупок',role:'Имя требует верификации',grade:'C'},
  'Фармстандарт':{lpr:'Директор по закупкам / административный директор',role:'Имя публично не подтверждено',grade:'C'},
  'ПРОМОМЕД':{lpr:'Директор по закупкам / операционный директор',role:'Имя публично не подтверждено',grade:'C'},
  'Генериум':{lpr:'Руководитель закупок',role:'Имя публично не подтверждено',grade:'C'},
  'Северсталь':{lpr:'Вячеслав Греков',role:'Руководитель направления закупок',grade:'A'},
  'Уралкалий':{lpr:'Алексей Чернышев',role:'Заместитель директора по закупкам',grade:'A'},
  'Уралхим':{lpr:'Евгений Дацко',role:'Заместитель директора по закупкам',grade:'A'},
  'ЦЕМРОС':{lpr:'Денис Назаров',role:'Директор по закупкам и логистике',grade:'A'},
  'АЛРОСА':{lpr:'Максим Бульший',role:'Директор Центра закупок',grade:'A'},
  'ММК':{lpr:'Алексей Кузьмин',role:'Коммерческий директор',grade:'B'},
  'Росатом':{lpr:'Роман Зимонас',role:'Директор по закупкам / МТО / качеству (требуется актуальная верификация)',grade:'C'}
 };
 const aliases={
  'билайн':'билайн / пао вымпелком','самолет':'гк самолет','пулково / ввсс':'пулково / ооо воздушные ворота северной столицы'
 };
 const norm=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'()\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
 const normalizedSheet={};Object.entries(sheetLpr).forEach(([k,v])=>normalizedSheet[norm(k)]=v);
 function sheetRecord(name){const n=norm(name);if(normalizedSheet[n])return normalizedSheet[n];const alias=aliases[n];if(alias&&normalizedSheet[norm(alias)])return normalizedSheet[norm(alias)];const key=Object.keys(normalizedSheet).find(k=>k===n||k.includes(n)||n.includes(k));return key?normalizedSheet[key]:null;}
 function findLpr(c){
  const sh=sheetRecord(c.name);if(sh)return sh;
  if(c.lpr||c.lprName)return {lpr:c.lpr||c.lprName,role:c.lprRole||c.role||'',grade:c.lprGrade||c.lprConfidence||'B',phone:c.phone||'',email:c.email||''};
  return {lpr:'ЛПР уточняется',role:'Fleet / Transport / Administrative / Procurement',grade:'C'};
 }
 window.getCompanyLpr=findLpr;
 function patchData(){
  const data=typeof allCompanies==='function'?allCompanies():[];
  data.forEach(c=>{const x=findLpr(c);c.lpr=x.lpr;c.lprRole=x.role;c.lprGrade=x.grade;if(!c.phone&&x.phone)c.phone=x.phone;if(!c.email&&x.email)c.email=x.email;});
 }
 function contactHtml(c){const phone=c.phone||'',email=c.email||'',type=c.contactType||'';return `<div class="contact-cell"><div>${phone||'<span class="muted">телефон —</span>'}</div><div>${email?`<a href="mailto:${email}">${email}</a>`:'<span class="muted">e-mail —</span>'}</div>${type?`<div class="meta">${type==='direct_business'?'прямой деловой':'корпоративный вход'}</div>`:''}<button class="mini-btn contact-search-btn" data-company="${String(c.name).replaceAll('"','&quot;')}">${phone||email?'Обновить контакты':'Найти контакты ЛПР'}</button></div>`;}
 function patchSearch(){if(typeof renderSearch!=='function')return;window.renderSearch=function(){patchData();const data=filtered();document.getElementById('resultCount').textContent='Найдено: '+data.length;document.getElementById('companiesTable').innerHTML=`<div class="company-row header lpr-grid"><div>Компания</div><div>ЛПР</div><div>Телефон / e-mail</div><div>Отрасль</div><div>Скоринг</div><div>Прогноз АТОМ</div><div></div></div>`+(data.length?data.map(c=>{const l=findLpr(c);return `<div class="company-row lpr-grid"><div><div class="company-name">${c.name}</div><div class="meta">${c.region||'—'}</div></div><div><div class="lpr-name">${l.lpr}</div><div class="meta">${l.role||'—'} · ${l.grade}</div></div><div>${contactHtml(c)}</div><div>${c.sector||'—'}</div><div><b>${c.score}</b> · ${priority(c.score)}</div><div>${fmt(c.atomMin)}–${fmt(c.atomMax)}</div><div class="company-actions"><button class="mini-btn" onclick='openCompany(${JSON.stringify(c.name)})'>Открыть</button><button class="mini-btn ${state.saved.includes(c.name)?'saved':''}" onclick='toggleSaved(${JSON.stringify(c.name)})'>★</button></div></div>`}).join(''):'<div class="empty">Подходящие компании не найдены.</div>');bindContactButtons();};}
 function persistCompany(c){if(c.custom||c.discovered){const i=state.custom.findIndex(x=>norm(x.name)===norm(c.name));if(i>=0)state.custom[i]=c;}try{localStorage.setItem('atomB2BSearchCustom',JSON.stringify(state.custom));}catch(e){}try{localStorage.setItem('atomB2BContactCache:'+norm(c.name),JSON.stringify({phone:c.phone||'',email:c.email||'',contactType:c.contactType||'',contactLabel:c.contactLabel||'',contactSource:c.contactSource||'',contactNote:c.contactNote||''}));}catch(e){}}
 function hydrateContactCache(){(typeof allCompanies==='function'?allCompanies():[]).forEach(c=>{try{const raw=localStorage.getItem('atomB2BContactCache:'+norm(c.name));if(raw){const v=JSON.parse(raw);Object.assign(c,v);}}catch(e){}});}
 async function searchContacts(name,btn){const c=typeof allCompanies==='function'?allCompanies().find(x=>x.name===name):null;if(!c)return;const l=findLpr(c);const old=btn.textContent;btn.disabled=true;btn.textContent='Ищу…';try{const r=await fetch(CONTACT_ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({company:c.name,lprName:l.lpr,lprRole:l.role})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'contact_search_failed');const x=d.contact||{};c.phone=x.phone||c.phone||'';c.email=x.email||c.email||'';c.contactType=x.contactType||'not_found';c.contactLabel=x.contactLabel||'';c.contactSource=x.sourceGeneral||x.sourcePhone||x.sourceEmail||'';c.contactNote=x.note||'';persistCompany(c);renderSearch();}catch(e){console.error(e);btn.textContent='Ошибка поиска';setTimeout(()=>{btn.textContent=old;btn.disabled=false;},1800);return;}}
 function bindContactButtons(){document.querySelectorAll('.contact-search-btn').forEach(btn=>{btn.onclick=()=>searchContacts(btn.dataset.company,btn);});}
 function patchModal(){const old=window.openCompany;window.openCompany=function(name){old(name);const c=typeof allCompanies==='function'?allCompanies().find(x=>x.name===name):null;if(!c)return;const l=findLpr(c);const box=document.getElementById('companyDetails');if(!box)return;const s=document.createElement('div');s.className='detail-section';s.innerHTML=`<h3>ЛПР</h3><p><strong>${l.lpr}</strong><br>${l.role||'—'} · достоверность ${l.grade}</p><p style="margin-top:8px"><strong>Телефон:</strong> ${c.phone||'не найден'}<br><strong>E-mail:</strong> ${c.email||'не найден'}</p>${c.contactNote?`<p>${c.contactNote}</p>`:''}${c.contactSource?`<p><a href="${c.contactSource}" target="_blank" rel="noopener">Источник контакта</a></p>`:''}<button class="secondary modal-contact-search" data-company="${String(c.name).replaceAll('"','&quot;')}">${c.phone||c.email?'Обновить контакты ЛПР':'Найти контакты ЛПР'}</button>`;box.insertBefore(s,box.firstChild);const b=s.querySelector('.modal-contact-search');b.onclick=async()=>{await searchContacts(c.name,b);window.closeCompany();window.openCompany(c.name);};};}
 function patchStyles(){const st=document.createElement('style');st.textContent='.company-row.lpr-grid{grid-template-columns:1.15fr 1.05fr 1.15fr .72fr .48fr .62fr .48fr}.lpr-name{font-weight:700;font-size:12px}.lpr-grid .meta{line-height:1.3}.contact-cell{font-size:12px;line-height:1.35}.contact-cell a{color:inherit}.contact-cell .muted{color:#9aa0a6}.contact-search-btn{margin-top:6px;white-space:nowrap}@media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.2fr 1.05fr 1.15fr .55fr .6fr}.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(7){display:none}}@media(max-width:760px){.company-row.lpr-grid{grid-template-columns:1.1fr 1fr 1.1fr}.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(6){display:none}}';document.head.append(st);}
 hydrateContactCache();patchData();patchSearch();patchModal();patchStyles();if(typeof setView==='function')setView('search');if(typeof renderSearch==='function')renderSearch();
})();
