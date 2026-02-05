const CACHE = 'nomber-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        './',
        './index.html',
        './styles.css',
        './app.js',
        './icons/android-chrome-192x192.png',
        './icons/android-chrome-512x512.png',
        './icons/favicon.ico',
        './manifest.json',
        './service-worker.js'
      ])
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
