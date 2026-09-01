"use strict";

const AUTH_STORAGE_KEY = "atom_kp_auth_v1";
const PASSWORD_SHA256 = "6287ba58fa6de029bad426f660c35740588cb4c7b86e737e6f1bed7c5d687e3e";

window.addEventListener("DOMContentLoaded", () => {
  const gate = document.getElementById("authGate");
  const form = document.getElementById("authForm");
  const input = document.getElementById("authPassword");
  const message = document.getElementById("authMessage");
  const content = document.getElementById("appContent");

  const unlock = () => {
    document.body.classList.remove("auth-locked");
    gate.hidden = true;
    content.removeAttribute("aria-hidden");
  };

  if (sessionStorage.getItem(AUTH_STORAGE_KEY) === "ok") {
    unlock();
    return;
  }

  window.setTimeout(() => input.focus(), 50);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "Проверка пароля...";
    message.className = "auth-gate__message";

    try {
      const digest = await sha256(input.value);
      if (digest !== PASSWORD_SHA256) {
        input.value = "";
        input.focus();
        message.textContent = "Неверный пароль.";
        message.className = "auth-gate__message auth-gate__message--error";
        return;
      }

      sessionStorage.setItem(AUTH_STORAGE_KEY, "ok");
      unlock();
    } catch (error) {
      console.error(error);
      message.textContent = "Не удалось проверить пароль. Обновите страницу.";
      message.className = "auth-gate__message auth-gate__message--error";
    }
  });
});

async function sha256(value) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API недоступен");
  }
  const data = new TextEncoder().encode(String(value));
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}
