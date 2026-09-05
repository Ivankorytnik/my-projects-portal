(function(){
'use strict';

const STAGES=[
  {id:'new',label:'Новая'},
  {id:'checked',label:'Проверена'},
  {id:'lpr',label:'ЛПР найден'},
  {id:'sheet',label:'В Google Таблице'},
  {id:'work',label:'В работе'}
];
const STAGE_RANK=Object.fromEntries(STAGES.map((s,i)=>[s.id,i]));
const STATUS_CACHE='atomB2BCompanyStagesV1';
const ONLY_NEW_CACHE='atomB2BOnlyLatestNew';
const SEARCH_CACHE='atomB2BSearchWorkflowLastSearch';
const SYNC_CACHE='atomB2BSearchWorkflowLastSync';
const el=id=>document.getElementById(id);
const normalize=value=>String(value||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'()\\\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
const safeJson=text=>{try{return JSON.parse(text)}catch{return {}}};
let stageMap=safeJson(localStorage.getItem(STATUS_CACHE)||'{}');

function saveStages(){localStorage.setItem(STATUS_CACHE,JSON.stringify(stageMap));}
function companyKey(companyOrName){return normalize(typeof companyOrName==='string'?companyOrName:companyOrName?.name);}
function latestSearch(){return safeJson(localStorage.getItem(SEARCH_CACHE)||'{}');}
function latestSearchKeySet(){
  const search=latestSearch();
  const set=new Set((Array.isArray(search.names)?search.names:[]).map(normalize).filter(Boolean));
  if(set.size)return set;
  if(!search.searchedAt||typeof allCompanies!=='function')return set;
  allCompanies().forEach(company=>{
    if(company?.discovered&&company?.addedAt===search.searchedAt)set.add(companyKey(company));
  });
  return set;
}
function isLatestNew(company){const key=companyKey(company);return Boolean(key&&latestSearchKeySet().has(key));}
function meaningfulLpr(value){const text=String(value||'').trim().toLowerCase();return Boolean(text&&!/нет данных|не указан|уточняется|имя публично не подтверждено/.test(text)&&text!=='—');}
function inferredStage(company){
  const key=companyKey(company);
  if(key&&stageMap[key])return stageMap[key];
  if(isLatestNew(company))return 'new';
  try{if(typeof window.getCompanyLpr==='function'&&window.getCompanyLpr(company)?.found)return 'sheet';}catch(e){}
  if(meaningfulLpr(company?.lprName)||meaningfulLpr(company?.lpr))return 'lpr';
  return 'checked';
}
function getStage(company){return inferredStage(company);}
function setStage(companyOrName,stage,{render=true}={}){
  if(!(stage in STAGE_RANK))return;
  const key=companyKey(companyOrName);if(!key)return;
  stageMap[key]=stage;saveStages();
  if(render&&typeof window.renderSearch==='function')window.renderSearch();
}
function advanceAtLeast(company,stage){
  const current=getStage(company);
  if((STAGE_RANK[current]??0)>=(STAGE_RANK[stage]??0))return false;
  setStage(company,stage,{render:false});return true;
}
function stageLabel(id){return STAGES.find(s=>s.id===id)?.label||'Проверена';}
function stageOptions(current){return STAGES.map(s=>`<option value="${s.id}"${s.id===current?' selected':''}>${s.label}</option>`).join('');}

function installStyles(){
  if(el('pipelineStyles'))return;
  const style=document.createElement('style');style.id='pipelineStyles';style.textContent=`
    .pipeline-new-toggle{display:flex;align-items:center;gap:10px;min-height:58px;padding:9px 11px;border:1px solid #d9dce0;border-radius:8px;background:#fff;color:#454b52;cursor:pointer}.pipeline-new-toggle input{width:17px;height:17px;margin:0;accent-color:#15171a}.pipeline-new-toggle .toggle-copy{display:grid;gap:2px;line-height:1.2}.pipeline-new-toggle .toggle-copy strong{font-size:12px;color:#15171a}.pipeline-new-toggle .toggle-copy small{font-size:10px;color:#858b91}.pipeline-new-toggle.is-on{background:#f7fbe8;border-color:#cbd98e}.pipeline-new-count{margin-left:auto;min-width:28px;padding:3px 7px;border-radius:999px;background:#15171a;color:#fff;font-size:10px;text-align:center}
    .pipeline-stage-cell{min-width:0}.pipeline-stage-select{width:100%;min-width:118px;border:1px solid #d9dce0;border-radius:7px;background:#fff;padding:6px 7px;font-size:11px;font-weight:700;color:#34383d;cursor:pointer}.pipeline-stage-select[data-stage="new"]{background:#fff9df;border-color:#e7cf6f}.pipeline-stage-select[data-stage="checked"]{background:#f4f5f6}.pipeline-stage-select[data-stage="lpr"]{background:#eef6ff;border-color:#b9d3ee}.pipeline-stage-select[data-stage="sheet"]{background:#eff8ea;border-color:#bedcae}.pipeline-stage-select[data-stage="work"]{background:#15171a;border-color:#15171a;color:#fff}.pipeline-empty{padding:28px;text-align:center;color:#7b8087;border-top:1px solid #eceef0}.pipeline-modal-status{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:13px 14px;border:1px solid #e2e5e8;border-radius:10px;background:#fafbfb;margin-bottom:14px}.pipeline-modal-status span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#858b91;margin-bottom:4px}.pipeline-modal-status strong{font-size:14px}.pipeline-modal-status .pipeline-stage-select{min-width:170px}.pipeline-filter-field{align-self:end}
    .company-row.lpr-grid{grid-template-columns:1.08fr 1fr .72fr .95fr .58fr .42fr .55fr .72fr .42fr!important}
    @media(max-width:1200px){.company-row.lpr-grid{grid-template-columns:1.15fr 1fr .8fr 1fr .5fr .6fr .75fr!important}.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(9){display:none!important}.company-row.lpr-grid>:nth-child(8){display:block!important}}
    @media(max-width:760px){.company-row.lpr-grid{grid-template-columns:1.08fr 1fr .9fr!important}.company-row.lpr-grid>:nth-child(3),.company-row.lpr-grid>:nth-child(4),.company-row.lpr-grid>:nth-child(5),.company-row.lpr-grid>:nth-child(6),.company-row.lpr-grid>:nth-child(7),.company-row.lpr-grid>:nth-child(9){display:none!important}.company-row.lpr-grid>:nth-child(8){display:block!important}.pipeline-modal-status{grid-template-columns:1fr}.pipeline-modal-status .pipeline-stage-select{width:100%;min-width:0}}
  `;document.head.appendChild(style);
}

function installFilters(){
  const grid=document.querySelector('.filters-grid');if(!grid||el('onlyLatestNewFilter'))return;
  const status=document.createElement('label');status.className='field pipeline-filter-field';status.innerHTML=`<span>Статус</span><select id="companyStageFilter"><option value="all">Все статусы</option>${STAGES.map(s=>`<option value="${s.id}">${s.label}</option>`).join('')}</select>`;
  const toggle=document.createElement('label');toggle.className='pipeline-new-toggle';toggle.id='latestNewToggle';toggle.innerHTML=`<input id="onlyLatestNewFilter" type="checkbox"><span class="toggle-copy"><strong>Только новые</strong><small>после последнего поиска</small></span><span class="pipeline-new-count" id="latestNewCount">0</span>`;
  grid.append(status,toggle);
  const input=el('onlyLatestNewFilter');input.checked=localStorage.getItem(ONLY_NEW_CACHE)==='1';
  input.addEventListener('change',()=>{localStorage.setItem(ONLY_NEW_CACHE,input.checked?'1':'0');toggle.classList.toggle('is-on',input.checked);window.renderSearch?.();});
  el('companyStageFilter').addEventListener('change',()=>window.renderSearch?.());
  toggle.classList.toggle('is-on',input.checked);
  const reset=el('resetFilters');if(reset)reset.addEventListener('click',()=>{input.checked=false;localStorage.setItem(ONLY_NEW_CACHE,'0');el('companyStageFilter').value='all';toggle.classList.remove('is-on');setTimeout(()=>window.renderSearch?.(),0);});
}

function companyByRow(row){
  const name=row.querySelector('.company-name')?.textContent?.trim();
  if(!name||typeof allCompanies!=='function')return null;
  const key=normalize(name);return allCompanies().find(c=>companyKey(c)===key)||null;
}
function insertStageCell(row,company){
  if(row.querySelector('.pipeline-stage-cell'))return;
  const cell=document.createElement('div');cell.className='pipeline-stage-cell';
  if(row.classList.contains('header')){cell.textContent='Статус';}
  else if(company){const stage=getStage(company);cell.innerHTML=`<select class="pipeline-stage-select" data-company="${String(company.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" data-stage="${stage}">${stageOptions(stage)}</select>`;const select=cell.querySelector('select');select.addEventListener('click',e=>e.stopPropagation());select.addEventListener('change',e=>{const next=e.target.value;e.target.dataset.stage=next;setStage(company,next,{render:false});applyDecorations();});}
  const anchor=row.lastElementChild;row.insertBefore(cell,anchor);
}
function applyDecorations(){
  const table=el('companiesTable');if(!table)return;
  table.querySelectorAll('.pipeline-empty').forEach(n=>n.remove());
  const rows=[...table.querySelectorAll('.company-row')];
  const latestKeys=latestSearchKeySet();
  const onlyNew=Boolean(el('onlyLatestNewFilter')?.checked);
  const stageFilter=el('companyStageFilter')?.value||'all';
  let visible=0,visibleNew=0;
  rows.forEach((row,index)=>{
    if(index===0||row.classList.contains('header')){insertStageCell(row,null);row.hidden=false;return;}
    const company=companyByRow(row);insertStageCell(row,company);if(!company)return;
    const stage=getStage(company);const key=companyKey(company);const isNew=latestKeys.has(key);
    const show=(!onlyNew||isNew)&&(stageFilter==='all'||stage===stageFilter);
    row.hidden=!show;if(show){visible++;if(isNew)visibleNew++;}
    const select=row.querySelector('.pipeline-stage-select');if(select){select.value=stage;select.dataset.stage=stage;}
  });
  const count=el('resultCount');if(count)count.textContent=`Найдено: ${visible}${latestKeys.size?` · новых: ${visibleNew}`:''}`;
  setText('latestNewCount',String(latestKeys.size));
  const toggle=el('latestNewToggle');if(toggle)toggle.classList.toggle('is-on',onlyNew);
  if(visible===0&&rows.length>1){const empty=document.createElement('div');empty.className='pipeline-empty';empty.textContent=onlyNew?'После последнего поиска новых компаний под текущие фильтры нет.':'Компаний с выбранным статусом под текущие фильтры нет.';table.appendChild(empty);}
}
function setText(id,value){const node=el(id);if(node)node.textContent=value;}

function wrapRenderSearch(){
  if(typeof window.renderSearch!=='function'||window.renderSearch.__pipelineWrapped)return;
  const original=window.renderSearch;
  const wrapped=function(){original();applyDecorations();};wrapped.__pipelineWrapped=true;window.renderSearch=wrapped;
  ['companySearch','sectorFilter','scoreFilter','volumeFilter','priorityFilter','sortFilter'].forEach(id=>{const node=el(id);if(node)node.addEventListener(id==='companySearch'?'input':'change',()=>setTimeout(()=>window.renderSearch?.(),0));});
  window.renderSearch();
}

function addModalStatus(company){
  const box=el('companyDetails');if(!box||!company)return;
  box.querySelector('.pipeline-modal-status')?.remove();
  const stage=getStage(company);const section=document.createElement('div');section.className='pipeline-modal-status';section.innerHTML=`<div><span>Статус компании</span><strong>${stageLabel(stage)}</strong></div><select class="pipeline-stage-select" data-stage="${stage}">${stageOptions(stage)}</select>`;
  const select=section.querySelector('select');select.addEventListener('change',()=>{setStage(company,select.value,{render:false});select.dataset.stage=select.value;section.querySelector('strong').textContent=stageLabel(select.value);window.renderSearch?.();});
  box.insertBefore(section,box.firstChild);
}
function wrapOpenCompany(){
  if(typeof window.openCompany!=='function'||window.openCompany.__pipelineWrapped)return;
  const original=window.openCompany;
  const wrapped=function(name){const company=typeof allCompanies==='function'?allCompanies().find(c=>c.name===name||companyKey(c)===normalize(name)):null;if(company&&getStage(company)==='new')setStage(company,'checked',{render:false});original(name);if(company)addModalStatus(company);window.renderSearch?.();};wrapped.__pipelineWrapped=true;window.openCompany=wrapped;
}

function watchSearch(){
  const button=el('findMoreButton');if(!button)return;
  button.addEventListener('click',()=>{
    const before=localStorage.getItem(SEARCH_CACHE)||'';let tries=0;
    const timer=setInterval(()=>{tries++;const after=localStorage.getItem(SEARCH_CACHE)||'';if(after&&after!==before){clearInterval(timer);const payload=safeJson(after);const latest=latestSearchKeySet();if(latest.size){latest.forEach(key=>{if(!stageMap[key])stageMap[key]='new';});saveStages();const input=el('onlyLatestNewFilter');if(input){input.checked=true;localStorage.setItem(ONLY_NEW_CACHE,'1');}window.renderSearch?.();}return;}if(tries>=120)clearInterval(timer);},500);
  });
}
function watchSync(){
  const button=el('syncGoogleButton');if(!button)return;
  button.addEventListener('click',()=>{
    const before=localStorage.getItem(SYNC_CACHE)||'';let tries=0;
    const timer=setInterval(()=>{tries++;const after=localStorage.getItem(SYNC_CACHE)||'';if(after&&after!==before){clearInterval(timer);const payload=safeJson(after);if(!String(payload.result||'').toLowerCase().includes('ошибка')&&typeof state!=='undefined'&&Array.isArray(state.custom)){let changed=false;state.custom.filter(c=>c&&(c.discovered||c.custom)).forEach(company=>{const current=getStage(company);if((STAGE_RANK[current]??0)<STAGE_RANK.sheet){setStage(company,'sheet',{render:false});changed=true;}});if(changed)window.renderSearch?.();}return;}if(tries>=120)clearInterval(timer);},500);
  });
}

function upgradeExistingStages(){
  if(typeof allCompanies!=='function')return;
  let changed=false;
  allCompanies().forEach(company=>{
    const key=companyKey(company);if(!key||stageMap[key])return;
    try{if(typeof window.getCompanyLpr==='function'&&window.getCompanyLpr(company)?.found){stageMap[key]='sheet';changed=true;return;}}catch(e){}
  });
  if(changed)saveStages();
}

installStyles();installFilters();upgradeExistingStages();wrapRenderSearch();wrapOpenCompany();watchSearch();watchSync();
})();
