/* v1.3.1 - project color persistence and live preview */

(function () {
  if (
    typeof elements === "undefined" ||
    typeof state === "undefined" ||
    typeof normalizeProjectColors !== "function" ||
    typeof saveProjects !== "function" ||
    typeof render !== "function"
  ) {
    console.warn("Theme fix: portal state is not available.");
    return;
  }

  function applyLiveTheme() {
    if (!elements.projectColor || !elements.projectAccent) return;
    applyDialogProjectTheme(
      elements.projectColor.value,
      elements.projectAccent.value
    );
  }

  function persistNormalizedProjects() {
    state.projects = state.projects.map(normalizeProjectColors);
    saveProjects();
  }

  if (elements.projectColor) {
    elements.projectColor.addEventListener("input", applyLiveTheme);
    elements.projectColor.addEventListener("change", applyLiveTheme);
  }

  if (elements.projectAccent) {
    elements.projectAccent.addEventListener("input", applyLiveTheme);
    elements.projectAccent.addEventListener("change", applyLiveTheme);
  }

  if (elements.projectForm) {
    elements.projectForm.addEventListener("submit", () => {
      window.setTimeout(() => {
        persistNormalizedProjects();
        render();
      }, 0);
    });
  }

  persistNormalizedProjects();
  render();
})();
