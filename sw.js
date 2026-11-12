// Network first so updates show up straight away; cached copy when offline.
const C = "supernatural-v3";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => c.addAll(["./", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"])));
});
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const put = res => { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); return res; };
  if (/fonts\.(googleapis|gstatic)\.com/.test(r.url)) { // fonts: cache first
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(put)));
  } else if (new URL(r.url).origin === location.origin) {
    e.respondWith(fetch(r, { cache: "no-cache" }).then(put).catch(() => caches.match(r, { ignoreSearch: true }))); // always revalidate, never a stale copy
  }
});
