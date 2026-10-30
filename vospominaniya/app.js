const API_URL='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/memories-transcribe';
const DB_NAME='korytnik-memories-v1';
const DB_VERSION=1;
const STORE='chapters';
const PERIODS=['Детство','Училище','Армия','Семья','Работа','Яндекс','Gett','Проекты','Настоящее','Не определено'];
let db;
let chapters=[];
let selectedId=null;
let recorder=null;
let recordChunks=[];
let recordStream=null;
let sessionAccessKey='';
let viewMode='periods';
let birthYear=null;
let dirty=false;
let saveTimer=null;
const VIEW_MODES=['periods','timeline','manual'];
const VIEW_HINTS={
  periods:'Главы по периодам жизни, внутри периода по дате события.',
  timeline:'Все главы по дате события, от раннего к позднему. Главы без даты внизу.',
  manual:'Порядок задаёте вы. Стрелками двигайте главу выше или ниже. Книга собирается в этом порядке.'
};

const $=s=>document.querySelector(s);
const els={gate:$('#gate'),gateKey:$('#gateKey'),gateBtn:$('#gateBtn'),gateError:$('#gateError'),app:$('#app'),chapterList:$('#chapterList'),chapterCount:$('#chapterCount'),newBtn:$('#newBtn'),ready:$('#ready'),date:$('#chapterDate'),title:$('#chapterTitle'),audio:$('#audio'),audioInput:$('#audioInput'),uploadAudio:$('#uploadAudio'),recordBtn:$('#recordBtn'),audioNote:$('#audioNote'),dictionary:$('#dictionary'),editor:$('#editor'),raw:$('#rawText'),retranscribe:$('#retranscribe'),agentBtn:$('#agentBtn'),save:$('#save'),download:$('#download'),status:$('#status'),busy:$('#busy'),legacy:$('#legacy'),period:$('#periodValue'),people:$('#peopleValue'),places:$('#placesValue'),dates:$('#datesValue'),questionCard:$('#questionCard'),questionText:$('#questionText'),questionAnswer:$('#questionAnswer'),applyAnswer:$('#applyAnswer'),viewSwitch:$('#viewSwitch'),viewHint:$('#viewHint'),birthYear:$('#birthYear'),exportBook:$('#exportBook'),backupBtn:$('#backupBtn'),restoreBtn:$('#restoreBtn'),restoreInput:$('#restoreInput'),eventLabel:$('#eventLabel'),eventAuto:$('#eventAuto'),evYear:$('#evYear'),evYearTo:$('#evYearTo'),evMonth:$('#evMonth'),evDay:$('#evDay'),evApprox:$('#evApprox'),evDetect:$('#evDetect'),evClear:$('#evClear'),periodSelect:$('#periodSelect')};

