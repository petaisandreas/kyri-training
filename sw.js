const CFG = { cache: "kyri-v3", skip: ["demo-coach"], offline: "You're offline. Connect to the internet and open KYRI again." }; // build:sw-config
// Network-first service worker: always loads the latest version when online,
// falls back to the last cached copy so the installed app still opens offline.
// Several apps can share one origin (the default client at the root, others in sub-folders):
// each worker only touches its own cache and ignores the paths listed in CFG.skip.
const CACHE = CFG.cache;
const BASE = new URL("./", self.location).pathname;
const SKIP = CFG.skip.map((id) => BASE + id + "/");
// Caches of this app are named "<prefix>-v<N>"; old versions are removed, other apps' caches never.
const OWN = CACHE.replace(/\d+$/, "");
const isOwnOld = (k) => k !== CACHE && k.startsWith(OWN) && /^\d+$/.test(k.slice(OWN.length));

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter(isOwnOld).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (SKIP.some((p) => url.pathname.startsWith(p))) return; // another app living in a sub-folder
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(async () => (await caches.match(req, { ignoreSearch: true, cacheName: CACHE })) || new Response(CFG.offline, { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }))
  );
});
