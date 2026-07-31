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
  ['¿Dónde encuentro mi libro digital?', 'Abre “Mi biblioteca” y selecciona el libro. El sistema genera un acceso privado temporal para proteger tu compra.'],
  ['¿Cómo recupero mi contraseña?', 'Cierra tu sesión, selecciona “Olvidé mi contraseña” y revisa el enlace enviado a tu correo.'],
  ['Mi pago todavía no aparece', 'Escríbenos por WhatsApp con tu comprobante, nombre y correo de registro para que revisemos tu acceso.'],
  ['¿Puedo usar el aula desde mi celular?', 'Sí. Aula Compás es adaptable y también puedes instalarla desde el botón disponible en tu perfil.'],
  ['¿Cómo obtengo mi certificado?', 'Completa todas las lecciones del curso. Después podrás abrir e imprimir tu certificado desde la sección de certificados.']
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

const COURSE_MEDIA_BUCKET = 'course-media';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_COVER_SIZE = 5 * 1024 * 1024;

function validateCoverImage(file) {
  if (!file || !file.size) return null;
  if (!IMAGE_TYPES.includes(file.type)) {
    throw new Error('La imagen debe estar en formato JPG, PNG o WebP.');
  }
  if (file.size > MAX_COVER_SIZE) {
    throw new Error('La imagen no debe superar los 5 MB.');
  }
  return file;
}

function mediaExtension(file) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

