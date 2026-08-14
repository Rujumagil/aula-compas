const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const CONFIG = window.SUPABASE_CONFIG;

if (!window.supabase?.createClient || !CONFIG?.url || !CONFIG?.publishableKey) {
  app.innerHTML = `
    <main class="login-screen">
      <section class="login-card glass">
        <img class="official-lockup" src="compas-academia.svg" alt="Compás Academy">
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

function whatsappUrl(message = 'Hola, necesito información sobre Compás Academy.') {
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
  workspaces: [],
  workspaceMembers: [],
  products: [],
  productContents: [],
  studentAccess: [],
  accessHistory: [],
  orders: [],
  resourceAccess: [],
  activeWorkspaceId: null,
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
    title: 'Primeros pasos con Compás One',
    category: 'Compás One',
    image: 'compas-academia.svg',
    status: 'Disponible',
    description: 'Conoce el panel, el CRM, las conversaciones y la lógica de trabajo para comenzar a operar con orden.',
    meta: 'Ruta inicial · Nivel introductorio',
    action: 'Comenzar ruta'
  },
  {
    title: 'CRM y seguimiento comercial',
    category: 'Ventas',
    image: 'compas-academia.svg',
    status: 'En preparación',
    description: 'Aprende a convertir contactos en oportunidades con procesos claros, seguimiento y disciplina comercial.',
    meta: 'CRM · Pipeline · Seguimiento'
  },
  {
    title: 'Marketing digital con dirección',
    category: 'Marketing',
    image: 'compas-academia.svg',
    status: 'En preparación',
    description: 'Construye una estrategia de contenidos y campañas conectada con objetivos reales de negocio.',
    meta: 'Contenido · Campañas · Métricas'
  },
  {
    title: 'Meta Ads: de campaña a oportunidad',
    category: 'Meta Ads',
    image: 'compas-academia.svg',
    status: 'En preparación',
    description: 'Diseña campañas para captar prospectos y llevarlos a un proceso de seguimiento dentro de Compás One.',
    meta: 'Meta Ads · Leads · Conversión'
  },
  {
    title: 'IA aplicada a negocios',
    category: 'IA',
    image: 'compas-academia.svg',
    status: 'En preparación',
    description: 'Utiliza asistentes y agentes de IA con criterio, contexto y objetivos concretos para ahorrar tiempo y mejorar la atención.',
    meta: 'IA · Agentes · Productividad'
  },
  {
    title: 'Automatización para equipos pequeños',
    category: 'Automatización',
    image: 'compas-academia.svg',
    status: 'En preparación',
    description: 'Identifica tareas repetitivas y conviértelas en flujos simples, medibles y sostenibles.',
    meta: 'Procesos · Flujos · Operación'
  }
];

const ACADEMY_EVENTS = [];

const HELP_TOPICS = [
  ['¿Cómo entro a un curso que tengo asignado?', 'Inicia sesión con tu correo registrado. Si tu cuenta tiene acceso activo, el curso aparecerá en “Mis cursos”.'],
  ['¿Dónde encuentro mis guías y recursos?', 'Abre “Mi biblioteca”. Ahí verás manuales, plantillas, libros y materiales asociados a tus rutas de aprendizaje.'],
  ['¿Cómo recupero mi contraseña?', 'Cierra tu sesión, selecciona “Olvidé mi contraseña” y revisa el enlace enviado a tu correo.'],
  ['No veo un curso que debería tener', 'Escríbenos por WhatsApp con tu nombre y correo de registro para que revisemos tu asignación.'],
  ['¿Puedo usar la academia desde mi celular?', 'Sí. Compás Academy es adaptable y también puedes instalarla desde el botón disponible en tu perfil.'],
  ['¿Cómo obtengo mi certificado?', 'Completa todas las lecciones del curso. Después podrás abrir e imprimir tu certificado desde la sección de certificados.']
];

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  document.querySelectorAll('[data-install]').forEach(button => button.classList.remove('hide'));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  showToast('Compás Academy quedó instalada.');
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


function normalizeMediaUrl(value, fallback = 'compas-academia.svg') {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  // Compatible con registros anteriores guardados como assets/archivo.webp.
  return raw
    .replace(/^\.?\/?assets\//i, '')
    .replace(/^\.?\//, '');
}

function imageErrorFallback(event, fallback = 'compas-academia.svg') {
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
        <img class="official-lockup" src="compas-academia.svg" alt="Compás Academy">
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
    navigator.serviceWorker.register('sw.js?v=7.0.0', { updateViaCache: 'none' })
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
  state.workspaces = [];
  state.workspaceMembers = [];
  state.products = [];
  state.productContents = [];
  state.studentAccess = [];
  state.accessHistory = [];
  state.orders = [];
  state.resourceAccess = [];
  state.activeWorkspaceId = null;
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

  state.workspaces = [];
  state.workspaceMembers = [];
  if (isAdmin() || isInstructor()) {
    const [workspacesResult, workspaceMembersResult] = await Promise.all([
      db.from('workspaces').select('*').order('name', { ascending: true }),
      db.from('workspace_members').select('*')
    ]);
    if (workspacesResult.error) console.error('Workspaces error:', workspacesResult.error);
    if (workspaceMembersResult.error) console.error('Workspace members error:', workspaceMembersResult.error);
    state.workspaces = workspacesResult.data || [];
    state.workspaceMembers = workspaceMembersResult.data || [];
  }

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
    const [
      profilesResult, enrollmentsResult, productsResult, productContentsResult,
      studentAccessResult, accessHistoryResult, ordersResult, resourceAccessResult
    ] = await Promise.all([
      db.from('profiles').select('id,email,full_name,avatar_url,role,created_at').order('created_at', { ascending: false }),
      db.from('enrollments').select('*').order('enrolled_at', { ascending: false }),
      db.from('products').select('*').order('created_at', { ascending: false }),
      db.from('product_contents').select('*').order('created_at', { ascending: true }),
      db.from('student_access').select('*').order('granted_at', { ascending: false }),
      db.from('access_history').select('*').order('created_at', { ascending: false }).limit(250),
      db.from('orders').select('*').order('created_at', { ascending: false }).limit(250),
      db.from('resource_access').select('*').order('granted_at', { ascending: false })
    ]);

    [
      ['Profiles', profilesResult], ['Enrollments', enrollmentsResult],
      ['Products', productsResult], ['Product contents', productContentsResult],
      ['Student access', studentAccessResult], ['Access history', accessHistoryResult],
      ['Orders', ordersResult], ['Resource access', resourceAccessResult]
    ].forEach(([label, result]) => {
      if (result.error) console.error(`${label} error:`, result.error);
    });

    state.profiles = profilesResult.data || [];
    state.enrollments = enrollmentsResult.data || [];
    state.products = productsResult.data || [];
    state.productContents = productContentsResult.data || [];
    state.studentAccess = studentAccessResult.data || [];
    state.accessHistory = accessHistoryResult.data || [];
    state.orders = ordersResult.data || [];
    state.resourceAccess = resourceAccessResult.data || [];
  }

  state.loading = false;
}

