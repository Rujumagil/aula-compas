const DATA = window.AULA_DATA;
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
let deferredPrompt = null;

const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const state = {
  loggedIn: store.get('aula_v2_logged_in', false),
  completed: store.get('aula_v2_completed', {}),
  notes: store.get('aula_v2_notes', {}),
  students: store.get('aula_v2_students', [
    {name:'María López', email:'maria@email.com', course:'Despierta tu memoria', progress:65},
    {name:'Carlos Herrera', email:'carlos@email.com', course:'El Compás del Estratega', progress:42},
    {name:'Laura Gómez', email:'laura@email.com', course:'Legado que Trasciende', progress:78}
  ]),
  extraCourses: store.get('aula_v2_extra_courses', [])
};

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  document.querySelectorAll('[data-install]').forEach(button => button.classList.remove('hide'));
});
window.addEventListener('appinstalled', () => showToast('Aula Compás quedó instalada.'));

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function allCourses(){ return [...DATA.courses, ...state.extraCourses]; }
function findCourse(id){ return allCourses().find(course => course.id === id); }

function route(){
  if(!state.loggedIn) return renderLogin();
  const hash = location.hash.replace('#','') || 'home';
  const [page,id,lessonId] = hash.split('/');
  renderShell(page, () => {
    if(page==='home') renderHome();
    else if(page==='courses') renderCourses();
    else if(page==='course') renderCourse(id);
    else if(page==='lesson') renderLesson(id, lessonId);
    else if(page==='progress') renderProgress();
    else if(page==='resources') renderResources();
    else if(page==='profile') renderProfile();
    else if(page==='admin') renderAdmin();
    else renderHome();
  });
}

function renderLogin(){
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass">
        <div class="login-brand">
          <img class="official-lockup" src="assets/logo-completo-oficial.png" alt="Proyecto Compás">
          <h1>Aula Compás</h1>
          <p>Aprende. Crea. Trasciende.</p>
        </div>
        <form id="login-form">
          <div class="field"><label>Correo electrónico</label><input type="email" value="ruben@proyectocompas.com" required></div>
          <div class="field"><label>Contraseña</label><input type="password" value="compas2026" required></div>
          <button class="btn btn-primary">Entrar al aula</button>
        </form>
        <div class="demo-note">Versión de demostración. Los datos se guardan en este dispositivo hasta conectar Supabase.</div>
      </section>
    </main>`;
  document.querySelector('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    state.loggedIn = true;
    store.set('aula_v2_logged_in', true);
    location.hash = 'home';
    route();
  });
}

function renderShell(active, callback){
  const nav = [
    ['home','⌂','Inicio'],['courses','▤','Mis cursos'],['resources','□','Recursos'],
    ['progress','◉','Progreso'],['profile','♡','Perfil']
  ];
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#home"><img src="assets/icono-oficial.png" alt="Icono oficial Proyecto Compás"><span><strong>Aula Compás</strong><span>por Proyecto Compás</span></span></a>
        <nav class="sidebar-nav">
          ${nav.map(([id,icon,label]) => `<a class="nav-link ${active===id?'active':''}" href="#${id}"><span class="nav-icon">${icon}</span>${label}</a>`).join('')}
          ${DATA.user.role==='admin' ? `<a class="nav-link ${active==='admin'?'active':''}" href="#admin"><span class="nav-icon">⚙</span>Administrar</a>` : ''}
        </nav>
        <div class="sidebar-bottom">
          <a class="user-mini" href="#profile"><img src="${DATA.user.avatar}" alt=""><span><strong>${DATA.user.name}</strong><span>${DATA.user.role==='admin'?'Administrador':'Alumno'}</span></span></a>
        </div>
      </aside>
      <section class="main-area">
        <header class="topbar">
          <div class="search-box"><input id="global-search" placeholder="Buscar cursos, lecciones o recursos"></div>
          <div class="top-actions">
            <button class="icon-button install-button hide" data-install title="Instalar">⇩</button>
            <button class="icon-button" onclick="showToast('No tienes notificaciones nuevas.')">♧</button>
            <a class="icon-button" href="#profile">◎</a>
          </div>
        </header>
        <main class="content"><div class="page" id="page"></div></main>
      </section>
      <nav class="mobile-nav">
        ${nav.map(([id,icon,label]) => `<button class="${active===id?'active':''}" onclick="location.hash='${id}'"><span>${icon}</span><span>${label}</span></button>`).join('')}
      </nav>
    </div>`;
  document.querySelectorAll('[data-install]').forEach(button => {
    button.addEventListener('click', installApp);
    if(deferredPrompt) button.classList.remove('hide');
  });
  const search = document.querySelector('#global-search');
  if(search) search.addEventListener('keydown', event => {
    if(event.key==='Enter'){
      const term = event.target.value.trim().toLowerCase();
      if(!term) return;
      const course = allCourses().find(c => (c.title+' '+c.subtitle+' '+c.category).toLowerCase().includes(term));
      if(course) location.hash = `course/${course.id}`;
      else showToast('No encontramos resultados con esa búsqueda.');
    }
  });
  callback();
}

