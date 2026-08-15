const CACHE = 'compas-academy-v22.0.0-assets';
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './styles.css?v=6.0.15',
  './academy-v7-vars.css?v=7.0.0',
  './academy-v7.css?v=7.0.0',
  './academy-premium.css?v=8.0.0',
  './academy-dashboard-v9.css?v=9.0.0',
  './academy-ai-v10.css?v=10.0.0',
  './academy-brand-v11.css?v=11.1.0',
  './academy-assessments-v14.css?v=14.0.0',
  './academy-assessment-admin-v15.css?v=15.0.0',
  './academy-certificates-v16.css?v=16.0.0',
  './academy-notifications-v17.css?v=17.0.0',
  './academy-admin-dashboard-v18.css?v=18.0.0',
  './academy-onboarding-v19.css?v=19.0.0',
  './academy-community-v21.css?v=21.0.0',
  './academy-accessibility-v22.css?v=22.0.0',
  './app.js?v=6.0.15',
  './academy-brand-v11.js?v=11.1.0',
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
  './verificar-certificado.html',
  './verificar-certificado-v16.js?v=16.0.0',
  './bootstrap.js?v=22.0.0',
  './supabase-config.js?v=7.0.0',
  './manifest.json?v=11.1.0',
  './brand/academy/favicon.png?v=11.1.0',
  './brand/academy/logo.png?v=11.1.0',
  './brand/academy/apple-touch.png?v=11.1.0',
  './brand/academy/icon.svg?v=11.1.0',
  './compas-evolution.svg',
  './diagnostico.html',
  './limpiar-cache.html',
  './verificar-imagenes.html',
  './curso-compas.webp?v=11.1.0',
  './curso-historia.webp?v=11.1.0',
  './curso-ia.webp?v=11.1.0',
  './curso-legado.webp?v=11.1.0',
  './curso-memoria.webp?v=11.1.0',
  './curso-mes.webp?v=11.1.0',
  './hero-lanzamiento.webp?v=11.1.0',
  './recurso-cuentos.webp?v=11.1.0',
  './recurso-manual.webp?v=11.1.0',
  './ruben.webp?v=11.1.0'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset)))));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCritical = event.request.mode === 'navigate' || (sameOrigin && /\.(?:html|js|css)$/i.test(url.pathname));
  if (isCritical) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok && sameOrigin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  if (sameOrigin) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});