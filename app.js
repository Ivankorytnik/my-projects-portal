const APP_VERSION = "1.4.3";
const STORAGE_KEY = "ivan-projects-portal-v1";
const DELETED_KEY = "ivan-projects-portal-deleted-v1";

const initialProjects = [
  {
    id: "personal-site",
    type: "personal",
    title: "Личный сайт Ивана Корытника",
    category: "Сайт",
    status: "live",
    description: "Личный сайт с опытом, компетенциями, проектами, достижениями и контактами.",
    nextStep: "Поддерживать актуальность портфолио и ссылок на проекты.",
    url: "https://ivankorytnik.github.io/",
    githubUrl: "https://github.com/Ivankorytnik/ivankorytnik.github.io",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#0046ad",
    accent: "#f7c600"
  },
  {
    id: "jelanie",
    type: "business",
    title: "Желание сквозь Вселенную",
    category: "SpaceTech / B2C",
    status: "mvp",
    description: "Проект формирования желания с помощью гарнитуры, кодирования цифрового сигнала и подготовки к сеансу передачи в космос.",
    nextStep: "Запуск отдельного домена проекта и пилотного сценария передачи.",
    url: "https://ivankorytnik.github.io/Jelanie/",
    githubUrl: "https://github.com/Ivankorytnik/Jelanie",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#242b52",
    accent: "#68e7ff"
  },
  {
    id: "calculator",
    type: "business",
    title: "Калькулятор финмодели",
    category: "Финмодель",
    status: "mvp",
    description: "Интерактивный калькулятор 12-месячной финансовой модели проекта «Желание сквозь Вселенную».",
    nextStep: "Синхронизировать модель с актуальными тарифами и пилотными затратами.",
    url: "https://ivankorytnik.github.io/calculator/",
    githubUrl: "https://github.com/Ivankorytnik/calculator",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#0b1020",
    accent: "#78a8ff"
  },
  {
    id: "fishing-day",
    type: "personal",
    title: "Рыболовный день",
    category: "Fishing / Data",
    status: "live",
    description: "Годовой журнал рыбалки с погодой, давлением, уловами, снастями и прогнозом по виду рыбы.",
    nextStep: "Доработать модель прогноза клева на основе фактических уловов.",
    url: "https://ivankorytnik.github.io/fishing-day/",
    githubUrl: "https://github.com/Ivankorytnik/fishing-day",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#146b5f",
    accent: "#f4dc4f"
  },
  {
    id: "sound",
    type: "personal",
    title: "Speech Lab",
    category: "AI / Speech",
    status: "mvp",
    description: "Локальное распознавание речи, встреч и медиафайлов прямо в браузере.",
    nextStep: "Улучшить диаризацию и экспорт итогов встречи без изменения текущего дизайна.",
    url: "https://ivankorytnik.github.io/Sound/",
    githubUrl: "https://github.com/Ivankorytnik/Sound",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#0b0d10",
    accent: "#8fd4ff"
  },
  {
    id: "kp-auto",
    type: "work",
    title: "Генератор коммерческого предложения",
    category: "B2B / Sales Tool",
    status: "live",
    description: "Рабочий генератор коммерческого предложения с подбором артикула и формированием PDF.",
    nextStep: "Поддерживать справочники, шаблоны и актуальные коммерческие параметры.",
    url: "https://ivankorytnik.github.io/KP_AUTO/",
    githubUrl: "https://github.com/Ivankorytnik/KP_AUTO",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#111111",
    accent: "#4dd9d0"
  },
  {
    id: "projects-portal",
    type: "personal",
    title: "KORYTNIK HUB",
    category: "Project Management",
    status: "live",
    description: "Главный портал для управления всеми личными, рабочими и бизнес-проектами.",
    nextStep: "Подключать новые проекты, домены, документы и следующие шаги по мере развития.",
    url: "https://korytnikhub.pro/",
    githubUrl: "https://github.com/Ivankorytnik/my-projects-portal",
    owner: "Иван Корытник",
    updated: "2026-09-01",
    color: "#111111",
    accent: "#f7c600"
  },
  {
    id: "atom-lead-hub",
    type: "work",
    title: "ATOM B2B Lead Hub",
    category: "Продажи B2B",
    status: "paused",
    description: "Единый ресурс для сбора, очистки и обработки корпоративных лидов.",
    nextStep: "Возобновить при необходимости отдельного B2B-контура.",
    url: "",
    githubUrl: "",
    owner: "Иван Корытник",
    updated: "2026-07-13"
  },
  {
    id: "cross-analytics",
    type: "work",
    title: "Сквозная аналитика",
    category: "Аналитика",
    status: "paused",
    description: "Объединение каналов, CRM, UTM, PostgreSQL и BI для контроля пути лида и конверсий.",
    nextStep: "Определить актуальный контур данных и владельца дальнейшей разработки.",
    url: "",
    githubUrl: "",
    owner: "Иван Корытник",
    updated: "2026-07-08"
  },
  {
    id: "b2b-company-registry",
    type: "work",
    title: "Реестр B2B-компаний",
    category: "База данных",
    status: "paused",
    description: "База корпоративных покупателей и потенциальных клиентов.",
    nextStep: "Обновить источники и структуру при возобновлении проекта.",
    url: "",
    githubUrl: "",
    owner: "Иван Корытник",
    updated: "2026-07-12"
  },
  {
    id: "atom-business-telegram",
    type: "work",
    title: "Telegram-канал для бизнеса",
    category: "Маркетинг",
    status: "paused",
    description: "B2B-канал с сегментацией аудитории, UTM-разметкой и оценкой влияния на продажи.",
    nextStep: "Вернуться к развитию при появлении актуальной контентной задачи.",
    url: "https://t.me/atom_business",
    githubUrl: "",
    owner: "Иван Корытник",
    updated: "2026-07-10"
  }
];

