// Service worker del Chat IA interno (PWA instalable en Windows / Android).
// DECISION IMPORTANTE: network-first SIEMPRE para el HTML y para Supabase.
// El cache es solo un respaldo para cuando no hay internet — asi el vendedor
// nunca queda atrapado en una version vieja de la app (problema que ya paso
// con el cache del navegador y obligaba a Ctrl+Shift+R).
const CACHE = 'focus-chapi-v2'; // v2: rebranding a CHAPI + iconos amarillos
const SHELL = '/preciointeligente/chat-ia.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // POST a la edge function: siempre directo a la red

  // Network-first: intenta la red, guarda copia fresca, y solo usa cache si no hay internet.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match(SHELL)))
  );
});
