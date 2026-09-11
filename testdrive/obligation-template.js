'use strict';

(() => {
  const KIND='obligation';
  const LABEL='Письменное обязательство';
  const TEMPLATE_FILE='written_obligation_template.docx';
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const months=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

  function fmtDate(v) {
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');
    return m ? `${m[3]}.${m[2]}.${m[1]}` : (v||'');
  }
  function longDate(v) {
    const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(v||'');
    return m ? {day:m[3],month:months[Number(m[2])-1]||'',year:m[1]} : {day:'__',month:'________',year:'2026'};
  }
  function data() {
    const d={};
    $$('[data-f]').forEach(el=>d[el.dataset.f]=String(el.value||'').trim());
    d.birthDateText=fmtDate(d.birthDate);
    const td=longDate(d.testDriveDate);
    d.testDriveDateDay=td.day; d.testDriveDateMonth=td.month; d.testDriveDateYear=td.year;
    return d;
  }
  function render() {
    const panel=$('[data-doc-panel="obligation"]'); if (!panel) return;
    const d=data();
    Object.entries(d).forEach(([key,val])=>panel.querySelectorAll(`[data-o="${key}"]`).forEach(el=>el.textContent=val||''));
  }

  function addBirthPlaceField() {
    if ($('[data-f="birthPlace"]')) return true;
    const birth=$('[data-f="birthDate"]'); if (!birth) return false;
    const row=birth.closest('.row'); if (!row) return false;
    const field=document.createElement('div'); field.className='field';
    const label=document.createElement('label'); label.textContent='Место рождения';
    const input=document.createElement('input'); input.dataset.f='birthPlace'; input.autocomplete='off';
    field.append(label,input); row.after(field);
    return true;
  }

  function markup() {
    return `<article class="td-doc-paper td-obligation-paper">
      <section class="td-obligation-page">
        <div class="td-center td-doc-title">Письменное обязательство о гарантиях</div>
        <div class="td-obligation-head"><b>г. Липецк, ____________________</b><b>«<span data-o="testDriveDateDay">__</span>» <span data-o="testDriveDateMonth">________</span> <span data-o="testDriveDateYear">2026</span> года</b></div>
        <p>Настоящим, Я <span class="td-fill" data-o="fullName"></span> (ФИО), паспортные данные: <span class="td-fill" data-o="passportSeries"></span> (серия), <span class="td-fill" data-o="passportNumber"></span> (номер), <span class="td-fill" data-o="passportIssuedBy"></span>, <span class="td-fill" data-o="passportCode"></span> (код подразделения), <span class="td-fill" data-o="birthDateText"></span> (дата рождения), <span class="td-fill" data-o="birthPlace"></span> (место рождения), <span class="td-fill" data-o="registrationAddress"></span> (адрес регистрации), даю письменное обязательство в адрес Акционерного Общества «КАМА» (ИНН: 1650404549, ОГРН: 1211600055424, юридический адрес: 115191, г. Москва, вн.тер.г. муниципальный округ Даниловский, пер. Холодильный, д.6) и гарантирую следующее:</p>
        <ul class="td-obligation-list">
          <li>свое добровольное участие в проводимом тест драйве прототипа электромобиля «Атом»;</li>
          <li>наличие у меня действующего водительского удостоверения, а также достаточного опыта для управления транспортным средством;</li>
          <li>отсутствие в отношении меня ограничений на право управления транспортными средствами на дату дачи настоящего Обязательства;</li>
          <li>отсутствие у меня медицинских противопоказаний (головокружение, сердечная недостаточность, эпилепсия и пр.) для участия в тест драйве;</li>
          <li>отсутствие факта приема мной алкогольных, наркотических, психотропных веществ, и иных веществ прием которых, является противопоказанием к управлению транспортными средствами на момент участия в тест драйве;</li>
          <li>до начал проведения тест драйва я ознакомился с Правилами техники безопасности, маршрутом, а также инструкциями по управлению прототипом электромобиля «Атом»;</li>
          <li>я осознаю, что прототип электромобиля «Атом» является источником повышенной опасности, в связи с этим беру на себя полную ответственность за причинение любого вреда жизни, здоровью, имуществу себе и любым лицам, которым такой вред может быть причинен:</li>
        </ul>
        <p class="td-obligation-sign"><span data-o="fullName"></span> / _________________(подпись)</p>
      </section>
      <div class="td-obligation-page-break"></div>
      <section class="td-obligation-page td-obligation-page-two">
        <p>Настоящим также даю согласие АО «КАМА» на автоматизированную, а также без использования средств автоматизации, обработку (включая сбор, запись, систематизацию, накопление, хранение, уточнение (обновление, изменение), использование, передачу (распространение, предоставление, доступ), блокирование, удаление, уничтожение) моих персональных данных, указанных выше, а также моих фото- и видеоизображений для целей участия в проводимом тест драйве прототипа электромобиля «Атом».</p>
        <p>Согласие вступает в силу со дня его подписания и действует до достижения цели обработки.</p>
        <p>Согласие может быть отозвано путем подачи письменного заявления об отзыве в АО «КАМА» по адресу АО «КАМА», указанному выше в настоящем согласии.</p>
        <p class="td-obligation-sign"><span data-o="fullName"></span> / _________________(подпись)</p>
        <p>Настоящим также, руководствуясь п. 1 ст. 152.1 Гражданского кодекса Российской Федерации, заявляю о согласии на безвозмездное использование АО «КАМА» моих фото- и видеоизображений.</p>
        <p>АО «КАМА» вправе обнародовать и использовать изображение в любой форме и любыми способами по своему усмотрению, включая, но не ограничиваясь, следующими:</p>
        <ul class="td-obligation-list">
          <li>доводить до всеобщего сведения таким образом, что любое лицо может получить доступ к нему из любого места и в любое время по собственному выбору;</li>
          <li>воспроизводить изображение, то есть изготавливать один и более экземпляр или его части в любой материальной форме (в том числе путем нанесения на рекламную, сувенирную и иную продукцию);</li>
          <li>распространять путем продажи или иного отчуждения его оригинала или экземпляров, представляющих собой копии на любом материальном носителе;</li>
          <li>осуществлять любое сообщение, содержащее изображение с помощью технических средств в месте, открытом для свободного посещения, или в месте, где присутствует значительное число лиц, не принадлежащих к обычному кругу семьи.</li>
        </ul>
        <p>Настоящим я даю свое согласие на использование изображения без указания имени (т.е. анонимно). При этом не возражаю против указания имени при использовании изображения в случаях, определенных по усмотрению АО «КАМА».</p>
        <p>АО «КАМА» вправе использовать изображение на территории РФ без получения какого-либо дополнительного согласия и без выплаты вознаграждения.</p>
        <p class="td-obligation-sign"><span data-o="fullName"></span> / _________________(подпись)</p>
      </section>
    </article>`;
  }

  function selectObligation() {
    $$('[data-doc-tab]').forEach(btn=>btn.setAttribute('aria-selected',String(btn.dataset.docTab===KIND)));
    $$('[data-doc-panel]').forEach(panel=>panel.hidden=panel.dataset.docPanel!==KIND);
  }
  function mountPreview() {
    if ($('[data-doc-panel="obligation"]')) return true;
    const tabs=$('.td-doc-tabs[role="tablist"]'); const stage=$('.td-doc-stage');
    if (!tabs || !stage) return false;
    const button=document.createElement('button'); button.type='button'; button.className='td-doc-tab'; button.dataset.docTab=KIND; button.setAttribute('role','tab'); button.setAttribute('aria-selected','false'); button.textContent=LABEL; button.addEventListener('click',selectObligation); tabs.appendChild(button);
    const panel=document.createElement('div'); panel.className='td-doc-panel'; panel.dataset.docPanel=KIND; panel.setAttribute('role','tabpanel'); panel.hidden=true; panel.innerHTML=markup(); stage.appendChild(panel); render(); return true;
  }

  function decodeBase64(s) {
    const clean=String(s||'').replace(/\s+/g,''); const binary=atob(clean); const bytes=new Uint8Array(binary.length);
    for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i); return bytes;
  }
  async function loadTemplate() {
    try {
      const res=await fetch('./templates/written_obligation_template.b64?v=20260911-1',{cache:'force-cache',credentials:'same-origin'});
      if (!res.ok) throw new Error('template');
      const bytes=decodeBase64(await res.text());
      state.templates.set(KIND,new File([bytes],TEMPLATE_FILE,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      const status=$('#templatesStatus'); if (status && !/письменное обязательство/i.test(status.textContent)) status.textContent=`${status.textContent.replace(/\.$/,'')} · письменное обязательство загружено.`;
      window.TestDriveDocs?.refresh?.();
    } catch (_) {
      const status=$('#templatesStatus'); if (status) { status.className='status warn'; status.textContent='Не удалось загрузить шаблон «Письменное обязательство». Обновите страницу.'; }
      window.TestDriveDocs?.refresh?.();
    }
  }

  function boot() {
    addBirthPlaceField();
    if (!mountPreview()) setTimeout(mountPreview,100);
    document.addEventListener('input',event=>{ if (event.target?.matches?.('[data-f]')) render(); },true);
    document.addEventListener('change',event=>{ if (event.target?.matches?.('[data-f]')) render(); },true);
    $('#clearBtn')?.addEventListener('click',()=>setTimeout(render,0));
    void loadTemplate();
    setTimeout(()=>{ addBirthPlaceField(); mountPreview(); render(); window.TestDriveDocs?.refresh?.(); },350);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();