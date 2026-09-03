(() => {
  'use strict';

  function addPrompterLink() {
    if (document.getElementById('speechLabPrompterLink')) return;
    const topbarMeta = document.querySelector('.topbar-meta');
    if (!topbarMeta) return;

    const link = document.createElement('a');
    link.id = 'speechLabPrompterLink';
    link.href = './prompter.html';
    link.textContent = 'СУФЛЁР AI';
    link.setAttribute('aria-label', 'Открыть Суфлёр AI');
    Object.assign(link.style, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '42px',
      padding: '0 20px',
      border: '1px solid rgba(45, 214, 255, .45)',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(36, 211, 255, .16), rgba(36, 211, 255, .06))',
      color: '#8eeeff',
      textDecoration: 'none',
      fontSize: '11px',
      fontWeight: '900',
      letterSpacing: '.08em',
      whiteSpace: 'nowrap',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.02)'
    });
    link.addEventListener('mouseenter', () => {
      link.style.background = 'linear-gradient(135deg, #7cecff, #30d5ff)';
      link.style.color = '#031319';
    });
    link.addEventListener('mouseleave', () => {
      link.style.background = 'linear-gradient(135deg, rgba(36, 211, 255, .16), rgba(36, 211, 255, .06))';
      link.style.color = '#8eeeff';
    });

    topbarMeta.insertBefore(link, topbarMeta.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPrompterLink, { once: true });
  } else {
    addPrompterLink();
  }

  const core = document.createElement('script');
  core.src = './app-core-v160.js?build=v1.6.0-prompter-link';
  core.async = false;
  document.head.appendChild(core);
})();
