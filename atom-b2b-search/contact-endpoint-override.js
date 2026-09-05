(function(){
  const OLD='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-lpr-contact';
  const NEW='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-b2b-contact-refresh-v2';
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    try{
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(url===OLD){
        if(typeof input==='string') return nativeFetch(NEW,init);
        const req=new Request(NEW,input);
        return nativeFetch(req,init);
      }
    }catch(e){console.warn('contact endpoint redirect',e);}
    return nativeFetch(input,init);
  };
})();
