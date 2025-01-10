const cacheName = "HarvestHub-v1";
const assetsToCache = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/script.js",
    "./img/icon-192x192.png",
    "./img/icon-512x512.png"
];

// Install Service Worker
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName).then((cache) => {
            return Promise.all(
                assetsToCache.map((asset) => {
                    return cache.add(asset).catch((error) => {
                        console.error(`Failed to cache ${asset}:`, error);
                    });
                })
            );
        }).catch((error) => {
            console.error('Failed to open cache:', error);
        })
    );
});

// Fetch from cache
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
