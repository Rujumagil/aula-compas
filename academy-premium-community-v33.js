(() => {
  const VERSION = '33.0.0';
  let scheduled = false;

  const visible = element => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };

  function syncTutorSafeArea() {
    const mobileNav = document.querySelector('.mobile-nav');
    const navHeight = visible(mobileNav) ? Math.ceil(mobileNav.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--academy-mobile-nav-height', `${navHeight}px`);
    document.body.classList.toggle('academy-mobile-nav-visible-v33', navHeight > 0);

    const blockingModal = [...document.querySelectorAll(
      '.onboarding-v19-overlay, .avatar-editor-backdrop, [role="dialog"][aria-modal="true"]'
    )].find(visible);
    document.body.classList.toggle('academy-modal-open-v33', Boolean(blockingModal));

    const fab = document.querySelector('.tutor-v10-fab');
    if (fab) {
      fab.setAttribute('aria-label', 'Abrir Tutor IA de Compás Academy');
      fab.setAttribute('title', 'Tutor IA · Compás Academy');
    }

    const panel = document.querySelector('.tutor-v10-panel');
    if (panel) panel.setAttribute('aria-label', 'Tutor IA de Compás Academy');
  }

  function decorateCommunity() {
    const root = document.querySelector('.community-v21');
    if (!root) return;
    document.body.dataset.academySection = 'community';
    root.setAttribute('aria-label', 'Comunidad del curso');
    root.querySelectorAll('.community-v21-thread').forEach((thread, index) => {
      thread.setAttribute('aria-label', `Conversación ${index + 1} de la comunidad`);
    });
  }

  function decorateNotifications() {
    const feed = document.querySelector('.academy-notification-feed');
    if (!feed) return;
    document.body.dataset.academySection = 'notifications';
    document.querySelectorAll('.academy-notification-card').forEach(card => {
      const title = card.querySelector('.academy-notification-title')?.textContent?.trim() || 'Notificación';
      const unread = card.classList.contains('is-unread');
      card.setAttribute('aria-label', `${unread ? 'No leída. ' : ''}${title}`);
    });
    const unread = document.querySelectorAll('.academy-notification-card.is-unread').length;
    const toolbar = document.querySelector('.academy-notification-toolbar');
    if (toolbar) toolbar.dataset.unreadCount = String(unread);
  }

  function decorateLibrary() {
    if (!document.querySelector('.library-page-heading')) return;
    document.body.dataset.academySection = 'library';
    document.title = 'Mi biblioteca | Compás Academy';
    document.querySelectorAll('.library-book-card, .library-material-card').forEach(card => {
      card.setAttribute('data-premium-resource', VERSION);
    });
  }

  function decorateProfile() {
    if (!document.querySelector('.profile-page-heading')) return;
    document.body.dataset.academySection = 'profile';
    document.title = 'Mi perfil | Compás Academy';
    const status = document.querySelector('.profile-status-pill');
    if (status) status.setAttribute('aria-live', 'polite');
  }

  function routeSection() {
    const page = String(location.hash || '#home').replace(/^#/, '').split('/')[0] || 'home';
    if (!['resources', 'profile', 'notifications'].includes(page) && !document.querySelector('.community-v21')) {
      document.body.dataset.academySection = page;
    }
  }

  function run() {
    scheduled = false;
    syncTutorSafeArea();
    routeSection();
    decorateCommunity();
    decorateNotifications();
    decorateLibrary();
    decorateProfile();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  const observer = new MutationObserver(schedule);

  function start() {
    document.documentElement.dataset.academyCommunity = VERSION;
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    window.addEventListener('hashchange', schedule);
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    schedule();
    window.ACADEMY_PREMIUM_COMMUNITY_V33 = Object.freeze({ version: VERSION, refresh: schedule, syncTutorSafeArea });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
