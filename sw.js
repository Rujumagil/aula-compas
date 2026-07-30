const CACHE = 'aula-compas-v5-4-1-private-library';
const STATIC_ASSETS = [
  './',
  './index.html',
  './404.html',
  './styles.css?v=5.4.1',
  './app.js?v=5.4.1',
  './bootstrap.js?v=5.4.1',
  './supabase-config.js?v=5.4.1',
  './manifest.json',
  './diagnostico.html',
  './limpiar-cache.html',
  './verificar-imagenes.html',
  './curso-compas.webp',
  './curso-historia.webp',
  './curso-ia.webp',
  './curso-legado.webp',
  './curso-memoria.webp',
  './curso-mes.webp',
  './hero-lanzamiento.webp',
  './icon-192.png',
  './icon-512.png',
  './icono-oficial.png',
  './logo-completo-oficial.png',
  './logo-texto-oficial.png',
  './logo.webp',
  './recurso-cuentos.webp',
  './recurso-manual.webp',
  './ruben.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(STATIC_ASSETS.map(asset => cache.add(asset)))
    )
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
  const isCritical =
    event.request.mode === 'navigate' ||
    (sameOrigin && /\.(?:html|js|css)$/i.test(url.pathname));

  if (isCritical) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok && sameOrigin) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  if (sameOrigin) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }))
    );
  }
});
