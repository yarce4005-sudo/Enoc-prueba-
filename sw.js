/* ENOC Admin · Service Worker para PWA y Web Push.
   No cachea HTML autenticado, API, sesión ni datos privados.
*/
const CACHE_NAME = "enoc-admin-shell-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("enoc-admin-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      if (event.data) payload = event.data.json();
    } catch (_) {
      try { payload = { body: event.data ? event.data.text() : "" }; }
      catch (_) { payload = {}; }
    }

    const title = payload.title || "ENOC · Nuevo pedido";
    const options = {
      body: payload.body || payload.message || "Tienes una nueva actividad en tu tienda.",
      tag: payload.tag || "enoc-new-order",
      renotify: true,
      data: { url: payload.url || "./admin.html" }
    };
    if (payload.icon) options.icon = payload.icon;
    if (payload.badge) options.badge = payload.badge;

    await self.registration.showNotification(title, options);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const requested = event.notification?.data?.url || "./admin.html";
    let target;
    try {
      const parsed = new URL(requested, self.location.origin);
      target = parsed.origin === self.location.origin ? parsed.href : new URL("./admin.html", self.location.origin).href;
    } catch (_) {
      target = new URL("./admin.html", self.location.origin).href;
    }

    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client && client.url !== target) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
