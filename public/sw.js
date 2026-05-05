const SHELL_CACHE  = 'focus-shell-v2';
const STATIC_CACHE = 'focus-static-v2';
const API_CACHE    = 'focus-api-v2';
const ALL_CACHES   = [SHELL_CACHE, STATIC_CACHE, API_CACHE];

const APP_SHELL = ['/', '/index.html', '/manifest.json'];
const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(self.location.hostname);

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', event => {
  if (IS_LOCALHOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: purge old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  if (IS_LOCALHOST) {
    event.waitUntil(
      caches.keys()
        .then(names => Promise.all(names.filter(name => name.startsWith('focus-')).map(name => caches.delete(name))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.matchAll({ type: 'window' }))
        .then(clients => Promise.all(clients.map(client => client.navigate(client.url))))
    );
    return;
  }

  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(n => !ALL_CACHES.includes(n))
          .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (IS_LOCALHOST) return;

  const { request } = event;
  const url = new URL(request.url);

  if (!['http:', 'https:'].includes(url.protocol)) return;

  // External APIs: network-first, fall back to cache (weather, seatgeek, gemini)
  if (
    url.hostname === 'api.open-meteo.com' ||
    url.hostname === 'api.seatgeek.com'   ||
    url.hostname.includes('googleapis')
  ) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 60 * 60 * 1000));
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    request.destination === 'script'  ||
    request.destination === 'style'   ||
    request.destination === 'font'    ||
    request.destination === 'image'   ||
    url.pathname.match(/\.(js|css|woff2?|png|svg|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation / HTML: stale-while-revalidate using app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(cached =>
        cached ?? fetch(request)
      )
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(networkFirstWithCache(request, SHELL_CACHE));
});

// ── Strategy helpers ──────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && isHttpRequest(request)) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithCache(request, cacheName, maxAgeMs = Infinity) {
  try {
    const response = await fetch(request);
    if (response.ok && isHttpRequest(request)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      // Honour max-age for API responses
      const dateHeader = cached.headers.get('date');
      if (dateHeader && maxAgeMs !== Infinity) {
        const age = Date.now() - new Date(dateHeader).getTime();
        if (age > maxAgeMs) return new Response(null, { status: 503 });
      }
      return cached;
    }
    return new Response(null, { status: 503, statusText: 'Offline' });
  }
}

function isHttpRequest(request) {
  const url = new URL(request.url);
  return ['http:', 'https:'].includes(url.protocol);
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const body = event.data ? event.data.text() : 'Nuevo evento local encontrado!';
  event.waitUntil(
    self.registration.showNotification('FOCO — Nuevo Evento', {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
