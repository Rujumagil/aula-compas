const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const CONFIG = window.SUPABASE_CONFIG;

if (!window.supabase || !CONFIG?.url || !CONFIG?.publishableKey) {
  app.innerHTML = '<main class="login-screen"><section class="login-card glass"><h1>Error de configuración</h1><p>No se pudo iniciar Supabase. Revisa la conexión a internet y el archivo supabase-config.js.</p></section></main>';
  throw new Error('Supabase configuration missing');
}

const db = window.supabase.createClient(CONFIG.url, CONFIG.publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

let deferredPrompt = null;
let notesTimer = null;

const state = {
  session: null,
  user: null,
  profile: null,
  courses: [],
  resources: [],
  progressRows: [],
  profiles: [],
  enrollments: [],
  loading: true
};

const navItems = [
  ['home','⌂','Inicio'],
  ['courses','▤','Mis cursos'],
  ['resources','□','Recursos'],
  ['progress','◉','Progreso'],
  ['profile','♡','Perfil']
];

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  document.querySelectorAll('[data-install]').forEach(button => button.classList.remove('hide'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  showToast('Aula Compás quedó instalada.');
});

function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.dataset.type = type;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
}

function slugify(text = '') {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function loadingScreen(message = 'Preparando tu aula...') {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass loading-card">
        <img class="official-lockup" src="assets/logo-completo-oficial.png" alt="Proyecto Compás">
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </section>
    </main>`;
}

async function init() {
  loadingScreen();

  const { data, error } = await db.auth.getSession();
  if (error) console.error(error);

  state.session = data?.session || null;
  state.user = state.session?.user || null;

  db.auth.onAuthStateChange((event, session) => {
    state.session = session;
    state.user = session?.user || null;

    // Evita llamar a otras funciones de Supabase dentro del callback inmediato.
    setTimeout(async () => {
      if (session) {
        await loadApplicationData();
        route();
      } else {
        clearUserData();
        renderAuth();
      }
    }, 0);
  });

  if (state.session) {
    await loadApplicationData();
    route();
  } else {
    renderAuth();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(console.error);
  }
}

function clearUserData() {
  state.profile = null;
  state.courses = [];
  state.resources = [];
  state.progressRows = [];
  state.profiles = [];
  state.enrollments = [];
}

async function loadApplicationData() {
  if (!state.user) return;

  state.loading = true;

  const profileResult = await db
    .from('profiles')
    .select('*')
    .eq('id', state.user.id)
    .maybeSingle();

  if (profileResult.error) {
    console.error('Profile error:', profileResult.error);
    showToast('No se pudo cargar tu perfil.', 'error');
  }

  state.profile = profileResult.data || {
    id: state.user.id,
    email: state.user.email,
    full_name: state.user.user_metadata?.full_name || '',
    role: 'student'
  };

  const coursesResult = await db
    .from('courses')
    .select('*')
    .neq('status', 'archived')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true });

  if (coursesResult.error) {
    console.error('Courses error:', coursesResult.error);
    showToast('No se pudieron cargar los cursos.', 'error');
  }

  const rawCourses = coursesResult.data || [];
  const courseIds = rawCourses.map(course => course.id);

  let modules = [];
  if (courseIds.length) {
    const modulesResult = await db
      .from('modules')
      .select('*')
      .in('course_id', courseIds)
      .order('position', { ascending: true });
    if (modulesResult.error) console.error('Modules error:', modulesResult.error);
    modules = modulesResult.data || [];
  }

  const moduleIds = modules.map(module => module.id);
  let lessons = [];
  if (moduleIds.length) {
    const lessonsResult = await db
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('position', { ascending: true });
    if (lessonsResult.error) console.error('Lessons error:', lessonsResult.error);
    lessons = lessonsResult.data || [];
  }

  const progressResult = await db
    .from('lesson_progress')
    .select('*')
    .eq('user_id', state.user.id);

  if (progressResult.error) console.error('Progress error:', progressResult.error);
  state.progressRows = progressResult.data || [];

  state.courses = rawCourses.map(course => ({
    ...course,
    modules: modules
      .filter(module => module.course_id === course.id)
      .map(module => ({
        ...module,
        lessons: lessons.filter(lesson => lesson.module_id === module.id)
      }))
  }));

  const resourcesResult = await db
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (resourcesResult.error) console.error('Resources error:', resourcesResult.error);
  state.resources = resourcesResult.data || [];

  if (isAdmin()) {
    const [profilesResult, enrollmentsResult] = await Promise.all([
      db.from('profiles').select('id,email,full_name,avatar_url,role,created_at').order('created_at', { ascending: false }),
      db.from('enrollments').select('*').order('enrolled_at', { ascending: false })
    ]);
    if (profilesResult.error) console.error('Profiles error:', profilesResult.error);
    if (enrollmentsResult.error) console.error('Enrollments error:', enrollmentsResult.error);
    state.profiles = profilesResult.data || [];
    state.enrollments = enrollmentsResult.data || [];
  }

  state.loading = false;
}

function isAdmin() {
  return state.profile?.role === 'admin';
}

function displayName() {
  return state.profile?.full_name?.trim()
    || state.user?.user_metadata?.full_name
    || state.user?.email?.split('@')[0]
    || 'Alumno';
}

function avatarUrl() {
  return state.profile?.avatar_url || 'assets/icono-oficial.png';
}

function allLessons(course) {
  return course.modules.flatMap(module => module.lessons || []);
}

function isLessonCompleted(lessonId) {
  return state.progressRows.some(row => row.lesson_id === lessonId && row.completed);
}

function courseProgress(course) {
  const lessons = allLessons(course);
  if (!lessons.length) return 0;
  const completed = lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
  return Math.round((completed / lessons.length) * 100);
}

function findCourse(id) {
  return state.courses.find(course => course.id === id || course.slug === id);
}

function findLesson(course, lessonId) {
  for (const module of course.modules) {
    const lesson = module.lessons.find(item => item.id === lessonId);
    if (lesson) return { lesson, module };
  }
  return null;
}

function cover(course) {
  return course.cover_url || 'assets/curso-compas.webp';
}

function renderAuth(mode = 'login') {
  const signup = mode === 'signup';
  const recover = mode === 'recover';

  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass auth-card">
        <div class="login-brand">
          <img class="official-lockup" src="assets/logo-completo-oficial.png" alt="Proyecto Compás">
          <h1>Aula Compás</h1>
          <p>Aprende. Crea. Trasciende.</p>
        </div>

        ${recover ? `
          <form id="recover-form">
            <div class="field">
              <label for="recover-email">Correo electrónico</label>
              <input id="recover-email" name="email" type="email" placeholder="tu-correo@ejemplo.com" required>
            </div>
            <button class="btn btn-primary" type="submit">Enviar enlace de recuperación</button>
          </form>
          <button class="auth-link" type="button" data-mode="login">← Regresar al acceso</button>
        ` : `
          <form id="auth-form">
            ${signup ? `
              <div class="field">
                <label for="full-name">Nombre completo</label>
                <input id="full-name" name="fullName" autocomplete="name" required>
              </div>
            ` : ''}
            <div class="field">
              <label for="email">Correo electrónico</label>
              <input id="email" name="email" type="email" autocomplete="email" required>
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <input id="password" name="password" type="password" minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" required>
            </div>
            <button class="btn btn-primary" type="submit">${signup ? 'Crear mi cuenta' : 'Entrar al aula'}</button>
          </form>

          <div class="auth-options">
            <button class="auth-link" type="button" data-mode="${signup ? 'login' : 'signup'}">
              ${signup ? 'Ya tengo cuenta' : 'Crear una cuenta'}
            </button>
            ${signup ? '' : '<button class="auth-link" type="button" data-mode="recover">Olvidé mi contraseña</button>'}
          </div>

          ${signup ? '<div class="demo-note">Después de registrarte, un administrador deberá asignarte los cursos correspondientes.</div>' : ''}
        `}
      </section>
    </main>`;

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => renderAuth(button.dataset.mode));
  });

  if (recover) {
    document.querySelector('#recover-form').addEventListener('submit', handleRecovery);
  } else {
    document.querySelector('#auth-form').addEventListener('submit', event => handleAuth(event, signup));
  }
}

