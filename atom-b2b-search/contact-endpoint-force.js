(function(){
  const NEW='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-contact-refresh-v2';
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.includes('/functions/v1/atom-b2b-lpr-contact')){
        if(typeof input==='string') return nativeFetch(NEW,init);
        const nextInit={method:input.method,headers:input.headers,body:init&&init.body!==undefined?init.body:undefined,mode:input.mode,credentials:input.credentials,cache:'no-store',redirect:input.redirect,referrer:input.referrer,referrerPolicy:input.referrerPolicy,integrity:input.integrity,keepalive:input.keepalive,signal:input.signal};
        return nativeFetch(NEW,Object.assign({},nextInit,init||{}));
      }
    }catch(e){console.error('force contact endpoint',e);}
    return nativeFetch(input,init);
  };
  window.__ATOM_CONTACT_ENDPOINT__=NEW;
})();
