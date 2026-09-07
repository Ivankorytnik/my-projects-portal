(() => {
  const TYPE_NAMES = {
    business: "Общие",
    work: "АТОМ",
    personal: "Личные"
  };

  function applyTypeNames() {
    try {
      if (typeof typeLabels !== "undefined") {
        Object.assign(typeLabels, TYPE_NAMES);
      }

      const projectType = document.getElementById("projectType");
      if (projectType) {
        Array.from(projectType.options).forEach(option => {
          if (TYPE_NAMES[option.value]) option.textContent = TYPE_NAMES[option.value];
        });
      }

      document.querySelectorAll(".nav-item[data-view]").forEach(button => {
        const name = TYPE_NAMES[button.dataset.view];
        if (name) button.textContent = name;
      });

      const businessStat = document.getElementById("businessCount")?.closest(".stat-card")?.querySelector("span");
      if (businessStat) businessStat.textContent = "Общие";

      const personalStat = document.getElementById("personalCount")?.closest(".stat-card")?.querySelector("span");
      if (personalStat) personalStat.textContent = "Личные";

      if (typeof renderSectionTitle === "function") {
        renderSectionTitle = function () {
          const viewTitles = {
            all: "Все проекты",
            business: "Общие проекты",
            work: "АТОМ",
            personal: "Личные проекты"
          };
          const statusSuffix = {
            all: "",
            idea: " · идея",
            active: " · в работе",
            mvp: " · MVP",
            live: " · работает",
            paused: " · пауза",
            archived: " · архив"
          };
          const title = document.getElementById("sectionTitle");
          if (title && typeof state !== "undefined") {
            title.textContent = (viewTitles[state.viewFilter] || "Проекты") + (statusSuffix[state.statusFilter] || "");
          }
        };
      }

      if (typeof render === "function") render();
    } catch (error) {
      console.error("Project type labels update error", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTypeNames, { once: true });
  } else {
    applyTypeNames();
  }
})();
