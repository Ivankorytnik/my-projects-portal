(() => {
  const PERSONAL_PASSWORD_HASH = "d4fa52d14b364d30906088714223727bbd26dff83a4380a0e8134e481617dd99";
  let bypassOnce = false;
  let gate = null;
  let input = null;
  let error = null;
  let targetButton = null;

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function ensureGate() {
    if (gate) return;

    const style = document.createElement("style");
    style.textContent = `
      .personal-nav-gate {
        position: fixed; inset: 0; z-index: 99999;
        display: grid; place-items: center;
        background: rgba(8, 15, 28, .48);
        backdrop-filter: blur(8px);
      }
      .personal-nav-gate.hidden { display: none; }
      .personal-nav-gate__card {
        width: min(390px, calc(100vw - 32px));
        background: #fff; border-radius: 20px;
        padding: 28px; box-shadow: 0 24px 70px rgba(0,0,0,.22);
      }
      .personal-nav-gate__card h2 { margin: 0 0 8px; font-size: 24px; }
      .personal-nav-gate__card p { margin: 0 0 18px; color: #667085; }
      .personal-nav-gate__input {
        width: 100%; box-sizing: border-box;
        padding: 14px 16px; border: 1px solid #d0d5dd;
        border-radius: 12px; font: inherit; font-size: 18px;
        letter-spacing: .12em; outline: none;
      }
      .personal-nav-gate__input:focus { border-color: #0a5cff; box-shadow: 0 0 0 3px rgba(10,92,255,.12); }
      .personal-nav-gate__error { min-height: 20px; margin-top: 10px; color: #d92d20; font-size: 13px; }
      .personal-nav-gate__cancel {
        margin-top: 10px; width: 100%; border: 0; background: transparent;
        color: #667085; cursor: pointer; padding: 8px;
      }
    `;
    document.head.appendChild(style);

    gate = document.createElement("div");
    gate.className = "personal-nav-gate hidden";
    gate.innerHTML = `
      <div class="personal-nav-gate__card" role="dialog" aria-modal="true" aria-labelledby="personalNavGateTitle">
        <h2 id="personalNavGateTitle">Личные проекты</h2>
        <p>Введите пароль. При совпадении раздел откроется автоматически.</p>
        <input class="personal-nav-gate__input" type="password" inputmode="numeric" autocomplete="off" placeholder="Пароль" aria-label="Пароль к личным проектам" />
        <div class="personal-nav-gate__error" role="status"></div>
        <button class="personal-nav-gate__cancel" type="button">Отмена</button>
      </div>`;
    document.body.appendChild(gate);

    input = gate.querySelector(".personal-nav-gate__input");
    error = gate.querySelector(".personal-nav-gate__error");

    gate.querySelector(".personal-nav-gate__cancel").addEventListener("click", closeGate);
    gate.addEventListener("click", event => { if (event.target === gate) closeGate(); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !gate.classList.contains("hidden")) closeGate();
    });

    input.addEventListener("input", async () => {
      error.textContent = "";
      const value = input.value.trim();
      if (value.length < 7) return;
      if (value.length > 7) {
        error.textContent = "Неверный пароль";
        return;
      }

      const hash = await sha256(value);
      if (hash !== PERSONAL_PASSWORD_HASH) {
        error.textContent = "Неверный пароль";
        return;
      }

      const button = targetButton;
      closeGate();
      if (!button) return;
      bypassOnce = true;
      button.click();
    });
  }

  function openGate(button) {
    ensureGate();
    targetButton = button;
    input.value = "";
    error.textContent = "";
    gate.classList.remove("hidden");
    requestAnimationFrame(() => input.focus());
  }

  function closeGate() {
    if (!gate) return;
    gate.classList.add("hidden");
    if (input) input.value = "";
    if (error) error.textContent = "";
    targetButton = null;
  }

  document.addEventListener("click", event => {
    const button = event.target.closest('.nav-item[data-view="personal"]');
    if (!button) return;

    if (bypassOnce) {
      bypassOnce = false;
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    openGate(button);
  }, true);
})();
