(() => {
  const VIEW_KEY = "korytnik-hub-project-view";

  function installCardCleanupStyles() {
    if (document.getElementById("projectCardCleanupStyles")) return;

    const style = document.createElement("style");
    style.id = "projectCardCleanupStyles";
    style.textContent = `
      .project-card .next-step {
        display: none !important;
      }

      .project-card .card-meta span:first-child {
        display: none !important;
      }

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
    if (!grid || !heading || document.getElementById("projectViewSwitch")) return;

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
