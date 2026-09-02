(() => {
  const PROJECTS = [
    {
      id: "td-secure",
      type: "work",
      title: "TestDrive_Doc",
      category: "Документы / Security",
      status: "mvp",
      description: "Защищённый веб-MVP для подготовки комплекта документов из одной карточки клиента. Персональные данные и Word-шаблоны обрабатываются локально в браузере без облачной базы.",
      nextStep: "Открыть веб-версию, выбрать локальную папку templates из TestDrive_Doc и локальную папку хранения. Десктопную версию оставить резервной для локального OCR Windows и PDF.",
      url: "https://korytnikhub.pro/testdrive/",
      githubUrl: "",
      owner: "Иван Корытник",
      updated: "2026-09-02",
      color: "#303846",
      accent: "#aeb7c4"
    },
    {
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
    }
  ];

  function registerProjects() {
    if (typeof state === "undefined" || !Array.isArray(state.projects) || typeof saveProjects !== "function") return false;
    PROJECTS.forEach(projectData => {
      const index = state.projects.findIndex(project => project.id === projectData.id);
      const normalized = typeof normalizeProject === "function" ? normalizeProject(projectData) : projectData;
      if (index >= 0) state.projects[index] = { ...state.projects[index], ...normalized };
      else state.projects.push(normalized);
    });
    saveProjects();
    if (typeof render === "function") render();
    return true;
  }

  function boot() {
    if (document.documentElement.classList.contains("hub-sync-ready")) {
      registerProjects();
      return;
    }
    const observer = new MutationObserver(() => {
      if (document.documentElement.classList.contains("hub-sync-ready")) {
        observer.disconnect();
        registerProjects();
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      observer.disconnect();
      registerProjects();
    }, 8000);
  }

  boot();
})();
