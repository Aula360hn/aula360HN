// VERSIÓN: v99 — FORZAR ACTUALIZACIÓN COMPLETA EN ANDROID
// Estrategia: NETWORK FIRST — jamás sirve caché vieja cuando la red responde.
const CACHE_NAME = 'aula360-v105';
const STATIC_ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'libreria.js',
  'rid.js',
  'evaluacion_v2.js',
  'seed_rubricas.js',
  'banco_rubricas.js',
  'logotipo_horizontal.svg',
  'logo.png',
  'logo-192.png',
  'logo-512.png',
  'manifest.json'
];

// INSTALACIÓN: borramos TODO primero, luego cacheamos los nuevos assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => caches.open(CACHE_NAME))
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // Tomar control inmediatamente sin esperar
});

// ACTIVACIÓN: borrar todas las cachés antiguas y reclamar clientes
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim()) // Tomar control de todas las pestañas/vistas abiertas
  );
});

// FETCH: NETWORK FIRST — intenta la red primero, solo usa caché si no hay red
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Red disponible: actualizar caché y devolver respuesta fresca
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Sin red: usar caché como respaldo
        return caches.match(event.request);
      })
  );
});
