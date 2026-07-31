const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const CONFIG = window.SUPABASE_CONFIG;

if (!window.supabase?.createClient || !CONFIG?.url || !CONFIG?.publishableKey) {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass">
        <img class="official-lockup" src="logo-completo-oficial.png" alt="Proyecto Compás">
        <h1>Error de conexión</h1>
        <p>No se pudo iniciar Supabase.</p>
        <div class="bootstrap-actions">
          <a class="btn btn-primary" href="diagnostico.html">Abrir diagnóstico</a>
          <a class="btn btn-secondary" href="limpiar-cache.html">Limpiar caché</a>
        </div>
      </section>
    </main>`;
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
const WHATSAPP_NUMBER = '5213336646803';

function whatsappUrl(message = 'Hola, necesito información sobre Aula Compás.') {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const state = {
  session: null,
  user: null,
  profile: null,
  courses: [],
  resources: [],
  progressRows: [],
  profiles: [],
  enrollments: [],
  recoveryMode: false,
  loading: true
};

const navItems = [
  ['home', '⌂', 'Inicio'],
  ['courses', '▤', 'Mis cursos'],
  ['resources', '▧', 'Mi biblioteca'],
  ['agenda', '◷', 'Calendario'],
  ['certificates', '◇', 'Certificados'],
  ['help', '?', 'Ayuda'],
  ['profile', '♡', 'Mi perfil']
];

const mobileNavItems = navItems.filter(([id]) =>
  ['home', 'courses', 'resources', 'agenda', 'certificates', 'profile'].includes(id)
);

const PUBLIC_PROGRAMS = [
  {
    title: 'El Compás del Estratega',
    category: 'Estrategia',
    image: 'curso-compas.webp',
    status: 'Disponible',
    description: 'Ordena tus ideas, transforma tu experiencia y construye un proyecto con dirección.',
    meta: 'Webinar en vivo · Libro digital incluido',
    price: '$500 MXN',
    salePrice: '$300 MXN',
    paymentUrl: 'https://mpago.la/2BvMZty'
  },
  {
    title: 'Despierta tu memoria',
    category: 'Legado',
    image: 'curso-memoria.webp',
    status: 'Próximamente',
    description: 'Recupera recuerdos valiosos y comienza a construir un legado significativo.',
    meta: 'Curso guiado · Ejercicios de escritura'
  },
  {
    title: 'Legado que Trasciende',
    category: 'Escritura',
    image: 'curso-legado.webp',
    status: 'Próximamente',
    description: 'Convierte recuerdos y aprendizajes en una historia para quienes amas.',
    meta: 'Programa editorial · Acompañamiento'
  },
  {
    title: 'Método MES®',
    category: 'Bienestar',
    image: 'curso-mes.webp',
    status: 'Próximamente',
    description: 'Mindfulness, escritura y serenidad para diseñar un sistema personal.',
    meta: 'Prácticas guiadas · Recursos descargables'
  }
];

const ACADEMY_EVENTS = [
  {
    id: 'launch',
    date: '2026-08-03T19:00:00-06:00',
    day: '03',
    month: 'AGO',
    title: 'Lanzamiento de Proyecto Compás',
    description: 'Presentación oficial del libro y apertura de la academia.',
    type: 'Lanzamiento'
  },
  {
    id: 'webinar',
    date: '2026-08-08T19:00:00-06:00',
    day: '08',
    month: 'AGO',
    title: 'Webinar · El Compás del Estratega',
    description: 'Sesión en línea por Zoom. El libro digital estará disponible en tu biblioteca.',
    type: 'Evento en vivo'
  }
];

const HELP_TOPICS = [
  ['¿Cómo entro a un curso que compré?', 'Crea tu cuenta con el mismo correo utilizado en la compra. Cuando el pago sea validado, el curso aparecerá en “Mis cursos”.'],
  ['¿Dónde encuentro mi libro digital?', 'Abre “Biblioteca” y selecciona el libro. El sistema genera un acceso privado temporal para proteger tu compra.'],
  ['¿Cómo recupero mi contraseña?', 'Cierra tu sesión, selecciona “Olvidé mi contraseña” y revisa el enlace enviado a tu correo.'],
  ['Mi pago todavía no aparece', 'Escríbenos por WhatsApp con tu comprobante, nombre y correo de registro para que revisemos tu acceso.'],
  ['¿Puedo usar el aula desde mi celular?', 'Sí. Aula Compás es adaptable y también puedes instalarla desde el botón disponible en tu perfil.'],
  ['¿Cómo obtengo mi certificado?', 'Completa todas las lecciones del curso. Después podrás abrir e imprimir tu certificado desde la sección de progreso.']
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

function repairTextEncoding(value = '') {
  const original = String(value ?? '');
  if (!/[ÃÂ]/.test(original)) return original;

  try {
    const characters = [...original];
    if (characters.every(char => char.codePointAt(0) <= 255)) {
      const bytes = Uint8Array.from(characters, char => char.codePointAt(0));
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (decoded && !decoded.includes('�')) return decoded;
    }
  } catch (error) {
    console.warn('No se pudo reparar la codificación del texto:', error);
  }

  return original
    .replaceAll('Ã¡', 'á')
    .replaceAll('Ã©', 'é')
    .replaceAll('Ã­', 'í')
    .replaceAll('Ã³', 'ó')
    .replaceAll('Ãº', 'ú')
    .replaceAll('Ã±', 'ñ')
    .replaceAll('Ã¼', 'ü')
    .replaceAll('Â¿', '¿')
    .replaceAll('Â¡', '¡')
    .replaceAll('Â', '');
}

function escapeHtml(value = '') {
  return repairTextEncoding(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
}


function normalizeMediaUrl(value, fallback = 'curso-compas.webp') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  // Compatible con registros anteriores guardados como assets/archivo.webp.
  return raw
    .replace(/^\.?\/?assets\//i, '')
    .replace(/^\.?\//, '');
}

function imageErrorFallback(event, fallback = 'curso-compas.webp') {
  const image = event?.currentTarget;
  if (!image || image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}

window.imageErrorFallback = imageErrorFallback;

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
        <img class="official-lockup" src="logo-completo-oficial.png" alt="Proyecto Compás">
        <div class="spinner"></div>
        <p>${escapeHtml(message)}</p>
      </section>
    </main>`;
}

