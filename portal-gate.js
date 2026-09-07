(() => {
  const PORTAL_PASSWORD_HASH = "0d44baa21856cc5827973d1cb6f62d00070b877de0f544adc1579fc24a0c3b6b";
  const SESSION_KEY = "korytnikHubPortalUnlocked";
  const PASSWORD_LENGTH = 6;

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function unlockPortal(gate) {
    sessionStorage.setItem(SESSION_KEY, "1");
    document.body.classList.remove("portal-locked");
    gate?.remove();
  }

  function createGate() {
    const gate = document.createElement("div");
    gate.className = "portal-gate";
    gate.innerHTML = `
      <div class="portal-gate-card" role="dialog" aria-modal="true" aria-labelledby="portalGateTitle">
        <div class="portal-gate-mark">KH<span>.</span></div>
        <p class="portal-gate-kicker">KORYTNIK HUB</p>
        <h1 id="portalGateTitle">Вход в портал</h1>
        <p class="portal-gate-note">Введите пароль. При совпадении вход выполнится автоматически.</p>
        <label class="portal-gate-label" for="portalGateInput">ПАРОЛЬ</label>
        <input id="portalGateInput" class="portal-gate-input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" aria-label="Пароль для входа в Korytnik Hub" />
        <div id="portalGateError" class="portal-gate-error" role="status"></div>
      </div>`;

    document.body.appendChild(gate);

    const input = gate.querySelector("#portalGateInput");
    const error = gate.querySelector("#portalGateError");
    let checking = false;

    async function checkPassword() {
      if (checking) return;
      const value = input.value.replace(/\D/g, "").slice(0, PASSWORD_LENGTH);
      if (input.value !== value) input.value = value;

      error.textContent = "";
      input.classList.remove("error");

      if (value.length < PASSWORD_LENGTH) return;

      checking = true;
      try {
        const hash = await sha256(value);
        if (hash === PORTAL_PASSWORD_HASH) {
          unlockPortal(gate);
          return;
        }

        input.value = "";
        input.classList.add("error");
        error.textContent = "Неверный пароль";
        input.focus();
      } catch (err) {
        console.error("Portal gate error", err);
        error.textContent = "Не удалось проверить пароль. Обновите страницу.";
      } finally {
        checking = false;
      }
    }

    input.addEventListener("input", checkPassword);
    requestAnimationFrame(() => input.focus());
  }

  function start() {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      document.body.classList.remove("portal-locked");
      return;
    }
    createGate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
