(() => {
  const projects = [
    {
      id: "file-optimizer",
      type: "personal",
      title: "Оптимизация файлов",
      category: "Utility / Files",
      status: "mvp",
      description: "Локальная оптимизация изображений, видео, аудио, PDF, Office, ZIP и других файлов прямо в браузере без загрузки исходников на сервер.",
      nextStep: "Протестировать качество и скорость сжатия на реальных фото, документах, видео и аудио.",
      url: "https://korytnikhub.pro/optimizer/",
      githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/optimizer",
      owner: "Иван Корытник",
      updated: "2026-09-02",
      color: "#175cd3",
      accent: "#8ab4f8"
    }
  ];

  function normalize(item) {
    return typeof normalizeProject === "function" ? normalizeProject(item) : item;
  }

  function ensureCatalog() {
    try {
      if (!Array.isArray(initialProjects)) return;
      projects.slice().reverse().forEach(project => {
        if (!initialProjects.some(item => item.id === project.id)) {
          initialProjects.unshift(project);
        }
      });
    } catch (error) {
      console.error("KORYTNIK HUB catalog bootstrap failed:", error);
    }
  }

  function ensureState() {
    try {
      if (!state || !Array.isArray(state.projects)) return;
      let changed = false;
      projects.slice().reverse().forEach(project => {
        if (!state.projects.some(item => item.id === project.id)) {
          state.projects.unshift(normalize(project));
          changed = true;
        }
      });
      if (changed) {
        if (typeof saveProjects === "function") saveProjects();
        if (typeof render === "function") render();
      }
    } catch (error) {
      console.error("KORYTNIK HUB cards bootstrap failed:", error);
    }
  }

  ensureCatalog();
  ensureState();

  const root = document.documentElement;
  if (root.classList.contains("hub-sync-ready")) {
    ensureState();
  } else {
    const observer = new MutationObserver(() => {
      if (!root.classList.contains("hub-sync-ready")) return;
      observer.disconnect();
      ensureState();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  }
})();
