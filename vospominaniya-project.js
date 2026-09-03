(() => {
  const PROJECT = {
    id: "vospominaniya",
    type: "personal",
    title: "Воспоминания",
    category: "Семейный архив / AI",
    status: "live",
    description: "Семейные воспоминания Ивана Корытника: главы, аудио, расшифровка и подготовка текста для книги для внуков.",
    nextStep: "Перенести сам интерфейс и данные с chatgpt.site внутрь KORYTNIK HUB, сохранив главы и аудио.",
    url: "https://korytnikhub.pro/vospominaniya/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/vospominaniya",
    owner: "Иван Корытник",
    updated: "2026-09-03",
    color: "#172033",
    accent: "#d99a19"
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
