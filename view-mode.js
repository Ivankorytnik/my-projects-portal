(() => {
  const VIEW_KEY = "korytnik-hub-project-view";

  function iconCards() {
    return `<svg class="view-mode-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="1" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9.5" y="9.5" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>`;
  }

  function iconList() {
    return `<svg class="view-mode-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="2" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="2" width="9" height="3" rx=".7" fill="currentColor"/><rect x="1" y="6.5" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="6.5" width="9" height="3" rx=".7" fill="currentColor"/><rect x="1" y="11" width="3" height="3" rx=".7" fill="currentColor"/><rect x="6" y="11" width="9" height="3" rx=".7" fill="currentColor"/></svg>`;
  }

  function initViewSwitcher() {
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
