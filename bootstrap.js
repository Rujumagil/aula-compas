(() => {
  const app = document.querySelector('#app');
  const BRAND_HARDFIX_HREF = 'academy-brand-hardfix-v29-2.css?v=29.2.0';
  const USER_CARD_HREF = 'academy-sidebar-user-v29-3.css?v=29.3.0';
  const EXPERIENCE_HREF = 'academy-experience-v30.css?v=30.0.0';
  const LEARNING_HREF = 'academy-learning-v31.css?v=31.0.0';
  const CARD_LEARNING_HREF = 'academy-card-learning-v35.css?v=35.0.1';
  const JOURNEY_HREF = 'academy-premium-journey-v32.css?v=32.0.0';
  const COMMUNITY_HREF = 'academy-premium-community-v33.css?v=33.0.0';
  const PUSH_HREF = 'academy-push-v34.css?v=34.0.0';

  function preservePasswordRecoveryIntent() {
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (hashParams.get('type') !== 'recovery') return;

    const url = new URL(location.href);
    if (url.searchParams.get('type') === 'recovery') return;

    // Supabase procesa y limpia el fragmento de recuperación muy pronto.
    // Conservamos la intención en la query antes de cargar la librería para
    // que app.js pueda mostrar siempre el formulario de nueva contraseña.
    url.searchParams.set('type', 'recovery');
    history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function ensureStylesheet(id, href) {
    let link = document.getElementById(id);
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    return link;
  }

  function ensureVisualLayers() {
    ensureStylesheet('academy-brand-hardfix-v29-2', BRAND_HARDFIX_HREF);
    ensureStylesheet('academy-sidebar-user-v29-3', USER_CARD_HREF);
    ensureStylesheet('academy-experience-v30', EXPERIENCE_HREF);
    ensureStylesheet('academy-learning-v31', LEARNING_HREF);
    ensureStylesheet('academy-card-learning-v35', CARD_LEARNING_HREF);
    ensureStylesheet('academy-premium-journey-v32', JOURNEY_HREF);
    ensureStylesheet('academy-premium-community-v33', COMMUNITY_HREF);
    const push = ensureStylesheet('academy-push-v34', PUSH_HREF);
    if (push !== document.head.lastElementChild) document.head.appendChild(push);
  }

  function renderStatus(title, message, showActions = false) {
    app.innerHTML = `
      <main class="login-screen">
        <section class="login-card glass loading-card">
          <img class="official-lockup" src="brand/academy/icon.svg?v=29.2.0" alt="Compás Academy">
          <h1>${title}</h1>
          <p>${message}</p>
          ${showActions ? `
            <div class="bootstrap-actions">
              <button class="btn btn-primary" id="retry-app">Volver a intentar</button>
              <a class="btn btn-secondary" href="diagnostico.html">Abrir diagnóstico</a>
              <a class="auth-link" href="limpiar-cache.html">Limpiar versión anterior</a>
            </div>` : '<div class="spinner" aria-label="Cargando"></div>'}
        </section>
      </main>`;
    document.querySelector('#retry-app')?.addEventListener('click', () => location.reload());
  }

  function loadScript(src, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        script.remove();
        reject(new Error(`Tiempo agotado al cargar ${src}`));
      }, timeout);

      script.src = src;
      script.async = false;
      script.crossOrigin = 'anonymous';
      script.onload = () => { clearTimeout(timer); resolve(); };
      script.onerror = () => {
        clearTimeout(timer);
        script.remove();
        reject(new Error(`No se pudo cargar ${src}`));
      };
      document.head.appendChild(script);
    });
  }

  async function loadSupabaseLibrary() {
    if (window.supabase?.createClient) return;
    const sources = [
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
      'https://unpkg.com/@supabase/supabase-js@2'
    ];
    let lastError;
    for (const src of sources) {
      try {
        await loadScript(src);
        if (window.supabase?.createClient) return;
        throw new Error('La librería cargó, pero no creó window.supabase.');
      } catch (error) {
        console.warn(error);
        lastError = error;
      }
    }
    throw lastError || new Error('No fue posible cargar Supabase.');
  }

  async function start() {
    preservePasswordRecoveryIntent();
    ensureVisualLayers();
    renderStatus('Compás Academy', 'Preparando tu acceso…');
    try {
      if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.publishableKey) {
        throw new Error('Falta la configuración pública de Supabase.');
      }
      await loadSupabaseLibrary();
      await loadScript('supabase-compat-v1.js?v=1.0.0');

      await loadScript('academy-brand-v29.js?v=29.2.0');
      await loadScript('app.js?v=6.0.15');
      await loadScript('academy-sidebar-user-v29-3.js?v=29.3.0');
      await loadScript('academy-v7.js?v=7.0.0');
      await loadScript('academy-dashboard-v9.js?v=9.0.0');
      await loadScript('academy-ai-v10.js?v=10.0.0');
      await loadScript('academy-assessments-v14.js?v=14.0.0');
      await loadScript('academy-assessment-admin-v15.js?v=15.0.0');
      await loadScript('academy-certificates-v16.js?v=16.0.0');
      await loadScript('academy-notifications-v17.js?v=17.0.0');
      await loadScript('academy-admin-dashboard-v18.js?v=18.0.0');
      await loadScript('academy-onboarding-v19.js?v=19.0.0');
      await loadScript('academy-ai-personalization-v20.js?v=20.0.0');
      await loadScript('academy-community-v21.js?v=21.0.0');
      await loadScript('academy-accessibility-v22.js?v=22.0.0');
      await loadScript('academy-course-landings-v27.js?v=27.0.0');
      await loadScript('academy-experience-v30.js?v=30.0.0');
      await loadScript('academy-learning-v31.js?v=31.0.0');
      await loadScript('academy-card-learning-v35.js?v=35.0.1');
      await loadScript('academy-premium-journey-v32.js?v=32.0.0');
      await loadScript('academy-premium-community-v33.js?v=33.0.0');
      await loadScript('academy-push-v34.js?v=34.1.0');

      ensureVisualLayers();

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js?v=35.0.1', { updateViaCache: 'none' })
          .then(registration => registration.update())
          .catch(error => console.warn('No se pudo actualizar el service worker V35:', error));
      }

      setTimeout(() => {
        if (document.querySelector('.loading-card')) {
          renderStatus('No pudimos iniciar Compás Academy', 'La aplicación tardó más de lo esperado. Abre el diagnóstico para identificar el punto exacto.', true);
        }
      }, 15000);
    } catch (error) {
      console.error('Error de inicio:', error);
      renderStatus('No pudimos cargar Compás Academy', 'La conexión o la versión guardada en el navegador impidió iniciar la página.', true);
    }
  }

  window.addEventListener('error', event => console.error('Error global:', event.error || event.message));
  window.addEventListener('unhandledrejection', event => console.error('Promesa rechazada:', event.reason));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
