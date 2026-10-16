/* Juntada PWA — shell cache + offline + Web Push (iOS/Android). */
const CACHE = "juntada-shell-v3";
const PRECACHE = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
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
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.includes("_next/data")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() => caches.match("/offline.html")),
    );
    return;
  }

  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/offline.html"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Aviso del grupo",
    body: "Abrí Juntada para ver el detalle",
    url: "/app/notifications",
    tag: "juntada",
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.title === "string" && parsed.title.trim()) {
          data.title = parsed.title.trim();
        }
        if (typeof parsed.body === "string" && parsed.body.trim()) {
          data.body = parsed.body.trim();
        } else if (typeof parsed.body === "string") {
          data.body = "Abrí Juntada para ver el detalle";
        }
        if (typeof parsed.url === "string" && parsed.url.trim()) {
          data.url = parsed.url.trim();
        }
        if (typeof parsed.tag === "string" && parsed.tag.trim()) {
          data.tag = parsed.tag.trim();
        }
      }
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text && text.trim()) data.body = text.trim();
    } catch {
      /* ignore */
    }
  }

  // Evitar "Juntada from Juntada" en iOS: título ≠ nombre de la app si el body vacío
  const title =
    data.title && data.title !== "Juntada" ? data.title : "Aviso del grupo";
  const body = data.body || "Abrí Juntada para ver el detalle";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "juntada",
      data: { url: data.url || "/app/notifications" },
      renotify: true,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) ||
    "/app/notifications";
  const abs = new URL(target, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(abs);
            } catch {
              /* older browsers */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(abs);
    })(),
  );
});
