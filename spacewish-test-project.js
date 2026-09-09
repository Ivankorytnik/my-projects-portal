(() => {
  const project = {
    id: "spacewish-test",
    type: "personal",
    title: "SpaceWish Test",
    category: "Личный / Space / Test",
    status: "mvp",
    description: "Отдельный автономный тестовый стенд проекта «Желание сквозь Вселенную», полностью отделённый от PROD.",
    nextStep: "Использовать для доработок и проверки изменений перед переносом подтверждённой версии в PROD.",
    url: "https://ivankorytnik.github.io/SpaceWish-Test/",
    githubUrl: "https://github.com/Ivankorytnik/SpaceWish-Test",
    owner: "Иван Корытник",
    updated: "2026-09-09",
    color: "#07101c",
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
      console.error("SpaceWish Test card bootstrap failed:", error);
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
