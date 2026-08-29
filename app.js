const APP_VERSION = "1.3.0";
const STORAGE_KEY = "ivan-projects-portal-v1";
const initialProjects = [
  {
    id: "personal-site",
    type: "personal",
    color: "#0046ad",
    accent: "#f7c600",
    title: "Личный сайт Ивана Корытника",
    category: "Сайт",
    status: "active",
    description: "Сайт-визитка с опытом, компетенциями, проектами, достижениями и контактами.",
    url: "https://ivankorytnik.github.io/",
    owner: "Иван Корытник",
    updated: "2026-07-14"
  },
  {
    id: "atom-lead-hub",
    type: "work",
    color: "#00a9a5",
    accent: "#5bd6d2",
    title: "ATOM B2B Lead Hub",
    category: "Продажи B2B",
    status: "active",
    description: "Единый ресурс для сбора, очистки и обработки корпоративных лидов для продажи автомобилей АТОМ.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-13"
  },
  {
    id: "cross-analytics",
    type: "work",
    color: "#2457d6",
    accent: "#72a0ff",
    title: "Сквозная аналитика АТОМ",
    category: "Аналитика",
    status: "active",
    description: "Проект объединения каналов, CRM, UTM, PostgreSQL и DataLens для контроля пути лида и конверсий.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-08"
  },
  {
    id: "b2b-company-registry",
    type: "work",
    color: "#3b556d",
    accent: "#9db2c5",
    title: "Реестр B2B-компаний",
    category: "База данных",
    status: "active",
    description: "База корпоративных покупателей: ИНН, сайт, телефон, e-mail, город, регион и размер автопарка.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-12"
  },
  {
    id: "atom-business-telegram",
    type: "work",
    color: "#168acd",
    accent: "#58b7e8",
    title: "Telegram-канал АТОМ для бизнеса",
    category: "Маркетинг",
    status: "planned",
    description: "Развитие B2B-канала, приглашение сегментов из CRM, UTM-разметка и оценка влияния на продажи.",
    url: "https://t.me/atom_business",
    owner: "Иван Корытник",
    updated: "2026-07-10"
  },
  {
    id: "projects-portal",
    type: "personal",
    color: "#111111",
    accent: "#f7c600",
    title: "Мой портал проектов",
    category: "Портал",
    status: "done",
    description: "Единая защищённая страница со всеми рабочими и личными проектами.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-14"
  }
];

const statusLabels = {
  active: "В работе",
  planned: "Запланировано",
  done: "Завершено"
};

const state = {
  projects: [],
  viewFilter: "all",
  statusFilter: "all",
  categoryFilter: "all",
  search: ""
};

const elements = {
  portal: document.getElementById("portal"),
  projectsGrid: document.getElementById("projectsGrid"),
  emptyState: document.getElementById("emptyState"),
  totalCount: document.getElementById("totalCount"),
  personalCount: document.getElementById("personalCount"),
  workCount: document.getElementById("workCount"),
  activeCount: document.getElementById("activeCount"),
  resultCount: document.getElementById("resultCount"),
  sectionTitle: document.getElementById("sectionTitle"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  navItems: Array.from(document.querySelectorAll(".nav-item")),
  statusItems: Array.from(document.querySelectorAll(".status-filter")),
  addProjectButton: document.getElementById("addProjectButton"),
  projectDialog: document.getElementById("projectDialog"),
  projectForm: document.getElementById("projectForm"),
  dialogTitle: document.getElementById("dialogTitle"),
  projectId: document.getElementById("projectId"),
  projectTitle: document.getElementById("projectTitle"),
  projectType: document.getElementById("projectType"),
  projectCategory: document.getElementById("projectCategory"),
  projectStatus: document.getElementById("projectStatus"),
  projectDescription: document.getElementById("projectDescription"),
  projectUrl: document.getElementById("projectUrl"),
  projectOwner: document.getElementById("projectOwner"),
  projectUpdated: document.getElementById("projectUpdated"),
  projectColor: document.getElementById("projectColor"),
  projectAccent: document.getElementById("projectAccent"),
  autoProjectColors: document.getElementById("autoProjectColors"),
  closeDialogButton: document.getElementById("closeDialogButton"),
  cancelDialogButton: document.getElementById("cancelDialogButton"),
  exportButton: document.getElementById("exportButton"),
  importInput: document.getElementById("importInput")
};

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    state.projects = structuredClone(initialProjects).map(normalizeProjectColors);
    saveProjects();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.projects = Array.isArray(parsed)
      ? parsed.map(project => normalizeProjectColors({ type: project.type || "work", ...project }))
      : structuredClone(initialProjects).map(normalizeProjectColors);
  } catch (error) {
    console.error("Ошибка чтения проектов:", error);
    state.projects = structuredClone(initialProjects).map(normalizeProjectColors);
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
}

