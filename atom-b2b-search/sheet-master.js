(function(){
'use strict';
const SPREADSHEET_ID='1v0DiMltTOFb_3SSkigH6RPXOZdEVFpIKG5XBatTCz2g';
const SHEET_NAME='TOP-50';
const norm=value=>String(value||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'()\\/\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
const clean=value=>String(value==null?'':value).trim().replace(/^(—|-|–)$/,'');
const originalAll=typeof window.allCompanies==='function'?window.allCompanies.bind(window):()=>[];
const metadata=new Map(originalAll().map(c=>[norm(c.name),c]));
let sheetCompanies=[];
let ready=false;

function fromRow(values){
 const name=clean(values[0]);if(!name)return null;
 const base=metadata.get(norm(name))||{};
 return {
  ...base,
  name,
  sector:base.sector||'Требует классификации',
  region:base.region||'—',
  fleetMin:Number(base.fleetMin)||0,
  fleetMax:Number(base.fleetMax)||0,
  atomMin:Number(base.atomMin)||0,
  atomMax:Number(base.atomMax)||0,
  score:Number(base.score)||0,
  use:base.use||'Требуется уточнить сценарий корпоративного использования',
  why:base.why||'Компания присутствует в рабочей Google Таблице TOP-50.',
  pilot:base.pilot||'Параметры пилота требуют уточнения.',
  next:base.next||'Проверить ЛПР, парк и сценарий использования.',
  lpr:clean(values[1]),
  lprRole:clean(values[2]),
  lprGrade:clean(values[3]),
  phone:clean(values[4]),
  email:clean(values[5]),
  sheetMaster:true,
  contactSourceMode:'google_sheet'
 };
}

function dedupe(items){const seen=new Set();return items.filter(c=>{const k=norm(c?.name);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function setMaster(items){
 sheetCompanies=dedupe(items);
 ready=sheetCompanies.length>0;
 window.__atomSheetCompanies=sheetCompanies;
 window.__atomSheetMasterReady=ready;
 window.allCompanies=()=>ready?sheetCompanies:originalAll();
 const count=sheetCompanies.length;
 const sys=document.getElementById('systemCompanies');if(sys)sys.textContent=count+' компаний';
 const kpi=document.getElementById('kpiCompanies');if(kpi)kpi.textContent=String(count);
 if(typeof window.initFilters==='function')window.initFilters();
 if(typeof window.renderDashboard==='function')window.renderDashboard();
 if(typeof window.renderSearch==='function')window.renderSearch();
 if(typeof window.renderSaved==='function')window.renderSaved();
}

function load(){
 return new Promise((resolve,reject)=>{
  const cb='__atomMaster_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');let done=false;
  const cleanup=()=>{if(done)return;done=true;try{delete window[cb]}catch(e){window[cb]=undefined}script.remove();};
  const fail=e=>{cleanup();reject(e instanceof Error?e:new Error(String(e||'sheet_master_failed')))};
  window[cb]=payload=>{
   try{
    if(!payload||payload.status==='error'||!payload.table||!Array.isArray(payload.table.rows))throw new Error('invalid_google_sheet_response');
    const rows=payload.table.rows.map(r=>(r.c||[]).map(cell=>cell?(cell.f!=null?cell.f:(cell.v==null?'':cell.v)):''));
    const companies=rows.map(fromRow).filter(Boolean);
    if(!companies.length)throw new Error('empty_google_sheet');
    cleanup();resolve(companies);
   }catch(e){fail(e)}
  };
  script.onerror=()=>fail(new Error('google_sheet_network_error'));
  const params=new URLSearchParams({sheet:SHEET_NAME,headers:'1',tq:'select B,I,J,K,L,M',tqx:`out:json;responseHandler:${cb}`});
  script.src=`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?${params.toString()}`;
  document.head.appendChild(script);
  setTimeout(()=>fail(new Error('google_sheet_timeout')),12000);
 });
}

window.reloadAtomSheetMaster=async()=>{try{const companies=await load();setMaster(companies);return {ok:true,count:companies.length};}catch(error){console.warn('Google Sheet master list',error);return {ok:false,count:0,error:String(error?.message||error)}}};
window.reloadAtomSheetMaster();
})();
