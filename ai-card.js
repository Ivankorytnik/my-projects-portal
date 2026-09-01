(() => {
  const project = {
    id: "korytnik-ai",
    type: "personal",
    title: "KORYTNIK AI",
    category: "AI / Voice",
    status: "mvp",
    description: "Персональный голосовой помощник: разговор через микрофон, голосовые ответы и текстовая история диалога.",
    nextStep: "Подключить постоянную память и действия с проектами, файлами, почтой и календарем.",
    url: "https://korytnikhub.pro/ai/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/ai",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#111827",
    accent: "#78a8ff"
  };

  try {
    if (Array.isArray(initialProjects) && !initialProjects.some(item => item.id === project.id)) {
      initialProjects.unshift(project);
    }

    if (state && Array.isArray(state.projects) && !state.projects.some(item => item.id === project.id)) {
      state.projects.unshift(typeof normalizeProject === "function" ? normalizeProject(project) : project);
      if (typeof saveProjects === "function") saveProjects();
      if (typeof render === "function") render();
    }
  } catch (error) {
    console.error("KORYTNIK AI card bootstrap failed:", error);
  }
})();