async function installApp(){
  if(!deferredPrompt) return showToast('En el menú del navegador selecciona “Agregar a pantalla de inicio”.');
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

function courseCard(course){
  return `<a class="course-card" href="#course/${course.id}">
    <img src="${course.image}" alt="${course.title}">
    <div class="card-content">
      ${course.featured?'<span class="badge">Curso destacado</span>':''}
      <h3>${course.title}</h3>
      <div class="card-meta"><span>${course.category}</span><strong>${course.progress}%</strong></div>
      <div class="mini-progress"><span style="width:${course.progress}%"></span></div>
    </div>
  </a>`;
}

function renderHome(){
  const page = document.querySelector('#page');
  const featured = allCourses().find(c => c.featured) || allCourses()[0];
  page.innerHTML = `
    <section class="hero">
      <img src="assets/hero-lanzamiento.webp" alt="El Compás del Estratega">
      <div class="hero-content">
        <span class="badge">Curso destacado</span>
        <h1>${featured.title}</h1>
        <p>${featured.subtitle}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#lesson/${featured.id}/${featured.modules[0].lessons[0].id}">▶ Ver ahora</a>
          <a class="btn btn-secondary" href="#course/${featured.id}">Más información</a>
        </div>
        <div class="progress-line"><span>${featured.progress}% completado</span><div class="progress-track"><span style="width:${featured.progress}%"></span></div></div>
      </div>
    </section>
    <div class="section-heading"><h2>Continuar</h2><a class="text-link" href="#courses">Ver todo →</a></div>
    <section class="card-row">${allCourses().slice(0,4).map(courseCard).join('')}</section>
    <div class="section-heading"><h2>Mis cursos</h2><a class="text-link" href="#courses">Explorar cursos →</a></div>
    <section class="card-row">${allCourses().map(courseCard).join('')}</section>`;
}

function renderCourses(){
  const page = document.querySelector('#page');
  page.innerHTML = `
    <span class="eyebrow">Biblioteca de aprendizaje</span>
    <h1 class="page-title">Mis cursos</h1>
    <p class="page-subtitle">Tu biblioteca organizada para avanzar con claridad.</p>
    <div class="filters">
      <button class="filter-button active" data-filter="all">Todos</button>
      <button class="filter-button" data-filter="progress">En progreso</button>
      <button class="filter-button" data-filter="complete">Completados</button>
      <button class="filter-button" data-filter="favorite">Favoritos</button>
    </div>
    <section class="grid-courses" id="course-grid">${allCourses().map(courseCard).join('')}</section>`;
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      let list = allCourses();
      const type = button.dataset.filter;
      if(type==='progress') list = list.filter(c => c.progress>0 && c.progress<100);
      if(type==='complete') list = list.filter(c => c.progress>=100);
      if(type==='favorite') list = list.slice(0,2);
      document.querySelector('#course-grid').innerHTML = list.length ? list.map(courseCard).join('') : '<div class="empty-state glass">Todavía no hay cursos aquí.</div>';
    });
  });
}

