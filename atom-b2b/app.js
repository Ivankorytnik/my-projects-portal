const EVENTS=[
{date:'2026-09-15',dateLabel:'15–17.09.2026',name:'CeMAT RUSSIA 2026',city:'Москва',audience:'Логистика, ритейл, e-commerce, производство',score:98,priority:'A',next:'Запросить стенд/партнерство и список участников'},
{date:'2026-09-22',dateLabel:'22–23.09.2026',name:'Е-РИТЕЙЛ ФОРУМ 2026',city:'Москва',audience:'X5, Магнит, Лента, Wildberries, Ozon, Lamoda, СДЭК',score:99,priority:'A',next:'Предложить статус партнера мобильности'},
{date:'2026-09-29',dateLabel:'29.09–01.10.2026',name:'ЭлектроТранс / EMI 2026',city:'Москва',audience:'EV, корпоративные парки, города, зарядная инфраструктура',score:100,priority:'A',next:'Добиваться центральной экспозиции и тест-драйва'},
{date:'2026-10-14',dateLabel:'14–16.10.2026',name:'Российская энергетическая неделя 2026',city:'Москва',audience:'ТЭК, энергокомпании, власти, крупный бизнес',score:95,priority:'A',next:'Предложить VIP-тест-драйв и EV-кейс'},
{date:'2026-10-19',dateLabel:'19–21.10.2026',name:'TransRussia Summit 2026',city:'Москва',audience:'Топ-руководители логистики, ритейла и e-commerce',score:99,priority:'A',next:'Предложить эксклюзивную категорию «Партнер мобильности»'},
{date:'2026-10-29',dateLabel:'29–31.10.2026',name:'Kazan Digital Week 2026',city:'Казань',audience:'Государство, IT, smart city, интеллектуальный транспорт',score:92,priority:'A',next:'Подать заявку на партнерство и сессию connected mobility'},
{date:'2026-11-10',dateLabel:'10–12.11.2026',name:'Parking Russia 2026',city:'Москва',audience:'Девелоперы, УК, парковки, зарядная инфраструктура',score:94,priority:'A',next:'Собрать пакет «АТОМ для объекта недвижимости»'},
{date:'2026-11-18',dateLabel:'18–20.11.2026',name:'Транспорт России 2026',city:'Москва',audience:'Минтранс, регионы, госкомпании, транспортные операторы',score:98,priority:'A',next:'Подготовить предложения для 15 регионов'},
{date:'2027-03-16',dateLabel:'16–18.03.2027',name:'TransRussia 2027',city:'Москва',audience:'Логистика, supply chain, ритейл, транспорт',score:100,priority:'A',next:'Бронировать сейчас; цель 50+ встреч'},
{date:'2027-03-24',dateLabel:'24.03.2027',name:'VPROC 2027',city:'Москва',audience:'Директора по закупкам и цепям поставок',score:91,priority:'A',next:'Предложить сессию по TCO корпоративного EV-парка'},
{date:'2027-05-12',dateLabel:'12–14.05.2027',name:'ГОСЗАКАЗ 2027',city:'Москва',audience:'Федеральные, региональные и муниципальные заказчики',score:97,priority:'A',next:'Готовить продукт под 44-ФЗ/223-ФЗ'},
{date:'2027-05-31',dateLabel:'31.05–03.06.2027',name:'Неделя российского ритейла 2027',city:'Москва',audience:'Федеральные сети, государство, сервисные компании',score:99,priority:'A',next:'Предложить статус партнера мобильности'},
{date:'2027-07-05',dateLabel:'05–08.07.2027',name:'ИННОПРОМ 2027',city:'Екатеринбург',audience:'Промышленные холдинги, регионы, государство',score:96,priority:'A',next:'Собрать 40 целевых холдингов'},
{date:'2027-08-24',dateLabel:'24–27.08.2027',name:'MIMS Automobility Москва 2027',city:'Москва',audience:'Дилеры, сервис, компоненты, автобизнес',score:87,priority:'A',next:'Использовать для каналов продаж и сервиса'}
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
 document.getElementById('recommendations').innerHTML=recs.map((e,i)=>{const st=statusOf(e.name);return `<div class="rec-card"><div><strong>${i+1}. ${e.name}</strong><small><b>${STATUS_LABELS[st]}</b> · ${STATUS_NEXT[st]}</small></div><span class="score">${e.score}/100</span></div>`}).join('');
 document.getElementById('upcomingList').innerHTML=future.slice(0,6).map(e=>`<div class="compact-item"><div><strong>${e.name}</strong><div class="reminder-meta">${e.dateLabel} · ${e.city} · ${STATUS_LABELS[statusOf(e.name)]}</div></div><span class="badge ${e.priority==='A'?'a':''}">${e.priority}</span></div>`).join('');
 const active=reminders.filter(r=>!r.done).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5);
 document.getElementById('dashboardReminders').innerHTML=active.length?active.map(r=>`<div class="compact-item"><div><strong>${r.title}</strong><div class="reminder-meta">${fmtDate(r.date)} · ${r.time}</div></div></div>`).join(''):'<div class="reminder-meta">Нет активных напоминаний.</div>';
}

function renderEvents(){
 const q=document.getElementById('eventSearch').value.toLowerCase(); const p=document.getElementById('priorityFilter').value; const s=document.getElementById('statusFilter').value;
 const rows=EVENTS.filter(e=>(p==='all'||e.priority===p)&&(s==='all'||statusOf(e.name)===s)&&(`${e.name} ${e.city} ${e.audience}`.toLowerCase().includes(q))).sort(byDate);
 document.getElementById('eventsTable').innerHTML=`<div class="event-row header"><div>Мероприятие</div><div>Дата</div><div>Скоринг</div><div>Приоритет</div><div>Этап</div><div>Действия</div></div>`+rows.map(e=>`<div class="event-row"><div><strong>${e.name}</strong><div class="reminder-meta">${e.city} · ${e.audience}</div><div class="next-action">Следующий шаг: ${STATUS_NEXT[statusOf(e.name)]}</div></div><div>${e.dateLabel}</div><div>${e.score}/100</div><div><span class="badge ${e.priority==='A'?'a':''}">${e.priority}</span></div><div><select data-status="${encodeURIComponent(e.name)}">${Object.entries(STATUS_LABELS).map(([k,v])=>`<option value="${k}" ${statusOf(e.name)===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="event-actions"><button data-remind="${encodeURIComponent(e.name)}">Напомнить</button></div></div>`).join('');
 document.querySelectorAll('[data-status]').forEach(el=>el.onchange=()=>{const n=decodeURIComponent(el.dataset.status);eventStatus[n]=el.value;save();renderDashboard();renderEvents();});
 document.querySelectorAll('[data-remind]').forEach(el=>el.onclick=()=>openReminder(decodeURIComponent(el.dataset.remind)));
}
['eventSearch','priorityFilter','statusFilter'].forEach(id=>document.getElementById(id).addEventListener('input',renderEvents));

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
renderDashboard();renderEvents();renderReminders();
