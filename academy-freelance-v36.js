(() => {
  const VERSION = '36.1.0';
  const FREELANCE_PROGRAMS = [
    {
      slug: 'nivel-1-inicio-comercial-compas',
      title: 'Nivel 1 · Inicio Comercial Compás',
      category: 'Freelance Comercial',
      image: 'brand/academy/logo.png?v=34.0.0',
      status: 'Disponible',
      action: 'Comenzar Nivel 1',
      description: 'Fundamentos para iniciar como Freelance Compás: propuesta, prospección, diagnóstico, seguimiento y disciplina comercial.',
      meta: '4 módulos · 18 lecciones · Ruta inicial'
    },
    {
      slug: 'nivel-2-captacion-y-ventas-compas',
      title: 'Nivel 2 · Captación y Ventas Compás',
      category: 'Freelance Comercial',
      image: 'brand/academy/logo.png?v=34.0.0',
      status: 'Disponible',
      action: 'Continuar Nivel 2',
      description: 'Ruta práctica para convertir mercado, captación, diagnóstico, propuesta, cierre y seguimiento en un proceso comercial medible.',
      meta: '6 módulos · 18 lecciones · Captación y ventas'
    },
    {
      slug: 'nivel-3-cartera-permanencia-crecimiento-compas',
      title: 'Nivel 3 · Cartera, Permanencia y Crecimiento',
      category: 'Freelance Comercial',
      image: 'brand/academy/logo.png?v=34.0.0',
      status: 'Disponible',
      action: 'Continuar Nivel 3',
      description: 'Aprende a acompañar activación, adopción, permanencia, renovaciones, crecimiento responsable, referidos y métricas de cartera.',
      meta: '6 módulos · 18 lecciones · Gestión de cartera'
    },
    {
      slug: 'nivel-4-liderazgo-supervision-comercial',
      title: 'Nivel 4 · Liderazgo y Supervisión Comercial',
      category: 'Freelance Comercial',
      image: 'brand/academy/logo.png?v=34.0.0',
      status: 'Disponible',
      action: 'Continuar Nivel 4',
      description: 'Desarrolla capacidades para coordinar actividad comercial, acompañar personas, revisar indicadores y mejorar la ejecución del equipo.',
      meta: '6 módulos · 18 lecciones · Liderazgo comercial'
    },
    {
      slug: 'nivel-5-direccion-comercial-avanzada-compas',
      title: 'Nivel 5 · Dirección Comercial Avanzada',
      category: 'Freelance Comercial',
      image: 'brand/academy/logo.png?v=34.0.0',
      status: 'Disponible',
      action: 'Continuar Nivel 5',
      description: 'Nivel avanzado para integrar dirección comercial, decisiones de cartera, supervisión y crecimiento dentro del modelo Compás.',
      meta: 'Ruta avanzada · Dirección comercial'
    }
  ];

  const allowedSlugs = new Set(FREELANCE_PROGRAMS.map(course => course.slug));
  const safe = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[ch]);

  function normalizeFreelanceCourses() {
    if (typeof state === 'undefined' || !Array.isArray(state.courses)) return [];
    state.courses = state.courses
      .filter(course => allowedSlugs.has(String(course?.slug || '')) && course?.status === 'published')
      .map(course => ({
        ...course,
        modules: Array.isArray(course?.modules)
          ? course.modules.map(module => ({
              ...module,
              lessons: Array.isArray(module?.lessons) ? module.lessons : []
            }))
          : []
      }));
    return state.courses;
  }

  function fallbackCoursesMarkup(courses, error = null) {
    if (!courses.length) {
      return `
        <section class="empty-state glass">
          <img src="brand/academy/icon.svg?v=29.2.0" alt="" class="empty-logo">
          <h2>No pudimos mostrar tus cursos</h2>
          <p>Tu sesión está activa, pero la lista de cursos no terminó de cargar. Usa Actualizar para volver a consultar tus accesos.</p>
          <button class="btn btn-primary" type="button" data-freelance-retry>Actualizar cursos</button>
        </section>`;
    }

    return `
      <section class="courses-page-heading">
        <div>
          <span class="eyebrow">Ruta Freelance Compás</span>
          <h1 class="page-title">Mis cursos</h1>
          <p class="page-subtitle">Accede a tu capacitación comercial y continúa desde el nivel que estés revisando.</p>
        </div>
      </section>
      ${error ? '<div class="glass" style="padding:14px 18px;margin-bottom:18px"><strong>Vista recuperada automáticamente.</strong><p style="margin:6px 0 0">Detectamos un fallo visual y restauramos tus cursos sin perder tu acceso.</p></div>' : ''}
      <section class="learning-course-list" id="course-grid">
        ${courses.map(course => {
          const lessons = (course.modules || []).flatMap(module => module.lessons || []);
          return `
            <article class="learning-course-card">
              <a class="learning-course-cover" href="#course/${safe(course.id)}" aria-label="Abrir ${safe(course.title)}">
                <img src="brand/academy/logo.png?v=34.0.0" alt="${safe(course.title)}">
              </a>
              <div class="learning-course-body">
                <div class="learning-course-topline"><span class="course-status course-status-new"><i></i>Disponible</span><span class="learning-course-category">Freelance Comercial</span></div>
                <div><h3><a href="#course/${safe(course.id)}">${safe(course.title)}</a></h3><p>${safe(course.subtitle || course.description || '')}</p></div>
                <div class="learning-course-details"><span><small>Contenido</small><strong>${lessons.length} lecciones</strong></span><span><small>Módulos</small><strong>${(course.modules || []).length}</strong></span></div>
                <div class="learning-course-actions"><a class="btn btn-primary learning-primary-action" href="#course/${safe(course.id)}">Abrir curso</a></div>
              </div>
            </article>`;
        }).join('')}
      </section>`;
  }

  function bindFallbackRetry(page) {
    page?.querySelector('[data-freelance-retry]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Actualizando…';
      try {
        if (typeof loadApplicationData === 'function') await loadApplicationData();
        normalizeFreelanceCourses();
        if (typeof renderCourses === 'function') renderCourses();
      } finally {
        button.disabled = false;
        button.textContent = 'Actualizar cursos';
      }
    });
  }

  function recoverBlankCoursesSurface(error = null) {
    const routeName = String(location.hash || '#home').replace(/^#/, '').split('/')[0] || 'home';
    if (routeName !== 'courses') return;
    const page = document.querySelector('#page');
    if (!page) return;
    const courses = normalizeFreelanceCourses();
    const hasExpectedContent = page.querySelector('.courses-page-heading, .learning-course-list, .empty-state, #course-grid');
    if (hasExpectedContent && !error) return;
    page.innerHTML = fallbackCoursesMarkup(courses, error);
    bindFallbackRetry(page);
  }

  try {
    if (typeof PUBLIC_PROGRAMS !== 'undefined') {
      PUBLIC_PROGRAMS.splice(0, PUBLIC_PROGRAMS.length, ...FREELANCE_PROGRAMS);
    }
  } catch (error) {
    console.warn('No se pudo sincronizar el catálogo Freelance:', error);
  }

  try {
    const previousLoadApplicationData = loadApplicationData;
    loadApplicationData = async function freelanceLoadApplicationData(...args) {
      const result = await previousLoadApplicationData(...args);
      normalizeFreelanceCourses();
      return result;
    };
  } catch (error) {
    console.warn('No se pudo reforzar el filtro de cursos Freelance:', error);
  }

  try {
    const previousRenderCourses = renderCourses;
    renderCourses = function freelanceRenderCourses(...args) {
      normalizeFreelanceCourses();
      try {
        const result = previousRenderCourses(...args);
        requestAnimationFrame(() => recoverBlankCoursesSurface());
        return result;
      } catch (error) {
        console.error('Error al renderizar Mis cursos:', error);
        recoverBlankCoursesSurface(error);
        return null;
      }
    };
  } catch (error) {
    console.warn('No se pudo reforzar la vista Mis cursos:', error);
  }

  try {
    const previousRenderPublicCatalog = renderPublicCatalog;
    renderPublicCatalog = function freelanceRenderPublicCatalog(section = '') {
      previousRenderPublicCatalog(section);

      const grid = document.querySelector('#public-program-grid');
      if (grid && typeof publicProgramCard === 'function') {
        grid.innerHTML = FREELANCE_PROGRAMS.map(publicProgramCard).join('');
      }

      document.querySelector('.catalog-filters')?.remove();

      const heroTitle = document.querySelector('.academy-catalog-hero h1');
      if (heroTitle) heroTitle.textContent = 'Capacitación oficial para crecer como Freelance Compás.';

      const heroText = document.querySelector('.academy-catalog-hero .catalog-hero-copy > p');
      if (heroText) heroText.textContent = 'Una ruta progresiva de cinco niveles para aprender captación, ventas, seguimiento, cartera, liderazgo y dirección comercial dentro del ecosistema Compás Evolution.';

      const heroEyebrow = document.querySelector('.academy-catalog-hero .eyebrow');
      if (heroEyebrow) heroEyebrow.textContent = 'Compás Academy · Ruta Freelance';

      const sectionHeading = document.querySelector('#programs .public-section-heading h2');
      if (sectionHeading) sectionHeading.textContent = 'Ruta de capacitación Freelance';

      const sectionText = document.querySelector('#programs .public-section-heading > p');
      if (sectionText) sectionText.textContent = 'Avanza desde los fundamentos comerciales hasta liderazgo y dirección. Cada nivel construye sobre el anterior.';

      const authStoryTitle = document.querySelector('.academy-auth-story h2');
      if (authStoryTitle) authStoryTitle.textContent = 'Tu centro de capacitación como Freelance Compás.';

      const authStoryText = document.querySelector('.academy-auth-story > p');
      if (authStoryText) authStoryText.textContent = 'Aprende el proceso comercial de Compás, registra tu avance y desarrolla las capacidades necesarias para crecer de forma ordenada dentro del ecosistema.';
    };
  } catch (error) {
    console.warn('No se pudo sustituir el catálogo público por la ruta Freelance:', error);
  }

  window.addEventListener('hashchange', () => setTimeout(() => recoverBlankCoursesSurface(), 120));
  setTimeout(() => recoverBlankCoursesSurface(), 1200);
  window.ACADEMY_FREELANCE_V36 = Object.freeze({ version: VERSION, refresh: recoverBlankCoursesSurface });
})();
