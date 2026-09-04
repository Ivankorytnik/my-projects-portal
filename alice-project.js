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

  function isDeleted() {
    try {
      if (window.HubDeletedProjects?.getDeletedIds) {
        return window.HubDeletedProjects.getDeletedIds().has(PROJECT.id);
      }
      const deleted = JSON.parse(localStorage.getItem("ivan-projects-portal-deleted-v1") || "[]");
      return Array.isArray(deleted) && deleted.includes(PROJECT.id);
    } catch {
      return false;
    }
  }

  function registerProject() {
    if (typeof state === "undefined" || !Array.isArray(state.projects) || typeof saveProjects !== "function") return false;

    const index = state.projects.findIndex(project => project.id === PROJECT.id);

    // Облачный/локальный список HUB является источником истины.
    // Если карточка удалена или ее уже нет в списке, этот файл не должен создавать ее заново.
    if (isDeleted() || index < 0) return true;

    const normalized = typeof normalizeProject === "function" ? normalizeProject(PROJECT) : PROJECT;
    state.projects[index] = { ...state.projects[index], ...normalized };
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
