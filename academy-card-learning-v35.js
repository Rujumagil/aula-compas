(() => {
  const VERSION = '35.0.0';
  const STYLE_ID = 'academy-card-learning-v35';
  const STYLE_HREF = 'academy-card-learning-v35.css?v=35.0.0';
  let scheduled = false;
  let activeKey = '';
  let loadingKey = '';

  const hashParts = () => location.hash.replace(/^#/, '').split('/');
  const safe = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' })[ch]);

  function ensureStyles() {
    let link = document.getElementById(STYLE_ID);
    if (!link) {
      link = document.createElement('link');
      link.id = STYLE_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== STYLE_HREF) link.setAttribute('href', STYLE_HREF);
  }

  function isFreelanceCourse(course) {
    const category = String(course?.category || '').toLowerCase();
    const slug = String(course?.slug || '').toLowerCase();
    return category.includes('freelance') || /^nivel-[1-9]-/.test(slug);
  }

  function classifyCard(title = '', html = '') {
    const text = `${title} ${html}`.toLowerCase();
    if (/actividad|ejercicio|aplicación práctica|práctica/.test(text)) return 'activity';
    if (/caso|ejemplo|situación/.test(text)) return 'case';
    if (/método|paso|proceso|marco|principio/.test(text)) return 'method';
    if (/objetivo|aprenderás|bienvenido|introducción/.test(text)) return 'intro';
    if (/clave|recuerda|importante|regla/.test(text)) return 'key';
    return 'concept';
  }

  function cardLabel(type) {
    return ({
      intro: 'Inicio',
      concept: 'Concepto',
      method: 'Método Compás',
      case: 'Caso práctico',
      activity: 'Tu turno',
      key: 'Idea clave'
    })[type] || 'Aprendizaje';
  }

  function meaningfulHtml(html = '') {
    const probe = document.createElement('div');
    probe.innerHTML = html;
    return probe.textContent.trim().length > 0;
  }

  function buildCards(lesson, source) {
    const cards = [];
    const description = String(lesson?.description || '').trim();
    if (description) {
      cards.push({
        title: lesson.title,
        html: `<p class="card-learning-lead-v35">${safe(description)}</p><p>Avanza tarjeta por tarjeta. Tu progreso se guarda en tu cuenta y la lección se completa cuando terminas toda la secuencia.</p>`,
        type: 'intro'
      });
    }

    const root = document.createElement('div');
    root.innerHTML = source?.innerHTML || '';
    let currentTitle = '';
    let fragments = [];

    const flush = () => {
      const html = fragments.join('').trim();
      if (!meaningfulHtml(html)) {
        fragments = [];
        return;
      }
      const title = currentTitle || 'Idea principal';
      if (!(cards.length === 0 && title.toLowerCase() === String(lesson?.title || '').toLowerCase())) {
        cards.push({ title, html, type: classifyCard(title, html) });
      } else {
        cards.push({ title: lesson.title, html, type: classifyCard(title, html) });
      }
      fragments = [];
    };

    [...root.children].forEach(node => {
      const tag = node.tagName?.toLowerCase();
      if (['h1','h2','h3'].includes(tag)) {
        flush();
        currentTitle = node.textContent.trim();
      } else {
        fragments.push(node.outerHTML);
      }
    });
    flush();

    if (!cards.length) {
      cards.push({
        title: lesson?.title || 'Lección',
        html: '<p>El contenido de esta lección está en preparación.</p>',
        type: 'intro'
      });
    }

    // Evita una primera tarjeta duplicada cuando el contenido ya trae el mismo encabezado.
    if (cards.length > 1 && cards[0].title === cards[1].title && cards[0].type === 'intro') {
      cards[0].title = 'Antes de comenzar';
    }

    return cards;
  }

  async function loadVisited(lessonId) {
    if (typeof db === 'undefined' || typeof state === 'undefined' || !state.user?.id) return new Set();
    const { data, error } = await db
      .from('lesson_slide_progress')
      .select('slide_index')
      .eq('user_id', state.user.id)
      .eq('lesson_id', lessonId)
      .order('slide_index', { ascending: true });
    if (error) {
      console.error('Card learning progress error:', error);
      return new Set();
    }
    return new Set((data || []).map(row => Number(row.slide_index)).filter(Number.isInteger));
  }

  async function markVisited(lessonId, index, visited) {
    if (visited.has(index)) return true;
    if (typeof db === 'undefined' || typeof state === 'undefined' || !state.user?.id) return false;
    const { error } = await db.from('lesson_slide_progress').insert({
      user_id: state.user.id,
      lesson_id: lessonId,
      slide_index: index
    });
    if (error && error.code !== '23505') {
      console.error('Card progress insert error:', error);
      if (typeof showToast === 'function') showToast('No se pudo guardar esta tarjeta. Intenta nuevamente.', 'error');
      return false;
    }
    visited.add(index);
    return true;
  }

  function nextLessonFor(course, lessonId) {
    const lessons = (course?.modules || []).flatMap(module => module.lessons || []);
    const index = lessons.findIndex(item => String(item.id) === String(lessonId));
    return index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null;
  }

  function insertWebinarBanner(course) {
    if (!course || !isFreelanceCourse(course) || document.querySelector('.card-learning-live-v35')) return;
    const anchor = document.querySelector('.learning-v31-context, .course-head, .lesson-study-nav-v31, .page-title');
    if (!anchor) return;
    const section = document.createElement('section');
    section.className = 'card-learning-live-v35';
    section.innerHTML = `
      <div>
        <span>Encuentro en vivo</span>
        <strong>Webinar práctico de fin de semana</strong>
        <p>Las tarjetas cubren la teoría y la práctica diaria. Los fines de semana usamos el webinar para dudas, role play, casos reales y revisión comercial.</p>
      </div>
      <a class="btn btn-secondary" href="#agenda">Ver calendario</a>`;
    anchor.insertAdjacentElement('afterend', section);
  }

  async function enhanceLesson(courseId, lessonId) {
    const key = `${courseId}:${lessonId}`;
    if (loadingKey === key) return;
    if (activeKey === key && document.querySelector('.card-learning-shell-v35')) return;
    if (typeof findCourse !== 'function' || typeof findLesson !== 'function') return;

    const course = findCourse(courseId);
    const found = course && findLesson(course, lessonId);
    const source = document.querySelector('.lesson-content');
    const layout = document.querySelector('.lesson-layout');
    if (!course || !found?.lesson || !source || !layout || !isFreelanceCourse(course)) return;

    loadingKey = key;
    ensureStyles();
    insertWebinarBanner(course);

    const lesson = found.lesson;
    const cards = buildCards(lesson, source);
    const visited = await loadVisited(lessonId);
    const firstUnvisited = cards.findIndex((_, index) => !visited.has(index));
    let current = firstUnvisited >= 0 ? firstUnvisited : 0;
    let finishing = false;

    const player = document.createElement('section');
    player.className = 'card-learning-shell-v35';
    player.dataset.lessonId = lessonId;
    source.insertAdjacentElement('beforebegin', player);
    source.classList.add('card-learning-source-v35');

    const stream = document.querySelector('.student-block-stream');
    if (stream) stream.classList.add('card-learning-source-v35');
    const videoPlaceholder = document.querySelector('#video-placeholder')?.closest('.video-shell');
    if (videoPlaceholder) videoPlaceholder.classList.add('card-learning-video-hidden-v35');
    const manualComplete = document.querySelector('#complete-current');
    if (manualComplete) manualComplete.classList.add('card-learning-manual-hidden-v35');

    function progressPct() {
      return cards.length ? Math.round((visited.size / cards.length) * 100) : 0;
    }

    function render() {
      const card = cards[current];
      const completed = typeof isLessonCompleted === 'function' && isLessonCompleted(lessonId);
      const pct = completed ? 100 : progressPct();
      const atEnd = current === cards.length - 1;
      const nextLesson = nextLessonFor(course, lessonId);
      player.innerHTML = `
        <header class="card-learning-head-v35">
          <div>
            <span>Microlearning Compás</span>
            <strong>Tarjeta ${current + 1} de ${cards.length}</strong>
          </div>
          <div class="card-learning-percent-v35">${pct}%</div>
        </header>
        <div class="card-learning-track-v35"><span style="width:${pct}%"></span></div>
        <article class="card-learning-card-v35" data-card-type="${card.type}">
          <div class="card-learning-card-top-v35">
            <span>${cardLabel(card.type)}</span>
            <small>${current + 1}/${cards.length}</small>
          </div>
          <h2>${safe(card.title)}</h2>
          <div class="card-learning-body-v35">${card.html}</div>
        </article>
        <div class="card-learning-dots-v35" aria-label="Progreso de tarjetas">
          ${cards.map((_, index) => `<span data-state="${visited.has(index) ? 'done' : index === current ? 'current' : 'pending'}" title="Tarjeta ${index + 1}"></span>`).join('')}
        </div>
        <footer class="card-learning-actions-v35">
          <button class="btn btn-secondary" type="button" data-card-prev ${current === 0 ? 'disabled' : ''}>← Anterior</button>
          ${completed && atEnd && nextLesson
            ? `<a class="btn btn-primary" href="#lesson/${course.id}/${nextLesson.id}">Siguiente lección →</a>`
            : completed && atEnd
              ? `<a class="btn btn-primary" href="#course/${course.id}">Volver al curso →</a>`
              : `<button class="btn btn-primary" type="button" data-card-next>${atEnd ? 'Finalizar lección ✓' : 'Continuar →'}</button>`}
        </footer>
        <p class="card-learning-save-v35">El avance se guarda al continuar. No necesitas reproducir un video para completar esta clase.</p>`;

      player.querySelector('[data-card-prev]')?.addEventListener('click', () => {
        if (current <= 0) return;
        current -= 1;
        render();
        player.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      player.querySelector('[data-card-next]')?.addEventListener('click', async event => {
        const button = event.currentTarget;
        button.disabled = true;
        const saved = await markVisited(lessonId, current, visited);
        if (!saved) {
          button.disabled = false;
          return;
        }

        if (current < cards.length - 1) {
          current += 1;
          render();
          player.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        const allViewed = cards.every((_, index) => visited.has(index));
        if (allViewed && !finishing && !(typeof isLessonCompleted === 'function' && isLessonCompleted(lessonId))) {
          finishing = true;
          if (typeof completeLesson === 'function') {
            await completeLesson(lessonId, true);
          }
          if (typeof showToast === 'function') showToast('Lección completada. Tu progreso quedó guardado.', 'success');
        }
        render();
      });
    }

    player.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' && current > 0) {
        current -= 1;
        render();
      }
      if (event.key === 'ArrowRight') player.querySelector('[data-card-next]')?.click();
    });
    player.tabIndex = 0;

    render();
    activeKey = key;
    loadingKey = '';
    document.documentElement.dataset.academyCardLearning = VERSION;
  }

  function enhanceCourse(courseId) {
    if (typeof findCourse !== 'function') return;
    const course = findCourse(courseId);
    if (!course || !isFreelanceCourse(course)) return;
    ensureStyles();
    insertWebinarBanner(course);
  }

  function run() {
    scheduled = false;
    const [page, courseId, lessonId] = hashParts();
    if (page !== 'lesson') activeKey = '';
    if (page === 'lesson' && courseId && lessonId) enhanceLesson(courseId, lessonId).catch(error => {
      loadingKey = '';
      console.error('Card learning enhancement error:', error);
    });
    if (page === 'course' && courseId) enhanceCourse(courseId);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  function start() {
    ensureStyles();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', schedule);
    schedule();
    window.ACADEMY_CARD_LEARNING_V35 = Object.freeze({ version: VERSION, refresh: schedule });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
