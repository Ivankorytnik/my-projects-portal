const PASSWORD = "12345";

const STORAGE_KEY = "ivan-projects-portal-v1";
const SESSION_KEY = "ivan-projects-portal-auth-v2";

const initialProjects = [
  {
    id: "personal-site",
    type: "personal",
    title: "Личный сайт Ивана Корытника",
    category: "Сайт",
    status: "active",
    description:
      "Сайт-визитка с опытом, компетенциями, проектами, достижениями и контактами.",
    url: "https://ivankorytnik.github.io/",
    owner: "Иван Корытник",
    updated: "2026-07-14"
  },
  {
    id: "atom-lead-hub",
    type: "work",
    title: "ATOM B2B Lead Hub",
    category: "Продажи B2B",
    status: "active",
    description:
      "Единый ресурс для сбора, очистки и обработки корпоративных лидов для продажи автомобилей АТОМ.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-13"
  },
  {
    id: "cross-analytics",
    type: "work",
    title: "Сквозная аналитика АТОМ",
    category: "Аналитика",
    status: "active",
    description:
      "Проект объединения каналов, CRM, UTM, PostgreSQL и DataLens для контроля пути лида и конверсий.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-08"
  },
  {
    id: "b2b-company-registry",
    type: "work",
    title: "Реестр B2B-компаний",
    category: "База данных",
    status: "active",
    description:
      "База корпоративных покупателей: ИНН, сайт, телефон, e-mail, город, регион и размер автопарка.",
    url: "",
    owner: "Иван Корытник",
    updated: "2026-07-12"
  },
  {
    id: "atom-business-telegram",
    type: "work",
    title: "Telegram-канал АТОМ для бизнеса",
    category: "Маркетинг",
    status: "planned",
    description:
      "Развитие B2B-канала, приглашение сегментов из CRM, UTM-разметка и оценка влияния на продажи.",
    url: "https://t.me/atom_business",
    owner: "Иван Корытник",
    updated: "2026-07-10"
  },
  {
    id: "projects-portal",
    type: "personal",
    title: "Мой портал проектов",
    category: "Портал",
    status: "done",
    description:
      "Единая защищённая страница со всеми рабочими и личными проектами.",
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
  loginScreen: document.getElementById("loginScreen"),
  portal: document.getElementById("portal"),
  loginForm: document.getElementById("loginForm"),
  password: document.getElementById("password"),
  loginError: document.getElementById("loginError"),
  togglePassword: document.getElementById("togglePassword"),
  logoutButton: document.getElementById("logoutButton"),

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

  closeDialogButton: document.getElementById("closeDialogButton"),
  cancelDialogButton: document.getElementById("cancelDialogButton"),

  exportButton: document.getElementById("exportButton"),
  importInput: document.getElementById("importInput")
};

/* =========================
   ПРОВЕРКА ЭЛЕМЕНТОВ
========================= */

function checkRequiredElements() {
  const requiredElements = [
    "loginScreen",
    "portal",
    "loginForm",
    "password",
    "loginError",
    "logoutButton",
    "projectsGrid",
    "emptyState",
    "searchInput",
    "categoryFilter",
    "addProjectButton",
    "projectDialog",
    "projectForm"
  ];

  const missingElements = requiredElements.filter(
    elementName => !elements[elementName]
  );

  if (missingElements.length > 0) {
    console.error(
      "В index.html отсутствуют элементы:",
      missingElements.join(", ")
    );

    return false;
  }

  return true;
}

/* =========================
   РАБОТА С ПРОЕКТАМИ
========================= */

function cloneInitialProjects() {
  return JSON.parse(JSON.stringify(initialProjects));
}

function normalizeProject(project) {
  return {
    id: project.id || `project-${Date.now()}-${Math.random()}`,
    type: project.type === "personal" ? "personal" : "work",
    title: project.title || "Без названия",
    category: project.category || "Без категории",
    status: statusLabels[project.status] ? project.status : "active",
    description: project.description || "",
    url: project.url || "",
    owner: project.owner || "Иван Корытник",
    updated: project.updated || ""
  };
}

function loadProjects() {
  const savedProjects = localStorage.getItem(STORAGE_KEY);

  if (!savedProjects) {
    state.projects = cloneInitialProjects();
    saveProjects();
    return;
  }

  try {
    const parsedProjects = JSON.parse(savedProjects);

    if (!Array.isArray(parsedProjects)) {
      throw new Error("Некорректный формат проектов");
    }

    state.projects = parsedProjects.map(normalizeProject);
  } catch (error) {
    console.error("Ошибка чтения проектов:", error);

    state.projects = cloneInitialProjects();
    saveProjects();
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.projects));
}

