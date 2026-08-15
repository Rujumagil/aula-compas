(() => {
  const VERSION = '19.0.0';
  const SESSION_SKIP_KEY = 'compas-academy-onboarding-skip-v19';
  let profile = null;
  let profileLoadedFor = null;
  let loading = false;

  const GOALS = {
    operate_compas_one: { label: 'Dominar Compás One', slug: 'primeros-pasos-compas-one', reason: 'Empieza por la operación base: panel, CRM, conversaciones y seguimiento.' },
    sell_more: { label: 'Mejorar ventas y seguimiento', slug: 'crm-seguimiento-comercial', reason: 'Tu prioridad es convertir contactos en oportunidades con un proceso comercial claro.' },
    marketing: { label: 'Mejorar marketing digital', slug: 'marketing-digital-con-direccion', reason: 'Esta ruta conecta contenido, objetivos y métricas con el proceso comercial.' },
    meta_ads: { label: 'Aprender Meta Ads', slug: 'meta-ads-campana-oportunidad', reason: 'La ruta recomendada conecta campañas con captación y seguimiento dentro de Compás One.' },
    ai: { label: 'Aplicar IA al negocio', slug: 'ia-aplicada-negocios', reason: 'Comienza usando IA con contexto, propósito y casos reales de negocio.' },
    automation: { label: 'Automatizar tareas repetitivas', slug: 'automatizacion-equipos-pequenos', reason: 'Primero identifica tareas repetibles y conviértelas en flujos sostenibles.' }
  };

  const FOCUS = [
    ['crm','CRM'],['ventas','Ventas'],['marketing','Marketing'],['meta_ads','Meta Ads'],['ia','IA'],['automatizacion','Automatización']
  ];

  const isManager = () => (typeof isAdmin === 'function' && isAdmin()) || (typeof isInstructor === 'function' && isInstructor());
  const currentUserId = () => state?.user?.id || state?.session?.user?.id || '';
  const currentRoute = () => String(location.hash || '#home').replace(/^#/,'').split('/')[0] || 'home';
  const courseBySlug = slug => Array.isArray(state?.courses) ? state.courses.find(course => course.slug === slug) : null;
  const escape = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  async function loadProfile(force=false) {
    const uid = currentUserId();
    if (!uid || isManager()) return null;
    if (!force && profileLoadedFor === uid) return profile;
    if (loading) return profile;
    loading = true;
    try {
      const { data, error } = await db.from('academy_onboarding_profiles').select('*').eq('user_id',uid).maybeSingle();
      if (error) throw error;
      profile = data || null;
      profileLoadedFor = uid;
      return profile;
    } catch (error) {
      console.error('Academy onboarding V19 load:',error);
      return null;
    } finally {
      loading = false;
    }
  }

  function recommendationHref(slug) {
    const course = courseBySlug(slug);
    return course ? `#course/${course.id}` : '#catalog';
  }

  function recommendationCard() {
    if (!profile?.recommended_course_slug) return '';
    const goal = GOALS[profile.goal] || GOALS.operate_compas_one;
    const assigned = courseBySlug(profile.recommended_course_slug);
    return `<section class="onboarding-v19-recommendation glass" data-onboarding-recommendation>
      <div class="onboarding-v19-recommendation-copy">
        <span class="eyebrow">Ruta recomendada para ti</span>
        <h2>${escape(assigned?.title || goal.label)}</h2>
        <p>${escape(goal.reason)}</p>
        <div class="onboarding-v19-meta">
          <span>${escape(profile.experience_level === 'beginner' ? 'Nivel inicial' : profile.experience_level === 'intermediate' ? 'Nivel intermedio' : 'Nivel avanzado')}</span>
          <span>${escape(String(profile.weekly_minutes || 120))} min por semana</span>
        </div>
      </div>
      <div class="onboarding-v19-recommendation-actions">
        <a class="btn btn-primary" href="${recommendationHref(profile.recommended_course_slug)}">${assigned ? 'Ir a mi ruta' : 'Explorar esta ruta'}</a>
        <button class="btn btn-secondary" type="button" data-onboarding-edit>Actualizar diagnóstico</button>
      </div>
    </section>`;
  }

  function injectRecommendation() {
    if (!profile || currentRoute() !== 'home' || isManager()) return;
    const page = document.querySelector('#page');
    if (!page || page.querySelector('[data-onboarding-recommendation]')) return;
    const welcome = page.querySelector('.dash-v9-welcome') || page.firstElementChild;
    if (!welcome) return;
    welcome.insertAdjacentHTML('afterend',recommendationCard());
    page.querySelector('[data-onboarding-edit]')?.addEventListener('click',()=>openOnboarding(true));
  }

  function optionCards(name, items, selected) {
    return items.map(([value,label,desc])=>`<label class="onboarding-v19-option ${selected===value?'selected':''}">
      <input type="radio" name="${name}" value="${escape(value)}" ${selected===value?'checked':''} required>
      <span><strong>${escape(label)}</strong>${desc?`<small>${escape(desc)}</small>`:''}</span>
    </label>`).join('');
  }

  function focusCards(selected=[]) {
    return FOCUS.map(([value,label])=>`<label class="onboarding-v19-focus ${selected.includes(value)?'selected':''}">
      <input type="checkbox" name="focus" value="${escape(value)}" ${selected.includes(value)?'checked':''}>
      <span>${escape(label)}</span>
    </label>`).join('');
  }

  function openOnboarding(edit=false) {
    if (document.querySelector('.onboarding-v19-overlay')) return;
    const existing = profile || {};
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-v19-overlay';
    overlay.innerHTML = `<section class="onboarding-v19-modal glass" role="dialog" aria-modal="true" aria-labelledby="onboarding-v19-title">
      <button class="onboarding-v19-close" type="button" aria-label="Cerrar" data-onboarding-close>×</button>
      <div class="onboarding-v19-heading">
        <span class="eyebrow">Tu punto de partida</span>
        <h1 id="onboarding-v19-title">${edit?'Actualiza tu ruta':'Bienvenido a Compás Academy'}</h1>
        <p>Cuéntanos qué quieres lograr y organizaremos una primera ruta de aprendizaje. Puedes cambiarla después.</p>
      </div>
      <form class="onboarding-v19-form">
        <fieldset>
          <legend>1. ¿Cuál es tu objetivo principal?</legend>
          <div class="onboarding-v19-grid">${optionCards('goal',Object.entries(GOALS).map(([value,item])=>[value,item.label,item.reason]),existing.goal || '')}</div>
        </fieldset>
        <fieldset>
          <legend>2. ¿Qué experiencia tienes con estas herramientas?</legend>
          <div class="onboarding-v19-grid compact">${optionCards('experience_level',[
            ['beginner','Estoy comenzando','Necesito una guía paso a paso.'],
            ['intermediate','Ya las uso','Quiero ordenar y mejorar mi proceso.'],
            ['advanced','Tengo experiencia','Quiero optimizar y automatizar.']
          ],existing.experience_level || '')}</div>
        </fieldset>
        <fieldset>
          <legend>3. Áreas que más te interesan</legend>
          <div class="onboarding-v19-focus-grid">${focusCards(Array.isArray(existing.focus_areas)?existing.focus_areas:[])}</div>
        </fieldset>
        <div class="onboarding-v19-two-col">
          <label><span>Tiempo disponible por semana</span><select name="weekly_minutes">
            <option value="60" ${Number(existing.weekly_minutes)===60?'selected':''}>1 hora</option>
            <option value="120" ${!existing.weekly_minutes||Number(existing.weekly_minutes)===120?'selected':''}>2 horas</option>
            <option value="180" ${Number(existing.weekly_minutes)===180?'selected':''}>3 horas</option>
            <option value="300" ${Number(existing.weekly_minutes)===300?'selected':''}>5 horas</option>
          </select></label>
          <label><span>Objetivo concreto (opcional)</span><input name="objective_text" maxlength="500" value="${escape(existing.objective_text || '')}" placeholder="Ej. organizar mis prospectos y dar seguimiento cada día"></label>
        </div>
        <div class="onboarding-v19-actions">
          ${edit?'':'<button class="btn btn-secondary" type="button" data-onboarding-later>Más tarde</button>'}
          <button class="btn btn-primary" type="submit">Guardar y crear mi ruta</button>
        </div>
        <p class="onboarding-v19-status" aria-live="polite"></p>
      </form>
    </section>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('[data-onboarding-close]')?.addEventListener('click',close);
    overlay.querySelector('[data-onboarding-later]')?.addEventListener('click',()=>{sessionStorage.setItem(SESSION_SKIP_KEY,'1'); close();});
    overlay.addEventListener('click',event=>{ if(event.target===overlay && edit) close(); });
    overlay.querySelectorAll('input[type="radio"],input[type="checkbox"]').forEach(input=>input.addEventListener('change',()=>{
      input.closest('.onboarding-v19-option,.onboarding-v19-focus')?.classList.toggle('selected',input.checked);
      if(input.type==='radio') overlay.querySelectorAll(`input[name="${input.name}"]`).forEach(other=>{ if(other!==input) other.closest('.onboarding-v19-option')?.classList.remove('selected'); });
    }));
    overlay.querySelector('form')?.addEventListener('submit',saveOnboarding);
  }

  async function saveOnboarding(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = form.querySelector('.onboarding-v19-status');
    const submit = form.querySelector('[type="submit"]');
    const fd = new FormData(form);
    const goal = String(fd.get('goal') || '');
    const experience = String(fd.get('experience_level') || '');
    if (!GOALS[goal] || !['beginner','intermediate','advanced'].includes(experience)) {
      status.textContent = 'Selecciona tu objetivo y nivel para continuar.';
      return;
    }
    const focus = fd.getAll('focus').map(String).slice(0,6);
    const uid = currentUserId();
    const payload = {
      user_id: uid,
      goal,
      experience_level: experience,
      weekly_minutes: Number(fd.get('weekly_minutes') || 120),
      focus_areas: focus,
      objective_text: String(fd.get('objective_text') || '').trim() || null,
      recommended_course_slug: GOALS[goal].slug,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    submit.disabled = true;
    status.textContent = 'Guardando tu ruta…';
    try {
      const { data, error } = await db.from('academy_onboarding_profiles').upsert(payload,{onConflict:'user_id'}).select().single();
      if (error) throw error;
      profile = data;
      profileLoadedFor = uid;
      sessionStorage.removeItem(SESSION_SKIP_KEY);
      document.querySelector('.onboarding-v19-overlay')?.remove();
      document.querySelector('[data-onboarding-recommendation]')?.remove();
      injectRecommendation();
      if (typeof showToast === 'function') showToast('Tu ruta de aprendizaje quedó actualizada.','success');
    } catch (error) {
      console.error('Academy onboarding V19 save:',error);
      status.textContent = 'No pudimos guardar tu diagnóstico. Intenta nuevamente.';
      submit.disabled = false;
    }
  }

  async function refresh() {
    if (!state?.session || isManager()) return;
    const uid = currentUserId();
    if (!uid) return;
    await loadProfile(false);
    if (currentRoute()==='home') {
      injectRecommendation();
      if (!profile && sessionStorage.getItem(SESSION_SKIP_KEY)!=='1') openOnboarding(false);
    }
  }

  function schedule() { setTimeout(refresh,120); setTimeout(refresh,500); }
  window.addEventListener('hashchange',schedule);
  const observer = new MutationObserver(()=>{ if(state?.session && currentRoute()==='home') setTimeout(injectRecommendation,0); });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  schedule();
  console.info(`Compás Academy Onboarding V${VERSION}`);
})();