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

  function removeDeletedFromProjects(projects) {
    const deleted = getDeletedIds();
    if (!Array.isArray(projects) || !deleted.size) return Array.isArray(projects) ? projects : [];
    return projects.filter(project => !deleted.has(project.id));
  }

  function removeDeletedFromState() {
    if (typeof state === "undefined" || !Array.isArray(state.projects)) return;
    const filtered = removeDeletedFromProjects(state.projects);
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
    // Deletions are tombstones. A stale cloud snapshot must never resurrect
    // a project that was explicitly deleted in this browser.
    if (!Array.isArray(remoteProjects)) return;
  }

  document.addEventListener("click", event => {
    const button = event.target.closest("button[data-action='delete']");
    if (!button) return;
    const projectId = button.dataset.id;
    setTimeout(() => {
      if (typeof state === "undefined" || !Array.isArray(state.projects)) return;
      const stillExists = state.projects.some(project => project.id === projectId);
      if (!stillExists) rememberDeletion(projectId);
    }, 0);
  }, true);

  window.HubDeletedProjects = {
    getDeletedIds,
    rememberDeletion,
    removeDeletedFromProjects,
    removeDeletedFromState,
    syncDeletedIdsFromCloud
  };

  removeDeletedFromState();
})();