async function handleAuth(event, signup) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get('email')).trim();
  const password = String(form.get('password'));

  setFormBusy(event.currentTarget, true);

  try {
    if (signup) {
      const fullName = String(form.get('fullName')).trim();
      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${location.origin}${location.pathname}`
        }
      });

      if (error) throw error;

      if (!data.session) {
        showToast('Revisa tu correo para confirmar la cuenta.', 'success');
        renderAuth('login');
      } else {
        showToast('Cuenta creada correctamente.', 'success');
      }
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showToast('Bienvenido a Aula Compás.', 'success');
    }
  } catch (error) {
    console.error(error);
    showToast(translateAuthError(error.message), 'error');
  } finally {
    setFormBusy(event.currentTarget, false);
  }
}

async function handleRecovery(event) {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get('email');
  setFormBusy(event.currentTarget, true);

  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}${location.pathname}`
    });
    if (error) throw error;
    showToast('Te enviamos un enlace de recuperación.', 'success');
    renderAuth('login');
  } catch (error) {
    showToast(translateAuthError(error.message), 'error');
  } finally {
    setFormBusy(event.currentTarget, false);
  }
}

function setFormBusy(form, busy) {
  const button = form?.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = busy;
  button.dataset.originalText ||= button.textContent;
  button.textContent = busy ? 'Procesando...' : button.dataset.originalText;
}

