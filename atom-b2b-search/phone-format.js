(function(){
  function normalizeOne(raw){
    const digits=String(raw||'').replace(/\D/g,'');
    if(!digits)return '';
    if(digits.length===11&&digits[0]==='7')return '8'+digits.slice(1);
    if(digits.length===11&&digits[0]==='8')return digits;
    if(digits.length===10)return '8'+digits;
    return '';
  }
  function normalizeMany(raw){
    const parts=String(raw||'').split(/[;\n,]+/).map(s=>s.trim()).filter(Boolean);
    const out=[];
    parts.forEach(p=>{const n=normalizeOne(p);if(n&&!out.includes(n))out.push(n);});
    return out.join(';');
  }
  window.normalizeAtomPhone=normalizeMany;
  function apply(){
    if(typeof allCompanies!=='function')return;
    allCompanies().forEach(c=>{if(c.phone)c.phone=normalizeMany(c.phone);});
    try{
      if(window.state&&Array.isArray(state.custom)){
        state.custom.forEach(c=>{if(c.phone)c.phone=normalizeMany(c.phone);});
        localStorage.setItem('atomB2BSearchCustom',JSON.stringify(state.custom));
      }
    }catch(e){}
    if(typeof renderSearch==='function')renderSearch();
  }
  apply();
})();
