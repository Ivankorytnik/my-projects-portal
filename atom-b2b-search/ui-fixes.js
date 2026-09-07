(function(){
'use strict';
const VERSION='v1.8.5';
const CREDIT_MESSAGE='На API-балансе закончились средства/кредиты';
function installToolbar(){
  if(!document.getElementById('topToolbarFixStyles')){
    const style=document.createElement('style');
    style.id='topToolbarFixStyles';
    style.textContent=`
      .top-actions.workflow-actions{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;gap:8px!important;white-space:nowrap;max-width:100%;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}
      .top-actions.workflow-actions>*{flex:0 0 auto!important}
      .top-actions.workflow-actions .primary,.top-actions.workflow-actions .secondary{padding:9px 12px!important;font-size:12px!important}
      .top-version-badge{display:inline-flex;align-items:center;height:34px;padding:0 10px;border:1px solid #d7dadd;border-radius:8px;background:#f7f8f9;color:#5f656c;font-size:11px;font-weight:700;letter-spacing:.02em}
      @media(max-width:640px){.top-actions.workflow-actions{margin-top:14px;overflow-x:auto}.top-version-badge{height:32px}}
    `;
    document.head.appendChild(style);
  }
  const actions=document.querySelector('.top-actions.workflow-actions');
  if(actions&&!document.getElementById('topVersionBadge')){
    const badge=document.createElement('span');
    badge.id='topVersionBadge';
    badge.className='top-version-badge';
    badge.textContent=VERSION;
    badge.title='Текущая версия';
    actions.appendChild(badge);
  }
  const badge=document.getElementById('topVersionBadge');if(badge)badge.textContent=VERSION;
}
function setVersion(){
  const rows=document.querySelectorAll('.system-info .system-row');
  for(const row of rows){
    const label=row.querySelector('span')?.textContent?.trim();
    if(label==='Версия'){
      const value=row.querySelector('strong');
      if(value&&value.textContent!==VERSION)value.textContent=VERSION;
      break;
    }
  }
  const badge=document.getElementById('topVersionBadge');if(badge)badge.textContent=VERSION;
}
function translateText(text){
  const value=String(text||'');
  if(/api_credits_exhausted|credit_balance_exhausted|insufficient_quota/i.test(value))return CREDIT_MESSAGE;
  return value;
}
function fixResults(){
  ['lastSearchResult','systemLastSearchResult'].forEach(id=>{
    const node=document.getElementById(id);
    if(node){const next=translateText(node.textContent);if(next!==node.textContent)node.textContent=next;}
  });
  const toast=document.getElementById('workflowToast');
  if(toast&&/api_credits_exhausted|credit_balance_exhausted|insufficient_quota/i.test(toast.textContent||'')){
    toast.textContent=CREDIT_MESSAGE+'. Пополните баланс OpenAI API и повторите поиск.';
    toast.dataset.kind='error';
  }
  try{
    const key='atomB2BSearchWorkflowLastSearch';
    const raw=localStorage.getItem(key);
    if(raw){
      const data=JSON.parse(raw);
      if(/api_credits_exhausted|credit_balance_exhausted|insufficient_quota/i.test(String(data.result||'')+' '+String(data.error||''))){
        data.result=CREDIT_MESSAGE;
        data.error='api_credits_exhausted';
        localStorage.setItem(key,JSON.stringify(data));
      }
    }
  }catch(e){}
}
function apply(){installToolbar();setVersion();fixResults();}
apply();
setTimeout(apply,50);setTimeout(apply,500);setTimeout(apply,1500);
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
setTimeout(()=>observer.disconnect(),15000);
})();
