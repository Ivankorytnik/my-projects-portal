(() => {
  const STORAGE_KEY = "ivan-projects-portal-v1";
  const DELETED_KEY = "ivan-projects-portal-deleted-v1";

  function getDeletedIds() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveDeletedIds(ids) {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
  }

  function removeDeletedFromState() {
    if (!window.state || !Array.isArray(state.projects)) return;
    const deleted = getDeletedIds();
    if (!deleted.size) return;
    const filtered = state.projects.filter(project => !deleted.has(project.id));
    if (filtered.length === state.projects.length) return;
    state.projects = filtered;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (typeof render === "function") render();
  }

  function rememberDeletion(projectId) {
    if (!projectId) return;
    const deleted = getDeletedIds();
    deleted.add(projectId);
    saveDeletedIds(deleted);
  }

  function syncDeletedIdsFromCloud(remoteProjects) {
    if (!Array.isArray(remoteProjects) || !window.initialProjects) return;
    const remoteIds = new Set(remoteProjects.map(project => project.id));
    const deleted = getDeletedIds();
    initialProjects.forEach(project => {
      if (!remoteIds.has(project.id)) deleted.add(project.id);
    });
    saveDeletedIds(deleted);
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action='delete']");
    if (!button) return;
    rememberDeletion(button.dataset.id);
  }, true);

  window.HubDeletedProjects = {
    getDeletedIds,
    rememberDeletion,
    removeDeletedFromState,
    syncDeletedIdsFromCloud
  };

  removeDeletedFromState();
})();
