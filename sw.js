self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('artyomcut-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/style.css',
        '/script.js',
        '/translations.js',
        '/i18n.js',
        '/gallery.html',
        '/reviews.html',
        '/location.html',
        '/images/logo/logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
