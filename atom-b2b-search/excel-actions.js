(function(){
 const btn=document.getElementById('downloadExcelButton');
 if(!btn)return;
 btn.addEventListener('click',()=>{
   try{
     if(typeof XLSX==='undefined')throw new Error('XLSX library unavailable');
     const data=typeof allCompanies==='function'?allCompanies():[];
     const rows=data.map((c,i)=>{
       const l=typeof getCompanyLpr==='function'?getCompanyLpr(c):{lpr:c.lpr||c.lprName||'',role:c.lprRole||c.role||'',grade:c.lprGrade||''};
       return {
       '№':i+1,
       'Компания':c.name||'',
       'ЛПР':l.lpr||'',
       'Должность ЛПР':l.role||'',
       'Достоверность ЛПР':l.grade||'',
       'Отрасль':c.sector||'',
       'Регион':c.region||'',
       'Парк min, шт.':Number(c.fleetMin)||0,
       'Парк max, шт.':Number(c.fleetMax)||0,
       'ATOM min 12–24м, шт.':Number(c.atomMin)||0,
       'ATOM max 12–24м, шт.':Number(c.atomMax)||0,
       'Скоринг 0–100':Number(c.score)||0,
       'Сценарий':c.use||'',
       'Почему подходит':c.why||'',
       'Предложение пилота':c.pilot||'',
       'Следующий шаг':c.next||'',
       'Источник':c.source||'',
       'Добавлено':c.addedAt||''
     }});
     const ws=XLSX.utils.json_to_sheet(rows);
     ws['!cols']=[{wch:6},{wch:30},{wch:26},{wch:34},{wch:16},{wch:20},{wch:22},{wch:14},{wch:14},{wch:20},{wch:20},{wch:14},{wch:42},{wch:48},{wch:48},{wch:48},{wch:34},{wch:20}];
     const wb=XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb,ws,'Компании');
     const date=new Date();
     const pad=n=>String(n).padStart(2,'0');
     const filename=`ATOM_B2B_companies_${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}.xlsx`;
     XLSX.writeFile(wb,filename,{compression:true});
   }catch(e){
     console.error(e);
     alert('Не удалось сформировать Excel. Попробуйте обновить страницу.');
   }
 });
})();
