const CACHE_NAME = 'ugwa-sw-1584149581137';
const urlsToCache = [
  './',
  'images/newmap.min.png',
  'https://fonts.googleapis.com/css?family=Roboto:300,400%7CMaterial+Icons',
  'https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmSU5fBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4WxKOzY.woff2',
  'favicon/android-chrome-192x192.png',
  'favicon/android-chrome-512x512.png',
  'favicon/apple-touch-icon.png',
  'favicon/favicon-32x32.png',
  'favicon/favicon-16x16.png',
  'favicon/manifest.json',
  'favicon/safari-pinned-tab.svg',
  'favicon/favicon.ico',
  'favicon/browserconfig.xml',
  'favicon/mstile-150x150.png',
  'json/clubs.json',
  'json/staff.json',
  'js/languages/en-gt.js',
  'js/languages/fr.js',
  // TEMP?
  'images/false-sense-of-security.svg'
];

function sendError(msg) {
  self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage({error: msg})));
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)).then(() => self.skipWaiting()));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request, {
    ignoreSearch: !e.request.url.includes('fonts.googleapis.com')
  })
    .then(response => response || fetch(e.request)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    // delete old ugwa-sw-* caches
    .then(names => Promise.all(names
      .map(cache => CACHE_NAME !== cache && cache.slice(0, 8) === 'ugwa-sw-'
        ? caches.delete(cache)
        : null)))
    .then(() => self.clients.claim()));
});
self.addEventListener('error', e => {
  sendError(e.error && e.error.stack ? e.error.stack
    : `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
});
self.addEventListener('unhandledrejection', e => {
  sendError(e.reason && (e.reason.stack || e.reason.message || e.reason));
});
