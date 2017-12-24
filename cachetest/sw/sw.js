const CACHE_NAME = 'swtest-v1', // change to update assets
urlsToCache = [
  './',
  'swtest.css',
  'swtest.js',
  'swtest.txt',
  'https://fonts.googleapis.com/css?family=Libre+Barcode+128+Text'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(e.request);
      }
    )
  );
});