function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function getAll(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
function put(ch){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(ch);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function fmtDate(ts){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(ts))}
function shortText(s){const t=String(s||'').trim();return t.length>58?t.slice(0,58)+'…':t||'Без текста'}
function current(){return chapters.find(c=>c.id===selectedId)||null}
function setStatus(text='',err=false){els.status.textContent=text;els.status.classList.toggle('error',err)}
function setBusy(on,text='Обрабатываю выбранную главу…'){els.busy.classList.toggle('hidden',!on);els.busy.textContent=text;els.retranscribe.disabled=on;els.agentBtn.disabled=on;els.save.disabled=on;els.applyAnswer.disabled=on}
function objectUrl(blob){return blob?URL.createObjectURL(blob):''}
function normalizePeriod(period){return PERIODS.includes(period)?period:'Не определено'}
function listText(value){return Array.isArray(value)&&value.length?value.join(', '):'—'}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

async function seed(){chapters=await getAll();if(chapters.length)return;const now=Date.now();const samples=[
{id:'chapter-1',title:'Это было в Трифештах. Мой отец был…',text:'Это было в Трифештах. Мой отец был тогда председателем. Он был молодым председателем, по-моему, самым молодым в районе.\n\nЕму было всего 28 лет. И первые мои воспоминания - это я в новом доме иду по тропинке к колодцу. И тут начал дождь идти, прям такой гром, дождь.\n\nИ вот я вдоль этой тропиночки узкой, вдоль забора, ну и конечно, испугался малыш. И я побежал домой. Ну, в смысле, в дом побежал.\n\nВот эти вот мои самые первые воспоминания. Раньше я ничего такого не помню. Это вот самые ранние.',raw:'',audioBlob:null,period:'Детство',people:['Отец'],places:['Трифешты'],dates:['28 лет'],question:'',summary:'Самое раннее детское воспоминание о доме, колодце и внезапной грозе.',createdAt:now-2000,updatedAt:now-2000},
{id:'chapter-2',title:'У меня было связано всего одно вот…',text:'',raw:'',audioBlob:null,period:'Не определено',people:[],places:[],dates:[],question:'',summary:'',createdAt:now-1000,updatedAt:now-1000},
{id:'chapter-3',title:'Хочу рассказать про садик. Это отдельные воспоминания…',text:'',raw:'',audioBlob:null,period:'Детство',people:[],places:[],dates:[],question:'',summary:'',createdAt:now,updatedAt:now}
];for(const c of samples)await put(c);chapters=await getAll()}

function lsGet(key){try{return localStorage.getItem(key)}catch{return null}}
function lsSet(key,value){try{if(value===null||value===undefined)localStorage.removeItem(key);else localStorage.setItem(key,String(value))}catch{}}
function localDate(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

/* Порядок глав. periods: по периодам жизни, timeline: по дате события, manual: порядок задан вручную (поле pos). */
function posOf(c){return Number.isFinite(c.pos)?c.pos:1e6+(c.createdAt||0)}
function orderedChapters(mode=viewMode){
  const list=[...chapters];
  if(mode==='manual')return list.sort((a,b)=>posOf(a)-posOf(b)||(a.createdAt||0)-(b.createdAt||0));
  if(mode==='timeline')return list.sort(Timeline.compareChapters);
  const idx=p=>PERIODS.indexOf(normalizePeriod(p));
  return list.sort((a,b)=>idx(a.period)-idx(b.period)||Timeline.compareChapters(a,b));
}
function groupsFor(mode){
  const list=orderedChapters(mode);
  if(mode==='manual')return[{title:'',items:list}];
  const groups=[];const byKey=new Map();
  for(const c of list){
    const key=mode==='periods'?normalizePeriod(c.period):Timeline.decadeLabel(c.event);
    if(!byKey.has(key)){const g={title:key,items:[]};byKey.set(key,g);groups.push(g)}
    byKey.get(key).items.push(c);
  }
  return groups;
}
function chapterItemHtml(c,n,manual,index,total){
  const when=Timeline.label(c.event);
  const id=escapeHtml(c.id);
  const item=`<button class="chapter-item ${c.id===selectedId?'active':''}" data-id="${id}"><span class="chapter-kicker">ГЛАВА ${n}</span><span class="chapter-event ${when?'':'none'}">${when?escapeHtml(when):'дата события не указана'}</span><span class="chapter-title">${escapeHtml(shortText(c.title||c.text))}</span><span class="chapter-date">записано ${fmtDate(c.createdAt)}</span></button>`;
  if(!manual)return `<div class="chapter-row">${item}</div>`;
  return `<div class="chapter-row with-move">${item}<div class="move-col"><button type="button" class="move-btn" data-move="up" data-id="${id}" aria-label="Выше" ${index===0?'disabled':''}>↑</button><button type="button" class="move-btn" data-move="down" data-id="${id}" aria-label="Ниже" ${index===total-1?'disabled':''}>↓</button></div></div>`;
}
function renderList(){
  els.chapterCount.textContent=chapters.length;
  els.viewHint.textContent=VIEW_HINTS[viewMode]||'';
  els.viewSwitch.querySelectorAll('[data-mode]').forEach(b=>{const on=b.dataset.mode===viewMode;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});
  const manual=viewMode==='manual';
  const total=chapters.length;
  let n=0;let index=0;
  const groups=groupsFor(viewMode).map(g=>{
    const body=g.items.map(c=>chapterItemHtml(c,++n,manual,index++,total)).join('');
    return `<div class="period-group">${g.title?`<div class="period-title">${escapeHtml(g.title)}</div>`:''}${body}</div>`;
  }).join('');
  const tools=manual&&total>1?'<button type="button" class="small-btn" data-action="sort-by-date">Выстроить по датам событий</button>':'';
  els.chapterList.innerHTML=tools+groups;
}

/* Дата события у главы. event: {year,yearTo,month,day,approx,auto}; auto=true значит определено программой по тексту. */
function sourcesOf(c){return[(c.dates||[]).join('; '),c.text,c.raw]}
function autoEvent(c){return Timeline.detect(sourcesOf(c),{birthYear})}
function renderEventLabel(c){
  const e=Timeline.sanitizeEvent(c?.event);const text=Timeline.label(e);
  els.eventLabel.textContent=text||'Дата не указана';els.eventLabel.classList.toggle('none',!text);
  els.eventAuto.textContent=e?(e.auto?'определено по тексту, проверьте':'указано вами'):'';
}
function renderEvent(c){
  const e=Timeline.sanitizeEvent(c?.event);
  els.evYear.value=e?e.year:'';els.evYearTo.value=e&&e.yearTo?e.yearTo:'';els.evMonth.value=e&&e.month?String(e.month):'';els.evDay.value=e&&e.day?e.day:'';els.evApprox.checked=Boolean(e&&e.approx);
  renderEventLabel(c);
}
async function migrateEvents(){
  for(const c of chapters){
    if(c.event!==undefined)continue;
    const r=autoEvent(c);c.event=r.event?{...r.event,auto:true}:null;
    await put(c);
  }
}
async function recomputeAutoEvents(){
  let changed=0;
  for(const c of chapters){
    if(c.event&&!c.event.auto)continue;
    const r=autoEvent(c);const next=r.event?{...r.event,auto:true}:null;
    if(JSON.stringify(next)!==JSON.stringify(c.event||null)){c.event=next;await put(c);changed++}
  }
  return changed;
}
async function ensurePositions(){
  if(chapters.every(c=>Number.isFinite(c.pos)))return;
  const any=chapters.some(c=>Number.isFinite(c.pos));
  const base=orderedChapters(any?'manual':'timeline');
  for(let i=0;i<base.length;i++){if(base[i].pos!==i){base[i].pos=i;await put(base[i])}}
}
async function setViewMode(mode){
  if(!VIEW_MODES.includes(mode))return;
  viewMode=mode;lsSet('memories-view',mode);
  if(mode==='manual')await ensurePositions();
  renderList();
}
async function moveChapter(id,dir){
  await ensurePositions();
  const list=orderedChapters('manual');const i=list.findIndex(c=>c.id===id);const j=dir==='up'?i-1:i+1;
  if(i<0||j<0||j>=list.length)return;
  [list[i],list[j]]=[list[j],list[i]];
  for(let k=0;k<list.length;k++){if(list[k].pos!==k){list[k].pos=k;list[k].updatedAt=Date.now();await put(list[k])}}
  renderList();
}
async function sortManualByDate(){
  if(!confirm('Заменить вашу раскладку порядком по датам событий? Главы без даты пойдут в конец, по времени записи.'))return;
  const base=orderedChapters('timeline');
  for(let i=0;i<base.length;i++){if(base[i].pos!==i){base[i].pos=i;base[i].updatedAt=Date.now();await put(base[i])}}
  renderList();setStatus('Главы выстроены по датам событий.');
}

function renderAgentMeta(c){
  els.period.textContent=normalizePeriod(c?.period);
  els.periodSelect.value=normalizePeriod(c?.period);
  els.people.textContent=listText(c?.people);
  els.places.textContent=listText(c?.places);
  els.dates.textContent=listText(c?.dates);
  const q=String(c?.question||'').trim();
  els.questionText.textContent=q;
  els.questionAnswer.value='';
  els.questionCard.classList.toggle('hidden',!q);
  renderEvent(c);
}

function selectChapter(id){commitEditsSync();selectedId=id;renderList();const c=current();if(!c)return;els.ready.textContent='ГОТОВАЯ ГЛАВА';els.date.textContent='Записано: '+fmtDate(c.createdAt);els.title.value=c.title||'';els.editor.value=c.text||'';els.raw.textContent=c.raw||'Исходная расшифровка пока отсутствует.';renderAgentMeta(c);if(els.audio.dataset.url)URL.revokeObjectURL(els.audio.dataset.url);const url=objectUrl(c.audioBlob);els.audio.src=url;els.audio.dataset.url=url;els.audioNote.textContent=c.audioBlob?'Аудио этой главы сохранено локально':'Добавьте аудио этой главы для повторного распознавания';setStatus('')}

async function saveCurrent(auto=false){const c=current();if(!c)return;clearTimeout(saveTimer);c.title=els.title.value.trim()||'Без названия';c.text=els.editor.value;c.updatedAt=Date.now();dirty=false;await put(c);renderList();setStatus(auto===true?'Сохранено автоматически':'Сохранено')}
/* Правки из полей сразу переносятся в главу в памяти, запись в базу идёт следом. Нужно при переключении глав и при закрытии страницы. */
function commitEditsSync(){const c=current();if(!c||!dirty)return;clearTimeout(saveTimer);c.title=els.title.value.trim()||'Без названия';c.text=els.editor.value;c.updatedAt=Date.now();dirty=false;put(c).catch(()=>{})}
function markDirty(){dirty=true;setStatus('Есть несохранённые изменения');clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveCurrent(true).catch(()=>{})},1500)}
async function addChapter(){const c={id:'chapter-'+crypto.randomUUID(),title:'Новое воспоминание',text:'',raw:'',audioBlob:null,period:'Не определено',people:[],places:[],dates:[],question:'',summary:'',event:null,createdAt:Date.now(),updatedAt:Date.now()};const used=chapters.map(x=>x.pos).filter(Number.isFinite);if(used.length)c.pos=Math.max(...used)+1;await put(c);chapters.push(c);selectChapter(c.id)}
async function attachAudio(file){const c=current();if(!c||!file)return;c.audioBlob=file;c.updatedAt=Date.now();await put(c);selectChapter(c.id);setStatus('Аудио прикреплено к выбранной главе')}

