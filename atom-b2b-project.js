(() => {
  const PROJECT = {
    id: "atom-b2b-activities",
    type: "business",
    title: "B2B Агент",
    category: "B2B / Sales Automation",
    status: "live",
    description: "Автономный B2B-контур: ручной поиск клиентов, ЛПР и мероприятий; постоянная CRM-база; Gmail; Calendar; Drive; follow-up; КП и презентации; автоматическое движение карточек после появления лида.",
    nextStep: "Перевести интерфейс CRM с localStorage на защищённую Supabase-базу и связать ручные поиски напрямую с карточками B2B Агента.",
    url: "https://korytnikhub.pro/atom-b2b/agent.html",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/atom-b2b",
    owner: "Иван Корытник",
    updated: "2026-09-08",
    color: "#15171a",
    accent: "#d7ff00"
  };

  function registerProject() {
    if (typeof state === "undefined" || !Array.isArray(state.projects) || typeof saveProjects !== "function") return false;
    const index = state.projects.findIndex(project => project.id === PROJECT.id);
    const normalized = typeof normalizeProject === "function" ? normalizeProject(PROJECT) : PROJECT;
    if (index >= 0) state.projects[index] = { ...state.projects[index], ...normalized };
    else state.projects.unshift(normalized);
    saveProjects();
    if (typeof render === "function") render();
    return true;
  }

  function boot() {
    if (document.documentElement.classList.contains("hub-sync-ready")) {
      registerProject();
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains("hub-sync-ready")) {
        observer.disconnect();
        registerProject();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      observer.disconnect();
      registerProject();
    }, 4000);
  }

  boot();
})();
