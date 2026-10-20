// Network-first service worker: always loads the latest version when online,
// falls back to the last cached copy so the installed app still opens offline.
const CACHE = "kyri-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => (await caches.match(req, { ignoreSearch: true })) || new Response("You're offline. Connect to the internet and open the app again.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))
  );
});
