(() => {
  const PROJECT = {
    id: "td-secure",
    type: "work",
    title: "Secure TD Docs",
    category: "Документы / Security",
    status: "mvp",
    description: "Защищённый MVP для подготовки и печати комплекта документов из одной карточки клиента без облачного хранения персональных данных.",
    nextStep: "Рабочую версию использовать только локально; публичную страницу оставить без ПДн и шаблонов.",
    url: "https://korytnikhub.pro/td-secure/",
    githubUrl: "",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#303846",
    accent: "#aeb7c4"
  };

  function registerProject() {
    if (typeof state === "undefined" || !Array.isArray(state.projects) || typeof saveProjects !== "function") return false;
    if (state.projects.some(project => project.id === PROJECT.id)) return true;
    state.projects.push(typeof normalizeProject === "function" ? normalizeProject(PROJECT) : PROJECT);
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
