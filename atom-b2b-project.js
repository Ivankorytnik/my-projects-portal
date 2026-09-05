(() => {
  const PROJECT = {
    id: "atom-b2b-activities",
    type: "work",
    title: "АТОМ — B2B активности",
    category: "B2B / Automotive",
    status: "active",
    description: "Рабочий сервис для управления B2B-активностями АТОМ: выставки, форумы, приоритеты, рекомендации, напоминания и следующие действия.",
    nextStep: "Отработать мероприятия приоритета A: партнерство, экспозиция автомобиля, встречи с ЛПР и пилотные B2B-сценарии.",
    url: "https://korytnikhub.pro/atom-b2b/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/atom-b2b",
    owner: "Иван Корытник",
    updated: "2026-09-05",
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
