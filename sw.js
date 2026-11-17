// VERSIÓN: v106 — Soporte 100% Offline con dependencias locales
// Estrategia: NETWORK FIRST — jamás sirve caché vieja cuando la red responde, pero garantiza offline total.
const CACHE_NAME = 'aula360-v111';
const STATIC_ASSETS = [
  'index.html',
  'style.css',
  'auth.js',
  'student_avatars.js',
  'app_greeting.js',
  'diagnosticas_catalog.js',
  'app.js',
  'honduras_geo.js',
  'normativas_sace.js',
  'auto_backup.js',
  'store.js',
  'ui.js',
  'router.js',
  'sace.js',
  'sace_logic.js',
  'reportes.js',
  'libreria.js',
  'rid.js',
  'evaluacion_v2.js',
  'banco_rubricas.js',
  'conducta.js',
  'cuadro_sace.js',
  'pruebas_diagnosticas.js',
  'pruebas_formativas.js',
  'bitacora.js',
    'equipos_trabajo.js',
  'organizacion_grado.js',
  'reporte_parcial.js',
  'crypto-js.min.js',
  'xlsx.full.min.js',
  'lucide.min.js',
  'chart.min.js',
  'sweetalert2.all.min.js',
  'html2pdf.bundle.min.js',
  'pdf.min.js',
  'pdf.worker.min.js',
  'html2canvas.min.js',
  'assets/fonts/outfit.css',
  'assets/fonts/outfit-latin.woff2',
  'logotipo_horizontal.svg',
  'logo.png',
  'logo-192.png',
  'logo-512.png',
  'manifest.json'
];

// INSTALACIÓN: pre-cachear todos los assets críticos locales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))))
      .catch(err => console.warn('[SW] Error pre-cacheando assets:', err))
  );
  self.skipWaiting(); // Tomar control inmediatamente sin esperar
});

// ACTIVACIÓN: borrar cachés antiguas de versiones previas y reclamar clientes
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: NETWORK FIRST con respaldo en caché para modo 100% offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // Fallback a index.html si es una navegación HTML
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('index.html');
          }
        });
      })
  );
});
