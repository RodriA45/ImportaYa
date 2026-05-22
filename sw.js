// CACHE_VERSION: cambiar este numero fuerza al Service Worker a descartar
// el cache viejo y descargar todos los archivos nuevamente.
const CACHE_NAME = 'importaya-v5';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/tokens.css',
  './css/variables.css',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './css/result.css',
  './css/animations.css',
  './js/config.js',
  './js/state.js',
  './js/calculator.js',
  './js/ui.js',
  './js/api.js',
  './js/main.js',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  // skipWaiting: el nuevo SW toma control inmediatamente sin esperar
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  // Eliminar todos los caches viejos que no sean la version actual
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim()) // Tomar control de todas las pestanas
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Dejar pasar llamadas a APIs externas sin cachear
  const isExternal =
    url.hostname.includes('dolarapi.com') ||
    url.hostname.includes('open.er-api.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com');

  if (isExternal) {
    return; // fetch normal, sin cache
  }

  // Para archivos propios: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
