(() => {
  const project = {
    id: "atom-commercial-analytics",
    type: "work",
    title: "АТОМ",
    category: "Работа / Коммерческая аналитика",
    status: "active",
    description: "Контроль готовности проекта коммерческой аналитики: этапы, Гант, источники данных, RACI, Data Dictionary, блокеры и Definition of Done.",
    nextStep: "Вести проект до запуска и приемки единого рабочего сквозного дашборда.",
    url: "https://ivankorytnik.github.io/commercial-analytics/",
    githubUrl: "https://github.com/Ivankorytnik/commercial-analytics",
    owner: "Иван Корытник",
    updated: "2026-09-10",
    color: "#102526",
    accent: "#35d8c7"
  };

  function addProject() {
    try {
      if (typeof initialProjects !== "undefined" && Array.isArray(initialProjects) && !initialProjects.some(item => item.id === project.id)) {
        initialProjects.unshift(project);
      }
      if (typeof state === "undefined" || !state || !Array.isArray(state.projects)) return;
      const index = state.projects.findIndex(item => item.id === project.id);
      const normalized = typeof normalizeProject === "function" ? normalizeProject(project) : project;
      if (index >= 0) state.projects[index] = { ...state.projects[index], ...normalized };
      else state.projects.unshift(normalized);
      if (typeof saveProjects === "function") saveProjects();
      else if (typeof STORAGE_KEY !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
      if (typeof render === "function") render();
    } catch (error) {
      console.error("ATOM analytics project bootstrap failed:", error);
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
    setTimeout(() => {
      observer.disconnect();
      addProject();
    }, 4000);
  }
})();