async function init() {
  loadingScreen();
  const recoveryRequested =
    new URLSearchParams(location.search).get('type') === 'recovery'
    || new URLSearchParams(location.hash.replace(/^#/, '')).get('type') === 'recovery';
  state.recoveryMode = recoveryRequested;

  const { data, error } = await db.auth.getSession();
  if (error) console.error(error);

  state.session = data?.session || null;
  state.user = state.session?.user || null;

  db.auth.onAuthStateChange((event, session) => {
    state.session = session;
    state.user = session?.user || null;

    // Evita llamar a otras funciones de Supabase dentro del callback inmediato.
    setTimeout(async () => {
      if (event === 'PASSWORD_RECOVERY' || state.recoveryMode) {
        state.recoveryMode = true;
        renderPasswordUpdate();
        return;
      }

      if (session) {
        await loadApplicationData();
        route();
      } else {
        clearUserData();
        route();
      }
    }, 0);
  });

  if (state.session) {
    if (state.recoveryMode) {
      renderPasswordUpdate();
    } else {
      await loadApplicationData();
      route();
    }
  } else {
    route();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=6.0.0', { updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(console.error);
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

function isInstructor() {
  return state.profile?.role === 'instructor';
}

function canManageContent() {
  return isAdmin() || isInstructor();
}

function displayName() {
  return state.profile?.full_name?.trim()
    || state.user?.user_metadata?.full_name
    || state.user?.email?.split('@')[0]
    || 'Alumno';
}

function avatarUrl() {
  return normalizeMediaUrl(state.profile?.avatar_url, 'icono-oficial.png');
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

function firstIncompleteLesson(course) {
  const lessons = allLessons(course);
  return lessons.find(lesson => !isLessonCompleted(lesson.id)) || lessons[0] || null;
}

function cover(course) {
  return normalizeMediaUrl(course.cover_url, 'curso-compas.webp');
}

function sanitizeLessonHtml(value = '') {
  const template = document.createElement('template');
  template.innerHTML = String(value || '');
  const allowedTags = new Set(['H2', 'H3', 'H4', 'P', 'UL', 'OL', 'LI', 'STRONG', 'EM', 'BLOCKQUOTE', 'A', 'BR']);
  const elements = [...template.content.querySelectorAll('*')];

  elements.forEach(element => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      return;
    }

    [...element.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      if (element.tagName === 'A' && name === 'href') {
        const href = attribute.value.trim();
        if (!/^(https?:|mailto:)/i.test(href)) element.removeAttribute(attribute.name);
        return;
      }
      if (element.tagName === 'A' && ['target', 'rel'].includes(name)) return;
      element.removeAttribute(attribute.name);
    });

    if (element.tagName === 'A' && element.hasAttribute('href')) {
      element.target = '_blank';
      element.rel = 'noopener noreferrer';
    }
  });

  return template.innerHTML;
}

function renderAuth(mode = 'login') {
  const signup = mode === 'signup';
  const recover = mode === 'recover';

  app.innerHTML = `
    <main class="login-screen auth-screen">
      <section class="auth-layout">
        <aside class="auth-story">
          <a class="auth-story-brand" href="https://www.proyectocompas.com/">
            <img src="logo-texto-oficial.png" alt="Proyecto Compás">
          </a>
          <span class="eyebrow">Academia y biblioteca digital</span>
          <h2>Aprende, crea y convierte tu experiencia en dirección.</h2>
          <p>Cursos, libros y herramientas para construir proyectos con propósito y dejar un legado que trascienda.</p>
          <div class="auth-benefits">
            <span>✓ Cursos y progreso en un solo lugar</span>
            <span>✓ Biblioteca privada para tus libros</span>
            <span>✓ Acceso desde computadora o celular</span>
          </div>
          <div class="auth-story-actions">
            <a class="btn btn-primary" href="#catalog">Explorar programas</a>
            <a class="btn btn-secondary" href="https://www.proyectocompas.com/" target="_blank" rel="noopener">Conocer Proyecto Compás</a>
          </div>
        </aside>

        <section class="login-card glass auth-card">
        <div class="login-brand">
          <img class="official-lockup" src="logo-completo-oficial.png" alt="Proyecto Compás">
          <h1>${recover ? 'Recupera tu acceso' : signup ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p>${recover ? 'Te enviaremos un enlace seguro.' : signup ? 'Comienza tu recorrido en Aula Compás.' : 'Continúa desde donde te quedaste.'}</p>
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
              <div class="password-control">
                <input id="password" name="password" type="password" minlength="8" autocomplete="${signup ? 'new-password' : 'current-password'}" required>
                <button type="button" data-toggle-password aria-label="Mostrar contraseña">Ver</button>
              </div>
            </div>
            ${signup ? `
              <div class="field">
                <label for="confirm-password">Confirmar contraseña</label>
                <input id="confirm-password" name="confirmPassword" type="password" minlength="8" autocomplete="new-password" required>
              </div>
              <label class="legal-check">
                <input name="legalAcceptance" type="checkbox" required>
                <span>Acepto el <a href="https://www.proyectocompas.com/aviso-de-privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a> y la <a href="https://www.proyectocompas.com/politica-de-cancelacion-y-reembolso.html" target="_blank" rel="noopener">política de cancelación y reembolso</a>.</span>
              </label>
            ` : '<label class="remember-check"><input type="checkbox" checked><span>Mantener mi sesión en este dispositivo</span></label>'}
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
      </section>
    </main>`;

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => renderAuth(button.dataset.mode));
  });
  document.querySelector('[data-toggle-password]')?.addEventListener('click', event => {
    const input = document.querySelector('#password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar' : 'Ver';
    event.currentTarget.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  if (recover) {
    document.querySelector('#recover-form').addEventListener('submit', handleRecovery);
  } else {
    document.querySelector('#auth-form').addEventListener('submit', event => handleAuth(event, signup));
  }
}

function renderPasswordUpdate() {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass auth-card">
        <div class="login-brand">
          <img class="official-lockup" src="logo-completo-oficial.png" alt="Proyecto Compás">
          <h1>Crear nueva contraseña</h1>
          <p>Elige una contraseña segura para volver al aula.</p>
        </div>
        <form id="password-update-form">
          <div class="field">
            <label for="new-password">Nueva contraseña</label>
            <input id="new-password" name="password" type="password" minlength="8" autocomplete="new-password" required>
          </div>
          <div class="field">
            <label for="new-password-confirmation">Confirmar contraseña</label>
            <input id="new-password-confirmation" name="confirmation" type="password" minlength="8" autocomplete="new-password" required>
          </div>
          <button class="btn btn-primary" type="submit">Guardar contraseña</button>
        </form>
      </section>
    </main>`;

  document.querySelector('#password-update-form').addEventListener('submit', handlePasswordUpdate);
}

async function handlePasswordUpdate(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const password = String(form.get('password'));
  const confirmation = String(form.get('confirmation'));

  if (password !== confirmation) {
    showToast('Las contraseñas no coinciden.', 'error');
    return;
  }

  setFormBusy(event.currentTarget, true);
  const { error } = await db.auth.updateUser({ password });
  setFormBusy(event.currentTarget, false);

  if (error) {
    showToast(translateAuthError(error.message), 'error');
    return;
  }

  state.recoveryMode = false;
  showToast('Contraseña actualizada. Inicia sesión nuevamente.', 'success');
  await db.auth.signOut();
  renderAuth('login');
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
      if (password !== String(form.get('confirmPassword'))) {
        throw new Error('Las contraseñas no coinciden.');
      }
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
  if (text.includes('password should be')) return 'La contraseña debe tener al menos ocho caracteres.';
  if (text.includes('contraseñas no coinciden')) return 'Las contraseñas no coinciden.';
  if (text.includes('rate limit')) return 'Espera un momento antes de volver a intentarlo.';
  return message || 'Ocurrió un problema. Intenta nuevamente.';
}

function publicProgramCard(program) {
  const available = program.status === 'Disponible';
  return `
    <article class="catalog-card">
      <div class="catalog-card-media">
        <img src="${escapeHtml(program.image)}" alt="${escapeHtml(program.title)}" onerror="imageErrorFallback(event)">
        <span class="status-pill ${available ? 'available' : ''}">${escapeHtml(program.status)}</span>
      </div>
      <div class="catalog-card-body">
        <span class="eyebrow">${escapeHtml(program.category)}</span>
        <h3>${escapeHtml(program.title)}</h3>
        <p>${escapeHtml(program.description)}</p>
        <small>${escapeHtml(program.meta)}</small>
        ${available ? `
          <div class="catalog-price">
            <span><s>${escapeHtml(program.price)}</s><strong>${escapeHtml(program.salePrice)}</strong></span>
            <small>Precio especial hasta el 6 de agosto</small>
          </div>
          <div class="catalog-actions">
            <a class="btn btn-primary" href="${escapeHtml(program.paymentUrl)}" target="_blank" rel="noopener">Inscribirme</a>
            <a class="btn btn-secondary" href="https://mpago.la/23omJUk" target="_blank" rel="noopener">Apartar con $100</a>
          </div>
          <a class="catalog-whatsapp" href="${escapeHtml(whatsappUrl(`Hola, quiero información sobre ${program.title} en Aula Compás.`))}" target="_blank" rel="noopener">¿Tienes dudas? Escríbenos por WhatsApp</a>
        ` : '<div class="coming-note">Estamos preparando esta experiencia.</div>'}
      </div>
    </article>`;
}

function renderPublicCatalog(section = '') {
  app.innerHTML = `
    <div class="public-shell">
      <header class="public-header">
        <a class="public-brand" href="#catalog"><img src="logo-texto-oficial.png" alt="Proyecto Compás"></a>
        <nav>
          <a href="#catalog/programs">Programas</a>
          <a href="#catalog/books">Libros</a>
          <a href="#catalog/instructor">Instructores</a>
        </nav>
        <button class="btn btn-primary" type="button" data-public-login>Entrar al aula</button>
      </header>

      <main>
        <section class="catalog-hero">
          <div class="catalog-hero-copy">
            <span class="eyebrow">Aula Compás · Lanzamiento 2026</span>
            <h1>Dirección para transformar tu experiencia.</h1>
            <p>Una academia de autores, instructores y personas que convierten conocimiento, memoria y propósito en proyectos que trascienden.</p>
            <div class="hero-actions">
              <a class="btn btn-primary" href="#catalog/programs">Explorar programas</a>
              <button class="btn btn-secondary" type="button" data-public-signup>Crear mi cuenta</button>
            </div>
            <div class="catalog-trust">
              <span><strong>08 AGO</strong> Webinar en vivo</span>
              <span><strong>7:00 PM</strong> Hora de Guadalajara</span>
              <span><strong>ZOOM</strong> Acceso en línea</span>
            </div>
          </div>
          <div class="catalog-hero-visual">
            <img src="hero-lanzamiento.webp" alt="El Compás del Estratega">
            <div class="floating-event">
              <span>Próximo evento</span>
              <strong>Webinar y entrega del libro digital</strong>
              <small>8 de agosto · 7:00 p. m.</small>
            </div>
          </div>
        </section>

        <section class="public-section" id="programs">
          <div class="public-section-heading">
            <div><span class="eyebrow">Formación con propósito</span><h2>Programas de Aula Compás</h2></div>
            <p>Comienza con estrategia y descubre las próximas rutas de legado, escritura y bienestar.</p>
          </div>
          <div class="catalog-filters">
            ${['Todos', 'Estrategia', 'Legado', 'Escritura', 'Bienestar'].map((label, index) =>
              `<button class="${index === 0 ? 'active' : ''}" data-public-filter="${label}">${label}</button>`
            ).join('')}
          </div>
          <section class="catalog-grid" id="public-program-grid">${PUBLIC_PROGRAMS.map(publicProgramCard).join('')}</section>
        </section>

        <section class="public-book-section" id="books">
          <img src="curso-compas.webp" alt="El Compás del Estratega">
          <div>
            <span class="eyebrow">Libro digital incluido</span>
            <h2>El Compás del Estratega</h2>
            <p>Un libro interactivo de 106 páginas para ayudarte a ordenar ideas, reconocer el valor de tu experiencia y definir una dirección clara.</p>
            <ul>
              <li>Acceso privado desde tu biblioteca</li>
              <li>Webinar de acompañamiento incluido</li>
              <li>Disponible en computadora y celular</li>
            </ul>
            <a class="btn btn-primary" href="https://www.proyectocompas.com/el-compas-del-estratega.html" target="_blank" rel="noopener">Conocer el libro</a>
          </div>
        </section>

        <section class="instructor-section" id="instructor">
          <div><img src="ruben.webp" alt="Rubén Junior Martínez Gil"></div>
          <article>
            <span class="eyebrow">Instructor fundador</span>
            <h2>Rubén Junior Martínez Gil</h2>
            <p>Autor, estratega y creador de Proyecto Compás. Acompaña a personas a ordenar su experiencia, convertirla en conocimiento útil y construir proyectos con sentido.</p>
            <p class="instructor-future">Aula Compás está preparada para integrar más autores e instructores con sus propios cursos y libros.</p>
          </article>
        </section>
      </main>

      <footer class="public-footer">
        <img src="logo-texto-oficial.png" alt="Proyecto Compás">
        <p>Aprende. Crea. Trasciende.</p>
        <div><a href="${whatsappUrl('Hola, quiero información sobre Proyecto Compás.')}" target="_blank" rel="noopener">WhatsApp</a><a href="https://www.proyectocompas.com/aviso-de-privacidad.html">Privacidad</a><a href="https://www.proyectocompas.com/politica-de-cancelacion-y-reembolso.html">Reembolsos</a></div>
      </footer>
    </div>`;

  document.querySelectorAll('[data-public-login]').forEach(button =>
    button.addEventListener('click', () => renderAuth('login'))
  );
  document.querySelectorAll('[data-public-signup]').forEach(button =>
    button.addEventListener('click', () => renderAuth('signup'))
  );
  document.querySelectorAll('[data-public-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-public-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const category = button.dataset.publicFilter;
      const programs = category === 'Todos'
        ? PUBLIC_PROGRAMS
        : PUBLIC_PROGRAMS.filter(program => program.category === category);
      document.querySelector('#public-program-grid').innerHTML = programs.map(publicProgramCard).join('');
    });
  });
  if (section) requestAnimationFrame(() => document.querySelector(`#${section}`)?.scrollIntoView({ behavior: 'smooth' }));
}

async function route() {
  const hash = location.hash.replace('#','') || (state.session ? 'home' : 'catalog');
  const [page, id, lessonId] = hash.split('/');

  if (!state.session) {
    if (page === 'catalog') return renderPublicCatalog(id);
    return renderAuth();
  }

  renderShell(page);

  if (page === 'home') renderHome();
  else if (page === 'catalog') renderPublicCatalog(id);
  else if (page === 'courses') renderCourses();  
  else if (page === 'resources') renderResources();
  else if (page === 'agenda') renderAgenda();
  else if (page === 'progress') renderProgress();
  else if (page === 'help') renderHelp();
  else if (page === 'notifications') renderNotifications();
  else if (page === 'certificates') renderCertificates();
  else if (page === 'certificate') renderCertificate(id);
  else if (page === 'search') renderSearch(decodeURIComponent(id || ''));
  else if (page === 'profile') renderProfile();
  else if (page === 'course') renderCourse(id);
  else if (page === 'lesson') await renderLesson(id, lessonId);
  else if (page === 'admin' && canManageContent()) renderAdmin();
  else renderHome();
}

function renderShell(active) {
  const activeNav = ['course', 'lesson'].includes(active)
  ? 'courses'
  : ['certificate', 'certificates'].includes(active)
    ? 'certificates'
    : active;
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#home">
          <img src="icono-oficial.png" alt="Icono Proyecto Compás">
          <span><strong>Aula Compás</strong><span>por Proyecto Compás</span></span>
        </a>

       <span class="sidebar-label">MI ESPACIO</span>
       <nav class="sidebar-nav">
  ${navItems.map(([id, icon, label]) => `
    <a class="nav-link ${activeNav === id ? 'active' : ''}" href="#${id}">
      <span class="nav-icon">${icon}</span>
      ${label}
    </a>`).join('')}

  <a class="nav-link nav-link-secondary" href="#catalog">
    <span class="nav-icon">＋</span>
    Explorar cursos
  </a>

  ${canManageContent() ? `
    <a class="nav-link admin-nav-link ${activeNav === 'admin' ? 'active' : ''}" href="#admin">
      <span class="nav-icon">⚙</span>
      ${isAdmin() ? 'Administrar' : 'Mis contenidos'}
    </a>` : ''}
</nav>
          ${canManageContent() ? `
            <a class="nav-link admin-nav-link ${activeNav === 'admin' ? 'active' : ''}" href="#admin">
              <span class="nav-icon">⚙</span>${isAdmin() ? 'Administrar' : 'Mis contenidos'}
            </a>` : ''}
        </nav>

        <div class="sidebar-bottom">
          <a class="user-mini" href="#profile">
            <img src="${escapeHtml(avatarUrl())}" alt="" onerror="imageErrorFallback(event, 'icono-oficial.png')">
            <span><strong>${escapeHtml(displayName())}</strong><span>${isAdmin() ? 'Administrador' : isInstructor() ? 'Instructor' : 'Alumno'}</span></span>
          </a>
        </div>
      </aside>

      <section class="main-area">
        <header class="topbar">
          <div class="topbar-heading">
            <small>AULA COMPÁS</small>
            <strong>${escapeHtml(navItems.find(([id]) => id === activeNav)?.[2] || (activeNav === 'admin' ? 'Administración' : 'Mi espacio'))}</strong>
          </div>
          <div class="search-box"><input id="global-search" aria-label="Buscar en el aula" placeholder="Buscar cursos, lecciones, libros o ayuda"></div>
          <div class="top-actions">
            <button class="icon-button install-button hide" data-install title="Instalar">⇩</button>
            <a class="icon-button notification-button" href="#notifications" title="Notificaciones">♢<span></span></a>
            <a class="icon-button" href="#help" title="Centro de ayuda">?</a>
            <button class="icon-button" id="refresh-button" title="Actualizar">↻</button>
            <a class="top-avatar" href="#profile" title="Mi perfil"><img src="${escapeHtml(avatarUrl())}" alt=""></a>
          </div>
        </header>
        <main class="content"><div class="page" id="page"></div></main>
      </section>

      <nav class="mobile-nav">
        ${mobileNavItems.map(([id,icon,label]) => `
          <button class="${activeNav === id ? 'active' : ''}" onclick="location.hash='${id}'">
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
    const term = event.target.value.trim();
    if (!term) return;
    location.hash = `search/${encodeURIComponent(term)}`;
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
      <img src="icono-oficial.png" alt="" class="empty-logo">
      <h2>${isAdmin() ? 'La base de datos todavía no tiene cursos' : 'Aún no tienes cursos asignados'}</h2>
      <p>${isAdmin()
        ? 'Ejecuta el archivo 03-datos-iniciales.sql en Supabase o crea un curso desde Administrar.'
        : 'Tu cuenta está activa. Un administrador debe asignarte un curso.'}</p>
      ${isAdmin() ? '<a class="btn btn-primary" href="#admin">Abrir administración</a>' : ''}
    </section>`;
}

function courseCard(course) {
  const progress = courseProgress(course);
  const lessons = allLessons(course).length;
  return `
    <a class="course-card" href="#course/${course.id}">
      <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event)">
      <div class="card-content">
        <div class="card-badges">
          ${course.featured ? '<span class="badge">Destacado</span>' : ''}
          <span class="status-pill ${progress === 100 ? 'complete' : ''}">${progress === 100 ? 'Completado' : progress > 0 ? 'En progreso' : 'Disponible'}</span>
        </div>
        <h3>${escapeHtml(course.title)}</h3>
        <div class="card-meta"><span>${escapeHtml(course.category || 'Curso')} · ${lessons} lecciones</span><strong>${progress}%</strong></div>
        <div class="mini-progress"><span style="width:${progress}%"></span></div>
      </div>
    </a>`;
}

function daysUntil(dateValue) {
  const difference = new Date(dateValue).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 86400000));
}

function renderHome() {
  const page = document.querySelector('#page');
  if (!state.courses.length) {
    page.innerHTML = emptyCoursesMessage();
    return;
  }

  const featured = state.courses.find(course => course.featured) || state.courses[0];
  const firstLesson = firstIncompleteLesson(featured);
  const progress = courseProgress(featured);

  const totalLessons = state.courses.reduce((sum, course) => sum + allLessons(course).length, 0);
  const completedLessons = state.progressRows.filter(row => row.completed).length;
  const bookCount = state.resources.filter(resource => resource.resource_type === 'book').length;
  const webinar = ACADEMY_EVENTS.find(event => event.id === 'webinar');

  page.innerHTML = `
    <section class="welcome-line welcome-professional">
      <div><span class="eyebrow">Tu espacio de aprendizaje</span><h1>Hola, ${escapeHtml(displayName().split(' ')[0])}</h1><p>Continúa construyendo con claridad, dirección y propósito.</p></div>
      <div class="welcome-date"><strong>${new Intl.DateTimeFormat('es-MX', { day: '2-digit' }).format(new Date())}</strong><span>${new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(new Date()).toUpperCase()}</span></div>
    </section>

    <section class="dashboard-summary">
      <article><span>▤</span><div><strong>${state.courses.length}</strong><small>Cursos disponibles</small></div></article>
      <article><span>✓</span><div><strong>${completedLessons}/${totalLessons}</strong><small>Lecciones completadas</small></div></article>
      <article><span>▧</span><div><strong>${bookCount}</strong><small>Libros en tu biblioteca</small></div></article>
      <article><span>◷</span><div><strong>${daysUntil(webinar.date)} días</strong><small>Para el próximo evento</small></div></article>
    </section>

    <section class="home-layout">
      <section class="hero">
        <img src="${escapeHtml(cover(featured))}" alt="${escapeHtml(featured.title)}" onerror="imageErrorFallback(event)">
        <div class="hero-content">
          <span class="badge">Continúa aprendiendo</span>
          <h1>${escapeHtml(featured.title)}</h1>
          <p>${escapeHtml(featured.subtitle || featured.description || '')}</p>
          <div class="hero-actions">
            ${firstLesson
              ? `<a class="btn btn-primary" href="#lesson/${featured.id}/${firstLesson.id}">▶ Continuar curso</a>`
              : `<a class="btn btn-primary" href="#course/${featured.id}">Ver contenido</a>`}
            <a class="btn btn-secondary" href="#course/${featured.id}">Ver programa</a>
          </div>
          <div class="progress-line">
            <span>${progress}% completado</span>
            <div class="progress-track"><span style="width:${progress}%"></span></div>
          </div>
        </div>
      </section>

      <aside class="next-event-card">
        <span class="eyebrow">Próximo evento</span>
        <div class="event-date-block"><strong>${webinar.day}</strong><span>${webinar.month}</span></div>
        <h2>${escapeHtml(webinar.title)}</h2>
        <p>${escapeHtml(webinar.description)}</p>
        <div class="event-meta"><span>◷ 7:00 p. m.</span><span>⌖ En línea por Zoom</span></div>
        <a class="btn btn-secondary" href="#agenda">Ver agenda</a>
      </aside>
    </section>

    <div class="section-heading"><div><span class="eyebrow">Tu formación</span><h2>Continúa aprendiendo</h2></div><a class="text-link" href="#courses">Ver todos →</a></div>
    <section class="card-row">${state.courses.slice(0, 5).map(courseCard).join('')}</section>

    <section class="home-lower-grid">
      <article class="announcement-panel glass">
        <div class="section-heading"><h2>Novedades del aula</h2><a href="#notifications">Ver todas</a></div>
        <a href="#resources"><span>Libro digital</span><strong>El Compás del Estratega ya está disponible en la biblioteca.</strong><small>Acceso privado para cuentas autorizadas →</small></a>
        <a href="#agenda"><span>Evento en vivo</span><strong>Webinar del libro · 8 de agosto, 7:00 p. m.</strong><small>Consulta los detalles del encuentro →</small></a>
      </article>
      <article class="support-panel">
        <span class="eyebrow">¿Necesitas ayuda?</span>
        <h2>Estamos para acompañarte.</h2>
        <p>Encuentra respuestas sobre acceso, pagos, cursos y libros digitales.</p>
        <a class="btn btn-primary" href="#help">Abrir centro de ayuda</a>
      </article>
    </section>`;
}

function renderCourses() {
  const page = document.querySelector('#page');

  if (!state.courses.length) {
    page.innerHTML = emptyCoursesMessage();
    return;
  }

  const categories = [...new Set(state.courses.map(course => course.category).filter(Boolean))];

  page.innerHTML = `
    <span class="eyebrow">Tu formación</span>
    <h1 class="page-title">Mis cursos</h1>
    <p class="page-subtitle">Programas, talleres y experiencias disponibles para tu cuenta.</p>

    <div class="filters">
      <button class="filter-button active" data-filter="all">Todos</button>
      <button class="filter-button" data-filter="progress">En progreso</button>
      <button class="filter-button" data-filter="complete">Completados</button>
      ${categories.map(category => `<button class="filter-button" data-filter="category:${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}
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
      if (filter.startsWith('category:')) {
        const category = filter.slice('category:'.length);
        list = list.filter(course => course.category === category);
      }

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
        <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event)">
        <div class="hero-content">
          <span class="badge">${escapeHtml(course.category || 'Curso')}</span>
          <h1>${escapeHtml(course.title)}</h1>
          <p>${escapeHtml(course.subtitle || course.description || '')}</p>
          <div class="course-facts">
            <span><small>Instructor</small><strong>${escapeHtml(course.instructor_name || 'Equipo Proyecto Compás')}</strong></span>
            <span><small>Contenido</small><strong>${course.modules.length} módulos · ${allLessons(course).length} lecciones</strong></span>
            ${course.duration_label ? `<span><small>Duración</small><strong>${escapeHtml(course.duration_label)}</strong></span>` : ''}
          </div>
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
            <img src="${escapeHtml(cover(course))}" alt="" onerror="imageErrorFallback(event)">
            <div class="video-center"><button class="play-button" type="button" id="video-placeholder">▶</button></div>
            <div class="video-bar"><span>Video pendiente</span><div class="video-timeline"><span></span></div><span>⚙ ⛶</span></div>
          `}
        </div>

        ${lesson.content_html ? `<article class="lesson-content glass">${sanitizeLessonHtml(lesson.content_html)}</article>` : ''}

        <div class="lesson-actions">
          <button class="action-card" id="complete-current">
            <strong>${isLessonCompleted(lesson.id) ? '✓ Lección completada' : '○ Marcar como completada'}</strong>
            <small>Guarda tu progreso en tu cuenta</small>
          </button>
          <button class="action-card" id="material-button" ${state.resources.some(resource => resource.course_id === course.id) ? '' : 'disabled'}>
            <strong>⇩ Abrir material</strong><small>${state.resources.some(resource => resource.course_id === course.id) ? 'Libro, guía o recurso del curso' : 'Material pendiente'}</small>
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
  document.querySelector('#material-button').addEventListener('click', () => {
    const resource = state.resources.find(item => item.course_id === course.id);
    if (resource) openResource(resource.id);
  });
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
            <img src="${escapeHtml(cover(course))}" alt="" onerror="imageErrorFallback(event)">
            <div><h3>${escapeHtml(course.title)}</h3><div class="mini-progress"><span style="width:${progress}%"></span></div><small>${progress}% completado</small></div>
            <a class="btn btn-primary" href="#course/${course.id}">Continuar</a>
          </div>`;
      }).join('') : '<p>No tienes cursos asignados.</p>'}
    </section>

    <section class="progress-certificate-banner">
      <div><span class="eyebrow">Reconoce tu recorrido</span><h2>Certificados de finalización</h2><p>Completa todas las lecciones para habilitar un certificado imprimible con tu nombre.</p></div>
      <a class="btn btn-primary" href="#certificates">Ver mis certificados</a>
    </section>`;
}

function resourceTypeLabel(type) {
  return ({
    book: 'Libro digital',
    pdf: 'Documento PDF',
    template: 'Plantilla',
    audio: 'Audio',
    video: 'Video',
    link: 'Enlace'
  })[type] || 'Recurso';
}

function resourceCardMarkup(resource) {
  const course = state.courses.find(item => item.id === resource.course_id);
  const isBook = resource.resource_type === 'book';
  return `
    <article class="resource-card glass" data-resource-type="${escapeHtml(isBook ? 'book' : 'material')}">
      <div class="resource-media">
        <img src="${escapeHtml(normalizeMediaUrl(resource.thumbnail_url, isBook ? 'curso-compas.webp' : 'recurso-manual.webp'))}" alt="${escapeHtml(resource.title)}" onerror="imageErrorFallback(event, '${isBook ? 'curso-compas.webp' : 'recurso-manual.webp'}')">
        <span class="status-pill available">Disponible</span>
      </div>
      <div class="resource-body">
        <span class="eyebrow">${escapeHtml(resourceTypeLabel(resource.resource_type))}</span>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${course ? escapeHtml(course.title) : 'Recurso general de Aula Compás'}</p>
        <div class="resource-card-footer">
          <small>${isBook ? 'Acceso privado temporal' : 'Material incluido en tu acceso'}</small>
          <button class="btn btn-primary" data-resource-id="${escapeHtml(resource.id)}">${isBook ? 'Leer ahora' : 'Abrir recurso'}</button>
        </div>
      </div>
    </article>`;
}

function bindResourceButtons() {
  document.querySelectorAll('[data-resource-id]').forEach(button => {
    button.addEventListener('click', () => openResource(button.dataset.resourceId));
  });
}

function renderResources() {
  const page = document.querySelector('#page');
  const books = state.resources.filter(resource => resource.resource_type === 'book');
  const materials = state.resources.filter(resource => resource.resource_type !== 'book');

  page.innerHTML = `
    <section class="library-heading">
      <div><span class="eyebrow">Tu espacio de lectura</span><h1 class="page-title">Mi biblioteca</h1><p class="page-subtitle">Libros, manuales y materiales disponibles exclusivamente para tu cuenta.</p></div>
      <div class="library-count"><strong>${books.length}</strong><span>${books.length === 1 ? 'libro disponible' : 'libros disponibles'}</span></div>
    </section>

    <div class="filters">
      <button class="filter-button active" data-resource-filter="all">Todo</button>
      <button class="filter-button" data-resource-filter="book">Libros</button>
      <button class="filter-button" data-resource-filter="material">Materiales</button>
    </div>

    ${books.length ? `
      <section class="featured-book glass">
        <img src="${escapeHtml(normalizeMediaUrl(books[0].thumbnail_url, 'curso-compas.webp'))}" alt="${escapeHtml(books[0].title)}" onerror="imageErrorFallback(event)">
        <div>
          <span class="eyebrow">Lectura destacada</span>
          <h2>${escapeHtml(books[0].title)}</h2>
          <p>Continúa tu lectura desde cualquier dispositivo. El acceso se genera de manera privada para proteger tu compra.</p>
          <button class="btn btn-primary" data-resource-id="${escapeHtml(books[0].id)}">Abrir libro digital</button>
        </div>
      </section>` : ''}

    <div class="section-heading"><div><span class="eyebrow">Colección personal</span><h2>Todos tus recursos</h2></div></div>
    <section class="resources-grid" id="resource-grid">
      ${state.resources.length ? state.resources.map(resourceCardMarkup).join('') : `
        <section class="empty-state glass"><h2>Todavía no hay recursos disponibles.</h2><p>Los libros y materiales aparecerán aquí cuando sean asignados a tu cuenta.</p></section>`}
    </section>

    <section class="library-security-note">
      <span>⌾</span><div><strong>Tu biblioteca está protegida</strong><p>Los archivos privados utilizan enlaces temporales y solo se abren para cuentas autorizadas.</p></div>
    </section>`;

  bindResourceButtons();
  document.querySelectorAll('[data-resource-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-resource-filter]').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.resourceFilter;
      document.querySelectorAll('[data-resource-type]').forEach(card => {
        card.classList.toggle('hide', filter !== 'all' && card.dataset.resourceType !== filter);
      });
    });
  });
}

async function openResource(resourceId) {
  const resource = state.resources.find(item => item.id === resourceId);
  if (!resource) {
    showToast('No encontramos este recurso.', 'error');
    return;
  }

  if (resource.external_url && /^https?:\/\//i.test(resource.external_url)) {
    window.open(resource.external_url, '_blank', 'noopener');
    return;
  }

  if (!resource.file_path) {
    showToast('Este recurso todavía no tiene un archivo disponible.', 'error');
    return;
  }

  showToast('Preparando acceso seguro...');
  const { data, error } = await db.storage
    .from('digital-products')
    .createSignedUrl(resource.file_path, 600);

  if (error || !data?.signedUrl) {
    console.error(error);
    showToast('No pudimos abrir el recurso. Revisa que tu acceso esté activo.', 'error');
    return;
  }

  window.open(data.signedUrl, '_blank', 'noopener');
}

function renderAgenda() {
  const page = document.querySelector('#page');
  const now = Date.now();

  page.innerHTML = `
    <span class="eyebrow">Eventos y sesiones</span>
    <h1 class="page-title">Agenda</h1>
    <p class="page-subtitle">Consulta lanzamientos, webinars y próximas sesiones de tus programas.</p>

    <section class="agenda-layout">
      <div class="agenda-list">
        ${ACADEMY_EVENTS.map(event => {
          const past = new Date(event.date).getTime() < now;
          return `
            <article class="agenda-event glass ${past ? 'past' : ''}">
              <div class="agenda-date"><strong>${event.day}</strong><span>${event.month}</span></div>
              <div class="agenda-event-body">
                <div><span class="badge">${escapeHtml(past ? 'Finalizado' : event.type)}</span><span class="agenda-time">7:00 p. m. · Hora de Guadalajara</span></div>
                <h2>${escapeHtml(event.title)}</h2>
                <p>${escapeHtml(event.description)}</p>
                <div class="event-meta"><span>◷ 60 minutos</span><span>⌖ En línea por Zoom</span></div>
              </div>
              <div class="agenda-access">
                <strong>${past ? 'Consulta la grabación' : 'Acceso para inscritos'}</strong>
                <small>${past ? 'Si forma parte de tu compra, aparecerá en tus recursos.' : 'El enlace se compartirá con las cuentas autorizadas.'}</small>
                <a class="btn btn-secondary" href="${whatsappUrl(`Hola, necesito ayuda con el acceso al evento: ${event.title}.`)}" target="_blank" rel="noopener">Solicitar ayuda</a>
              </div>
            </article>`;
        }).join('')}
      </div>

      <aside class="agenda-side">
        <article class="calendar-card">
          <span class="eyebrow">Agosto 2026</span>
          <h2>Fechas importantes</h2>
          <div class="mini-calendar">
            ${['L','M','M','J','V','S','D'].map(day => `<small>${day}</small>`).join('')}
            ${Array.from({ length: 31 }, (_, index) => {
              const day = index + 1;
              return `<span class="${[3, 8].includes(day) ? 'event-day' : ''}">${day}</span>`;
            }).join('')}
          </div>
        </article>
        <article class="timezone-note glass">
          <strong>Zona horaria</strong>
          <p>Todos los horarios se muestran en la hora de Guadalajara, México.</p>
        </article>
      </aside>
    </section>`;
}

function renderHelp() {
  const page = document.querySelector('#page');
  page.innerHTML = `
    <section class="help-hero">
      <span class="eyebrow">Centro de ayuda</span>
      <h1>¿Cómo podemos ayudarte?</h1>
      <p>Encuentra respuestas sobre tu cuenta, compras, cursos y biblioteca digital.</p>
      <div class="help-search"><span>⌕</span><input id="help-search" aria-label="Buscar en ayuda" placeholder="Escribe una pregunta"></div>
    </section>

    <section class="help-categories">
      <button type="button" data-help-scroll><span>01</span><strong>Acceso y contraseña</strong><small>Cuenta y seguridad</small></button>
      <button type="button" data-help-scroll><span>02</span><strong>Compras y accesos</strong><small>Pagos y asignaciones</small></button>
      <button type="button" data-help-scroll><span>03</span><strong>Cursos y progreso</strong><small>Lecciones y certificados</small></button>
      <button type="button" data-help-scroll><span>04</span><strong>Libros digitales</strong><small>Biblioteca privada</small></button>
    </section>

    <section class="help-layout" id="help-access">
      <article class="faq-panel glass">
        <div class="section-heading"><div><span class="eyebrow">Preguntas frecuentes</span><h2>Respuestas rápidas</h2></div></div>
        <div id="faq-list">
          ${HELP_TOPICS.map(([question, answer], index) => `
            <details class="faq-item" data-help-text="${escapeHtml(`${question} ${answer}`.toLowerCase())}" ${index === 0 ? 'open' : ''}>
              <summary>${escapeHtml(question)}<span>+</span></summary>
              <p>${escapeHtml(answer)}</p>
            </details>`).join('')}
        </div>
        <p class="empty-help hide" id="empty-help">No encontramos una respuesta. Puedes escribirnos por WhatsApp.</p>
      </article>

      <aside class="contact-card">
        <span class="eyebrow">Atención personal</span>
        <h2>¿Necesitas que revisemos tu cuenta?</h2>
        <p>Escríbenos incluyendo tu nombre, correo de registro y una descripción del problema.</p>
        <a class="btn btn-primary" href="${whatsappUrl('Hola, necesito ayuda con Aula Compás. Mi nombre es: ___ y mi correo de registro es: ___.') }" target="_blank" rel="noopener">Escribir por WhatsApp</a>
        <div><strong>WhatsApp Business</strong><small>Proyecto Compás · +52 33 3664 6803</small></div>
        <div><strong>Horario de atención</strong><small>Lunes a viernes · 9:00 a. m. a 6:00 p. m.</small></div>
      </aside>
    </section>`;

  document.querySelector('#help-search').addEventListener('input', event => {
    const term = event.target.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('[data-help-text]').forEach(item => {
      const matches = !term || item.dataset.helpText.includes(term);
      item.classList.toggle('hide', !matches);
      if (matches) visible += 1;
    });
    document.querySelector('#empty-help').classList.toggle('hide', visible > 0);
  });
  document.querySelectorAll('[data-help-scroll]').forEach(button =>
    button.addEventListener('click', () => document.querySelector('#help-access').scrollIntoView({ behavior: 'smooth' }))
  );
}

function renderNotifications() {
  const page = document.querySelector('#page');
  const hasBook = state.resources.some(resource => resource.resource_type === 'book');
  const notifications = [
    hasBook && {
      type: 'Biblioteca',
      icon: '▧',
      title: 'Tu libro digital está disponible',
      text: 'El Compás del Estratega ya puede abrirse desde tu biblioteca privada.',
      href: '#resources'
    },
    {
      type: 'Evento',
      icon: '◷',
      title: 'Webinar del 8 de agosto',
      text: 'La sesión comenzará a las 7:00 p. m., hora de Guadalajara.',
      href: '#agenda'
    },
    {
      type: 'Cuenta',
      icon: '⌾',
      title: 'Mantén tus datos actualizados',
      text: 'Verifica que tu nombre esté completo para la emisión de certificados.',
      href: '#profile'
    }
  ].filter(Boolean);

  page.innerHTML = `
    <span class="eyebrow">Mantente al día</span>
    <h1 class="page-title">Notificaciones</h1>
    <p class="page-subtitle">Avisos importantes sobre tus cursos, libros y eventos.</p>
    <section class="notification-list">
      ${notifications.map(notification => `
        <a class="notification-item glass" href="${notification.href}">
          <span class="notification-icon">${notification.icon}</span>
          <div><small>${notification.type}</small><strong>${escapeHtml(notification.title)}</strong><p>${escapeHtml(notification.text)}</p></div>
          <span>→</span>
        </a>`).join('')}
    </section>`;
}

function renderSearch(term) {
  const page = document.querySelector('#page');
  const normalized = term.trim().toLowerCase();
  const results = [];

  state.courses.forEach(course => {
    const text = `${course.title} ${course.subtitle || ''} ${course.description || ''} ${course.category || ''}`.toLowerCase();
    if (text.includes(normalized)) results.push({ type: 'Curso', title: course.title, text: course.subtitle || course.description, href: `#course/${course.id}` });
    course.modules.forEach(module => module.lessons.forEach(lesson => {
      const lessonText = `${lesson.title} ${module.title} ${course.title}`.toLowerCase();
      if (lessonText.includes(normalized)) results.push({ type: 'Lección', title: lesson.title, text: `${course.title} · ${module.title}`, href: `#lesson/${course.id}/${lesson.id}` });
    }));
  });
  state.resources.forEach(resource => {
    if (`${resource.title} ${resource.resource_type}`.toLowerCase().includes(normalized)) {
      results.push({ type: resourceTypeLabel(resource.resource_type), title: resource.title, text: 'Disponible en tu biblioteca', href: '#resources' });
    }
  });
  HELP_TOPICS.forEach(([question, answer]) => {
    if (`${question} ${answer}`.toLowerCase().includes(normalized)) results.push({ type: 'Ayuda', title: question, text: answer, href: '#help' });
  });

  page.innerHTML = `
    <span class="eyebrow">Búsqueda global</span>
    <h1 class="page-title">Resultados</h1>
    <p class="page-subtitle">${results.length} ${results.length === 1 ? 'resultado' : 'resultados'} para “${escapeHtml(term)}”.</p>
    <section class="search-results">
      ${results.length ? results.map(result => `
        <a class="search-result glass" href="${result.href}">
          <span>${escapeHtml(result.type)}</span>
          <div><h2>${escapeHtml(result.title)}</h2><p>${escapeHtml(result.text || '')}</p></div>
          <strong>→</strong>
        </a>`).join('') : `
        <section class="empty-state glass"><h2>No encontramos coincidencias.</h2><p>Prueba con el nombre de un curso, una lección, un libro o una pregunta.</p><a class="btn btn-secondary" href="#help">Abrir ayuda</a></section>`}
    </section>`;
}

