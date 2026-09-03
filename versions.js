(() => {
  const VERSION_STORAGE_KEY = "ivan-projects-versions-v1";
  const DEFAULT_VERSION = "v1.0.0";

  const KNOWN_VERSIONS = {
    "personal-site": "v1.0.0",
    "jelanie": "v2.1",
    "calculator": "v1.0.0",
    "fishing-day": "35",
    "sound": "v1.6.0",
    "kp-auto": "v4.4",
    "projects-portal": "v1.7.0",
    "atom-lead-hub": "v1.0.0",
    "cross-analytics": "v1.0.0",
    "b2b-company-registry": "v1.0.0",
    "atom-business-telegram": "v1.0.0",
    "file-optimizer": "v0.1",
    "td-secure": "v0.3.9",
    "photo-mail": "v1.0.2",
    "alice-ai": "v0.1.0"
  };

  function readVersionStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(VERSION_STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  let versionStore = readVersionStore();

  function cleanVersion(value) {
    const version = String(value || "").trim();
    return version || DEFAULT_VERSION;
  }

  function resolveVersion(project) {
    if (!project) return DEFAULT_VERSION;
    const id = String(project.id || "");
    return cleanVersion(project.version || versionStore[id] || KNOWN_VERSIONS[id] || DEFAULT_VERSION);
  }

  function writeVersionStore() {
    localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versionStore));
  }

  function setProjectVersion(id, value) {
    if (!id) return;
    versionStore[id] = cleanVersion(value);
    writeVersionStore();
  }

  function syncVersionsFromState() {
    if (typeof state === "undefined" || !Array.isArray(state.projects)) return;
    state.projects.forEach(project => {
      const version = resolveVersion(project);
      project.version = version;
      versionStore[project.id] = version;
    });
    writeVersionStore();
  }

  if (typeof normalizeProject === "function") {
    const originalNormalizeProject = normalizeProject;
    normalizeProject = function(project) {
      const normalized = originalNormalizeProject(project);
      normalized.version = resolveVersion({ ...project, id: normalized.id });
      return normalized;
    };
  }

  if (typeof saveProjects === "function") {
    const originalSaveProjects = saveProjects;
    saveProjects = function() {
      syncVersionsFromState();
      return originalSaveProjects();
    };
  }

  function addVersionToCards() {
    if (typeof state === "undefined" || !Array.isArray(state.projects)) return;
    document.querySelectorAll(".project-card[data-project-id]").forEach(card => {
      const id = card.dataset.projectId;
      const project = state.projects.find(item => item.id === id);
      if (!project) return;
      const version = resolveVersion(project);
      project.version = version;
      const meta = card.querySelector(".card-meta");
      if (!meta) return;
      let versionNode = meta.querySelector(".project-version-meta");
      if (!versionNode) {
        versionNode = document.createElement("span");
        versionNode.className = "project-version-meta";
        meta.prepend(versionNode);
      }
      versionNode.textContent = `Версия: ${version}`;
    });
  }

  if (typeof renderProjects === "function") {
    const originalRenderProjects = renderProjects;
    renderProjects = function() {
      originalRenderProjects();
      addVersionToCards();
    };
  }

  function ensureVersionField() {
    const formGrid = document.querySelector("#projectForm .form-grid");
    const statusField = document.getElementById("projectStatus")?.closest(".field");
    if (!formGrid || document.getElementById("projectVersion")) return;

    const label = document.createElement("label");
    label.className = "field";
    label.innerHTML = '<span>Версия</span><input id="projectVersion" type="text" maxlength="24" value="v1.0.0" placeholder="v1.0.0" autocomplete="off" />';
    if (statusField) statusField.insertAdjacentElement("afterend", label);
    else formGrid.appendChild(label);
  }

  ensureVersionField();

  if (typeof openProjectDialog === "function") {
    const originalOpenProjectDialog = openProjectDialog;
    openProjectDialog = function(project = null) {
      originalOpenProjectDialog(project);
      ensureVersionField();
      const input = document.getElementById("projectVersion");
      if (input) input.value = project ? resolveVersion(project) : DEFAULT_VERSION;
    };
  }

  const projectForm = document.getElementById("projectForm");
  if (projectForm) {
    let submitSnapshot = null;

    projectForm.addEventListener("submit", () => {
      submitSnapshot = {
        editingId: document.getElementById("projectId")?.value || "",
        beforeIds: new Set((typeof state !== "undefined" && Array.isArray(state.projects)) ? state.projects.map(project => project.id) : []),
        version: cleanVersion(document.getElementById("projectVersion")?.value)
      };
    }, true);

    projectForm.addEventListener("submit", () => {
      if (!submitSnapshot || typeof state === "undefined" || !Array.isArray(state.projects)) return;
      let project = submitSnapshot.editingId
        ? state.projects.find(item => item.id === submitSnapshot.editingId)
        : state.projects.find(item => !submitSnapshot.beforeIds.has(item.id));
      if (!project && !submitSnapshot.editingId) project = state.projects[state.projects.length - 1];
      if (!project) return;
      project.version = submitSnapshot.version;
      setProjectVersion(project.id, submitSnapshot.version);
      if (typeof saveProjects === "function") saveProjects();
      if (typeof render === "function") render();
      submitSnapshot = null;
    });
  }

  syncVersionsFromState();
  if (typeof saveProjects === "function") saveProjects();
  if (typeof render === "function") render();
})();
