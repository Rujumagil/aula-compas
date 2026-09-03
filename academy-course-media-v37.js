(() => {
  const VERSION = '37.0.0';
  const ROOT = 'assets/academy/courses';
  const FALLBACK = 'brand/academy/logo.png?v=34.0.0';

  const MEDIA = Object.freeze({
    'nivel-1-inicio-comercial-compas': {
      card: `${ROOT}/nivel-1/02_nivel-1_inicio-comercial-compas_miniatura.webp?v=${VERSION}`,
      vertical: `${ROOT}/nivel-1/01_nivel-1_inicio-comercial-compas_portada-vertical.webp?v=${VERSION}`,
      continue: `${ROOT}/nivel-1/03_nivel-1_inicio-comercial-compas_continuar-aprendiendo.webp?v=${VERSION}`,
      banner: `${ROOT}/nivel-1/04_nivel-1_inicio-comercial-compas_banner-interno.webp?v=${VERSION}`,
      modules: [
        `${ROOT}/nivel-1/05_modulo-1_fundamentos-comerciales.webp?v=${VERSION}`
      ]
    },
    'nivel-2-captacion-y-ventas-compas': {
      card: `${ROOT}/nivel-2/03_nivel-2_miniatura_800x450.webp?v=${VERSION}`,
      principal: `${ROOT}/nivel-2/01_nivel-2_portada-principal_1600x900.webp?v=${VERSION}`,
      vertical: `${ROOT}/nivel-2/02_nivel-2_portada-vertical_1200x1500.webp?v=${VERSION}`,
      continue: `${ROOT}/nivel-2/04_nivel-2_continuar-aprendiendo_1200x675.webp?v=${VERSION}`,
      banner: `${ROOT}/nivel-2/05_nivel-2_banner-interno_1600x700.webp?v=${VERSION}`,
      modules: [
        `${ROOT}/nivel-2/06_modulo-1_construye-tu-mercado-objetivo_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-2/07_modulo-2_captacion-multicanal_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-2/08_modulo-3_primer-contacto_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-2/09_modulo-4_diagnostico-y-calificacion_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-2/10_modulo-5_presentacion-objeciones-y-cierre_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-2/11_modulo-6_seguimiento-y-disciplina-comercial_1200x800.webp?v=${VERSION}`
      ],
      support: [
        { label: 'Comunidad y acompañamiento', href: '#community', image: `${ROOT}/nivel-2/12_comunidad-acompanamiento_1200x800.webp?v=${VERSION}` },
        { label: 'Recursos descargables', href: '#resources', image: `${ROOT}/nivel-2/13_recursos-descargables_1200x800.webp?v=${VERSION}` },
        { label: 'Evaluación y certificación', href: '#certificates', image: `${ROOT}/nivel-2/14_evaluacion-certificacion_1200x800.webp?v=${VERSION}` }
      ]
    },
    'nivel-3-cartera-permanencia-crecimiento-compas': {
      card: `${ROOT}/nivel-3/03_nivel-3_miniatura_800x450.webp?v=${VERSION}`,
      principal: `${ROOT}/nivel-3/01_nivel-3_portada-principal_1600x900.webp?v=${VERSION}`,
      vertical: `${ROOT}/nivel-3/02_nivel-3_portada-vertical_1200x1500.webp?v=${VERSION}`,
      continue: `${ROOT}/nivel-3/04_nivel-3_continuar-aprendiendo_1200x675.webp?v=${VERSION}`,
      banner: `${ROOT}/nivel-3/05_nivel-3_banner-interno_1600x700.webp?v=${VERSION}`,
      modules: [
        `${ROOT}/nivel-3/06_modulo-1_buena-activacion_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-3/07_modulo-2_cartera-saludable_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-3/08_modulo-3_valor-y-permanencia_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-3/09_modulo-4_crece-con-el-cliente_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-3/10_modulo-5_referidos-reputacion-recuperacion_1200x800.webp?v=${VERSION}`,
        `${ROOT}/nivel-3/11_modulo-6_metricas-y-crecimiento-sostenible_1200x800.webp?v=${VERSION}`
      ]
    }
  });

  const courseById = id => Array.isArray(state?.courses)
    ? state.courses.find(course => String(course.id) === String(id))
    : null;
  const mediaFor = course => MEDIA[String(course?.slug || '')] || null;
  const safe = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '');

  function setImage(img, src, fallback = FALLBACK) {
    if (!img || !src) return;
    if (img.dataset.academyMediaSrc === src) return;
    img.dataset.academyMediaSrc = src;
    img.src = src;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => {
      img.onerror = null;
      img.src = fallback;
      img.classList.add('academy-media-fallback');
    };
  }

  function syncCourseModels() {
    if (!Array.isArray(state?.courses)) return;
    state.courses.forEach(course => {
      const media = mediaFor(course);
      if (!media) return;
      course.academy_media = media;
      course.cover_url = media.card || media.principal || course.cover_url;
    });
  }

  function courseFromAnchor(anchor) {
    const href = anchor?.getAttribute?.('href') || '';
    const match = href.match(/^#course\/([^/]+)/);
    return match ? courseById(match[1]) : null;
  }

  function decorateCards() {
    document.querySelectorAll('a[href^="#course/"]').forEach(anchor => {
      const course = courseFromAnchor(anchor);
      const media = mediaFor(course);
      if (!course || !media) return;
      const container = anchor.closest('.learning-course-card,.course-card,.dash-v9-course,.list-course,.cert-v16-card') || anchor;
      const img = container.querySelector('img');
      if (!img) return;
      const isDashboard = Boolean(container.closest('.dash-v9') || container.classList.contains('dash-v9-course'));
      setImage(img, isDashboard ? (media.continue || media.card) : media.card);
    });
  }

  function decoratePublicCatalog() {
    document.querySelectorAll('#public-program-grid .catalog-card, #public-program-grid .academy-program-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.trim();
      const course = Array.isArray(state?.courses) ? state.courses.find(item => item.title === title) : null;
      const programSlug = Object.keys(MEDIA).find(slug => {
        const known = Array.isArray(window.PUBLIC_PROGRAMS) ? window.PUBLIC_PROGRAMS.find(item => item.slug === slug) : null;
        return known?.title === title;
      });
      const media = mediaFor(course) || MEDIA[programSlug];
      if (!media) return;
      setImage(card.querySelector('img'), media.principal || media.vertical || media.card);
    });
  }

  function courseRoute() {
    const clean = String(location.hash || '').replace(/^#/, '');
    const [page, id] = clean.split('/');
    return page === 'course' ? courseById(id) : null;
  }

  function insertCourseHero(page, course, media) {
    if (!page || !course || !media?.banner || page.querySelector('[data-academy-course-media-hero]')) return;
    const hero = document.createElement('section');
    hero.className = 'academy-course-media-hero';
    hero.dataset.academyCourseMediaHero = 'true';
    hero.innerHTML = `
      <div class="academy-course-media-banner"><img src="${safe(media.banner)}" alt="${safe(course.title)}"></div>
      ${media.vertical ? `<aside class="academy-course-media-poster"><img src="${safe(media.vertical)}" alt="Portada vertical de ${safe(course.title)}"></aside>` : ''}`;
    hero.querySelectorAll('img').forEach(img => setImage(img, img.getAttribute('src')));
    page.prepend(hero);
  }

  function insertModuleImages(page, course, media) {
    if (!page || !course || !Array.isArray(media?.modules)) return;
    const modules = [...page.querySelectorAll('details.module')];
    modules.forEach((moduleNode, index) => {
      const src = media.modules[index];
      if (!src || moduleNode.querySelector('[data-academy-module-media]')) return;
      const imageWrap = document.createElement('div');
      imageWrap.className = 'academy-module-media';
      imageWrap.dataset.academyModuleMedia = String(index + 1);
      imageWrap.innerHTML = `<img src="${safe(src)}" alt="Imagen del módulo ${index + 1} · ${safe(course.title)}">`;
      setImage(imageWrap.querySelector('img'), src);
      moduleNode.querySelector('summary')?.insertAdjacentElement('afterend', imageWrap);
    });
  }

  function insertSupportCards(page, course, media) {
    if (!page || !Array.isArray(media?.support) || !media.support.length || page.querySelector('[data-academy-support-media]')) return;
    const section = document.createElement('section');
    section.className = 'academy-support-media';
    section.dataset.academySupportMedia = 'true';
    section.innerHTML = `<div class="academy-support-media-heading"><span class="eyebrow">Complementa tu formación</span><h2>Recursos del Nivel 2</h2></div><div class="academy-support-media-grid">${media.support.map(item => `<a href="${safe(item.href)}"><img src="${safe(item.image)}" alt="${safe(item.label)}"><strong>${safe(item.label)}</strong><span>Abrir sección →</span></a>`).join('')}</div>`;
    section.querySelectorAll('img').forEach((img, index) => setImage(img, media.support[index]?.image));
    page.append(section);
  }

  function decorateCoursePage() {
    const course = courseRoute();
    if (!course) return;
    const media = mediaFor(course);
    const page = document.querySelector('#page');
    if (!media || !page) return;
    insertCourseHero(page, course, media);
    insertModuleImages(page, course, media);
    insertSupportCards(page, course, media);
  }

  function decorate() {
    syncCourseModels();
    decorateCards();
    decoratePublicCatalog();
    decorateCoursePage();
    document.documentElement.dataset.academyCourseMedia = VERSION;
  }

  try {
    if (typeof cover === 'function') {
      const baseCover = cover;
      cover = function academyMediaCover(course) {
        const media = mediaFor(course);
        return media?.card || media?.principal || baseCover(course);
      };
    }
  } catch (error) {
    console.warn('Academy course media: cover hook', error);
  }

  try {
    if (typeof loadApplicationData === 'function') {
      const baseLoad = loadApplicationData;
      loadApplicationData = async function academyMediaLoad(...args) {
        const result = await baseLoad(...args);
        syncCourseModels();
        return result;
      };
    }
  } catch (error) {
    console.warn('Academy course media: data hook', error);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  };

  function start() {
    schedule();
    window.addEventListener('hashchange', () => setTimeout(schedule, 40));
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.ACADEMY_COURSE_MEDIA_V37 = Object.freeze({ version: VERSION, media: MEDIA, refresh: schedule });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
