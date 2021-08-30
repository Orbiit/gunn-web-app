/* eslint-env serviceworker */

const CACHE_NAME = 'ugwa-sw-1630301124050'
const urlsToCache = [
  './',
  'images/newmap.min.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400&family=Material+Icons&display=swap',
  'https://fonts.gstatic.com/s/materialicons/v88/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
  'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2',
  'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmSU5fBBc4.woff2',
  'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4WxKOzY.woff2',
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
  'js/languages/en-gt-core.js',
  'js/languages/fr.js',
  'json/alt-schedules-2020.txt',
  'images/sheep-black.png',
  'images/sheep-white.png',
  'images/gunn-together.svg',
  'images/grad.svg',
  'json/alternatives.json',
  'images/watt-resized.png',
  'images/hc-temp.jpg',
  'images/cc-temp.jpg'
  // 'images/hwbounty-temp.jpg'
]

function sendError (msg) {
  self.clients
    .matchAll()
    .then(clients => clients.forEach(c => c.postMessage({ error: msg })))
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)
  e.respondWith(
    caches
      .match(e.request, {
        ignoreSearch:
          // Allow URL parameters
          url.pathname.endsWith('/gunn-web-app/') ||
          // Allow adding a query to bypass cache
          url.pathname.startsWith('/gunn-web-app/.period-images/')
      })
      .then(response => response || fetch(e.request))
      .then(response => {
        // status is 0 for opaque responses (eg for images)
        if (
          !response.ok &&
          response.status !== 0 &&
          url.hostname !== 'discord.com'
        ) {
          sendError(`[${url}] HTTP ${response.status}`)
        }
        return response
      })
      .catch(async err => {
        if (err) err.ignore = true
        // Ignore errors from tracking requests
        if (url.hostname !== 'discord.com') {
          // Don't `await` so that error sending can be done in parallel
          sendError(`[${url}] ${err && (err.stack || err.message || err)}`)
        }
        throw err
      })
  )
})
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      // delete old ugwa-sw-* caches
      .then(names =>
        Promise.all(
          names.map(cache =>
            CACHE_NAME !== cache && cache.slice(0, 8) === 'ugwa-sw-'
              ? caches.delete(cache)
              : null
          )
        )
      )
      .then(() => self.clients.claim())
  )
})
self.addEventListener('notificationclick', e => {
  const url = e.notification.data && e.notification.data.link
  if (url) {
    e.waitUntil(clients.openWindow(url))
  }
})
self.addEventListener('error', err => {
  if (err.error && err.error.ignore) return
  sendError(
    err.error && err.error.stack
      ? err.error.stack
      : `${err.message} at ${err.filename}:${err.lineno}:${err.colno}`
  )
})
self.addEventListener('unhandledrejection', err => {
  if (err.reason && err.reason.ignore) return
  sendError(
    err.reason && (err.reason.stack || err.reason.message || err.reason)
  )
})
