(() => {
  const VERSION = '37.2.0';
  const STYLE_ID = 'academy-course-completion-v37-2-style';
  const eligibilityCache = new Map();
  const eligibilityLoading = new Set();
  let scheduled = false;

  const hashParts = () => location.hash.replace(/^#/, '').split('/');
  const safe = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[ch]);

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .course-completion-v372{margin:20px 0 28px;padding:28px;border:1px solid rgba(15,74,143,.12);border-radius:26px;background:linear-gradient(135deg,#fff 0%,#f5f9ff 62%,#eef8f7 100%);box-shadow:0 18px 50px rgba(18,53,91,.08);display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center}
      .course-completion-icon-v372{width:72px;height:72px;border-radius:22px;background:linear-gradient(135deg,#0b63f3,#12b8aa);display:grid;place-items:center;color:#fff;font-size:34px;font-weight:800;box-shadow:0 12px 28px rgba(11,99,243,.22)}
      .course-completion-copy-v372 small{display:block;margin-bottom:6px;color:#0b63f3;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .course-completion-copy-v372 h2{margin:0 0 8px;color:#0c315d;font-size:clamp(24px,3vw,34px)}
      .course-completion-copy-v372 p{margin:0;color:#52677f;line-height:1.55;max-width:760px}
      .course-completion-actions-v372{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
      .course-completion-status-v372{display:inline-flex;margin-top:12px;padding:7px 11px;border-radius:999px;background:#eaf8f4;color:#087c70;font-weight:800;font-size:13px}
      .course-completion-status-v372.pending{background:#fff6df;color:#8a5a00}
      @media(max-width:820px){.course-completion-v372{grid-template-columns:1fr}.course-completion-icon-v372{width:60px;height:60px}.course-completion-actions-v372{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function lessonList(course) {
    try {
      if (typeof allLessons === 'function') return allLessons(course) || [];
    } catch (_) {}
    return (course?.modules || []).flatMap(module => module.lessons || []);
  }

  function currentCourse(courseId) {
    try {
      if (typeof findCourse === 'function') return findCourse(courseId);
    } catch (_) {}
    return (typeof state !== 'undefined' ? state.courses || [] : [])
      .find(course => String(course.id) === String(courseId));
  }

  function completedCount(lessons) {
    return lessons.filter(lesson => typeof isLessonCompleted === 'function' && isLessonCompleted(lesson.id)).length;
  }

  function progressOf(course) {
    try {
      if (typeof courseProgress === 'function') return Number(courseProgress(course) || 0);
    } catch (_) {}
    const lessons = lessonList(course);
    return lessons.length ? Math.round((completedCount(lessons) / lessons.length) * 100) : 0;
  }

  function patchFirstIncompleteLesson() {
    if (typeof window.firstIncompleteLesson !== 'function' || window.firstIncompleteLesson.__academyCompletionV372) return;
    const corrected = function(course) {
      const lessons = lessonList(course);
      return lessons.find(lesson => !(typeof isLessonCompleted === 'function' && isLessonCompleted(lesson.id))) || null;
    };
    corrected.__academyCompletionV372 = true;
    window.firstIncompleteLesson = corrected;
  }

  async function loadEligibility(courseId) {
    if (eligibilityCache.has(courseId) || eligibilityLoading.has(courseId)) return;
    if (typeof db === 'undefined' || !db?.rpc) return;
    eligibilityLoading.add(courseId);
    try {
      const { data, error } = await db.rpc('get_certificate_eligibility', { target_course: courseId });
      if (error) throw error;
      eligibilityCache.set(courseId, Array.isArray(data) ? data[0] : data);
    } catch (error) {
      console.warn('Course completion eligibility:', error);
      eligibilityCache.set(courseId, null);
    } finally {
      eligibilityLoading.delete(courseId);
      schedule();
    }
  }

  function updateLearningContext(course, lessons, done) {
    const context = document.querySelector('.learning-v31-context');
    if (!context) return;
    const copy = context.querySelector('.learning-v31-context-copy');
    if (copy) {
      copy.innerHTML = `<small>Ruta completada</small><strong>${done}/${lessons.length} lecciones completadas · Curso completado</strong>`;
    }
    const ring = context.querySelector('.learning-v31-progress-ring');
    if (ring) {
      ring.style.setProperty('--learn-progress', '100%');
      const strong = ring.querySelector('strong');
      if (strong) strong.textContent = '100%';
    }
    const actions = context.querySelector('.learning-v31-context-actions');
    if (actions) {
      const first = lessons[0];
      actions.innerHTML = `
        <a class="btn btn-secondary" href="#courses">Mis cursos</a>
        <a class="btn btn-primary" href="${first ? `#lesson/${course.id}/${first.id}` : `#course/${course.id}`}">Repasar curso</a>`;
    }
  }

  function renderCompletion(course, lessons, done) {
    ensureStyles();
    updateLearningContext(course, lessons, done);

    let section = document.querySelector('.course-completion-v372');
    if (!section) {
      section = document.createElement('section');
      section.className = 'course-completion-v372';
      const anchor = document.querySelector('.learning-v31-context, .course-head');
      if (!anchor) return;
      anchor.insertAdjacentElement('afterend', section);
    }

    const eligibility = eligibilityCache.get(course.id);
    const loading = eligibilityLoading.has(course.id);
    const eligible = Boolean(eligibility?.eligible);
    const requiredAssessments = Number(eligibility?.required_assessments || 0);
    const passedAssessments = Number(eligibility?.passed_assessments || 0);
    const assessmentsPending = requiredAssessments > passedAssessments;
    const first = lessons[0];

    let statusText = loading ? 'Revisando requisitos del certificado…' : 'Curso completado al 100%';
    let statusClass = loading ? 'pending' : '';
    let primaryHref = '#certificates';
    let primaryText = 'Revisar certificado →';

    if (eligible) {
      statusText = 'Certificado disponible';
      primaryHref = `#certificate/${course.id}`;
      primaryText = 'Obtener certificado →';
    } else if (assessmentsPending) {
      statusText = `Falta aprobar ${Math.max(0, requiredAssessments - passedAssessments)} evaluación${requiredAssessments - passedAssessments === 1 ? '' : 'es'}`;
      statusClass = 'pending';
      primaryText = 'Revisar requisitos →';
    }

    section.innerHTML = `
      <div class="course-completion-icon-v372">✓</div>
      <div class="course-completion-copy-v372">
        <small>Compás Academy · Ruta completada</small>
        <h2>Completaste ${safe(course.title)}</h2>
        <p>Terminaste las ${done} lecciones de este curso. Tu avance quedó guardado y ya puedes revisar los requisitos de certificación o volver al contenido para repasar.</p>
        <span class="course-completion-status-v372 ${statusClass}">${safe(statusText)}</span>
      </div>
      <div class="course-completion-actions-v372">
        ${first ? `<a class="btn btn-secondary" href="#lesson/${course.id}/${first.id}">Repasar desde el inicio</a>` : ''}
        <a class="btn btn-primary" href="${primaryHref}">${primaryText}</a>
      </div>`;

    if (!eligibilityCache.has(course.id) && !loading) loadEligibility(course.id);
    document.documentElement.dataset.academyCourseCompletion = VERSION;
  }

  function clearCompletion() {
    document.querySelector('.course-completion-v372')?.remove();
  }

  function run() {
    scheduled = false;
    patchFirstIncompleteLesson();
    const [page, courseId] = hashParts();
    if (page !== 'course' || !courseId) {
      clearCompletion();
      return;
    }
    const course = currentCourse(courseId);
    if (!course) return;
    const lessons = lessonList(course);
    if (!lessons.length) return;
    const done = completedCount(lessons);
    const progress = progressOf(course);
    if (progress < 100 || done < lessons.length) {
      clearCompletion();
      return;
    }
    renderCompletion(course, lessons, done);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  function start() {
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    const timer = setInterval(() => {
      patchFirstIncompleteLesson();
      schedule();
      if (typeof state !== 'undefined' && typeof findCourse === 'function') clearInterval(timer);
    }, 400);
    setTimeout(() => clearInterval(timer), 12000);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
