const EVENTS=[
{date:'2026-09-15',dateLabel:'15–17.09.2026',name:'CeMAT RUSSIA 2026',city:'Москва',region:'Москва',audience:'Логистика, ритейл, e-commerce, производство',score:98,priority:'A',next:'Запросить стенд/партнерство и список участников',value:'Концентрация ЛПР по логистике, supply chain и крупному ритейлу.',atom:'Прямые встречи по корпоративным паркам, TCO и пилотам АТОМ.'},
{date:'2026-09-22',dateLabel:'22–23.09.2026',name:'Е-РИТЕЙЛ ФОРУМ 2026',city:'Москва',region:'Москва',audience:'X5, Магнит, Лента, Wildberries, Ozon, Lamoda, СДЭК',score:99,priority:'A',next:'Предложить статус партнера мобильности',value:'Федеральный ритейл, маркетплейсы и last mile в одном месте.',atom:'Пилоты с сетями, корпоративная мобильность и статус партнера форума.'},
{date:'2026-09-29',dateLabel:'29.09–01.10.2026',name:'ЭлектроТранс / EMI 2026',city:'Москва',region:'Москва',audience:'EV, корпоративные парки, города, зарядная инфраструктура',score:100,priority:'A',next:'Добиваться центральной экспозиции и тест-драйва',value:'Самая профильная аудитория по EV, зарядке и электротранспорту.',atom:'Показать связку АТОМ + ЭЗС и получить городские и корпоративные пилоты.'},
{date:'2026-10-14',dateLabel:'14–16.10.2026',name:'Российская энергетическая неделя 2026',city:'Москва',region:'Москва',audience:'ТЭК, энергокомпании, власти, крупный бизнес',score:95,priority:'A',next:'Предложить VIP-тест-драйв и EV-кейс',value:'Топ-менеджмент энергетики, ТЭК и инфраструктурные партнеры.',atom:'Партнерства по зарядке и крупные корпоративные EV-парки.'},
{date:'2026-10-19',dateLabel:'19–21.10.2026',name:'TransRussia Summit 2026',city:'Москва',region:'Москва',audience:'Топ-руководители логистики, ритейла и e-commerce',score:99,priority:'A',next:'Предложить эксклюзивную категорию «Партнер мобильности»',value:'Высокая плотность топ-ЛПР логистики и крупнейших грузовладельцев.',atom:'Переговоры о fleet-TCO, пилотах и закупках корпоративных автомобилей.'},
{date:'2026-10-29',dateLabel:'29–31.10.2026',name:'Kazan Digital Week 2026',city:'Казань',region:'Республика Татарстан',audience:'Государство, IT, smart city, интеллектуальный транспорт',score:92,priority:'A',next:'Подать заявку на партнерство и сессию connected mobility',value:'Регионы, smart city, цифровой транспорт и государственные заказчики.',atom:'Региональные пилоты АТОМ и интеграции в умную городскую мобильность.'},
{date:'2026-11-10',dateLabel:'10–12.11.2026',name:'Parking Russia 2026',city:'Москва',region:'Москва',audience:'Девелоперы, УК, парковки, зарядная инфраструктура',score:94,priority:'A',next:'Собрать пакет «АТОМ для объекта недвижимости»',value:'Девелоперы, управляющие компании, парковки и операторы ЭЗС.',atom:'Пакет АТОМ + зарядка для БЦ, ЖК, отелей и корпоративных объектов.'},
{date:'2026-11-18',dateLabel:'18–20.11.2026',name:'Транспорт России 2026',city:'Москва',region:'Москва',audience:'Минтранс, регионы, госкомпании, транспортные операторы',score:98,priority:'A',next:'Подготовить предложения для 15 регионов',value:'Федеральные и региональные транспортные ЛПР, госкомпании.',atom:'Региональные соглашения, госкомпании и пилоты в служебных парках.'},
{date:'2027-03-16',dateLabel:'16–18.03.2027',name:'TransRussia 2027',city:'Москва',region:'Москва',audience:'Логистика, supply chain, ритейл, транспорт',score:100,priority:'A',next:'Бронировать сейчас; цель 50+ встреч',value:'Крупнейшая концентрация логистики, ритейла и supply chain.',atom:'Масштабный ABM: десятки встреч, TCO-расчеты и корпоративные пилоты.'},
{date:'2027-03-24',dateLabel:'24.03.2027',name:'VPROC 2027',city:'Москва',region:'Москва',audience:'Директора по закупкам и цепям поставок',score:91,priority:'A',next:'Предложить сессию по TCO корпоративного EV-парка',value:'Прямой доступ к директорам по закупкам крупных компаний.',atom:'Вывести АТОМ в закупочные планы через TCO и пилот корпоративного парка.'},
{date:'2027-05-12',dateLabel:'12–14.05.2027',name:'ГОСЗАКАЗ 2027',city:'Москва',region:'Москва',audience:'Федеральные, региональные и муниципальные заказчики',score:97,priority:'A',next:'Готовить продукт под 44-ФЗ/223-ФЗ',value:'Государственные и корпоративные закупщики федерального уровня.',atom:'Выход в закупки регионов и госкомпаний, формирование требований под АТОМ.'},
{date:'2027-05-31',dateLabel:'31.05–03.06.2027',name:'Неделя российского ритейла 2027',city:'Москва',region:'Москва',audience:'Федеральные сети, государство, сервисные компании',score:99,priority:'A',next:'Предложить статус партнера мобильности',value:'CEO и функциональные директора крупнейших федеральных сетей.',atom:'Пилоты для служебных парков, last mile и мобильности сотрудников.'},
{date:'2027-07-05',dateLabel:'05–08.07.2027',name:'ИННОПРОМ 2027',city:'Екатеринбург',region:'Свердловская область',audience:'Промышленные холдинги, регионы, государство',score:96,priority:'A',next:'Собрать 40 целевых холдингов',value:'Крупные промышленные холдинги, регионы и государственный сектор.',atom:'Корпоративные парки предприятий и региональные соглашения по EV.'},
{date:'2027-08-24',dateLabel:'24–27.08.2027',name:'MIMS Automobility Москва 2027',city:'Москва',region:'Москва',audience:'Дилеры, сервис, компоненты, автобизнес',score:87,priority:'A',next:'Использовать для каналов продаж и сервиса',value:'Автобизнес, сервис, дилеры, лизинг и партнерская инфраструктура.',atom:'Развитие каналов продаж, сервиса, лизинга и B2B-экосистемы.'}
];

