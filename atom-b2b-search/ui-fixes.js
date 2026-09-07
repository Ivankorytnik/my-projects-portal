(function(){
'use strict';
const VERSION='v1.8.4';
const CREDIT_MESSAGE='На API-балансе закончились средства/кредиты';
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
function apply(){setVersion();fixResults();}
apply();
setTimeout(apply,50);setTimeout(apply,500);setTimeout(apply,1500);
const observer=new MutationObserver(apply);
observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
setTimeout(()=>observer.disconnect(),15000);
})();
