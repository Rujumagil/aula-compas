const CACHE='aula-compas-v3-logo-oficial';
const ASSETS=[
'./','./index.html','./styles.css','./data.js','./app.js','./manifest.json',
'./assets/logo.webp','./assets/logo-texto-oficial.png','./assets/logo-completo-oficial.png','./assets/icono-oficial.png','./assets/icon-192.png','./assets/icon-512.png',
'./assets/hero-lanzamiento.webp','./assets/curso-compas.webp','./assets/curso-memoria.webp',
'./assets/curso-legado.webp','./assets/curso-mes.webp','./assets/curso-historia.webp',
'./assets/curso-ia.webp','./assets/recurso-manual.webp','./assets/recurso-cuentos.webp','./assets/ruben.webp'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>caches.match('./index.html'))));});