function applyAgent(c,agent){
  if(!c||!agent)return;
  c.title=String(agent.title||c.title||'Новое воспоминание').trim();
  c.text=String(agent.literary_text||c.text||'').trim();
  if(agent.clean_transcript)c.raw=String(agent.clean_transcript).trim();
  c.period=normalizePeriod(agent.period);
  c.people=Array.isArray(agent.people)?agent.people:[];
  c.places=Array.isArray(agent.places)?agent.places:[];
  c.dates=Array.isArray(agent.dates)?agent.dates:[];
  c.question=String(agent.question||'').trim();
  c.summary=String(agent.summary||'').trim();
  if(!c.event||c.event.auto){const r=autoEvent(c);c.event=r.event?{...r.event,auto:true}:null}
  c.updatedAt=Date.now();
}

async function callAgent({answer='' }={}){
  const c=current();if(!c)return;
  if(!sessionAccessKey){setStatus('Для работы агента нужно снова открыть личный архив.',true);return}
  const transcript=String(c.raw||els.editor.value||'').trim();
  if(!transcript){setStatus('Сначала запишите, загрузите или введите текст воспоминания.',true);return}
  setBusy(true,answer?'Добавляю уточнение в главу…':'Агент анализирует воспоминание…');
  try{
    const dictionary=els.dictionary.value.trim();localStorage.setItem('memories-dictionary',dictionary);
    const form=new FormData();form.append('action','agent');form.append('transcript',transcript);form.append('chapter_title',els.title.value.trim());form.append('previous_text',els.editor.value.slice(0,12000));form.append('dictionary',dictionary);
    if(answer){form.append('clarifying_question',c.question||'');form.append('clarifying_answer',answer)}
    const res=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':sessionAccessKey},body:form});
    const data=await res.json().catch(()=>({}));if(!res.ok||!data.ok)throw new Error(data.error||'Ошибка агента');
    applyAgent(c,data.agent);await put(c);els.title.value=c.title;els.editor.value=c.text;els.raw.textContent=c.raw;renderAgentMeta(c);renderList();setStatus(answer?'Уточнение добавлено. Глава обновлена.':'Агент оформил главу и подготовил один уточняющий вопрос.');
  }catch(e){setStatus(e.message||'Не удалось обработать воспоминание',true)}finally{setBusy(false)}
}

