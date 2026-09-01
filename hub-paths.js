(() => {
  const managedUrls = {
    sound: "https://korytnikhub.pro/sound/",
    "fishing-day": "https://korytnikhub.pro/fishing/",
    calculator: "https://korytnikhub.pro/calculator/",
    "kp-auto": "https://korytnikhub.pro/auto/"
  };

  try {
    if (Array.isArray(initialProjects)) {
      initialProjects.forEach(project => {
        if (managedUrls[project.id]) project.url = managedUrls[project.id];
      });
    }

    if (state && Array.isArray(state.projects)) {
      state.projects = state.projects.map(project =>
        managedUrls[project.id] ? { ...project, url: managedUrls[project.id] } : project
      );
      if (typeof saveProjects === "function") saveProjects();
      if (typeof render === "function") render();
    }
  } catch (error) {
    console.error("KORYTNIK HUB path migration failed:", error);
  }
})();