function renderCourse(id){
  const course = findCourse(id);
  if(!course) return renderCourses();
  const page = document.querySelector('#page');
  page.innerHTML = `
    <a class="back-link" href="#courses">← Volver a mis cursos</a>
    <section class="course-head">
      <article class="course-cover">
        <img src="${course.image}" alt="${course.title}">
        <div class="hero-content">
          <span class="badge">${course.category}</span>
          <h1>${course.title}</h1>
          <p>${course.subtitle}</p>
          <div class="progress-line"><span>${course.progress}% completado</span><div class="progress-track"><span style="width:${course.progress}%"></span></div></div>
        </div>
      </article>
      <aside class="module-panel glass">
        <h2>Contenido del curso</h2>
        ${course.modules.map((module,mIndex) => `
          <details class="module" ${mIndex===0?'open':''}>
            <summary><div><strong>Módulo ${mIndex+1}: ${module.title}</strong><span>${module.lessons.length} lecciones</span></div><span>⌄</span></summary>
            <div class="lesson-list">
              ${module.lessons.map(lesson => {
                const done = Boolean(state.completed[lesson.id]);
                return `<div class="lesson-item ${done?'completed':''}">
                  <button onclick="toggleLesson('${lesson.id}',event)">${done?'✓':'▶'}</button>
                  <a href="#lesson/${course.id}/${lesson.id}"><strong>${lesson.title}</strong><small>Lección en video</small></a>
                  <small>${lesson.duration}</small>
                </div>`;
              }).join('')}
            </div>
          </details>`).join('')}
      </aside>
    </section>`;
}

window.toggleLesson = function(id,event){
  event.stopPropagation();
  state.completed[id] = !state.completed[id];
  store.set('aula_v2_completed', state.completed);
  showToast(state.completed[id] ? 'Lección completada.' : 'Lección marcada como pendiente.');
  route();
};

function getLesson(course,lessonId){
  for(const module of course.modules){
    const index = module.lessons.findIndex(l => l.id===lessonId);
    if(index>=0) return {lesson:module.lessons[index],module};
  }
  return null;
}

function renderLesson(courseId,lessonId){
  const course = findCourse(courseId);
  const found = course && getLesson(course,lessonId);
  if(!found) return renderCourse(courseId);
  const {lesson,module} = found;
  const page = document.querySelector('#page');
  const done = Boolean(state.completed[lesson.id]);
  page.innerHTML = `
    <a class="back-link" href="#course/${course.id}">← Volver al contenido</a>
    <span class="eyebrow">${course.title}</span>
    <h1 class="page-title">${lesson.title}</h1>
    <p class="page-subtitle">Módulo: ${module.title}</p>
    <section class="lesson-layout">
      <div>
        <div class="video-shell">
          <img src="${course.image}" alt="">
          <div class="video-center"><button class="play-button" onclick="showToast('Aquí se conectará el video de la lección.')">▶</button></div>
          <div class="video-bar"><span>04:32 / ${lesson.duration}</span><div class="video-timeline"><span></span></div><span>⚙ ⛶</span></div>
        </div>
        <div class="lesson-actions">
          <button class="action-card" onclick="completeCurrent('${lesson.id}')"><strong>${done?'✓ Lección completada':'○ Marcar como completada'}</strong><small>Guarda tu progreso</small></button>
          <button class="action-card" onclick="showToast('Aquí se conectará la guía en PDF.')"><strong>⇩ Descargar guía</strong><small>Material del curso</small></button>
          <button class="action-card" onclick="document.querySelector('#notes').focus()"><strong>✎ Tomar notas</strong><small>Guarda tus ideas</small></button>
        </div>
        <textarea id="notes" class="notes" placeholder="Escribe aquí tus notas personales...">${state.notes[lesson.id] || ''}</textarea>
      </div>
      <aside class="module-panel glass">
        <h2>Contenido del curso</h2>
        ${course.modules.map((mod,mIndex) => `<details class="module" ${mod===module?'open':''}><summary><div><strong>Módulo ${mIndex+1}: ${mod.title}</strong><span>${mod.lessons.length} lecciones</span></div><span>⌄</span></summary><div class="lesson-list">${mod.lessons.map(item => `<div class="lesson-item ${state.completed[item.id]?'completed':''}"><button>${state.completed[item.id]?'✓':'▶'}</button><a href="#lesson/${course.id}/${item.id}"><strong>${item.title}</strong><small>${item.id===lesson.id?'En reproducción':'Abrir lección'}</small></a><small>${item.duration}</small></div>`).join('')}</div></details>`).join('')}
      </aside>
    </section>`;
  document.querySelector('#notes').addEventListener('input', e => {
    state.notes[lesson.id] = e.target.value;
    store.set('aula_v2_notes', state.notes);
  });
}
window.completeCurrent = function(id){
  state.completed[id] = true;
  store.set('aula_v2_completed', state.completed);
  showToast('Progreso guardado.');
  route();
};

