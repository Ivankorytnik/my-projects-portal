const AI_EVAL_API = "https://ytdacypygsfalkixhemj.supabase.co/functions/v1/avito-ai-evaluator";

async function aiEvalApi(payload) {
  const res = await fetch(AI_EVAL_API, {
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

function ensureEvaluationProgress() {
  let el = document.getElementById("evaluationProgress");
  if (el) return el;
  const note = document.getElementById("resultNote");
  if (!note) return null;
  el = document.createElement("div");
  el.id = "evaluationProgress";
  el.className = "evaluation-progress";
  el.textContent = "Оценено: —";
  note.insertAdjacentElement("afterend", el);
  return el;
}

function setEvaluationProgress(evaluated, total, pending = null, errors = []) {
  const el = ensureEvaluationProgress();
  if (!el) return;
  const left = pending == null ? Math.max(0, Number(total || 0) - Number(evaluated || 0)) : Number(pending || 0);
  const warning = errors && errors.length ? ` · ошибок пакетов: ${errors.length}` : "";
  el.textContent = `Оценено ${Number(evaluated || 0)} из ${Number(total || 0)} · осталось ${left}${warning}`;
  el.classList.toggle("partial", left > 0 || warning);
  el.classList.toggle("complete", Number(total || 0) > 0 && left === 0 && !warning);
}

function refreshEvaluationProgressFromItems() {
  const total = state.items.length;
  const evaluated = state.items.filter(x => x.ai_score !== null && x.ai_score !== undefined).length;
  setEvaluationProgress(evaluated, total, total - evaluated, []);
}

async function reliableEvaluate(options = {}) {
  if (!state.runId) return;
  const onlyPending = options.onlyPending !== false;
  const auto = options.auto === true;
  const btn = document.getElementById("evaluateBtn");
  if (btn) btn.disabled = true;
  setStatus(auto ? "Довожу AI-оценку…" : "AI оценивает пакетами…", "busy");

  let last = null;
  let pass = 0;
  try {
    while (pass < 2) {
      pass++;
      const data = await aiEvalApi({ action: "evaluate", run_id: state.runId, only_pending: onlyPending });
      last = data;
      state.items = Array.isArray(data.items) ? data.items : state.items;
      applyFilter();
      updateStats();
      setEvaluationProgress(data.evaluated_count, data.total_count, data.pending_count, data.errors || []);
      if (!data.pending_count) break;
      if (pass < 2) {
        setStatus(`Повторяю неоценённые: ${data.pending_count}`, "busy");
        await new Promise(resolve => setTimeout(resolve, 700));
      }
    }

    const pending = Number(last?.pending_count || 0);
    const errors = last?.errors || [];
    if (pending === 0) {
      setStatus("AI-оценка завершена", "ok");
    } else {
      setStatus(`Оценка частично · осталось ${pending}`, "bad");
    }
    if (document.getElementById("exportBtn")) document.getElementById("exportBtn").disabled = !state.items.length;
  } catch (e) {
    setStatus("Ошибка AI-оценки", "bad");
    const note = document.getElementById("resultNote");
    if (note) note.textContent = `Объявления сохранены. AI-оценка не завершена: ${e.message}. Нажмите «Оценить неоценённые».`;
    refreshEvaluationProgressFromItems();
  } finally {
    if (btn) btn.disabled = !state.runId || !state.items.length;
  }
}

function replaceButtonWithoutOldListeners(id) {
  const old = document.getElementById(id);
  if (!old) return null;
  const fresh = old.cloneNode(true);
  old.replaceWith(fresh);
  return fresh;
}

(function installReliableEvaluator() {
  ensureEvaluationProgress();

  const evalBtn = replaceButtonWithoutOldListeners("evaluateBtn");
  if (evalBtn) {
    evalBtn.textContent = "Оценить неоценённые";
    evalBtn.addEventListener("click", () => reliableEvaluate({ onlyPending: true }));
  }

  const parseBtn = replaceButtonWithoutOldListeners("parseBtn");
  if (parseBtn) {
    parseBtn.addEventListener("click", async () => {
      await parse();
      if (state.runId && state.items.length) {
        refreshEvaluationProgressFromItems();
        const pending = state.items.filter(x => x.ai_score === null || x.ai_score === undefined).length;
        if (pending > 0) await reliableEvaluate({ onlyPending: true, auto: true });
      }
    });
  }

  const historyList = document.getElementById("historyList");
  if (historyList) {
    historyList.addEventListener("click", () => setTimeout(refreshEvaluationProgressFromItems, 500));
  }

  const originalRender = renderItems;
  renderItems = function(items = state.filtered) {
    originalRender(items);
    refreshEvaluationProgressFromItems();
  };

  refreshEvaluationProgressFromItems();
})();