const statusLabels = {
  idea: "Идея",
  active: "В работе",
  mvp: "MVP",
  live: "Работает",
  paused: "Пауза",
  archived: "Архив",
  planned: "Идея",
  done: "Архив"
};

const typeLabels = {
  business: "Бизнес",
  work: "Рабочий",
  personal: "Личный"
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
  businessCount: document.getElementById("businessCount"),
  personalCount: document.getElementById("personalCount"),
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
  projectNextStep: document.getElementById("projectNextStep"),
  projectUrl: document.getElementById("projectUrl"),
  projectGithubUrl: document.getElementById("projectGithubUrl"),
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
  return Array.from(String(value || "Проект")).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getAutoProjectPalette(title, category = "") {
  const seed = getProjectPaletteSeed(`${title}|${category}`);
  return PROJECT_PALETTES[seed % PROJECT_PALETTES.length];
}

function isValidHexColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || ""));
}

function normalizeStatus(status) {
  if (status === "planned") return "idea";
  if (status === "done") return "archived";
  return statusLabels[status] ? status : "active";
}

function normalizeProject(project) {
  const [autoColor, autoAccent] = getAutoProjectPalette(project.title, project.category);
  return {
    id: project.id || `project-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: ["business", "work", "personal"].includes(project.type) ? project.type : "work",
    title: project.title || "Без названия",
    category: project.category || "Другое",
    status: normalizeStatus(project.status),
    description: project.description || "",
    nextStep: project.nextStep || "",
    url: project.url || "",
    githubUrl: project.githubUrl || "",
    owner: project.owner || "Иван Корытник",
    updated: project.updated || "",
    color: isValidHexColor(project.color) ? project.color : autoColor,
    accent: isValidHexColor(project.accent) ? project.accent : autoAccent
  };
}

function getDeletedProjectIds() {
  try {
    const value = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveDeletedProjectIds(ids) {
  localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)]));
}

function mergeWithCatalog(savedProjects) {
  const deleted = new Set(getDeletedProjectIds());
  const catalog = initialProjects.map(normalizeProject).filter(project => !deleted.has(project.id));
  const saved = Array.isArray(savedProjects) ? savedProjects.map(normalizeProject) : [];
  const result = saved.filter(project => !deleted.has(project.id));
  const byId = new Map(result.map((project, index) => [project.id, index]));

  catalog.forEach(catalogProject => {
    if (byId.has(catalogProject.id)) {
      const index = byId.get(catalogProject.id);
      const savedProject = result[index];
      result[index] = normalizeProject({ ...catalogProject, ...savedProject });
    } else {
      result.push(catalogProject);
    }
  });

  return result;
}

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.projects = initialProjects.map(normalizeProject);
    saveProjects();
    return;
  }
  try {
    const parsed = JSON.parse(saved);
    state.projects = mergeWithCatalog(parsed);
    saveProjects();
  } catch (error) {
    console.error("Ошибка чтения проектов:", error);
    state.projects = initialProjects.map(normalizeProject);
    saveProjects();
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
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
  const normalized = normalizeProject(project);
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
      return [project.title, project.category, project.description, project.nextStep, project.owner]
        .some(value => String(value || "").toLowerCase().includes(query));
    });
}

function renderStats() {
  const activeStatuses = new Set(["active", "mvp", "live"]);
  elements.totalCount.textContent = state.projects.length;
  elements.businessCount.textContent = state.projects.filter(project => project.type === "business").length;
  elements.personalCount.textContent = state.projects.filter(project => project.type === "personal").length;
  elements.activeCount.textContent = state.projects.filter(project => activeStatuses.has(project.status)).length;
}

function renderCategoryFilter() {
  const current = elements.categoryFilter.value || state.categoryFilter;
  const categories = [...new Set(state.projects.map(project => project.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));
  elements.categoryFilter.innerHTML = `<option value="all">Все категории</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
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
    const hasGithub = Boolean(project.githubUrl);
    return `
      <article class="project-card" draggable="true" data-project-id="${escapeHtml(project.id)}" style="${projectStyle(project)}">
        <div class="card-top">
          <div class="card-labels">
            <span class="project-type project-type-${escapeHtml(project.type)}">${typeLabels[project.type] || "Проект"}</span>
            <span class="category">${escapeHtml(project.category)}</span>
          </div>
          <span class="status status-${escapeHtml(project.status)}">${statusLabels[project.status] || "Без статуса"}</span>
        </div>
        <div class="project-identity"><span class="project-color-dot"></span><span class="project-accent-dot"></span></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description || "Описание пока не добавлено.")}</p>
        ${project.nextStep ? `<div class="next-step"><span>Следующий шаг</span><strong>${escapeHtml(project.nextStep)}</strong></div>` : ""}
        <div class="card-meta">
          <span>Ответственный: ${escapeHtml(project.owner || "Не указан")}</span>
          <span>Обновлено: ${formatDate(project.updated)}</span>
        </div>
        <div class="card-actions card-actions-main">
          <a class="open-link ${hasUrl ? "" : "disabled"}" href="${hasUrl ? escapeHtml(project.url) : "#"}" target="_blank" rel="noopener noreferrer">${hasUrl ? "Открыть сайт" : "Нет сайта"}</a>
          <a class="github-link ${hasGithub ? "" : "disabled"}" href="${hasGithub ? escapeHtml(project.githubUrl) : "#"}" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <div class="card-actions card-actions-admin">
          <button class="card-button" type="button" data-action="edit" data-id="${escapeHtml(project.id)}">Изменить</button>
          <button class="card-button delete" type="button" data-action="delete" data-id="${escapeHtml(project.id)}" aria-label="Удалить проект">×</button>
        </div>
      </article>`;
  }).join("");
  elements.resultCount.textContent = `Найдено: ${projects.length}`;
  elements.emptyState.classList.toggle("hidden", projects.length > 0);
}

