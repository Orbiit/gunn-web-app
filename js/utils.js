/* global XMLHttpRequest, localStorage, fetch */

export { apiKey } from './common.js'

export const firstDay = '2021-08-11T00:00:00.000-07:00'
export const lastDay = '2022-06-02T23:59:59.999-07:00'
export const ALT_KEY = '[gunn-web-app] alts.2021-22'
export const LAST_YEARS_ALT_KEY = '[gunn-web-app] alts.2020-21.v3'
export const schoolTimeZone = 'America/Los_Angeles'
export const googleCalendarId = encodeURIComponent(
  'fg978mo762lqm6get2ubiab0mk0f6m2c@import.calendar.google.com'
)

export const NADA = () => null
export const identity = value => value

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
export function loadJsonWithDefault (
  json,
  defaultVal = {},
  validate = value => typeof value === 'object'
) {
  try {
    const parsed = JSON.parse(json)
    if (validate(parsed)) {
      return parsed
    } else {
      return defaultVal
    }
  } catch (err) {
    logError(err)
    return defaultVal
  }
}
export function loadJsonStorage (key, defaultVal = {}, { validate } = {}) {
  const value = cookie.getItem(key)
  if (!value) return defaultVal
  return loadJsonWithDefault(value, defaultVal, validate)
}

// Current time getters are centralized here so it is easier to simulate a
// different time
export function now () {
  return new Date(currentTime())
}
export let currentTime = () => Date.now()
export function setCurrentTime (newFn) {
  currentTime = newFn
}
export let outsideSchool = null
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
    /**
     * Converts a Date object to the school's time zone such that Date methods
     * like .getHours() etc. will be in the school's time zone.
     * @param {Date} dateObj - The Date object in the user's local time zone.
     * @return {Date} The Date object with values from the school's time zone.
     */
    const timeAtSchool = function timeAtSchool (dateObj) {
      const datetime = schoolTzFormatter.format(dateObj)
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
        dateObj.getMilliseconds()
      )
    }
    /**
     * Reverses timeAtSchool.
     *
     * NOTE: Not perfect around daylight saving changes. For example,
     *
     * @example (Taipei time)
     * timeAtSchool(timeFromSchool(new Date(2020, 10, 1, 3)))
     * // -> Sun Nov 01 2020 02:00:00 GMT+0800 (Taipei Standard Time)
     * VS
     * timeAtSchool(timeFromSchool(new Date(2020, 10, 2, 3)))
     * // -> Mon Nov 02 2020 03:00:00 GMT+0800 (Taipei Standard Time)
     *
     * @param {Date} dateObj - School time Date.
     * @return {Date} User local time Date.
     */
    const timeFromSchool = function timeFromSchool (dateObj) {
      const offset = dateObj.getTime() - timeAtSchool(dateObj).getTime()
      const proposal = new Date(dateObj.getTime() + offset)
      return proposal
    }
    currentTime = () => {
      return timeAtSchool(new Date()).getTime()
    }
    outsideSchool = timeFromSchool
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
export const THEME_COLOUR = '#ff594c'

const scrim = document.createElement('div')
scrim.className = 'scrim'
let openDialog = null
export function showDialog (dialog) {
  if (openDialog) {
    if (openDialog.dialog === dialog) return
    openDialog.dialog.classList.remove('show')
    openDialog.onClose()
  } else {
    if (!scrim.parentNode) {
      document.body.appendChild(scrim)
      // Force repaint
      scrim.getBoundingClientRect()
    }
    scrim.classList.add('show-scrim')
  }
  openDialog = { dialog }
  const closePromise = new Promise(resolve => {
    openDialog.onClose = resolve
  })
  if (dialog.classList.contains('dialog-hidden')) {
    dialog.classList.remove('dialog-hidden')
    window.requestAnimationFrame(() => {
      dialog.classList.add('show')
    })
  } else {
    dialog.classList.add('show')
  }
  return closePromise
}
export function closeDialog () {
  if (openDialog) {
    openDialog.dialog.classList.remove('show')
    openDialog.onClose()
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

export function generateID () {
  return (
    currentTime().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  )
}

// Seeded random function
// mulberry32 - an actual high quality 32-bit generator
// From https://gist.github.com/blixt/f17b47c62508be59987b#gistcomment-2792771
// and https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
export function mulberry32 (a) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const onBlur = new Promise(resolve => {
  window.addEventListener('blur', resolve, { once: true })
})
