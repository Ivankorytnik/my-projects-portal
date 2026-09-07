(function(){
'use strict';
const $=id=>document.getElementById(id);
const CRM_KEY='atomB2BCrmTemplateMapV1:';
let template=null;

const FIELDS=[
 {key:'__blank__',label:'— оставить пустым —'},
 {key:'__sample__',label:'Оставить значение из образца'},
 {key:'no',label:'№'},
 {key:'name',label:'Компания'},
 {key:'sector',label:'Отрасль'},
 {key:'region',label:'Регион'},
 {key:'fleetMin',label:'Парк min, шт.'},
 {key:'fleetMax',label:'Парк max, шт.'},
 {key:'atomMin',label:'ATOM min 12–24м, шт.'},
 {key:'atomMax',label:'ATOM max 12–24м, шт.'},
 {key:'score',label:'Скоринг 0–100'},
 {key:'lpr',label:'ЛПР / ФИО контакта'},
 {key:'lprRole',label:'Должность ЛПР'},
 {key:'lprGrade',label:'Достоверность ЛПР'},
 {key:'phone',label:'Телефон'},
 {key:'email',label:'E-mail'},
 {key:'social',label:'LinkedIn / Telegram'},
 {key:'procurement',label:'Закупочный вход'},
 {key:'outreach',label:'Способ выхода'},
 {key:'pilot',label:'Предложение пилота'},
 {key:'why',label:'Почему подходит'},
 {key:'next',label:'Следующий шаг'},
 {key:'source1',label:'Источник 1'},
 {key:'source2',label:'Источник 2'},
 {key:'checkedAt',label:'Проверено'},
 {key:'comment',label:'Комментарий'},
 {key:'addedAt',label:'Добавлено'}
];

const ALIASES={
 no:['№','номер','n','id','record id','record_id'],
 name:['компания','название компании','организация','клиент','customer','company','company name','account','account name','organization','organisation','legal entity'],
 sector:['отрасль','сегмент','industry','sector','segment'],
 region:['регион','город','territory','region','city','location'],
 fleetMin:['парк min, шт.','парк min','минимальный парк','fleet min','fleet_min'],
 fleetMax:['парк max, шт.','парк max','максимальный парк','fleet max','fleet_max','fleet size','fleet_size'],
 atomMin:['atom min 12–24м, шт.','atom min','прогноз min','potential min','forecast min'],
 atomMax:['atom max 12–24м, шт.','atom max','прогноз atom','прогноз закупки','potential','potential max','forecast','forecast max'],
 score:['скоринг 0–100','скоринг','score','rating','fit score','priority score'],
 lpr:['лпр','фио','контакт','контактное лицо','contact','contact person','full name','name contact','decision maker'],
 lprRole:['должность','должность лпр','роль','position','job title','title','role'],
 lprGrade:['достоверность лпр','достоверность','confidence','confidence grade','verification'],
 phone:['телефон','тел','мобильный','phone','phone number','mobile','telephone'],
 email:['e-mail','email','почта','электронная почта','mail','email address'],
 social:['linkedin/telegram','linkedin / telegram','linkedin','telegram','social','messenger'],
 procurement:['закупочный вход','закупки','procurement','procurement route','tender route'],
 outreach:['способ выхода','выход','канал контакта','outreach','approach','contact route'],
 pilot:['предложение пилота','пилот','pilot','pilot offer'],
 why:['почему подходит','обоснование','why','reason','fit reason'],
 next:['следующий шаг','next step','next action','action'],
 source1:['источник 1','источник','source 1','source','url','link'],
 source2:['источник 2','source 2','second source'],
 checkedAt:['проверено','дата проверки','checked','verified at','verification date'],
 comment:['комментарий','примечание','comment','note','notes'],
 addedAt:['добавлено','дата добавления','created','created at','added','added at']
};

function norm(v){return String(v??'').trim().toLowerCase().replace(/ё/g,'е').replace(/[\s_\-–—./\\]+/g,' ').replace(/[()\[\]{}:;,"'«»]/g,'').replace(/\s+/g,' ').trim();}
function notify(msg,kind='ok'){if(typeof window.notify==='function')return window.notify(msg,kind);let n=$('workflowToast');if(!n){n=document.createElement('div');n.id='workflowToast';n.className='workflow-toast';document.body.appendChild(n);}n.textContent=msg;n.dataset.kind=kind;n.classList.add('show');setTimeout(()=>n.classList.remove('show'),6500);}
function sourceData(){return typeof window.allCompanies==='function'?window.allCompanies():[];}
function valueFor(c,key,index){if(key==='no')return c.no||index+1;if(key==='lpr')return c.lpr||c.lprName||'';if(key==='lprRole')return c.lprRole||c.role||'';if(key==='lprGrade')return c.lprGrade||'';return c[key]??'';}
function autoField(header){const n=norm(header);if(!n)return '__blank__';for(const [key,list] of Object.entries(ALIASES)){if(list.some(a=>norm(a)===n))return key;}for(const [key,list] of Object.entries(ALIASES)){if(list.some(a=>{const x=norm(a);return x.length>=5&&(n.includes(x)||x.includes(n));}))return key;}return null;}
function fingerprint(headers){return headers.map(norm).join('|').slice(0,1000);}
function storedMap(headers){try{return JSON.parse(localStorage.getItem(CRM_KEY+fingerprint(headers))||'null');}catch{return null;}}
function saveMap(){if(!template)return;const m=collectMapping();try{localStorage.setItem(CRM_KEY+fingerprint(template.headers),JSON.stringify(m));}catch{}}
function detectHeader(rows){let best={index:0,count:0};for(let i=0;i<Math.min(rows.length,20);i++){const count=(rows[i]||[]).filter(v=>String(v??'').trim()).length;if(count>best.count)best={index:i,count};}return best.index;}
function uniqueHeaders(row){const used=new Map();return (row||[]).map((v,i)=>{let h=String(v??'').trim();if(!h)h=`Колонка ${i+1}`;const n=norm(h);const c=(used.get(n)||0)+1;used.set(n,c);return c>1?`${h} (${c})`:h;});}
function readTemplate(file){return new Promise((resolve,reject)=>{if(typeof XLSX==='undefined')return reject(new Error('Библиотека XLSX не загрузилась'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Не удалось прочитать файл'));reader.onload=()=>{try{const wb=XLSX.read(reader.result,{type:'array',cellDates:true,cellStyles:true});const sheetName=wb.SheetNames[0];if(!sheetName)throw new Error('В файле нет листов');const ws=wb.Sheets[sheetName];const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:'',blankrows:false,raw:false});if(!rows.length)throw new Error('Шаблон пустой');const headerIndex=detectHeader(rows);const headers=uniqueHeaders(rows[headerIndex]);const sample=(rows[headerIndex+1]||[]).slice(0,headers.length);resolve({fileName:file.name,workbook:wb,sheetName,headerIndex,headers,sample,originalRows:rows});}catch(e){reject(e);}};reader.readAsArrayBuffer(file);});}
function ensureModal(){if($('crmTemplateModal'))return;const wrap=document.createElement('div');wrap.id='crmTemplateModal';wrap.className='modal hidden';wrap.setAttribute('aria-hidden','true');wrap.innerHTML=`<div class="modal-card crm-template-card"><div class="modal-head"><div><p class="eyebrow">CRM IMPORT TEMPLATE</p><h2>Выгрузка по шаблону CRM</h2></div><button type="button" id="closeCrmTemplateModal" class="icon-btn">×</button></div><div id="crmTemplateInfo" class="crm-template-info"></div><div class="crm-template-note">Файл обрабатывается только в вашем браузере и никуда не загружается. Порядок и названия колонок берутся из шаблона.</div><div id="crmMappingTable" class="crm-mapping-table"></div><div class="crm-export-options"><label class="field"><span>CSV-разделитель</span><select id="crmCsvDelimiter"><option value=";">Точка с запятой ;</option><option value=",">Запятая ,</option><option value="\t">Табуляция</option></select></label><label class="field"><span>Какие компании</span><select id="crmDataScope"><option value="all">Вся база</option><option value="filtered">Текущий результат фильтра</option><option value="saved">Только сохранённые</option></select></label></div><div class="modal-actions"><button type="button" class="secondary" id="crmCancel">Отмена</button><button type="button" class="secondary" id="crmExportCsv">Выгрузить CSV</button><button type="button" class="primary" id="crmExportExcel">Выгрузить Excel</button></div></div>`;document.body.appendChild(wrap);
 const style=document.createElement('style');style.textContent=`.crm-template-card{width:min(980px,94vw);max-height:90vh;overflow:auto}.crm-template-info{display:flex;gap:18px;flex-wrap:wrap;margin:8px 0 10px;color:#555;font-size:13px}.crm-template-note{padding:10px 12px;background:#f6f7f8;border:1px solid #e4e7ea;border-radius:10px;font-size:12px;color:#59616b;margin-bottom:12px}.crm-mapping-table{display:grid;gap:6px;max-height:48vh;overflow:auto;padding-right:4px}.crm-map-row{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(210px,1fr) minmax(140px,.8fr);gap:10px;align-items:center;padding:7px 9px;border:1px solid #e4e7ea;border-radius:9px;background:#fff}.crm-map-row.unmatched{border-color:#e9b1b1;background:#fffafa}.crm-map-head{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#7b838d;background:#f6f7f8}.crm-map-sample{font-size:12px;color:#69717a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.crm-map-row select{width:100%;min-width:0;border:1px solid #d8dde2;border-radius:7px;padding:7px;background:#fff}.crm-export-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}@media(max-width:700px){.crm-map-row{grid-template-columns:1fr}.crm-map-head{display:none}.crm-export-options{grid-template-columns:1fr}}`;document.head.appendChild(style);
 $('closeCrmTemplateModal').onclick=closeModal;$('crmCancel').onclick=closeModal;$('crmExportExcel').onclick=()=>exportTemplate('xlsx');$('crmExportCsv').onclick=()=>exportTemplate('csv');wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal();});
}
function closeModal(){const m=$('crmTemplateModal');if(m){m.classList.add('hidden');m.setAttribute('aria-hidden','true');}}
function openModal(){ensureModal();const m=$('crmTemplateModal');m.classList.remove('hidden');m.setAttribute('aria-hidden','false');}
function optionsHtml(selected,sample){return FIELDS.map(f=>{if(f.key==='__sample__'&&!String(sample??'').trim())return '';return `<option value="${f.key}" ${f.key===selected?'selected':''}>${f.label}</option>`;}).join('');}
function renderMapping(){if(!template)return;const remembered=storedMap(template.headers)||{};let auto=0,unmatched=0;const rows=template.headers.map((h,i)=>{let selected=remembered[i]||autoField(h);if(!selected){selected=String(template.sample[i]??'').trim()?'__sample__':'__blank__';unmatched++;}else if(selected!=='__blank__'&&selected!=='__sample__')auto++;const klass=(selected==='__blank__'&&!String(template.sample[i]??'').trim())?' unmatched':'';return `<div class="crm-map-row${klass}" data-index="${i}"><div><strong>${escapeHtml(h)}</strong></div><div><select class="crm-map-select" data-index="${i}">${optionsHtml(selected,template.sample[i])}</select></div><div class="crm-map-sample" title="${escapeHtml(template.sample[i]??'')}">${escapeHtml(template.sample[i]??'')||'—'}</div></div>`;}).join('');
 $('crmMappingTable').innerHTML=`<div class="crm-map-row crm-map-head"><div>Колонка CRM</div><div>Поле базы</div><div>Пример из шаблона</div></div>${rows}`;
 $('crmTemplateInfo').innerHTML=`<span><strong>${escapeHtml(template.fileName)}</strong></span><span>Лист: ${escapeHtml(template.sheetName)}</span><span>${template.headers.length} колонок</span><span>авто-сопоставлено: ${auto}</span>`;
 document.querySelectorAll('.crm-map-select').forEach(s=>s.addEventListener('change',()=>{const row=s.closest('.crm-map-row');row?.classList.toggle('unmatched',s.value==='__blank__'&&!String(template.sample[Number(s.dataset.index)]??'').trim());saveMap();}));
}
function escapeHtml(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function collectMapping(){const m={};document.querySelectorAll('.crm-map-select').forEach(s=>m[s.dataset.index]=s.value);return m;}
function scopedData(){const scope=$('crmDataScope')?.value||'all';let data=sourceData();if(scope==='filtered'&&typeof window.filtered==='function')data=window.filtered();if(scope==='saved'&&typeof state!=='undefined'&&Array.isArray(state.saved))data=data.filter(c=>state.saved.includes(c.name));return data;}
function makeRows(data,mapping){return data.map((c,rowIndex)=>template.headers.map((h,i)=>{const key=mapping[i]||'__blank__';if(key==='__blank__')return '';if(key==='__sample__')return template.sample[i]??'';return valueFor(c,key,rowIndex);}));}
function cleanSheetBelowHeader(ws,headerIndex){const range=XLSX.utils.decode_range(ws['!ref']||'A1');for(let r=headerIndex+1;r<=range.e.r;r++){for(let c=range.s.c;c<=range.e.c;c++){delete ws[XLSX.utils.encode_cell({r,c})];}}range.e.r=headerIndex;ws['!ref']=XLSX.utils.encode_range(range);}
function buildTemplateSheet(data,mapping){const wb=template.workbook;const ws=wb.Sheets[template.sheetName];cleanSheetBelowHeader(ws,template.headerIndex);const matrix=makeRows(data,mapping);if(matrix.length)XLSX.utils.sheet_add_aoa(ws,matrix,{origin:{r:template.headerIndex+1,c:0}});return {wb,ws,matrix};}
function filename(ext){const d=new Date(),p=n=>String(n).padStart(2,'0'),base=template.fileName.replace(/\.(xlsx|xls|csv)$/i,'').replace(/[^a-zа-яё0-9_-]+/gi,'_');return `${base}_ATOM_${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}.${ext}`;}
function downloadBlob(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportTemplate(kind){try{if(!template)throw new Error('Сначала загрузите шаблон CRM');const data=scopedData();if(!data.length)throw new Error('Нет данных для выгрузки');const mapping=collectMapping();saveMap();const {wb,ws}=buildTemplateSheet(data,mapping);if(kind==='xlsx'){XLSX.writeFile(wb,filename('xlsx'),{compression:true,cellStyles:true});}else{const delim=$('crmCsvDelimiter')?.value||';',FS=delim==='\\t'?'\t':delim,csv=XLSX.utils.sheet_to_csv(ws,{FS,RS:'\r\n',blankrows:false});downloadBlob('\ufeff'+csv,filename('csv'),'text/csv;charset=utf-8');}notify(`Готово: ${data.length} компаний выгружено по структуре CRM-шаблона.`);closeModal();}catch(e){console.error('CRM template export',e);notify(e.message||'Не удалось сформировать выгрузку по CRM-шаблону','error');}}

function init(){const btn=$('crmTemplateButton'),input=$('crmTemplateInput');if(!btn||!input)return;btn.addEventListener('click',()=>input.click());input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file)return;try{btn.disabled=true;btn.textContent='Читаю шаблон…';template=await readTemplate(file);renderMapping();openModal();btn.dataset.template=file.name;btn.title=`Загружен шаблон: ${file.name}`;}catch(e){console.error(e);notify(`Не удалось прочитать CRM-шаблон: ${e.message}`,'error');}finally{btn.disabled=false;btn.textContent='CRM шаблон';}});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