function renderSectionTitle() {
  const viewTitles = { all: "Все проекты", business: "Бизнес-проекты", personal: "Личные проекты", work: "Рабочие проекты" };
  const statusSuffix = { all: "", idea: " · идея", active: " · в работе", mvp: " · MVP", live: " · работает", paused: " · пауза", archived: " · архив" };
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
  elements.projectType.value = "business";
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
    elements.projectStatus.value = normalizeStatus(project.status);
    elements.projectDescription.value = project.description || "";
    elements.projectNextStep.value = project.nextStep || "";
    elements.projectUrl.value = project.url || "";
    elements.projectGithubUrl.value = project.githubUrl || "";
    elements.projectOwner.value = project.owner || "";
    elements.projectUpdated.value = project.updated || "";
    const themedProject = normalizeProject(project);
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
  const project = normalizeProject({
    id,
    type: elements.projectType.value,
    title: elements.projectTitle.value.trim(),
    category: elements.projectCategory.value.trim(),
    status: elements.projectStatus.value,
    description: elements.projectDescription.value.trim(),
    nextStep: elements.projectNextStep.value.trim(),
    url: elements.projectUrl.value.trim(),
    githubUrl: elements.projectGithubUrl.value.trim(),
    owner: elements.projectOwner.value.trim(),
    updated: elements.projectUpdated.value,
    color: elements.projectColor.value,
    accent: elements.projectAccent.value
  });
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
    const deleted = getDeletedProjectIds();
    if (!deleted.includes(project.id)) deleted.push(project.id);
    saveDeletedProjectIds(deleted);
    saveProjects();
    render();
  }
});


let draggedProjectId = null;

function moveProjectBefore(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const sourceIndex = state.projects.findIndex(project => project.id === sourceId);
  const targetIndex = state.projects.findIndex(project => project.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;
  const [source] = state.projects.splice(sourceIndex, 1);
  const newTargetIndex = state.projects.findIndex(project => project.id === targetId);
  state.projects.splice(newTargetIndex, 0, source);
  saveProjects();
  renderProjects();
}

elements.projectsGrid.addEventListener("dragstart", event => {
  const card = event.target.closest(".project-card[data-project-id]");
  if (!card) return;
  draggedProjectId = card.dataset.projectId;
  card.classList.add("dragging");
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedProjectId);
  }
});

elements.projectsGrid.addEventListener("dragend", event => {
  event.target.closest(".project-card")?.classList.remove("dragging");
  elements.projectsGrid.querySelectorAll(".drag-over").forEach(card => card.classList.remove("drag-over"));
  draggedProjectId = null;
});

elements.projectsGrid.addEventListener("dragover", event => {
  const card = event.target.closest(".project-card[data-project-id]");
  if (!card || !draggedProjectId || card.dataset.projectId === draggedProjectId) return;
  event.preventDefault();
  elements.projectsGrid.querySelectorAll(".drag-over").forEach(item => item.classList.remove("drag-over"));
  card.classList.add("drag-over");
});

elements.projectsGrid.addEventListener("drop", event => {
  const card = event.target.closest(".project-card[data-project-id]");
  if (!card || !draggedProjectId) return;
  event.preventDefault();
  moveProjectBefore(draggedProjectId, card.dataset.projectId);
});

elements.exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.projects, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "korytnik-hub-projects-backup.json";
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
    state.projects = mergeWithCatalog(parsed);
    saveProjects();
    render();
    alert("Проекты импортированы и объединены с каталогом HUB.");
  } catch (error) {
    alert(`Не удалось импортировать файл: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});

loadProjects();
render();