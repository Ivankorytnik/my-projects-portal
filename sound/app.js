(() => {
  'use strict';

  function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  function removeDuplicatePrompterButtons() {
    const topbar = document.querySelector('.topbar-meta');
    if (!topbar) return;

    const candidates = [...topbar.children].filter((node) => {
      const text = normalizeText(node.textContent);
      const href = node instanceof HTMLAnchorElement ? (node.getAttribute('href') || '') : '';
      return text === 'СУФЛЁР AI' || /prompter\.html/i.test(href);
    });

    if (candidates.length <= 1) return;

    const canonical = candidates.find((node) =>
      node instanceof HTMLAnchorElement && /prompter\.html/i.test(node.getAttribute('href') || '')
    ) || candidates[0];

    candidates.forEach((node) => {
      if (node !== canonical) node.remove();
    });
  }

  function installDuplicateGuard() {
    removeDuplicatePrompterButtons();
    const topbar = document.querySelector('.topbar-meta');
    if (!topbar) return;

    const observer = new MutationObserver(() => removeDuplicatePrompterButtons());
    observer.observe(topbar, { childList: true, subtree: true, characterData: true });

    [0, 50, 150, 500, 1200, 2500].forEach((delay) => {
      setTimeout(removeDuplicatePrompterButtons, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installDuplicateGuard, { once: true });
  } else {
    installDuplicateGuard();
  }

  const core = document.createElement('script');
  core.src = './app-core-v160.js?build=v1.6.0-prompter-link';
  core.async = false;
  core.addEventListener('load', () => {
    removeDuplicatePrompterButtons();
    setTimeout(removeDuplicatePrompterButtons, 100);
    setTimeout(removeDuplicatePrompterButtons, 800);
  });
  document.head.appendChild(core);
})();
