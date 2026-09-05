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

const $=s=>document.querySelector(s);
const els={gate:$('#gate'),gateKey:$('#gateKey'),gateBtn:$('#gateBtn'),gateError:$('#gateError'),app:$('#app'),chapterList:$('#chapterList'),chapterCount:$('#chapterCount'),newBtn:$('#newBtn'),ready:$('#ready'),date:$('#chapterDate'),title:$('#chapterTitle'),audio:$('#audio'),audioInput:$('#audioInput'),uploadAudio:$('#uploadAudio'),recordBtn:$('#recordBtn'),audioNote:$('#audioNote'),dictionary:$('#dictionary'),editor:$('#editor'),raw:$('#rawText'),retranscribe:$('#retranscribe'),agentBtn:$('#agentBtn'),save:$('#save'),download:$('#download'),status:$('#status'),busy:$('#busy'),legacy:$('#legacy'),period:$('#periodValue'),people:$('#peopleValue'),places:$('#placesValue'),dates:$('#datesValue'),questionCard:$('#questionCard'),questionText:$('#questionText'),questionAnswer:$('#questionAnswer'),applyAnswer:$('#applyAnswer')};

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

function renderList(){
  const order=new Map(PERIODS.map((p,i)=>[p,i]));
  const grouped={};
  for(const p of PERIODS)grouped[p]=[];
  for(const c of chapters){const p=normalizePeriod(c.period);grouped[p].push(c)}
  els.chapterCount.textContent=chapters.length;
  let n=chapters.length;
  els.chapterList.innerHTML=PERIODS.map(period=>{
    const items=grouped[period].sort((a,b)=>a.createdAt-b.createdAt);
    if(!items.length)return'';
    const body=items.map(c=>`<button class="chapter-item ${c.id===selectedId?'active':''}" data-id="${c.id}"><span class="chapter-kicker">ГЛАВА ${n--}</span><span class="chapter-title">${escapeHtml(shortText(c.title||c.text))}</span><span class="chapter-date">${fmtDate(c.createdAt)}</span></button>`).join('');
    return `<div class="period-group" data-order="${order.get(period)}"><div class="period-title">${escapeHtml(period)}</div>${body}</div>`;
  }).join('');
}

function renderAgentMeta(c){
  els.period.textContent=normalizePeriod(c?.period);
  els.people.textContent=listText(c?.people);
  els.places.textContent=listText(c?.places);
  els.dates.textContent=listText(c?.dates);
  const q=String(c?.question||'').trim();
  els.questionText.textContent=q;
  els.questionAnswer.value='';
  els.questionCard.classList.toggle('hidden',!q);
}

function selectChapter(id){selectedId=id;renderList();const c=current();if(!c)return;els.ready.textContent='ГОТОВАЯ ГЛАВА';els.date.textContent=fmtDate(c.createdAt);els.title.value=c.title||'';els.editor.value=c.text||'';els.raw.textContent=c.raw||'Исходная расшифровка пока отсутствует.';renderAgentMeta(c);if(els.audio.dataset.url)URL.revokeObjectURL(els.audio.dataset.url);const url=objectUrl(c.audioBlob);els.audio.src=url;els.audio.dataset.url=url;els.audioNote.textContent=c.audioBlob?'Аудио этой главы сохранено локально':'Добавьте аудио этой главы для повторного распознавания';setStatus('')}

async function saveCurrent(){const c=current();if(!c)return;c.title=els.title.value.trim()||'Без названия';c.text=els.editor.value;c.updatedAt=Date.now();await put(c);renderList();setStatus('Сохранено')}
async function addChapter(){const c={id:'chapter-'+crypto.randomUUID(),title:'Новое воспоминание',text:'',raw:'',audioBlob:null,period:'Не определено',people:[],places:[],dates:[],question:'',summary:'',createdAt:Date.now(),updatedAt:Date.now()};await put(c);chapters.push(c);selectChapter(c.id)}
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

function downloadCurrent(){const c=current();if(!c)return;const meta=[`Период: ${normalizePeriod(c.period)}`,`Люди: ${listText(c.people)}`,`Места: ${listText(c.places)}`,`Даты: ${listText(c.dates)}`].join('\n');const blob=new Blob([`${c.title}\n\n${meta}\n\n${c.text}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(c.title||'vospominanie').replace(/[\\/:*?"<>|]/g,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

async function startStopRecording(){if(recorder&&recorder.state==='recording'){recorder.stop();return}try{recordStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,sampleRate:48000,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});recordChunks=[];const mime=['audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';recorder=new MediaRecorder(recordStream,mime?{mimeType:mime,audioBitsPerSecond:192000}:{audioBitsPerSecond:192000});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};recorder.onstop=async()=>{recordStream.getTracks().forEach(t=>t.stop());const blob=new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'});blob.name='chapter-recording.webm';await attachAudio(blob);els.recordBtn.textContent='● Записать';els.recordBtn.classList.remove('recording');setStatus('Запись сохранена. Нажмите «Распознать заново», чтобы агент оформил главу.')};recorder.start(1000);els.recordBtn.textContent='■ Остановить';els.recordBtn.classList.add('recording');setStatus('Идёт запись воспоминания')}catch(e){setStatus('Не удалось включить микрофон: '+(e.message||e),true)}}

async function unlock(){const key=els.gateKey.value.trim();if(!key){els.gateError.textContent='Введите пароль';return}els.gateBtn.disabled=true;els.gateError.textContent='Проверяю пароль…';try{const probe=new FormData();probe.append('action','validate');const response=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':key},body:probe});if(response.status===401||response.status===403)throw new Error('Неверный пароль');if(!response.ok)throw new Error('Не удалось проверить пароль');sessionAccessKey=key;els.gateKey.value='';els.gate.classList.add('hidden');els.app.classList.remove('hidden');els.gateError.textContent=''}catch(error){els.gateError.textContent=error.message||'Не удалось проверить пароль'}finally{els.gateBtn.disabled=false}}

async function boot(){await openDb();await seed();chapters=await getAll();selectedId=chapters.sort((a,b)=>a.createdAt-b.createdAt)[0]?.id||null;els.dictionary.value=localStorage.getItem('memories-dictionary')||'';renderList();if(selectedId)selectChapter(selectedId);
els.gateBtn.onclick=unlock;els.gateKey.addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});els.newBtn.onclick=addChapter;els.chapterList.onclick=e=>{const b=e.target.closest('[data-id]');if(b)selectChapter(b.dataset.id)};els.save.onclick=saveCurrent;els.download.onclick=downloadCurrent;els.retranscribe.onclick=retranscribe;els.agentBtn.onclick=()=>callAgent();els.applyAnswer.onclick=()=>{const answer=els.questionAnswer.value.trim();if(!answer){setStatus('Введите ответ на уточняющий вопрос.',true);return}callAgent({answer})};els.uploadAudio.onclick=()=>els.audioInput.click();els.audioInput.onchange=()=>{const f=els.audioInput.files?.[0];if(f)attachAudio(f);els.audioInput.value=''};els.recordBtn.onclick=startStopRecording;els.title.addEventListener('change',saveCurrent);els.editor.addEventListener('input',()=>{setStatus('Есть несохранённые изменения')});els.legacy.href='https://kniga-dlya-vnukov.nergy-techno-3776.chatgpt.site/'}
boot();