const STATUS_LABELS={
 new:'Не начато',
 management_review:'Согласовать с руководством',
 approved:'Одобрено',
 rejected:'Не одобрено',
 event_approval:'Есть согласование мероприятия',
 preparation:'Начата подготовка',
 event_done:'Мероприятие прошло',
 summary_uploaded:'Загружено резюме мероприятия'
};
const STATUS_NEXT={
 new:'Передать мероприятие на согласование руководству',
 management_review:'Получить решение: одобрено или не одобрено',
 approved:'Получить подтверждение/согласование участия в самом мероприятии',
 rejected:'Зафиксировать причину отказа и не запускать подготовку',
 event_approval:'Запустить подготовку: формат участия, бюджет, логистика, материалы, встречи',
 preparation:'Проверить готовность автомобиля, стенда, команды, встреч и материалов',
 event_done:'Подготовить и загрузить резюме мероприятия: лиды, встречи, договоренности, follow-up',
 summary_uploaded:'Проверить follow-up по ЛПР и закрыть результаты мероприятия'
};
const eventStatus=JSON.parse(localStorage.getItem('atomEventStatus')||'{}');
let reminders=JSON.parse(localStorage.getItem('atomReminders')||'[]');
const byDate=(a,b)=>new Date(a.date)-new Date(b.date);
function fmtDate(v){const d=new Date(v+'T00:00:00');return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});}
function daysUntil(v){return Math.ceil((new Date(v+'T00:00:00')-new Date(new Date().toDateString()))/86400000);}
function save(){localStorage.setItem('atomEventStatus',JSON.stringify(eventStatus));localStorage.setItem('atomReminders',JSON.stringify(reminders));}
function statusOf(name){return eventStatus[name]||'new';}

