/* ══════════════════════════════════════════════════════
   SERVICE WORKER · Apreciación Musical · Prof. William
   Estrategia: Cache-First con actualización en background
   El alumno siempre tiene la app disponible sin conexión.
   Cuando hay red, se descarga la versión más reciente en
   segundo plano y se activa en la próxima apertura.
══════════════════════════════════════════════════════ */

const CACHE_NAME  = 'musica-v14';
const CACHE_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

/* ── INSTALL: precachear todo el shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_SHELL))
      .then(() => self.skipWaiting())   // activar inmediatamente
  );
});

/* ── ACTIVATE: limpiar cachés viejas ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH: Cache-First con revalidación silenciosa ── */
self.addEventListener('fetch', event => {
  // Solo manejar GET dentro del mismo origen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        // Solicitar versión fresca en background (no bloquea)
        const fetchPromise = fetch(event.request)
          .then(networkResp => {
            if (networkResp && networkResp.status === 200) {
              cache.put(event.request, networkResp.clone());
            }
            return networkResp;
          })
          .catch(() => null);   // sin red: silencioso

        // Responder con caché si existe, si no esperar red
        return cached || fetchPromise;
      })
    )
  );
});

/* ── MENSAJE: forzar actualización desde la app ── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
