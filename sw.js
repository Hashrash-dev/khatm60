// Offline support: app shell is cached on install; mushaf images and verse data are cached as you use them.
const VERSION = 'khatm60-v1';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'khatm60-pages' && k !== 'khatm60-api').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Audio streams straight from the network (range requests, large files).
  if (req.destination === 'audio' || url.pathname.endsWith('.mp3')) return;

  // Mushaf page images: cache-first (they never change).
  if (url.origin === location.origin && url.pathname.includes('/s/')) {
    e.respondWith(caches.open('khatm60-pages').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  // Verse/audio-link data from the Quran API: network first, cached copy when offline.
  if (url.hostname === 'api.alquran.cloud') {
    e.respondWith(caches.open('khatm60-api').then(async c => {
      try {
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      } catch (err) {
        const hit = await c.match(req);
        if (hit) return hit;
        throw err;
      }
    }));
    return;
  }

  // App shell: network first so updates arrive, cache when offline.
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
  }
});