function setView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(name+'View').classList.add('active');document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='events')renderEvents();if(name==='reminders')renderReminders();}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>setView(b.dataset.view));document.querySelectorAll('[data-open-reminders]').forEach(b=>b.onclick=()=>setView('reminders'));

function renderDashboard(){
 const future=EVENTS.filter(e=>daysUntil(e.date)>=0).sort(byDate); const next=future[0];
 document.getElementById('kpiEvents').textContent=EVENTS.length;
 document.getElementById('kpiA').textContent=EVENTS.filter(e=>e.priority==='A').length;
 document.getElementById('kpiNext').textContent=next?Math.max(0,daysUntil(next.date))+' дн.':'—';
 document.getElementById('kpiNextName').textContent=next?next.name:'Нет ближайших';
 document.getElementById('kpiReminders').textContent=reminders.filter(r=>!r.done).length;
 const recs=future.filter(e=>statusOf(e.name)!=='rejected'&&statusOf(e.name)!=='summary_uploaded').sort((a,b)=>b.score-a.score).slice(0,5);
 document.getElementById('recommendations').innerHTML=recs.map((e,i)=>{const st=statusOf(e.name);return `<div class="rec-card"><div class="rec-copy"><strong>${i+1}. ${e.name}</strong><div class="rec-action">${STATUS_NEXT[st]}</div><div class="rec-value"><b>Value:</b> ${e.value}</div><div class="rec-atom"><b>Для АТОМ:</b> ${e.atom}</div></div><span class="score">${e.score}/100</span></div>`}).join('');
 document.getElementById('upcomingList').innerHTML=future.slice(0,6).map(e=>`<div class="compact-item"><div><strong>${e.name}</strong><div class="reminder-meta">${e.dateLabel} · ${e.city} · ${STATUS_LABELS[statusOf(e.name)]}</div></div><span class="badge ${e.priority==='A'?'a':''}">${e.priority}</span></div>`).join('');
 const active=reminders.filter(r=>!r.done).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
 document.getElementById('dashboardReminders').innerHTML=active.length?active.map(r=>`<div class="compact-item"><div><strong>${r.title}</strong><div class="reminder-meta">${fmtDate(r.date)} · ${r.time}</div></div></div>`).join(''):'<div class="reminder-meta">Нет активных напоминаний.</div>';
}

const regionFilter=document.getElementById('regionFilter');
const cityFilter=document.getElementById('cityFilter');
const yearFilter=document.getElementById('yearFilter');
const scoreFilter=document.getElementById('scoreFilter');
function fillSelect(select,values,label){select.innerHTML=`<option value="all">${label}</option>`+values.map(v=>`<option value="${v}">${v}</option>`).join('');}
function initFilters(){
 fillSelect(regionFilter,[...new Set(EVENTS.map(e=>e.region))].sort((a,b)=>a.localeCompare(b,'ru')),'Все регионы');
 fillSelect(yearFilter,[...new Set(EVENTS.map(e=>e.date.slice(0,4)))].sort(),'Все годы');
 refreshCityFilter();
}
function refreshCityFilter(){
 const region=regionFilter.value;
 const current=cityFilter.value;
 const cities=[...new Set(EVENTS.filter(e=>region==='all'||e.region===region).map(e=>e.city))].sort((a,b)=>a.localeCompare(b,'ru'));
 fillSelect(cityFilter,cities,'Все города');
 if(cities.includes(current)) cityFilter.value=current;
}

