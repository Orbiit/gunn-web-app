const VERSION = 24;
const CACHE_NAME = "ugwita-cache-v" + VERSION, // change cache name to force update
urlsToCache = [
  "./",
  "index.html",
  "../js/altScheduleGenerator.js",
  "data.js",
  "main.js",
  "pretty.css"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});
self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
  self.clients.matchAll().then(clients => clients.forEach(c => c.postMessage(VERSION)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(names => Promise.all(names.map(cache => CACHE_NAME !== cache ? caches.delete(cache) : undefined))));
});
