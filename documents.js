(() => {
  const API_URL = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/hub-documents";
  const SUPABASE_URL = "https://ytdacypygsfalkixhemj.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_jVSgQ2sSeDw1VIXD1GmL2Q__BAbIs9F";
  const BUCKET = "hub-documents";
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const storageClient = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const ui = {
    docsButton: document.getElementById("documentsNavButton"),
    workspace: document.getElementById("documentsWorkspace"),
    projectPanels: Array.from(document.querySelectorAll(".main > :not(#documentsWorkspace)")),
    unlock: document.getElementById("documentsUnlock"),
    manager: document.getElementById("documentsManager"),
    accessKey: document.getElementById("documentsAccessKey"),
    unlockButton: document.getElementById("documentsUnlockButton"),
    lockButton: document.getElementById("documentsLockButton"),
    folderTree: document.getElementById("folderTree"),
    breadcrumb: document.getElementById("documentsBreadcrumb"),
    fileList: document.getElementById("documentsFileList"),
    empty: document.getElementById("documentsEmpty"),
    uploadInput: document.getElementById("documentsUploadInput"),
    uploadButton: document.getElementById("documentsUploadButton"),
    newFolderButton: document.getElementById("documentsNewFolderButton"),
    refreshButton: document.getElementById("documentsRefreshButton"),
    status: document.getElementById("documentsStatus"),
    pathLabel: document.getElementById("documentsPathLabel"),
    count: document.getElementById("documentsCount")
  };

  if (!ui.docsButton || !ui.workspace) return;

  const state = {
    key: sessionStorage.getItem("kh-documents-key") || "",
    currentPath: "",
    currentItems: [],
    busy: false
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanName(value) {
    return String(value || "").replace(/[\\<>:"|?*\x00-\x1F]/g, "_").trim();
  }

  function joinPath(parent, name) {
    return [parent, name].filter(Boolean).join("/");
  }

  function setStatus(text = "", type = "") {
    ui.status.textContent = text;
    ui.status.className = `documents-status ${type}`.trim();
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!value) return "0 Б";
    const units = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    return `${(value / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatDate(value) {
    if (!value) return "";
    try {
      return new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
    } catch (_) {
      return "";
    }
  }

  function fileKind(name, mime = "") {
    const ext = String(name).split(".").pop().toLowerCase();
    if (mime.startsWith("image/") || ["jpg","jpeg","png","webp","gif","heic","bmp","tiff"].includes(ext)) return ["IMG", "Фото"];
    if (["xlsx","xls","xlsm","csv"].includes(ext)) return ["XLS", "Excel"];
    if (["doc","docx","rtf"].includes(ext)) return ["DOC", "Word"];
    if (["ppt","pptx"].includes(ext)) return ["PPT", "PowerPoint"];
    if (ext === "pdf") return ["PDF", "PDF"];
    if (["zip","rar","7z"].includes(ext)) return ["ZIP", "Архив"];
    if (["txt","md"].includes(ext)) return ["TXT", "Текст"];
    return ["FILE", ext ? ext.toUpperCase() : "Файл"];
  }

  async function api(action, payload = {}) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-key": state.key
      },
      body: JSON.stringify({ action, ...payload }),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `Ошибка ${response.status}`);
    return data;
  }

  function showDocuments() {
    ui.projectPanels.forEach(panel => panel.classList.add("documents-hidden"));
    ui.workspace.classList.remove("hidden");
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
    ui.docsButton.classList.add("active");
    if (state.key) unlockAndLoad(false);
  }

  function showProjects() {
    ui.workspace.classList.add("hidden");
    ui.projectPanels.forEach(panel => panel.classList.remove("documents-hidden"));
    ui.docsButton.classList.remove("active");
  }

  ui.docsButton.addEventListener("click", showDocuments);
  document.querySelectorAll(".nav-item").forEach(item => item.addEventListener("click", showProjects));

  async function unlockAndLoad(save = true) {
    const key = save ? ui.accessKey.value.trim() : state.key;
    if (!key) {
      ui.unlock.classList.remove("hidden");
      ui.manager.classList.add("hidden");
      return;
    }
    state.key = key;
    setStatus("Проверяю доступ...");
    try {
      await api("list", { path: "" });
      sessionStorage.setItem("kh-documents-key", state.key);
      ui.accessKey.value = "";
      ui.unlock.classList.add("hidden");
      ui.manager.classList.remove("hidden");
      setStatus("");
      state.currentPath = "";
      await refreshAll();
    } catch (error) {
      state.key = "";
      sessionStorage.removeItem("kh-documents-key");
      ui.unlock.classList.remove("hidden");
      ui.manager.classList.add("hidden");
      setStatus(error.message, "error");
    }
  }

  ui.unlockButton.addEventListener("click", () => unlockAndLoad(true));
  ui.accessKey.addEventListener("keydown", event => {
    if (event.key === "Enter") unlockAndLoad(true);
  });
  ui.lockButton.addEventListener("click", () => {
    state.key = "";
    state.currentPath = "";
    sessionStorage.removeItem("kh-documents-key");
    ui.manager.classList.add("hidden");
    ui.unlock.classList.remove("hidden");
    setStatus("");
  });

  async function listPath(path) {
    return await api("list", { path });
  }

  async function buildTree() {
    const nodes = [];
    async function walk(path, depth) {
      if (depth > 8) return [];
      const data = await listPath(path);
      const folders = data.items.filter(item => item.type === "folder");
      const result = [];
      for (const folder of folders) {
        const fullPath = joinPath(path, folder.name);
        result.push({ name: folder.name, path: fullPath, depth });
        result.push(...await walk(fullPath, depth + 1));
      }
      return result;
    }
    nodes.push(...await walk("", 0));
    ui.folderTree.innerHTML = `
      <button class="folder-tree-item ${state.currentPath === "" ? "active" : ""}" data-path="">
        <span class="folder-tree-icon">⌂</span><span>Все документы</span>
      </button>
      ${nodes.map(node => `
        <button class="folder-tree-item ${node.path === state.currentPath ? "active" : ""}" data-path="${escapeHtml(node.path)}" style="--depth:${node.depth}">
          <span class="folder-tree-icon">▸</span><span>${escapeHtml(node.name)}</span>
        </button>`).join("")}`;
  }

  function renderBreadcrumb() {
    const parts = state.currentPath ? state.currentPath.split("/") : [];
    let path = "";
    const buttons = [`<button data-path="">Документы</button>`];
    for (const part of parts) {
      path = joinPath(path, part);
      buttons.push(`<span>/</span><button data-path="${escapeHtml(path)}">${escapeHtml(part)}</button>`);
    }
    ui.breadcrumb.innerHTML = buttons.join("");
    ui.pathLabel.textContent = state.currentPath ? `/${state.currentPath}` : "/";
  }

  function renderFiles() {
    const folders = state.currentItems.filter(item => item.type === "folder");
    const files = state.currentItems.filter(item => item.type === "file");
    ui.count.textContent = `${folders.length} папок · ${files.length} файлов`;
    ui.empty.classList.toggle("hidden", state.currentItems.length > 0);
    ui.fileList.innerHTML = state.currentItems.map(item => {
      const fullPath = joinPath(state.currentPath, item.name);
      if (item.type === "folder") {
        return `<div class="document-row folder-row" data-type="folder" data-path="${escapeHtml(fullPath)}">
          <button class="document-main" data-open-folder="${escapeHtml(fullPath)}">
            <span class="document-icon folder-icon">▰</span>
            <span class="document-info"><strong>${escapeHtml(item.name)}</strong><small>Папка</small></span>
          </button>
          <div class="document-meta"></div>
          <div class="document-actions"><button data-delete-folder="${escapeHtml(fullPath)}" title="Удалить папку">Удалить</button></div>
        </div>`;
      }
      const [badge, kind] = fileKind(item.name, item.mime);
      return `<div class="document-row" data-type="file" data-path="${escapeHtml(fullPath)}">
        <div class="document-main">
          <span class="document-icon">${badge}</span>
          <span class="document-info"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong><small>${escapeHtml(kind)}</small></span>
        </div>
        <div class="document-meta"><span>${formatBytes(item.size)}</span><span>${formatDate(item.updated_at)}</span></div>
        <div class="document-actions">
          <button class="download" data-download="${escapeHtml(fullPath)}">Скачать</button>
          <button data-delete-file="${escapeHtml(fullPath)}">Удалить</button>
        </div>
      </div>`;
    }).join("");
  }

  async function loadCurrentPath() {
    const data = await listPath(state.currentPath);
    state.currentItems = data.items;
    renderBreadcrumb();
    renderFiles();
  }

  async function refreshAll() {
    if (state.busy) return;
    state.busy = true;
    setStatus("Обновляю...");
    try {
      await loadCurrentPath();
      await buildTree();
      setStatus("");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      state.busy = false;
    }
  }

  async function openFolder(path) {
    state.currentPath = path || "";
    await refreshAll();
  }

  ui.folderTree.addEventListener("click", event => {
    const button = event.target.closest("button[data-path]");
    if (button) openFolder(button.dataset.path);
  });
  ui.breadcrumb.addEventListener("click", event => {
    const button = event.target.closest("button[data-path]");
    if (button) openFolder(button.dataset.path);
  });

  ui.newFolderButton.addEventListener("click", async () => {
    const raw = prompt("Название новой папки:");
    const name = cleanName(raw);
    if (!name) return;
    setStatus("Создаю папку...");
    try {
      await api("create-folder", { path: state.currentPath, name });
      await refreshAll();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  ui.uploadButton.addEventListener("click", () => ui.uploadInput.click());
  ui.uploadInput.addEventListener("change", async () => {
    const files = Array.from(ui.uploadInput.files || []);
    if (!files.length) return;
    ui.uploadInput.value = "";
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (file.size > MAX_FILE_SIZE) {
        setStatus(`${file.name}: больше 50 МБ`, "error");
        continue;
      }
      const name = cleanName(file.name);
      try {
        setStatus(`Загрузка ${index + 1}/${files.length}: ${file.name}`);
        const signed = await api("upload-url", { path: state.currentPath, name });
        const { error } = await storageClient.storage.from(BUCKET).uploadToSignedUrl(
          signed.path,
          signed.token,
          file,
          { contentType: file.type || "application/octet-stream" }
        );
        if (error) throw error;
      } catch (error) {
        setStatus(`${file.name}: ${error.message}`, "error");
      }
    }
    await refreshAll();
  });

  ui.refreshButton.addEventListener("click", refreshAll);

  ui.fileList.addEventListener("click", async event => {
    const folderButton = event.target.closest("[data-open-folder]");
    if (folderButton) return openFolder(folderButton.dataset.openFolder);

    const downloadButton = event.target.closest("button[data-download]");
    if (downloadButton) {
      try {
        setStatus("Готовлю скачивание...");
        const data = await api("download-url", { path: downloadButton.dataset.download });
        window.location.href = data.url;
        setStatus("");
      } catch (error) {
        setStatus(error.message, "error");
      }
      return;
    }

    const deleteFile = event.target.closest("button[data-delete-file]");
    if (deleteFile) {
      const name = deleteFile.dataset.deleteFile.split("/").pop();
      if (!confirm(`Удалить файл «${name}»?`)) return;
      try {
        setStatus("Удаляю файл...");
        await api("delete-file", { path: deleteFile.dataset.deleteFile });
        await refreshAll();
      } catch (error) {
        setStatus(error.message, "error");
      }
      return;
    }

    const deleteFolder = event.target.closest("button[data-delete-folder]");
    if (deleteFolder) {
      const name = deleteFolder.dataset.deleteFolder.split("/").pop();
      if (!confirm(`Удалить папку «${name}» и ВСЕ файлы внутри?`)) return;
      try {
        setStatus("Удаляю папку...");
        await api("delete-folder", { path: deleteFolder.dataset.deleteFolder });
        await refreshAll();
      } catch (error) {
        setStatus(error.message, "error");
      }
    }
  });
})();
