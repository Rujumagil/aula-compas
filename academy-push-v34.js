(() => {
  const VERSION = '34.0.0';
  const PUSH_CONFIG_URL = 'https://app.proyectocompas.com/api/public/push/config';
  const DISMISS_KEY = 'compas-academy:push-prompt-dismissed';
  const DISMISS_MS = 12 * 60 * 60 * 1000;

  let activeUserId = null;
  let realtimeChannel = null;
  let audioContext = null;

  function supported() {
    return Boolean(
      window.isSecureContext &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  function base64ToUint8Array(value) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replaceAll('-', '+').replaceAll('_', '/');
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map(character => character.charCodeAt(0)));
  }

  function wasDismissedRecently() {
    try {
      const saved = Number(localStorage.getItem(DISMISS_KEY) || 0);
      return Number.isFinite(saved) && Date.now() - saved < DISMISS_MS;
    } catch {
      return false;
    }
  }

  function ensurePrompt() {
    let prompt = document.querySelector('#academy-push-prompt');
    if (prompt) return prompt;

    prompt = document.createElement('aside');
    prompt.id = 'academy-push-prompt';
    prompt.className = 'academy-push-prompt';
    prompt.hidden = true;
    prompt.setAttribute('role', 'status');
    prompt.setAttribute('aria-live', 'polite');
    prompt.innerHTML = `
      <span class="academy-push-icon" aria-hidden="true">🔔</span>
      <div class="academy-push-copy">
        <strong data-push-title>Activa los avisos de Compás Academy</strong>
        <p data-push-message>Recibe evaluaciones, certificados y novedades aunque la Academy esté minimizada.</p>
      </div>
      <div class="academy-push-actions">
        <button class="academy-push-primary" type="button" data-push-enable>Activar avisos</button>
        <button class="academy-push-secondary" type="button" data-push-dismiss>Ahora no</button>
      </div>`;

    document.body.appendChild(prompt);

    prompt.querySelector('[data-push-enable]')?.addEventListener('click', () => {
      void activatePushFromPrompt();
    });

    prompt.querySelector('[data-push-dismiss]')?.addEventListener('click', () => {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
      prompt.hidden = true;
    });

    return prompt;
  }

  function showPrompt(kind = 'prompt', message = '') {
    const prompt = ensurePrompt();
    const title = prompt.querySelector('[data-push-title]');
    const copy = prompt.querySelector('[data-push-message]');
    const enable = prompt.querySelector('[data-push-enable]');
    const dismiss = prompt.querySelector('[data-push-dismiss]');

    if (kind === 'blocked') {
      title.textContent = 'Notificaciones bloqueadas';
      copy.textContent = 'El navegador bloqueó los avisos. Habilítalos desde los permisos de este sitio para volver a recibir notificaciones.';
      enable.hidden = true;
      dismiss.textContent = 'Cerrar';
    } else if (kind === 'error') {
      title.textContent = 'Revisa los avisos de Compás Academy';
      copy.textContent = message || 'No fue posible activar las notificaciones en este dispositivo.';
      enable.hidden = false;
      enable.textContent = 'Volver a intentar';
      dismiss.textContent = 'Cerrar';
    } else {
      title.textContent = 'Activa los avisos de Compás Academy';
      copy.textContent = 'Recibe evaluaciones, certificados y novedades aunque la Academy esté minimizada.';
      enable.hidden = false;
      enable.textContent = 'Activar avisos';
      dismiss.textContent = 'Ahora no';
    }

    prompt.hidden = false;
  }

  async function getVapidKey() {
    const response = await fetch(PUSH_CONFIG_URL, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok || !payload.publicKey) {
      throw new Error(payload?.error || 'No fue posible obtener la configuración Push.');
    }
    return payload.publicKey;
  }

  async function registerPushDevice() {
    if (!supported()) throw new Error('Este navegador no admite Web Push para Compás Academy.');

    const publicKey = await getVapidKey();
    await navigator.serviceWorker.register('sw.js', { scope: './' });
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8Array(publicKey)
      });
    }

    const json = subscription.toJSON();
    const { data, error } = await db.rpc('register_academy_push_v34', {
      p_endpoint: json.endpoint,
      p_p256dh: json.keys?.p256dh || '',
      p_auth_key: json.keys?.auth || '',
      p_user_agent: navigator.userAgent || null
    });

    if (error || data !== true) {
      throw new Error(error?.message || 'No fue posible registrar este dispositivo.');
    }

    return subscription;
  }

  async function activatePushFromPrompt() {
    const prompt = ensurePrompt();
    const button = prompt.querySelector('[data-push-enable]');
    button.disabled = true;
    button.textContent = 'Activando…';

    try {
      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();

      if (permission !== 'granted') {
        if (permission === 'denied') showPrompt('blocked');
        return;
      }

      await registerPushDevice();
      prompt.hidden = true;
      if (typeof showToast === 'function') showToast('Avisos de Compás Academy activados.');
    } catch (error) {
      console.warn('ACADEMY_PUSH_ACTIVATION_ERROR', error);
      showPrompt('error', error instanceof Error ? error.message : String(error));
    } finally {
      button.disabled = false;
      if (!prompt.hidden && !button.hidden) button.textContent = 'Volver a intentar';
    }
  }

  function ensureAudioContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioContext) audioContext = new AudioContextCtor();
    return audioContext;
  }

  async function unlockAudio() {
    const context = ensureAudioContext();
    if (!context) return;
    if (context.state === 'suspended') {
      try { await context.resume(); } catch {}
    }
  }

  async function playAlertTone(type) {
    const context = ensureAudioContext();
    if (!context) return;
    if (context.state === 'suspended') {
      try { await context.resume(); } catch { return; }
    }
    if (context.state !== 'running') return;

    const important = ['certificate_ready', 'inactivity', 'payment_issue'].includes(type);
    const now = context.currentTime + 0.015;
    const tones = important ? [[720, 0], [880, 0.14]] : [[660, 0]];

    tones.forEach(([frequency, offset]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + offset;
      const duration = 0.12;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(important ? 0.055 : 0.04, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    });
  }

  async function subscribeRealtime(userId) {
    if (realtimeChannel) {
      await db.removeChannel(realtimeChannel).catch(() => null);
      realtimeChannel = null;
    }

    realtimeChannel = db
      .channel(`academy-push-v34:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'academy_notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => {
          if (document.visibilityState === 'visible') {
            void playAlertTone(payload.new?.notification_type || 'normal');
          }
        }
      )
      .subscribe();
  }

  async function bootstrapForUser(user) {
    if (!user?.id || activeUserId === user.id) return;
    activeUserId = user.id;
    await subscribeRealtime(user.id);

    if (!supported()) return;

    if (Notification.permission === 'granted') {
      try {
        await registerPushDevice();
      } catch (error) {
        console.warn('ACADEMY_PUSH_REPAIR_WARNING', error);
        showPrompt('error', error instanceof Error ? error.message : String(error));
      }
      return;
    }

    if (Notification.permission === 'denied') {
      showPrompt('blocked');
      return;
    }

    if (!wasDismissedRecently()) showPrompt('prompt');
  }

  async function clearPushOnSignOut() {
    activeUserId = null;
    if (realtimeChannel) {
      await db.removeChannel(realtimeChannel).catch(() => null);
      realtimeChannel = null;
    }

    if (!('serviceWorker' in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe().catch(() => false);
    } catch {}
  }

  async function start() {
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('keydown', unlockAudio);

    try {
      await navigator.serviceWorker?.register('sw.js', { scope: './' });
    } catch (error) {
      console.warn('ACADEMY_SW_REGISTER_WARNING', error);
    }

    const { data } = await db.auth.getSession();
    if (data?.session?.user) await bootstrapForUser(data.session.user);

    db.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        void clearPushOnSignOut();
        return;
      }
      if (session?.user) void bootstrapForUser(session.user);
    });
  }

  void start().catch(error => console.warn('ACADEMY_PUSH_V34_START_ERROR', error));

  window.__COMPAS_ACADEMY_PUSH__ = { version: VERSION };
})();
