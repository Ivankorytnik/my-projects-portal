(() => {
  const VIEW_KEY = "korytnik-hub-project-view";

  function cleanProjectCards() {
    document.querySelectorAll(".project-card").forEach(card => {
      card.querySelectorAll(".next-step").forEach(el => el.remove());

      card.querySelectorAll(".card-meta span").forEach(span => {
        const text = (span.textContent || "").trim().toLowerCase();
        if (text.startsWith("ответственный:")) {
          span.remove();
        }
      });
    });
  }

  function installCardCleanupStyles() {
    if (document.getElementById("projectCardCleanupStyles")) return;

    const style = document.createElement("style");
    style.id = "projectCardCleanupStyles";
    style.textContent = `
      .project-card .next-step { display: none !important; }

      .projects-grid.view-list .project-card {
        grid-template-columns: minmax(190px, 1.15fr) minmax(280px, 2fr) minmax(175px, .8fr) !important;
        grid-template-areas:
          "top top actions"
          "title desc actions"
          "meta desc admin" !important;
      }

      @media (max-width: 1180px) {
        .projects-grid.view-list .project-card {
          grid-template-columns: minmax(190px, 1fr) minmax(260px, 1.55fr) minmax(170px, .85fr) !important;
          grid-template-areas:
            "top top actions"
            "title desc actions"
            "meta desc admin" !important;
        }
      }

      @media (max-width: 900px) {
        .projects-grid.view-list .project-card {
          grid-template-columns: minmax(180px, .9fr) minmax(230px, 1.4fr) !important;
          grid-template-areas:
            "top top"
            "title desc"
            "meta desc"
            "admin actions" !important;
        }
      }

      @media (max-width: 640px) {
        .projects-grid.view-list .project-card {
          display: flex !important;
          flex-direction: column;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function iconCards() {
    return `<svg class="view-mode-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>`;
  }

  function iconList() {
    return `<svg class="view-mode-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="2" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="2" width="9" height="3" rx=".7" fill="currentColor"/><rect x="1" y="6.5" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="6.5" width="9" height="3" rx=".7" fill="currentColor"/><rect x="1" y="11" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="11" width="9" height="3" rx=".7" fill="currentColor"/></svg>`;
  }

  function initViewSwitcher() {
    installCardCleanupStyles();

    const grid = document.getElementById("projectsGrid");
    const heading = document.querySelector(".section-heading");
    if (!grid || !heading) return;

    cleanProjectCards();

    const observer = new MutationObserver(() => cleanProjectCards());
    observer.observe(grid, { childList: true, subtree: true });

    if (document.getElementById("projectViewSwitch")) return;

    const switcher = document.createElement("div");
    switcher.id = "projectViewSwitch";
    switcher.className = "view-mode-switch";
    switcher.setAttribute("role", "group");
    switcher.setAttribute("aria-label", "Вид проектов");
    switcher.innerHTML = `
      <button class="view-mode-button" type="button" data-project-view="cards" title="Карточки">
        ${iconCards()}<span>Карточки</span>
      </button>
      <button class="view-mode-button" type="button" data-project-view="list" title="Строки">
        ${iconList()}<span>Строки</span>
      </button>`;
    heading.appendChild(switcher);

    const buttons = Array.from(switcher.querySelectorAll("[data-project-view]"));

    function applyView(view) {
      const safeView = view === "list" ? "list" : "cards";
      grid.classList.toggle("view-list", safeView === "list");
      grid.classList.toggle("view-cards", safeView === "cards");
      buttons.forEach(button => {
        const active = button.dataset.projectView === safeView;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      try { localStorage.setItem(VIEW_KEY, safeView); } catch (_) {}
    }

    let savedView = "cards";
    try { savedView = localStorage.getItem(VIEW_KEY) || "cards"; } catch (_) {}
    applyView(savedView);

    switcher.addEventListener("click", event => {
      const button = event.target.closest("[data-project-view]");
      if (!button) return;
      applyView(button.dataset.projectView);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initViewSwitcher, { once: true });
  } else {
    initViewSwitcher();
  }
})();

(() => {
  const TYPE_NAMES = {
    business: "Общие",
    work: "АТОМ",
    personal: "Личные"
  };

  function applyProjectTypeNames() {
    try {
      if (typeof typeLabels !== "undefined") Object.assign(typeLabels, TYPE_NAMES);

      // «Все проекты» и «Общие» показывают все проекты, кроме личных.
      // «Личные» = только personal, «АТОМ» = только work.
      if (typeof getFilteredProjects === "function") {
        getFilteredProjects = function () {
          const query = state.search.trim().toLowerCase();
          return state.projects
            .filter(project => {
              if (state.viewFilter === "all") return project.type !== "personal";
              if (state.viewFilter === "business") return project.type !== "personal";
              return project.type === state.viewFilter;
            })
            .filter(project => state.statusFilter === "all" || project.status === state.statusFilter)
            .filter(project => state.categoryFilter === "all" || project.category === state.categoryFilter)
            .filter(project => {
              if (!query) return true;
              return [project.title, project.category, project.description, project.nextStep, project.owner]
                .some(value => String(value || "").toLowerCase().includes(query));
            });
        };
      }

      if (typeof renderStats === "function") {
        renderStats = function () {
          const activeStatuses = new Set(["active", "mvp", "live"]);
          const nonPersonalProjects = state.projects.filter(project => project.type !== "personal");
          elements.totalCount.textContent = nonPersonalProjects.length;
          elements.businessCount.textContent = nonPersonalProjects.length;
          elements.personalCount.textContent = state.projects.filter(project => project.type === "personal").length;
          elements.activeCount.textContent = nonPersonalProjects.filter(project => activeStatuses.has(project.status)).length;
        };
      }

      const projectType = document.getElementById("projectType");
      if (projectType) {
        Array.from(projectType.options).forEach(option => {
          if (TYPE_NAMES[option.value]) option.textContent = TYPE_NAMES[option.value];
        });
      }

      document.querySelectorAll(".nav-item[data-view]").forEach(button => {
        const label = TYPE_NAMES[button.dataset.view];
        if (label) button.textContent = label;
      });

      const businessStat = document.getElementById("businessCount")?.closest(".stat-card")?.querySelector("span");
      if (businessStat) businessStat.textContent = "Общие";
      const personalStat = document.getElementById("personalCount")?.closest(".stat-card")?.querySelector("span");
      if (personalStat) personalStat.textContent = "Личные";

      if (typeof renderSectionTitle === "function") {
        renderSectionTitle = function () {
          const viewTitles = { all: "Все проекты", business: "Общие проекты", work: "АТОМ", personal: "Личные проекты" };
          const statusSuffix = { all: "", idea: " · идея", active: " · в работе", mvp: " · MVP", live: " · работает", paused: " · пауза", archived: " · архив" };
          const title = document.getElementById("sectionTitle");
          if (title && typeof state !== "undefined") title.textContent = (viewTitles[state.viewFilter] || "Проекты") + (statusSuffix[state.statusFilter] || "");
        };
      }

      if (typeof render === "function") render();
    } catch (error) {
      console.error("Project type labels update error", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyProjectTypeNames, { once: true });
  } else {
    applyProjectTypeNames();
  }
})();
