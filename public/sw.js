const CACHE_NAME = 'naje-ai-cache-v2';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls.
  if (url.pathname.startsWith('/api/')) return;

  // NETWORK-FIRST for navigations / the HTML shell — prevents stale index.html
  // pointing at deleted hashed JS (the white-screen bug).
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Cache-first for everything else (hashed immutable assets are safe).
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Push Notification Handler for Mobile & Desktop Native System Tray
self.addEventListener('push', (event) => {
  let data = { title: 'إشعار جديد من ناجي الذكي ⚡', body: '', url: '/' };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      if (parsed.notification) {
        if (parsed.notification.title) data.title = parsed.notification.title;
        if (parsed.notification.body) data.body = parsed.notification.body;
      }
      if (parsed.fcmOptions?.link) {
        data.url = parsed.fcmOptions.link;
      } else if (parsed.data?.url) {
        data.url = parsed.data.url;
      }
    } catch (e) {
      data.body = event.data.text();
    }
  }
  const options = {
    body: data.body || data.message || '',
    icon: '/logo-192.png',
    badge: '/favicon.svg',
    vibrate: [150, 80, 150],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'ناجي AI', options));
});

// Handle clicking on native notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
