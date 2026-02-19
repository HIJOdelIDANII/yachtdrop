/**
 * YachtDrop Service Worker — Offline-first caching for patchy marina signals.
 *
 * Strategy:
 * - App shell (HTML, CSS, JS, fonts): Cache-first with network fallback.
 *   These rarely change and are critical for the "instant load" app feel.
 * - API responses (products, categories, search): Stale-while-revalidate.
 *   Show cached data immediately, refresh in background.
 * - Images: Cache-first with size limit (200 entries max) to avoid
 *   filling the device storage with product thumbnails.
 * - Orders API: Network-first (always needs fresh data).
 *
 * Cache versioning: Bump CACHE_VERSION when deploying breaking changes
 * to force a full cache clear on next SW activation.
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `yachtdrop-static-${CACHE_VERSION}`;
const API_CACHE = `yachtdrop-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `yachtdrop-images-${CACHE_VERSION}`;

const MAX_IMAGE_CACHE_ENTRIES = 200;

// App shell resources to precache on install
const PRECACHE_URLS = [
  "/",
  "/browse",
  "/search",
  "/orders",
  "/manifest.json",
  "/brand/logo.png",
];

// ─── Install: precache app shell ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ─────────────────────────────────
self.addEventListener("activate", (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => !currentCaches.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: route requests to appropriate strategy ──────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST orders, etc.)
  if (request.method !== "GET") return;

  // Orders API — network-first (always needs fresh status)
  if (url.pathname.startsWith("/api/orders")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Other API routes — stale-while-revalidate
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Product images from nautichandler — cache-first with eviction
  if (
    url.hostname === "nautichandler.com" ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico)$/i)
  ) {
    event.respondWith(cacheFirstWithLimit(request, IMAGE_CACHE, MAX_IMAGE_CACHE_ENTRIES));
    return;
  }

  // Everything else (app shell, Next.js chunks) — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

// ─── Strategies ─────────────────────────────────────────────────

/** Return cached response immediately, update cache in background */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fire network request in background regardless
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached if available, otherwise wait for network
  return cached || (await networkPromise) || offlineFallback();
}

/** Try network first, fall back to cache */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || offlineFallback();
  }
}

/** Return from cache if available, otherwise fetch and cache */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineFallback();
  }
}

/** Cache-first with LRU eviction to prevent unbounded image cache growth */
async function cacheFirstWithLimit(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());

      // Evict oldest entries if over limit
      const keys = await cache.keys();
      if (keys.length > maxEntries) {
        const toDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(toDelete.map((key) => cache.delete(key)));
      }
    }
    return response;
  } catch {
    // Return a transparent 1x1 pixel for broken images
    return new Response(
      new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80,
        0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
      ]),
      { headers: { "Content-Type": "image/gif" } }
    );
  }
}

/** Minimal offline fallback response */
function offlineFallback() {
  return new Response(
    JSON.stringify({ error: "You appear to be offline", code: "OFFLINE" }),
    {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }
  );
}
