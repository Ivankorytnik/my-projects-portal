(() => {
  const project = {
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
  };

  try {
    if (Array.isArray(initialProjects) && !initialProjects.some(item => item.id === project.id)) {
      initialProjects.unshift(project);
    }

    if (state && Array.isArray(state.projects) && !state.projects.some(item => item.id === project.id)) {
      state.projects.unshift(typeof normalizeProject === "function" ? normalizeProject(project) : project);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
    }
  } catch (error) {
    console.error("File Optimizer card bootstrap failed:", error);
  }
})();
