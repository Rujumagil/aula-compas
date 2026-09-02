(() => {
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
      if (typeof state !== 'undefined' && Array.isArray(state.courses)) {
        state.courses = state.courses.filter(course =>
          allowedSlugs.has(String(course?.slug || '')) && course?.status === 'published'
        );
      }
      return result;
    };
  } catch (error) {
    console.warn('No se pudo reforzar el filtro de cursos Freelance:', error);
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
})();
