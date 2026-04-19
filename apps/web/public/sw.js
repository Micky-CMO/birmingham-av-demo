/**
 * Birmingham AV service worker.
 *
 * Strategy:
 * - Precache the app shell, including the /offline fallback page.
 * - Stale-while-revalidate for static assets (CSS, JS, fonts, images).
 * - Network-first for HTML and API responses (so admin data stays fresh).
 * - Navigation failures fall back to /offline (cached), not /.
 *
 * Versioned via CACHE_NAME — bump on each release to invalidate old caches.
 */

const CACHE_NAME = 'bav-cache-v2';
const OFFLINE_URL = '/offline';
const SHELL = [
  '/',
  '/shop',
  '/offline',
  '/manifest.webmanifest',
  '/brand/logo.png',
  '/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // /offline itself: cache-first so the shell is always available.
  if (url.pathname === OFFLINE_URL) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ??
          fetch(req)
            .then((res) => {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => undefined);
              return res;
            })
            .catch(() => caches.match(OFFLINE_URL)),
      ),
    );
    return;
  }

  // Network-first for API + HTML, falls back to cache, falls back to /offline.
  if (req.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(async () => (await caches.match(req)) ?? caches.match(OFFLINE_URL) ?? caches.match('/')),
    );
    return;
  }

  // Stale-while-revalidate for static assets.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => cached);
      return cached ?? fetched;
    }),
  );
});
