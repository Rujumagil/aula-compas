(() => {
  const VERSION = '27.0.0';
  const BRAND_LOGO = 'brand/academy/logo.png?v=11.1.0';

  const courses = [
    {
      slug: 'primeros-pasos-compas-one',
      title: 'Primeros pasos con Compás One',
      category: 'Compás One',
      status: 'Disponible',
      subtitle: 'Conoce la plataforma y empieza a operar con orden.',
      description: 'Ruta de onboarding para comprender el panel, el CRM, las conversaciones y el flujo básico de seguimiento en Compás One.',
      duration: '60–90 min',
      level: 'Introductorio',
      audience: ['Nuevos usuarios de Compás One','Equipos comerciales que necesitan una forma clara de empezar','Responsables de atención, seguimiento o administración de prospectos'],
      outcomes: ['Ubicar las áreas principales de Compás One y entender para qué sirve cada una.','Registrar y organizar contactos dentro del CRM sin perder contexto.','Comprender el flujo básico entre conversaciones, seguimiento y oportunidad.','Establecer una rutina inicial de operación para trabajar con orden.'],
      syllabus: [['01','Tu espacio de trabajo','Panel, navegación y lógica general del ecosistema.'],['02','CRM y contactos','Cómo registrar, consultar y organizar prospectos.'],['03','Conversaciones','Contexto, atención y continuidad de cada contacto.'],['04','Seguimiento comercial','Prioridades, próximos pasos y disciplina operativa.'],['05','Tu rutina en Compás One','Qué revisar y qué actualizar para mantener el sistema útil.']],
      prerequisites: 'No necesitas experiencia previa con CRM. Solo una cuenta de Compás One con acceso activo.',
      format: 'Ruta práctica · Lecciones breves · Recursos de apoyo · Tutor IA'
    },
    {
      slug: 'crm-seguimiento-comercial',
      title: 'CRM y seguimiento comercial', category: 'Ventas', status: 'En preparación',
      subtitle: 'Convierte contactos en oportunidades con un proceso claro.',
      description: 'Formación práctica para registrar prospectos, organizar prioridades, dar seguimiento y medir avances comerciales.',
      duration: '2 h', level: 'Inicial–intermedio',
      audience: ['Emprendedores y equipos de ventas','Negocios que reciben prospectos desde redes, formularios o campañas','Usuarios de Compás One que quieren ordenar su proceso comercial'],
      outcomes: ['Distinguir contacto, prospecto, oportunidad y siguiente acción.','Construir un pipeline sencillo que refleje el proceso real de venta.','Definir criterios de prioridad y seguimiento.','Usar el CRM para reducir oportunidades olvidadas.'],
      syllabus: [['01','Del contacto a la oportunidad','Qué información conservar y cómo clasificarla.'],['02','Pipeline comercial','Etapas, prioridades y criterios de avance.'],['03','Seguimiento que sí se cumple','Próximas acciones, fechas y contexto.'],['04','Disciplina de CRM','Rutinas para mantener los datos útiles.'],['05','Lectura del proceso','Qué medir para detectar cuellos de botella.']],
      prerequisites: 'Recomendado: haber completado “Primeros pasos con Compás One”.',
      format: 'Ruta práctica · Casos comerciales · Plantillas · Tutor IA'
    },
    {
      slug: 'marketing-digital-con-direccion',
      title: 'Marketing digital con dirección', category: 'Marketing', status: 'En preparación',
      subtitle: 'Conecta contenido, campañas y objetivos de negocio.',
      description: 'Ruta para planear contenido, campañas y métricas con un enfoque conectado al proceso comercial.',
      duration: '2 h', level: 'Inicial',
      audience: ['Emprendedores y pequeñas empresas','Responsables de contenido y campañas','Negocios que publican en redes sin una ruta clara hacia la venta'],
      outcomes: ['Definir objetivos de marketing conectados con resultados de negocio.','Ordenar temas de contenido según la etapa del cliente.','Relacionar campañas con captación y seguimiento.','Seleccionar métricas útiles en lugar de medir solo alcance o interacción.'],
      syllabus: [['01','Objetivo antes que publicación','Qué debe lograr el marketing.'],['02','Mensaje y propuesta de valor','Qué decir, a quién y para qué.'],['03','Contenido con función','Atracción, confianza, decisión y seguimiento.'],['04','Campañas conectadas al CRM','Cómo evitar prospectos aislados.'],['05','Métricas con dirección','Indicadores para aprender y ajustar.']],
      prerequisites: 'No requiere experiencia técnica. Es útil contar con un proyecto, servicio o producto real.',
      format: 'Ruta práctica · Ejercicios · Plantillas · Tutor IA'
    },
    {
      slug: 'meta-ads-campana-oportunidad',
      title: 'Meta Ads: de campaña a oportunidad', category: 'Meta Ads', status: 'En preparación',
      subtitle: 'Captación con seguimiento, no campañas aisladas.',
      description: 'Aprende a estructurar campañas para captar prospectos y llevarlos a un proceso de seguimiento dentro de Compás One.',
      duration: '2–3 h', level: 'Inicial–intermedio',
      audience: ['Negocios que quieren captar prospectos con Meta Ads','Personas que ya publican anuncios pero no tienen seguimiento ordenado','Equipos que conectarán campañas con Compás One'],
      outcomes: ['Elegir el objetivo de campaña según la acción que necesitas generar.','Preparar una oferta, audiencia y mensaje coherentes.','Diseñar el paso posterior al anuncio para evitar perder prospectos.','Conectar captación, CRM y seguimiento comercial.'],
      syllabus: [['01','Fundamentos de campaña','Objetivo, oferta y ruta del prospecto.'],['02','Audiencias y mensaje','Coherencia entre problema, promesa y creatividad.'],['03','Captación de leads','Formularios, páginas y puntos de entrada.'],['04','Del lead al CRM','Recepción, clasificación y seguimiento en Compás One.'],['05','Medición y mejora','Costo, calidad del prospecto y conversión.']],
      prerequisites: 'Cuenta de Meta Business recomendada. No necesitas ser especialista en publicidad.',
      format: 'Ruta aplicada · Ejemplos · Checklist de campaña · Tutor IA'
    },
    {
      slug: 'ia-aplicada-negocios',
      title: 'IA aplicada a negocios', category: 'IA', status: 'En preparación',
      subtitle: 'Usa inteligencia artificial con contexto y propósito.',
      description: 'Introducción práctica al uso de asistentes y agentes para atención, contenido, análisis y productividad.',
      duration: '2 h', level: 'Inicial',
      audience: ['Emprendedores y equipos pequeños','Personas que quieren ahorrar tiempo sin perder criterio','Usuarios que trabajarán con agentes dentro del ecosistema Compás'],
      outcomes: ['Distinguir tareas adecuadas para un asistente o agente de IA.','Dar contexto e instrucciones más útiles para obtener mejores resultados.','Usar IA en atención, contenido, análisis y operación.','Reconocer cuándo una respuesta debe revisarse o escalarse a una persona.'],
      syllabus: [['01','IA con una función concreta','Elegir problemas útiles antes de elegir herramientas.'],['02','Contexto e instrucciones','Cómo pedir mejor y reducir respuestas genéricas.'],['03','Asistentes y agentes','Diferencias, alcance y responsabilidades.'],['04','Aplicaciones en negocio','Atención, ventas, contenido y análisis.'],['05','Control y criterio humano','Validación, privacidad y límites.']],
      prerequisites: 'No requiere conocimientos de programación.',
      format: 'Ruta práctica · Prompts de trabajo · Casos · Tutor IA'
    },
    {
      slug: 'automatizacion-equipos-pequenos',
      title: 'Automatización para equipos pequeños', category: 'Automatización', status: 'En preparación',
      subtitle: 'Convierte tareas repetitivas en flujos simples y medibles.',
      description: 'Ruta para detectar tareas repetitivas, diseñar disparadores y construir automatizaciones sostenibles.',
      duration: '2 h', level: 'Inicial',
      audience: ['Equipos pequeños con tareas manuales repetitivas','Emprendedores que quieren ordenar procesos antes de automatizar','Usuarios de Compás One interesados en flujos operativos'],
      outcomes: ['Detectar procesos que vale la pena automatizar.','Separar disparadores, condiciones, acciones y excepciones.','Diseñar automatizaciones pequeñas antes de crear flujos complejos.','Definir controles para saber si una automatización está funcionando.'],
      syllabus: [['01','Qué automatizar y qué no','Frecuencia, riesgo y valor del proceso.'],['02','Mapa del flujo','Disparadores, condiciones y acciones.'],['03','Automatizaciones pequeñas','Comenzar con procesos fáciles de controlar.'],['04','Excepciones y escalamiento','Cuándo debe intervenir una persona.'],['05','Medición y mantenimiento','Errores, resultados y mejora continua.']],
      prerequisites: 'No requiere programación. Conviene conocer el proceso que deseas mejorar.',
      format: 'Ruta práctica · Mapas de proceso · Checklist · Tutor IA'
    }
  ];

  function normalize(value = '') {
    return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  }

  const bySlug = new Map(courses.map(course => [course.slug, course]));
  const byTitle = new Map(courses.map(course => [normalize(course.title), course]));
  const courseUrl = course => `curso.html?curso=${encodeURIComponent(course.slug)}`;

  function decorateCatalogCards(root = document) {
    const cards = root.querySelectorAll?.('.academy-program-card') || [];
    cards.forEach(card => {
      if (card.dataset.courseLandingV27 === 'ready') return;
      const course = byTitle.get(normalize(card.querySelector('h3')?.textContent || ''));
      if (!course) return;
      card.dataset.courseLandingV27 = 'ready';
      const body = card.querySelector('.catalog-card-body') || card;
      let actions = body.querySelector('.catalog-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'catalog-actions catalog-detail-actions';
        body.appendChild(actions);
      }
      if (!actions.querySelector('[data-course-detail-v27]')) {
        const link = document.createElement('a');
        link.className = 'btn btn-secondary catalog-detail-link';
        link.href = courseUrl(course);
        link.dataset.courseDetailV27 = course.slug;
        link.textContent = 'Ver programa';
        actions.appendChild(link);
      }
    });
  }

  function updateMetadata(course) {
    document.title = `${course.title} | Compás Academy`;
    const description = `${course.subtitle} ${course.description}`.trim();
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${course.title} | Compás Academy`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `https://aula.proyectocompas.com/${courseUrl(course)}`);
    document.querySelector('#academy-course-schema-v27')?.remove();
    const schema = document.createElement('script');
    schema.id = 'academy-course-schema-v27';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({'@context':'https://schema.org','@type':'Course',name:course.title,description:course.description,provider:{'@type':'Organization',name:'Compás Academy',url:'https://aula.proyectocompas.com/'},educationalLevel:course.level});
    document.head.appendChild(schema);
  }

  function renderCourseLanding() {
    const root = document.querySelector('#course-landing-app');
    if (!root) return;
    const course = bySlug.get(new URLSearchParams(location.search).get('curso') || '');
    if (!course) {
      root.innerHTML = `<main class="course-public-shell course-not-found"><a class="course-brand-link" href="index.html#catalog"><img src="${BRAND_LOGO}" alt="Compás Academy"><span><strong>COMPÁS ACADEMY</strong><small>Proyecto Compás Evolution</small></span></a><section class="course-not-found-card"><span class="course-eyebrow">Catálogo</span><h1>Esta ruta no está disponible.</h1><p>Regresa al catálogo para consultar los programas actuales de Compás Academy.</p><a class="course-btn course-btn-primary" href="index.html#catalog">Volver al catálogo</a></section></main>`;
      return;
    }

    updateMetadata(course);
    const available = course.status === 'Disponible';
    const syllabusLabel = available ? 'Contenido de la ruta' : 'Temario previsto';
    root.innerHTML = `<div class="course-public-shell">
      <header class="course-public-header"><a class="course-brand-link" href="index.html#catalog"><img src="${BRAND_LOGO}" alt="Compás Academy"><span><strong>COMPÁS ACADEMY</strong><small>Proyecto Compás Evolution</small></span></a><nav aria-label="Navegación del curso"><a href="#aprendizaje">Aprendizaje</a><a href="#programa">Programa</a><a href="#requisitos">Requisitos</a></nav><a class="course-header-login" href="index.html#login">Entrar a Academy</a></header>
      <main id="main-content">
        <section class="course-detail-hero"><div class="course-detail-copy"><a class="course-back-link" href="index.html#catalog">← Volver al catálogo</a><div class="course-badges"><span>${escapeHtml(course.category)}</span><span class="${available ? 'is-available' : 'is-preparing'}">${escapeHtml(course.status)}</span></div><h1>${escapeHtml(course.title)}</h1><p class="course-lead">${escapeHtml(course.subtitle)}</p><p class="course-description">${escapeHtml(course.description)}</p><div class="course-hero-actions">${available ? '<a class="course-btn course-btn-primary" href="index.html#signup">Crear mi cuenta</a><a class="course-btn course-btn-secondary" href="index.html#login">Ya tengo cuenta</a>' : '<a class="course-btn course-btn-primary" href="index.html#catalog">Ver otras rutas</a><a class="course-btn course-btn-secondary" href="index.html#login">Entrar a Academy</a>'}</div></div>
        <aside class="course-summary-card" aria-label="Resumen de la ruta"><img src="${BRAND_LOGO}" alt=""><span class="course-eyebrow">Aprender haciendo</span><dl><div><dt>Nivel</dt><dd>${escapeHtml(course.level)}</dd></div><div><dt>Duración</dt><dd>${escapeHtml(course.duration)}</dd></div><div><dt>Modalidad</dt><dd>En línea</dd></div><div><dt>Soporte</dt><dd>Tutor IA</dd></div></dl><p>${escapeHtml(course.format)}</p></aside></section>
        <section class="course-detail-section" id="aprendizaje"><div class="course-section-heading"><span class="course-eyebrow">Resultados de aprendizaje</span><h2>Lo que podrás hacer al terminar esta ruta</h2></div><div class="course-outcomes-grid">${course.outcomes.map((item,index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><p>${escapeHtml(item)}</p></article>`).join('')}</div></section>
        <section class="course-detail-section course-program-section" id="programa"><div class="course-section-heading"><span class="course-eyebrow">${escapeHtml(syllabusLabel)}</span><h2>Una ruta diseñada para llevar la teoría a la operación</h2>${available ? '' : '<p>Esta ruta todavía está en preparación. El temario puede ajustarse antes de su publicación definitiva.</p>'}</div><div class="course-syllabus">${course.syllabus.map(([number,title,text])=>`<article><span>${escapeHtml(number)}</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></article>`).join('')}</div></section>
        <section class="course-detail-section course-audience-section"><div><span class="course-eyebrow">Para quién es</span><h2>Diseñada para aplicar desde el primer bloque</h2></div><ul>${course.audience.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section class="course-detail-section course-requirements-grid" id="requisitos"><article><span class="course-eyebrow">Requisitos</span><h2>Antes de comenzar</h2><p>${escapeHtml(course.prerequisites)}</p></article><article><span class="course-eyebrow">Metodología</span><h2>Aprender haciendo</h2><p>Lecciones breves, ejercicios aplicados, recursos de apoyo y acompañamiento del Tutor IA dentro del ecosistema Compás.</p></article></section>
        <section class="course-final-cta"><div><span class="course-eyebrow">Compás Academy</span><h2>${available ? 'Comienza tu ruta con una base clara.' : 'Esta ruta está siendo preparada para Academy.'}</h2><p>${available ? 'Crea tu cuenta o entra con tu correo registrado para consultar los cursos asignados.' : 'Mientras se publica, puedes explorar las demás rutas disponibles dentro del catálogo.'}</p></div><div>${available ? '<a class="course-btn course-btn-primary" href="index.html#signup">Crear mi cuenta</a>' : '<a class="course-btn course-btn-primary" href="index.html#catalog">Volver al catálogo</a>'}</div></section>
      </main>
      <footer class="course-public-footer"><div><strong>Compás Academy</strong><span>Formación práctica para el ecosistema Proyecto Compás Evolution.</span></div><div><a href="https://www.proyectocompas.com/aviso-de-privacidad.html" target="_blank" rel="noopener">Privacidad</a><a href="index.html#catalog">Catálogo</a></div></footer>
    </div>`;
  }

  function boot() {
    renderCourseLanding();
    decorateCatalogCards();
    if (document.body) {
      let queued = false;
      new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; decorateCatalogCards(); });
      }).observe(document.body, { childList: true, subtree: true });
    }
    window.ACADEMY_COURSE_CATALOG_V27 = Object.freeze({version:VERSION,courses:courses.map(course=>({...course})),getBySlug:slug=>bySlug.get(slug)||null});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
