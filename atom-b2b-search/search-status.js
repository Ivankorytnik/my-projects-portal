(function(){
 const ENDPOINT='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-search';
 function ensureUi(){
   const meta=document.querySelector('.integration-meta');
   if(!meta||document.getElementById('lastSearchResult'))return;
   const span=document.createElement('span');
   span.innerHTML='Результат поиска: <strong id="lastSearchResult">—</strong>';
   const sync=meta.querySelector('#lastSyncAt')?.parentElement;
   if(sync)meta.insertBefore(span,sync);else meta.appendChild(span);
   const sys=document.querySelector('.system-info');
   if(sys&&!document.getElementById('systemLastSearchResult')){
     const row=document.createElement('div');row.className='system-row';row.innerHTML='<span>Результат поиска</span><strong id="systemLastSearchResult">—</strong>';sys.appendChild(row);
   }
 }
 function show(n){
   const val=`+${Number(n)||0} новых`;
   localStorage.setItem('atomB2BLastSearchResult',String(Number(n)||0));
   const a=document.getElementById('lastSearchResult');if(a)a.textContent=val;
   const b=document.getElementById('systemLastSearchResult');if(b)b.textContent=val;
 }
 async function refresh(){
   ensureUi();
   const cached=localStorage.getItem('atomB2BLastSearchResult');if(cached!==null)show(cached);
   try{
     const r=await fetch(ENDPOINT,{method:'GET'});const d=await r.json();
     if(r.ok&&d?.latest){show(Array.isArray(d.latest.companies)?d.latest.companies.length:0);}
   }catch(e){console.warn('search result status',e);}
 }
 function watchSearch(){
   const btn=document.getElementById('findMoreButton');if(!btn)return;
   btn.addEventListener('click',()=>{
     const before=localStorage.getItem('atomB2BLastSearch')||'';let tries=0;
     const timer=setInterval(async()=>{tries++;try{const r=await fetch(ENDPOINT,{method:'GET'});const d=await r.json();if(r.ok&&d?.latest?.searchedAt&&d.latest.searchedAt!==before){show(Array.isArray(d.latest.companies)?d.latest.companies.length:0);clearInterval(timer);}}catch(e){}if(tries>=45)clearInterval(timer);},2000);
   });
 }
 setTimeout(()=>{refresh();watchSearch();},0);
})();
