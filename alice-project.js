(() => {
  const PROJECT = {
    id: "alice-ai",
    type: "personal",
    title: "Алиса AI",
    category: "AI / Voice Assistant",
    status: "mvp",
    description: "Голосовой персональный AI-ассистент через Яндекс Алису: голос → навык → Supabase Edge Function → OpenAI → голосовой ответ.",
    nextStep: "Создать навык «Иван AI» в Яндекс Диалогах и подключить Supabase webhook alice-chatgpt.",
    url: "https://korytnikhub.pro/alice/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal/tree/main/alice",
    owner: "Иван Корытник",
    updated: "2026-09-03",
    color: "#6f2cff",
    accent: "#c4a7ff"
  };

  function registerProject() {
    if (typeof state === "undefined" || !Array.isArray(state.projects) || typeof saveProjects !== "function") return false;
    const index = state.projects.findIndex(project => project.id === PROJECT.id);
    const normalized = typeof normalizeProject === "function" ? normalizeProject(PROJECT) : PROJECT;
    if (index >= 0) state.projects[index] = { ...state.projects[index], ...normalized };
    else state.projects.unshift(normalized);
    saveProjects();
    if (typeof render === "function") render();
    return true;
  }

  function boot() {
    if (document.documentElement.classList.contains("hub-sync-ready")) {
      registerProject();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.documentElement.classList.contains("hub-sync-ready")) return;
      observer.disconnect();
      registerProject();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      observer.disconnect();
      registerProject();
    }, 8000);
  }

  boot();
})();
