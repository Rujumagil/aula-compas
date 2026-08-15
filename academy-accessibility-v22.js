(() => {
  const LIVE_ID = 'academy-route-announcer-v22';
  const GENERATED_TRACK = 'academy-v22-generated-caption';
  let enhanceTimer = null;
  let lastHash = location.hash || '#home';

  const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function ensureLiveRegion() {
    let live = document.getElementById(LIVE_ID);
    if (live) return live;
    live = document.createElement('div');
    live.id = LIVE_ID;
    live.className = 'academy-sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    document.body.appendChild(live);
    return live;
  }

  function ensureMainLandmark() {
    const main = document.querySelector('#app main') || document.querySelector('main');
    if (!main) return null;
    main.id = 'main-content';
    main.setAttribute('role', 'main');
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    return main;
  }

  function textOf(el) {
    return String(el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function inferredControlLabel(el) {
    const direct = el.getAttribute('title') || el.dataset?.label || el.dataset?.title || el.getAttribute('name');
    if (direct) return direct.trim();
    const cls = String(el.className || '').toLowerCase();
    if (cls.includes('close') || cls.includes('cerrar')) return 'Cerrar';
    if (cls.includes('menu')) return 'Abrir menú';
    if (cls.includes('notification') || cls.includes('bell')) return 'Notificaciones';
    if (cls.includes('search')) return 'Buscar';
    if (cls.includes('next')) return 'Siguiente';
    if (cls.includes('prev')) return 'Anterior';
    return '';
  }

  function enhanceControls(root = document) {
    root.querySelectorAll('button, [role="button"]').forEach(el => {
      if (!el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby') && !textOf(el)) {
        const label = inferredControlLabel(el);
        if (label) el.setAttribute('aria-label', label);
      }
    });

    root.querySelectorAll('input, select, textarea').forEach(el => {
      if (el.type === 'hidden' || el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) return;
      if (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) return;
      if (el.closest('label')) return;
      const label = el.getAttribute('placeholder') || el.getAttribute('name');
      if (label) el.setAttribute('aria-label', label);
    });

    root.querySelectorAll('img:not([alt])').forEach(img => img.setAttribute('alt', ''));

    root.querySelectorAll('button svg, a svg, [role="button"] svg').forEach(svg => {
      if (!svg.hasAttribute('aria-hidden')) svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    });

    root.querySelectorAll('iframe:not([title])').forEach(frame => frame.setAttribute('title', 'Contenido multimedia de la lección'));

    root.querySelectorAll('video').forEach(video => {
      video.controls = true;
      video.playsInline = true;
      if (reducedMotion() && video.autoplay) {
        video.autoplay = false;
        video.pause?.();
      }
    });
  }

  function markCurrentNavigation() {
    const current = (location.hash || '#home').replace(/^#/, '').split('/')[0] || 'home';
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      const target = (link.getAttribute('href') || '').replace(/^#/, '').split('/')[0] || 'home';
      if (target === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function currentLesson() {
    const match = (location.hash || '').match(/^#lesson\/([^/]+)\/([^/]+)/);
    if (!match || typeof state === 'undefined' || !Array.isArray(state?.courses)) return null;
    const [, courseId, lessonId] = match;
    const course = state.courses.find(item => String(item.id) === String(courseId));
    if (!course) return null;
    for (const module of course.modules || []) {
      const lesson = (module.lessons || []).find(item => String(item.id) === String(lessonId));
      if (lesson) return { course, module, lesson };
    }
    return null;
  }

  function safeMediaUrl(raw) {
    const value = String(raw || '').trim();
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      if (url.protocol !== 'https:' && url.origin !== location.origin) return '';
      return url.href;
    } catch {
      return '';
    }
  }

  function attachCaptions() {
    const context = currentLesson();
    if (!context?.lesson?.captions_url) return;
    const video = document.querySelector('#main-content video');
    if (!video || video.querySelector(`track[data-${GENERATED_TRACK}]`)) return;
    const src = safeMediaUrl(context.lesson.captions_url);
    if (!src) return;
    const track = document.createElement('track');
    track.kind = 'captions';
    track.srclang = 'es';
    track.label = 'Español';
    track.default = true;
    track.src = src;
    track.setAttribute(`data-${GENERATED_TRACK}`, 'true');
    video.appendChild(track);
  }

  function renderTranscript() {
    document.querySelectorAll('.academy-transcript-v22[data-generated="true"]').forEach(el => el.remove());
    const context = currentLesson();
    const transcript = String(context?.lesson?.transcript_text || '').trim();
    const note = String(context?.lesson?.accessibility_notes || '').trim();
    if (!context || (!transcript && !note)) return;
    const main = ensureMainLandmark();
    if (!main) return;

    const details = document.createElement('details');
    details.className = 'academy-transcript-v22';
    details.dataset.generated = 'true';

    const summary = document.createElement('summary');
    summary.textContent = transcript ? 'Transcripción de la lección' : 'Apoyos de accesibilidad';
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'academy-transcript-v22__body';

    if (transcript) {
      const text = document.createElement('div');
      text.className = 'academy-transcript-v22__text';
      text.textContent = transcript;
      body.appendChild(text);
    }

    if (note) {
      const noteEl = document.createElement('p');
      noteEl.className = 'academy-transcript-v22__note';
      const strong = document.createElement('strong');
      strong.textContent = 'Nota de accesibilidad: ';
      noteEl.append(strong, document.createTextNode(note));
      body.appendChild(noteEl);
    }

    details.appendChild(body);
    main.appendChild(details);
  }

  function activeModal() {
    return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
      .find(el => !el.hidden && el.getClientRects().length > 0) || null;
  }

  function focusableWithin(root) {
    return [...root.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.hidden && el.getClientRects().length > 0);
  }

  function handleDialogKeyboard(event) {
    const dialog = activeModal();
    if (!dialog) return;

    if (event.key === 'Escape') {
      const close = dialog.querySelector('[data-close], [data-dismiss], .modal-close, .dialog-close, [aria-label="Cerrar"]');
      if (close) {
        event.preventDefault();
        close.click();
      }
      return;
    }

    if (event.key !== 'Tab') return;
    const items = focusableWithin(dialog);
    if (!items.length) {
      event.preventDefault();
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function announceRoute() {
    const main = ensureMainLandmark();
    if (!main) return;
    const heading = main.querySelector('h1, h2');
    const label = textOf(heading) || 'Compás Academy';
    const live = ensureLiveRegion();
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = `Página cargada: ${label}`; });
    try { main.focus({ preventScroll: true }); } catch { main.focus(); }
  }

  function enhance({ announce = false } = {}) {
    const main = ensureMainLandmark();
    if (!main) return;
    enhanceControls(document);
    markCurrentNavigation();
    attachCaptions();
    renderTranscript();
    if (announce) announceRoute();
  }

  function scheduleEnhance(options = {}) {
    clearTimeout(enhanceTimer);
    enhanceTimer = setTimeout(() => enhance(options), 40);
  }

  function start() {
    ensureLiveRegion();
    enhance();
    document.addEventListener('keydown', handleDialogKeyboard, true);

    window.addEventListener('hashchange', () => {
      const changed = (location.hash || '#home') !== lastHash;
      lastHash = location.hash || '#home';
      scheduleEnhance({ announce: changed });
    });

    const observer = new MutationObserver(() => scheduleEnhance());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
