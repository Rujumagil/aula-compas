(() => {
  const VERSION = '9.2.0';
  const I = {
    course:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5M8 17h3"/></svg>',
    play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></svg>',
    time:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    award:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="9" r="5"/><path d="m8.5 13-1 8 4.5-2 4.5 2-1-8"/></svg>',
    book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 4 4 10-10"/></svg>'
  };
  const safe = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '');
  const icon = name => `<span class="dash-v9-icon">${I[name]}</span>`;
  const courses = () => Array.isArray(state?.courses) ? state.courses : [];
  const resources = () => Array.isArray(state?.resources) ? state.resources : [];
  const completeMinutes = list => list.reduce((sum,c)=>sum+allLessons(c).reduce((s,l)=>s+(isLessonCompleted(l.id)?Math.max(0,Number(l.duration_minutes||0)):0),0),0);
  const timeLabel = m => !m ? '0 min' : m < 60 ? `${m} min` : `${(m/60).toFixed(1).replace('.0','')} h`;
  const activeCourse = list => list.filter(c=>courseProgress(c)>0&&courseProgress(c)<100).sort((a,b)=>courseProgress(b)-courseProgress(a))[0] || list.find(c=>c.featured) || list.find(c=>courseProgress(c)<100) || list[0] || null;
  const totalProgress = list => { const ls=list.flatMap(allLessons); return ls.length ? Math.round(ls.filter(l=>isLessonCompleted(l.id)).length/ls.length*100) : 0; };
  const stat = (kind,value,label,tone) => `<article class="dash-v9-stat ${tone}"><span>${I[kind]}</span><div><strong>${safe(value)}</strong><small>${safe(label)}</small></div></article>`;

  function continueCard(c){
    if(!c) return `<article class="dash-v9-continue empty"><div class="dash-v9-copy"><span class="eyebrow">Tu siguiente paso</span><h2>Comienza tu primera ruta.</h2><p>Cuando tengas un curso asignado aparecerá aquí con el siguiente paso disponible.</p><div class="dash-v9-actions"><a class="btn btn-primary" href="#catalog">Explorar Academy</a></div></div></article>`;
    const p=courseProgress(c), ls=allLessons(c), done=ls.filter(l=>isLessonCompleted(l.id)).length, next=firstIncompleteLesson(c), href=next?`#lesson/${c.id}/${next.id}`:`#course/${c.id}`;
    return `<article class="dash-v9-continue">
      <a class="dash-v9-media" href="#course/${c.id}" aria-label="Ver ${safe(c.title)}"><img src="${safe(cover(c))}" alt="" aria-hidden="true" onerror="imageErrorFallback(event,'compas-academia.svg')"></a>
      <div class="dash-v9-copy">
        <span class="eyebrow">Tu curso actual</span>
        <h2>${safe(c.title)}</h2>
        <div class="dash-v9-facts"><span>${icon('play')} ${done}/${ls.length} lecciones</span>${next?`<span class="dash-v9-next">${icon('course')} Siguiente: ${safe(next.title)}</span>`:''}</div>
        <div class="dash-v9-progress-label"><span>Tu avance</span><strong>${p}%</strong></div>
        <div class="dash-v9-progress"><span style="width:${p}%"></span></div>
        <div class="dash-v9-actions"><a class="btn btn-primary" href="${href}">${p===100?'Repasar curso':p>0?'Continuar lección':'Comenzar curso'} ${icon('arrow')}</a><a class="dash-v9-text-link" href="#course/${c.id}">Ver programa →</a></div>
      </div>
    </article>`;
  }

  function routePanel(list,current){
    if(!list.length) return '';
    const route=list.slice(0,5);
    const steps=route.map((c,i)=>{const p=courseProgress(c),done=p===100,active=String(current?.id)===String(c.id);return `<a class="dash-v9-route-step ${done?'done':active||p>0?'active':'pending'}" href="#course/${c.id}" title="${safe(c.title)}"><span class="dash-v9-node">${done?I.check:i+1}</span><small>N${i+1}</small></a>`}).join('');
    const currentCourse=current||route.find(c=>courseProgress(c)<100)||route[0];
    const cp=currentCourse?courseProgress(currentCourse):0;
    return `<section class="dash-v9-panel dash-v9-route-panel"><div class="dash-v9-head"><div><span class="eyebrow">Tu ruta Compás</span><h2>Avanza nivel por nivel</h2></div><a href="#courses">Ver ruta completa →</a></div><div class="dash-v9-route">${steps}</div>${currentCourse?`<a class="dash-v9-route-current" href="#course/${currentCourse.id}"><span>Ahora</span><strong>${safe(currentCourse.title)}</strong><em>${cp}% completado</em>${I.arrow}</a>`:''}</section>`;
  }

  function courseCard(c){
    const p=courseProgress(c), next=firstIncompleteLesson(c);
    return `<a class="dash-v9-course" href="${next?`#lesson/${c.id}/${next.id}`:`#course/${c.id}`}"><div><img src="${safe(cover(c))}" alt="" aria-hidden="true" onerror="imageErrorFallback(event,'compas-academia.svg')"></div><section><span class="eyebrow">Siguiente nivel</span><h3>${safe(c.title)}</h3><p>${safe(c.subtitle||c.description||'Continúa tu ruta de aprendizaje Compás.')}</p><footer><span>${p}% completado</span><strong>${p>0?'Continuar':'Ver curso'} ${icon('arrow')}</strong></footer></section></a>`;
  }

  function libraryPanel(){
    const list=resources().slice(0,2); if(!list.length) return '';
    return `<section class="dash-v9-mini"><div class="dash-v9-head compact"><div><span class="eyebrow">Biblioteca</span><h2>Recursos recientes</h2></div><a href="#resources">Ver todo →</a></div><div class="dash-v9-list">${list.map(r=>`<a href="#resources"><span>${I.book}</span><div><strong>${safe(r.title||'Recurso de Academy')}</strong><small>${r.resource_type==='book'?'Libro digital':'Material de apoyo'}</small></div>${I.arrow}</a>`).join('')}</div></section>`;
  }

  function agendaPanel(){
    const ev=typeof ACADEMY_EVENTS!=='undefined'&&Array.isArray(ACADEMY_EVENTS)?ACADEMY_EVENTS.filter(e=>new Date(e.date)>=new Date()).slice(0,2):[];
    if(!ev.length) return '';
    return `<section class="dash-v9-mini"><div class="dash-v9-head compact"><div><span class="eyebrow">Agenda</span><h2>Próximos eventos</h2></div><a href="#agenda">Calendario →</a></div><div class="dash-v9-list">${ev.map(e=>`<a href="#agenda"><span>${I.calendar}</span><div><strong>${safe(e.title)}</strong><small>${safe(e.type||'Evento Academy')}</small></div>${I.arrow}</a>`).join('')}</div></section>`;
  }

  function premiumHome(){
    const page=document.querySelector('#page'); if(!page) return;
    const list=courses(), current=activeCourse(list), lessons=list.flatMap(allLessons), done=lessons.filter(l=>isLessonCompleted(l.id)).length, certs=list.filter(c=>courseProgress(c)===100).length, progress=totalProgress(list), first=String(displayName()||'Alumno').trim().split(/\s+/)[0]||'Alumno';
    const upcoming=list.filter(c=>String(c.id)!==String(current?.id)&&courseProgress(c)<100).slice(0,2);
    const next=current?firstIncompleteLesson(current):null;
    const mainHref=current?(next?`#lesson/${current.id}/${next.id}`:`#course/${current.id}`):'#catalog';
    const learningBlock=current?`<section class="dash-v9-block"><div class="dash-v9-head"><div><span class="eyebrow">Retoma donde lo dejaste</span><h2>Continúa aprendiendo</h2></div><a href="#courses">Mis cursos →</a></div>${continueCard(current)}</section>`:'';
    const upcomingBlock=upcoming.length?`<section class="dash-v9-block dash-v9-upcoming"><div class="dash-v9-head"><div><span class="eyebrow">Lo que sigue</span><h2>Próximos niveles</h2></div><a href="#courses">Ver los ${list.length} cursos →</a></div><div class="dash-v9-course-grid">${upcoming.map(courseCard).join('')}</div></section>`:'';
    const library=libraryPanel(), agenda=agendaPanel(), bottom=(library||agenda)?`<section class="dash-v9-bottom ${library&&agenda?'':'single'}">${library}${agenda}</section>`:'';

    page.innerHTML=`<section class="dash-v9">
      <section class="dash-v9-welcome"><div><span class="eyebrow">Tu espacio de aprendizaje</span><h1>Hola, ${safe(first)} <span>✦</span></h1><p>${list.length?'Continúa desarrollando habilidades y lleva cada aprendizaje a tu operación.':'Tu cuenta está lista para comenzar.'}</p><div class="dash-v9-overall"><div><span>Progreso general</span><strong>${progress}%</strong></div><div><span style="width:${progress}%"></span></div></div><a class="btn btn-primary dash-v9-primary-action" href="${mainHref}">${current?'Continuar aprendizaje':'Explorar cursos'} ${icon('arrow')}</a></div></section>
      <section class="dash-v9-stats">${stat('course',list.length,list.length===1?'Curso activo':'Cursos activos','blue')}${stat('play',`${done}/${lessons.length}`,'Lecciones completadas','green')}${stat('time',timeLabel(completeMinutes(list)),'Tiempo completado','orange')}${stat('award',certs,certs===1?'Certificado obtenido':'Certificados obtenidos','blue')}</section>
      ${learningBlock}
      ${routePanel(list,current)}
      ${upcomingBlock}
      ${bottom}
    </section>`;

    document.querySelector('.dash-v10-ai-card')?.remove();
    document.documentElement.dataset.academyDashboard=VERSION;
  }

  try{renderHome=premiumHome}catch(e){console.error('Dashboard Premium V9.2:',e)}
  const refresh=()=>{const h=location.hash.replace('#','')||'home';if(state?.session&&(h==='home'||h.startsWith('home/')))try{premiumHome()}catch(e){console.error('Dashboard V9.2 render:',e)}};
  setTimeout(refresh,0);
})();