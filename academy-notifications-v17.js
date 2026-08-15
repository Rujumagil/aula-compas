(() => {
  let notificationChannel = null;
  let refreshTimer = null;

  const typeMeta = {
    course_assigned: { label: 'Curso', icon: '▤', tone: 'blue' },
    assessment_available: { label: 'Evaluación', icon: '✎', tone: 'orange' },
    assessment_passed: { label: 'Evaluación', icon: '✓', tone: 'green' },
    assessment_failed: { label: 'Evaluación', icon: '↻', tone: 'orange' },
    certificate_ready: { label: 'Certificado', icon: '◇', tone: 'green' },
    inactivity: { label: 'Recordatorio', icon: '◷', tone: 'blue' },
    system: { label: 'Academy', icon: '◎', tone: 'blue' }
  };

  function notifications() {
    return Array.isArray(state?.academyNotifications) ? state.academyNotifications : [];
  }

  function unreadCount() {
    return notifications().filter(item => !item.read_at).length;
  }

  function safeTarget(value) {
    const target = String(value || '#home');
    return /^#[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*$/i.test(target) ? target : '#home';
  }

  function formatNotificationDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
    const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
    if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
    const diffDays = Math.round(diffHours / 24);
    if (Math.abs(diffDays) <= 7) return rtf.format(diffDays, 'day');
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  }

  function updateNotificationBadge() {
    const badge = document.querySelector('.notification-button span');
    if (!badge) return;
    const count = unreadCount();
    badge.textContent = count > 99 ? '99+' : (count ? String(count) : '');
    badge.classList.toggle('academy-notification-badge', count > 0);
    document.querySelector('.notification-button')?.setAttribute('aria-label', count ? `${count} notificaciones sin leer` : 'Sin notificaciones nuevas');
  }

  async function fetchNotifications({ synthesize = true } = {}) {
    if (!state?.user?.id) return [];
    try {
      if (synthesize) {
        const refreshResult = await db.rpc('refresh_academy_notifications');
        if (refreshResult.error) console.warn('Notification refresh:', refreshResult.error);
      }

      const result = await db
        .from('academy_notifications')
        .select('id,notification_type,title,body,target_path,entity_type,entity_id,created_at,read_at')
        .eq('user_id', state.user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (result.error) throw result.error;
      state.academyNotifications = result.data || [];
      updateNotificationBadge();
      return state.academyNotifications;
    } catch (error) {
      console.error('Academy notifications:', error);
      state.academyNotifications ||= [];
      updateNotificationBadge();
      return state.academyNotifications;
    }
  }

  async function markNotificationRead(id) {
    const item = notifications().find(row => row.id === id);
    if (!item || item.read_at) return;
    const readAt = new Date().toISOString();
    const { error } = await db.from('academy_notifications').update({ read_at: readAt }).eq('id', id);
    if (error) {
      console.error('Mark notification read:', error);
      return;
    }
    item.read_at = readAt;
    updateNotificationBadge();
  }

  async function markAllNotificationsRead() {
    if (!state?.user?.id || unreadCount() === 0) return;
    const readAt = new Date().toISOString();
    const { error } = await db
      .from('academy_notifications')
      .update({ read_at: readAt })
      .eq('user_id', state.user.id)
      .is('read_at', null);
    if (error) {
      console.error('Mark all notifications read:', error);
      showToast('No pudimos actualizar las notificaciones.', 'error');
      return;
    }
    notifications().forEach(item => { if (!item.read_at) item.read_at = readAt; });
    updateNotificationBadge();
    renderNotifications();
    showToast('Notificaciones marcadas como leídas.', 'success');
  }

  function notificationCard(item) {
    const meta = typeMeta[item.notification_type] || typeMeta.system;
    return `
      <a class="academy-notification-card ${item.read_at ? 'is-read' : 'is-unread'}" href="${escapeHtml(safeTarget(item.target_path))}" data-academy-notification="${escapeHtml(item.id)}" data-notification-status="${item.read_at ? 'read' : 'unread'}" data-notification-kind="${escapeHtml(item.notification_type)}">
        <span class="academy-notification-icon ${meta.tone}">${meta.icon}</span>
        <span class="academy-notification-copy">
          <span class="academy-notification-meta"><strong>${escapeHtml(meta.label)}</strong><time>${escapeHtml(formatNotificationDate(item.created_at))}</time></span>
          <strong class="academy-notification-title">${escapeHtml(item.title)}</strong>
          <span class="academy-notification-body">${escapeHtml(item.body)}</span>
        </span>
        <span class="academy-notification-end">${item.read_at ? '→' : '<i aria-label="Sin leer"></i><b>→</b>'}</span>
      </a>`;
  }

  function academyRenderNotifications() {
    const page = document.querySelector('#page');
    if (!page) return;
    const list = notifications();
    const unread = unreadCount();
    const achievementCount = list.filter(item => ['assessment_passed', 'certificate_ready'].includes(item.notification_type)).length;

    page.innerHTML = `
      <section class="academy-notification-heading">
        <div>
          <span class="eyebrow">Centro de actividad</span>
          <h1 class="page-title">Notificaciones</h1>
          <p class="page-subtitle">Cursos, evaluaciones, certificados y recordatorios vinculados a tu avance real.</p>
        </div>
        <div class="academy-notification-summary">
          <article><strong>${unread}</strong><span>Sin leer</span></article>
          <article><strong>${achievementCount}</strong><span>Logros</span></article>
        </div>
      </section>

      <section class="academy-notification-toolbar glass">
        <div class="academy-notification-filters" role="group" aria-label="Filtrar notificaciones">
          <button class="active" type="button" data-notification-filter="all">Todas</button>
          <button type="button" data-notification-filter="unread">Sin leer</button>
          <button type="button" data-notification-filter="learning">Aprendizaje</button>
          <button type="button" data-notification-filter="achievement">Logros</button>
        </div>
        <button class="academy-mark-read" type="button" id="academy-mark-all-read" ${unread ? '' : 'disabled'}>Marcar todo como leído</button>
      </section>

      <section class="academy-notification-feed" id="academy-notification-feed">
        ${list.length ? list.map(notificationCard).join('') : `
          <section class="academy-notification-empty glass">
            <span>◎</span><h2>Todo está al día</h2>
            <p>Los cambios importantes de tus cursos aparecerán aquí automáticamente.</p>
            <a class="btn btn-primary" href="#courses">Ir a mis cursos</a>
          </section>`}
      </section>
      <section class="academy-notification-no-results hide" id="academy-notification-no-results">
        <span>⌕</span><h2>No hay avisos en este filtro</h2><p>Prueba con otra categoría.</p>
      </section>`;

    const filters = [...document.querySelectorAll('[data-notification-filter]')];
    filters.forEach(button => button.addEventListener('click', () => {
      const filter = button.dataset.notificationFilter;
      filters.forEach(item => item.classList.toggle('active', item === button));
      let visible = 0;
      document.querySelectorAll('[data-academy-notification]').forEach(card => {
        const kind = card.dataset.notificationKind;
        const matches = filter === 'all'
          || (filter === 'unread' && card.dataset.notificationStatus === 'unread')
          || (filter === 'learning' && ['course_assigned','assessment_available','assessment_failed','inactivity'].includes(kind))
          || (filter === 'achievement' && ['assessment_passed','certificate_ready'].includes(kind));
        card.classList.toggle('hide', !matches);
        if (matches) visible += 1;
      });
      document.querySelector('#academy-notification-no-results')?.classList.toggle('hide', visible > 0 || list.length === 0);
    }));

    document.querySelector('#academy-mark-all-read')?.addEventListener('click', markAllNotificationsRead);
    document.querySelectorAll('[data-academy-notification]').forEach(card => card.addEventListener('click', async event => {
      event.preventDefault();
      const target = safeTarget(card.getAttribute('href'));
      await markNotificationRead(card.dataset.academyNotification);
      location.hash = target.slice(1);
    }));
  }

  function startRealtimeNotifications() {
    if (!state?.user?.id || notificationChannel) return;
    notificationChannel = db
      .channel(`academy-notifications:${state.user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'academy_notifications', filter: `user_id=eq.${state.user.id}`
      }, async () => {
        await fetchNotifications({ synthesize: false });
        const pageName = location.hash.replace(/^#/, '').split('/')[0];
        if (pageName === 'notifications') academyRenderNotifications();
      })
      .subscribe();
  }

  function stopRealtimeNotifications() {
    if (notificationChannel) {
      db.removeChannel(notificationChannel).catch?.(() => {});
      notificationChannel = null;
    }
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  try {
    const originalLoadApplicationData = loadApplicationData;
    loadApplicationData = async function academyLoadApplicationData(...args) {
      const result = await originalLoadApplicationData(...args);
      await fetchNotifications({ synthesize: true });
      startRealtimeNotifications();
      if (!refreshTimer) refreshTimer = setInterval(() => fetchNotifications({ synthesize: true }), 5 * 60 * 1000);
      return result;
    };

    const originalRenderShell = renderShell;
    renderShell = function academyRenderShell(...args) {
      const result = originalRenderShell(...args);
      updateNotificationBadge();
      return result;
    };

    const originalClearUserData = clearUserData;
    clearUserData = function academyClearUserData(...args) {
      stopRealtimeNotifications();
      state.academyNotifications = [];
      return originalClearUserData(...args);
    };

    renderNotifications = academyRenderNotifications;

    setTimeout(async () => {
      if (!state?.user?.id) return;
      await fetchNotifications({ synthesize: true });
      startRealtimeNotifications();
      updateNotificationBadge();
      if (location.hash.replace(/^#/, '').split('/')[0] === 'notifications') academyRenderNotifications();
    }, 1200);
  } catch (error) {
    console.error('Academy notifications V17:', error);
  }
})();
