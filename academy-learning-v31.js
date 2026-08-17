(() => {
  const VERSION = '31.0.0';
  let scheduled = false;

  const safe = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '');
  const hashParts = () => location.hash.replace(/^#/, '').split('/');

  function lessonList(course) {
    try {
      return typeof allLessons === 'function' ? allLessons(course) : (course?.modules || []).flatMap(module => module.lessons || []);
    } catch (_) {
      return (course?.modules || []).flatMap(module => module.lessons || []);
    }
  }

  function enhanceCourse(courseId) {
    if (typeof findCourse !== 'function' || typeof courseProgress !== 'function') return;
    const course = findCourse(courseId);
    const head = document.querySelector('.course-head');
    if (!course || !head) return;

    document.body.dataset.academyView = 'course';
    if (!document.querySelector('.learning-v31-context')) {
      const progress = Math.max(0, Math.min(100, Number(courseProgress(course) || 0)));
      const lessons = lessonList(course);
      const done = lessons.filter(item => typeof isLessonCompleted === 'function' && isLessonCompleted(item.id)).length;
      const next = typeof firstIncompleteLesson === 'function' ? firstIncompleteLesson(course) : lessons.find(item => !(typeof isLessonCompleted === 'function' && isLessonCompleted(item.id)));
      const nextHref = next ? `#lesson/${course.id}/${next.id}` : `#course/${course.id}`;
      const context = document.createElement('section');
      context.className = 'learning-v31-context';
      context.innerHTML = `
        <div class="learning-v31-context-main">
          <div class="learning-v31-progress-ring" style="--learn-progress:${progress}%"><strong>${progress}%</strong></div>
          <div class="learning-v31-context-copy">
            <small>Tu avance en esta ruta</small>
            <strong>${done}/${lessons.length} lecciones completadas${next ? ` · Siguiente: ${safe(next.title)}` : ' · Curso completado'}</strong>
          </div>
        </div>
        <div class="learning-v31-context-actions">
          <a class="btn btn-secondary" href="#courses">Mis cursos</a>
          <a class="btn btn-primary" href="${nextHref}">${progress === 100 ? 'Repasar curso' : progress > 0 ? 'Continuar aprendizaje' : 'Comenzar curso'}</a>
        </div>`;
      head.parentNode.insertBefore(context, head);
    }

    document.querySelectorAll('.module').forEach((moduleEl, index) => {
      const module = course.modules?.[index];
      if (!module) return;
      const summaryMeta = moduleEl.querySelector('summary div span');
      if (summaryMeta && !moduleEl.querySelector('.module-progress-v31')) {
        const total = module.lessons?.length || 0;
        const completed = (module.lessons || []).filter(item => typeof isLessonCompleted === 'function' && isLessonCompleted(item.id)).length;
        const progress = document.createElement('span');
        progress.className = 'module-progress-v31';
        progress.textContent = `${completed}/${total} completadas`;
        summaryMeta.insertAdjacentElement('afterend', progress);
      }
    });
  }

  function enhanceLesson(courseId, lessonId) {
    if (typeof findCourse !== 'function' || typeof findLesson !== 'function') return;
    const course = findCourse(courseId);
    const found = course && findLesson(course, lessonId);
    const layout = document.querySelector('.lesson-layout');
    if (!course || !found || !layout) return;

    document.body.dataset.academyView = 'lesson';
    const lessons = lessonList(course);
    const index = lessons.findIndex(item => String(item.id) === String(lessonId));
    const current = index >= 0 ? lessons[index] : found.lesson;
    const previous = index > 0 ? lessons[index - 1] : null;
    const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
    const completed = lessons.filter(item => typeof isLessonCompleted === 'function' && isLessonCompleted(item.id)).length;
    const overall = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;

    if (!document.querySelector('.lesson-study-nav-v31')) {
      const nav = document.createElement('section');
      nav.className = 'lesson-study-nav-v31';
      nav.innerHTML = `
        <div class="lesson-study-meta-v31">
          <div><span>Lección ${Math.max(1, index + 1)} de ${lessons.length || 1}</span><strong>${overall}% del curso</strong></div>
          <div class="lesson-study-progress-v31"><span style="width:${overall}%"></span></div>
        </div>
        <div class="lesson-study-actions-v31" aria-label="Navegación entre lecciones">
          <a href="${previous ? `#lesson/${course.id}/${previous.id}` : '#'}" ${previous ? `title="Anterior: ${safe(previous.title)}"` : 'aria-disabled="true" title="Primera lección"'}>←</a>
          <a href="${next ? `#lesson/${course.id}/${next.id}` : `#course/${course.id}`}" title="${next ? `Siguiente: ${safe(next.title)}` : 'Volver al curso'}">→</a>
        </div>`;
      layout.parentNode.insertBefore(nav, layout);
    }

    document.querySelectorAll('.lesson-item').forEach(item => item.classList.remove('is-current-v31'));
    const currentLink = document.querySelector(`.lesson-item a[href="#lesson/${course.id}/${lessonId}"]`);
    currentLink?.closest('.lesson-item')?.classList.add('is-current-v31');
    currentLink?.setAttribute('aria-current', 'page');

    if (!document.querySelector('.lesson-footer-nav-v31')) {
      const note = document.querySelector('.autosave-note');
      const footer = document.createElement('nav');
      footer.className = 'lesson-footer-nav-v31';
      footer.setAttribute('aria-label', 'Continuar aprendizaje');
      footer.innerHTML = `
        <a class="${previous ? '' : 'is-disabled-v31'}" href="${previous ? `#lesson/${course.id}/${previous.id}` : '#'}">
          <small>Lección anterior</small>
          <strong>${previous ? `← ${safe(previous.title)}` : 'Inicio del curso'}</strong>
        </a>
        <a href="${next ? `#lesson/${course.id}/${next.id}` : `#course/${course.id}`}">
          <small>${next ? 'Siguiente lección' : 'Ruta completada'}</small>
          <strong>${next ? `${safe(next.title)} →` : 'Volver al contenido del curso →'}</strong>
        </a>`;
      if (note) note.insertAdjacentElement('afterend', footer);
      else layout.querySelector('div')?.appendChild(footer);
    }

    const placeholder = document.querySelector('#video-placeholder')?.closest('.video-shell');
    if (placeholder && !placeholder.dataset.learningV31) {
      placeholder.dataset.learningV31 = 'true';
      const bar = placeholder.querySelector('.video-bar>span:first-child');
      if (bar) bar.textContent = 'Contenido principal · video en preparación';
    }

    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.dataset.lessonIndex = String(index + 1);
    document.title = `${current?.title || 'Lección'} | Compás Academy`;
  }

  function enhanceCatalog() {
    if (!document.querySelector('.catalog-grid, .academy-public-shell, .public-shell')) return;
    document.body.dataset.academyView = 'catalog';
    document.querySelectorAll('.catalog-card').forEach((card, index) => {
      card.dataset.catalogPosition = String(index + 1);
    });
  }

  function enhancePublicCourse() {
    if (!document.body.classList.contains('course-detail-body')) return;
    document.body.dataset.academyView = 'public-course';
    document.querySelector('.course-summary-card')?.setAttribute('aria-label', 'Resumen del programa');
  }

  function run() {
    scheduled = false;
    const [page, id, lessonId] = hashParts();
    if (page === 'course' && id) enhanceCourse(id);
    else if (page === 'lesson' && id && lessonId) enhanceLesson(id, lessonId);
    else if (page === 'catalog' || document.querySelector('.catalog-grid')) enhanceCatalog();
    enhancePublicCourse();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  const observer = new MutationObserver(schedule);
  function start() {
    document.documentElement.dataset.academyLearning = VERSION;
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    schedule();
    window.ACADEMY_LEARNING_V31 = Object.freeze({ version: VERSION, refresh: schedule });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
