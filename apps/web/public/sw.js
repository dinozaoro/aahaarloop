/* Aahaarloop service worker: cached shell, cache-first assets,
   stale-while-revalidate API data. No external runtime dependency. */
const CACHE_PREFIX = "aahaarloop-";
const CACHE_VERSION = "v1";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const ASSET_PATTERN = /\.(?:png|svg|webp|ico|jpg|jpeg|woff2?|css|js|map)$/i;

function isAsset(pathname) {
  return pathname.startsWith("/_next/static/") || ASSET_PATTERN.test(pathname);
}

async function notify(type, url) {
  const clients = await self.clients.matchAll({ type: "window" });
  const message = url === undefined ? { type } : { type, url };
  for (const client of clients) {
    client.postMessage(message);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => notify("NEW_VERSION_AVAILABLE"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function networkFirst(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(event.request);
    if (response && response.ok) {
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(event.request);
    if (cached) {
      await notify("STALE_DATA", new URL(event.request.url).pathname);
      return cached;
    }
    if (event.request.mode === "navigate") {
      await notify("STALE_DATA", new URL(event.request.url).pathname);
      return (await cache.match("/offline.html")) || Response.error();
    }
    return Response.error();
  }
}

async function cacheFirst(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  if (cached) {
    return cached;
  }
  const response = await fetch(event.request);
  if (response && response.ok) {
    cache.put(event.request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  const network = fetch(event.request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    await notify("STALE_DATA", new URL(event.request.url).pathname);
    return cached;
  }
  const response = await network;
  return response || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event));
  } else if (url.pathname.startsWith("/api/")) {
    event.respondWith(staleWhileRevalidate(event));
  } else if (isAsset(url.pathname)) {
    event.respondWith(cacheFirst(event));
  } else {
    event.respondWith(networkFirst(event));
  }
});