function renderEvents(){
 const q=document.getElementById('eventSearch').value.toLowerCase();
 const p=document.getElementById('priorityFilter').value;
 const s=document.getElementById('statusFilter').value;
 const region=regionFilter.value;
 const city=cityFilter.value;
 const year=yearFilter.value;
 const minScore=scoreFilter.value==='all'?0:Number(scoreFilter.value);
 const rows=EVENTS.filter(e=>(p==='all'||e.priority===p)&&(s==='all'||statusOf(e.name)===s)&&(region==='all'||e.region===region)&&(city==='all'||e.city===city)&&(year==='all'||e.date.startsWith(year))&&e.score>=minScore&&(`${e.name} ${e.city} ${e.region} ${e.audience}`.toLowerCase().includes(q))).sort(byDate);
 document.getElementById('filterResultCount').textContent=`Найдено мероприятий: ${rows.length}`;
 document.getElementById('eventsTable').innerHTML=`<div class="event-row header"><div>Мероприятие</div><div>Дата</div><div>Скоринг</div><div>Приоритет</div><div>Этап</div><div>Действия</div></div>`+(rows.length?rows.map(e=>`<div class="event-row"><div><strong>${e.name}</strong><div class="reminder-meta">${e.city} · ${e.region} · ${e.audience}</div><div class="next-action">Следующий шаг: ${STATUS_NEXT[statusOf(e.name)]}</div></div><div>${e.dateLabel}</div><div>${e.score}/100</div><div><span class="badge ${e.priority==='A'?'a':''}">${e.priority}</span></div><div><select data-status="${encodeURIComponent(e.name)}">${Object.entries(STATUS_LABELS).map(([k,v])=>`<option value="${k}" ${statusOf(e.name)===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="event-actions"><button data-remind="${encodeURIComponent(e.name)}">Напомнить</button></div></div>`).join(''):'<div class="empty-filter">По выбранным фильтрам мероприятий нет.</div>');
 document.querySelectorAll('[data-status]').forEach(el=>el.onchange=()=>{const n=decodeURIComponent(el.dataset.status);eventStatus[n]=el.value;save();renderDashboard();renderEvents();});
 document.querySelectorAll('[data-remind]').forEach(el=>el.onclick=()=>openReminder(decodeURIComponent(el.dataset.remind)));
}
['eventSearch','priorityFilter','statusFilter','cityFilter','yearFilter','scoreFilter'].forEach(id=>document.getElementById(id).addEventListener('input',renderEvents));
regionFilter.addEventListener('input',()=>{refreshCityFilter();renderEvents();});
document.getElementById('resetFilters').onclick=()=>{
 document.getElementById('eventSearch').value='';
 regionFilter.value='all';refreshCityFilter();cityFilter.value='all';yearFilter.value='all';scoreFilter.value='all';document.getElementById('priorityFilter').value='all';document.getElementById('statusFilter').value='all';renderEvents();
};

function renderReminders(){
 const list=[...reminders].sort((a,b)=>(a.done-b.done)||((a.date+a.time).localeCompare(b.date+b.time)));
 document.getElementById('remindersList').innerHTML=list.length?list.map(r=>`<div class="reminder-card"><div><strong>${r.done?'✓ ':''}${r.title}</strong><div class="reminder-meta">${fmtDate(r.date)} · ${r.time}${r.event?' · '+r.event:''}${r.note?' · '+r.note:''}</div></div><div class="event-actions"><button data-toggle="${r.id}">${r.done?'Вернуть':'Готово'}</button><button data-ics="${r.id}">В календарь</button><button data-edit="${r.id}">Изменить</button><button data-del="${r.id}">Удалить</button></div></div>`).join(''):'<div class="reminder-meta">Напоминаний пока нет.</div>';
 document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{const r=reminders.find(x=>x.id===b.dataset.toggle);r.done=!r.done;save();renderReminders();renderDashboard();});
 document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{reminders=reminders.filter(x=>x.id!==b.dataset.del);save();renderReminders();renderDashboard();});
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openReminder(null,b.dataset.edit));
 document.querySelectorAll('[data-ics]').forEach(b=>b.onclick=()=>exportICS(b.dataset.ics));
}

const modal=document.getElementById('reminderModal');
function openReminder(eventName='',id=''){
 const r=id?reminders.find(x=>x.id===id):null; const ev=eventName?EVENTS.find(e=>e.name===eventName):null; const defaultTitle=eventName?STATUS_NEXT[statusOf(eventName)]:'';
 document.getElementById('reminderId').value=r?.id||''; document.getElementById('reminderTitle').value=r?.title||defaultTitle; document.getElementById('reminderEvent').value=r?.event||eventName||''; document.getElementById('reminderDate').value=r?.date||(ev?.date||''); document.getElementById('reminderTime').value=r?.time||'11:00'; document.getElementById('reminderNote').value=r?.note||''; modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
}
function closeReminder(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');}
document.getElementById('addReminderTop').onclick=()=>openReminder();document.getElementById('addReminderButton').onclick=()=>openReminder();document.getElementById('closeReminderModal').onclick=closeReminder;document.getElementById('cancelReminder').onclick=closeReminder;
document.getElementById('reminderForm').onsubmit=e=>{e.preventDefault();const id=document.getElementById('reminderId').value||String(Date.now());const obj={id,title:document.getElementById('reminderTitle').value.trim(),event:document.getElementById('reminderEvent').value,date:document.getElementById('reminderDate').value,time:document.getElementById('reminderTime').value,note:document.getElementById('reminderNote').value.trim(),done:false};const ix=reminders.findIndex(r=>r.id===id);if(ix>=0)obj.done=reminders[ix].done,reminders[ix]=obj;else reminders.push(obj);save();closeReminder();renderReminders();renderDashboard();};

function exportICS(id){const r=reminders.find(x=>x.id===id);if(!r)return;const dt=(r.date.replace(/-/g,'')+'T'+r.time.replace(':','')+'00');const end=new Date(r.date+'T'+r.time+':00');end.setMinutes(end.getMinutes()+30);const pad=n=>String(n).padStart(2,'0');const endStr=`${end.getFullYear()}${pad(end.getMonth()+1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;const body=`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Korytnik Hub//ATOM B2B//RU\nBEGIN:VEVENT\nDTSTART:${dt}\nDTEND:${endStr}\nSUMMARY:${r.title.replace(/\n/g,' ')}\nDESCRIPTION:${(r.note||r.event||'').replace(/\n/g,' ')}\nEND:VEVENT\nEND:VCALENDAR`;const blob=new Blob([body],{type:'text/calendar;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='atom-b2b-reminder.ics';a.click();URL.revokeObjectURL(a.href);}

document.getElementById('notifyButton').onclick=async()=>{if(!('Notification'in window)){alert('Браузер не поддерживает уведомления. Используйте кнопку «В календарь».');return;}const p=await Notification.requestPermission();document.getElementById('notifyButton').textContent=p==='granted'?'Уведомления включены':'Уведомления недоступны';};
setInterval(()=>{if(Notification.permission!=='granted')return;const now=new Date();reminders.filter(r=>!r.done&&!r.notified).forEach(r=>{const d=new Date(`${r.date}T${r.time}:00`);if(now>=d&&now-d<60000){new Notification('АТОМ B2B',{body:r.title});r.notified=true;save();}});},30000);

const eventSel=document.getElementById('reminderEvent');EVENTS.sort(byDate).forEach(e=>{const o=document.createElement('option');o.value=e.name;o.textContent=e.name;eventSel.appendChild(o);});
initFilters();renderDashboard();renderEvents();renderReminders();
