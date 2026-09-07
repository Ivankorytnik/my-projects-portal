(function(){
'use strict';
const VERSION='v1.8.6';
const CREDIT_MESSAGE='На API-балансе закончились средства/кредиты';
function setVersion(){
  const sidebarVersion=[...document.querySelectorAll('.system-info .system-row')].find(row=>row.querySelector('span')?.textContent?.trim()==='Версия')?.querySelector('strong');
  if(sidebarVersion)sidebarVersion.textContent=VERSION;
  const badge=document.getElementById('topVersionBadge');
  if(badge)badge.textContent=VERSION;
}
function fixResults(){
  const rx=/api_credits_exhausted|credit_balance_exhausted|insufficient_quota/i;
  ['lastSearchResult','systemLastSearchResult'].forEach(id=>{
    const node=document.getElementById(id);
    if(node&&rx.test(node.textContent||''))node.textContent=CREDIT_MESSAGE;
  });
  const toast=document.getElementById('workflowToast');
  if(toast&&rx.test(toast.textContent||'')){
    toast.textContent=CREDIT_MESSAGE+'. Пополните баланс OpenAI API и повторите поиск.';
    toast.dataset.kind='error';
  }
  try{
    const key='atomB2BSearchWorkflowLastSearch';
    const raw=localStorage.getItem(key);
    if(raw){const data=JSON.parse(raw);if(rx.test(String(data.result||'')+' '+String(data.error||''))){data.result=CREDIT_MESSAGE;data.error='api_credits_exhausted';localStorage.setItem(key,JSON.stringify(data));}}
  }catch(e){}
}
setVersion();fixResults();
setTimeout(()=>{setVersion();fixResults();},500);
})();