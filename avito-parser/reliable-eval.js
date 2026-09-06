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
  const warning = errors && errors.length ? ` · проблемных: ${errors.length}` : "";
  el.textContent = `Оценено ${Number(evaluated || 0)} из ${Number(total || 0)} · осталось ${left}${warning}`;
  el.classList.toggle("partial", left > 0 || !!warning);
  el.classList.toggle("complete", Number(total || 0) > 0 && left === 0 && !warning);
}

function refreshEvaluationProgressFromItems() {
  const total = state.items.length;
  const evaluated = state.items.filter(x => x.ai_score !== null && x.ai_score !== undefined).length;
  setEvaluationProgress(evaluated, total, total - evaluated, []);
}

async function reliableEvaluate(options = {}) {
  if (!state.runId) return;
  const auto = options.auto === true;
  const btn = document.getElementById("evaluateBtn");
  if (btn) btn.disabled = true;

  let last = null;
  let pass = 0;
  let previousPending = Infinity;
  let stalledPasses = 0;
  const maxPasses = 12;

  try {
    while (pass < maxPasses) {
      pass++;
      setStatus(auto ? `AI-оценка · этап ${pass}` : `Оцениваю · этап ${pass}`, "busy");

      const data = await aiEvalApi({ action: "evaluate", run_id: state.runId, only_pending: true });
      last = data;
      state.items = Array.isArray(data.items) ? data.items : state.items;
      applyFilter();
      updateStats();
      setEvaluationProgress(data.evaluated_count, data.total_count, data.pending_count, data.errors || []);

      const pending = Number(data.pending_count || 0);
      if (pending === 0) break;

      if (pending >= previousPending) stalledPasses += 1;
      else stalledPasses = 0;
      previousPending = pending;

      // Даже если один предмет упорно падает, новый evaluator сам дробит пакет
      // вплоть до одиночного объявления. Останавливаемся только после нескольких
      // проходов без прогресса, чтобы не зациклить браузер.
      if (stalledPasses >= 3) break;

      setStatus(`Оценено ${Number(data.evaluated_count || 0)} из ${Number(data.total_count || 0)} · продолжаю`, "busy");
      await new Promise(resolve => setTimeout(resolve, 450));
    }

    const pending = Number(last?.pending_count || 0);
    if (pending === 0) {
      setStatus("AI-оценка завершена", "ok");
    } else if (last) {
      setStatus(`Оценка частично · осталось ${pending}`, "bad");
      const note = document.getElementById("resultNote");
      if (note) note.textContent = `Основная оценка завершена. Осталось ${pending} проблемных объявлений — нажмите «Оценить неоценённые», чтобы повторить только их.`;
    }

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) exportBtn.disabled = !state.items.length;
  } catch (e) {
    setStatus("Ошибка AI-оценки", "bad");
    const note = document.getElementById("resultNote");
    if (note) note.textContent = `Объявления сохранены. AI временно не закончил оценку: ${e.message}. Нажмите «Оценить неоценённые» — уже готовые оценки сохранятся.`;
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
    evalBtn.addEventListener("click", () => reliableEvaluate({ auto: false }));
  }

  const parseBtn = replaceButtonWithoutOldListeners("parseBtn");
  if (parseBtn) {
    parseBtn.addEventListener("click", async () => {
      await parse();
      if (state.runId && state.items.length) {
        refreshEvaluationProgressFromItems();
        const pending = state.items.filter(x => x.ai_score === null || x.ai_score === undefined).length;
        if (pending > 0) await reliableEvaluate({ auto: true });
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