/* =========================
   АВТОРИЗАЦИЯ
========================= */

function showPortal() {
  elements.loginScreen.classList.add("hidden");
  elements.portal.classList.remove("hidden");

  render();
}

function showLogin() {
  elements.portal.classList.add("hidden");
  elements.loginScreen.classList.remove("hidden");

  elements.password.value = "";
  elements.loginError.textContent = "";

  setTimeout(() => {
    elements.password.focus();
  }, 50);
}

function login(event) {
  event.preventDefault();

  const enteredPassword = elements.password.value.trim();

  elements.loginError.textContent = "";

  if (enteredPassword === PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "authorized");
    showPortal();
    return;
  }

  elements.loginError.textContent = "Неверный пароль.";

  elements.password.focus();
  elements.password.select();
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
}

function togglePasswordVisibility() {
  const passwordIsHidden = elements.password.type === "password";

  elements.password.type = passwordIsHidden ? "text" : "password";

  if (elements.togglePassword) {
    elements.togglePassword.textContent = passwordIsHidden
      ? "Скрыть"
      : "Показать";
  }
}

/* =========================
   ФИЛЬТРАЦИЯ
========================= */

function getFilteredProjects() {
  const searchQuery = state.search.trim().toLowerCase();

  return state.projects
    .filter(project => {
      return (
        state.viewFilter === "all" ||
        project.type === state.viewFilter
      );
    })
    .filter(project => {
      return (
        state.statusFilter === "all" ||
        project.status === state.statusFilter
      );
    })
    .filter(project => {
      return (
        state.categoryFilter === "all" ||
        project.category === state.categoryFilter
      );
    })
    .filter(project => {
      if (!searchQuery) {
        return true;
      }

      const searchableValues = [
        project.title,
        project.category,
        project.description,
        project.owner
      ];

      return searchableValues.some(value =>
        String(value || "")
          .toLowerCase()
          .includes(searchQuery)
      );
    })
    .sort((firstProject, secondProject) => {
      return String(secondProject.updated || "").localeCompare(
        String(firstProject.updated || "")
      );
    });
}

/* =========================
   ОТОБРАЖЕНИЕ СТАТИСТИКИ
========================= */

function renderStats() {
  if (elements.totalCount) {
    elements.totalCount.textContent = state.projects.length;
  }

  if (elements.personalCount) {
    elements.personalCount.textContent = state.projects.filter(
      project => project.type === "personal"
    ).length;
  }

  if (elements.workCount) {
    elements.workCount.textContent = state.projects.filter(
      project => project.type === "work"
    ).length;
  }

  if (elements.activeCount) {
    elements.activeCount.textContent = state.projects.filter(
      project => project.status === "active"
    ).length;
  }
}

/* =========================
   КАТЕГОРИИ
========================= */

function renderCategoryFilter() {
  const previousCategory =
    elements.categoryFilter.value || state.categoryFilter;

  const categories = [
    ...new Set(
      state.projects
        .map(project => project.category)
        .filter(Boolean)
    )
  ].sort((firstCategory, secondCategory) =>
    firstCategory.localeCompare(secondCategory, "ru")
  );

  elements.categoryFilter.innerHTML = `
    <option value="all">Все категории</option>

    ${categories
      .map(category => {
        return `
          <option value="${escapeHtml(category)}">
            ${escapeHtml(category)}
          </option>
        `;
      })
      .join("")}
  `;

  if (categories.includes(previousCategory)) {
    elements.categoryFilter.value = previousCategory;
  } else {
    elements.categoryFilter.value = "all";
  }

  state.categoryFilter = elements.categoryFilter.value;
}

/* =========================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================= */

function formatDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Дата не указана";
  }

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

/* =========================
   КАРТОЧКИ ПРОЕКТОВ
========================= */