function renderCertificates() {
  const page = document.querySelector('#page');
  const completed = state.courses.filter(course => courseProgress(course) === 100 && allLessons(course).length);
  page.innerHTML = `
    <span class="eyebrow">Reconoce tu avance</span>
    <h1 class="page-title">Mis certificados</h1>
    <p class="page-subtitle">Los certificados se habilitan cuando completas todas las lecciones de un programa.</p>
    <section class="certificate-grid">
      ${completed.length ? completed.map(course => `
        <article class="certificate-card glass">
          <img src="${escapeHtml(cover(course))}" alt="">
          <div><span class="badge">Completado</span><h2>${escapeHtml(course.title)}</h2><p>Certificado disponible para ${escapeHtml(displayName())}.</p><a class="btn btn-primary" href="#certificate/${course.id}">Ver certificado</a></div>
        </article>`).join('') : `
        <section class="empty-state glass"><h2>Tu próximo logro está en camino.</h2><p>Completa un curso al 100% para habilitar su certificado.</p><a class="btn btn-primary" href="#courses">Continuar aprendiendo</a></section>`}
    </section>`;
}

function renderCertificate(courseId) {
  const page = document.querySelector('#page');
  const course = findCourse(courseId);
  if (!course || courseProgress(course) !== 100 || !allLessons(course).length) return renderCertificates();
  const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  page.innerHTML = `
    <div class="certificate-actions"><a class="back-link" href="#certificates">← Volver</a><button class="btn btn-primary" id="print-certificate">Imprimir o guardar PDF</button></div>
    <section class="certificate-document">
      <img src="logo-completo-oficial.png" alt="Proyecto Compás">
      <span>CONSTANCIA DE FINALIZACIÓN</span>
      <p>Proyecto Compás reconoce a</p>
      <h1>${escapeHtml(displayName())}</h1>
      <p>por haber completado satisfactoriamente el programa</p>
      <h2>${escapeHtml(course.title)}</h2>
      <div class="certificate-seal">PC</div>
      <small>Emitido el ${escapeHtml(date)} · Aula Compás</small>
    </section>`;
  document.querySelector('#print-certificate').addEventListener('click', () => window.print());
}

