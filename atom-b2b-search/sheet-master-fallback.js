(function(){
'use strict';
const NAMES=['ПАО «Россети»','Ростелеком','МТС','МегаФон','билайн / ПАО «ВымпелКом»','T2','Россети Московский регион','Интер РАО','Т Плюс','РусГидро','Газпром нефть','Эн+','X5 Group','Магнит','Лемана ПРО','Ozon','ВкусВилл','Лента','М.Видео-Эльдорадо','ПИК','ГК «Самолет»','ГК ФСК','Донстрой','Sminex','ГК А101','Пулково / ООО «Воздушные Ворота Северной Столицы»','Внуково','РЖД','ВТБ','Альфа-Банк','Россельхозбанк','ДОМ.РФ','Московская биржа','Сбер','Ингосстрах','VK','Авито','BIOCAD','Биннофарм Групп','Р-Фарм','Фармстандарт','ПРОМОМЕД','Генериум','Северсталь','Уралкалий','Уралхим','ЦЕМРОС','АЛРОСА','ММК','Росатом'];
const norm=v=>String(v||'').toLowerCase().replace(/ё/g,'е').replace(/[«»"'()\\/\-–—]/g,' ').replace(/\b(пао|ао|ооо|гк|группа|компания)\b/g,' ').replace(/\s+/g,' ').trim();
function apply(){
 if(typeof state==='undefined'||!Array.isArray(state.custom)||typeof allCompanies!=='function')return;
 const current=allCompanies();const seen=new Set(current.map(c=>norm(c.name)));
 let changed=false;
 NAMES.forEach(name=>{const key=norm(name);if(seen.has(key))return;seen.add(key);state.custom.push({name,sector:'Требует классификации',region:'—',fleetMin:0,fleetMax:0,atomMin:0,atomMax:0,score:0,use:'Требуется уточнить сценарий корпоративного использования',why:'Компания присутствует в Google Таблице TOP-50.',pilot:'Параметры пилота требуют уточнения.',next:'Проверить ЛПР, парк и сценарий использования.',sheetMaster:true,custom:true,source:'Google Таблица TOP-50'});changed=true;});
 if(changed&&typeof saveState==='function')saveState();
 window.__atomSheetMasterReady=true;
 window.__atomSheetCompanies=NAMES.map(name=>allCompanies().find(c=>norm(c.name)===norm(name))).filter(Boolean);
 if(typeof initFilters==='function')initFilters();
 if(typeof renderDashboard==='function')renderDashboard();
 if(typeof renderSearch==='function')renderSearch();
 if(typeof renderSaved==='function')renderSaved();
 const k=document.getElementById('kpiCompanies');if(k)k.textContent='50';
 const s=document.getElementById('systemCompanies');if(s)s.textContent='50 компаний';
}
apply();
})();