function renderProgress(){
  const page = document.querySelector('#page');
  const courses = allCourses();
  const avg = Math.round(courses.reduce((sum,c)=>sum+c.progress,0)/courses.length);
  page.innerHTML = `
    <span class="eyebrow">Tu recorrido</span>
    <h1 class="page-title">Mi progreso</h1>
    <p class="page-subtitle">Mide tu avance, retoma tu enfoque y celebra tus logros.</p>
    <section class="stats-grid">
      ${[['◷','12 h 45 m','Horas de aprendizaje'],['▤',courses.length,'Cursos en progreso'],['✓','18','Lecciones completadas'],['★','5','Certificados']].map(([icon,value,label]) => `<article class="stat-card glass"><div class="stat-icon">${icon}</div><strong>${value}</strong><span>${label}</span></article>`).join('')}
    </section>
    <section class="dashboard-grid">
      <article class="list-panel glass">
        <div class="section-heading"><h2>Mis cursos en progreso</h2><span>${avg}% promedio</span></div>
        ${courses.slice(0,3).map(course => `<div class="list-course"><img src="${course.image}" alt=""><div><h3>${course.title}</h3><div class="mini-progress"><span style="width:${course.progress}%"></span></div><small>${course.progress}% completado</small></div><a class="btn btn-primary" href="#course/${course.id}">Continuar</a></div>`).join('')}
      </article>
      <div>
        <article class="streak-panel glass">
          <div class="section-heading"><h2>Racha de aprendizaje</h2><strong style="color:#966c12">14 días</strong></div>
          <div class="streak-days">${['L','M','M','J','V','S','D'].map((day,index)=>`<div class="day ${index<6?'done':''}"><b>${day}</b><span>${index<6?'✓':'○'}</span></div>`).join('')}</div>
          <div class="progress-line"><span>Meta: 21 días</span><div class="progress-track"><span style="width:66%"></span></div></div>
        </article>
        <article class="achievements-panel glass" style="margin-top:17px">
          <div class="section-heading"><h2>Logros recientes</h2></div>
          <div class="achievement-grid">${DATA.achievements.map(a=>`<div class="achievement"><span class="achievement-icon">${a.icon}</span><div><strong>${a.title}</strong><small>${a.text}</small></div></div>`).join('')}</div>
        </article>
      </div>
    </section>`;
}

function renderResources(){
  const page = document.querySelector('#page');
  page.innerHTML = `
    <span class="eyebrow">Biblioteca</span>
    <h1 class="page-title">Recursos</h1>
    <p class="page-subtitle">Guías, plantillas, audios y lecturas para acompañar tu aprendizaje.</p>
    <section class="resources-grid">
      ${DATA.resources.map(resource => `<article class="resource-card glass"><img src="${resource.image}" alt="${resource.title}"><div class="resource-body"><span class="badge">${resource.type}</span><h3>${resource.title}</h3><p>Material complementario de Aula Compás.</p><button class="btn btn-primary" onclick="showToast('La descarga se conectará en la siguiente etapa.')">Descargar</button></div></article>`).join('')}
    </section>`;
}

