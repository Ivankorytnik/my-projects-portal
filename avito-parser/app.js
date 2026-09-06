const API = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/avito-parser";

const $ = id => document.getElementById(id);
const state = { key: sessionStorage.getItem("hub-parser-key") || "", items: [], filtered: [], runId: null };

function setStatus(text, kind = "") {
  $("serviceStatus").textContent = text;
  $("serviceStatus").className = `status-pill ${kind}`.trim();
}

function money(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value)) + " ₽";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(payload) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-key": state.key },
    body: JSON.stringify(payload)
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`);
    err.data = data;
    throw err;
  }
  return data;
}

function updateStats() {
  const priced = state.items.filter(x => x.price_value != null);
  const avg = priced.length ? priced.reduce((s, x) => s + Number(x.price_value), 0) / priced.length : null;
  $("countStat").textContent = state.items.length;
  $("pricedStat").textContent = priced.length;
  $("avgStat").textContent = avg == null ? "—" : money(avg);
  $("lastStat").textContent = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function renderItems(items = state.filtered) {
  const body = $("resultsBody");
  body.innerHTML = items.map(item => `
    <tr>
      <td><div class="item-cell">${item.image_url ? `<img src="${escapeHtml(item.image_url)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : `<div class="image-placeholder">A</div>`}<div><strong>${escapeHtml(item.title)}</strong>${item.description ? `<small>${escapeHtml(item.description.slice(0, 140))}</small>` : ""}</div></div></td>
      <td>${escapeHtml(item.price_text || (item.price_value != null ? money(item.price_value) : "—"))}</td>
      <td>${escapeHtml(item.location || "—")}</td>
      <td><a href="${escapeHtml(item.item_url)}" target="_blank" rel="noopener noreferrer">Открыть ↗</a></td>
    </tr>`).join("");
  $("emptyState").classList.toggle("hidden", items.length > 0);
  $("resultNote").textContent = items.length ? `Показано: ${items.length}` : "Объявления не найдены.";
}

function applyFilter() {
  const q = $("filterInput").value.trim().toLowerCase();
  state.filtered = !q ? [...state.items] : state.items.filter(x => [x.title, x.location, x.description].some(v => String(v || "").toLowerCase().includes(q)));
  renderItems();
}

async function unlock() {
  const key = $("accessKey").value.trim() || state.key;
  if (!key) return;
  state.key = key;
  $("accessMessage").textContent = "Проверяю доступ…";
  try {
    await api({ action: "history" });
    sessionStorage.setItem("hub-parser-key", key);
    $("accessPanel").classList.add("hidden");
    $("workspace").classList.remove("hidden");
    $("accessMessage").textContent = "";
    setStatus("Готов", "ok");
  } catch (e) {
    $("accessMessage").textContent = e.message;
    setStatus("Нет доступа", "bad");
  }
}

async function parse() {
  const url = $("sourceUrl").value.trim();
  if (!url) return;
  $("parseBtn").disabled = true;
  $("exportBtn").disabled = true;
  setStatus("Сбор данных…", "busy");
  $("resultNote").textContent = "Получаю страницу и извлекаю объявления…";
  try {
    const data = await api({ action: "parse", url });
    state.items = Array.isArray(data.items) ? data.items : [];
    state.filtered = [...state.items];
    state.runId = data.run_id || null;
    renderItems();
    updateStats();
    $("exportBtn").disabled = state.items.length === 0;
    setStatus(`Готово · ${state.items.length}`, "ok");
  } catch (e) {
    state.items = [];
    state.filtered = [];
    renderItems();
    $("resultNote").textContent = e.message;
    setStatus(e.data?.blocked ? "Avito ограничил доступ" : "Ошибка", "bad");
  } finally {
    $("parseBtn").disabled = false;
  }
}

async function showHistory() {
  $("historyPanel").classList.remove("hidden");
  $("historyList").innerHTML = "Загрузка…";
  try {
    const data = await api({ action: "history" });
    const runs = data.runs || [];
    $("historyList").innerHTML = runs.length ? runs.map(run => `
      <button class="history-row" data-run="${escapeHtml(run.id)}">
        <span><strong>${new Date(run.created_at).toLocaleString("ru-RU")}</strong><small>${escapeHtml(run.source_url)}</small></span>
        <span class="history-status ${escapeHtml(run.status)}">${escapeHtml(run.status)} · ${run.item_count}</span>
      </button>`).join("") : "Запусков пока нет.";
  } catch (e) {
    $("historyList").textContent = e.message;
  }
}

async function loadRun(runId) {
  setStatus("Загружаю историю…", "busy");
  try {
    const data = await api({ action: "items", run_id: runId });
    state.items = data.items || [];
    state.filtered = [...state.items];
    state.runId = runId;
    renderItems();
    updateStats();
    $("exportBtn").disabled = state.items.length === 0;
    $("historyPanel").classList.add("hidden");
    setStatus(`История · ${state.items.length}`, "ok");
  } catch (e) { setStatus("Ошибка", "bad"); }
}

function exportCsv() {
  if (!state.filtered.length) return;
  const cols = ["title", "price_text", "price_value", "location", "item_url", "image_url", "description", "published_text"];
  const esc = v => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = "\uFEFF" + [cols.join(";"), ...state.filtered.map(x => cols.map(c => esc(x[c])).join(";"))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `avito_${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

$("unlockBtn").addEventListener("click", unlock);
$("accessKey").addEventListener("keydown", e => { if (e.key === "Enter") unlock(); });
$("parseBtn").addEventListener("click", parse);
$("historyBtn").addEventListener("click", showHistory);
$("closeHistoryBtn").addEventListener("click", () => $("historyPanel").classList.add("hidden"));
$("filterInput").addEventListener("input", applyFilter);
$("exportBtn").addEventListener("click", exportCsv);
$("historyList").addEventListener("click", e => { const row = e.target.closest("[data-run]"); if (row) loadRun(row.dataset.run); });

if (state.key) {
  $("accessKey").value = state.key;
  unlock();
}