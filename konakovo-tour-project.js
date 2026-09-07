(() => {
  const project = {
    id: "konakovo-tour",
    type: "personal",
    title: "Туристическое бюро — Конаково",
    category: "Travel / Local Tourism",
    status: "mvp",
    description: "Личный проект однодневного туристического маршрута по Конаково: Волга, фаянс, набережная, сосновый бор, питание и логистика из Москвы.",
    nextStep: "Доработать коммерческую версию: цена тура, бронирование, подтвержденные партнеры и расписание под конкретные даты.",
    url: "https://korytnikhub.pro/konakovo-tour/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/konakovo-tour",
    owner: "Иван Корытник",
    updated: "2026-09-07",
    color: "#1f6e63",
    accent: "#c86f45"
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
      console.error("Konakovo Tour card bootstrap failed:", error);
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