function renderProfile() {
  const page = document.querySelector('#page');

  page.innerHTML = `
    <span class="eyebrow">Mi cuenta</span>
    <h1 class="page-title">Perfil</h1>

    <section class="profile-grid">
      <article class="profile-card glass">
        <img src="${escapeHtml(avatarUrl())}" alt="" onerror="imageErrorFallback(event, 'icono-oficial.png')">
        <h1>${escapeHtml(displayName())}</h1>
        <p>${escapeHtml(state.user.email)}</p>
        <span class="badge">${isAdmin() ? 'Administrador' : isInstructor() ? 'Instructor' : 'Alumno'}</span>
        <div class="profile-stats"><span><strong>${state.courses.length}</strong>Cursos</span><span><strong>${state.resources.length}</strong>Recursos</span></div>
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
        <div class="settings-row"><div><strong>Mis certificados</strong><small>Consulta los reconocimientos de cursos completados.</small></div><a class="btn btn-secondary" href="#certificates">Ver certificados</a></div>
        <div class="settings-row"><div><strong>Centro de ayuda</strong><small>Respuestas sobre compras, accesos y materiales.</small></div><a class="btn btn-secondary" href="#help">Obtener ayuda</a></div>
        ${canManageContent() ? '<div class="settings-row"><div><strong>Panel de contenidos</strong><small>Gestiona cursos, módulos y materiales según tus permisos.</small></div><a class="btn btn-secondary" href="#admin">Abrir panel</a></div>' : ''}
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
      <article class="admin-card glass"><strong>${isAdmin() ? state.profiles.length : state.courses.length}</strong><span>${isAdmin() ? 'Usuarios registrados' : 'Cursos administrados'}</span></article>
      <article class="admin-card glass"><strong>${state.courses.length}</strong><span>Cursos visibles</span></article>
      <article class="admin-card glass"><strong>${isAdmin() ? state.enrollments.length : state.courses.reduce((sum, course) => sum + course.modules.length, 0)}</strong><span>${isAdmin() ? 'Inscripciones' : 'Módulos publicados'}</span></article>
      ${isAdmin() ? `<article class="admin-card glass"><strong>${state.profiles.filter(profile => profile.role === 'instructor').length}</strong><span>Instructores</span></article>` : ''}
    </section>

    <section class="admin-command-bar">
      <div><strong>Centro de operaciones</strong><span>Gestiona contenido, accesos y equipo desde un solo lugar.</span></div>
      <div><button type="button" data-admin-scroll="admin-courses">Cursos</button><button type="button" data-admin-scroll="admin-resources">Recursos</button>${isAdmin() ? '<button type="button" data-admin-scroll="admin-users">Usuarios</button>' : ''}</div>
    </section>

    <section class="admin-layout">
      <article class="settings-card glass">
        <div class="section-heading"><h2>Crear curso</h2></div>
        <form id="course-form" class="stack-form">
          <div class="field"><label>Título</label><input name="title" required></div>
          <div class="field"><label>Subtítulo</label><input name="subtitle"></div>
          <div class="field"><label>Descripción</label><textarea name="description" rows="3"></textarea></div>
          <div class="field"><label>Categoría</label><input name="category" value="Formación"></div>
          <div class="field"><label>Ruta de portada</label><input name="coverUrl" value="curso-compas.webp"></div>
          <div class="form-two-columns">
            <div class="field"><label>Instructor</label><input name="instructorName" value="${escapeHtml(displayName())}"></div>
            <div class="field"><label>Duración</label><input name="durationLabel" placeholder="4 semanas"></div>
          </div>
          <div class="form-two-columns">
            <div class="field"><label>Precio MXN</label><input name="price" type="number" min="0" step="0.01"></div>
            <div class="field"><label>Precio promocional</label><input name="salePrice" type="number" min="0" step="0.01"></div>
          </div>
          <div class="field"><label>Enlace de pago</label><input name="paymentUrl" type="url" placeholder="https://mpago.la/..."></div>
          <div class="form-two-columns">
            <div class="field"><label>Estado</label><select name="status"><option value="draft">Borrador</option><option value="published">Publicado</option></select></div>
            <label class="switch-field"><input name="featured" type="checkbox"><span>Curso destacado</span></label>
          </div>
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

      ${isAdmin() ? `<article class="settings-card glass">
        <div class="section-heading"><h2>Asignar curso</h2></div>
        <form id="enrollment-form" class="stack-form">
          <div class="field"><label>Alumno</label><select name="userId" required>${studentOptions || '<option value="">No hay alumnos registrados</option>'}</select></div>
          <div class="field"><label>Curso</label><select name="courseId" required>${courseOptions}</select></div>
          <button class="btn btn-primary" ${!studentOptions || !courseOptions ? 'disabled' : ''}>Asignar acceso</button>
        </form>
        <div class="demo-note">Por seguridad, los alumnos crean su propia cuenta desde la pantalla de registro. Después aparecerán aquí para que les asignes un curso.</div>
      </article>` : ''}
    </section>

    <section class="settings-card glass" id="admin-courses" style="margin-top:18px">
      <div class="section-heading"><div><span class="eyebrow">Catálogo</span><h2>Estado de los cursos</h2></div></div>
      <div class="admin-course-list">
        ${state.courses.map(course => `
          <article>
            <img src="${escapeHtml(cover(course))}" alt="">
            <div><strong>${escapeHtml(course.title)}</strong><small>${escapeHtml(course.category || 'Sin categoría')} · ${course.modules.length} módulos</small></div>
            <span class="status-pill ${course.status === 'published' ? 'available' : ''}">${course.status === 'published' ? 'Publicado' : 'Borrador'}</span>
            <button class="btn btn-secondary" data-course-status="${escapeHtml(course.id)}" data-next-status="${course.status === 'published' ? 'draft' : 'published'}">${course.status === 'published' ? 'Pasar a borrador' : 'Publicar'}</button>
          </article>`).join('')}
      </div>
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

    <section class="settings-card glass" id="admin-resources" style="margin-top:18px">
      <div class="section-heading"><h2>Agregar libro o recurso privado</h2></div>
      <p class="page-subtitle">El archivo se guarda en un depósito privado. Solo podrán abrirlo las personas autorizadas para el curso seleccionado.</p>
      <form id="resource-form" class="admin-form admin-resource-form">
        <select name="courseId">
          <option value="">Recurso general</option>
          ${courseOptions}
        </select>
        <input name="title" placeholder="Título del recurso" required>
        <select name="resourceType" required>
          <option value="book">Libro digital</option>
          <option value="pdf">PDF</option>
          <option value="template">Plantilla</option>
          <option value="audio">Audio</option>
          <option value="link">Enlace</option>
        </select>
        <input name="externalUrl" type="url" placeholder="Enlace externo opcional">
        <label class="file-field">
          <span>Archivo privado</span>
          <input name="file" type="file" accept=".html,.htm,.pdf,.epub,.zip,.mp3,.m4a,.wav">
        </label>
        <button class="btn btn-primary">Guardar recurso</button>
      </form>
      <div class="demo-note">Para el libro digital utiliza el archivo HTML que contiene las 106 páginas. No lo subas al repositorio público.</div>
    </section>

    ${isAdmin() ? `<section class="settings-card glass" id="admin-users" style="margin-top:18px">
      <div class="section-heading"><h2>Usuarios e inscripciones</h2></div>
      <table class="admin-table">
        <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Cursos asignados</th></tr></thead>
        <tbody>
          ${state.profiles.map(profile => {
            const assigned = state.enrollments
              .filter(row => row.user_id === profile.id && row.status !== 'cancelled')
              .map(row => state.courses.find(course => course.id === row.course_id)?.title)
              .filter(Boolean);
            return `<tr>
              <td>${escapeHtml(profile.full_name || 'Sin nombre')}</td>
              <td>${escapeHtml(profile.email || '')}</td>
              <td>
                <select data-role-user="${escapeHtml(profile.id)}" ${profile.id === state.user.id ? 'disabled' : ''}>
                  <option value="student" ${profile.role === 'student' ? 'selected' : ''}>Alumno</option>
                  <option value="instructor" ${profile.role === 'instructor' ? 'selected' : ''}>Instructor</option>
                  <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
              </td>
              <td>${escapeHtml(assigned.join(', ') || 'Ninguno')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </section>` : ''}`;

  document.querySelector('#course-form').addEventListener('submit', createCourse);
  document.querySelector('#module-form').addEventListener('submit', createModule);
  document.querySelector('#lesson-form').addEventListener('submit', createLesson);
  document.querySelector('#resource-form').addEventListener('submit', createResource);
  document.querySelector('#enrollment-form')?.addEventListener('submit', assignCourse);
  document.querySelectorAll('[data-course-status]').forEach(button =>
    button.addEventListener('click', () => setCourseStatus(button.dataset.courseStatus, button.dataset.nextStatus))
  );
  document.querySelectorAll('[data-role-user]').forEach(select =>
    select.addEventListener('change', () => updateUserRole(select.dataset.roleUser, select.value))
  );
  document.querySelectorAll('[data-admin-scroll]').forEach(button =>
    button.addEventListener('click', () => document.querySelector(`#${button.dataset.adminScroll}`)?.scrollIntoView({ behavior: 'smooth' }))
  );
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
    description: String(form.get('description')).trim() || null,
    category: String(form.get('category')).trim() || 'Formación',
    cover_url: String(form.get('coverUrl')).trim() || 'curso-compas.webp',
    instructor_name: String(form.get('instructorName')).trim() || displayName(),
    duration_label: String(form.get('durationLabel')).trim() || null,
    price: Number(form.get('price')) || null,
    sale_price: Number(form.get('salePrice')) || null,
    payment_url: String(form.get('paymentUrl')).trim() || null,
    status: String(form.get('status')) || 'draft',
    featured: form.get('featured') === 'on',
    created_by: state.user.id
  });

  setFormBusy(event.currentTarget, false);
  if (error) return showToast(error.message, 'error');

  showToast('Curso creado.', 'success');
  await loadApplicationData();
  renderAdmin();
}

