(() => {
  const VERSION = '14.0.0';
  let timerId = null;

  const cleanHash = () => String(location.hash || '').replace(/^#/, '');
  const parts = () => cleanHash().split('/');
  const pageNode = () => document.querySelector('#page');

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function friendlyAssessmentType(type) {
    return ({ quiz: 'Evaluación', module_exam: 'Examen de módulo', final_exam: 'Examen final' })[type] || 'Evaluación';
  }

  function statusLabel(attempt) {
    if (!attempt) return 'Pendiente';
    if (attempt.status === 'graded') return attempt.passed ? `Aprobada · ${Number(attempt.score || 0)}%` : `Por mejorar · ${Number(attempt.score || 0)}%`;
    if (attempt.status === 'submitted') return 'En revisión';
    if (attempt.status === 'in_progress') return 'En progreso';
    return 'Intento cerrado';
  }

  async function assessmentsForCourse(courseId) {
    const { data, error } = await db.from('assessments')
      .select('*')
      .eq('course_id', courseId)
      .eq('status', 'published')
      .order('position', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function attemptsForAssessments(ids) {
    if (!ids.length || !state?.user?.id) return [];
    const { data, error } = await db.from('assessment_attempts')
      .select('*')
      .eq('user_id', state.user.id)
      .in('assessment_id', ids)
      .order('attempt_number', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function enhanceCoursePage() {
    const [page, courseId] = parts();
    if (page !== 'course' || !courseId || !state?.session) return;
    const target = pageNode();
    if (!target || target.querySelector('[data-assessment-course-panel]')) return;

    try {
      const course = findCourse(courseId);
      if (!course) return;
      const assessments = await assessmentsForCourse(course.id);
      if (!assessments.length) return;
      const attempts = await attemptsForAssessments(assessments.map(a => a.id));

      const section = document.createElement('section');
      section.className = 'assessment-course-panel';
      section.dataset.assessmentCoursePanel = 'true';
      section.innerHTML = `
        <div class="assessment-section-head">
          <div><span class="eyebrow">Comprueba tu aprendizaje</span><h2>Evaluaciones del curso</h2></div>
          <span>${assessments.length} ${assessments.length === 1 ? 'evaluación' : 'evaluaciones'}</span>
        </div>
        <div class="assessment-course-grid">
          ${assessments.map(a => {
            const latest = attempts.find(x => x.assessment_id === a.id);
            const used = attempts.filter(x => x.assessment_id === a.id && x.status !== 'abandoned').length;
            return `<a class="assessment-course-card" href="#assessment/${escapeHtml(a.id)}">
              <div><span class="assessment-type">${escapeHtml(friendlyAssessmentType(a.assessment_type))}</span><span class="assessment-status">${escapeHtml(statusLabel(latest))}</span></div>
              <h3>${escapeHtml(a.title)}</h3>
              <p>${escapeHtml(a.description || 'Responde para comprobar lo aprendido.')}</p>
              <footer>
                <span>Aprobación: ${Number(a.passing_score)}%</span>
                ${a.time_limit_minutes ? `<span>${Number(a.time_limit_minutes)} min</span>` : ''}
                <span>${a.max_attempts ? `${used}/${a.max_attempts} intentos` : 'Intentos abiertos'}</span>
              </footer>
            </a>`;
          }).join('')}
        </div>`;
      target.appendChild(section);
    } catch (error) {
      console.error('Assessment course panel:', error);
    }
  }

  async function loadAssessment(id) {
    const assessmentResult = await db.from('assessments').select('*').eq('id', id).maybeSingle();
    if (assessmentResult.error) throw assessmentResult.error;
    const assessment = assessmentResult.data;
    if (!assessment) throw new Error('Evaluación no disponible.');

    const questionsResult = await db.from('assessment_questions')
      .select('id,assessment_id,prompt,question_type,explanation,points,position')
      .eq('assessment_id', id).order('position', { ascending: true });
    if (questionsResult.error) throw questionsResult.error;
    const questions = questionsResult.data || [];

    let options = [];
    if (questions.length) {
      const optionsResult = await db.from('assessment_options_public')
        .select('id,question_id,label,position')
        .in('question_id', questions.map(q => q.id))
        .order('position', { ascending: true });
      if (optionsResult.error) throw optionsResult.error;
      options = optionsResult.data || [];
    }

    const attemptsResult = await db.from('assessment_attempts').select('*')
      .eq('assessment_id', id).eq('user_id', state.user.id)
      .order('attempt_number', { ascending: false });
    if (attemptsResult.error) throw attemptsResult.error;

    return { assessment, questions, options, attempts: attemptsResult.data || [] };
  }

  function questionMarkup(q, options, answer) {
    const selected = new Set(answer?.selected_option_ids || []);
    const opts = options.filter(o => o.question_id === q.id);
    if (q.question_type === 'short_text') {
      return `<textarea rows="5" data-answer-text="${q.id}" placeholder="Escribe tu respuesta">${escapeHtml(answer?.text_answer || '')}</textarea>`;
    }
    const multiple = q.question_type === 'multiple_choice';
    return `<div class="assessment-options">${opts.map(o => `
      <label class="assessment-option">
        <input type="${multiple ? 'checkbox' : 'radio'}" name="question-${q.id}" value="${escapeHtml(o.id)}" ${selected.has(o.id) ? 'checked' : ''}>
        <span>${escapeHtml(o.label)}</span>
      </label>`).join('')}</div>`;
  }

  function resultMarkup(attempt, assessment) {
    if (!attempt) return '';
    if (attempt.status === 'graded') return `
      <section class="assessment-result ${attempt.passed ? 'passed' : 'failed'}">
        <span>${attempt.passed ? '✓' : '↻'}</span>
        <div><small>Resultado</small><h2>${attempt.passed ? 'Evaluación aprobada' : 'Puedes intentarlo nuevamente'}</h2>
        <p>Obtuviste <strong>${Number(attempt.score || 0)}%</strong>. El mínimo es ${Number(assessment.passing_score)}%.</p></div>
      </section>`;
    if (attempt.status === 'submitted') return `
      <section class="assessment-result pending"><span>◷</span><div><small>Entregada</small><h2>Respuesta enviada a revisión</h2><p>Esta evaluación contiene respuestas que requieren revisión del instructor.</p></div></section>`;
    return '';
  }

  async function renderAssessment(id) {
    stopTimer();
    if (!state?.session) return;
    renderShell('courses');
    const target = pageNode();
    if (!target) return;
    target.innerHTML = `<section class="assessment-loading"><div class="spinner"></div><p>Cargando evaluación…</p></section>`;

    try {
      const model = await loadAssessment(id);
      const { assessment, questions, options, attempts } = model;
      let active = attempts.find(a => a.status === 'in_progress') || null;
      const latest = attempts[0] || null;
      const used = attempts.filter(a => a.status !== 'abandoned').length;
      const canRetry = !assessment.max_attempts || used < assessment.max_attempts;

      if (!active) {
        target.innerHTML = `
          <div class="assessment-shell">
            <a class="back-link" href="#course/${escapeHtml(assessment.course_id)}">← Volver al curso</a>
            <header class="assessment-hero">
              <div><span class="eyebrow">${escapeHtml(friendlyAssessmentType(assessment.assessment_type))}</span><h1>${escapeHtml(assessment.title)}</h1>
              <p>${escapeHtml(assessment.description || 'Comprueba lo aprendido antes de continuar.')}</p></div>
              <aside><strong>${questions.length}</strong><span>preguntas</span></aside>
            </header>
            ${resultMarkup(latest, assessment)}
            <section class="assessment-rules">
              <article><strong>${Number(assessment.passing_score)}%</strong><span>mínimo para aprobar</span></article>
              <article><strong>${assessment.time_limit_minutes ? `${Number(assessment.time_limit_minutes)} min` : 'Libre'}</strong><span>tiempo</span></article>
              <article><strong>${assessment.max_attempts || '∞'}</strong><span>intentos máximos</span></article>
            </section>
            <div class="assessment-start">
              ${latest?.status === 'submitted' ? '<p>Tu entrega está en revisión; no necesitas iniciar otro intento.</p>' : canRetry ? `<button class="btn btn-primary" data-start-assessment="${escapeHtml(assessment.id)}">${latest ? 'Intentar nuevamente' : 'Comenzar evaluación'}</button>` : '<p>Has utilizado todos los intentos disponibles.</p>'}
            </div>
          </div>`;
        target.querySelector('[data-start-assessment]')?.addEventListener('click', async buttonEvent => {
          const button = buttonEvent.currentTarget;
          button.disabled = true;
          button.textContent = 'Preparando intento…';
          const { data, error } = await db.rpc('start_assessment_attempt', { target_assessment: assessment.id });
          if (error) { showToast(error.message, 'error'); button.disabled = false; button.textContent = 'Comenzar evaluación'; return; }
          await renderAssessment(assessment.id);
        });
        return;
      }

      const answersResult = await db.from('assessment_answers').select('*').eq('attempt_id', active.id);
      if (answersResult.error) throw answersResult.error;
      const answers = answersResult.data || [];

      target.innerHTML = `
        <div class="assessment-shell">
          <a class="back-link" href="#course/${escapeHtml(assessment.course_id)}">← Guardar y volver al curso</a>
          <header class="assessment-hero compact">
            <div><span class="eyebrow">Intento ${active.attempt_number}</span><h1>${escapeHtml(assessment.title)}</h1><p>Las respuestas se guardan automáticamente.</p></div>
            ${assessment.time_limit_minutes ? '<aside class="assessment-timer"><strong data-assessment-timer>--:--</strong><span>tiempo restante</span></aside>' : '<aside><strong>∞</strong><span>sin límite</span></aside>'}
          </header>
          <form class="assessment-form" data-assessment-form>
            ${questions.map((q, index) => {
              const answer = answers.find(a => a.question_id === q.id);
              return `<fieldset class="assessment-question" data-question="${q.id}">
                <legend><span>${index + 1}</span><div><small>${Number(q.points)} ${Number(q.points) === 1 ? 'punto' : 'puntos'}</small><strong>${escapeHtml(q.prompt)}</strong></div></legend>
                ${questionMarkup(q, options, answer)}
                <small class="assessment-save-state" data-save-state="${q.id}">${answer ? 'Guardada' : 'Sin responder'}</small>
              </fieldset>`;
            }).join('')}
            <div class="assessment-submit-bar"><div><strong>¿Terminaste?</strong><span>Revisa tus respuestas antes de entregar.</span></div><button class="btn btn-primary" type="submit">Entregar evaluación</button></div>
          </form>
        </div>`;

      const saveQuestion = async qid => {
        const q = questions.find(item => item.id === qid);
        const fieldset = target.querySelector(`[data-question="${qid}"]`);
        if (!q || !fieldset) return;
        let selected = [];
        let answerText = null;
        if (q.question_type === 'short_text') answerText = fieldset.querySelector('textarea')?.value || '';
        else selected = [...fieldset.querySelectorAll('input:checked')].map(input => input.value);
        const marker = target.querySelector(`[data-save-state="${qid}"]`);
        if (marker) marker.textContent = 'Guardando…';
        const { error } = await db.rpc('save_assessment_answer', {
          target_attempt: active.id,
          target_question: qid,
          selected_options: selected,
          answer_text: answerText
        });
        if (marker) marker.textContent = error ? 'No se pudo guardar' : 'Guardada';
        if (error) showToast(error.message, 'error');
      };

      questions.forEach(q => {
        const fieldset = target.querySelector(`[data-question="${q.id}"]`);
        if (!fieldset) return;
        if (q.question_type === 'short_text') {
          let debounce;
          fieldset.querySelector('textarea')?.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => saveQuestion(q.id), 600);
          });
        } else fieldset.addEventListener('change', () => saveQuestion(q.id));
      });

      target.querySelector('[data-assessment-form]')?.addEventListener('submit', async event => {
        event.preventDefault();
        if (!confirm('¿Entregar esta evaluación? Después de enviarla no podrás cambiar este intento.')) return;
        const button = event.currentTarget.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Calificando…';
        for (const q of questions) await saveQuestion(q.id);
        const { error } = await db.rpc('submit_assessment_attempt', { target_attempt: active.id });
        if (error) { showToast(error.message, 'error'); button.disabled = false; button.textContent = 'Entregar evaluación'; return; }
        showToast('Evaluación entregada.', 'success');
        await renderAssessment(assessment.id);
      });

      if (assessment.time_limit_minutes) {
        const deadline = new Date(active.started_at).getTime() + Number(assessment.time_limit_minutes) * 60000;
        const tick = () => {
          const left = Math.max(0, deadline - Date.now());
          const minutes = Math.floor(left / 60000);
          const seconds = Math.floor((left % 60000) / 1000);
          const node = target.querySelector('[data-assessment-timer]');
          if (node) node.textContent = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
          if (!left) { stopTimer(); showToast('El tiempo terminó. Este intento se cerrará al intentar guardar o entregar.', 'error'); }
        };
        tick(); timerId = setInterval(tick, 1000);
      }
    } catch (error) {
      console.error('Assessment render:', error);
      target.innerHTML = `<section class="assessment-error"><h2>No pudimos abrir la evaluación</h2><p>${escapeHtml(error.message || 'Intenta nuevamente.')}</p><a class="btn btn-secondary" href="#courses">Volver a mis cursos</a></section>`;
    }
  }

  function interceptAssessmentRoute() {
    const [page, id] = parts();
    if (page === 'assessment' && id && state?.session) {
      setTimeout(() => renderAssessment(id), 0);
      return;
    }
    stopTimer();
    setTimeout(enhanceCoursePage, 80);
  }

  window.addEventListener('hashchange', interceptAssessmentRoute);
  window.addEventListener('popstate', interceptAssessmentRoute);
  setTimeout(interceptAssessmentRoute, 250);
  window.COMPAS_ACADEMY_ASSESSMENTS_VERSION = VERSION;
})();
