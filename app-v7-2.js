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
  return normalizeMediaUrl(state.profile?.avatar_url, 'compas-academia.svg');
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
        <aside class="auth-story academy-auth-story">
          <a class="academy-wordmark" href="https://www.proyectocompas.com/" target="_blank" rel="noopener">
            <img src="compas-academia.svg" alt="Compás Academy">
            <span><strong>COMPÁS ACADEMY</strong><small>Proyecto Compás Evolution</small></span>
          </a>
          <span class="eyebrow">Aprender haciendo</span>
          <h2>Capacitación práctica para usar tecnología con dirección.</h2>
          <p>Aprende Compás One, CRM, marketing digital, Meta Ads, inteligencia artificial y automatización con rutas aplicadas a situaciones reales.</p>
          <div class="auth-benefits">
            <span>✓ Cursos, avance y certificados en un solo lugar</span>
            <span>✓ Biblioteca privada de guías, plantillas y recursos</span>
            <span>✓ Formación conectada con el ecosistema Compás Evolution</span>
          </div>
          <div class="auth-story-actions">
            <a class="btn btn-primary" href="#catalog">Conoce los cursos</a>
            <a class="btn btn-secondary" href="https://www.proyectocompas.com/" target="_blank" rel="noopener">Ver Compás Evolution</a>
          </div>
        </aside>

        <section class="login-card glass auth-card">
        <div class="login-brand">
          <img class="official-lockup academy-product-mark" src="compas-academia.svg" alt="Compás Academy">
          <span class="product-kicker">COMPÁS ACADEMY</span>
          <h1>${recover ? 'Recupera tu acceso' : signup ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p>${recover ? 'Te enviaremos un enlace seguro.' : signup ? 'Comienza tu ruta de aprendizaje.' : 'Continúa desde donde te quedaste.'}</p>
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
            <button class="btn btn-primary" type="submit">${signup ? 'Crear mi cuenta' : 'Entrar a Academy'}</button>
          </form>

          <div class="auth-options">
            <button class="auth-link" type="button" data-mode="${signup ? 'login' : 'signup'}">
              ${signup ? 'Ya tengo cuenta' : 'Crear una cuenta'}
            </button>
            ${signup ? '' : '<button class="auth-link" type="button" data-mode="recover">Olvidé mi contraseña</button>'}
          </div>

          ${signup ? '<div class="demo-note">Después de registrarte, un administrador podrá asignarte los cursos correspondientes.</div>' : ''}
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
          <img class="official-lockup" src="compas-academia.svg" alt="Compás Academy">
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