function translateAuthError(message = '') {
  const text = message.toLowerCase();
  if (text.includes('invalid login credentials')) return 'El correo o la contraseña no son correctos.';
  if (text.includes('email not confirmed')) return 'Debes confirmar tu correo antes de entrar.';
  if (text.includes('user already registered')) return 'Este correo ya tiene una cuenta.';
  if (text.includes('password should be')) return 'La contraseña debe tener al menos seis caracteres.';
  if (text.includes('rate limit')) return 'Espera un momento antes de volver a intentarlo.';
  return message || 'Ocurrió un problema. Intenta nuevamente.';
}

async function route() {
  if (!state.session) return renderAuth();

  const hash = location.hash.replace('#','') || 'home';
  const [page, id, lessonId] = hash.split('/');

  renderShell(page);

  if (page === 'home') renderHome();
  else if (page === 'courses') renderCourses();
  else if (page === 'resources') renderResources();
  else if (page === 'progress') renderProgress();
  else if (page === 'profile') renderProfile();
  else if (page === 'course') renderCourse(id);
  else if (page === 'lesson') await renderLesson(id, lessonId);
  else if (page === 'admin' && isAdmin()) renderAdmin();
  else renderHome();
}

function renderShell(active) {
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#home">
          <img src="assets/icono-oficial.png" alt="Icono Proyecto Compás">
          <span><strong>Aula Compás</strong><span>por Proyecto Compás</span></span>
        </a>

        <nav class="sidebar-nav">
          ${navItems.map(([id, icon, label]) => `
            <a class="nav-link ${active === id ? 'active' : ''}" href="#${id}">
              <span class="nav-icon">${icon}</span>${label}
            </a>`).join('')}
          ${isAdmin() ? `
            <a class="nav-link ${active === 'admin' ? 'active' : ''}" href="#admin">
              <span class="nav-icon">⚙</span>Administrar
            </a>` : ''}
        </nav>

        <div class="sidebar-bottom">
          <a class="user-mini" href="#profile">
            <img src="${escapeHtml(avatarUrl())}" alt="">
            <span><strong>${escapeHtml(displayName())}</strong><span>${isAdmin() ? 'Administrador' : 'Alumno'}</span></span>
          </a>
        </div>
      </aside>

      <section class="main-area">
        <header class="topbar">
          <div class="search-box"><input id="global-search" placeholder="Buscar cursos o lecciones"></div>
          <div class="top-actions">
            <button class="icon-button install-button hide" data-install title="Instalar">⇩</button>
            <button class="icon-button" id="refresh-button" title="Actualizar">↻</button>
            <a class="icon-button" href="#profile">◎</a>
          </div>
        </header>
        <main class="content"><div class="page" id="page"></div></main>
      </section>

      <nav class="mobile-nav">
        ${navItems.map(([id,icon,label]) => `
          <button class="${active === id ? 'active' : ''}" onclick="location.hash='${id}'">
            <span>${icon}</span><span>${label}</span>
          </button>`).join('')}
      </nav>
    </div>`;

  document.querySelectorAll('[data-install]').forEach(button => {
    button.addEventListener('click', installApp);
    if (deferredPrompt) button.classList.remove('hide');
  });

  document.querySelector('#refresh-button')?.addEventListener('click', async () => {
    showToast('Actualizando información...');
    await loadApplicationData();
    route();
  });

  document.querySelector('#global-search')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    const term = event.target.value.trim().toLowerCase();
    if (!term) return;
    const course = state.courses.find(item =>
      `${item.title} ${item.subtitle || ''} ${item.category || ''}`.toLowerCase().includes(term)
    );
    if (course) location.hash = `course/${course.id}`;
    else showToast('No encontramos resultados.');
  });
}

async function installApp() {
  if (!deferredPrompt) {
    showToast('En el menú del navegador selecciona “Agregar a pantalla de inicio”.');
    return;
  }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}

function emptyCoursesMessage() {
  return `
    <section class="empty-state glass">
      <img src="assets/icono-oficial.png" alt="" class="empty-logo">
      <h2>${isAdmin() ? 'La base de datos todavía no tiene cursos' : 'Aún no tienes cursos asignados'}</h2>
      <p>${isAdmin()
        ? 'Ejecuta el archivo 03-datos-iniciales.sql en Supabase o crea un curso desde Administrar.'
        : 'Tu cuenta está activa. Un administrador debe asignarte un curso.'}</p>
      ${isAdmin() ? '<a class="btn btn-primary" href="#admin">Abrir administración</a>' : ''}
    </section>`;
}

function courseCard(course) {
  const progress = courseProgress(course);
  return `
    <a class="course-card" href="#course/${course.id}">
      <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}">
      <div class="card-content">
        ${course.featured ? '<span class="badge">Curso destacado</span>' : ''}
        <h3>${escapeHtml(course.title)}</h3>
        <div class="card-meta"><span>${escapeHtml(course.category || 'Curso')}</span><strong>${progress}%</strong></div>
        <div class="mini-progress"><span style="width:${progress}%"></span></div>
      </div>
    </a>`;
}

function renderHome() {
  const page = document.querySelector('#page');
  if (!state.courses.length) {
    page.innerHTML = emptyCoursesMessage();
    return;
  }

  const featured = state.courses.find(course => course.featured) || state.courses[0];
  const firstLesson = allLessons(featured)[0];
  const progress = courseProgress(featured);

  page.innerHTML = `
    <section class="welcome-line">
      <div><span class="eyebrow">Bienvenido</span><h1>Hola, ${escapeHtml(displayName().split(' ')[0])}</h1></div>
      <p>Continúa avanzando con claridad y dirección.</p>
    </section>

    <section class="hero">
      <img src="${escapeHtml(cover(featured))}" alt="${escapeHtml(featured.title)}">
      <div class="hero-content">
        <span class="badge">Curso destacado</span>
        <h1>${escapeHtml(featured.title)}</h1>
        <p>${escapeHtml(featured.subtitle || featured.description || '')}</p>
        <div class="hero-actions">
          ${firstLesson
            ? `<a class="btn btn-primary" href="#lesson/${featured.id}/${firstLesson.id}">▶ Continuar</a>`
            : `<a class="btn btn-primary" href="#course/${featured.id}">Ver contenido</a>`}
          <a class="btn btn-secondary" href="#course/${featured.id}">Más información</a>
        </div>
        <div class="progress-line">
          <span>${progress}% completado</span>
          <div class="progress-track"><span style="width:${progress}%"></span></div>
        </div>
      </div>
    </section>

    <div class="section-heading"><h2>Continúa aprendiendo</h2><a class="text-link" href="#courses">Ver todos →</a></div>
    <section class="card-row">${state.courses.slice(0, 5).map(courseCard).join('')}</section>

    <div class="section-heading"><h2>Tu biblioteca</h2><a class="text-link" href="#resources">Ver recursos →</a></div>
    <section class="card-row">${state.courses.slice().reverse().map(courseCard).join('')}</section>`;
}

function renderCourses() {
  const page = document.querySelector('#page');

  if (!state.courses.length) {
    page.innerHTML = emptyCoursesMessage();
    return;
  }

  page.innerHTML = `
    <span class="eyebrow">Biblioteca de aprendizaje</span>
    <h1 class="page-title">Mis cursos</h1>
    <p class="page-subtitle">Los programas que tienes disponibles en Aula Compás.</p>

    <div class="filters">
      <button class="filter-button active" data-filter="all">Todos</button>
      <button class="filter-button" data-filter="progress">En progreso</button>
      <button class="filter-button" data-filter="complete">Completados</button>
    </div>

    <section class="grid-courses" id="course-grid">${state.courses.map(courseCard).join('')}</section>`;

  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      let list = state.courses;

      if (filter === 'progress') list = list.filter(course => {
        const progress = courseProgress(course);
        return progress > 0 && progress < 100;
      });

      if (filter === 'complete') list = list.filter(course => courseProgress(course) === 100);

      document.querySelector('#course-grid').innerHTML = list.length
        ? list.map(courseCard).join('')
        : '<section class="empty-state glass"><h2>No hay cursos en esta categoría.</h2></section>';
    });
  });
}

function renderCourse(id) {
  const course = findCourse(id);
  if (!course) return renderCourses();

  const page = document.querySelector('#page');
  const progress = courseProgress(course);

  page.innerHTML = `
    <a class="back-link" href="#courses">← Volver a mis cursos</a>

    <section class="course-head">
      <article class="course-cover">
        <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}">
        <div class="hero-content">
          <span class="badge">${escapeHtml(course.category || 'Curso')}</span>
          <h1>${escapeHtml(course.title)}</h1>
          <p>${escapeHtml(course.subtitle || course.description || '')}</p>
          <div class="progress-line">
            <span>${progress}% completado</span>
            <div class="progress-track"><span style="width:${progress}%"></span></div>
          </div>
        </div>
      </article>

      <aside class="module-panel glass">
        <h2>Contenido del curso</h2>
        ${course.modules.length ? course.modules.map((module, index) => moduleMarkup(course, module, index)).join('') : `
          <div class="empty-module"><p>Este curso todavía no tiene módulos publicados.</p></div>`}
      </aside>
    </section>`;
}

function moduleMarkup(course, module, index, activeLessonId = null) {
  return `
    <details class="module" ${index === 0 || module.lessons.some(item => item.id === activeLessonId) ? 'open' : ''}>
      <summary>
        <div><strong>Módulo ${index + 1}: ${escapeHtml(module.title)}</strong><span>${module.lessons.length} lecciones</span></div>
        <span>⌄</span>
      </summary>
      <div class="lesson-list">
        ${module.lessons.map(lesson => {
          const done = isLessonCompleted(lesson.id);
          return `
            <div class="lesson-item ${done ? 'completed' : ''}">
              <button type="button" data-complete="${lesson.id}">${done ? '✓' : '▶'}</button>
              <a href="#lesson/${course.id}/${lesson.id}">
                <strong>${escapeHtml(lesson.title)}</strong>
                <small>${lesson.lesson_type || 'Lección'}</small>
              </a>
              <small>${lesson.duration_minutes || 0} min</small>
            </div>`;
        }).join('')}
      </div>
    </details>`;
}

async function renderLesson(courseId, lessonId) {
  const course = findCourse(courseId);
  const found = course && findLesson(course, lessonId);
  if (!found) return renderCourse(courseId);

  const { lesson, module } = found;
  const page = document.querySelector('#page');
  const noteResult = await db
    .from('lesson_notes')
    .select('note')
    .eq('user_id', state.user.id)
    .eq('lesson_id', lesson.id)
    .maybeSingle();

  if (noteResult.error) console.error(noteResult.error);
  const note = noteResult.data?.note || '';

  page.innerHTML = `
    <a class="back-link" href="#course/${course.id}">← Volver al contenido</a>
    <span class="eyebrow">${escapeHtml(course.title)}</span>
    <h1 class="page-title">${escapeHtml(lesson.title)}</h1>
    <p class="page-subtitle">Módulo: ${escapeHtml(module.title)}</p>

    <section class="lesson-layout">
      <div>
        <div class="video-shell">
          ${lesson.video_url ? `
            <iframe
              class="lesson-frame"
              src="${escapeHtml(lesson.video_url)}"
              title="${escapeHtml(lesson.title)}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen></iframe>
          ` : `
            <img src="${escapeHtml(cover(course))}" alt="">
            <div class="video-center"><button class="play-button" type="button" id="video-placeholder">▶</button></div>
            <div class="video-bar"><span>Video pendiente</span><div class="video-timeline"><span></span></div><span>⚙ ⛶</span></div>
          `}
        </div>

        ${lesson.content_html ? `<article class="lesson-content glass">${lesson.content_html}</article>` : ''}

        <div class="lesson-actions">
          <button class="action-card" id="complete-current">
            <strong>${isLessonCompleted(lesson.id) ? '✓ Lección completada' : '○ Marcar como completada'}</strong>
            <small>Guarda tu progreso en tu cuenta</small>
          </button>
          <button class="action-card" id="material-button">
            <strong>⇩ Descargar guía</strong><small>Material complementario</small>
          </button>
          <button class="action-card" id="focus-notes">
            <strong>✎ Tomar notas</strong><small>Notas privadas</small>
          </button>
        </div>

        <textarea id="lesson-notes" class="notes" placeholder="Escribe aquí tus notas personales...">${escapeHtml(note)}</textarea>
        <small class="autosave-note">Tus notas se guardan automáticamente.</small>
      </div>

      <aside class="module-panel glass">
        <h2>Contenido del curso</h2>
        ${course.modules.map((item, index) => moduleMarkup(course, item, index, lesson.id)).join('')}
      </aside>
    </section>`;

  document.querySelectorAll('[data-complete]').forEach(button => {
    button.addEventListener('click', () => toggleLesson(button.dataset.complete));
  });

  document.querySelector('#complete-current').addEventListener('click', () => completeLesson(lesson.id, true));
  document.querySelector('#focus-notes').addEventListener('click', () => document.querySelector('#lesson-notes').focus());
  document.querySelector('#material-button').addEventListener('click', () => showToast('Agrega el recurso desde el panel administrativo.'));
  document.querySelector('#video-placeholder')?.addEventListener('click', () => showToast('Agrega el enlace de video desde Supabase.'));

  document.querySelector('#lesson-notes').addEventListener('input', event => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => saveNote(lesson.id, event.target.value), 700);
  });
}

async function completeLesson(lessonId, completed) {
  const payload = {
    user_id: state.user.id,
    lesson_id: lessonId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await db
    .from('lesson_progress')
    .upsert(payload, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast('No se pudo guardar el progreso.', 'error');
    return;
  }

  const index = state.progressRows.findIndex(row => row.lesson_id === lessonId);
  if (index >= 0) state.progressRows[index] = data;
  else state.progressRows.push(data);

  showToast(completed ? 'Lección completada.' : 'Lección marcada como pendiente.', 'success');
  route();
}

async function toggleLesson(lessonId) {
  await completeLesson(lessonId, !isLessonCompleted(lessonId));
}

async function saveNote(lessonId, note) {
  const { error } = await db
    .from('lesson_notes')
    .upsert({
      user_id: state.user.id,
      lesson_id: lessonId,
      note,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });

  if (error) {
    console.error(error);
    showToast('No se pudo guardar la nota.', 'error');
  } else {
    showToast('Nota guardada.', 'success');
  }
}

function renderProgress() {
  const page = document.querySelector('#page');
  const totalLessons = state.courses.reduce((sum, course) => sum + allLessons(course).length, 0);
  const completedLessons = state.progressRows.filter(row => row.completed).length;
  const completedCourses = state.courses.filter(course => courseProgress(course) === 100).length;

  page.innerHTML = `
    <span class="eyebrow">Tu recorrido</span>
    <h1 class="page-title">Mi progreso</h1>
    <p class="page-subtitle">Mide tu avance y continúa construyendo con dirección.</p>

    <section class="stats-grid">
      <article class="stat-card glass"><div class="stat-icon">◷</div><strong>${completedLessons * 15} min</strong><span>Tiempo estimado</span></article>
      <article class="stat-card glass"><div class="stat-icon">▤</div><strong>${state.courses.length}</strong><span>Cursos activos</span></article>
      <article class="stat-card glass"><div class="stat-icon">✓</div><strong>${completedLessons}/${totalLessons}</strong><span>Lecciones completadas</span></article>
      <article class="stat-card glass"><div class="stat-icon">★</div><strong>${completedCourses}</strong><span>Cursos terminados</span></article>
    </section>

    <section class="list-panel glass">
      <div class="section-heading"><h2>Avance por curso</h2></div>
      ${state.courses.length ? state.courses.map(course => {
        const progress = courseProgress(course);
        return `
          <div class="list-course">
            <img src="${escapeHtml(cover(course))}" alt="">
            <div><h3>${escapeHtml(course.title)}</h3><div class="mini-progress"><span style="width:${progress}%"></span></div><small>${progress}% completado</small></div>
            <a class="btn btn-primary" href="#course/${course.id}">Continuar</a>
          </div>`;
      }).join('') : '<p>No tienes cursos asignados.</p>'}
    </section>`;
}

function renderResources() {
  const page = document.querySelector('#page');

  page.innerHTML = `
    <span class="eyebrow">Biblioteca</span>
    <h1 class="page-title">Recursos</h1>
    <p class="page-subtitle">Guías, plantillas, audios y enlaces autorizados para tu cuenta.</p>

    <section class="resources-grid">
      ${state.resources.length ? state.resources.map(resource => `
        <article class="resource-card glass">
          <img src="${escapeHtml(resource.external_url || 'assets/recurso-manual.webp')}" alt="${escapeHtml(resource.title)}">
          <div class="resource-body">
            <span class="badge">${escapeHtml(resource.resource_type)}</span>
            <h3>${escapeHtml(resource.title)}</h3>
            <p>Material complementario de Aula Compás.</p>
            <button class="btn btn-primary" data-resource="${escapeHtml(resource.external_url || resource.file_path || '')}">Abrir recurso</button>
          </div>
        </article>`).join('') : `
        <section class="empty-state glass"><h2>Todavía no hay recursos disponibles.</h2><p>Los materiales aparecerán aquí cuando sean publicados.</p></section>`}
    </section>`;

  document.querySelectorAll('[data-resource]').forEach(button => {
    button.addEventListener('click', () => {
      const url = button.dataset.resource;
      if (url && /^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener');
      else showToast('Este recurso todavía no tiene un enlace disponible.');
    });
  });
}

function renderProfile() {
  const page = document.querySelector('#page');

  page.innerHTML = `
    <span class="eyebrow">Mi cuenta</span>
    <h1 class="page-title">Perfil</h1>

    <section class="profile-grid">
      <article class="profile-card glass">
        <img src="${escapeHtml(avatarUrl())}" alt="">
        <h1>${escapeHtml(displayName())}</h1>
        <p>${escapeHtml(state.user.email)}</p>
        <span class="badge">${isAdmin() ? 'Administrador' : 'Alumno'}</span>
      </article>

      <article class="settings-card glass">
        <form id="profile-form">
          <div class="field">
            <label for="profile-name">Nombre completo</label>
            <input id="profile-name" name="fullName" value="${escapeHtml(state.profile?.full_name || '')}" required>
          </div>
          <div class="field">
            <label for="avatar-url">URL de fotografía</label>
            <input id="avatar-url" name="avatarUrl" type="url" value="${escapeHtml(state.profile?.avatar_url || '')}" placeholder="https://...">
          </div>
          <button class="btn btn-primary" type="submit">Guardar perfil</button>
        </form>

        <div class="settings-row"><div><strong>Instalar Aula Compás</strong><small>Agrega la aplicación a tu pantalla de inicio.</small></div><button class="btn btn-secondary" data-install>Instalar</button></div>
        ${isAdmin() ? '<div class="settings-row"><div><strong>Panel administrativo</strong><small>Gestiona cursos, módulos e inscripciones.</small></div><a class="btn btn-secondary" href="#admin">Abrir panel</a></div>' : ''}
        <div class="settings-row"><div><strong>Cerrar sesión</strong><small>Finaliza la sesión en este dispositivo.</small></div><button class="btn btn-secondary" id="logout-button">Salir</button></div>
      </article>
    </section>`;

  document.querySelector('#profile-form').addEventListener('submit', updateProfile);
  document.querySelector('#logout-button').addEventListener('click', logout);
  document.querySelectorAll('[data-install]').forEach(button => button.addEventListener('click', installApp));
}

async function updateProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  setFormBusy(event.currentTarget, true);

  const { data, error } = await db
    .from('profiles')
    .update({
      full_name: String(form.get('fullName')).trim(),
      avatar_url: String(form.get('avatarUrl')).trim() || null
    })
    .eq('id', state.user.id)
    .select()
    .single();

  setFormBusy(event.currentTarget, false);

  if (error) {
    console.error(error);
    showToast('No se pudo actualizar el perfil.', 'error');
    return;
  }

  state.profile = data;
  showToast('Perfil actualizado.', 'success');
  route();
}

async function logout() {
  const { error } = await db.auth.signOut();
  if (error) showToast('No se pudo cerrar la sesión.', 'error');
}

function renderAdmin() {
  const page = document.querySelector('#page');

  const courseOptions = state.courses.map(course =>
    `<option value="${course.id}">${escapeHtml(course.title)}</option>`
  ).join('');

  const studentOptions = state.profiles
    .filter(profile => profile.role === 'student')
    .map(profile => `<option value="${profile.id}">${escapeHtml(profile.full_name || profile.email)}</option>`)
    .join('');

  page.innerHTML = `
    <span class="eyebrow">Panel administrativo</span>
    <h1 class="page-title">Control de Aula Compás</h1>
    <p class="page-subtitle">Crea la estructura académica y asigna cursos a las personas que ya se registraron.</p>

    <section class="admin-grid">
      <article class="admin-card glass"><strong>${state.profiles.length}</strong><span>Usuarios registrados</span></article>
      <article class="admin-card glass"><strong>${state.courses.length}</strong><span>Cursos visibles</span></article>
      <article class="admin-card glass"><strong>${state.enrollments.length}</strong><span>Inscripciones</span></article>
    </section>

    <section class="admin-layout">
      <article class="settings-card glass">
        <div class="section-heading"><h2>Crear curso</h2></div>
        <form id="course-form" class="stack-form">
          <div class="field"><label>Título</label><input name="title" required></div>
          <div class="field"><label>Subtítulo</label><input name="subtitle"></div>
          <div class="field"><label>Categoría</label><input name="category" value="Formación"></div>
          <div class="field"><label>Ruta de portada</label><input name="coverUrl" value="assets/curso-compas.webp"></div>
          <button class="btn btn-primary">Crear curso</button>
        </form>
      </article>

      <article class="settings-card glass">
        <div class="section-heading"><h2>Agregar módulo</h2></div>
        <form id="module-form" class="stack-form">
          <div class="field"><label>Curso</label><select name="courseId" required>${courseOptions}</select></div>
          <div class="field"><label>Título del módulo</label><input name="title" required></div>
          <div class="field"><label>Posición</label><input name="position" type="number" min="1" value="1"></div>
          <button class="btn btn-primary">Agregar módulo</button>
        </form>
      </article>

      <article class="settings-card glass">
        <div class="section-heading"><h2>Asignar curso</h2></div>
        <form id="enrollment-form" class="stack-form">
          <div class="field"><label>Alumno</label><select name="userId" required>${studentOptions || '<option value="">No hay alumnos registrados</option>'}</select></div>
          <div class="field"><label>Curso</label><select name="courseId" required>${courseOptions}</select></div>
          <button class="btn btn-primary" ${!studentOptions || !courseOptions ? 'disabled' : ''}>Asignar acceso</button>
        </form>
        <div class="demo-note">Por seguridad, los alumnos crean su propia cuenta desde la pantalla de registro. Después aparecerán aquí para que les asignes un curso.</div>
      </article>
    </section>

    <section class="settings-card glass" style="margin-top:18px">
      <div class="section-heading"><h2>Agregar lección</h2></div>
      <form id="lesson-form" class="admin-form admin-form-wide">
        <select name="moduleId" required>
          ${state.courses.flatMap(course => course.modules.map(module =>
            `<option value="${module.id}">${escapeHtml(course.title)} — ${escapeHtml(module.title)}</option>`
          )).join('') || '<option value="">Primero crea un módulo</option>'}
        </select>
        <input name="title" placeholder="Título de la lección" required>
        <input name="videoUrl" placeholder="URL incrustable de video">
        <input name="duration" type="number" min="0" value="10" placeholder="Minutos">
        <button class="btn btn-primary">Agregar</button>
      </form>
    </section>

    <section class="settings-card glass" style="margin-top:18px">
      <div class="section-heading"><h2>Usuarios e inscripciones</h2></div>
      <table class="admin-table">
        <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Cursos asignados</th></tr></thead>
        <tbody>
          ${state.profiles.map(profile => {
            const assigned = state.enrollments
              .filter(row => row.user_id === profile.id && row.status !== 'cancelled')
              .map(row => state.courses.find(course => course.id === row.course_id)?.title)
              .filter(Boolean);
            return `<tr><td>${escapeHtml(profile.full_name || 'Sin nombre')}</td><td>${escapeHtml(profile.email || '')}</td><td>${escapeHtml(profile.role)}</td><td>${escapeHtml(assigned.join(', ') || 'Ninguno')}</td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </section>`;

  document.querySelector('#course-form').addEventListener('submit', createCourse);
  document.querySelector('#module-form').addEventListener('submit', createModule);
  document.querySelector('#lesson-form').addEventListener('submit', createLesson);
  document.querySelector('#enrollment-form').addEventListener('submit', assignCourse);
}

async function createCourse(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setFormBusy(event.currentTarget, true);

  const title = String(form.get('title')).trim();
  const { error } = await db.from('courses').insert({
    title,
    slug: `${slugify(title)}-${Date.now().toString().slice(-5)}`,
    subtitle: String(form.get('subtitle')).trim() || null,
    category: String(form.get('category')).trim() || 'Formación',
    cover_url: String(form.get('coverUrl')).trim() || 'assets/curso-compas.webp',
    status: 'published',
    created_by: state.user.id
  });

  setFormBusy(event.currentTarget, false);
  if (error) return showToast(error.message, 'error');

  showToast('Curso creado.', 'success');
  await loadApplicationData();
  renderAdmin();
}

async function createModule(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setFormBusy(event.currentTarget, true);

  const { error } = await db.from('modules').insert({
    course_id: form.get('courseId'),
    title: String(form.get('title')).trim(),
    position: Number(form.get('position')) || 1
  });

  setFormBusy(event.currentTarget, false);
  if (error) return showToast(error.message, 'error');

  showToast('Módulo creado.', 'success');
  await loadApplicationData();
  renderAdmin();
}

async function createLesson(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setFormBusy(event.currentTarget, true);

  const moduleId = form.get('moduleId');
  if (!moduleId) {
    setFormBusy(event.currentTarget, false);
    return showToast('Primero debes crear un módulo.', 'error');
  }

  const { error } = await db.from('lessons').insert({
    module_id: moduleId,
    title: String(form.get('title')).trim(),
    video_url: String(form.get('videoUrl')).trim() || null,
    duration_minutes: Number(form.get('duration')) || 0,
    lesson_type: 'video',
    position: 1
  });

  setFormBusy(event.currentTarget, false);
  if (error) return showToast(error.message, 'error');

  showToast('Lección agregada.', 'success');
  await loadApplicationData();
  renderAdmin();
}

async function assignCourse(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setFormBusy(event.currentTarget, true);

  const { error } = await db.from('enrollments').upsert({
    user_id: form.get('userId'),
    course_id: form.get('courseId'),
    status: 'active'
  }, { onConflict: 'user_id,course_id' });

  setFormBusy(event.currentTarget, false);
  if (error) return showToast(error.message, 'error');

  showToast('Curso asignado.', 'success');
  await loadApplicationData();
  renderAdmin();
}

window.addEventListener('hashchange', route);
window.addEventListener('load', init);
