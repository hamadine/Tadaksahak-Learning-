const cacheName = "tadaksahak-v1";
const assets = [
  "./",
  "./index.html",
  "./style.css
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
  "./data/mots.json
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request);
    })
  );
});
