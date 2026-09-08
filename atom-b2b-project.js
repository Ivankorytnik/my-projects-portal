(() => {
  const PROJECT = {
    id: "atom-b2b-activities",
    type: "work",
    title: "B2B Агент",
    category: "B2B / Sales Automation",
    status: "active",
    description: "Единый B2B-агент: поиск клиентов и ЛПР, CRM-воронка, письма и follow-up, КП и презентации, а также поиск и ведение мероприятий от согласования до участия или отказа.",
    nextStep: "Подключить серверную базу, Gmail/Calendar и автоматические сценарии поиска, квалификации, рассылок и обновления CRM.",
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
    else state.projects.push(normalized);
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
    }, 8000);
  }

  boot();
})();
