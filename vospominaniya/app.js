const API_URL='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/memories-transcribe';
const DB_NAME='korytnik-memories-v1';
const DB_VERSION=1;
const STORE='chapters';
let db;
let chapters=[];
let selectedId=null;
let recorder=null;
let recordChunks=[];
let recordStream=null;
let literaryWorker=null;
let sessionAccessKey='';

const $=s=>document.querySelector(s);
const els={gate:$('#gate'),gateKey:$('#gateKey'),gateBtn:$('#gateBtn'),gateError:$('#gateError'),app:$('#app'),chapterList:$('#chapterList'),chapterCount:$('#chapterCount'),newBtn:$('#newBtn'),ready:$('#ready'),date:$('#chapterDate'),title:$('#chapterTitle'),audio:$('#audio'),audioInput:$('#audioInput'),uploadAudio:$('#uploadAudio'),recordBtn:$('#recordBtn'),audioNote:$('#audioNote'),dictionary:$('#dictionary'),editor:$('#editor'),raw:$('#rawText'),retranscribe:$('#retranscribe'),save:$('#save'),download:$('#download'),status:$('#status'),busy:$('#busy'),legacy:$('#legacy')};

function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function tx(mode='readonly'){return db.transaction(STORE,mode).objectStore(STORE)}
function getAll(){return new Promise((resolve,reject)=>{const r=tx().getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
function put(ch){return new Promise((resolve,reject)=>{const r=tx('readwrite').put(ch);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function remove(id){return new Promise((resolve,reject)=>{const r=tx('readwrite').delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function fmtDate(ts){return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(ts))}
function shortText(s){const t=String(s||'').trim();return t.length>58?t.slice(0,58)+'…':t||'Без текста'}
function current(){return chapters.find(c=>c.id===selectedId)||null}
function setStatus(text='',err=false){els.status.textContent=text;els.status.classList.toggle('error',err)}
function setBusy(on,text='Обрабатываю выбранную главу…'){els.busy.classList.toggle('hidden',!on);els.busy.textContent=text;els.retranscribe.disabled=on;els.save.disabled=on}
function objectUrl(blob){return blob?URL.createObjectURL(blob):''}

async function seed(){chapters=await getAll();if(chapters.length)return;const now=Date.now();const samples=[
{id:'chapter-1',title:'Это было в Трифештах. Мой отец был…',text:'Это было в Трифештах. Мой отец был тогда председателем. Он был молодым председателем, по-моему, самым молодым в районе.\n\nЕму было всего 28 лет. И первые мои воспоминания - это я в новом доме иду по тропинке к колодцу. И тут начал дождь идти, прям такой гром, дождь.\n\nИ вот я вдоль этой тропиночки узкой, вдоль забора, ну и конечно, испугался малыш. И я побежал домой. Ну, в смысле, в дом побежал.\n\nВот эти вот мои самые первые воспоминания. Раньше я ничего такого не помню. Это вот самые ранние.',raw:'',audioBlob:null,createdAt:now-2000,updatedAt:now-2000},
{id:'chapter-2',title:'У меня было связано всего одно вот…',text:'',raw:'',audioBlob:null,createdAt:now-1000,updatedAt:now-1000},
{id:'chapter-3',title:'Хочу рассказать про садик. Это отдельные воспоминания…',text:'',raw:'',audioBlob:null,createdAt:now,updatedAt:now}
];for(const c of samples)await put(c);chapters=await getAll()}

function renderList(){chapters.sort((a,b)=>b.createdAt-a.createdAt);els.chapterCount.textContent=chapters.length;els.chapterList.innerHTML=chapters.map((c,i)=>`<button class="chapter-item ${c.id===selectedId?'active':''}" data-id="${c.id}"><span class="chapter-kicker">ГЛАВА ${chapters.length-i}</span><span class="chapter-title">${escapeHtml(shortText(c.title||c.text))}</span><span class="chapter-date">${fmtDate(c.createdAt)}</span></button>`).join('');}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function selectChapter(id){selectedId=id;renderList();const c=current();if(!c)return;els.ready.textContent='ГОТОВАЯ ГЛАВА';els.date.textContent=fmtDate(c.createdAt);els.title.value=c.title||'';els.editor.value=c.text||'';els.raw.textContent=c.raw||'Исходная расшифровка пока отсутствует.';if(els.audio.dataset.url)URL.revokeObjectURL(els.audio.dataset.url);const url=objectUrl(c.audioBlob);els.audio.src=url;els.audio.dataset.url=url;els.audioNote.textContent=c.audioBlob?'Аудио этой главы сохранено локально':'Добавьте аудио этой главы для повторного распознавания';setStatus('')}

async function saveCurrent(){const c=current();if(!c)return;c.title=els.title.value.trim()||'Без названия';c.text=els.editor.value;c.updatedAt=Date.now();await put(c);renderList();setStatus('Сохранено')}
async function addChapter(){const c={id:'chapter-'+crypto.randomUUID(),title:'Новое воспоминание',text:'',raw:'',audioBlob:null,createdAt:Date.now(),updatedAt:Date.now()};await put(c);chapters.push(c);selectChapter(c.id)}
async function attachAudio(file){const c=current();if(!c||!file)return;c.audioBlob=file;c.updatedAt=Date.now();await put(c);selectChapter(c.id);setStatus('Аудио прикреплено к выбранной главе')}

function editLiterarily(transcript,chapterTitle){
  literaryWorker=literaryWorker||new Worker('literary.worker.js?v=1.1.0',{type:'module'});
  return new Promise((resolve,reject)=>{
    const onMessage=event=>{
      if(event.data.type==='status')setBusy(true,event.data.message||'Литературно оформляю главу…');
      if(event.data.type==='progress')setBusy(true,`Первоначальная загрузка редактора: ${event.data.progress}%`);
      if(event.data.type==='complete'){literaryWorker.removeEventListener('message',onMessage);resolve({title:String(event.data.title||'').trim(),content:String(event.data.content||'').trim()})}
      if(event.data.type==='error'){literaryWorker.removeEventListener('message',onMessage);reject(new Error(event.data.message||'Литературный редактор недоступен'))}
    };
    literaryWorker.addEventListener('message',onMessage);
    literaryWorker.postMessage({type:'edit',transcript,chapterTitle});
  });
}

async function retranscribe(){const c=current();if(!c)return;if(!sessionAccessKey){setStatus('Для распознавания нужно снова открыть личный архив.',true);return}if(!c.audioBlob){setStatus('Сначала прикрепите или запишите аудио именно этой главы.',true);return}setBusy(true,'Максимальное распознавание выбранной главы…');setStatus('Два прохода распознавания и сверка результата…');try{const dictionary=els.dictionary.value.trim();localStorage.setItem('memories-dictionary',dictionary);const form=new FormData();form.append('audio',c.audioBlob,c.audioBlob.name||'chapter.webm');form.append('chapter_title',els.title.value.trim());form.append('previous_text',els.editor.value.slice(0,3000));form.append('context',`Семейные воспоминания на русском языке. Сохранять имена, даты, географические названия и смысл буквально. Не додумывать слова. Личный словарь: ${dictionary||'не указан'}.`);form.append('quality','max');form.append('language','ru');const res=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':sessionAccessKey},body:form});const data=await res.json().catch(()=>({}));if(!res.ok||!data.ok)throw new Error(data.error||'Ошибка распознавания');const finalTranscript=String(data.text||data.raw_primary||'').trim();if(!finalTranscript)throw new Error('Распознавание не вернуло текст');c.raw=finalTranscript;setBusy(true,'Распознавание готово. Литературно оформляю главу…');try{const literary=await editLiterarily(finalTranscript,els.title.value.trim());c.text=literary.content||finalTranscript;if(!els.title.value.trim()||/^Новое воспоминание/i.test(els.title.value.trim()))c.title=literary.title||c.title}catch{c.text=finalTranscript;setStatus('Расшифровка готова. Литературный редактор временно недоступен.',true)}c.updatedAt=Date.now();await put(c);els.title.value=c.title;els.editor.value=c.text;els.raw.textContent=c.raw;renderList();if(c.text!==finalTranscript)setStatus('Готово: точная расшифровка сохранена отдельно, текст литературно обработан')}catch(e){setStatus(e.message||'Не удалось распознать',true)}finally{setBusy(false)}}

function downloadCurrent(){const c=current();if(!c)return;const blob=new Blob([`${c.title}\n\n${c.text}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(c.title||'vospominanie').replace(/[\\/:*?"<>|]/g,'_')+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

async function startStopRecording(){if(recorder&&recorder.state==='recording'){recorder.stop();return}try{recordStream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,sampleRate:48000,echoCancellation:true,noiseSuppression:true,autoGainControl:true}});recordChunks=[];const mime=['audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';recorder=new MediaRecorder(recordStream,mime?{mimeType:mime,audioBitsPerSecond:192000}:{audioBitsPerSecond:192000});recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data)};recorder.onstop=async()=>{recordStream.getTracks().forEach(t=>t.stop());const blob=new Blob(recordChunks,{type:recorder.mimeType||'audio/webm'});blob.name='chapter-recording.webm';await attachAudio(blob);els.recordBtn.textContent='● Записать';els.recordBtn.classList.remove('recording')};recorder.start(1000);els.recordBtn.textContent='■ Остановить';els.recordBtn.classList.add('recording');setStatus('Идёт запись только для выбранной главы')}catch(e){setStatus('Не удалось включить микрофон: '+(e.message||e),true)}}

async function unlock(){const key=els.gateKey.value.trim();if(!key){els.gateError.textContent='Введите пароль';return}els.gateBtn.disabled=true;els.gateError.textContent='Проверяю пароль…';try{const probe=new FormData();probe.append('action','validate');const response=await fetch(API_URL,{method:'POST',headers:{'x-memory-key':key},body:probe});if(response.status===401||response.status===403)throw new Error('Неверный пароль');sessionAccessKey=key;els.gateKey.value='';els.gate.classList.add('hidden');els.app.classList.remove('hidden');els.gateError.textContent=''}catch(error){els.gateError.textContent=error.message||'Не удалось проверить пароль'}finally{els.gateBtn.disabled=false}}

async function boot(){await openDb();await seed();chapters=await getAll();selectedId=chapters.sort((a,b)=>a.createdAt-b.createdAt)[0]?.id||null;els.dictionary.value=localStorage.getItem('memories-dictionary')||'';renderList();if(selectedId)selectChapter(selectedId);
els.gateBtn.onclick=unlock;els.gateKey.addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});els.newBtn.onclick=addChapter;els.chapterList.onclick=e=>{const b=e.target.closest('[data-id]');if(b)selectChapter(b.dataset.id)};els.save.onclick=saveCurrent;els.download.onclick=downloadCurrent;els.retranscribe.onclick=retranscribe;els.uploadAudio.onclick=()=>els.audioInput.click();els.audioInput.onchange=()=>{const f=els.audioInput.files?.[0];if(f)attachAudio(f);els.audioInput.value=''};els.recordBtn.onclick=startStopRecording;els.title.addEventListener('change',saveCurrent);els.editor.addEventListener('input',()=>{setStatus('Есть несохранённые изменения')});els.legacy.href='https://kniga-dlya-vnukov.nergy-techno-3776.chatgpt.site/'}
boot();
