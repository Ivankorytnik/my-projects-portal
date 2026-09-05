(() => {
  const PROJECT = {
    id: "atom-b2b-company-search",
    type: "work",
    title: "АТОМ — поиск B2B компаний",
    category: "B2B / Automotive",
    status: "mvp",
    description: "Сервис поиска и скоринга компаний, которым потенциально подходит АТОМ для собственного корпоративного использования. Такси и каршеринг исключены.",
    nextStep: "Расширить базу до TOP-200, углубить ЛПР Fleet/Transport/Admin и добавить регулярное обновление prospecting-базы.",
    url: "https://korytnikhub.pro/atom-b2b-search/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/atom-b2b-search",
    owner: "Иван Корытник",
    updated: "2026-09-05",
    color: "#15171a",
    accent: "#d7ff00"
  };
  function registerProject(){
    if(typeof state==="undefined"||!Array.isArray(state.projects)||typeof saveProjects!=="function")return false;
    const index=state.projects.findIndex(project=>project.id===PROJECT.id);
    const normalized=typeof normalizeProject==="function"?normalizeProject(PROJECT):PROJECT;
    if(index>=0)state.projects[index]={...state.projects[index],...normalized};else state.projects.push(normalized);
    saveProjects();if(typeof render==="function")render();return true;
  }
  function boot(){
    if(document.documentElement.classList.contains("hub-sync-ready")){registerProject();return;}
    const observer=new MutationObserver(()=>{if(document.documentElement.classList.contains("hub-sync-ready")){observer.disconnect();registerProject();}});
    observer.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
    setTimeout(()=>{observer.disconnect();registerProject();},8000);
  }
  boot();
})();
