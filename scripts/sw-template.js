/* Service worker du Codex d'Albion (généré par scripts/build-standalone.mjs — ne pas éditer sw.js à la main).
 * - Pages : réseau d'abord (toujours la dernière version en ligne), cache en secours hors-ligne.
 * - Audio / icônes : cache d'abord, avec prise en charge des requêtes Range (nécessaire pour Safari).
 */
const CORE_CACHE = 'codex-core-__CORE_VERSION__';
const AUDIO_CACHE = 'codex-audio-__AUDIO_VERSION__';
const CORE_URLS = __CORE_URLS__;
const AUDIO_URLS = __AUDIO_URLS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const core = await caches.open(CORE_CACHE);
      await core.addAll(CORE_URLS);
      const audio = await caches.open(AUDIO_CACHE);
      // Audio : au mieux (un échec réseau ne doit pas empêcher l'installation)
      await Promise.allSettled(
        AUDIO_URLS.map(async (url) => {
          if (await audio.match(url)) return;
          const res = await fetch(url);
          if (res.ok) await audio.put(url, res);
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([CORE_CACHE, AUDIO_CACHE]);
      for (const key of await caches.keys()) {
        if (key.startsWith('codex-') && !keep.has(key)) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

async function rangeResponse(request, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  if (!m) return cached;
  const total = buf.byteLength;
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : total - 1;
  if (!m[1] && m[2]) {
    start = Math.max(0, total - parseInt(m[2], 10));
    end = total - 1;
  }
  end = Math.min(end, total - 1);
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Content-Length': String(end - start + 1)
    }
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CORE_CACHE);
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const fresh = await fetch(request, { signal: controller.signal });
          clearTimeout(timer);
          if (fresh.ok) cache.put(CORE_URLS[0], fresh.clone());
          return fresh;
        } catch (e) {
          return (await cache.match(CORE_URLS[0])) || Response.error();
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) {
        return request.headers.has('range') ? rangeResponse(request, cached) : cached;
      }
      return fetch(request);
    })()
  );
});
