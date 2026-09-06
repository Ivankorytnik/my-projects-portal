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

function fallbackCountFromItems() {
  return state.items.filter(x => String(x.ai_reason || "").startsWith("Резервная оценка")).length;
}

function setEvaluationProgress(evaluated, total, pending = null, fallbackCount = 0, model = "") {
  const el = ensureEvaluationProgress();
  if (!el) return;
  const left = pending == null ? Math.max(0, Number(total || 0) - Number(evaluated || 0)) : Number(pending || 0);
  const reserve = Number(fallbackCount || 0) > 0 ? ` · резервных: ${Number(fallbackCount)}` : "";
  const modelText = model ? ` · ${model}` : "";
  el.textContent = `Оценено ${Number(evaluated || 0)} из ${Number(total || 0)} · осталось ${left}${reserve}${modelText}`;
  el.classList.toggle("partial", left > 0 || Number(fallbackCount || 0) > 0);
  el.classList.toggle("complete", Number(total || 0) > 0 && left === 0 && Number(fallbackCount || 0) === 0);
}

function refreshEvaluationProgressFromItems() {
  const total = state.items.length;
  const evaluated = state.items.filter(x => x.ai_score !== null && x.ai_score !== undefined).length;
  setEvaluationProgress(evaluated, total, total - evaluated, fallbackCountFromItems(), "");
}

function quotaMessage(data) {
  const code = String(data?.error_code || "");
  const msg = String(data?.error_message || "");
  if (code === "credit_balance_exhausted" || /no credits remaining|insufficient_quota|credit balance/i.test(msg)) {
    return "OpenAI API: закончились кредиты. Сейчас показана резервная оценка. После пополнения нажмите «Повторить AI-оценку».";
  }
  if (code === "rate_limit_exceeded" || /rate limit/i.test(msg)) {
    return "OpenAI API временно достиг лимита запросов. Сейчас показана резервная оценка. Повторите AI-оценку позже.";
  }
  return msg ? `OpenAI временно недоступен: ${msg}` : "OpenAI временно недоступен. Показана резервная оценка.";
}

async function reliableEvaluate(options = {}) {
  if (!state.runId) return;
  const auto = options.auto === true;
  const retryFallback = options.retryFallback === true;
  const btn = document.getElementById("evaluateBtn");
  if (btn) btn.disabled = true;

  let last = null;
  let pass = 0;
  const maxPasses = 30;

  try {
    while (pass < maxPasses) {
      pass++;
      setStatus(auto ? `AI-оценка · этап ${pass}` : `Оцениваю · этап ${pass}`, "busy");

      const data = await aiEvalApi({
        run_id: state.runId,
        retry_fallback: retryFallback
      });
      last = data;
      state.items = Array.isArray(data.items) ? data.items : state.items;
      applyFilter();
      updateStats();
      setEvaluationProgress(data.evaluated_count, data.total_count, data.pending_count, data.fallback_count || 0, data.model || "");

      if (data.used_fallback) {
        setStatus("Резервная оценка", "bad");
        const note = document.getElementById("resultNote");
        if (note) note.textContent = quotaMessage(data);
        if (btn) btn.textContent = "Повторить AI-оценку";
        break;
      }

      const pending = Number(data.pending_count || 0);
      const fallback = Number(data.fallback_count || 0);
      if (pending === 0 && (!retryFallback || fallback === 0)) break;

      setStatus(`Оценено ${Number(data.evaluated_count || 0)} из ${Number(data.total_count || 0)} · продолжаю`, "busy");
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    if (last && !last.used_fallback) {
      const pending = Number(last.pending_count || 0);
      const fallback = Number(last.fallback_count || 0);
      if (pending === 0 && fallback === 0) {
        setStatus("AI-оценка завершена", "ok");
        const note = document.getElementById("resultNote");
        if (note) note.textContent = `AI-оценка завершена для всех ${Number(last.total_count || state.items.length)} объявлений.`;
        if (btn) btn.textContent = "Переоценить резервные";
      } else if (pending > 0) {
        setStatus(`Оценка частично · осталось ${pending}`, "bad");
      }
    }

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) exportBtn.disabled = !state.items.length;
  } catch (e) {
    setStatus("Ошибка AI-оценки", "bad");
    const note = document.getElementById("resultNote");
    if (note) note.textContent = `Объявления сохранены. Ошибка AI: ${e.message}`;
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
    evalBtn.addEventListener("click", () => reliableEvaluate({ auto: false, retryFallback: true }));
  }

  const parseBtn = replaceButtonWithoutOldListeners("parseBtn");
  if (parseBtn) {
    parseBtn.addEventListener("click", async () => {
      await parse();
      if (state.runId && state.items.length) {
        refreshEvaluationProgressFromItems();
        const pending = state.items.filter(x => x.ai_score === null || x.ai_score === undefined).length;
        if (pending > 0) await reliableEvaluate({ auto: true, retryFallback: false });
      }
    });
  }

  const historyList = document.getElementById("historyList");
  if (historyList) historyList.addEventListener("click", () => setTimeout(() => {
    refreshEvaluationProgressFromItems();
    if (fallbackCountFromItems() > 0 && evalBtn) evalBtn.textContent = "Повторить AI-оценку";
  }, 500));

  const originalRender = renderItems;
  renderItems = function(items = state.filtered) {
    originalRender(items);
    refreshEvaluationProgressFromItems();
  };

  refreshEvaluationProgressFromItems();
})();