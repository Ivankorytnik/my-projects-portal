'use strict';
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (!url.includes('written_obligation_template.b64')) return nativeFetch(input, init);
    const parts = await Promise.all([1,2,3,4,5,6].map(i => nativeFetch(`./templates/written_obligation_template.part${i}?v=20260911-1`, {cache:'force-cache', credentials:'same-origin'})));
    if (parts.some(r => !r.ok)) return new Response('', {status:404, statusText:'Template part not found'});
    const text = (await Promise.all(parts.map(r => r.text()))).join('');
    return new Response(text, {status:200, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=31536000, immutable'}});
  };
})();