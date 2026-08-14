(() => {
  const ENDPOINT = 'https://app.proyectocompas.com/api/public/web-chat/compas-academy/messages';
  const PUBLIC_KEY = 'wc_775408ca243abfea3d5ec95025e3c2d9bdbb';
  const PRIVACY_URL = 'https://www.proyectocompas.com/aviso-de-privacidad.html';
  const ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 9.7 8.7 4 11l5.7 2.3L12 19l2.3-5.7L20 11l-5.7-2.3L12 3Z"/><path d="m5 4 .7 1.7L7.5 6.5l-1.8.8L5 9l-.7-1.7-1.8-.8 1.8-.8L5 4Z"/></svg>`;
  const SEND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>`;

  let baseRoute = null;
  let lastContextHash = '#home';
  let panelOpen = false;
  let messages = [];
  let busy = false;
  let historyLoading = false;

  const esc = value => typeof escapeHtml === 'function' ? escapeHtml(String(value ?? '')) : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const userId = () => state?.user?.id || 'guest';
  const sessionKey = () => `compas-academy-tutor-session:${userId()}`;
  const consentKey = () => `compas-academy-tutor-consent-v1:${userId()}`;
  const getSessionToken = () => localStorage.getItem(sessionKey()) || '';
  const setSessionToken = token => token ? localStorage.setItem(sessionKey(), token) : localStorage.removeItem(sessionKey());
  const hasConsent = () => localStorage.getItem(consentKey()) === 'yes';

  function accessToken() {
    return state?.session?.access_token || '';
  }

  function courseContext(hash = lastContextHash || location.hash) {
    const cleanHash = String(hash || '').replace(/^#/, '');
    const [page, courseId, lessonId] = cleanHash.split('/');
    const course = Array.isArray(state?.courses) ? state.courses.find(c => String(c.id) === String(courseId)) : null;
    let module = null;
    let lesson = null;
    if (course && lessonId) {
      for (const m of course.modules || []) {
        const found = (m.lessons || []).find(l => String(l.id) === String(lessonId));
        if (found) { module = m; lesson = found; break; }
      }
    }
    return {
      route: page || 'home',
      courseId: course?.id || undefined,
      courseTitle: course?.title || undefined,
      moduleTitle: module?.title || undefined,
      lessonId: lesson?.id || undefined,
      lessonTitle: lesson?.title || undefined,
      progress: course && typeof courseProgress === 'function' ? courseProgress(course) : undefined,
    };
  }

  function contextLabel() {
    const ctx = courseContext();
    if (ctx.lessonTitle) return `${ctx.courseTitle || 'Curso'} · ${ctx.lessonTitle}`;
    if (ctx.courseTitle) return ctx.courseTitle;
    return 'Compás Academy';
  }

  function headers(extra = {}) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken()}`,
      ...extra,
    };
  }

  async function api(method, body) {
    const sessionToken = getSessionToken();
    const response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(PUBLIC_KEY)}`, {
      method,
      headers: headers(sessionToken ? {'X-Compas-Chat-Session': sessionToken} : {}),
      body: body ? JSON.stringify(body) : undefined,
      mode: 'cors',
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) throw new Error(data?.error || 'No fue posible contactar al Tutor IA.');
    return data;
  }

  async function loadHistory() {
    if (!state?.session || !getSessionToken() || historyLoading) return;
    historyLoading = true;
    try {
      const data = await api('GET');
      messages = Array.isArray(data.messages) ? data.messages.map(m => ({
        role: m.direction === 'incoming' ? 'user' : 'assistant',
        body: m.body || '',
        id: m.id,
      })) : [];
      renderOpenSurface();
    } catch (error) {
      console.warn('Tutor IA history:', error);
      if (/sesión|pertenece|venció/i.test(error.message || '')) setSessionToken('');
    } finally {
      historyLoading = false;
    }
  }

  function messageMarkup(item) {
    const role = item.role === 'user' ? 'user' : 'assistant';
    return `<article class="tutor-v10-message ${role}"><span>${role === 'assistant' ? ICON : ''}</span><div>${esc(item.body).replace(/\n/g,'<br>')}</div></article>`;
  }

  function consentMarkup() {
    if (hasConsent()) return '';
    return `<label class="tutor-v10-consent"><input type="checkbox" data-tutor-consent><span>Acepto usar el Tutor IA y que mis preguntas se procesen mediante IA para brindar acompañamiento educativo y continuidad de soporte. No compartiré contraseñas ni datos sensibles. <a href="${PRIVACY_URL}" target="_blank" rel="noopener">Privacidad</a>.</span></label>`;
  }

  function quickPrompts() {
    return [
      'Explícame este tema de forma sencilla',
      'Dame un ejemplo práctico',
      'Hazme 3 preguntas para practicar',
      '¿Cómo aplico esto en Compás One?'
    ].map(text => `<button type="button" data-tutor-prompt="${esc(text)}">${esc(text)}</button>`).join('');
  }

  function chatBody(compact = false) {
    const initial = messages.length ? messages.map(messageMarkup).join('') : `<div class="tutor-v10-welcome"><span>${ICON}</span><h3>Hola, soy tu Tutor IA Compás</h3><p>Puedo ayudarte a entender una lección, practicar conceptos y aplicar lo aprendido en Compás One, CRM, marketing, Meta Ads, IA y automatización.</p></div>`;
    return `<div class="tutor-v10-context"><span>Contexto actual</span><strong>${esc(contextLabel())}</strong></div><div class="tutor-v10-prompts">${quickPrompts()}</div><div class="tutor-v10-messages" data-tutor-messages>${initial}</div>${consentMarkup()}<form class="tutor-v10-form" data-tutor-form><textarea rows="${compact ? 2 : 3}" maxlength="1200" placeholder="Pregunta sobre tu curso, una herramienta o cómo aplicar lo aprendido…" data-tutor-input></textarea><button type="submit" aria-label="Enviar pregunta" ${busy ? 'disabled' : ''}>${busy ? '<span class="tutor-v10-loader"></span>' : SEND_ICON}</button></form><small class="tutor-v10-note">El Tutor IA puede equivocarse. Verifica decisiones importantes y solicita apoyo humano cuando lo necesites.</small>`;
  }

  function renderFullTutor() {
    const page = document.querySelector('#page');
    if (!page) return;
    page.innerHTML = `<section class="tutor-v10-page"><header class="tutor-v10-hero"><div><span class="eyebrow">IA conectada con Compás One</span><h1>Tutor IA Compás</h1><p>Tu asistente de aprendizaje dentro de Academy. Conserva el contexto del curso y utiliza el mismo motor inteligente de Proyecto Compás.</p></div><span class="tutor-v10-hero-icon">${ICON}</span></header><section class="tutor-v10-layout"><article class="tutor-v10-chat glass">${chatBody(false)}</article><aside class="tutor-v10-side"><article><span>${ICON}</span><h3>¿En qué puede ayudarte?</h3><ul><li>Explicar conceptos paso a paso.</li><li>Crear ejemplos y ejercicios.</li><li>Relacionar la teoría con Compás One.</li><li>Prepararte para una evaluación.</li></ul></article><article><h3>Privacidad y seguridad</h3><p>Tu identidad se valida con la sesión de Academy. La clave del motor de IA nunca se expone en el navegador.</p></article></aside></section></section>`;
    bindChat(page);
  }

  function ensurePanel() {
    let shell = document.querySelector('.tutor-v10-panel-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'tutor-v10-panel-shell';
      shell.innerHTML = `<div class="tutor-v10-backdrop" data-tutor-close></div><aside class="tutor-v10-panel"><header><div><span>${ICON}</span><div><strong>Tutor IA Compás</strong><small>${esc(contextLabel())}</small></div></div><button type="button" data-tutor-close aria-label="Cerrar">×</button></header><div class="tutor-v10-panel-body">${chatBody(true)}</div></aside>`;
      document.body.appendChild(shell);
      bindChat(shell);
      shell.querySelectorAll('[data-tutor-close]').forEach(el => el.addEventListener('click', closePanel));
    } else {
      const body = shell.querySelector('.tutor-v10-panel-body');
      if (body) { body.innerHTML = chatBody(true); bindChat(shell); }
      const small = shell.querySelector('header small'); if (small) small.textContent = contextLabel();
    }
    return shell;
  }

  function openPanel() {
    if (!state?.session) return;
    if (!location.hash.startsWith('#tutor')) lastContextHash = location.hash || '#home';
    panelOpen = true;
    ensurePanel().classList.add('open');
    document.body.classList.add('tutor-panel-open');
    setTimeout(() => ensurePanel().querySelector('[data-tutor-input]')?.focus(), 80);
    loadHistory();
  }

  function closePanel() {
    panelOpen = false;
    document.querySelector('.tutor-v10-panel-shell')?.classList.remove('open');
    document.body.classList.remove('tutor-panel-open');
  }

  function renderOpenSurface() {
    if (location.hash.startsWith('#tutor')) renderFullTutor();
    if (panelOpen) ensurePanel();
  }

  async function sendMessage(text) {
    const question = String(text || '').trim();
    if (!question || busy) return;
    if (!hasConsent()) {
      const checkbox = document.querySelector('[data-tutor-consent]');
      if (!checkbox?.checked) {
        if (typeof showToast === 'function') showToast('Acepta el aviso del Tutor IA para continuar.', 'error');
        return;
      }
      localStorage.setItem(consentKey(), 'yes');
    }

    busy = true;
    messages.push({role:'user', body:question, id:crypto.randomUUID()});
    renderOpenSurface();
    try {
      const data = await api('POST', {
        publicKey: PUBLIC_KEY,
        sessionToken: getSessionToken() || undefined,
        clientMessageId: crypto.randomUUID(),
        message: question,
        pageUrl: location.href,
        academyContext: courseContext(),
      });
      if (data.sessionToken) setSessionToken(data.sessionToken);
      messages.push({role:'assistant', body:data.reply || 'Estoy listo para seguir ayudándote.', id:data.replyMessageId || crypto.randomUUID()});
    } catch (error) {
      messages.push({role:'assistant', body:`No pude responder en este momento. ${error.message || 'Intenta nuevamente.'}`, id:crypto.randomUUID()});
    } finally {
      busy = false;
      renderOpenSurface();
      requestAnimationFrame(() => {
        document.querySelectorAll('[data-tutor-messages]').forEach(el => { el.scrollTop = el.scrollHeight; });
      });
    }
  }

  function bindChat(root) {
    root.querySelectorAll('[data-tutor-prompt]').forEach(btn => btn.addEventListener('click', () => {
      const input = root.querySelector('[data-tutor-input]');
      if (input) { input.value = btn.dataset.tutorPrompt || ''; input.focus(); }
    }));
    root.querySelectorAll('[data-tutor-form]').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('[data-tutor-input]');
      const value = input?.value || '';
      if (input) input.value = '';
      sendMessage(value);
    }));
    root.querySelectorAll('[data-tutor-consent]').forEach(box => box.addEventListener('change', () => {
      if (box.checked) localStorage.setItem(consentKey(), 'yes');
    }));
  }

  function injectNavigation() {
    if (!state?.session) {
      document.querySelector('.tutor-v10-fab')?.remove();
      document.querySelector('.tutor-v10-panel-shell')?.remove();
      document.body.classList.remove('tutor-panel-open');
      panelOpen = false;
      return;
    }
    const nav = document.querySelector('.sidebar-nav');
    if (nav && !nav.querySelector('[data-tutor-nav]')) {
      const link = document.createElement('a');
      link.className = `nav-link tutor-v10-nav ${location.hash.startsWith('#tutor') ? 'active' : ''}`;
      link.href = '#tutor'; link.dataset.tutorNav = '1';
      link.innerHTML = `<span class="nav-icon">${ICON}</span>Tutor IA`;
      const admin = nav.querySelector('.admin-nav-link');
      nav.insertBefore(link, admin || null);
    }
    document.querySelectorAll('[data-tutor-nav]').forEach(link => link.classList.toggle('active', location.hash.startsWith('#tutor')));
    if (location.hash.startsWith('#tutor')) {
      const heading = document.querySelector('.topbar-heading strong');
      if (heading) heading.textContent = 'Tutor IA';
    }

    if (!document.querySelector('.tutor-v10-fab')) {
      const fab = document.createElement('button');
      fab.type = 'button'; fab.className = 'tutor-v10-fab'; fab.setAttribute('aria-label','Abrir Tutor IA');
      fab.innerHTML = `${ICON}<span><strong>Tutor IA</strong><small>Pregunta lo que necesites</small></span>`;
      fab.addEventListener('click', openPanel);
      document.body.appendChild(fab);
    }

    const stats = document.querySelector('.dash-v9-stats');
    if (stats && !document.querySelector('.dash-v10-ai-card')) {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'dash-v10-ai-card';
      card.innerHTML = `<span>${ICON}</span><div><small>Tutor IA Compás</small><strong>¿Tienes una duda sobre lo que estás aprendiendo?</strong><em>Preguntar ahora →</em></div>`;
      card.addEventListener('click', openPanel);
      stats.insertAdjacentElement('afterend', card);
    }
  }

  function installRoute() {
    if (baseRoute || typeof route !== 'function') return;
    baseRoute = route;
    route = async function tutorAwareRoute() {
      const hash = location.hash.replace(/^#/, '') || (state.session ? 'home' : 'catalog');
      const [page] = hash.split('/');
      if (state.session && page === 'tutor') {
        renderShell('tutor');
        renderFullTutor();
        injectNavigation();
        loadHistory();
        return;
      }
      if (page !== 'tutor') lastContextHash = location.hash || '#home';
      const result = await baseRoute();
      setTimeout(injectNavigation, 0);
      return result;
    };
  }

  const observer = new MutationObserver(() => {
    installRoute();
    injectNavigation();
  });

  function start() {
    installRoute();
    injectNavigation();
    observer.observe(document.body, {childList:true, subtree:true});
    window.addEventListener('hashchange', () => {
      closePanel();
      setTimeout(() => { installRoute(); injectNavigation(); }, 0);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();