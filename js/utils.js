/* global XMLHttpRequest, localStorage */

export const firstDay = '2020-08-17T00:00:00.000-07:00'
export const lastDay = '2021-06-03T23:59:59.999-07:00'
export const ALT_KEY = '[gunn-web-app] alts.2020-21'
export const LAST_YEARS_ALT_KEY = '[gunn-web-app] alts.2019-20'
export const NADA = () => null
// Using `const` (or `let`) will not set it to `window` so it won't result in
// an infinite recursive loop.
// Alternative methods: use a different name (I'm too lazy to do this though)
export const logError = function (error) {
  window.logError(error)
}
export const cookie = (() => {
  try {
    return localStorage
  } catch (e) {
    logError(e)
    return {
      getItem (a) {
        return cookie[a]
      },
      setItem (a, b) {
        cookie[a] = b
      },
      removeItem (a) {
        delete cookie[a]
      },
      length: 0,
      key () {
        return null
      }
    }
  }
})()
// Current time getters are centralized here so it is easier to simulate a
// different time
export function now () {
  return new Date(currentTime())
}
export let currentTime = () => Date.now()
export function setCurrentTime (newFn) {
  currentTime = newFn
}
export function ajax (url, callback, error) {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.onreadystatechange = () => {
    if (xmlHttp.readyState === 4)
      if (xmlHttp.status === 200) {
        callback(xmlHttp.responseText)
      } else if (error) {
        error(xmlHttp.status)
      }
  }
  xmlHttp.open('GET', url, true)
  xmlHttp.send(null)
}
export function toEach (query, fn) {
  const elems = document.querySelectorAll(query)
  for (let i = 0, len = elems.length; i < len; i++) fn(elems[i], i)
}
export function escapeHTML (text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
export const isAppDesign = window.location.pathname.endsWith('appdesign.html')
  ? '?for=appdesign'
  : ''
export function frame () {
  return new Promise(resolve => window.requestAnimationFrame(resolve))
}
