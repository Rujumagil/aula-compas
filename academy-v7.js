(() => {
  const BRAND = {
    name: 'Compás Academy',
    parent: 'Proyecto Compás Evolution',
    logo: 'compas-academia.svg',
    evolution: 'compas-evolution.svg'
  };

  const academyPrograms = [
    {
      title: 'Primeros pasos con Compás One', category: 'Compás One', image: BRAND.logo,
      status: 'Disponible', action: 'Comenzar ruta',
      description: 'Conoce el panel, el CRM, las conversaciones y la lógica de trabajo para comenzar a operar con orden.',
      meta: 'Ruta inicial · Nivel introductorio'
    },
    {
      title: 'CRM y seguimiento comercial', category: 'Ventas', image: BRAND.logo,
      status: 'En preparación',
      description: 'Aprende a convertir contactos en oportunidades con procesos claros, seguimiento y disciplina comercial.',
      meta: 'CRM · Pipeline · Seguimiento'
    },
    {
      title: 'Marketing digital con dirección', category: 'Marketing', image: BRAND.logo,
      status: 'En preparación',
      description: 'Construye una estrategia de contenidos y campañas conectada con objetivos reales de negocio.',
      meta: 'Contenido · Campañas · Métricas'
    },
    {
      title: 'Meta Ads: de campaña a oportunidad', category: 'Meta Ads', image: BRAND.logo,
      status: 'En preparación',
      description: 'Diseña campañas para captar prospectos y llevarlos a un proceso de seguimiento dentro de Compás One.',
      meta: 'Meta Ads · Leads · Conversión'
    },
    {
      title: 'IA aplicada a negocios', category: 'IA', image: BRAND.logo,
      status: 'En preparación',
      description: 'Utiliza asistentes y agentes de IA con criterio, contexto y objetivos concretos para ahorrar tiempo y mejorar la atención.',
      meta: 'IA · Agentes · Productividad'
    },
    {
      title: 'Automatización para equipos pequeños', category: 'Automatización', image: BRAND.logo,
      status: 'En preparación',
      description: 'Identifica tareas repetitivas y conviértelas en flujos simples, medibles y sostenibles.',
      meta: 'Procesos · Flujos · Operación'
    }
  ];

  try {
    if (typeof PUBLIC_PROGRAMS !== 'undefined') {
      PUBLIC_PROGRAMS.splice(0, PUBLIC_PROGRAMS.length, ...academyPrograms);
    }
    if (typeof ACADEMY_EVENTS !== 'undefined') {
      ACADEMY_EVENTS.splice(0, ACADEMY_EVENTS.length);
    }
    if (typeof HELP_TOPICS !== 'undefined') {
      HELP_TOPICS.splice(0, HELP_TOPICS.length,
        ['¿Cómo entro a un curso que tengo asignado?', 'Inicia sesión con tu correo registrado. Si tu cuenta tiene acceso activo, el curso aparecerá en “Mis cursos”.'],
        ['¿Dónde encuentro mis guías y recursos?', 'Abre “Mi biblioteca”. Ahí verás manuales, plantillas, libros y materiales asociados a tus rutas de aprendizaje.'],
        ['¿Cómo recupero mi contraseña?', 'Cierra tu sesión, selecciona “Olvidé mi contraseña” y revisa el enlace enviado a tu correo.'],
        ['No veo un curso que debería tener', 'Escríbenos por WhatsApp con tu nombre y correo de registro para que revisemos tu asignación.'],
        ['¿Puedo usar la academia desde mi celular?', 'Sí. Compás Academy es adaptable y también puedes instalarla desde el botón disponible en tu perfil.'],
        ['¿Cómo obtengo mi certificado?', 'Completa todas las lecciones del curso. Después podrás abrir e imprimir tu certificado desde la sección de certificados.']
      );
    }
  } catch (error) {
    console.warn('No se pudieron actualizar los datos públicos de Academy:', error);
  }

  function academyWordmark(extraClass = '') {
    return `<span class="academy-wordmark ${extraClass}"><img src="${BRAND.logo}" alt="${BRAND.name}"><span><strong>COMPÁS ACADEMY</strong><small>${BRAND.parent}</small></span></span>`;
  }

  function academyProgramCard(program) {
    const available = program.status === 'Disponible';
    return `
      <article class="catalog-card academy-program-card">
        <div class="catalog-card-media academy-program-media">
          <img src="${escapeHtml(program.image)}" alt="${escapeHtml(program.title)}" onerror="imageErrorFallback(event, '${BRAND.logo}')">
          <span class="status-pill ${available ? 'available' : ''}">${escapeHtml(program.status)}</span>
        </div>
        <div class="catalog-card-body">
          <span class="eyebrow">${escapeHtml(program.category)}</span>
          <h3>${escapeHtml(program.title)}</h3>
          <p>${escapeHtml(program.description)}</p>
          <small>${escapeHtml(program.meta)}</small>
          ${available
            ? `<div class="catalog-actions"><a class="btn btn-primary" href="#signup">${escapeHtml(program.action || 'Crear mi cuenta')}</a></div>`
            : '<div class="coming-note">Esta ruta se publicará dentro del catálogo de Compás Academy.</div>'}
        </div>
      </article>`;
  }

  try {
    publicProgramCard = academyProgramCard;
  } catch (error) {
    console.warn('No se pudo sustituir la tarjeta pública:', error);
  }

  try {
    renderAuth = function academyRenderAuth(mode = 'login') {
      const signup = mode === 'signup';
      const recover = mode === 'recover';

      app.innerHTML = `
        <main class="login-screen auth-screen">
          <section class="auth-layout">
            <aside class="auth-story academy-auth-story">
              <a href="https://www.proyectocompas.com/" target="_blank" rel="noopener">${academyWordmark()}</a>
              <span class="eyebrow">Aprender haciendo</span>
              <h2>Capacitación práctica para usar tecnología con dirección.</h2>
              <p>Aprende Compás One, CRM, marketing digital, Meta Ads, inteligencia artificial y automatización con rutas aplicadas a situaciones reales.</p>
              <div class="auth-benefits">
                <span>✓ Cursos, avance y certificados en un solo lugar</span>
                <span>✓ Biblioteca privada de guías, plantillas y recursos</span>
                <span>✓ Formación conectada con el ecosistema Compás Evolution</span>
              </div>
              <div class="auth-story-actions">
                <a class="btn btn-primary" href="#catalog">Conoce los cursos</a>
                <a class="btn btn-secondary" href="https://www.proyectocompas.com/" target="_blank" rel="noopener">Ver Compás Evolution</a>
              </div>
            </aside>

            <section class="login-card glass auth-card">
              <div class="login-brand">
                <img class="official-lockup academy-product-mark" src="${BRAND.logo}" alt="${BRAND.name}">
                <span class="product-kicker">COMPÁS ACADEMY</span>
                <h1>${recover ? 'Recupera tu acceso' : signup ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
                <p>${recover ? 'Te enviaremos un enlace seguro.' : signup ? 'Comienza tu ruta de aprendizaje.' : 'Continúa desde donde te quedaste.'}</p>
              </div>

              ${recover ? `
                <form id="recover-form">
                  <div class="field"><label for="recover-email">Correo electrónico</label><input id="recover-email" name="email" type="email" placeholder="tu-correo@ejemplo.com" required></div>
                  <button class="btn btn-primary" type="submit">Enviar enlace de recuperación</button>
                </form>
                <button class="auth-link" type="button" data-mode="login">← Regresar al acceso</button>
              ` : `
                <form id="auth-form">
                  ${signup ? '<div class="field"><label for="full-name">Nombre completo</label><input id="full-name" name="fullName" autocomplete="name" required></div>' : ''}
                  <div class="field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="email" required></div>
                  <div class="field"><label for="password">Contraseña</label><div class="password-control"><input id="password" name="password" type="password" minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" required><button type="button" data-toggle-password aria-label="Mostrar contraseña">Ver</button></div></div>
                  ${signup ? `
                    <div class="field"><label for="confirm-password">Confirmar contraseña</label><input id="confirm-password" name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></div>
                    <label class="legal-check"><input name="legalAcceptance" type="checkbox" required><span>Acepto el <a href="https://www.proyectocompas.com/aviso-de-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a> y la <a href="https://www.proyectocompas.com/politica-de-cancelacion-y-reembolso.html" target="_blank" rel="noopener">política de cancelación y reembolso</a>.</span></label>
                  ` : '<label class="remember-check"><input type="checkbox" checked><span>Mantener mi sesión en este dispositivo</span></label>'}
                  <button class="btn btn-primary" type="submit">${signup ? 'Crear mi cuenta' : 'Entrar a Academy'}</button>
                </form>
                <div class="auth-options">
                  <button class="auth-link" type="button" data-mode="${signup ? 'login' : 'signup'}">${signup ? 'Ya tengo cuenta' : 'Crear una cuenta'}</button>
                  ${signup ? '' : '<button class="auth-link" type="button" data-mode="recover">Olvidé mi contraseña</button>'}
                </div>
                ${signup ? '<div class="demo-note">Después de registrarte, un administrador podrá asignarte los cursos correspondientes.</div>' : ''}
              `}
            </section>
          </section>
        </main>`;

      document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => renderAuth(button.dataset.mode)));
      document.querySelector('[data-toggle-password]')?.addEventListener('click', event => {
        const input = document.querySelector('#password');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        event.currentTarget.textContent = show ? 'Ocultar' : 'Ver';
      });
      if (recover) document.querySelector('#recover-form')?.addEventListener('submit', handleRecovery);
      else document.querySelector('#auth-form')?.addEventListener('submit', event => handleAuth(event, signup));
    };
  } catch (error) {
    console.warn('No se pudo sustituir la pantalla de acceso:', error);
  }

  try {
    renderPublicCatalog = function academyRenderPublicCatalog(section = '') {
      app.innerHTML = `
        <div class="public-shell academy-public-shell">
          <header class="public-header academy-public-header">
            <a href="#catalog">${academyWordmark('public-academy-wordmark')}</a>
            <nav><a href="#catalog/programs">Programas</a><a href="#catalog/routes">Cómo funciona</a><a href="#catalog/instructor">Instructores</a></nav>
            <a class="btn btn-primary" href="#login">Entrar a Academy</a>
          </header>

          <main>
            <section class="catalog-hero academy-catalog-hero">
              <div class="catalog-hero-copy">
                <span class="eyebrow">Compás Academy · Aprender haciendo</span>
                <h1>Aprende la tecnología que vas a usar para hacer crecer tu proyecto.</h1>
                <p>Formación práctica en Compás One, CRM, marketing digital, Meta Ads, inteligencia artificial y automatización. Menos teoría aislada; más aplicación, seguimiento y resultados.</p>
                <div class="hero-actions"><a class="btn btn-primary" href="#catalog/programs">Conoce los cursos</a><a class="btn btn-secondary" href="#signup">Crear mi cuenta</a></div>
                <div class="catalog-trust academy-trust"><span><strong>01</strong> Aprende</span><span><strong>02</strong> Aplica</span><span><strong>03</strong> Mide</span></div>
              </div>
              <div class="catalog-hero-visual academy-hero-visual">
                <div class="academy-orbit-card"><img src="${BRAND.logo}" alt="${BRAND.name}"><span>CAPACITACIÓN PRÁCTICA</span><strong>Del aprendizaje a la operación</strong><small>Un desarrollo de Proyecto Compás Evolution</small></div>
                <div class="floating-event academy-floating-card"><span>Ruta recomendada</span><strong>Comienza por Compás One</strong><small>CRM · Conversaciones · Seguimiento</small></div>
              </div>
            </section>

            <section class="public-section" id="programs">
              <div class="public-section-heading"><div><span class="eyebrow">Capacitación aplicada</span><h2>Rutas de Compás Academy</h2></div><p>Cada ruta resuelve una necesidad concreta y se conecta con herramientas que puedes utilizar en tu operación diaria.</p></div>
              <div class="catalog-filters">${['Todos','Compás One','Ventas','Marketing','Meta Ads','IA','Automatización'].map((label,index) => `<button class="${index === 0 ? 'active' : ''}" data-public-filter="${label}">${label}</button>`).join('')}</div>
              <section class="catalog-grid" id="public-program-grid">${academyPrograms.map(academyProgramCard).join('')}</section>
            </section>

            <section class="public-book-section academy-route-section" id="routes">
              <div class="academy-route-visual"><img src="${BRAND.evolution}" alt="${BRAND.parent}"></div>
              <div><span class="eyebrow">Parte del ecosistema Compás Evolution</span><h2>Aprendes sobre las herramientas con las que vas a trabajar.</h2><p>Academy no funciona como una plataforma educativa aislada. Está diseñada para acelerar la adopción de Compás One, la inteligencia artificial y los procesos digitales que Proyecto Compás Evolution implementa para sus clientes.</p><ul><li>Onboarding y capacitación de Compás One</li><li>Marketing, Meta Ads y procesos comerciales</li><li>IA y automatización con enfoque práctico</li><li>Evaluaciones, biblioteca y certificados</li></ul><a class="btn btn-primary" href="https://www.proyectocompas.com/" target="_blank" rel="noopener">Conocer Compás Evolution</a></div>
            </section>

            <section class="instructor-section" id="instructor">
              <div class="academy-instructor-mark"><img src="${BRAND.logo}" alt="${BRAND.name}"></div>
              <article><span class="eyebrow">Formación del ecosistema</span><h2>Contenido creado para operar, no solo para mirar.</h2><p>Los cursos de Compás Academy pueden ser impartidos por especialistas, instructores y responsables de producto. La estructura está lista para integrar nuevas rutas, autores, evaluaciones y certificaciones.</p><p class="instructor-future">La academia conserva administración de alumnos, biblioteca privada, progreso, certificados, calendario y control de accesos.</p></article>
            </section>
          </main>

          <footer class="public-footer academy-public-footer"><div>${academyWordmark('footer-academy-wordmark')}<p>Formación práctica para el ecosistema Proyecto Compás Evolution.</p></div><div><a href="https://www.proyectocompas.com/aviso-de-privacidad.html" target="_blank" rel="noopener">Privacidad</a><a href="https://www.proyectocompas.com/terminos-y-condiciones.html" target="_blank" rel="noopener">Términos</a></div></footer>
        </div>`;

      document.querySelectorAll('[data-public-filter]').forEach(button => {
        button.addEventListener('click', () => {
          document.querySelectorAll('[data-public-filter]').forEach(item => item.classList.remove('active'));
          button.classList.add('active');
          const filter = button.dataset.publicFilter;
          const list = filter === 'Todos' ? academyPrograms : academyPrograms.filter(program => program.category === filter);
          document.querySelector('#public-program-grid').innerHTML = list.map(academyProgramCard).join('');
        });
      });

      if (section) requestAnimationFrame(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };
  } catch (error) {
    console.warn('No se pudo sustituir el catálogo público:', error);
  }

  function applyAcademyBrand() {
    document.title = 'Compás Academy | Proyecto Compás Evolution';
    const replacements = [
      [/Aula Compás/g, 'Compás Academy'],
      [/Equipo Proyecto Compás/g, 'Equipo Compás Evolution'],
      [/Academia y biblioteca digital/g, 'Academia tecnológica']
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => { value = value.replace(from, to); });
      if (value !== node.nodeValue) node.nodeValue = value;
    });

    document.querySelectorAll('img.official-lockup, .brand img, .public-brand img').forEach(image => {
      const src = image.getAttribute('src') || '';
      if (/logo-(?:completo|texto)-oficial\.png|logo\.webp/i.test(src)) {
        image.src = BRAND.logo;
        image.alt = BRAND.name;
      }
    });
  }

  let brandingQueued = false;
  const queueBranding = () => {
    if (brandingQueued) return;
    brandingQueued = true;
    requestAnimationFrame(() => {
      brandingQueued = false;
      applyAcademyBrand();
    });
  };

  if (document.body) {
    new MutationObserver(queueBranding).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  document.querySelector('meta[name="description"]')?.setAttribute('content', 'Compás Academy: formación práctica en Compás One, CRM, marketing digital, Meta Ads, inteligencia artificial y automatización.');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#102B3F');

  applyAcademyBrand();
  setTimeout(() => {
    try {
      if (typeof route === 'function') route();
    } catch (error) {
      console.warn('No se pudo refrescar la ruta con Academy V7:', error);
    }
    applyAcademyBrand();
  }, 0);
})();
