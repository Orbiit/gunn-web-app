/* global XMLHttpRequest, localStorage, fetch */

export { apiKey } from './common.js'

export const firstDay = '2020-08-17T00:00:00.000-07:00'
export const lastDay = '2021-06-03T23:59:59.999-07:00'
export const ALT_KEY = '[gunn-web-app] alts.2020-21.v2'
export const LAST_YEARS_ALT_KEY = '[gunn-web-app] alts.2020-21'
export const schoolTimeZone = 'America/Los_Angeles'
export const googleCalendarId = encodeURIComponent(
  'fg978mo762lqm6get2ubiab0mk0f6m2c@import.calendar.google.com'
)

export const NADA = () => null

export function shuffleInPlace (arr) {
  for (let i = arr.length; i--; ) {
    const index = (Math.random() * (i + 1)) | 0
    ;[arr[i], arr[index]] = [arr[index], arr[i]]
  }
  return arr
}

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
try {
  const { timeZone } = new Intl.DateTimeFormat().resolvedOptions()
  if (timeZone && timeZone !== schoolTimeZone) {
    console.log(
      timeZone,
      "is not Gunn's time zone (",
      schoolTimeZone,
      '), so UGWA will try to simulate it.'
    )
    // Based on https://github.com/tc39/proposal-temporal/blob/f3df34f9d9f7fb69b67caf2a448488ec8518fda6/polyfill/lib/ecmascript.mjs#L979
    const schoolTzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: schoolTimeZone,
      hour12: false,
      era: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    })
    currentTime = () => {
      const now = new Date()
      const datetime = schoolTzFormatter.format(now)
      const [date, fullYear, time] = datetime.split(/,\s+/)
      const [month, day] = date.split(' ')
      const [year, era] = fullYear.split(' ')
      const [hour, minute, second] = time.split(':')
      // Local time for formatter time zone
      return new Date(
        era === 'BC' ? -year + 1 : +year,
        +month - 1,
        +day,
        hour === '24' ? 0 : +hour, // bugs.chromium.org/p/chromium/issues/detail?id=1045791
        +minute,
        +second,
        now.getMilliseconds()
      ).getTime()
    }
  }
} catch (err) {
  window.logError(err)
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

const psaPromise = fetch('./psa/psas.json')
export const isOnline = psaPromise.then(() => true).catch(() => false)
export function getPsas () {
  return psaPromise.then(r => (r.ok ? r.json() : Promise.reject(r.status)))
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

// Should be in hexadecimal for the colour picker
// TEMP: Unity day orange
export const THEME_COLOUR = now().getDate() === 21 && now().getMonth() === 10 - 1 ? '#ff7f4d' : '#ff594c'

const scrim = document.createElement('div')
scrim.className = 'scrim'
let openDialog = null
export function showDialog (dialog) {
  if (openDialog) {
    if (openDialog === dialog) return
    openDialog.classList.remove('show')
  } else {
    if (!scrim.parentNode) {
      document.body.appendChild(scrim)
      // Force repaint
      scrim.getBoundingClientRect()
    }
    scrim.classList.add('show-scrim')
  }
  openDialog = dialog
  dialog.classList.add('show')
}
export function closeDialog () {
  if (openDialog) {
    openDialog.classList.remove('show')
    scrim.classList.remove('show-scrim')
    openDialog = null
  }
}
scrim.addEventListener('click', closeDialog)

let audioCtx
export function getAudioContext () {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}