async function uploadCourseMedia(file, folder, ownerId) {
  validateCoverImage(file);
  const path = `${folder}/${ownerId}/${Date.now()}-portada.${mediaExtension(file)}`;
  const { error } = await db.storage
    .from(COURSE_MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = db.storage.from(COURSE_MEDIA_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

async function removeCourseMedia(path) {
  if (!path) return;
  const { error } = await db.storage.from(COURSE_MEDIA_BUCKET).remove([path]);
  if (error) throw error;
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

          <a class="nav-link nav-link-secondary ${activeNav === 'catalog' ? 'active' : ''}" href="#catalog">
            <span class="nav-icon">＋</span>
            Explorar cursos
          </a>

          ${canManageContent() ? `
            <a class="nav-link admin-nav-link ${activeNav === 'admin' ? 'active' : ''}" href="#admin">
              <span class="nav-icon">⚙</span>
              ${isAdmin() ? 'Administrar' : 'Mis contenidos'}
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

function professionalCourseCard(course) {
  const progress = courseProgress(course);
  const lessons = allLessons(course);
  const completed = lessons.filter(lesson => isLessonCompleted(lesson.id)).length;
  const nextLesson = firstIncompleteLesson(course);
  const statusClass = progress === 100 ? 'complete' : progress > 0 ? 'progress' : 'new';
  const statusLabel = progress === 100 ? 'Finalizado' : progress > 0 ? 'En progreso' : 'No iniciado';
  const actionLabel = progress === 100 ? 'Repasar curso' : progress > 0 ? 'Continuar' : 'Comenzar curso';
  const actionUrl = nextLesson
    ? `#lesson/${course.id}/${nextLesson.id}`
    : `#course/${course.id}`;

  return `
    <article class="learning-course-card" data-course-progress="${progress}" data-course-category="${escapeHtml(course.category || '')}">
      <a class="learning-course-cover" href="#course/${course.id}" aria-label="Abrir ${escapeHtml(course.title)}">
        <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event)">
        ${course.featured ? '<span class="learning-featured">Destacado</span>' : ''}
      </a>

      <div class="learning-course-body">
        <div class="learning-course-topline">
          <span class="course-status course-status-${statusClass}"><i></i>${statusLabel}</span>
          <span class="learning-course-category">${escapeHtml(course.category || 'Curso')}</span>
        </div>

        <div>
          <h3><a href="#course/${course.id}">${escapeHtml(course.title)}</a></h3>
          <p>${escapeHtml(course.subtitle || course.description || 'Continúa avanzando a tu propio ritmo.')}</p>
        </div>

        <div class="learning-progress-block">
          <div class="learning-progress-label"><span>Tu avance</span><strong>${progress}%</strong></div>
          <div class="learning-progress-track"><span style="width:${progress}%"></span></div>
        </div>

        <div class="learning-course-details">
          <span><small>Contenido</small><strong>${completed}/${lessons.length} lecciones</strong></span>
          ${course.duration_label ? `<span><small>Duración</small><strong>${escapeHtml(course.duration_label)}</strong></span>` : ''}
          <span><small>Siguiente paso</small><strong>${nextLesson ? escapeHtml(nextLesson.title) : progress === 100 ? 'Curso completado' : 'Ver programa'}</strong></span>
        </div>

        <div class="learning-course-actions">
          <a class="btn btn-primary learning-primary-action" href="${actionUrl}">${actionLabel}</a>
          <a class="learning-outline-action" href="#course/${course.id}">Ver contenido</a>
        </div>
      </div>
    </article>`;
}

function renderCourses() {
  const page = document.querySelector('#page');

  if (!state.courses.length) {
    page.innerHTML = emptyCoursesMessage();
    return;
  }

  const categories = [...new Set(state.courses.map(course => course.category).filter(Boolean))];
  const activeCourse = state.courses
    .filter(course => courseProgress(course) < 100)
    .sort((a, b) => courseProgress(b) - courseProgress(a))[0] || state.courses[0];
  const activeProgress = courseProgress(activeCourse);
  const activeNextLesson = firstIncompleteLesson(activeCourse);
  const completedCourses = state.courses.filter(course => courseProgress(course) === 100).length;
  const inProgressCourses = state.courses.filter(course => {
    const value = courseProgress(course);
    return value > 0 && value < 100;
  }).length;

  page.innerHTML = `
    <section class="courses-page-heading">
      <div>
        <span class="eyebrow">Tu formación</span>
        <h1 class="page-title">Mis cursos</h1>
        <p class="page-subtitle">Retoma tu aprendizaje, revisa tu avance y accede a todos los programas asignados a tu cuenta.</p>
      </div>
      <a class="btn btn-secondary" href="#catalog">Explorar nuevos cursos</a>
    </section>

    <section class="courses-overview">
      <article><span>▤</span><div><strong>${state.courses.length}</strong><small>Cursos disponibles</small></div></article>
      <article><span>◔</span><div><strong>${inProgressCourses}</strong><small>En progreso</small></div></article>
      <article><span>✓</span><div><strong>${completedCourses}</strong><small>Finalizados</small></div></article>
    </section>

    <section class="continue-learning-panel">
      <div class="continue-learning-image">
        <img src="${escapeHtml(cover(activeCourse))}" alt="${escapeHtml(activeCourse.title)}" onerror="imageErrorFallback(event)">
      </div>
      <div class="continue-learning-content">
        <span class="eyebrow">Continuar aprendiendo</span>
        <h2>${escapeHtml(activeCourse.title)}</h2>
        <p>${escapeHtml(activeCourse.subtitle || activeCourse.description || '')}</p>
        <div class="continue-progress-row">
          <div class="learning-progress-track"><span style="width:${activeProgress}%"></span></div>
          <strong>${activeProgress}%</strong>
        </div>
        <div class="continue-learning-actions">
          <a class="btn btn-primary" href="${activeNextLesson ? `#lesson/${activeCourse.id}/${activeNextLesson.id}` : `#course/${activeCourse.id}`}">${activeProgress > 0 ? 'Continuar curso' : 'Comenzar curso'}</a>
          <a class="btn btn-secondary" href="#course/${activeCourse.id}">Ver programa</a>
        </div>
      </div>
    </section>

    <section class="courses-list-heading">
      <div><span class="eyebrow">Biblioteca de aprendizaje</span><h2>Todos mis cursos</h2></div>
      <span id="course-result-count">${state.courses.length} ${state.courses.length === 1 ? 'curso' : 'cursos'}</span>
    </section>

    <div class="filters courses-filters">
      <button class="filter-button active" data-filter="all">Todos</button>
      <button class="filter-button" data-filter="progress">En progreso</button>
      <button class="filter-button" data-filter="new">No iniciados</button>
      <button class="filter-button" data-filter="complete">Finalizados</button>
      ${categories.map(category => `<button class="filter-button" data-filter="category:${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}
    </div>

    <section class="learning-course-list" id="course-grid">${state.courses.map(professionalCourseCard).join('')}</section>`;

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

      if (filter === 'new') list = list.filter(course => courseProgress(course) === 0);
      if (filter === 'complete') list = list.filter(course => courseProgress(course) === 100);
      if (filter.startsWith('category:')) {
        const category = filter.slice('category:'.length);
        list = list.filter(course => course.category === category);
      }

      document.querySelector('#course-result-count').textContent = `${list.length} ${list.length === 1 ? 'curso' : 'cursos'}`;
      document.querySelector('#course-grid').innerHTML = list.length
        ? list.map(professionalCourseCard).join('')
        : '<section class="empty-state glass courses-empty"><h2>No hay cursos en esta categoría.</h2><p>Prueba con otro filtro para ver tus programas disponibles.</p></section>';
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

function libraryResourceGroup(resource) {
  return resource.resource_type === 'book' ? 'book' : 'material';
}

function resourceCardMarkup(resource) {
  const course = state.courses.find(item => item.id === resource.course_id);
  const isBook = resource.resource_type === 'book';
  const fallback = isBook ? 'curso-compas.webp' : 'recurso-manual.webp';
  const subtitle = course ? course.title : 'Recurso general de Aula Compás';

  if (isBook) {
    return `
      <article class="library-book-card" data-resource-type="book" data-resource-title="${escapeHtml(`${resource.title} ${subtitle}`.toLowerCase())}">
        <button class="library-book-cover" type="button" data-resource-id="${escapeHtml(resource.id)}" aria-label="Abrir ${escapeHtml(resource.title)}">
          <img src="${escapeHtml(normalizeMediaUrl(resource.thumbnail_url, fallback))}" alt="Portada de ${escapeHtml(resource.title)}" onerror="imageErrorFallback(event, '${fallback}')">
          <span class="library-access-badge">En tu biblioteca</span>
          <span class="library-book-overlay">Leer ahora</span>
        </button>
        <div class="library-book-info">
          <span class="eyebrow">${escapeHtml(resourceTypeLabel(resource.resource_type))}</span>
          <h3>${escapeHtml(resource.title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
          <button class="library-text-action" type="button" data-resource-id="${escapeHtml(resource.id)}">Abrir libro <span>→</span></button>
        </div>
      </article>`;
  }

  return `
    <article class="library-material-card glass" data-resource-type="material" data-resource-title="${escapeHtml(`${resource.title} ${subtitle} ${resourceTypeLabel(resource.resource_type)}`.toLowerCase())}">
      <div class="library-material-thumb">
        <img src="${escapeHtml(normalizeMediaUrl(resource.thumbnail_url, fallback))}" alt="${escapeHtml(resource.title)}" onerror="imageErrorFallback(event, '${fallback}')">
        <span>${escapeHtml(resourceTypeLabel(resource.resource_type))}</span>
      </div>
      <div class="library-material-body">
        <div>
          <span class="eyebrow">Material de apoyo</span>
          <h3>${escapeHtml(resource.title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <button class="btn btn-secondary" type="button" data-resource-id="${escapeHtml(resource.id)}">Abrir recurso</button>
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
  const featuredBook = books[0] || null;

  page.innerHTML = `
    <section class="library-page-heading">
      <div>
        <span class="eyebrow">Colección personal</span>
        <h1 class="page-title">Mi biblioteca</h1>
        <p class="page-subtitle">Encuentra los libros y materiales vinculados a tus cursos. Tu acceso es privado y exclusivo para tu cuenta.</p>
      </div>
      <div class="library-summary" aria-label="Resumen de biblioteca">
        <article><strong>${books.length}</strong><span>${books.length === 1 ? 'Libro' : 'Libros'}</span></article>
        <article><strong>${materials.length}</strong><span>${materials.length === 1 ? 'Material' : 'Materiales'}</span></article>
      </div>
    </section>

    <section class="library-toolbar glass">
      <label class="library-search">
        <span>⌕</span>
        <input id="library-search" type="search" placeholder="Buscar en mi biblioteca" autocomplete="off">
      </label>
      <div class="library-filter-tabs" role="group" aria-label="Filtrar biblioteca">
        <button class="library-filter active" type="button" data-resource-filter="all">Todo</button>
        <button class="library-filter" type="button" data-resource-filter="book">Libros</button>
        <button class="library-filter" type="button" data-resource-filter="material">Materiales</button>
      </div>
    </section>

    ${featuredBook ? `
      <section class="library-featured-book">
        <div class="library-featured-cover">
          <img src="${escapeHtml(normalizeMediaUrl(featuredBook.thumbnail_url, 'curso-compas.webp'))}" alt="Portada de ${escapeHtml(featuredBook.title)}" onerror="imageErrorFallback(event, 'curso-compas.webp')">
        </div>
        <div class="library-featured-content">
          <span class="eyebrow">Lectura destacada</span>
          <h2>${escapeHtml(featuredBook.title)}</h2>
          <p>Este libro forma parte de tu colección. Puedes abrirlo desde cualquier dispositivo mientras tu sesión esté activa.</p>
          <div class="library-featured-actions">
            <button class="btn btn-primary" type="button" data-resource-id="${escapeHtml(featuredBook.id)}">Leer ahora</button>
            <a class="btn btn-secondary" href="#help">Ayuda con mi acceso</a>
          </div>
          <small>El enlace de lectura es temporal para proteger tu contenido.</small>
        </div>
      </section>` : ''}

    <section class="library-content" id="library-content">
      ${books.length ? `
        <div class="library-section" data-library-section="book">
          <div class="section-heading library-section-heading">
            <div><span class="eyebrow">Tu estantería</span><h2>Libros digitales</h2></div>
            <span>${books.length} ${books.length === 1 ? 'título' : 'títulos'}</span>
          </div>
          <div class="library-books-grid">
            ${books.map(resourceCardMarkup).join('')}
          </div>
        </div>` : ''}

      ${materials.length ? `
        <div class="library-section" data-library-section="material">
          <div class="section-heading library-section-heading">
            <div><span class="eyebrow">Para seguir aprendiendo</span><h2>Materiales de apoyo</h2></div>
            <span>${materials.length} ${materials.length === 1 ? 'recurso' : 'recursos'}</span>
          </div>
          <div class="library-materials-grid">
            ${materials.map(resourceCardMarkup).join('')}
          </div>
        </div>` : ''}

      ${state.resources.length ? '' : `
        <section class="library-empty-state glass">
          <div class="library-empty-icon">▧</div>
          <span class="eyebrow">Tu colección está lista para crecer</span>
          <h2>Tu biblioteca aún está vacía</h2>
          <p>Los libros, manuales y recursos aparecerán aquí cuando sean asignados a tu cuenta.</p>
          <a class="btn btn-primary" href="#catalog">Explorar cursos</a>
        </section>`}

      <section class="library-no-results hide" id="library-no-results">
        <div class="library-empty-icon">⌕</div>
        <h2>No encontramos coincidencias</h2>
        <p>Prueba con otro título, curso o tipo de recurso.</p>
      </section>
    </section>

    <section class="library-security-note">
      <span>⌾</span>
      <div><strong>Biblioteca protegida</strong><p>Los archivos privados utilizan enlaces temporales y solo se abren para cuentas autorizadas.</p></div>
    </section>`;

  bindResourceButtons();

  const searchInput = document.querySelector('#library-search');
  const filterButtons = [...document.querySelectorAll('[data-resource-filter]')];
  let currentFilter = 'all';

  const applyLibraryFilters = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visibleCards = 0;

    document.querySelectorAll('[data-resource-title]').forEach(card => {
      const typeMatches = currentFilter === 'all' || card.dataset.resourceType === currentFilter;
      const textMatches = !query || card.dataset.resourceTitle.includes(query);
      const visible = typeMatches && textMatches;
      card.classList.toggle('hide', !visible);
      if (visible) visibleCards += 1;
    });

    document.querySelectorAll('[data-library-section]').forEach(section => {
      const visibleInSection = section.querySelectorAll('[data-resource-title]:not(.hide)').length > 0;
      section.classList.toggle('hide', !visibleInSection);
    });

    document.querySelector('#library-no-results')?.classList.toggle('hide', visibleCards > 0 || state.resources.length === 0);
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.resourceFilter;
      filterButtons.forEach(item => item.classList.toggle('active', item === button));
      applyLibraryFilters();
    });
  });

  searchInput?.addEventListener('input', applyLibraryFilters);
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
  const now = new Date();
  const sortedEvents = [...ACADEMY_EVENTS].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= now);
  const pastEvents = sortedEvents.filter(event => new Date(event.date) < now);
  const nextEvent = upcomingEvents[0] || null;

  const calendarBase = nextEvent ? new Date(nextEvent.date) : (sortedEvents[0] ? new Date(sortedEvents[0].date) : now);
  const calendarYear = calendarBase.getFullYear();
  const calendarMonth = calendarBase.getMonth();
  const monthName = calendarBase.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const eventDays = new Set(
    sortedEvents
      .map(event => new Date(event.date))
      .filter(date => date.getFullYear() === calendarYear && date.getMonth() === calendarMonth)
      .map(date => date.getDate())
  );

  const formatEventDate = dateValue => {
    const date = new Date(dateValue);
    return {
      day: date.toLocaleDateString('es-MX', { day: '2-digit' }),
      month: date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', '').toUpperCase(),
      full: date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time: date.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    };
  };

  const renderEventCard = event => {
    const date = new Date(event.date);
    const dateInfo = formatEventDate(event.date);
    const past = date < now;

    return `
      <article class="calendar-event-card glass ${past ? 'is-past' : ''}" data-calendar-event="${past ? 'past' : 'upcoming'}">
        <div class="calendar-event-date">
          <strong>${dateInfo.day}</strong>
          <span>${dateInfo.month}</span>
        </div>

        <div class="calendar-event-content">
          <div class="calendar-event-topline">
            <span class="calendar-status ${past ? 'completed' : 'live'}">${escapeHtml(past ? 'Finalizado' : event.type)}</span>
            <span>${escapeHtml(dateInfo.time)} · Hora de Guadalajara</span>
          </div>
          <h3>${escapeHtml(event.title)}</h3>
          <p>${escapeHtml(event.description)}</p>
          <div class="calendar-event-meta">
            <span>◷ 60 minutos</span>
            <span>⌖ En línea</span>
            <span>◉ Zoom</span>
          </div>
        </div>

        <div class="calendar-event-action">
          <small>${escapeHtml(dateInfo.full)}</small>
          <a class="btn ${past ? 'btn-secondary' : 'btn-primary'}" href="${whatsappUrl(`Hola, necesito ayuda con el acceso al evento: ${event.title}.`)}" target="_blank" rel="noopener">
            ${past ? 'Solicitar grabación' : 'Solicitar acceso'}
          </a>
        </div>
      </article>`;
  };

  page.innerHTML = `
    <section class="calendar-page-heading">
      <div>
        <span class="eyebrow">Mi calendario</span>
        <h1 class="page-title">Próximos encuentros</h1>
        <p class="page-subtitle">Consulta webinars, lanzamientos y sesiones disponibles dentro de tus programas.</p>
      </div>
      <div class="calendar-heading-summary">
        <article><strong>${upcomingEvents.length}</strong><span>Próximos</span></article>
        <article><strong>${pastEvents.length}</strong><span>Finalizados</span></article>
      </div>
    </section>

    ${nextEvent ? (() => {
      const info = formatEventDate(nextEvent.date);
      return `
        <section class="calendar-featured-event">
          <div class="calendar-featured-copy">
            <span class="eyebrow">Siguiente evento</span>
            <h2>${escapeHtml(nextEvent.title)}</h2>
            <p>${escapeHtml(nextEvent.description)}</p>
            <div class="calendar-featured-meta">
              <span>▣ ${escapeHtml(info.full)}</span>
              <span>◷ ${escapeHtml(info.time)}</span>
              <span>⌖ Guadalajara, México</span>
            </div>
            <div class="calendar-featured-actions">
              <a class="btn btn-primary" href="${whatsappUrl(`Hola, quiero confirmar mi acceso al evento: ${nextEvent.title}.`)}" target="_blank" rel="noopener">Confirmar mi acceso</a>
              <button class="btn btn-secondary" type="button" id="copy-next-event">Copiar fecha</button>
            </div>
          </div>
          <div class="calendar-featured-date">
            <span>${escapeHtml(info.month)}</span>
            <strong>${escapeHtml(info.day)}</strong>
            <small>${calendarYear}</small>
          </div>
        </section>`;
    })() : `
      <section class="calendar-empty-feature glass">
        <span class="calendar-empty-icon">◷</span>
        <h2>No tienes eventos próximos</h2>
        <p>Cuando se programe una nueva sesión aparecerá aquí automáticamente.</p>
      </section>`}

    <section class="calendar-layout">
      <div class="calendar-events-panel">
        <div class="calendar-toolbar glass">
          <div>
            <span class="eyebrow">Agenda</span>
            <h2>Todos los eventos</h2>
          </div>
          <div class="calendar-filter-tabs" role="tablist" aria-label="Filtrar eventos">
            <button class="calendar-filter active" type="button" data-calendar-filter="all">Todos</button>
            <button class="calendar-filter" type="button" data-calendar-filter="upcoming">Próximos</button>
            <button class="calendar-filter" type="button" data-calendar-filter="past">Finalizados</button>
          </div>
        </div>

        <div class="calendar-event-list" id="calendar-event-list">
          ${sortedEvents.length ? sortedEvents.map(renderEventCard).join('') : `
            <article class="calendar-empty-list glass">
              <span>▣</span>
              <h3>Aún no hay eventos registrados</h3>
              <p>Las nuevas fechas de cursos y webinars aparecerán en esta sección.</p>
            </article>`}
        </div>

        <article class="calendar-no-results glass hide" id="calendar-no-results">
          <h3>No hay eventos en esta categoría</h3>
          <p>Selecciona otro filtro para consultar el resto de la agenda.</p>
        </article>
      </div>

      <aside class="calendar-sidebar">
        <article class="calendar-month-card glass">
          <div class="calendar-month-heading">
            <div>
              <span class="eyebrow">Vista mensual</span>
              <h2>${escapeHtml(monthName.charAt(0).toUpperCase() + monthName.slice(1))}</h2>
            </div>
            <span class="calendar-month-count">${eventDays.size} ${eventDays.size === 1 ? 'fecha' : 'fechas'}</span>
          </div>

          <div class="calendar-grid" aria-label="Calendario de ${escapeHtml(monthName)}">
            ${['L','M','M','J','V','S','D'].map(day => `<small>${day}</small>`).join('')}
            ${Array.from({ length: firstWeekday }, () => '<span class="calendar-day empty"></span>').join('')}
            ${Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const isToday = now.getFullYear() === calendarYear && now.getMonth() === calendarMonth && now.getDate() === day;
              const hasEvent = eventDays.has(day);
              return `<span class="calendar-day ${hasEvent ? 'has-event' : ''} ${isToday ? 'is-today' : ''}">${day}</span>`;
            }).join('')}
          </div>
          <div class="calendar-legend"><span><i></i> Evento programado</span></div>
        </article>

        <article class="calendar-info-card glass">
          <span class="calendar-info-icon">◎</span>
          <div>
            <strong>Zona horaria</strong>
            <p>Los horarios se muestran con la hora de Guadalajara, México.</p>
          </div>
        </article>

        <article class="calendar-info-card glass">
          <span class="calendar-info-icon">?</span>
          <div>
            <strong>¿Necesitas ayuda?</strong>
            <p>Escríbenos si compraste un programa y todavía no recibes el enlace.</p>
            <a href="${whatsappUrl('Hola, necesito ayuda con un evento de Aula Compás.')}" target="_blank" rel="noopener">Contactar soporte →</a>
          </div>
        </article>
      </aside>
    </section>`;

  document.querySelectorAll('[data-calendar-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.calendarFilter;
      document.querySelectorAll('[data-calendar-filter]').forEach(item => item.classList.toggle('active', item === button));
      let visible = 0;
      document.querySelectorAll('[data-calendar-event]').forEach(card => {
        const show = filter === 'all' || card.dataset.calendarEvent === filter;
        card.classList.toggle('hide', !show);
        if (show) visible += 1;
      });
      document.querySelector('#calendar-no-results')?.classList.toggle('hide', visible > 0 || sortedEvents.length === 0);
    });
  });

  document.querySelector('#copy-next-event')?.addEventListener('click', async () => {
    if (!nextEvent) return;
    const info = formatEventDate(nextEvent.date);
    const textToCopy = `${nextEvent.title} · ${info.full} · ${info.time} · Hora de Guadalajara`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Fecha copiada correctamente.');
    } catch {
      showToast('No pudimos copiar la fecha.', 'error');
    }
  });
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

function certificateStatus(course) {
  const lessons = allLessons(course);
  const progress = lessons.length ? courseProgress(course) : 0;
  const completedLessons = lessons.filter(lesson => state.progress[lesson.id]).length;
  return { lessons: lessons.length, progress, completedLessons, isComplete: lessons.length > 0 && progress === 100 };
}

function renderCertificates() {
  const page = document.querySelector('#page');
  const courseSummaries = state.courses
    .map(course => ({ course, ...certificateStatus(course) }))
    .filter(item => item.lessons > 0);
  const completed = courseSummaries.filter(item => item.isComplete);
  const pending = courseSummaries.filter(item => !item.isComplete).sort((a, b) => b.progress - a.progress);
  const nextCertificate = pending[0] || null;

  page.innerHTML = `
    <section class="certificates-page-heading">
      <div>
        <span class="eyebrow">Reconoce tu constancia</span>
        <h1 class="page-title">Mis certificados</h1>
        <p class="page-subtitle">Consulta los reconocimientos obtenidos y revisa cuánto te falta para desbloquear el siguiente.</p>
      </div>
      <div class="certificates-summary" aria-label="Resumen de certificados">
        <article><strong>${completed.length}</strong><span>Disponibles</span></article>
        <article><strong>${pending.length}</strong><span>En proceso</span></article>
      </div>
    </section>

    ${completed.length ? `
      <section class="certificate-featured">
        <div class="certificate-featured-copy">
          <span class="eyebrow">Logro más reciente</span>
          <h2>${escapeHtml(completed[0].course.title)}</h2>
          <p>Tu constancia ya está disponible. Puedes abrirla, imprimirla o guardarla como PDF desde cualquier dispositivo.</p>
          <div class="certificate-featured-actions">
            <a class="btn btn-primary" href="#certificate/${completed[0].course.id}">Ver certificado</a>
            <a class="btn btn-secondary" href="#courses">Seguir aprendiendo</a>
          </div>
        </div>
        <div class="certificate-featured-preview" aria-hidden="true">
          <div class="certificate-mini-document">
            <img src="logo-completo-oficial.png" alt="">
            <span>CONSTANCIA</span>
            <strong>${escapeHtml(displayName())}</strong>
            <small>${escapeHtml(completed[0].course.title)}</small>
            <i>PC</i>
          </div>
        </div>
      </section>` : nextCertificate ? `
      <section class="certificate-progress-hero glass">
        <div class="certificate-progress-icon">◇</div>
        <div class="certificate-progress-copy">
          <span class="eyebrow">Tu siguiente reconocimiento</span>
          <h2>${escapeHtml(nextCertificate.course.title)}</h2>
          <p>Has completado ${nextCertificate.completedLessons} de ${nextCertificate.lessons} lecciones. Continúa hasta alcanzar el 100%.</p>
          <div class="certificate-progress-bar"><span style="width:${nextCertificate.progress}%"></span></div>
          <small>${nextCertificate.progress}% completado</small>
        </div>
        <a class="btn btn-primary" href="#course/${nextCertificate.course.id}">Continuar curso</a>
      </section>` : `
      <section class="certificate-empty-hero glass">
        <div class="certificate-empty-icon">◇</div>
        <span class="eyebrow">Tu próximo logro comienza aquí</span>
        <h2>Aún no tienes cursos con certificado</h2>
        <p>Cuando tengas acceso a un programa con lecciones, podrás consultar aquí tu avance y tus reconocimientos.</p>
        <a class="btn btn-primary" href="#catalog">Explorar cursos</a>
      </section>`}

    ${completed.length ? `
      <section class="certificates-section">
        <div class="section-heading certificates-section-heading">
          <div><span class="eyebrow">Reconocimientos obtenidos</span><h2>Certificados disponibles</h2></div>
          <span>${completed.length} ${completed.length === 1 ? 'certificado' : 'certificados'}</span>
        </div>
        <div class="certificates-grid-professional">
          ${completed.map(({ course }) => `
            <article class="certificate-achievement-card glass">
              <div class="certificate-achievement-cover">
                <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event, 'curso-compas.webp')">
                <span>Completado</span>
              </div>
              <div class="certificate-achievement-body">
                <span class="eyebrow">Constancia digital</span>
                <h3>${escapeHtml(course.title)}</h3>
                <p>Emitida para ${escapeHtml(displayName())} al completar todas las lecciones.</p>
                <div class="certificate-achievement-actions">
                  <a class="btn btn-primary" href="#certificate/${course.id}">Abrir certificado</a>
                  <a class="certificate-text-link" href="#course/${course.id}">Ver curso →</a>
                </div>
              </div>
            </article>`).join('')}
        </div>
      </section>` : ''}

    ${pending.length ? `
      <section class="certificates-section certificates-pending-section">
        <div class="section-heading certificates-section-heading">
          <div><span class="eyebrow">Sigue avanzando</span><h2>Certificados en proceso</h2></div>
          <span>${pending.length} ${pending.length === 1 ? 'programa' : 'programas'}</span>
        </div>
        <div class="certificate-pending-list">
          ${pending.map(({ course, progress, completedLessons, lessons }) => `
            <article class="certificate-pending-card glass">
              <img src="${escapeHtml(cover(course))}" alt="${escapeHtml(course.title)}" onerror="imageErrorFallback(event, 'curso-compas.webp')">
              <div class="certificate-pending-copy">
                <div class="certificate-pending-topline"><span>${progress === 0 ? 'No iniciado' : 'En progreso'}</span><strong>${progress}%</strong></div>
                <h3>${escapeHtml(course.title)}</h3>
                <p>${completedLessons} de ${lessons} lecciones completadas</p>
                <div class="certificate-progress-bar"><span style="width:${progress}%"></span></div>
              </div>
              <a class="btn btn-secondary" href="#course/${course.id}">${progress === 0 ? 'Comenzar' : 'Continuar'}</a>
            </article>`).join('')}
        </div>
      </section>` : ''}

    <section class="certificate-info-note">
      <span>i</span>
      <div><strong>¿Cómo se habilita un certificado?</strong><p>Se genera automáticamente cuando completas el 100% de las lecciones de un curso. Después podrás imprimirlo o guardarlo en PDF.</p></div>
      <a href="#help">Ver ayuda</a>
    </section>`;
}

function renderCertificate(courseId) {
  const page = document.querySelector('#page');
  const course = findCourse(courseId);
  const status = course ? certificateStatus(course) : null;
  if (!course || !status?.isComplete) return renderCertificates();

  const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const credentialCode = `PC-${String(course.id).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}-${String(state.user?.id || 'ALUMNO').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`;

  page.innerHTML = `
    <section class="certificate-view-heading">
      <div>
        <a class="back-link" href="#certificates">← Volver a mis certificados</a>
        <span class="eyebrow">Constancia digital</span>
        <h1 class="page-title">${escapeHtml(course.title)}</h1>
        <p class="page-subtitle">Revisa tu reconocimiento y guárdalo en formato PDF.</p>
      </div>
      <div class="certificate-actions">
        <button class="btn btn-secondary" id="copy-certificate-code" type="button">Copiar folio</button>
        <button class="btn btn-primary" id="print-certificate" type="button">Imprimir o guardar PDF</button>
      </div>
    </section>

    <section class="certificate-document-wrap">
      <div class="certificate-document" id="certificate-document">
        <div class="certificate-border certificate-border-outer"></div>
        <div class="certificate-border certificate-border-inner"></div>
        <div class="certificate-corner top-left">✦</div>
        <div class="certificate-corner top-right">✦</div>
        <div class="certificate-corner bottom-left">✦</div>
        <div class="certificate-corner bottom-right">✦</div>

        <img class="certificate-logo" src="logo-completo-oficial.png" alt="Proyecto Compás">
        <span class="certificate-kicker">CONSTANCIA DE FINALIZACIÓN</span>
        <p class="certificate-intro">Proyecto Compás reconoce a</p>
        <h1>${escapeHtml(displayName())}</h1>
        <div class="certificate-name-line"></div>
        <p class="certificate-course-intro">por haber completado satisfactoriamente el programa</p>
        <h2>${escapeHtml(course.title)}</h2>
        <p class="certificate-description">Demostrando compromiso, constancia y dedicación durante su proceso de aprendizaje en Aula Compás.</p>

        <div class="certificate-footer-data">
          <div><span>${escapeHtml(date)}</span><small>Fecha de emisión</small></div>
          <div class="certificate-seal"><strong>PC</strong><small>PROYECTO<br>COMPÁS</small></div>
          <div><span>Rubén Martínez</span><small>Dirección · Proyecto Compás</small></div>
        </div>
        <small class="certificate-code">Folio: ${escapeHtml(credentialCode)} · Aula Compás</small>
      </div>
    </section>

    <section class="certificate-download-help glass">
      <span>⌄</span>
      <div><strong>Guardar como PDF</strong><p>Selecciona “Imprimir o guardar PDF” y, en la ventana de impresión, elige la opción “Guardar como PDF”.</p></div>
    </section>`;

  document.querySelector('#print-certificate')?.addEventListener('click', () => window.print());
  document.querySelector('#copy-certificate-code')?.addEventListener('click', async event => {
    try {
      await navigator.clipboard.writeText(credentialCode);
      const button = event.currentTarget;
      const original = button.textContent;
      button.textContent = 'Folio copiado';
      setTimeout(() => { button.textContent = original; }, 1800);
    } catch {
      window.prompt('Copia el folio de tu certificado:', credentialCode);
    }
  });
}

function renderProfile() {
  const page = document.querySelector('#page');
  const completedCourses = state.courses.filter(course => courseProgress(course) === 100).length;
  const completedLessons = state.progressRows.filter(row => row.completed).length;
  const totalLessons = state.courses.reduce((sum, course) => sum + allLessons(course).length, 0);
  const certificateCount = completedCourses;
  const profileComplete = Boolean(state.profile?.full_name?.trim()) && Boolean(state.profile?.avatar_url?.trim());
  const joinedAt = state.user?.created_at
    ? new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(state.user.created_at))
    : 'Aula Compás';
  const roleLabel = isAdmin() ? 'Administrador' : isInstructor() ? 'Instructor' : 'Alumno';
  const initial = displayName().trim().charAt(0).toUpperCase() || 'A';

  page.innerHTML = `
    <header class="profile-page-heading">
      <div>
        <span class="eyebrow">Mi cuenta</span>
        <h1 class="page-title">Mi perfil</h1>
        <p class="page-subtitle">Administra tus datos personales, accesos y preferencias de Aula Compás.</p>
      </div>
      <span class="profile-status-pill ${profileComplete ? 'complete' : ''}">
        ${profileComplete ? '✓ Perfil completo' : '○ Completa tu perfil'}
      </span>
    </header>

    <section class="profile-professional-layout">
      <aside class="profile-identity-card glass">
        <div class="profile-cover-band"></div>
        <div class="profile-avatar-wrap">
          <img src="${escapeHtml(avatarUrl())}" alt="Fotografía de ${escapeHtml(displayName())}" onerror="imageErrorFallback(event, 'icono-oficial.png')">
          <span>${escapeHtml(initial)}</span>
        </div>
        <div class="profile-identity-copy">
          <span class="profile-role-badge">${escapeHtml(roleLabel)}</span>
          <h2>${escapeHtml(displayName())}</h2>
          <p>${escapeHtml(state.user.email)}</p>
          <small>Miembro desde ${escapeHtml(joinedAt)}</small>
        </div>

        <div class="profile-achievement-grid">
          <article><strong>${state.courses.length}</strong><span>Cursos</span></article>
          <article><strong>${completedLessons}</strong><span>Lecciones</span></article>
          <article><strong>${certificateCount}</strong><span>Certificados</span></article>
          <article><strong>${state.resources.length}</strong><span>Recursos</span></article>
        </div>

        <a class="btn btn-secondary profile-certificate-link" href="#certificates">Ver mis certificados</a>
      </aside>

      <div class="profile-main-column">
        <section class="profile-settings-panel glass">
          <div class="profile-section-heading">
            <div>
              <span class="eyebrow">Información personal</span>
              <h2>Datos de tu cuenta</h2>
            </div>
            <span class="profile-section-icon">✎</span>
          </div>

          <form id="profile-form" class="profile-form-modern">
            <div class="field">
              <label for="profile-name">Nombre completo</label>
              <input id="profile-name" name="fullName" value="${escapeHtml(state.profile?.full_name || '')}" placeholder="Escribe tu nombre completo" required>
              <small>Este nombre aparecerá en tus certificados.</small>
            </div>
            <div class="field">
              <label for="profile-email">Correo electrónico</label>
              <input id="profile-email" value="${escapeHtml(state.user.email)}" disabled>
              <small>Tu correo se utiliza para iniciar sesión.</small>
            </div>
            <div class="field profile-field-wide profile-photo-field">
              <label>Fotografía de perfil</label>
              <div class="profile-photo-control">
                <img id="profile-photo-preview" src="${escapeHtml(avatarUrl())}" alt="Vista previa de la fotografía" onerror="imageErrorFallback(event, 'icono-oficial.png')">
                <div>
                  <strong>Elige una fotografía</strong>
                  <small>JPG, PNG o WebP · máximo 2 MB. Se recortará a 600 × 600 px.</small>
                  <button class="btn btn-secondary profile-photo-button" id="choose-avatar-button" type="button">Cambiar fotografía</button>
                  <input id="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>
                </div>
              </div>
            </div>
            <div class="profile-form-actions profile-field-wide">
              <span>Los cambios se reflejarán en todo el aula.</span>
              <button class="btn btn-primary" type="submit">Guardar cambios</button>
            </div>
          </form>
        </section>

        <section class="profile-progress-panel glass">
          <div class="profile-section-heading">
            <div>
              <span class="eyebrow">Actividad académica</span>
              <h2>Tu avance en Aula Compás</h2>
            </div>
            <a href="#courses">Ver cursos</a>
          </div>
          <div class="profile-progress-summary">
            <div class="profile-progress-ring" style="--value:${totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}">
              <strong>${totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}%</strong>
            </div>
            <div>
              <h3>${completedLessons} de ${totalLessons} lecciones completadas</h3>
              <p>${completedCourses ? `Has finalizado ${completedCourses} ${completedCourses === 1 ? 'curso' : 'cursos'}.` : 'Tu progreso comenzará cuando completes tu primera lección.'}</p>
              <div class="profile-linear-progress"><span style="width:${totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0}%"></span></div>
            </div>
          </div>
        </section>

        <section class="profile-options-grid">
          <article class="profile-option-card glass">
            <span class="profile-option-icon">▣</span>
            <div><h3>Instalar Aula Compás</h3><p>Accede desde tu pantalla de inicio como una aplicación.</p></div>
            <button class="profile-option-action" data-install type="button">Instalar</button>
          </article>
          <article class="profile-option-card glass">
            <span class="profile-option-icon">?</span>
            <div><h3>Centro de ayuda</h3><p>Resuelve dudas sobre accesos, compras y materiales.</p></div>
            <a class="profile-option-action" href="#help">Abrir</a>
          </article>
          ${canManageContent() ? `
          <article class="profile-option-card glass">
            <span class="profile-option-icon">⚙</span>
            <div><h3>Panel de contenidos</h3><p>Gestiona cursos, módulos y recursos autorizados.</p></div>
            <a class="profile-option-action" href="#admin">Abrir</a>
          </article>` : ''}
          <article class="profile-option-card glass profile-option-danger">
            <span class="profile-option-icon">↪</span>
            <div><h3>Cerrar sesión</h3><p>Finaliza la sesión de manera segura en este dispositivo.</p></div>
            <button class="profile-option-action" id="logout-button" type="button">Salir</button>
          </article>
        </section>
      </div>
    </section>`;

  document.querySelector('#profile-form')?.addEventListener('submit', updateProfile);
  document.querySelector('#choose-avatar-button')?.addEventListener('click', () => document.querySelector('#avatar-file-input')?.click());
  document.querySelector('#avatar-file-input')?.addEventListener('change', handleAvatarSelection);
  document.querySelector('#logout-button')?.addEventListener('click', logout);
  document.querySelectorAll('[data-install]').forEach(button => button.addEventListener('click', installApp));
}


const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_OUTPUT_SIZE = 600;
let avatarEditorState = null;

function handleAvatarSelection(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
    showToast('Solo puedes subir imágenes JPG, PNG o WebP.', 'error');
    return;
  }
  if (file.size > AVATAR_MAX_BYTES) {
    showToast('La fotografía no debe superar los 2 MB.', 'error');
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    openAvatarEditor(image, objectUrl);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    showToast('No se pudo leer la imagen seleccionada.', 'error');
  };
  image.src = objectUrl;
}

function openAvatarEditor(image, objectUrl) {
  closeAvatarEditor();
  avatarEditorState = {
    image,
    objectUrl,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  };

  document.body.insertAdjacentHTML('beforeend', `
    <div class="avatar-editor-backdrop" id="avatar-editor" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
      <section class="avatar-editor-card glass">
        <header>
          <div><span class="eyebrow">Mi perfil</span><h2 id="avatar-editor-title">Ajustar fotografía</h2></div>
          <button class="avatar-editor-close" id="avatar-editor-close" type="button" aria-label="Cerrar">×</button>
        </header>
        <p>Arrastra la imagen para centrarla y utiliza el control para acercar o alejar.</p>
        <div class="avatar-crop-stage" id="avatar-crop-stage">
          <canvas id="avatar-crop-canvas" width="600" height="600"></canvas>
          <span class="avatar-crop-ring" aria-hidden="true"></span>
        </div>
        <label class="avatar-zoom-control" for="avatar-zoom">
          <span>Zoom</span>
          <input id="avatar-zoom" type="range" min="1" max="3" step="0.01" value="1">
        </label>
        <div class="avatar-upload-progress hide" id="avatar-upload-progress">
          <div><span>Subiendo fotografía…</span><strong id="avatar-progress-label">0%</strong></div>
          <div class="avatar-progress-track"><span id="avatar-progress-bar"></span></div>
        </div>
        <footer>
          <button class="btn btn-secondary" id="avatar-cancel" type="button">Cancelar</button>
          <button class="btn btn-primary" id="avatar-save" type="button">Guardar fotografía</button>
        </footer>
      </section>
    </div>`);

  document.body.classList.add('modal-open');
  const stage = document.querySelector('#avatar-crop-stage');
  const zoom = document.querySelector('#avatar-zoom');
  document.querySelector('#avatar-editor-close')?.addEventListener('click', closeAvatarEditor);
  document.querySelector('#avatar-cancel')?.addEventListener('click', closeAvatarEditor);
  document.querySelector('#avatar-save')?.addEventListener('click', saveAvatarImage);
  document.querySelector('#avatar-editor')?.addEventListener('click', event => {
    if (event.target.id === 'avatar-editor') closeAvatarEditor();
  });
  zoom?.addEventListener('input', event => {
    avatarEditorState.zoom = Number(event.target.value);
    clampAvatarOffsets();
    drawAvatarCrop();
  });
  stage?.addEventListener('pointerdown', startAvatarDrag);
  stage?.addEventListener('pointermove', moveAvatarDrag);
  stage?.addEventListener('pointerup', endAvatarDrag);
  stage?.addEventListener('pointercancel', endAvatarDrag);
  drawAvatarCrop();
}

function avatarDrawMetrics() {
  const { image, zoom, offsetX, offsetY } = avatarEditorState;
  const canvasSize = AVATAR_OUTPUT_SIZE;
  const baseScale = Math.max(canvasSize / image.naturalWidth, canvasSize / image.naturalHeight);
  const scale = baseScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  return {
    width,
    height,
    x: (canvasSize - width) / 2 + offsetX,
    y: (canvasSize - height) / 2 + offsetY
  };
}

function clampAvatarOffsets() {
  if (!avatarEditorState) return;
  const { image, zoom } = avatarEditorState;
  const baseScale = Math.max(AVATAR_OUTPUT_SIZE / image.naturalWidth, AVATAR_OUTPUT_SIZE / image.naturalHeight);
  const width = image.naturalWidth * baseScale * zoom;
  const height = image.naturalHeight * baseScale * zoom;
  const maxX = Math.max(0, (width - AVATAR_OUTPUT_SIZE) / 2);
  const maxY = Math.max(0, (height - AVATAR_OUTPUT_SIZE) / 2);
  avatarEditorState.offsetX = Math.max(-maxX, Math.min(maxX, avatarEditorState.offsetX));
  avatarEditorState.offsetY = Math.max(-maxY, Math.min(maxY, avatarEditorState.offsetY));
}

function drawAvatarCrop() {
  if (!avatarEditorState) return;
  const canvas = document.querySelector('#avatar-crop-canvas');
  const context = canvas?.getContext('2d');
  if (!context) return;
  const metrics = avatarDrawMetrics();
  context.clearRect(0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE);
  context.drawImage(avatarEditorState.image, metrics.x, metrics.y, metrics.width, metrics.height);
}

function startAvatarDrag(event) {
  if (!avatarEditorState) return;
  avatarEditorState.dragging = true;
  avatarEditorState.startX = event.clientX;
  avatarEditorState.startY = event.clientY;
  avatarEditorState.originX = avatarEditorState.offsetX;
  avatarEditorState.originY = avatarEditorState.offsetY;
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function moveAvatarDrag(event) {
  if (!avatarEditorState?.dragging) return;
  const stageRect = event.currentTarget.getBoundingClientRect();
  const ratio = AVATAR_OUTPUT_SIZE / stageRect.width;
  avatarEditorState.offsetX = avatarEditorState.originX + (event.clientX - avatarEditorState.startX) * ratio;
  avatarEditorState.offsetY = avatarEditorState.originY + (event.clientY - avatarEditorState.startY) * ratio;
  clampAvatarOffsets();
  drawAvatarCrop();
}

function endAvatarDrag(event) {
  if (!avatarEditorState) return;
  avatarEditorState.dragging = false;
  event.currentTarget.releasePointerCapture?.(event.pointerId);
}

function canvasToWebpBlob(canvas, quality = 0.86) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No se pudo procesar la fotografía.')), 'image/webp', quality);
  });
}

function setAvatarProgress(value) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));
  const label = document.querySelector('#avatar-progress-label');
  const bar = document.querySelector('#avatar-progress-bar');
  if (label) label.textContent = `${normalized}%`;
  if (bar) bar.style.width = `${normalized}%`;
}

async function saveAvatarImage() {
  if (!avatarEditorState || !state.user) return;
  const saveButton = document.querySelector('#avatar-save');
  const cancelButton = document.querySelector('#avatar-cancel');
  const progress = document.querySelector('#avatar-upload-progress');
  const canvas = document.querySelector('#avatar-crop-canvas');
  saveButton.disabled = true;
  cancelButton.disabled = true;
  progress?.classList.remove('hide');
  setAvatarProgress(15);

  try {
    const blob = await canvasToWebpBlob(canvas);
    setAvatarProgress(35);
    const filePath = `${state.user.id}/avatar.webp`;
    const { error: uploadError } = await db.storage
      .from('avatars')
      .upload(filePath, blob, { contentType: 'image/webp', upsert: true, cacheControl: '3600' });
    if (uploadError) throw uploadError;

    setAvatarProgress(75);
    const { data: publicData } = db.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', state.user.id)
      .select()
      .single();
    if (profileError) throw profileError;

    setAvatarProgress(100);
    state.profile = profile;
    const preview = document.querySelector('#profile-photo-preview');
    if (preview) preview.src = publicUrl;
    await new Promise(resolve => setTimeout(resolve, 250));
    closeAvatarEditor();
    showToast('Fotografía actualizada correctamente.', 'success');
    route();
  } catch (error) {
    console.error('Avatar upload error:', error);
    showToast(error?.message?.includes('Bucket not found')
      ? 'Primero crea el bucket avatars en Supabase.'
      : 'No se pudo subir la fotografía. Revisa la configuración de Storage.', 'error');
    if (saveButton) saveButton.disabled = false;
    if (cancelButton) cancelButton.disabled = false;
  }
}

function closeAvatarEditor() {
  document.querySelector('#avatar-editor')?.remove();
  document.body.classList.remove('modal-open');
  if (avatarEditorState?.objectUrl) URL.revokeObjectURL(avatarEditorState.objectUrl);
  avatarEditorState = null;
}

async function updateProfile(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);

  setFormBusy(event.currentTarget, true);

  const { data, error } = await db
    .from('profiles')
    .update({
      full_name: String(form.get('fullName')).trim()
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
  const managedCourses = state.courses || [];
  const publishedCourses = managedCourses.filter(course => course.status === 'published');
  const draftCourses = managedCourses.filter(course => course.status !== 'published');
  const totalModules = managedCourses.reduce((sum, course) => sum + (course.modules?.length || 0), 0);
  const totalLessons = managedCourses.reduce((sum, course) =>
    sum + (course.modules || []).reduce((moduleSum, module) => moduleSum + (module.lessons?.length || 0), 0), 0);
  const activeEnrollments = isAdmin()
    ? state.enrollments.filter(row => row.status !== 'cancelled')
    : [];

  const courseOptions = managedCourses.map(course =>
    `<option value="${course.id}">${escapeHtml(course.title)}</option>`
  ).join('');

  const studentOptions = state.profiles
    .filter(profile => profile.role === 'student')
    .map(profile => `<option value="${profile.id}">${escapeHtml(profile.full_name || profile.email)}</option>`)
    .join('');

  const courseCards = managedCourses.length
    ? managedCourses.map(course => {
        const moduleCount = course.modules?.length || 0;
        const lessonCount = (course.modules || []).reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
        const enrollmentCount = isAdmin()
          ? activeEnrollments.filter(row => row.course_id === course.id).length
          : null;
        const isPublished = course.status === 'published';
        return `
          <article class="instructor-course-card">
            <div class="instructor-course-cover">
              <img src="${escapeHtml(cover(course))}" alt="Portada de ${escapeHtml(course.title)}" onerror="imageErrorFallback(event, 'curso-compas.webp')">
              <span class="status-pill ${isPublished ? 'available' : ''}">${isPublished ? 'Publicado' : 'Borrador'}</span>
            </div>
            <div class="instructor-course-body">
              <span class="instructor-course-category">${escapeHtml(course.category || 'Formación')}</span>
              <h3>${escapeHtml(course.title)}</h3>
              <p>${escapeHtml(course.subtitle || course.description || 'Curso de Aula Compás')}</p>
              <div class="instructor-course-metrics">
                <span><strong>${moduleCount}</strong> módulos</span>
                <span><strong>${lessonCount}</strong> lecciones</span>
                ${isAdmin() ? `<span><strong>${enrollmentCount}</strong> alumnos</span>` : ''}
              </div>
              <div class="instructor-course-actions">
                <button class="btn btn-primary" type="button" data-admin-scroll="admin-content" data-select-course="${escapeHtml(course.id)}">Administrar contenido</button>
                ${isAdmin() ? `<button class="btn btn-secondary" type="button" data-admin-scroll="admin-users">Ver alumnos</button>` : ''}
                <button class="btn btn-secondary" type="button" data-course-status="${escapeHtml(course.id)}" data-next-status="${isPublished ? 'draft' : 'published'}">${isPublished ? 'Pasar a borrador' : 'Publicar'}</button>
                ${course.cover_path ? `<button class="btn btn-secondary" type="button" data-remove-course-cover="${escapeHtml(course.id)}">Quitar portada</button>` : ''}
                <button class="btn btn-danger" type="button" data-delete-course="${escapeHtml(course.id)}">Eliminar curso</button>
              </div>
            </div>
          </article>`;
      }).join('')
    : `
      <div class="instructor-empty-state">
        <span>＋</span>
        <h3>Aún no tienes cursos</h3>
        <p>Crea tu primer curso y después agrega módulos, lecciones y recursos.</p>
        <button class="btn btn-primary" type="button" data-admin-scroll="create-course-panel">Crear mi primer curso</button>
      </div>`;

  page.innerHTML = `
    <section class="instructor-hero">
      <div>
        <span class="eyebrow">${isAdmin() ? 'Administración general' : 'Espacio del instructor'}</span>
        <h1>${isAdmin() ? 'Panel de Aula Compás' : 'Panel del instructor'}</h1>
        <p>${isAdmin()
          ? 'Supervisa cursos, usuarios, inscripciones y contenidos desde un solo lugar.'
          : 'Organiza tus cursos y prepara experiencias de aprendizaje claras para tus alumnos.'}</p>
      </div>
      <button class="btn btn-primary" type="button" data-admin-scroll="create-course-panel">＋ Crear curso</button>
    </section>

    <section class="instructor-summary-grid">
      <article class="instructor-summary-card">
        <span class="summary-icon">▤</span>
        <div><strong>${managedCourses.length}</strong><span>${isAdmin() ? 'Cursos administrados' : 'Mis cursos'}</span></div>
      </article>
      <article class="instructor-summary-card">
        <span class="summary-icon">✓</span>
        <div><strong>${publishedCourses.length}</strong><span>Publicados</span></div>
      </article>
      <article class="instructor-summary-card">
        <span class="summary-icon">◷</span>
        <div><strong>${draftCourses.length}</strong><span>Borradores</span></div>
      </article>
      <article class="instructor-summary-card">
        <span class="summary-icon">${isAdmin() ? '◎' : '≡'}</span>
        <div><strong>${isAdmin() ? activeEnrollments.length : totalLessons}</strong><span>${isAdmin() ? 'Inscripciones activas' : 'Lecciones creadas'}</span></div>
      </article>
    </section>

    <section class="instructor-quick-actions">
      <div>
        <span class="eyebrow">Acciones rápidas</span>
        <h2>¿Qué deseas hacer hoy?</h2>
      </div>
      <div class="instructor-action-buttons">
        <button type="button" data-admin-scroll="create-course-panel"><span>＋</span>Crear curso</button>
        <button type="button" data-admin-scroll="admin-content"><span>▤</span>Agregar contenido</button>
        <button type="button" data-admin-scroll="admin-resources"><span>▧</span>Subir recurso</button>
        ${isAdmin() ? '<button type="button" data-admin-scroll="admin-users"><span>◎</span>Gestionar usuarios</button>' : ''}
      </div>
    </section>

    <section class="instructor-section" id="admin-courses">
      <div class="section-heading instructor-section-heading">
        <div><span class="eyebrow">Catálogo académico</span><h2>${isAdmin() ? 'Cursos de la plataforma' : 'Mis cursos'}</h2></div>
        <span class="section-count">${managedCourses.length} ${managedCourses.length === 1 ? 'curso' : 'cursos'}</span>
      </div>
      <div class="instructor-course-grid">${courseCards}</div>
    </section>

    <section class="instructor-workspace" id="create-course-panel">
      <div class="instructor-workspace-header">
        <div><span class="eyebrow">Constructor académico</span><h2>Crear y organizar contenido</h2></div>
        <p>Completa cada bloque en orden. No necesitas terminar todo el curso en una sola sesión.</p>
      </div>

      <div class="instructor-builder-grid">
        <article class="settings-card glass builder-card">
          <div class="builder-step"><span>1</span><div><strong>Crear curso</strong><small>Información general y publicación</small></div></div>
          <form id="course-form" class="stack-form">
            <div class="field"><label>Título</label><input name="title" required></div>
            <div class="field"><label>Subtítulo</label><input name="subtitle"></div>
            <div class="field"><label>Descripción</label><textarea name="description" rows="3"></textarea></div>
            <div class="field"><label>Categoría</label><input name="category" value="Formación"></div>
            <div class="field">
              <label>Imagen de portada del curso</label>
              <input name="coverFile" type="file" accept="image/jpeg,image/png,image/webp">
              <small>JPG, PNG o WebP · máximo 5 MB. Recomendado: 1600 × 900 px.</small>
            </div>
            <div class="field"><label>Ruta de portada opcional</label><input name="coverUrl" placeholder="curso-compas.webp o https://..."></div>
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

        <article class="settings-card glass builder-card">
          <div class="builder-step"><span>2</span><div><strong>Agregar módulo</strong><small>Divide el curso en etapas claras</small></div></div>
          <form id="module-form" class="stack-form">
            <div class="field"><label>Curso</label><select name="courseId" required>${courseOptions || '<option value="">Primero crea un curso</option>'}</select></div>
            <div class="field"><label>Título del módulo</label><input name="title" required></div>
            <div class="field"><label>Posición</label><input name="position" type="number" min="1" value="1"></div>
            <button class="btn btn-primary" ${!courseOptions ? 'disabled' : ''}>Agregar módulo</button>
          </form>
        </article>

        ${isAdmin() ? `<article class="settings-card glass builder-card">
          <div class="builder-step"><span>3</span><div><strong>Asignar curso</strong><small>Concede acceso a un alumno</small></div></div>
          <form id="enrollment-form" class="stack-form">
            <div class="field"><label>Alumno</label><select name="userId" required>${studentOptions || '<option value="">No hay alumnos registrados</option>'}</select></div>
            <div class="field"><label>Curso</label><select name="courseId" required>${courseOptions || '<option value="">No hay cursos disponibles</option>'}</select></div>
            <button class="btn btn-primary" ${!studentOptions || !courseOptions ? 'disabled' : ''}>Asignar acceso</button>
          </form>
        </article>` : ''}
      </div>
    </section>

    <section class="settings-card glass instructor-content-panel" id="admin-content">
      <div class="builder-step"><span>${isAdmin() ? '4' : '3'}</span><div><strong>Agregar lección</strong><small>Incorpora video, duración y contenido a un módulo</small></div></div>
      <form id="lesson-form" class="admin-form admin-form-wide">
        <select name="moduleId" required>
          ${managedCourses.flatMap(course => course.modules.map(module =>
            `<option value="${module.id}" data-course-id="${course.id}">${escapeHtml(course.title)} — ${escapeHtml(module.title)}</option>`
          )).join('') || '<option value="">Primero crea un módulo</option>'}
        </select>
        <input name="title" placeholder="Título de la lección" required>
        <input name="videoUrl" placeholder="URL incrustable de video">
        <input name="duration" type="number" min="0" value="10" placeholder="Minutos">
        <button class="btn btn-primary" ${totalModules === 0 ? 'disabled' : ''}>Agregar</button>
      </form>
    </section>

    <section class="settings-card glass instructor-content-panel" id="admin-resources">
      <div class="builder-step"><span>${isAdmin() ? '5' : '4'}</span><div><strong>Agregar libro o recurso</strong><small>Entrega materiales privados a tus alumnos</small></div></div>
      <p class="page-subtitle">El archivo se guarda en un depósito privado y solo lo abren las personas autorizadas.</p>
      <form id="resource-form" class="admin-form admin-resource-form">
        <select name="courseId"><option value="">Recurso general</option>${courseOptions}</select>
        <input name="title" placeholder="Título del recurso" required>
        <select name="resourceType" required><option value="book">Libro digital</option><option value="pdf">PDF</option><option value="template">Plantilla</option><option value="audio">Audio</option><option value="link">Enlace</option></select>
        <input name="externalUrl" type="url" placeholder="Enlace externo opcional">
        <label class="file-field"><span>Portada del libro o manual</span><input name="thumbnailFile" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <small class="field-help">JPG, PNG o WebP · máximo 5 MB. Recomendado para libros: 1200 × 1800 px.</small>
        <label class="file-field"><span>Archivo privado</span><input name="file" type="file" accept=".html,.htm,.pdf,.epub,.zip,.mp3,.m4a,.wav"></label>
        <button class="btn btn-primary">Guardar recurso</button>
      </form>
      <div class="demo-note">Para un libro digital usa el archivo HTML autocontenido. No lo subas al repositorio público.</div>
    </section>

    <section class="settings-card glass instructor-content-panel" id="admin-resource-list">
      <div class="section-heading"><div><span class="eyebrow">Biblioteca administrada</span><h2>Libros, manuales y recursos</h2></div><span class="section-count">${state.resources.length} recursos</span></div>
      <div class="admin-resource-grid">
        ${state.resources.length ? state.resources.map(resource => `
          <article class="admin-resource-card">
            <img src="${escapeHtml(normalizeMediaUrl(resource.thumbnail_url, resource.resource_type === 'book' ? 'recurso-cuentos.webp' : 'recurso-manual.webp'))}" alt="Portada de ${escapeHtml(resource.title)}" onerror="imageErrorFallback(event, 'recurso-manual.webp')">
            <div>
              <span class="status-pill">${escapeHtml(resource.resource_type || 'recurso')}</span>
              <h3>${escapeHtml(resource.title)}</h3>
              <p>${escapeHtml(managedCourses.find(course => course.id === resource.course_id)?.title || 'Recurso general')}</p>
              <div class="instructor-course-actions">
                ${resource.thumbnail_path ? `<button class="btn btn-secondary" type="button" data-remove-resource-cover="${escapeHtml(resource.id)}">Quitar portada</button>` : ''}
                <button class="btn btn-danger" type="button" data-delete-resource="${escapeHtml(resource.id)}">Eliminar recurso</button>
              </div>
            </div>
          </article>
        `).join('') : '<div class="instructor-empty-state"><span>▧</span><h3>Aún no hay recursos</h3><p>Sube un libro, manual, PDF o material de apoyo.</p></div>'}
      </div>
    </section>

    ${isAdmin() ? `<section class="settings-card glass instructor-content-panel" id="admin-users">
      <div class="section-heading"><div><span class="eyebrow">Comunidad</span><h2>Usuarios e inscripciones</h2></div></div>
      <div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Cursos asignados</th></tr></thead>
        <tbody>${state.profiles.map(profile => {
          const assigned = state.enrollments.filter(row => row.user_id === profile.id && row.status !== 'cancelled').map(row => managedCourses.find(course => course.id === row.course_id)?.title).filter(Boolean);
          return `<tr><td>${escapeHtml(profile.full_name || 'Sin nombre')}</td><td>${escapeHtml(profile.email || '')}</td><td><select data-role-user="${escapeHtml(profile.id)}" ${profile.id === state.user.id ? 'disabled' : ''}><option value="student" ${profile.role === 'student' ? 'selected' : ''}>Alumno</option><option value="instructor" ${profile.role === 'instructor' ? 'selected' : ''}>Instructor</option><option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>Administrador</option></select></td><td>${escapeHtml(assigned.join(', ') || 'Ninguno')}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>` : ''}`;

  document.querySelector('#course-form')?.addEventListener('submit', createCourse);
  document.querySelector('#module-form')?.addEventListener('submit', createModule);
  document.querySelector('#lesson-form')?.addEventListener('submit', createLesson);
  document.querySelector('#resource-form')?.addEventListener('submit', createResource);
  document.querySelector('#enrollment-form')?.addEventListener('submit', assignCourse);
  document.querySelectorAll('[data-course-status]').forEach(button =>
    button.addEventListener('click', () => setCourseStatus(button.dataset.courseStatus, button.dataset.nextStatus))
  );
  document.querySelectorAll('[data-delete-course]').forEach(button =>
    button.addEventListener('click', () => deleteCourse(button.dataset.deleteCourse))
  );
  document.querySelectorAll('[data-remove-course-cover]').forEach(button =>
    button.addEventListener('click', () => removeCourseCover(button.dataset.removeCourseCover))
  );
  document.querySelectorAll('[data-delete-resource]').forEach(button =>
    button.addEventListener('click', () => deleteResource(button.dataset.deleteResource))
  );
  document.querySelectorAll('[data-remove-resource-cover]').forEach(button =>
    button.addEventListener('click', () => removeResourceCover(button.dataset.removeResourceCover))
  );
  document.querySelectorAll('[data-role-user]').forEach(select =>
    select.addEventListener('change', () => updateUserRole(select.dataset.roleUser, select.value))
  );
  document.querySelectorAll('[data-admin-scroll]').forEach(button =>
    button.addEventListener('click', () => {
      const target = document.querySelector(`#${button.dataset.adminScroll}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (button.dataset.selectCourse) {
        const moduleCourseSelect = document.querySelector('#module-form select[name="courseId"]');
        const resourceCourseSelect = document.querySelector('#resource-form select[name="courseId"]');
        if (moduleCourseSelect) moduleCourseSelect.value = button.dataset.selectCourse;
        if (resourceCourseSelect) resourceCourseSelect.value = button.dataset.selectCourse;
        const lessonSelect = document.querySelector('#lesson-form select[name="moduleId"]');
        const matchingOption = lessonSelect ? [...lessonSelect.options].find(option => option.dataset.courseId === button.dataset.selectCourse) : null;
        if (matchingOption) lessonSelect.value = matchingOption.value;
      }
    })
  );
}

async function createCourse(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const coverFile = form.get('coverFile');
  setFormBusy(formElement, true);

  let courseId = null;
  let uploadedCover = null;

  try {
    if (coverFile?.size) validateCoverImage(coverFile);
    const title = String(form.get('title')).trim();
    const { data: course, error } = await db.from('courses').insert({
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
    }).select().single();
    if (error) throw error;
    courseId = course.id;

    if (coverFile?.size) {
      uploadedCover = await uploadCourseMedia(coverFile, 'courses', course.id);
      const { error: updateError } = await db.from('courses').update({
        cover_url: uploadedCover.publicUrl,
        cover_path: uploadedCover.path
      }).eq('id', course.id);
      if (updateError) throw updateError;
    }

    showToast('Curso creado correctamente.', 'success');
    formElement.reset();
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    console.error(error);
    if (uploadedCover?.path) await removeCourseMedia(uploadedCover.path).catch(() => {});
    if (courseId) await db.from('courses').delete().eq('id', courseId).catch(() => {});
    showToast(error.message || 'No se pudo crear el curso.', 'error');
  } finally {
    setFormBusy(formElement, false);
  }
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
  const thumbnailFile = form.get('thumbnailFile');
  const externalUrl = String(form.get('externalUrl') || '').trim();
  const courseId = String(form.get('courseId') || '').trim();

  if ((!file || !file.size) && !externalUrl) {
    showToast('Selecciona un archivo o agrega un enlace externo.', 'error');
    return;
  }

  setFormBusy(formElement, true);
  let filePath = null;
  let thumbnail = null;
  let resourceId = null;

  try {
    if (thumbnailFile?.size) validateCoverImage(thumbnailFile);
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

    if (thumbnailFile?.size) {
      thumbnail = await uploadCourseMedia(thumbnailFile, 'resources', courseId || state.user.id);
    }

    const { data: resource, error } = await db.from('resources').insert({
      course_id: courseId || null,
      title: String(form.get('title')).trim(),
      resource_type: String(form.get('resourceType')).trim(),
      external_url: externalUrl || null,
      file_path: filePath,
      thumbnail_url: thumbnail?.publicUrl || null,
      thumbnail_path: thumbnail?.path || null,
      is_public: false
    }).select().single();
    if (error) throw error;
    resourceId = resource.id;

    showToast('Recurso privado guardado.', 'success');
    formElement.reset();
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    console.error(error);
    if (filePath && !resourceId) await db.storage.from('digital-products').remove([filePath]).catch(() => {});
    if (thumbnail?.path && !resourceId) await removeCourseMedia(thumbnail.path).catch(() => {});
    showToast(error.message || 'No se pudo guardar el recurso.', 'error');
  } finally {
    setFormBusy(formElement, false);
  }
}

async function removeCourseCover(courseId) {
  const course = state.courses.find(item => item.id === courseId);
  if (!course?.cover_path) return;
  if (!confirm(`¿Quitar la portada de “${course.title}”?`)) return;
  try {
    await removeCourseMedia(course.cover_path);
    const { error } = await db.from('courses').update({ cover_url: 'curso-compas.webp', cover_path: null }).eq('id', courseId);
    if (error) throw error;
    showToast('Portada eliminada.', 'success');
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la portada.', 'error');
  }
}

async function removeResourceCover(resourceId) {
  const resource = state.resources.find(item => item.id === resourceId);
  if (!resource?.thumbnail_path) return;
  if (!confirm(`¿Quitar la portada de “${resource.title}”?`)) return;
  try {
    await removeCourseMedia(resource.thumbnail_path);
    const { error } = await db.from('resources').update({ thumbnail_url: null, thumbnail_path: null }).eq('id', resourceId);
    if (error) throw error;
    showToast('Portada eliminada.', 'success');
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    showToast(error.message || 'No se pudo eliminar la portada.', 'error');
  }
}

async function deleteResource(resourceId, skipConfirmation = false) {
  const resource = state.resources.find(item => item.id === resourceId);
  if (!resource) return;
  if (!skipConfirmation && !confirm(`¿Eliminar definitivamente “${resource.title}”? Esta acción no se puede deshacer.`)) return;
  try {
    if (resource.file_path) {
      const { error } = await db.storage.from('digital-products').remove([resource.file_path]);
      if (error) throw error;
    }
    if (resource.thumbnail_path) await removeCourseMedia(resource.thumbnail_path);
    const { error } = await db.from('resources').delete().eq('id', resourceId);
    if (error) throw error;
    if (!skipConfirmation) {
      showToast('Recurso eliminado.', 'success');
      await loadApplicationData();
      renderAdmin();
    }
  } catch (error) {
    if (!skipConfirmation) showToast(error.message || 'No se pudo eliminar el recurso.', 'error');
    else throw error;
  }
}

async function deleteCourse(courseId) {
  const course = state.courses.find(item => item.id === courseId);
  if (!course) return;
  const confirmation = prompt(`Para eliminar el curso escribe ELIMINAR:
${course.title}`);
  if (confirmation !== 'ELIMINAR') {
    if (confirmation !== null) showToast('El curso no fue eliminado.', 'error');
    return;
  }
  try {
    const relatedResources = state.resources.filter(item => item.course_id === courseId);
    for (const resource of relatedResources) await deleteResource(resource.id, true);
    if (course.cover_path) await removeCourseMedia(course.cover_path);
    const { error } = await db.rpc('delete_managed_course', { target_course: courseId });
    if (error) throw error;
    showToast('Curso eliminado definitivamente.', 'success');
    await loadApplicationData();
    renderAdmin();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'No se pudo eliminar el curso.', 'error');
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
