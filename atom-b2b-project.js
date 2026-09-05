(() => {
  const PROJECT = {
    id: "atom-b2b-activities",
    type: "work",
    title: "АТОМ — B2B активности",
    category: "B2B / Automotive",
    status: "active",
    description: "Рабочий календарь отраслевых выставок, форумов и деловых площадок в России для развития корпоративных продаж автомобиля АТОМ.",
    nextStep: "Отработать мероприятия приоритета A: партнерство, экспозиция автомобиля, встречи с ЛПР и пилотные B2B-сценарии.",
    url: "https://docs.google.com/spreadsheets/d/1Y-50RQGjUb7sQkJpLLx46MEUfQoAANYEEdyUW1RoA3U/edit",
    githubUrl: "",
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
