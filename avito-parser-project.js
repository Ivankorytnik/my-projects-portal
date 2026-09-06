(() => {
  const project = {
    id: "avito-parser",
    type: "personal",
    title: "Парсер Avito",
    category: "Data / Parser",
    status: "mvp",
    description: "Веб-сервис в Korytnik Hub для сбора доступных объявлений Avito по ссылке, хранения истории запусков и выгрузки результатов в CSV.",
    nextStep: "Проверить работу на страницах Конаково и при необходимости добавить оценку ценности объявлений.",
    url: "https://korytnikhub.pro/avito-parser/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/avito-parser",
    owner: "Иван Корытник",
    updated: "2026-09-06",
    color: "#0f172a",
    accent: "#2563eb"
  };

  function addProject() {
    try {
      if (Array.isArray(initialProjects) && !initialProjects.some(item => item.id === project.id)) initialProjects.unshift(project);
      if (!state || !Array.isArray(state.projects)) return;
      if (state.projects.some(item => item.id === project.id)) return;
      state.projects.unshift(typeof normalizeProject === "function" ? normalizeProject(project) : project);
      if (typeof saveProjects === "function") saveProjects();
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
      if (typeof render === "function") render();
    } catch (error) {
      console.error("Avito Parser card bootstrap failed:", error);
    }
  }

  addProject();
  const root = document.documentElement;
  if (root.classList.contains("hub-sync-ready")) addProject();
  else {
    const observer = new MutationObserver(() => {
      if (!root.classList.contains("hub-sync-ready")) return;
      observer.disconnect();
      addProject();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  }
})();