async function retranscribe(){
  const c=current();if(!c)return;if(!sessionAccessKey){setStatus('Для распознавания нужно снова открыть личный архив.',true);return}if(!c.audioBlob){setStatus('Сначала прикрепите или запишите аудио именно этой главы.',true);return}
  setBusy(true,'Максимальное распознавание и анализ главы…');setStatus('Два прохода распознавания, сверка текста и работа агента…');
  try{
    const dictionary=els.dictionary.value.trim();localStorage.setItem('memories-dictionary',dictionary);
    const form=new FormData();form.append('action','transcribe');form.append('audio',c.audioBlob,c.audioBlob.name||'chapter.webm');form.append('chapter_title',els.title.value.trim());form.append('previous_text',els.editor.value.slice(0,12000));form.append('context','Семейные воспоминания на русском языке. Сохранять имена, даты, географические названия и смысл буквально. Не додумывать слова.');form.append('dictionary',dictionary);form.append('quality','max');form.append('language','ru');
    const res=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':sessionAccessKey},body:form});
    const data=await res.json().catch(()=>({}));if(!res.ok||!data.ok)throw new Error(data.error||'Ошибка распознавания');
    const finalTranscript=String(data.text||data.raw_primary||'').trim();if(!finalTranscript)throw new Error('Распознавание не вернуло текст');
    c.raw=finalTranscript;
    if(data.agent){applyAgent(c,data.agent);setStatus('Готово: распознано, литературно оформлено, период и факты определены.')}else{c.text=finalTranscript;c.updatedAt=Date.now();setStatus('Расшифровка готова, но агент временно недоступен.',true)}
    await put(c);els.title.value=c.title;els.editor.value=c.text;els.raw.textContent=c.raw;renderAgentMeta(c);renderList();
  }catch(e){setStatus(e.message||'Не удалось распознать',true)}finally{setBusy(false)}
}