const PROJECT_PALETTES = [
  ["#0046ad", "#f7c600"],
  ["#00a9a5", "#75e1dc"],
  ["#5a3fc0", "#b8a8ff"],
  ["#c4492d", "#f3aa7e"],
  ["#1f7a4c", "#91d5b0"],
  ["#168acd", "#73c8ef"],
  ["#7a4a20", "#d7a56d"],
  ["#303846", "#aeb7c4"]
];

function getProjectPaletteSeed(value) {
  return Array.from(String(value || "Проект"))
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getAutoProjectPalette(title, category = "") {
  const seed = getProjectPaletteSeed(`${title}|${category}`);
  return PROJECT_PALETTES[seed % PROJECT_PALETTES.length];
}

function isValidHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
}

function normalizeProjectColors(project) {
  const [autoColor, autoAccent] = getAutoProjectPalette(project.title, project.category);

  return {
    ...project,
    color: isValidHexColor(project.color) ? project.color : autoColor,
    accent: isValidHexColor(project.accent) ? project.accent : autoAccent
  };
}

function hexToRgb(hex) {
  const normalized = String(hex).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 0, g: 70, b: 173 };

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16)
  };
}

function getContrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111111" : "#ffffff";
}

function projectStyle(project) {
  const normalized = normalizeProjectColors(project);
  const { r, g, b } = hexToRgb(normalized.color);
  const { r: ar, g: ag, b: ab } = hexToRgb(normalized.accent);

  return [
    `--project-color:${normalized.color}`,
    `--project-accent:${normalized.accent}`,
    `--project-color-rgb:${r},${g},${b}`,
    `--project-accent-rgb:${ar},${ag},${ab}`,
    `--project-on-color:${getContrastColor(normalized.color)}`,
    `--project-on-accent:${getContrastColor(normalized.accent)}`
  ].join(";");
}

function applyDialogProjectTheme(color, accent) {
  const safeColor = isValidHexColor(color) ? color : "#0046ad";
  const safeAccent = isValidHexColor(accent) ? accent : "#f7c600";
  const { r, g, b } = hexToRgb(safeColor);
  const { r: ar, g: ag, b: ab } = hexToRgb(safeAccent);

  elements.projectDialog.style.setProperty("--project-color", safeColor);
  elements.projectDialog.style.setProperty("--project-accent", safeAccent);
  elements.projectDialog.style.setProperty("--project-color-rgb", `${r},${g},${b}`);
  elements.projectDialog.style.setProperty("--project-accent-rgb", `${ar},${ag},${ab}`);
  elements.projectDialog.style.setProperty("--project-on-color", getContrastColor(safeColor));
  elements.projectDialog.style.setProperty("--project-on-accent", getContrastColor(safeAccent));
}

function updateDialogThemeFromControls() {
  applyDialogProjectTheme(elements.projectColor.value, elements.projectAccent.value);
}