function renderProjects() {
  const filteredProjects = getFilteredProjects();

  elements.projectsGrid.innerHTML = filteredProjects
    .map(project => {
      const hasUrl = Boolean(project.url);
      const projectTypeLabel =
        project.type === "personal" ? "Личный" : "Рабочий";

      return `
        <article class="project-card">

          <div class="card-top">

            <div class="card-labels">

              <span
                class="project-type project-type-${escapeHtml(project.type)}"
              >
                ${projectTypeLabel}
              </span>

              <span class="category">
                ${escapeHtml(project.category)}
              </span>

            </div>

            <span
              class="status status-${escapeHtml(project.status)}"
            >
              ${statusLabels[project.status] || "Без статуса"}
            </span>

          </div>

          <h3>${escapeHtml(project.title)}</h3>

          <p>
            ${escapeHtml(
              project.description || "Описание пока не добавлено."
            )}
          </p>

          <div class="card-meta">

            <span>
              Ответственный:
              ${escapeHtml(project.owner || "Не указан")}
            </span>

            <span>
              Обновлено:
              ${formatDate(project.updated)}
            </span>

          </div>

          <div class="card-actions">

            <a
              class="open-link ${hasUrl ? "" : "disabled"}"
              href="${hasUrl ? escapeHtml(project.url) : "#"}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${hasUrl ? "Открыть" : "Нет ссылки"}
            </a>

            <button
              class="card-button"
              type="button"
              data-action="edit"
              data-id="${escapeHtml(project.id)}"
            >
              Изменить
            </button>

            <button
              class="card-button delete"
              type="button"
              data-action="delete"
              data-id="${escapeHtml(project.id)}"
              aria-label="Удалить проект"
            >
              ×
            </button>

          </div>

        </article>
      `;
    })
    .join("");

  if (elements.resultCount) {
    elements.resultCount.textContent =
      `Найдено: ${filteredProjects.length}`;
  }

  elements.emptyState.classList.toggle(
    "hidden",
    filteredProjects.length > 0
  );
}

/* =========================
   ЗАГОЛОВОК РАЗДЕЛА
========================= */

function renderSectionTitle() {
  if (!elements.sectionTitle) {
    return;
  }

  const viewTitles = {
    all: "Все проекты",
    personal: "Личные проекты",
    work: "Рабочие проекты"
  };

  const statusSuffixes = {
    all: "",
    active: " — в работе",
    planned: " — запланировано",
    done: " — завершено"
  };

  const mainTitle =
    viewTitles[state.viewFilter] || "Проекты";

  const statusSuffix =
    statusSuffixes[state.statusFilter] || "";

  elements.sectionTitle.textContent =
    mainTitle + statusSuffix;
}

/* =========================
   ОБЩИЙ РЕНДЕР
========================= */

function render() {
  renderStats();
  renderCategoryFilter();
  renderProjects();
  renderSectionTitle();
}

/* =========================
   ОКНО ПРОЕКТА
========================= */

function openProjectDialog(project = null) {
  elements.projectForm.reset();

  elements.projectId.value = "";
  elements.projectOwner.value = "Иван Корытник";
  elements.projectUpdated.value =
    new Date().toISOString().slice(0, 10);

  elements.projectType.value = "work";
  elements.projectStatus.value = "active";

  elements.dialogTitle.textContent = project
    ? "Изменить проект"
    : "Новый проект";

  if (project) {
    elements.projectId.value = project.id;
    elements.projectTitle.value = project.title || "";
    elements.projectType.value = project.type || "work";
    elements.projectCategory.value = project.category || "";
    elements.projectStatus.value = project.status || "active";
    elements.projectDescription.value =
      project.description || "";
    elements.projectUrl.value = project.url || "";
    elements.projectOwner.value = project.owner || "";
    elements.projectUpdated.value = project.updated || "";
  }

  elements.projectDialog.showModal();

  setTimeout(() => {
    elements.projectTitle.focus();
  }, 50);
}

function closeProjectDialog() {
  elements.projectDialog.close();
}

function saveProjectFromForm(event) {
  event.preventDefault();

  const existingId = elements.projectId.value;

  const project = normalizeProject({
    id: existingId || `project-${Date.now()}`,
    type: elements.projectType.value,
    title: elements.projectTitle.value.trim(),
    category: elements.projectCategory.value.trim(),
    status: elements.projectStatus.value,
    description: elements.projectDescription.value.trim(),
    url: elements.projectUrl.value.trim(),
    owner: elements.projectOwner.value.trim(),
    updated: elements.projectUpdated.value
  });

  const existingProjectIndex = state.projects.findIndex(
    item => item.id === project.id
  );

  if (existingProjectIndex >= 0) {
    state.projects[existingProjectIndex] = project;
  } else {
    state.projects.push(project);
  }

  saveProjects();
  closeProjectDialog();
  render();
}

