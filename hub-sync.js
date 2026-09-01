(() => {
  const SYNC_URL = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/hub-projects-sync";
  let cloudReady = false;
  let saveTimer = null;
  let draggingId = null;

  async function cloudGet() {
    const r = await fetch(SYNC_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`Cloud ${r.status}`);
    return await r.json();
  }

  async function cloudSave() {
    if (!cloudReady) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await fetch(SYNC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projects: state.projects })
        });
      } catch (e) {
        console.error("HUB cloud save failed", e);
      }
    }, 250);
  }

  getFilteredProjects = function() {
    const query = state.search.trim().toLowerCase();
    return state.projects
      .filter(project => state.viewFilter === "all" || project.type === state.viewFilter)
      .filter(project => state.statusFilter === "all" || project.status === state.statusFilter)
      .filter(project => state.categoryFilter === "all" || project.category === state.categoryFilter)
      .filter(project => {
        if (!query) return true;
        return [project.title, project.category, project.description, project.nextStep, project.owner]
          .some(value => String(value || "").toLowerCase().includes(query));
      });
  };

  const originalSaveProjects = saveProjects;
  saveProjects = function() {
    originalSaveProjects();
    cloudSave();
  };

  function moveByOffset(projectId, offset) {
    const index = state.projects.findIndex(p => p.id === projectId);
    const next = index + offset;
    if (index < 0 || next < 0 || next >= state.projects.length) return;
    const [item] = state.projects.splice(index, 1);
    state.projects.splice(next, 0, item);
    saveProjects();
    renderProjects();
  }

  function addDragAttributes() {
    document.querySelectorAll(".project-card").forEach(card => {
      const edit = card.querySelector("button[data-action='edit']");
      if (!edit) return;
      card.dataset.projectId = edit.dataset.id;
      card.draggable = true;

      if (!card.querySelector(".drag-hint")) {
        const hint = document.createElement("div");
        hint.className = "drag-hint";
        hint.textContent = "↕ Перетащить";
        card.prepend(hint);
      }

      if (!card.querySelector(".mobile-order-controls")) {
        const controls = document.createElement("div");
        controls.className = "mobile-order-controls";
        controls.innerHTML = `
          <button type="button" data-move="up" aria-label="Переместить проект выше">↑</button>
          <button type="button" data-move="down" aria-label="Переместить проект ниже">↓</button>`;
        card.prepend(controls);
      }
    });
  }

  const originalRenderProjects = renderProjects;
  renderProjects = function() {
    originalRenderProjects();
    addDragAttributes();
  };

  function moveBefore(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const sourceIndex = state.projects.findIndex(p => p.id === sourceId);
    const targetIndex = state.projects.findIndex(p => p.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [item] = state.projects.splice(sourceIndex, 1);
    const newTargetIndex = state.projects.findIndex(p => p.id === targetId);
    state.projects.splice(newTargetIndex, 0, item);
    saveProjects();
    renderProjects();
  }

  elements.projectsGrid.addEventListener("click", e => {
    const button = e.target.closest("button[data-move]");
    if (!button) return;
    const card = button.closest(".project-card[data-project-id]");
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    moveByOffset(card.dataset.projectId, button.dataset.move === "up" ? -1 : 1);
  });

  elements.projectsGrid.addEventListener("dragstart", e => {
    const card = e.target.closest(".project-card[data-project-id]");
    if (!card) return;
    draggingId = card.dataset.projectId;
    card.classList.add("dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggingId);
    }
  });

  elements.projectsGrid.addEventListener("dragend", e => {
    e.target.closest(".project-card")?.classList.remove("dragging");
    elements.projectsGrid.querySelectorAll(".drag-over").forEach(x => x.classList.remove("drag-over"));
    draggingId = null;
  });

  elements.projectsGrid.addEventListener("dragover", e => {
    const card = e.target.closest(".project-card[data-project-id]");
    if (!card || !draggingId || card.dataset.projectId === draggingId) return;
    e.preventDefault();
    elements.projectsGrid.querySelectorAll(".drag-over").forEach(x => x.classList.remove("drag-over"));
    card.classList.add("drag-over");
  });

  elements.projectsGrid.addEventListener("drop", e => {
    const card = e.target.closest(".project-card[data-project-id]");
    if (!card || !draggingId) return;
    e.preventDefault();
    moveBefore(draggingId, card.dataset.projectId);
  });

  async function bootstrap() {
    try {
      const remote = await cloudGet();
      if (remote?.ok && Array.isArray(remote.projects)) {
        state.projects = remote.projects.map(normalizeProject);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
      } else {
        cloudReady = true;
        await fetch(SYNC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projects: state.projects })
        });
      }
      cloudReady = true;
      render();
      addDragAttributes();
    } catch (e) {
      console.error("HUB cloud bootstrap failed", e);
      cloudReady = true;
      addDragAttributes();
    }
  }

  bootstrap();
})();