function getFilteredProjects() {
  const query = state.search.trim().toLowerCase();

  return state.projects
    .filter(project => state.viewFilter === "all" || project.type === state.viewFilter)
    .filter(project => state.statusFilter === "all" || project.status === state.statusFilter)
    .filter(project => state.categoryFilter === "all" || project.category === state.categoryFilter)
    .filter(project => {
      if (!query) return true;
      return [project.title, project.category, project.description, project.owner]
        .some(value => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => String(b.updated || "").localeCompare(String(a.updated || "")));
}

function renderStats() {
  elements.totalCount.textContent = state.projects.length;
  elements.personalCount.textContent = state.projects.filter(project => project.type === "personal").length;
  elements.workCount.textContent = state.projects.filter(project => project.type === "work").length;
  elements.activeCount.textContent = state.projects.filter(project => project.status === "active").length;
}

function renderCategoryFilter() {
  const current = elements.categoryFilter.value || state.categoryFilter;
  const categories = [...new Set(state.projects.map(project => project.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ru"));

  elements.categoryFilter.innerHTML = `
    <option value="all">Все категории</option>
    ${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}
  `;

  elements.categoryFilter.value = categories.includes(current) ? current : "all";
  state.categoryFilter = elements.categoryFilter.value;
}

function formatDate(value) {
  if (!value) return "Дата не указана";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("ru-RU").format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProjects() {
  const projects = getFilteredProjects();

  elements.projectsGrid.innerHTML = projects.map(project => {
    const hasUrl = Boolean(project.url);
    return `
      <article class="project-card" style="${projectStyle(project)}">
        <div class="card-top">
          <div class="card-labels">
            <span class="project-type project-type-${escapeHtml(project.type || "work")}">${project.type === "personal" ? "Личный" : "Рабочий"}</span>
            <span class="category">${escapeHtml(project.category)}</span>
          </div>
          <span class="status status-${escapeHtml(project.status)}">${statusLabels[project.status] || "Без статуса"}</span>
        </div>
        <div class="project-identity"><span class="project-color-dot"></span><span class="project-accent-dot"></span></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description || "Описание пока не добавлено.")}</p>
        <div class="card-meta">
          <span>Ответственный: ${escapeHtml(project.owner || "Не указан")}</span>
          <span>Обновлено: ${formatDate(project.updated)}</span>
        </div>
        <div class="card-actions">
          <a class="open-link ${hasUrl ? "" : "disabled"}" href="${hasUrl ? escapeHtml(project.url) : "#"}" target="_blank" rel="noopener noreferrer">${hasUrl ? "Открыть" : "Нет ссылки"}</a>
          <button class="card-button" type="button" data-action="edit" data-id="${escapeHtml(project.id)}">Изменить</button>
          <button class="card-button delete" type="button" data-action="delete" data-id="${escapeHtml(project.id)}" aria-label="Удалить проект">×</button>
        </div>
      </article>`;
  }).join("");

  elements.resultCount.textContent = `Найдено: ${projects.length}`;
  elements.emptyState.classList.toggle("hidden", projects.length > 0);
}

function renderSectionTitle() {
  const viewTitles = { all: "Все проекты", personal: "Личные проекты", work: "Рабочие проекты" };
  const statusSuffix = { all: "", active: " - в работе", planned: " - запланировано", done: " - завершено" };
  elements.sectionTitle.textContent = (viewTitles[state.viewFilter] || "Проекты") + (statusSuffix[state.statusFilter] || "");
}

function render() {
  renderStats();
  renderCategoryFilter();
  renderProjects();
  renderSectionTitle();
}

elements.searchInput.addEventListener("input", event => { state.search = event.target.value; renderProjects(); });
elements.categoryFilter.addEventListener("change", event => { state.categoryFilter = event.target.value; renderProjects(); });

elements.navItems.forEach(item => {
  item.addEventListener("click", () => {
    elements.navItems.forEach(button => button.classList.remove("active"));
    item.classList.add("active");
    state.viewFilter = item.dataset.view;
    renderProjects();
    renderSectionTitle();
  });
});

elements.statusItems.forEach(item => {
  item.addEventListener("click", () => {
    elements.statusItems.forEach(button => button.classList.remove("active"));
    item.classList.add("active");
    state.statusFilter = item.dataset.filter;
    renderProjects();
    renderSectionTitle();
  });
});

function openProjectDialog(project = null) {
  elements.projectForm.reset();
  elements.projectId.value = "";
  elements.projectOwner.value = "Иван Корытник";
  elements.projectUpdated.value = new Date().toISOString().slice(0, 10);
  elements.projectType.value = "work";
  elements.projectStatus.value = "active";
  const [defaultColor, defaultAccent] = getAutoProjectPalette("", "");
  elements.projectColor.value = defaultColor;
  elements.projectAccent.value = defaultAccent;
  applyDialogProjectTheme(defaultColor, defaultAccent);
  elements.dialogTitle.textContent = project ? "Изменить проект" : "Новый проект";

  if (project) {
    elements.projectId.value = project.id;
    elements.projectTitle.value = project.title || "";
    elements.projectType.value = project.type || "work";
    elements.projectCategory.value = project.category || "";
    elements.projectStatus.value = project.status || "active";
    elements.projectDescription.value = project.description || "";
    elements.projectUrl.value = project.url || "";
    elements.projectOwner.value = project.owner || "";
    elements.projectUpdated.value = project.updated || "";
    const themedProject = normalizeProjectColors(project);
    elements.projectColor.value = themedProject.color;
    elements.projectAccent.value = themedProject.accent;
    applyDialogProjectTheme(themedProject.color, themedProject.accent);
  }

  elements.projectDialog.classList.remove("hidden");
  elements.projectDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => elements.projectTitle.focus());
}

function closeProjectDialog() {
  elements.projectDialog.classList.add("hidden");
  elements.projectDialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

if (elements.addProjectButton) elements.addProjectButton.addEventListener("click", () => openProjectDialog());
if (elements.projectColor) elements.projectColor.addEventListener("input", updateDialogThemeFromControls);
if (elements.projectAccent) elements.projectAccent.addEventListener("input", updateDialogThemeFromControls);
if (elements.autoProjectColors) {
  elements.autoProjectColors.addEventListener("click", () => {
    const [color, accent] = getAutoProjectPalette(elements.projectTitle.value.trim(), elements.projectCategory.value.trim());
    elements.projectColor.value = color;
    elements.projectAccent.value = accent;
    applyDialogProjectTheme(color, accent);
  });
}

elements.closeDialogButton.addEventListener("click", closeProjectDialog);
elements.cancelDialogButton.addEventListener("click", closeProjectDialog);
elements.projectDialog.addEventListener("click", event => { if (event.target === elements.projectDialog) closeProjectDialog(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && !elements.projectDialog.classList.contains("hidden")) closeProjectDialog(); });

elements.projectForm.addEventListener("submit", event => {
  event.preventDefault();
  const id = elements.projectId.value || `project-${Date.now()}`;
  const project = {
    id,
    type: elements.projectType.value,
    title: elements.projectTitle.value.trim(),
    category: elements.projectCategory.value.trim(),
    status: elements.projectStatus.value,
    description: elements.projectDescription.value.trim(),
    url: elements.projectUrl.value.trim(),
    owner: elements.projectOwner.value.trim(),
    updated: elements.projectUpdated.value,
    color: elements.projectColor.value,
    accent: elements.projectAccent.value
  };

  const existingIndex = state.projects.findIndex(item => item.id === id);
  if (existingIndex >= 0) state.projects[existingIndex] = project;
  else state.projects.push(project);
  saveProjects();
  closeProjectDialog();
  render();
});

elements.projectsGrid.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const project = state.projects.find(item => item.id === button.dataset.id);
  if (!project) return;
  if (button.dataset.action === "edit") openProjectDialog(project);
  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Удалить проект «${project.title}»?`);
    if (!confirmed) return;
    state.projects = state.projects.filter(item => item.id !== project.id);
    saveProjects();
    render();
  }
});

elements.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.projects, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "projects-backup.json";
  link.click();
  URL.revokeObjectURL(url);
});

elements.importInput.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Файл должен содержать массив проектов.");
    state.projects = parsed.map(normalizeProjectColors);
    saveProjects();
    render();
    alert("Проекты импортированы.");
  } catch (error) {
    alert(`Не удалось импортировать файл: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});

loadProjects();
render();
