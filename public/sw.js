const SHELL = 'naje-shell-v10';
const MEDIA = 'naje-media-v1';
const MEDIA_CAP = 150;

const MEDIA_HOST = /(firebasestorage\.googleapis\.com|storage\.googleapis\.com|googleusercontent\.com|ggpht\.com)/i;
// Chrome's WebAPK installer fetches these itself. A worker that answers them
// from cache, or waits on them during install, leaves "Installing…" spinning
// until Android cancels the home-screen install.
const INSTALL_ASSET = /^\/(sw\.js|manifest\.json|manifest\.webmanifest|logo-192\.png|logo-512\.png|logo-512-maskable\.png|icon\.png|apple-touch-icon\.png|favicon\.ico|favicon\.svg)$/;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(storeMediaUrls(event.data.urls));
  }
});

self.addEventListener('install', () => {
  // No waitUntil. cache.addAll('/') never resolved and Chrome waited on it.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.race([
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL && key !== MEDIA && (key.startsWith('naje-') || key.startsWith('naje-ai-')))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })(),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (
      INSTALL_ASSET.test(url.pathname) ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.startsWith('/@') ||
      url.pathname.startsWith('/node_modules/')
    ) {
      return;
    }
    if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
      event.respondWith(networkFirstDocument(request));
      return;
    }
    if (/\.(js|mjs|css)$/i.test(url.pathname)) {
      event.respondWith(networkFirstAsset(request));
      return;
    }
    event.respondWith(cacheFirst(request, SHELL, 0));
    return;
  }

  if (isMedia(request, url)) {
    event.respondWith(cacheFirst(request, MEDIA, MEDIA_CAP));
  }
});

function isMedia(request, url) {
  if (request.destination === 'image') return true;
  if (MEDIA_HOST.test(url.hostname) && /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(url.pathname)) return true;
  return false;
}

async function networkFirstDocument(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    const type = response.headers.get('content-type') || '';
    if (response.ok && type.includes('text/html')) {
      try {
        await cache.put(request, response.clone());
      } catch {
        // A cache failure must not turn a good page into a failed install check.
      }
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
  }
}

async function networkFirstAsset(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    const type = (response.headers.get('content-type') || '').toLowerCase();
    const path = new URL(request.url).pathname;
    const js = /\.(js|mjs)$/i.test(path);
    const okType = js ? type.includes('javascript') || type.includes('ecmascript') : type.includes('css') || type.includes('text/');
    if (response.ok && okType && !type.includes('text/html')) {
      try { await cache.put(request, response.clone()); } catch { /* quota */ }
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return Response.error();
  }
}

async function cacheFirst(request, cacheName, cap) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    refresh(cache, request, cap);
    return cached;
  }
  try {
    const response = await fetch(request);
    await putIfOk(cache, request, response, cap);
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

function refresh(cache, request, cap) {
  fetch(request)
    .then((response) => putIfOk(cache, request, response, cap))
    .catch(() => undefined);
}

async function putIfOk(cache, request, response, cap) {
  if (!response || !(response.ok || response.type === 'opaque')) return;
  try {
    await cache.put(request, response.clone());
    if (cap) await trim(cache, cap);
  } catch {
    // Quota or opaque body. The live response is still returned.
  }
}

async function trim(cache, cap) {
  const keys = await cache.keys();
  if (keys.length <= cap) return;
  await Promise.all(keys.slice(0, keys.length - cap).map((key) => cache.delete(key)));
}

async function storeMediaUrls(urls) {
  const cache = await caches.open(MEDIA);
  for (const raw of urls.slice(0, 60)) {
    if (typeof raw !== 'string' || !/^https?:\/\//i.test(raw)) continue;
    try {
      if (await cache.match(raw)) continue;
      const response = await fetch(raw, { mode: 'no-cors' });
      await putIfOk(cache, raw, response, MEDIA_CAP);
    } catch {
      // Ignore a single image that cannot be stored.
    }
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'إشعار جديد من ناجي', body: '', url: '/' };
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
      if (parsed.notification) {
        if (parsed.notification.title) data.title = parsed.notification.title;
        if (parsed.notification.body) data.body = parsed.notification.body;
      }
      if (parsed.fcmOptions?.link) data.url = parsed.fcmOptions.link;
      else if (parsed.data?.url) data.url = parsed.data.url;
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(self.registration.showNotification(data.title || 'ناجي AI', {
    body: data.body || data.message || '',
    icon: '/logo-192.png',
    badge: '/favicon.svg',
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
