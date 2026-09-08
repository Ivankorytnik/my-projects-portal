(() => {
  const project = {
    id: "spacewish-test",
    type: "personal",
    title: "Space Wish — тест",
    category: "Личный / Space",
    status: "mvp",
    description: "Личная тестовая версия проекта Space Wish на отдельном домене.",
    nextStep: "Использовать тестовую версию для доработок и проверки перед публикацией изменений.",
    url: "http://spacewish.agency/test/",
    githubUrl: "https://github.com/Ivankorytnik/Jelanie",
    owner: "Иван Корытник",
    updated: "2026-09-08",
    color: "#242b52",
    accent: "#68e7ff"
  };

  function addProject() {
    try {
      if (Array.isArray(initialProjects) && !initialProjects.some(item => item.id === project.id)) initialProjects.unshift(project);
      if (!state || !Array.isArray(state.projects)) return;
      const index = state.projects.findIndex(item => item.id === project.id);
      if (index >= 0) {
        state.projects[index] = typeof normalizeProject === "function" ? normalizeProject({ ...state.projects[index], ...project }) : { ...state.projects[index], ...project };
      } else {
        state.projects.unshift(typeof normalizeProject === "function" ? normalizeProject(project) : project);
      }
      if (typeof saveProjects === "function") saveProjects();
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
      if (typeof render === "function") render();
    } catch (error) {
      console.error("Space Wish test card bootstrap failed:", error);
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
