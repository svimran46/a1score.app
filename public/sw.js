// Simple, resilient Service Worker for a1score PWA
const CACHE_NAME = "a1score-v1";
const OFFLINE_URLS = ["/", "/matches", "/players", "/clubs", "/leagues"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[PWA SW] Pre-caching failed partially:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback for HTML and assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Don't intercept API calls, dynamic edge proxies or POST requests
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/img/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses for offline access
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Fallback for navigation requests
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});