function renderProfile(){
  const page = document.querySelector('#page');
  page.innerHTML = `
    <span class="eyebrow">Mi cuenta</span>
    <h1 class="page-title">Perfil</h1>
    <section class="profile-grid">
      <article class="profile-card glass"><img src="${DATA.user.avatar}" alt=""><h1>${DATA.user.fullName}</h1><p>${DATA.user.email}</p><span class="badge">${DATA.user.role==='admin'?'Administrador':'Alumno'}</span></article>
      <article class="settings-card glass">
        <div class="settings-row"><div><strong>Instalar Aula Compás</strong><small>Agrega la aplicación a la pantalla de inicio.</small></div><button class="btn btn-primary" data-install>Instalar</button></div>
        <div class="settings-row"><div><strong>Notificaciones</strong><small>Recordatorios de cursos y sesiones.</small></div><button class="btn btn-secondary" onclick="showToast('Notificaciones activadas.')">Activar</button></div>
        <div class="settings-row"><div><strong>Panel administrativo</strong><small>Gestiona cursos y alumnos.</small></div><a class="btn btn-secondary" href="#admin">Abrir panel</a></div>
        <div class="settings-row"><div><strong>Cerrar sesión</strong><small>Podrás volver a entrar con tu correo.</small></div><button class="btn btn-secondary" onclick="logout()">Salir</button></div>
      </article>
    </section>`;
  document.querySelectorAll('[data-install]').forEach(b => b.addEventListener('click', installApp));
}
window.logout = function(){ state.loggedIn=false; store.set('aula_v2_logged_in',false); location.hash=''; route(); };

function renderAdmin(){
  const page = document.querySelector('#page');
  page.innerHTML = `
    <span class="eyebrow">Panel administrativo</span>
    <h1 class="page-title">Control de Aula Compás</h1>
    <p class="page-subtitle">Versión de demostración para organizar alumnos y cursos.</p>
    <section class="admin-grid">
      <article class="admin-card glass"><strong>${state.students.length}</strong><span>Alumnos registrados</span></article>
      <article class="admin-card glass"><strong>${allCourses().length}</strong><span>Cursos publicados</span></article>
      <article class="admin-card glass"><strong>67%</strong><span>Avance promedio</span></article>
    </section>
    <section class="settings-card glass" style="margin-top:18px">
      <div class="section-heading"><h2>Agregar alumno</h2></div>
      <form id="student-form" class="admin-form"><input name="name" placeholder="Nombre completo" required><input name="email" type="email" placeholder="Correo electrónico" required><button class="btn btn-primary">Registrar</button></form>
      <table class="admin-table"><thead><tr><th>Alumno</th><th>Correo</th><th>Curso</th><th>Progreso</th></tr></thead><tbody>${state.students.map(s=>`<tr><td>${s.name}</td><td>${s.email}</td><td>${s.course}</td><td>${s.progress}%</td></tr>`).join('')}</tbody></table>
    </section>
    <section class="settings-card glass" style="margin-top:18px">
      <div class="section-heading"><h2>Agregar curso de prueba</h2></div>
      <form id="course-form" class="admin-form"><input name="title" placeholder="Nombre del curso" required><input name="category" placeholder="Categoría" required><button class="btn btn-primary">Crear curso</button></form>
    </section>`;
  document.querySelector('#student-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    state.students.push({name:f.get('name'),email:f.get('email'),course:'Sin asignar',progress:0});
    store.set('aula_v2_students',state.students);
    showToast('Alumno registrado.');
    renderAdmin();
  });
  document.querySelector('#course-form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target), id='curso-'+Date.now();
    state.extraCourses.push({id,title:f.get('title'),subtitle:'Curso creado desde el panel.',category:f.get('category'),image:'assets/curso-compas.webp',progress:0,modules:[{title:'Módulo inicial',lessons:[{id:id+'-1',title:'Primera lección',duration:'10:00'}]}]});
    store.set('aula_v2_extra_courses',state.extraCourses);
    showToast('Curso de prueba creado.');
    renderAdmin();
  });
}

window.addEventListener('hashchange',route);
window.addEventListener('load',() => {
  route();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
});