(() => {
  const VERSION = '30.0.0';
  let refreshQueued = false;

  function currentPage() {
    const raw = location.hash.replace(/^#/, '').split('/')[0] || 'home';
    return raw || 'home';
  }

  function isTypingTarget(target) {
    return target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target?.isContentEditable;
  }

  function decorateBrand() {
    const brand = document.querySelector('.sidebar .brand');
    if (!brand) return;
    const strong = brand.querySelector('strong');
    const subtitle = brand.querySelector(':scope > span > span');
    if (strong) strong.textContent = 'COMPÁS';
    if (subtitle) subtitle.textContent = 'ACADEMY';
    brand.setAttribute('aria-label', 'Compás Academy · Inicio');
  }

  function decorateTopbar() {
    const kicker = document.querySelector('.topbar-heading small');
    if (kicker) kicker.textContent = 'COMPÁS ACADEMY';

    const search = document.querySelector('#global-search');
    if (search) {
      search.setAttribute('aria-keyshortcuts', '/');
      search.setAttribute('autocomplete', 'off');
      search.setAttribute('title', 'Presiona / para buscar');
      search.placeholder = 'Buscar cursos, lecciones, recursos o ayuda';
    }
  }

  function decorateNavigation() {
    const label = document.querySelector('.sidebar-label');
    if (label && label.textContent.trim().toUpperCase() === 'MI ESPACIO') {
      label.textContent = 'APRENDIZAJE';
    }

    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
      link.dataset.premiumNav = 'true';
      if (!link.getAttribute('aria-label')) {
        const labelText = [...link.childNodes]
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (labelText) link.setAttribute('aria-label', labelText);
      }
    });
  }

  function decorateUserCard() {
    const card = document.querySelector('.sidebar-bottom .user-mini');
    if (!card) return;
    card.dataset.premiumReady = 'true';
    card.setAttribute('title', 'Abrir mi perfil');
  }

  function decorateDashboard() {
    const greetingMark = document.querySelector('.dash-v9-welcome h1 > span');
    if (greetingMark && /👋/.test(greetingMark.textContent || '')) {
      greetingMark.textContent = '✦';
      greetingMark.classList.add('dash-v30-greeting-mark');
      greetingMark.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.dash-v9-stat').forEach(card => card.dataset.premiumStat = 'true');
    document.querySelectorAll('.dash-v9-course').forEach(card => card.dataset.premiumCourse = 'true');
  }

  function decorate() {
    document.body.classList.add('academy-experience-v30');
    document.body.dataset.academyPage = currentPage();
    decorateBrand();
    decorateTopbar();
    decorateNavigation();
    decorateUserCard();
    decorateDashboard();
  }

  function scheduleDecorate() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      refreshQueued = false;
      decorate();
    });
  }

  function onKeydown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === '/' && !isTypingTarget(event.target)) {
      const search = document.querySelector('#global-search');
      if (!search) return;
      event.preventDefault();
      search.focus();
      search.select?.();
      return;
    }

    if (event.key === 'Escape' && document.activeElement?.id === 'global-search') {
      document.activeElement.value = '';
      document.activeElement.blur();
    }
  }

  function start() {
    decorate();
    addEventListener('hashchange', scheduleDecorate);
    addEventListener('keydown', onKeydown);

    const observer = new MutationObserver(scheduleDecorate);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.ACADEMY_EXPERIENCE_V30 = Object.freeze({ version: VERSION, refresh: decorate });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