function downloadCurrent(){const c=current();if(!c)return;commitEditsSync();const meta=[`Время события: ${Timeline.label(c.event)||'не указано'}`,`Период: ${normalizePeriod(c.period)}`,`Люди: ${listText(c.people)}`,`Места: ${listText(c.places)}`,`Даты: ${listText(c.dates)}`].join('\n');const blob=new Blob([`${c.title}\n\n${meta}\n\n${c.text}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(c.title||'vospominanie').replace(/[\\/:*?"<>|]/g,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

async function startStopRecording(){if(recorder&&recorder.state==='recording'){recorder.stop();return}try{recordStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,sampleRate:48000,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});recordChunks=[];const mime=['audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';recorder=new MediaRecorder(recordStream,mime?{mimeType:mime,audioBitsPerSecond:192000}:{audioBitsPerSecond:192000});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};recorder.onstop=async()=>{recordStream.getTracks().forEach(t=>t.stop());const blob=new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'});blob.name='chapter-recording.webm';await attachAudio(blob);els.recordBtn.textContent='● Записать';els.recordBtn.classList.remove('recording');setStatus('Запись сохранена. Нажмите «Распознать заново», чтобы агент оформил главу.')};recorder.start(1000);els.recordBtn.textContent='■ Остановить';els.recordBtn.classList.add('recording');setStatus('Идёт запись воспоминания')}catch(e){setStatus('Не удалось включить микрофон: '+(e.message||e),true)}}

async function unlock(){const key=els.gateKey.value.trim();if(!key){els.gateError.textContent='Введите пароль';return}els.gateBtn.disabled=true;els.gateError.textContent='Проверяю пароль…';try{const probe=new FormData();probe.append('action','validate');const response=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':key},body:probe});if(response.status===401||response.status===403)throw new Error('Неверный пароль');if(!response.ok)throw new Error('Не удалось проверить пароль');sessionAccessKey=key;els.gateKey.value='';els.gate.classList.add('hidden');els.app.classList.remove('hidden');els.gateError.textContent=''}catch(error){els.gateError.textContent=error.message||'Не удалось проверить пароль'}finally{els.gateBtn.disabled=false}}

function downloadFile(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

/* Книга целиком: один HTML-файл в Arial, оглавление и главы в том порядке, как показано слева. Печать в PDF через браузер. */
function exportBook(){
  commitEditsSync();
  const all=orderedChapters();
  const list=all.filter(c=>String(c.text||'').trim());
  if(!list.length){setStatus('В книге пока нет глав с текстом.',true);return}
  const paragraphs=t=>String(t).trim().split(/\n{2,}/).map(p=>`<p>${escapeHtml(p.trim()).replace(/\n/g,'<br>')}</p>`).join('\n');
  const toc=list.map((c,i)=>{const when=Timeline.label(c.event);return `<li><a href="#ch${i+1}">${escapeHtml(c.title||'Без названия')}</a>${when?` <span class="when">${escapeHtml(when)}</span>`:''}</li>`}).join('\n');
  const chaptersHtml=list.map((c,i)=>{
    const when=Timeline.label(c.event);
    const meta=[when?'Время события: '+when:'',normalizePeriod(c.period)!=='Не определено'?'Период: '+normalizePeriod(c.period):'',(c.people||[]).length?'Люди: '+c.people.join(', '):'',(c.places||[]).length?'Места: '+c.places.join(', '):''].filter(Boolean).join(' · ');
    return `<section class="chapter" id="ch${i+1}"><div class="num">Глава ${i+1}</div><h2>${escapeHtml(c.title||'Без названия')}</h2>${meta?`<div class="meta">${escapeHtml(meta)}</div>`:''}${paragraphs(c.text)}</section>`;
  }).join('\n');
  const html=`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Воспоминания</title><style>
body{font-family:Arial,Helvetica,sans-serif;max-width:720px;margin:48px auto;padding:0 22px;color:#111;line-height:1.7;font-size:17px}
h1{font-size:34px;margin:0 0 6px}.sub{color:#666;margin-bottom:34px}
.toc{padding-left:22px}.toc li{margin:6px 0}.toc a{color:#111}.when{color:#8a5300;font-size:14px;margin-left:8px}
.chapter{margin-top:64px;page-break-before:always}.num{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a5300}
h2{font-size:26px;margin:6px 0 8px}.meta{color:#666;font-size:13px;margin-bottom:18px}p{margin:0 0 14px}
@media print{body{margin:0;max-width:none}.chapter{margin-top:0}}
</style></head><body><h1>Воспоминания</h1><div class="sub">Иван Корытник. Собрано ${escapeHtml(fmtDate(Date.now()))}</div><h3>Оглавление</h3><ol class="toc">${toc}</ol>${chaptersHtml}</body></html>`;
  downloadFile('kniga-vospominaniya-'+localDate()+'.html',html,'text/html;charset=utf-8');
  const skipped=all.length-list.length;
  setStatus(`Книга сохранена: ${list.length} глав`+(skipped?`, пустых пропущено ${skipped}`:'')+'. Чтобы получить PDF, откройте файл и выберите печать.');
}

/* Копия данных: JSON без аудио. Загрузка копии аккуратно сливает главы: побеждает более свежая версия. */
function backupData(){
  commitEditsSync();
  const data={app:'korytnik-memories',version:1,exportedAt:new Date().toISOString(),birthYear,chapters:chapters.map(c=>{const{audioBlob,...rest}=c;return{...rest,hasAudio:Boolean(audioBlob)}})};
  downloadFile('vospominaniya-kopiya-'+localDate()+'.json',JSON.stringify(data,null,1),'application/json');
  setStatus(`Копия сохранена: ${chapters.length} глав. Аудио в копию не входит, оно остаётся в браузере.`);
}
function sanitizeChapter(src){
  if(!src||typeof src!=='object')return null;
  const str=(v,max)=>String(v==null?'':v).slice(0,max);
  const list=v=>Array.isArray(v)?v.map(x=>str(x,200).trim()).filter(Boolean).slice(0,100):[];
  const num=v=>v!=null&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
  const id=/^[\w-]{1,80}$/.test(String(src.id||''))?String(src.id):'chapter-'+crypto.randomUUID();
  const out={id,title:str(src.title,300).trim()||'Без названия',text:str(src.text,2000000),raw:str(src.raw,2000000),audioBlob:null,period:normalizePeriod(src.period),people:list(src.people),places:list(src.places),dates:list(src.dates),question:str(src.question,1000),summary:str(src.summary,2000),createdAt:num(src.createdAt)??Date.now(),updatedAt:num(src.updatedAt)??Date.now()};
  if(src.event===null)out.event=null;else if(src.event&&typeof src.event==='object')out.event=Timeline.sanitizeEvent(src.event);
  const pos=num(src.pos);if(pos!==null)out.pos=pos;
  return out;
}
async function restoreData(file){
  let data;
  try{data=JSON.parse(await file.text())}catch{setStatus('Файл не читается как копия данных.',true);return}
  if(!data||data.app!=='korytnik-memories'||!Array.isArray(data.chapters)){setStatus('Это не копия данных раздела «Воспоминания».',true);return}
  commitEditsSync();
  let added=0,updated=0,kept=0,bad=0;
  for(const src of data.chapters.slice(0,5000)){
    const inc=sanitizeChapter(src);if(!inc){bad++;continue}
    const cur=chapters.find(c=>c.id===inc.id);
    if(!cur){chapters.push(inc);await put(inc);added++}
    else if(inc.updatedAt>cur.updatedAt){const audio=cur.audioBlob||null;Object.assign(cur,inc,{audioBlob:audio});await put(cur);updated++}
    else kept++;
  }
  const by=Number(data.birthYear);
  if(!birthYear&&Number.isInteger(by)&&by>=1900&&by<=new Date().getFullYear()){birthYear=by;lsSet('memories-birth-year',by);els.birthYear.value=by}
  if(chapters.some(c=>Number.isFinite(c.pos)))await ensurePositions();
  await migrateEvents();
  if(!current()&&chapters.length)selectedId=orderedChapters()[0].id;
  renderList();if(selectedId)selectChapter(selectedId);
  setStatus(`Копия загружена: новых глав ${added}, обновлено ${updated}, оставлено ваших более свежих ${kept}`+(bad?`, не прочитано ${bad}`:'')+'.');
}

function loadPrefs(){
  const mode=lsGet('memories-view');if(VIEW_MODES.includes(mode))viewMode=mode;
  const by=Number(lsGet('memories-birth-year'));if(Number.isInteger(by)&&by>=1900&&by<=new Date().getFullYear()){birthYear=by;els.birthYear.value=by}
  els.periodSelect.innerHTML=PERIODS.map(p=>`<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
}

function wireTimeline(){
  els.viewSwitch.onclick=e=>{const b=e.target.closest('[data-mode]');if(b)setViewMode(b.dataset.mode)};
  els.evDetect.onclick=()=>{
    const c=current();if(!c)return;commitEditsSync();
    const r=autoEvent(c);
    if(r.event){c.event={...r.event,auto:true};c.updatedAt=Date.now();put(c);renderEvent(c);renderList();setStatus('Дата определена по тексту: '+Timeline.label(r.event)+'. Проверьте её и при необходимости поправьте.')}
    else setStatus(r.needsBirthYear?'В тексте есть возраст, но не известен год рождения. Укажите его слева внизу, и дата посчитается.':'В тексте нет понятной даты. Укажите год вручную.');
  };
  els.evClear.onclick=()=>{const c=current();if(!c)return;c.event=null;c.updatedAt=Date.now();put(c);renderEvent(c);renderList();setStatus('Дата события очищена.')};
  const onEventInput=()=>{
    const c=current();if(!c)return;
    if(!String(els.evYear.value).trim()){c.event=null}
    else{
      const ev=Timeline.sanitizeEvent({year:els.evYear.value,yearTo:els.evYearTo.value,month:els.evMonth.value,day:els.evDay.value,approx:els.evApprox.checked});
      if(!ev){setStatus('Год должен быть от 1850 до текущего.',true);return}
      c.event={...ev,auto:false};
    }
    c.updatedAt=Date.now();put(c);renderEvent(c);renderList();setStatus('Дата события сохранена.');
  };
  [els.evYear,els.evYearTo,els.evMonth,els.evDay,els.evApprox].forEach(el=>el.addEventListener('change',onEventInput));
  els.periodSelect.onchange=()=>{const c=current();if(!c)return;c.period=normalizePeriod(els.periodSelect.value);c.updatedAt=Date.now();put(c);renderAgentMeta(c);renderList();setStatus('Период изменён.')};
  els.birthYear.onchange=async()=>{
    const v=Number(els.birthYear.value);
    if(!els.birthYear.value.trim()){birthYear=null;lsSet('memories-birth-year',null);setStatus('Год рождения убран.');return}
    if(!Number.isInteger(v)||v<1900||v>new Date().getFullYear()){setStatus('Укажите год рождения числом, например из четырёх цифр.',true);return}
    birthYear=v;lsSet('memories-birth-year',v);
    const changed=await recomputeAutoEvents();
    renderList();const c=current();if(c)renderEvent(c);
    setStatus(`Год рождения сохранён. Пересчитано дат: ${changed}.`);
  };
  els.exportBook.onclick=exportBook;
  els.backupBtn.onclick=backupData;
  els.restoreBtn.onclick=()=>els.restoreInput.click();
  els.restoreInput.onchange=()=>{const f=els.restoreInput.files?.[0];if(f)restoreData(f);els.restoreInput.value=''};
  els.title.addEventListener('input',markDirty);
  window.addEventListener('pagehide',commitEditsSync);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')commitEditsSync()});
}

async function boot(){await openDb();await seed();chapters=await getAll();loadPrefs();await migrateEvents();selectedId=chapters.sort((a,b)=>a.createdAt-b.createdAt)[0]?.id||null;els.dictionary.value=localStorage.getItem('memories-dictionary')||'';renderList();if(selectedId)selectChapter(selectedId);
els.gateBtn.onclick=unlock;els.gateKey.addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});els.newBtn.onclick=addChapter;els.chapterList.onclick=e=>{const mv=e.target.closest('[data-move]');if(mv){moveChapter(mv.dataset.id,mv.dataset.move);return}if(e.target.closest('[data-action="sort-by-date"]')){sortManualByDate();return}const b=e.target.closest('[data-id]');if(b)selectChapter(b.dataset.id)};els.save.onclick=()=>saveCurrent();els.download.onclick=downloadCurrent;els.retranscribe.onclick=retranscribe;els.agentBtn.onclick=()=>callAgent();els.applyAnswer.onclick=()=>{const answer=els.questionAnswer.value.trim();if(!answer){setStatus('Введите ответ на уточняющий вопрос.',true);return}callAgent({answer})};els.uploadAudio.onclick=()=>els.audioInput.click();els.audioInput.onchange=()=>{const f=els.audioInput.files?.[0];if(f)attachAudio(f);els.audioInput.value=''};els.recordBtn.onclick=startStopRecording;els.title.addEventListener('change',()=>saveCurrent());els.editor.addEventListener('input',markDirty);els.legacy.href='https://kniga-dlya-vnukov.nergy-techno-3776.chatgpt.site/';wireTimeline()}
boot();
