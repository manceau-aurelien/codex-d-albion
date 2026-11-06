/* Service worker du Codex d'Albion (généré par scripts/build-standalone.mjs — ne pas éditer sw.js à la main).
 * - Pages : réseau d'abord (toujours la dernière version en ligne), cache en secours hors-ligne.
 * - Audio / icônes : cache d'abord, avec prise en charge des requêtes Range (nécessaire pour Safari).
 */
const CORE_CACHE = 'codex-core-b75cce08b9';
const AUDIO_CACHE = 'codex-audio-ba15bb6f2e';
const CORE_URLS = ["./index.html","./manifest.webmanifest","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
const AUDIO_URLS = ["./audio/tier1/boss_10_main.mp3","./audio/tier1/boss_1_main.mp3","./audio/tier1/boss_1_var.mp3","./audio/tier1/boss_2_main.mp3","./audio/tier1/boss_3_main.mp3","./audio/tier1/boss_3_var.mp3","./audio/tier1/boss_4_main.mp3","./audio/tier1/boss_4_var.mp3","./audio/tier1/boss_5_main.mp3","./audio/tier1/boss_6_main.mp3","./audio/tier1/boss_6_var.mp3","./audio/tier1/boss_7_main.mp3","./audio/tier1/boss_8_main.mp3","./audio/tier1/boss_9_main.mp3","./audio/tier1/boss_9_var.mp3","./audio/tier1/boss_slow_10_main.mp3","./audio/tier1/boss_slow_1_main.mp3","./audio/tier1/boss_slow_1_var.mp3","./audio/tier1/boss_slow_2_main.mp3","./audio/tier1/boss_slow_3_main.mp3","./audio/tier1/boss_slow_3_var.mp3","./audio/tier1/boss_slow_4_main.mp3","./audio/tier1/boss_slow_4_var.mp3","./audio/tier1/boss_slow_5_main.mp3","./audio/tier1/boss_slow_6_main.mp3","./audio/tier1/boss_slow_6_var.mp3","./audio/tier1/boss_slow_7_main.mp3","./audio/tier1/boss_slow_8_main.mp3","./audio/tier1/boss_slow_9_main.mp3","./audio/tier1/boss_slow_9_var.mp3","./audio/tier1/uk_b_a.mp3","./audio/tier1/uk_b_actually.mp3","./audio/tier1/uk_b_afraid.mp3","./audio/tier1/uk_b_am.mp3","./audio/tier1/uk_b_are.mp3","./audio/tier1/uk_b_big.mp3","./audio/tier1/uk_b_cold.mp3","./audio/tier1/uk_b_door.mp3","./audio/tier1/uk_b_guard.mp3","./audio/tier1/uk_b_have.mp3","./audio/tier1/uk_b_he.mp3","./audio/tier1/uk_b_here.mp3","./audio/tier1/uk_b_i.mp3","./audio/tier1/uk_b_is.mp3","./audio/tier1/uk_b_it.mp3","./audio/tier1/uk_b_keep.mp3","./audio/tier1/uk_b_key.mp3","./audio/tier1/uk_b_not.mp3","./audio/tier1/uk_b_old.mp3","./audio/tier1/uk_b_one.mp3","./audio/tier1/uk_b_open.mp3","./audio/tier1/uk_b_see.mp3","./audio/tier1/uk_b_shadow.mp3","./audio/tier1/uk_b_she.mp3","./audio/tier1/uk_b_small.mp3","./audio/tier1/uk_b_stone.mp3","./audio/tier1/uk_b_the.mp3","./audio/tier1/uk_b_they.mp3","./audio/tier1/uk_b_three.mp3","./audio/tier1/uk_b_wait.mp3","./audio/tier1/uk_b_way.mp3","./audio/tier1/uk_b_you.mp3","./audio/tier1/us_b_a.mp3","./audio/tier1/us_b_actually.mp3","./audio/tier1/us_b_afraid.mp3","./audio/tier1/us_b_am.mp3","./audio/tier1/us_b_are.mp3","./audio/tier1/us_b_big.mp3","./audio/tier1/us_b_cold.mp3","./audio/tier1/us_b_door.mp3","./audio/tier1/us_b_guard.mp3","./audio/tier1/us_b_have.mp3","./audio/tier1/us_b_he.mp3","./audio/tier1/us_b_here.mp3","./audio/tier1/us_b_i.mp3","./audio/tier1/us_b_is.mp3","./audio/tier1/us_b_it.mp3","./audio/tier1/us_b_keep.mp3","./audio/tier1/us_b_key.mp3","./audio/tier1/us_b_not.mp3","./audio/tier1/us_b_old.mp3","./audio/tier1/us_b_one.mp3","./audio/tier1/us_b_open.mp3","./audio/tier1/us_b_see.mp3","./audio/tier1/us_b_shadow.mp3","./audio/tier1/us_b_she.mp3","./audio/tier1/us_b_small.mp3","./audio/tier1/us_b_stone.mp3","./audio/tier1/us_b_the.mp3","./audio/tier1/us_b_they.mp3","./audio/tier1/us_b_three.mp3","./audio/tier1/us_b_wait.mp3","./audio/tier1/us_b_way.mp3","./audio/tier1/us_b_you.mp3"];

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
