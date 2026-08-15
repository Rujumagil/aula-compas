(() => {
  const VERSION = '21.0.0';
  let realtimeChannel = null;
  let activeContextKey = '';

  const esc = value => typeof escapeHtml === 'function'
    ? escapeHtml(String(value ?? ''))
    : String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const uid = () => state?.user?.id || state?.session?.user?.id || '';
  const isManager = () => (typeof isAdmin === 'function' && isAdmin()) || (typeof isInstructor === 'function' && isInstructor());
  const roleLabel = role => role === 'admin' ? 'Administrador' : role === 'instructor' ? 'Instructor' : 'Alumno';
  const timeLabel = iso => {
    try { return new Intl.DateTimeFormat('es-MX',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso)); }
    catch { return ''; }
  };

  async function fetchCommunity(courseId, lessonId = null) {
    let query = db.from('academy_community_threads').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    query = lessonId ? query.eq('lesson_id', lessonId) : query.is('lesson_id', null);
    const { data: threads, error } = await query;
    if (error) throw error;
    const ids = (threads || []).map(t => t.id);
    if (!ids.length) return { threads: [], replies: [] };
    const replyResult = await db.from('academy_community_replies').select('*').in('thread_id', ids).order('created_at', { ascending: true });
    if (replyResult.error) throw replyResult.error;
    return { threads: threads || [], replies: replyResult.data || [] };
  }

  function replyMarkup(reply) {
    return `<article class="community-v21-reply">
      <div class="community-v21-avatar">${esc((reply.author_name || 'A').trim().charAt(0).toUpperCase())}</div>
      <div><header><strong>${esc(reply.author_name)}</strong><span>${esc(roleLabel(reply.author_role))}</span><small>${esc(timeLabel(reply.created_at))}</small></header><p>${esc(reply.body)}</p></div>
    </article>`;
  }

  function threadMarkup(thread, replies) {
    const mine = thread.user_id === uid();
    const canModerate = isManager();
    const isResolved = thread.status === 'resolved';
    return `<article class="community-v21-thread ${isResolved ? 'resolved' : ''}" data-thread="${thread.id}">
      <header class="community-v21-thread-head">
        <div class="community-v21-author"><span class="community-v21-avatar">${esc((thread.author_name || 'A').trim().charAt(0).toUpperCase())}</span><div><strong>${esc(thread.author_name)}</strong><span>${esc(roleLabel(thread.author_role))} · ${esc(timeLabel(thread.created_at))}</span></div></div>
        <span class="community-v21-status">${isResolved ? '✓ Resuelta' : 'Abierta'}</span>
      </header>
      <h3>${esc(thread.title)}</h3>
      <p class="community-v21-body">${esc(thread.body)}</p>
      <div class="community-v21-replies">${replies.length ? replies.map(replyMarkup).join('') : '<p class="community-v21-empty-replies">Todavía no hay respuestas. Sé el primero en ayudar.</p>'}</div>
      ${!isResolved ? `<form class="community-v21-reply-form" data-reply-form="${thread.id}"><textarea name="body" maxlength="3000" required placeholder="Escribe una respuesta útil..."></textarea><div><small>Responde con claridad y respeto.</small><button class="btn btn-secondary" type="submit">Responder</button></div></form>` : ''}
      ${(mine || canModerate) ? `<footer class="community-v21-tools">${!isResolved ? `<button type="button" data-thread-status="${thread.id}" data-status="resolved">Marcar como resuelta</button>` : `<button type="button" data-thread-status="${thread.id}" data-status="open">Reabrir</button>`}${canModerate ? `<button class="danger" type="button" data-thread-status="${thread.id}" data-status="hidden">Ocultar</button>` : ''}</footer>` : ''}
    </article>`;
  }

  function panelMarkup(courseId, lessonId, data) {
    const repliesByThread = new Map();
    data.replies.forEach(reply => {
      if (!repliesByThread.has(reply.thread_id)) repliesByThread.set(reply.thread_id, []);
      repliesByThread.get(reply.thread_id).push(reply);
    });
    return `<section class="community-v21 glass" data-community-panel data-course-id="${courseId}" data-lesson-id="${lessonId || ''}">
      <div class="community-v21-heading"><div><span class="eyebrow">Comunidad Academy</span><h2>${lessonId ? 'Preguntas sobre esta lección' : 'Preguntas generales del curso'}</h2><p>Comparte dudas, aprendizajes y respuestas con otros alumnos e instructores.</p></div><span class="community-v21-count">${data.threads.length} ${data.threads.length === 1 ? 'conversación' : 'conversaciones'}</span></div>
      <form class="community-v21-new" data-community-new>
        <input name="title" maxlength="180" minlength="4" required placeholder="¿Qué quieres preguntar o compartir?">
        <textarea name="body" maxlength="4000" minlength="4" required placeholder="Agrega contexto para que la comunidad pueda ayudarte mejor."></textarea>
        <div><small>La comunidad es visible únicamente para alumnos inscritos y gestores de este curso.</small><button class="btn btn-primary" type="submit">Publicar pregunta</button></div>
      </form>
      <div class="community-v21-list">${data.threads.length ? data.threads.map(t => threadMarkup(t,repliesByThread.get(t.id) || [])).join('') : '<div class="community-v21-empty"><strong>Abre la primera conversación</strong><p>Una buena pregunta puede ayudar a toda la comunidad.</p></div>'}</div>
    </section>`;
  }

  async function mount(courseId, lessonId = null) {
    const page = document.querySelector('#page');
    if (!page || !uid()) return;
    const contextKey = `${courseId}:${lessonId || 'course'}`;
    activeContextKey = contextKey;
    page.querySelector('[data-community-panel]')?.remove();
    try {
      const data = await fetchCommunity(courseId, lessonId);
      if (activeContextKey !== contextKey) return;
      const html = panelMarkup(courseId, lessonId, data);
      if (lessonId) {
        const mainColumn = page.querySelector('.lesson-layout > div:first-child');
        if (mainColumn) mainColumn.insertAdjacentHTML('beforeend', html);
      } else {
        const courseHead = page.querySelector('.course-head');
        if (courseHead) courseHead.insertAdjacentHTML('afterend', html);
      }
      bindPanel(courseId, lessonId);
      subscribeRealtime(courseId, lessonId);
    } catch (error) {
      console.error('Academy Community V21:', error);
    }
  }

  function bindPanel(courseId, lessonId) {
    const panel = document.querySelector('[data-community-panel]');
    if (!panel) return;
    panel.querySelector('[data-community-new]')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      const payload = { course_id: courseId, lesson_id: lessonId || null, user_id: uid(), author_name: 'Academy', author_role: 'student', title: String(values.get('title') || '').trim(), body: String(values.get('body') || '').trim() };
      const { error } = await db.from('academy_community_threads').insert(payload);
      button.disabled = false;
      if (error) return showToast(error.message?.includes('row-level') ? 'No tienes acceso a la comunidad de este curso.' : 'No se pudo publicar la pregunta.', 'error');
      form.reset(); showToast('Pregunta publicada.', 'success'); await mount(courseId, lessonId);
    });
    panel.querySelectorAll('[data-reply-form]').forEach(form => form.addEventListener('submit', async event => {
      event.preventDefault();
      const body = String(new FormData(form).get('body') || '').trim();
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      const { error } = await db.from('academy_community_replies').insert({ thread_id: form.dataset.replyForm, user_id: uid(), author_name: 'Academy', author_role: 'student', body });
      button.disabled = false;
      if (error) return showToast('No se pudo publicar la respuesta.', 'error');
      showToast('Respuesta publicada.', 'success'); await mount(courseId, lessonId);
    }));
    panel.querySelectorAll('[data-thread-status]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      const { error } = await db.rpc('set_academy_community_thread_status',{target_thread:button.dataset.threadStatus,new_status:button.dataset.status});
      button.disabled = false;
      if (error) return showToast('No se pudo actualizar la conversación.', 'error');
      showToast(button.dataset.status === 'hidden' ? 'Conversación ocultada.' : 'Estado actualizado.', 'success'); await mount(courseId, lessonId);
    }));
  }

  function subscribeRealtime(courseId, lessonId) {
    if (realtimeChannel) { try { db.removeChannel(realtimeChannel); } catch {} }
    realtimeChannel = db.channel(`academy-community-${courseId}-${lessonId || 'course'}-${Date.now()}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'academy_community_threads',filter:`course_id=eq.${courseId}`},()=>mount(courseId,lessonId))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'academy_community_replies'},()=>mount(courseId,lessonId))
      .subscribe();
  }

  const baseRenderCourse = typeof renderCourse === 'function' ? renderCourse : null;
  if (baseRenderCourse) renderCourse = function(courseId) { baseRenderCourse(courseId); setTimeout(()=>mount(courseId,null),0); };

  const baseRenderLesson = typeof renderLesson === 'function' ? renderLesson : null;
  if (baseRenderLesson) renderLesson = async function(courseId, lessonId) { await baseRenderLesson(courseId,lessonId); await mount(courseId,lessonId); };

  window.addEventListener('hashchange',()=>{
    const route = String(location.hash || '').replace(/^#/,'').split('/')[0];
    if (!['course','lesson'].includes(route) && realtimeChannel) { try { db.removeChannel(realtimeChannel); } catch {} realtimeChannel = null; activeContextKey=''; }
  });

  console.info(`Compás Academy Community V${VERSION} listo.`);
})();