function handleProjectAction(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const projectId = button.dataset.id;
  const action = button.dataset.action;

  const selectedProject = state.projects.find(
    project => project.id === projectId
  );

  if (!selectedProject) {
    return;
  }

  if (action === "edit") {
    openProjectDialog(selectedProject);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(
      `Удалить проект «${selectedProject.title}»?`
    );

    if (!confirmed) {
      return;
    }

    state.projects = state.projects.filter(
      project => project.id !== selectedProject.id
    );

    saveProjects();
    render();
  }
}

/* =========================
   ЭКСПОРТ И ИМПОРТ
========================= */

function exportProjects() {
  const jsonContent = JSON.stringify(
    state.projects,
    null,
    2
  );

  const file = new Blob(
    [jsonContent],
    {
      type: "application/json"
    }
  );

  const fileUrl = URL.createObjectURL(file);

  const downloadLink = document.createElement("a");

  downloadLink.href = fileUrl;
  downloadLink.download = "projects-backup.json";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  URL.revokeObjectURL(fileUrl);
}

async function importProjects(event) {
  const selectedFile = event.target.files?.[0];

  if (!selectedFile) {
    return;
  }

  try {
    const fileText = await selectedFile.text();
    const importedProjects = JSON.parse(fileText);

    if (!Array.isArray(importedProjects)) {
      throw new Error(
        "Файл должен содержать массив проектов."
      );
    }

    state.projects = importedProjects.map(normalizeProject);

    saveProjects();
    render();

    alert("Проекты успешно импортированы.");
  } catch (error) {
    console.error("Ошибка импорта:", error);

    alert(
      `Не удалось импортировать файл: ${error.message}`
    );
  } finally {
    event.target.value = "";
  }
}

/* =========================
   ОБРАБОТЧИКИ СОБЫТИЙ
========================= */

function registerEventListeners() {
  elements.loginForm.addEventListener("submit", login);

  elements.logoutButton.addEventListener("click", logout);

  if (elements.togglePassword) {
    elements.togglePassword.addEventListener(
      "click",
      togglePasswordVisibility
    );
  }

  elements.searchInput.addEventListener("input", event => {
    state.search = event.target.value;
    renderProjects();
  });

  elements.categoryFilter.addEventListener(
    "change",
    event => {
      state.categoryFilter = event.target.value;
      renderProjects();
    }
  );

  elements.navItems.forEach(item => {
    item.addEventListener("click", () => {
      elements.navItems.forEach(button => {
        button.classList.remove("active");
      });

      item.classList.add("active");

      state.viewFilter = item.dataset.view || "all";

      renderProjects();
      renderSectionTitle();
    });
  });

  elements.statusItems.forEach(item => {
    item.addEventListener("click", () => {
      elements.statusItems.forEach(button => {
        button.classList.remove("active");
      });

      item.classList.add("active");

      state.statusFilter =
        item.dataset.filter || "all";

      renderProjects();
      renderSectionTitle();
    });
  });

  elements.addProjectButton.addEventListener(
    "click",
    () => openProjectDialog()
  );

  if (elements.closeDialogButton) {
    elements.closeDialogButton.addEventListener(
      "click",
      closeProjectDialog
    );
  }

  if (elements.cancelDialogButton) {
    elements.cancelDialogButton.addEventListener(
      "click",
      closeProjectDialog
    );
  }

  elements.projectForm.addEventListener(
    "submit",
    saveProjectFromForm
  );

  elements.projectsGrid.addEventListener(
    "click",
    handleProjectAction
  );

  if (elements.exportButton) {
    elements.exportButton.addEventListener(
      "click",
      exportProjects
    );
  }

  if (elements.importInput) {
    elements.importInput.addEventListener(
      "change",
      importProjects
    );
  }

  elements.projectDialog.addEventListener(
    "click",
    event => {
      if (event.target === elements.projectDialog) {
        closeProjectDialog();
      }
    }
  );
}

/* =========================
   ЗАПУСК ПОРТАЛА
========================= */

function initializePortal() {
  if (!checkRequiredElements()) {
    return;
  }

  loadProjects();
  registerEventListeners();

  const userIsAuthorized =
    sessionStorage.getItem(SESSION_KEY) === "authorized";

  if (userIsAuthorized) {
    showPortal();
  } else {
    showLogin();
  }
}

initializePortal();