async function setCourseStatus(courseId, status) {
  const { error } = await db.from('courses').update({ status }).eq('id', courseId);
  if (error) return showToast(error.message, 'error');
  showToast(status === 'published' ? 'Curso publicado.' : 'Curso guardado como borrador.', 'success');
  await loadApplicationData();
  renderAdmin();
}

async function updateUserRole(userId, role) {
  const { error } = await db.rpc('admin_set_user_role', { target_user: userId, new_role: role });
  if (error) return showToast(error.message, 'error');
  showToast('Rol actualizado correctamente.', 'success');
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

async function createResource(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const file = form.get('file');
  const externalUrl = String(form.get('externalUrl') || '').trim();
  const courseId = String(form.get('courseId') || '').trim();

  if ((!file || !file.size) && !externalUrl) {
    showToast('Selecciona un archivo o agrega un enlace externo.', 'error');
    return;
  }

  setFormBusy(formElement, true);
  let filePath = null;
  let resourceCreated = false;

  try {
    if (file?.size) {
      const cleanName = file.name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      filePath = `courses/${courseId || 'general'}/${Date.now()}-${cleanName}`;
      const contentType = /\.html?$/i.test(file.name)
        ? 'text/html; charset=utf-8'
        : file.type || 'application/octet-stream';
      const { error: uploadError } = await db.storage
        .from('digital-products')
        .upload(filePath, file, { contentType, upsert: false });
      if (uploadError) throw uploadError;
    }

    const { error } = await db.from('resources').insert({
      course_id: courseId || null,
      title: String(form.get('title')).trim(),
      resource_type: String(form.get('resourceType')).trim(),
      external_url: externalUrl || null,
      file_path: filePath,
      is_public: false
    });
    if (error) throw error;
    resourceCreated = true;

    showToast('Recurso privado guardado.', 'success');
    formElement.reset();
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    console.error(error);
    if (filePath && !resourceCreated) {
      await db.storage.from('digital-products').remove([filePath]).catch(() => {});
    }
    showToast(error.message || 'No se pudo guardar el recurso.', 'error');
  } finally {
    setFormBusy(formElement, false);
  }
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
window.addEventListener('load', () => {
  init().catch(error => {
    console.error('Fallo al iniciar Aula Compás:', error);
    app.innerHTML = `
      <main class="login-screen">
        <section class="login-card glass">
          <img class="official-lockup" src="logo-completo-oficial.png" alt="Proyecto Compás">
          <h1>No pudimos iniciar el aula</h1>
          <p>${escapeHtml(error?.message || 'Ocurrió un error inesperado.')}</p>
          <div class="bootstrap-actions">
            <a class="btn btn-primary" href="diagnostico.html">Abrir diagnóstico</a>
            <a class="btn btn-secondary" href="limpiar-cache.html">Limpiar versión anterior</a>
          </div>
        </section>
      </main>`;
  });
});
