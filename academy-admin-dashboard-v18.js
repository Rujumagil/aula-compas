(() => {
  const VERSION = '18.0.0';
  let renderToken = 0;

  const isManager = () => Boolean(state?.session) && ((typeof isAdmin === 'function' && isAdmin()) || (typeof isInstructor === 'function' && isInstructor()));
  const routeInfo = () => {
    const clean = String(location.hash || '').replace(/^#/, '');
    const [page, id] = clean.split('/');
    return { page, id };
  };
  const number = value => Number(value || 0);
  const percent = value => `${number(value).toLocaleString('es-MX',{maximumFractionDigits:1})}%`;
  const dateLabel = value => value ? new Intl.DateTimeFormat('es-MX',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)) : 'Sin actividad';

  function ensureNav(section) {
    const nav = document.querySelector('.workspace-admin-tabs');
    if (!nav || nav.querySelector('[data-academy-analytics-link]')) return;
    const link = document.createElement('a');
    link.href = '#academy-analytics';
    link.dataset.academyAnalyticsLink = 'true';
    link.textContent = 'Analítica';
    link.addEventListener('click', event => {
      event.preventDefault();
      section?.scrollIntoView({behavior:'smooth',block:'start'});
    });
    const users = nav.querySelector('[href="#admin-users"]');
    nav.insertBefore(link, users || nav.lastElementChild);
  }

  function summaryCard(icon, value, label, tone='blue') {
    return `<article class="analytics-v18-card ${tone}"><span>${icon}</span><div><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(label)}</small></div></article>`;
  }

  function courseRow(course) {
    const graded = number(course.graded_attempts), passed = number(course.passed_attempts);
    const passRate = graded ? (passed / graded) * 100 : 0;
    return `<tr>
      <td><strong>${escapeHtml(course.title)}</strong><small>${escapeHtml(course.category || 'Curso')} · ${escapeHtml(course.status || '')}</small></td>
      <td>${number(course.active_enrollments)}</td>
      <td><div class="analytics-v18-progress"><span style="width:${Math.min(100,number(course.avg_progress))}%"></span></div><small>${percent(course.avg_progress)}</small></td>
      <td>${number(course.completed_enrollments)}/${number(course.total_enrollments)}</td>
      <td>${graded ? percent(passRate) : '—'}<small>${graded ? `${passed}/${graded} intentos` : 'Sin intentos calificados'}</small></td>
      <td>${number(course.certificates_issued)}</td>
    </tr>`;
  }

  function riskRow(row) {
    const name = row.full_name || row.email || 'Alumno';
    return `<tr>
      <td><strong>${escapeHtml(name)}</strong><small>${escapeHtml(row.email || '')}</small></td>
      <td>${escapeHtml(row.course_title || 'Curso')}</td>
      <td>${percent(row.progress)}<small>${number(row.completed_lessons)}/${number(row.total_lessons)} lecciones</small></td>
      <td><span class="analytics-v18-risk-pill">${number(row.inactive_days)} días</span><small>${escapeHtml(dateLabel(row.last_activity))}</small></td>
      <td><a class="btn btn-secondary" href="#admin-users">Revisar alumno</a></td>
    </tr>`;
  }

  async function loadDashboard(targetWorkspace) {
    const { data, error } = await db.rpc('get_academy_admin_dashboard',{target_workspace:targetWorkspace || null});
    if (error) throw error;
    return data || {summary:{},courses:[],at_risk:[]};
  }

  async function render(force=false) {
    const info = routeInfo();
    if (!isManager() || info.page !== 'workspace') return;
    const page = document.querySelector('#page');
    const courseAnchor = page?.querySelector('#admin-courses');
    if (!page || !courseAnchor) return;
    if (!force && page.querySelector('#academy-analytics')) return;

    const token = ++renderToken;
    page.querySelector('#academy-analytics')?.remove();
    const section = document.createElement('section');
    section.id = 'academy-analytics';
    section.className = 'analytics-v18-section';
    section.innerHTML = '<div class="analytics-v18-loading"><div class="spinner"></div><p>Calculando indicadores académicos…</p></div>';
    courseAnchor.insertAdjacentElement('afterend',section);
    ensureNav(section);

    const targetWorkspace = info.id && info.id !== 'general' ? info.id : null;
    try {
      const model = await loadDashboard(targetWorkspace);
      if (token !== renderToken || !document.body.contains(section)) return;
      const summary = model.summary || {}, courses = Array.isArray(model.courses) ? model.courses : [], risk = Array.isArray(model.at_risk) ? model.at_risk : [];
      section.innerHTML = `
        <div class="analytics-v18-heading">
          <div><span class="eyebrow">Pulso académico</span><h2>Dashboard académico</h2><p>Finalización, evaluaciones, certificados y alumnos que necesitan seguimiento, calculados directamente desde Supabase.</p></div>
          <button class="btn btn-secondary" type="button" data-analytics-refresh>Actualizar</button>
        </div>
        <div class="analytics-v18-summary">
          ${summaryCard('◎',number(summary.active_students),'Alumnos activos','blue')}
          ${summaryCard('✓',percent(summary.completion_rate),'Finalización','green')}
          ${summaryCard('◇',percent(summary.assessment_pass_rate),'Aprobación evaluaciones','orange')}
          ${summaryCard('◆',number(summary.certificates),'Certificados','blue')}
          ${summaryCard('!',number(summary.at_risk_students),'Requieren seguimiento',number(summary.at_risk_students)>0?'risk':'green')}
        </div>
        <article class="analytics-v18-panel glass">
          <div class="analytics-v18-panel-head"><div><span class="eyebrow">Rendimiento por curso</span><h3>Progreso de la oferta académica</h3></div><span>${courses.length} cursos</span></div>
          <div class="analytics-v18-table-wrap"><table class="admin-table analytics-v18-table"><thead><tr><th>Curso</th><th>Activos</th><th>Progreso promedio</th><th>Finalizados</th><th>Evaluaciones</th><th>Certificados</th></tr></thead><tbody>${courses.length ? courses.map(courseRow).join('') : '<tr><td colspan="6">No hay cursos administrables en este espacio.</td></tr>'}</tbody></table></div>
        </article>
        <article class="analytics-v18-panel glass">
          <div class="analytics-v18-panel-head"><div><span class="eyebrow">Intervención temprana</span><h3>Alumnos que necesitan seguimiento</h3><p>Inscripciones activas con contenido pendiente y más de 7 días sin actividad académica.</p></div><span class="analytics-v18-risk-count">${risk.length}</span></div>
          <div class="analytics-v18-table-wrap"><table class="admin-table analytics-v18-table"><thead><tr><th>Alumno</th><th>Curso</th><th>Progreso</th><th>Inactividad</th><th>Acción</th></tr></thead><tbody>${risk.length ? risk.map(riskRow).join('') : '<tr><td colspan="5"><div class="analytics-v18-clear">✓ No hay alumnos en riesgo por inactividad en este momento.</div></td></tr>'}</tbody></table></div>
        </article>
        <p class="analytics-v18-updated">Actualizado ${new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(model.generated_at || Date.now()))}</p>`;
      section.querySelector('[data-analytics-refresh]')?.addEventListener('click',()=>render(true));
    } catch (error) {
      console.error('Academy analytics V18:',error);
      section.innerHTML = `<div class="analytics-v18-error"><strong>No pudimos cargar la analítica.</strong><p>${escapeHtml(error?.message || 'Revisa permisos y conexión con Supabase.')}</p><button class="btn btn-secondary" type="button" data-analytics-refresh>Reintentar</button></div>`;
      section.querySelector('[data-analytics-refresh]')?.addEventListener('click',()=>render(true));
    }
  }

  function scheduleRender() { setTimeout(()=>render(false),0); setTimeout(()=>render(false),250); }
  window.addEventListener('hashchange',scheduleRender);
  document.addEventListener('click',event=>{
    if (event.target.closest('[data-admin-scroll]')) setTimeout(()=>render(false),150);
  });
  scheduleRender();
  console.info(`Compás Academy Admin Dashboard V${VERSION}`);
})();