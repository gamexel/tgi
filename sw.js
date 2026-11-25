/* The manifest is generated from the shipped files by scripts/build.mjs. */
importScripts('./offline-manifest.js');
const config = self.TGI_OFFLINE;
const coreCache = 'tgi-core-' + config.coreVersion;
const mediaCache = 'tgi-media-' + config.mediaVersion;
const absolute = path => new URL(path, self.registration.scope).href;
const coreURLs = new Set(config.shell.map(absolute));
const mediaURLs = new Set(config.assets.map(absolute));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(coreCache).then(cache => cache.addAll(config.shell.map(path => new Request(absolute(path), { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => (key.startsWith('tgi-core-') || key.startsWith('tgi-media-')) && key !== coreCache && key !== mediaCache).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.get('X-TGI-Download') === '1') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && (url.pathname === new URL('./', self.registration.scope).pathname || url.pathname === new URL('index.html', self.registration.scope).pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(coreCache);
      return await cache.match(absolute('index.html')) || fetch(request);
    })());
    return;
  }
  if (!coreURLs.has(url.href) && !mediaURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(coreURLs.has(url.href) ? coreCache : mediaCache);
    const saved = await cache.match(request);
    if (saved) return saved;
    try {
      const response = await fetch(request);
      if (response.ok) {
        // A full device must not prevent online reading.
        try { await cache.put(request, response.clone()); } catch {}
      }
      return response;
    } catch {
      return new Response('Este archivo todavía no está descargado. Conectate y descargá la biblioteca desde las opciones de TGI.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
