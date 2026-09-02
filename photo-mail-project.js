(() => {
  const PROJECT = {
    id: "photo-mail",
    type: "personal",
    title: "Фото на почту",
    category: "Android / Utility",
    status: "mvp",
    description: "Android-приложение: сделал фотографию, и она автоматически отправилась на выбранный сохраненный email.",
    nextStep: "Проверить APK на основном телефоне и при необходимости добавить Outlook/SMTP 587.",
    url: "https://korytnikhub.pro/photo-mail/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/photo-mail",
    owner: "Иван Корытник",
    updated: "2026-09-02",
    color: "#15181e",
    accent: "#1677ff"
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
