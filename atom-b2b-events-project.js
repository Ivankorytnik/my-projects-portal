(() => {
  const PROJECT = {
    id: "atom-b2b-events",
    type: "work",
    title: "АТОМ B2B | Календарь активностей",
    category: "B2B / Мероприятия",
    status: "live",
    description: "Автоматический поиск отраслевых мероприятий, форумов и конференций, подходящих для участия АТОМ. Скоринг 0–100, приоритеты, рекомендации, контроль этапов и синхронизация с Google Sheets.",
    nextStep: "Поддерживать автоматический поиск и актуальность списка мероприятий, использовать скоринг для выбора приоритетных активностей.",
    url: "https://korytnikhub.pro/atom-b2b/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/atom-b2b",
    owner: "Иван Корытник",
    updated: "2026-09-10",
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
