// Resilient Service Worker for a1score PWA
// Handles offline caching, Web Push notifications, and notification click navigation

const CACHE_NAME = "a1score-v1";
const OFFLINE_URLS = ["/", "/matches", "/players", "/clubs", "/leagues", "/values", "/watchlist"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[PWA SW] Pre-caching completed with partial network bypass:", err);
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

  // Don't intercept API calls, dynamic edge proxies, or POST requests
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
        if (request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503, statusText: "Offline" });
      })
  );
});

// Push Notification Handler for Value Updates
self.addEventListener("push", (event) => {
  let payload = {
    title: "Value update",
    body: "A player you follow had a market valuation update.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: "/watchlist" },
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const title = payload.title || "Value update";
  const options = {
    body: payload.body || "A player you follow had a market valuation update.",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "value-update",
    data: payload.data || { url: "/watchlist" },
    vibrate: [100, 50, 100],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler: Focuses or opens the player or watchlist page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || "/watchlist";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 1. Focus matching existing tab if already open
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // 2. Otherwise focus first open a1score tab and navigate
      for (const client of clientList) {
        if ("focus" in client && "navigate" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 3. Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Automatic re-subscription when browser subscription changes or expires
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(
        event.oldSubscription?.options || {
          userVisibleOnly: true,
          // Browser will retain applicationServerKey from previous subscription
        }
      )
      .then((newSubscription) => {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: newSubscription.toJSON(),
          }),
        });
      })
      .catch((err) => {
        console.warn("[PWA SW] pushsubscriptionchange re-subscription failed:", err);
      })
  );
});

