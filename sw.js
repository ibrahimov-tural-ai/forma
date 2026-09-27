// Forma proqramı — oflayn işləmə faylı. Proqramı yeniləyəndə VERSION rəqəmini artırın.
const VERSION = "forma-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return; // YouTube linkləri və s. adi qaydada açılır
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const cached = await cache.match(req, { ignoreSearch: sameOrigin });
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(net); return cached; }
      const res = await net;
      if (res) return res;
      if (req.mode === "navigate") return (await cache.match("./index.html")) || Response.error();
      return Response.error();
    })
  );
});
