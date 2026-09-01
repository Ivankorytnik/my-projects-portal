(() => {
  const PERSONAL_PASSWORD_HASH = "84431d566e76f0fd884a4c1da5f7878f2227f19f1e516394df73cb856e6a2025";

  let gateRoot = null;
  let gateInput = null;
  let gateError = null;
  let gateProject = null;
  let pendingUrl = "";

  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  function setError(message = "") {
    if (!gateError || !gateInput) return;
    gateError.textContent = message;
    gateInput.classList.toggle("error", Boolean(message));
  }

  function closeGate() {
    if (!gateRoot) return;
    gateRoot.classList.add("hidden");
    gateRoot.setAttribute("aria-hidden", "true");
    document.body.classList.remove("personal-gate-open");
    pendingUrl = "";
    if (gateInput) gateInput.value = "";
    setError("");
  }

  function createGate() {
    if (gateRoot) return;

    gateRoot = document.createElement("div");
    gateRoot.className = "personal-gate hidden";
    gateRoot.setAttribute("aria-hidden", "true");
    gateRoot.innerHTML = `
      <div class="personal-gate-card" role="dialog" aria-modal="true" aria-labelledby="personalGateHeading">
        <div class="personal-gate-glow"></div>
        <div class="personal-gate-kicker"><span></span> PRIVATE PROJECT</div>
        <h2 id="personalGateHeading">Личный проект</h2>
        <p class="personal-gate-project" id="personalGateProject"></p>
        <p class="personal-gate-note">Введите пароль для доступа.</p>
        <form class="personal-gate-form" autocomplete="off">
          <label>
            <span>ПАРОЛЬ</span>
            <input class="personal-gate-input" type="password" inputmode="numeric" autocomplete="off" placeholder="•••••" aria-label="Пароль" />
          </label>
          <div class="personal-gate-error" role="status"></div>
          <div class="personal-gate-actions">
            <button class="personal-gate-cancel" type="button">Отмена</button>
            <button class="personal-gate-submit" type="submit">Открыть <span>→</span></button>
          </div>
        </form>
      </div>`;

    document.body.appendChild(gateRoot);
    gateInput = gateRoot.querySelector(".personal-gate-input");
    gateError = gateRoot.querySelector(".personal-gate-error");
    gateProject = gateRoot.querySelector("#personalGateProject");

    gateRoot.querySelector(".personal-gate-cancel").addEventListener("click", closeGate);
    gateRoot.addEventListener("click", event => {
      if (event.target === gateRoot) closeGate();
    });

    gateRoot.querySelector(".personal-gate-form").addEventListener("submit", async event => {
      event.preventDefault();
      const password = gateInput.value.trim();
      if (!password) {
        setError("Введите пароль.");
        return;
      }

      try {
        const hash = await sha256(password);
        if (hash !== PERSONAL_PASSWORD_HASH) {
          gateInput.value = "";
          setError("Неверный пароль.");
          gateInput.focus();
          return;
        }

        const target = pendingUrl;
        closeGate();
        if (target) window.open(target, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Personal gate error", error);
        setError("Не удалось проверить пароль. Обновите страницу.");
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !gateRoot.classList.contains("hidden")) closeGate();
    });
  }

  function openGate(url, projectName) {
    createGate();
    pendingUrl = url;
    gateProject.textContent = projectName || "Личный проект";
    gateInput.value = "";
    setError("");
    gateRoot.classList.remove("hidden");
    gateRoot.setAttribute("aria-hidden", "false");
    document.body.classList.add("personal-gate-open");
    requestAnimationFrame(() => gateInput.focus());
  }

  function isPersonalCard(card) {
    return Boolean(card?.querySelector(".project-type-personal"));
  }

  function handleProtectedClick(event) {
    const link = event.target.closest(".open-link, .github-link");
    if (!link || link.classList.contains("disabled")) return;

    const card = link.closest(".project-card");
    if (!isPersonalCard(card)) return;

    event.preventDefault();
    event.stopPropagation();

    const projectName = card.querySelector("h3")?.textContent?.trim() || "Личный проект";
    openGate(link.href, projectName);
  }

  function start() {
    createGate();
    document.addEventListener("click", handleProtectedClick, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
