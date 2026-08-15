(() => {
  const VERSION = '15.0.0';
  let rendering = false;

  const isManager = () => Boolean(state?.session) && ((typeof isAdmin === 'function' && isAdmin()) || (typeof isInstructor === 'function' && isInstructor()));
  const currentHash = () => String(location.hash || '').replace(/^#/, '');

  function managedCourses() {
    if (!isManager()) return [];
    const active = state?.activeWorkspaceId;
    if (!active || active === 'general') return state?.courses || [];
    return (state?.courses || []).filter(course => String(course.workspace_id) === String(active));
  }

  const courseName = id => state?.courses?.find(c => String(c.id) === String(id))?.title || 'Curso';
  const personName = id => {
    const p = state?.profiles?.find(x => String(x.id) === String(id));
    return p?.full_name || p?.email || 'Alumno';
  };
  const typeLabel = value => ({quiz:'Evaluación',module_exam:'Examen de módulo',final_exam:'Examen final'})[value] || 'Evaluación';
  const questionTypeLabel = value => ({single_choice:'Opción única',multiple_choice:'Opción múltiple',true_false:'Verdadero/Falso',short_text:'Respuesta abierta'})[value] || value;

  async function loadModel(courses) {
    const courseIds = courses.map(c => c.id);
    if (!courseIds.length) return { assessments:[], questions:[], attempts:[], answers:[] };

    const assessmentsResult = await db.from('assessments').select('*').in('course_id', courseIds).order('position',{ascending:true});
    if (assessmentsResult.error) throw assessmentsResult.error;
    const assessments = assessmentsResult.data || [];
    const assessmentIds = assessments.map(a => a.id);
    if (!assessmentIds.length) return { assessments, questions:[], attempts:[], answers:[] };

    const [questionsResult, attemptsResult] = await Promise.all([
      db.from('assessment_questions').select('*').in('assessment_id', assessmentIds).order('position',{ascending:true}),
      db.from('assessment_attempts').select('*').in('assessment_id', assessmentIds).order('started_at',{ascending:false})
    ]);
    if (questionsResult.error) throw questionsResult.error;
    if (attemptsResult.error) throw attemptsResult.error;
    const questions = questionsResult.data || [];
    const attempts = attemptsResult.data || [];
    const pendingIds = attempts.filter(a => a.status === 'submitted').map(a => a.id);
    let answers = [];
    if (pendingIds.length) {
      const answersResult = await db.from('assessment_answers').select('*').in('attempt_id', pendingIds);
      if (answersResult.error) throw answersResult.error;
      answers = answersResult.data || [];
    }
    return { assessments, questions, attempts, answers };
  }

  function ensureNav() {
    const nav = document.querySelector('.workspace-admin-tabs');
    if (!nav || nav.querySelector('[href="#admin-assessments"]')) return;
    const link = document.createElement('a');
    link.href = '#admin-assessments';
    link.textContent = 'Evaluaciones';
    const createLink = nav.querySelector('[href="#create-course-panel"]');
    nav.insertBefore(link, createLink || null);
  }

  function assessmentCard(a, model) {
    const qs = model.questions.filter(q => q.assessment_id === a.id);
    const attempts = model.attempts.filter(x => x.assessment_id === a.id);
    const passed = attempts.filter(x => x.status === 'graded' && x.passed).length;
    const pending = attempts.filter(x => x.status === 'submitted').length;
    return `<article class="assessment-admin-card">
      <header><div><span class="status-pill ${a.status === 'published' ? 'available' : ''}">${a.status === 'published' ? 'Publicada' : a.status === 'archived' ? 'Archivada' : 'Borrador'}</span><span>${escapeHtml(typeLabel(a.assessment_type))}</span></div><strong>${Number(a.passing_score)}%</strong></header>
      <h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(courseName(a.course_id))}</p>
      <div class="assessment-admin-metrics"><span><b>${qs.length}</b> preguntas</span><span><b>${attempts.length}</b> intentos</span><span><b>${passed}</b> aprobados</span><span><b>${pending}</b> por revisar</span></div>
      <footer>
        <button class="btn btn-secondary" type="button" data-assessment-editor="${escapeHtml(a.id)}">Ver preguntas</button>
        <button class="btn ${a.status === 'published' ? 'btn-secondary' : 'btn-primary'}" type="button" data-assessment-status="${escapeHtml(a.id)}" data-next-status="${a.status === 'published' ? 'draft' : 'published'}">${a.status === 'published' ? 'Pasar a borrador' : 'Publicar'}</button>
      </footer>
      <div class="assessment-admin-editor hide" data-assessment-editor-panel="${escapeHtml(a.id)}"></div>
    </article>`;
  }

  function pendingReview(attempt, model) {
    const assessment = model.assessments.find(a => a.id === attempt.assessment_id);
    const qs = model.questions.filter(q => q.assessment_id === attempt.assessment_id && q.question_type === 'short_text');
    const answers = model.answers.filter(a => a.attempt_id === attempt.id);
    return `<article class="assessment-review-card">
      <header><div><span class="eyebrow">Revisión manual</span><h3>${escapeHtml(assessment?.title || 'Evaluación')}</h3></div><span>${escapeHtml(personName(attempt.user_id))}</span></header>
      <p>${escapeHtml(courseName(assessment?.course_id))} · Intento ${Number(attempt.attempt_number)}</p>
      <form data-grade-attempt="${escapeHtml(attempt.id)}">
        ${qs.map(q => {
          const answer = answers.find(a => a.question_id === q.id);
          return `<fieldset data-manual-grade="${escapeHtml(q.id)}"><legend>${escapeHtml(q.prompt)}</legend><blockquote>${escapeHtml(answer?.text_answer || 'Sin respuesta')}</blockquote><div class="assessment-grade-row"><label>Puntos <input type="number" name="points" min="0" max="${Number(q.points)}" step="0.25" value="0"></label><label><input type="checkbox" name="correct"> Marcar correcta</label><span>Máx. ${Number(q.points)}</span></div></fieldset>`;
        }).join('') || '<p>No hay respuestas abiertas para revisar.</p>'}
        <button class="btn btn-primary" type="submit" ${qs.length ? '' : 'disabled'}>Guardar calificación</button>
      </form>
    </article>`;
  }

  async function renderEditor(id, panel, model) {
    panel.classList.remove('hide');
    panel.innerHTML = '<p>Cargando respuestas correctas…</p>';
    const { data: options, error } = await db.rpc('get_assessment_manager_options',{target_assessment:id});
    if (error) { panel.innerHTML = `<p>${escapeHtml(error.message)}</p>`; return; }
    const qs = model.questions.filter(q => q.assessment_id === id);
    panel.innerHTML = qs.length ? qs.map((q,index) => {
      const opts = (options || []).filter(o => o.question_id === q.id);
      return `<section><div><span>${index+1}</span><strong>${escapeHtml(q.prompt)}</strong><small>${escapeHtml(questionTypeLabel(q.question_type))} · ${Number(q.points)} pts</small></div>${opts.length ? `<ul>${opts.map(o => `<li class="${o.is_correct ? 'correct' : ''}">${o.is_correct ? '✓ ' : ''}${escapeHtml(o.label)}</li>`).join('')}</ul>` : '<em>Respuesta abierta</em>'}</section>`;
    }).join('') : '<p>Aún no hay preguntas.</p>';
  }

  function bindForms(section, courses, model) {
    section.querySelector('#assessment-admin-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget, data = new FormData(form);
      setFormBusy(form,true);
      try {
        const courseId = String(data.get('courseId'));
        const moduleId = String(data.get('moduleId') || '') || null;
        const { error } = await db.from('assessments').insert({
          course_id:courseId,module_id:moduleId,title:String(data.get('title')).trim(),description:String(data.get('description')||'').trim()||null,
          assessment_type:String(data.get('assessmentType')),passing_score:Number(data.get('passingScore')||70),max_attempts:Number(data.get('maxAttempts')||3),
          time_limit_minutes:Number(data.get('timeLimit')||0)||null,status:String(data.get('status')||'draft'),position:Number(data.get('position')||1),created_by:state.user.id
        });
        if (error) throw error;
        showToast('Evaluación creada.','success'); await renderAdminAssessments(true);
      } catch (error) { showToast(error.message || 'No se pudo crear la evaluación.','error'); }
      finally { setFormBusy(form,false); }
    });

    section.querySelector('#assessment-question-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget, data = new FormData(form), type = String(data.get('questionType'));
      setFormBusy(form,true);
      try {
        const assessmentId = String(data.get('assessmentId'));
        const { data: question, error } = await db.from('assessment_questions').insert({assessment_id:assessmentId,prompt:String(data.get('prompt')).trim(),question_type:type,explanation:String(data.get('explanation')||'').trim()||null,points:Number(data.get('points')||1),position:Number(data.get('position')||1)}).select().single();
        if (error) throw error;
        if (type !== 'short_text') {
          const labels = type === 'true_false' ? ['Verdadero','Falso'] : String(data.get('options')||'').split('\n').map(x=>x.trim()).filter(Boolean);
          const correct = new Set(String(data.get('correctIndexes')||'1').split(',').map(x=>Number(x.trim())).filter(Number.isFinite));
          if (labels.length < 2) throw new Error('Agrega al menos dos opciones.');
          const rows = labels.map((label,i)=>({question_id:question.id,label,is_correct:correct.has(i+1),position:i+1}));
          if (!rows.some(r=>r.is_correct)) throw new Error('Marca al menos una opción correcta.');
          const optionResult = await db.from('assessment_options').insert(rows);
          if (optionResult.error) throw optionResult.error;
        }
        showToast('Pregunta agregada.','success'); await renderAdminAssessments(true);
      } catch (error) { showToast(error.message || 'No se pudo agregar la pregunta.','error'); }
      finally { setFormBusy(form,false); }
    });

    section.querySelectorAll('[data-assessment-status]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      const { error } = await db.from('assessments').update({status:button.dataset.nextStatus,updated_at:new Date().toISOString()}).eq('id',button.dataset.assessmentStatus);
      if (error) showToast(error.message,'error'); else { showToast('Estado actualizado.','success'); await renderAdminAssessments(true); }
    }));

    section.querySelectorAll('[data-assessment-editor]').forEach(button => button.addEventListener('click', () => {
      const panel = section.querySelector(`[data-assessment-editor-panel="${button.dataset.assessmentEditor}"]`);
      if (panel?.dataset.loaded === 'true') { panel.classList.toggle('hide'); return; }
      if (panel) { panel.dataset.loaded='true'; renderEditor(button.dataset.assessmentEditor,panel,model); }
    }));

    section.querySelectorAll('[data-grade-attempt]').forEach(form => form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!confirm('¿Guardar esta calificación y cerrar el intento?')) return;
      const grades = [...form.querySelectorAll('[data-manual-grade]')].map(field => ({question_id:field.dataset.manualGrade,points:Number(field.querySelector('[name="points"]')?.value||0),correct:Boolean(field.querySelector('[name="correct"]')?.checked)}));
      setFormBusy(form,true);
      const { data, error } = await db.rpc('grade_assessment_attempt',{target_attempt:form.dataset.gradeAttempt,manual_grades:grades});
      if (error) { showToast(error.message,'error'); setFormBusy(form,false); return; }
      const result = Array.isArray(data) ? data[0] : data;
      showToast(`Calificación guardada: ${Number(result?.final_score||0)}%`,'success');
      await renderAdminAssessments(true);
    }));
  }

  async function renderAdminAssessments(force=false) {
    if (rendering || !isManager() || !currentHash().startsWith('workspace/')) return;
    const page = document.querySelector('#page');
    if (!page) return;
    ensureNav();
    if (!force && page.querySelector('#admin-assessments')) return;
    rendering = true;
    page.querySelector('#admin-assessments')?.remove();
    const section = document.createElement('section');
    section.id = 'admin-assessments'; section.className = 'assessment-admin-section';
    section.innerHTML = '<div class="assessment-admin-loading"><div class="spinner"></div><p>Cargando evaluaciones…</p></div>';
    const coursesAnchor = page.querySelector('#admin-courses');
    coursesAnchor?.insertAdjacentElement('afterend',section) || page.appendChild(section);
    try {
      const courses = managedCourses();
      const model = await loadModel(courses);
      const pending = model.attempts.filter(a => a.status === 'submitted');
      const courseOptions = courses.map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');
      const moduleOptions = courses.flatMap(c=>(c.modules||[]).map(m=>`<option value="${escapeHtml(m.id)}">${escapeHtml(c.title)} — ${escapeHtml(m.title)}</option>`)).join('');
      const assessmentOptions = model.assessments.map(a=>`<option value="${escapeHtml(a.id)}">${escapeHtml(a.title)}</option>`).join('');
      section.innerHTML = `
        <div class="assessment-admin-heading"><div><span class="eyebrow">Evaluación y dominio</span><h2>Evaluaciones</h2><p>Crea checkpoints, exámenes y revisa respuestas abiertas sin exponer las respuestas correctas a los alumnos.</p></div><span>${model.assessments.length} evaluaciones</span></div>
        <div class="assessment-admin-summary"><article><strong>${model.assessments.length}</strong><span>Total</span></article><article><strong>${model.assessments.filter(a=>a.status==='published').length}</strong><span>Publicadas</span></article><article><strong>${model.attempts.length}</strong><span>Intentos</span></article><article><strong>${pending.length}</strong><span>Por revisar</span></article></div>
        <div class="assessment-admin-builder">
          <article class="settings-card glass"><h3>Crear evaluación</h3><form id="assessment-admin-form" class="stack-form"><div class="field"><label>Curso</label><select name="courseId" required>${courseOptions}</select></div><div class="field"><label>Módulo opcional</label><select name="moduleId"><option value="">Curso completo</option>${moduleOptions}</select></div><div class="field"><label>Título</label><input name="title" required></div><div class="field"><label>Descripción</label><textarea name="description" rows="2"></textarea></div><div class="form-two-columns"><div class="field"><label>Tipo</label><select name="assessmentType"><option value="quiz">Evaluación</option><option value="module_exam">Examen de módulo</option><option value="final_exam">Examen final</option></select></div><div class="field"><label>Estado</label><select name="status"><option value="draft">Borrador</option><option value="published">Publicada</option></select></div></div><div class="form-two-columns"><div class="field"><label>Mínimo %</label><input name="passingScore" type="number" min="0" max="100" value="70"></div><div class="field"><label>Intentos</label><input name="maxAttempts" type="number" min="1" value="3"></div></div><div class="form-two-columns"><div class="field"><label>Tiempo (min)</label><input name="timeLimit" type="number" min="0" value="10"></div><div class="field"><label>Posición</label><input name="position" type="number" min="1" value="1"></div></div><button class="btn btn-primary" ${courses.length?'':'disabled'}>Crear evaluación</button></form></article>
          <article class="settings-card glass"><h3>Agregar pregunta</h3><form id="assessment-question-form" class="stack-form"><div class="field"><label>Evaluación</label><select name="assessmentId" required>${assessmentOptions}</select></div><div class="field"><label>Pregunta</label><textarea name="prompt" rows="2" required></textarea></div><div class="form-two-columns"><div class="field"><label>Tipo</label><select name="questionType"><option value="single_choice">Opción única</option><option value="multiple_choice">Opción múltiple</option><option value="true_false">Verdadero/Falso</option><option value="short_text">Respuesta abierta</option></select></div><div class="field"><label>Puntos</label><input name="points" type="number" min="0.25" step="0.25" value="1"></div></div><div class="field"><label>Opciones (una por línea)</label><textarea name="options" rows="4" placeholder="Opción 1\nOpción 2\nOpción 3"></textarea></div><div class="field"><label>Correctas</label><input name="correctIndexes" value="1" placeholder="1 o 1,3"><small>Indica el número de la opción correcta. En Verdadero/Falso: 1=Verdadero, 2=Falso.</small></div><div class="field"><label>Explicación opcional</label><input name="explanation"></div><div class="field"><label>Posición</label><input name="position" type="number" min="1" value="1"></div><button class="btn btn-primary" ${model.assessments.length?'':'disabled'}>Agregar pregunta</button></form></article>
        </div>
        <div class="assessment-admin-grid">${model.assessments.length ? model.assessments.map(a=>assessmentCard(a,model)).join('') : '<div class="instructor-empty-state"><h3>Aún no hay evaluaciones</h3><p>Crea la primera desde el formulario superior.</p></div>'}</div>
        <section class="assessment-review-section"><div class="section-heading"><div><span class="eyebrow">Seguimiento académico</span><h3>Respuestas por revisar</h3></div><span>${pending.length}</span></div><div class="assessment-review-grid">${pending.length ? pending.map(a=>pendingReview(a,model)).join('') : '<div class="assessment-review-empty">No hay evaluaciones pendientes de revisión manual.</div>'}</div></section>`;
      bindForms(section,courses,model);
    } catch (error) {
      console.error('Assessment admin V15:',error);
      section.innerHTML = `<div class="assessment-admin-error"><h3>No se pudo cargar el panel de evaluaciones</h3><p>${escapeHtml(error.message||'Intenta nuevamente.')}</p></div>`;
    } finally { rendering=false; }
  }

  const observer = new MutationObserver(() => setTimeout(()=>renderAdminAssessments(false),40));
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('hashchange',()=>setTimeout(()=>renderAdminAssessments(false),80));
  setTimeout(()=>renderAdminAssessments(false),300);
  window.COMPAS_ACADEMY_ASSESSMENT_ADMIN_VERSION = VERSION;
})();
