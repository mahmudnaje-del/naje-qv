import { useEffect, useState } from 'react';

export const SHELL_CACHE = 'naje-shell-v8';
export const MEDIA_CACHE = 'naje-media-v1';

export function useOnline() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

const STUDIO_LOADERS = [
  () => import('../pages/CreativelyAI'),
  () => import('../pages/NajeAd'),
  () => import('../pages/NajeIdent'),
  () => import('../pages/NajeCv'),
  () => import('../pages/NajeAgent'),
  () => import('../pages/NajePrompt'),
  () => import('../pages/NajeDeveloper'),
  () => import('../pages/NajeSource'),
  () => import('../pages/Store'),
];

let warming = false;

/** After a signed-in online visit, keep the shell, studios, and seen images on disk. */
export function scheduleOfflineWarm() {
  if (import.meta.env.DEV || typeof window === 'undefined' || !navigator.onLine) return;
  const run = () => {
    void warmOfflineShell();
  };
  window.setTimeout(run, 1600);
}

async function warmOfflineShell() {
  if (warming || !('caches' in window) || !navigator.onLine) return;
  warming = true;
  try {
    for (const load of STUDIO_LOADERS) {
      try {
        await load();
      } catch {
        // A studio chunk can fail without blocking the rest.
      }
    }
    const cache = await caches.open(SHELL_CACHE);
    const urls = new Set<string>(['/', '/index.html', '/manifest.json', '/logo-192.png', '/logo-512.png', '/favicon.svg']);
    performance.getEntriesByType('resource').forEach((entry) => {
      try {
        const url = new URL(entry.name);
        if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
        if (/\.(js|css|woff2?|svg|png|webp|ico)$/i.test(url.pathname)) urls.add(entry.name);
      } catch {
        // Ignore odd resource names.
      }
    });
    await Promise.all([...urls].map(async (url) => {
      try {
        if (await cache.match(url)) return;
        const response = await fetch(url, { credentials: 'same-origin' });
        if (response.ok) await cache.put(url, response);
      } catch {
        // Leave this asset for the next online visit.
      }
    }));
  } finally {
    warming = false;
  }
}

export function rememberMedia(urls: Array<string | null | undefined>) {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.onLine) return;
  const list = [...new Set(urls.filter((url): url is string =>
    typeof url === 'string' && /^https?:\/\//i.test(url) && !/\.(mp4|webm|mov)(\?|$)/i.test(url)
  ))].slice(0, 60);
  if (!list.length) return;
  const controller = navigator.serviceWorker?.controller;
  if (controller) {
    controller.postMessage({ type: 'CACHE_URLS', urls: list });
    return;
  }
  void (async () => {
    try {
      const cache = await caches.open(MEDIA_CACHE);
      for (const url of list) {
        if (await cache.match(url)) continue;
        const response = await fetch(url, { mode: 'no-cors' });
        if (response.ok || response.type === 'opaque') await cache.put(url, response);
      }
    } catch {
      // Images stay available from Firestore when they were stored inline.
    }
  })();
}
