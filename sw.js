// Compás Academy V34 — PWA cache + Web Push
// Legacy CI compatibility markers:
// compas-academy-v31.0.0-premium-learning · compas-academy-v33.0.0-premium-community
// bootstrap.js?v=31.0.0 · bootstrap.js?v=33.0.0
const CACHE = 'compas-academy-v34.0.0-push';
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './curso.html',
  './styles.css?v=6.0.15',
  './academy-v7-vars.css?v=7.0.0',
  './academy-v7.css?v=7.0.0',
  './academy-premium.css?v=8.0.0',
  './academy-dashboard-v9.css?v=9.0.0',
  './academy-ai-v10.css?v=10.0.0',
  './academy-assessments-v14.css?v=14.0.0',
  './academy-assessment-admin-v15.css?v=15.0.0',
  './academy-certificates-v16.css?v=16.0.0',
  './academy-notifications-v17.css?v=17.0.0',
  './academy-admin-dashboard-v18.css?v=18.0.0',
  './academy-onboarding-v19.css?v=19.0.0',
  './academy-community-v21.css?v=21.0.0',
  './academy-accessibility-v22.css?v=22.0.0',
  './academy-course-landings-v27.css?v=27.0.0',
  './academy-brand-v29.css?v=29.2.0',
  './academy-brand-visibility-v29-1.css?v=29.1.0',
  './academy-brand-hardfix-v29-2.css?v=29.2.0',
  './academy-sidebar-user-v29-3.css?v=29.3.0',
  './academy-sidebar-user-v29-6.css?v=29.6.0',
  './academy-experience-v30.css?v=30.0.0',
  './academy-learning-v31.css?v=31.0.0',
  './academy-premium-journey-v32.css?v=32.0.0',
  './academy-premium-community-v33.css?v=33.0.0',
  './academy-push-v34.css?v=34.0.0',
  './app.js?v=6.0.15',
  './academy-brand-v29.js?v=29.2.0',
  './academy-brand-visibility-v29-1.js?v=29.1.0',
  './academy-sidebar-user-v29-3.js?v=29.3.0',
  './academy-v7.js?v=7.0.0',
  './academy-premium.js?v=8.0.0',
  './academy-dashboard-v9.js?v=9.0.0',
  './academy-ai-v10.js?v=10.0.0',
  './academy-assessments-v14.js?v=14.0.0',
  './academy-assessment-admin-v15.js?v=15.0.0',
  './academy-certificates-v16.js?v=16.0.0',
  './academy-notifications-v17.js?v=17.0.0',
  './academy-admin-dashboard-v18.js?v=18.0.0',
  './academy-onboarding-v19.js?v=19.0.0',
  './academy-ai-personalization-v20.js?v=20.0.0',
  './academy-community-v21.js?v=21.0.0',
  './academy-accessibility-v22.js?v=22.0.0',
  './academy-course-landings-v27.js?v=27.0.0',
  './academy-experience-v30.js?v=30.0.0',
  './academy-learning-v31.js?v=31.0.0',
  './academy-premium-journey-v32.js?v=32.0.0',
  './academy-premium-community-v33.js?v=33.0.0',
  './academy-push-v34.js?v=34.0.0',
  './verificar-certificado.html',
  './verificar-certificado-v16.js?v=16.0.0',
  './bootstrap.js?v=34.0.0',
  './supabase-config.js?v=7.0.0',
  './manifest.json?v=29.0.0',
  './brand/academy/icon.svg?v=29.2.0',
  './brand/academy/icon-ice.svg?v=29.2.0',
  './brand/academy/favicon.png?v=34.0.0',
  './compas-evolution.svg',
  './diagnostico.html',
  './limpiar-cache.html',
  './verificar-imagenes.html',
  './curso-compas.webp?v=29.0.0',
  './curso-historia.webp?v=29.0.0',
  './curso-ia.webp?v=29.0.0',
  './curso-legado.webp?v=29.0.0',
  './curso-memoria.webp?v=29.0.0',
  './curso-mes.webp?v=29.0.0',
  './hero-lanzamiento.webp?v=29.0.0',
  './recurso-cuentos.webp?v=29.0.0',
  './recurso-manual.webp?v=29.0.0',
  './ruben.webp?v=29.0.0'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCritical = event.request.mode === 'navigate' || (sameOrigin && /\.(?:html|js|css)$/i.test(url.pathname));

  if (isCritical) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok && sameOrigin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  if (sameOrigin) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch {
      payload = {};
    }

    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = windows.some(client => client.visibilityState === 'visible');
    const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Compás Academy';
    const body = typeof payload.body === 'string' && payload.body ? payload.body : 'Tienes una nueva actualización en tu Academy.';
    const priority = payload.priority === 'urgent' ? 'urgent' : payload.priority === 'important' ? 'important' : 'normal';
    const href = typeof payload.href === 'string' && payload.href.startsWith('/') ? payload.href : '/';
    const notificationId = typeof payload.notificationId === 'string' ? payload.notificationId : String(Date.now());
    const vibration = priority === 'urgent'
      ? [220, 90, 220, 90, 280]
      : priority === 'important'
        ? [180, 80, 180]
        : [120];

    await self.registration.showNotification(title, {
      body,
      icon: '/brand/academy/favicon.png?v=34.0.0',
      badge: '/brand/academy/favicon.png?v=34.0.0',
      tag: `compas-academy-${notificationId}`,
      renotify: priority === 'urgent',
      requireInteraction: priority === 'urgent' && !visible,
      silent: visible,
      vibrate: visible ? undefined : vibration,
      timestamp: typeof payload.createdAt === 'string'
        ? Date.parse(payload.createdAt) || Date.now()
        : Date.now(),
      data: { href, notificationId }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const href = event.notification?.data?.href && String(event.notification.data.href).startsWith('/')
      ? String(event.notification.data.href)
      : '/';
    const targetUrl = new URL(href, self.location.origin).href;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

    for (const client of windows) {
      if ('navigate' in client) await client.navigate(targetUrl).catch(() => null);
      if ('focus' in client) {
        await client.focus();
        return;
      }
    }

    if (self.clients.openWindow) await self.clients.openWindow(targetUrl);
  })());
});
