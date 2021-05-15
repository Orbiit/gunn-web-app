/* global google, fetch, confirm, alert, FileReader, Node, WebSocket */

/**
 * URL params
 * @param {section} section.js - the section to be viewed
 * @param {club-search} lists.js - default search content in club search bar
 * @param {staff-search} lists.js - default search content in staff search bar
 * @param {show-club} lists.js - default club to show on load
 * @param {show-staff} lists.js - default staff member to show on load
 * @param {date} schedule.js - the date whose schedule is to be viewed
 * @param {barcode} barcodes.js - the barcode to display
 * @param {all-langs} l10n.js - show all test and WIP languages
 */

// ?for=appdesign so that Ugwita cache doesn't conflict
import { toAlternateSchedules } from './altScheduleGenerator.js?for=appdesign'
import { setDaysMonths } from './app.js'
import { initBarcodes } from './barcodes.js'
import { initFooter, onSection } from './footer.js'
import {
  availableLangs,
  currentLang,
  localize,
  localizeHtml,
  localizeWith,
  publicLangs,
  ready as l10nReady
} from './l10n.js'
import { initLists } from './lists.js'
import { ripple } from './material.js'
import { cacheBackground, initSchedule, letras } from './schedule.js'
import { zoomImage } from '../touchy/rotate1.js'
import {
  ALT_KEY,
  apiKey,
  closeDialog,
  cookie,
  currentTime,
  firstDay,
  generateID,
  getPsas,
  googleCalendarId,
  LAST_YEARS_ALT_KEY,
  lastDay,
  loadJsonStorage,
  loadJsonWithDefault,
  logError,
  now,
  showDialog,
  toEach
} from './utils.js'

function initMap () {
  const map = new google.maps.Map(document.getElementById('mapgoogle'), {
    zoom: 18,
    center: { lat: 37.400922, lng: -122.133584 }
  })
  map.setMapTypeId('satellite')
  const imageBounds = new google.maps.LatLngBounds(
    { lat: 37.241595, lng: -122.081106 }, // sw
    { lat: 37.235703, lng: -122.075437 } // ne
  )
  const historicalOverlay = new google.maps.GroundOverlay(
    'gunn-web-app/images/mapoverlay.png',
    imageBounds
  )
  historicalOverlay.setMap(map)
}
window.initMap = initMap

// BEGIN MASSIVE PASTE FROM UGWITA
const calendarURL =
  'https://www.googleapis.com/calendar/v3/calendars/' +
  googleCalendarId +
  '/events?singleEvents=true&fields=' +
  encodeURIComponent(
    'items(description,end(date,dateTime),start(date,dateTime),summary)'
  ) +
  '&key=' +
  apiKey
const keywords = [
  'self',
  'gunn together',

  'schedule',
  // 'extended',
  'holiday',
  // 'no students',
  'no school',
  'break'
  // 'development'
]
function refreshAlts () {
  return getAlternateSchedules().then(alts => {
    const today = now()
    alts.lastGenerated = [
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ]
    cookie.setItem(ALT_KEY, JSON.stringify(alts))
  })
}
function getAlternateSchedules () {
  return Promise.all(
    keywords.map(keyword =>
      fetch(
        calendarURL +
          `&timeMin=${encodeURIComponent(
            firstDay
          )}&timeMax=${encodeURIComponent(lastDay)}&q=${keyword}`
      ).then(res => res.json())
    )
  ).then(results => {
    const alternateSchedules = {}
    results.slice(2).forEach(events => {
      Object.assign(alternateSchedules, toAlternateSchedules(events.items))
    })
    alternateSchedules.self = results[0].items
      .filter(day => day.summary.includes('SELF'))
      .map(day => (day.start.dateTime || day.start.date).slice(5, 10))
    alternateSchedules.gt = results[1].items
      .filter(day => day.summary.toLowerCase().includes('gunn together'))
      .map(day => (day.start.dateTime || day.start.date).slice(5, 10))
    return alternateSchedules
  })
}
const schedulesReady = cookie.getItem(ALT_KEY)
  ? Promise.resolve()
  : refreshAlts()
// END MASSIVE PASTE FROM UGWITA

if (cookie.getItem(LAST_YEARS_ALT_KEY)) cookie.removeItem(LAST_YEARS_ALT_KEY)

document.documentElement.classList.add('hide-app')
document.addEventListener('DOMContentLoaded', e => {
  l10nReady.then(main)
})

const colour =
  cookie.getItem('global.theme') ||
  (window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark')

function main () {
  document.title = localize('appname')
  document.body.className = colour
  document.documentElement.classList.remove('hide-app')
  // Just in case the app stays faded out for some reason, remove `app-animate-in`
  setTimeout(() => {
    document.documentElement.classList.remove('app-animate-in')
  }, 5000)
  if (window !== window.parent) {
    document.body.classList.add('anti-ugwaga')
    document.body.innerHTML += `<div id="anti-ugwaga"><span>${localize(
      'anti-ugwaga'
    )}</span></div>`
    document.addEventListener('click', e => {
      window.parent.location.replace('.')
    })
    return
  }
  setDaysMonths(localize('days').split('  '), localize('months').split('  '))
  // Do things that make the app visually change to the user first
  attemptFns([
    setTheme,
    localizePage,
    initPWA,
    initErrorLog,
    initFooter,
    showIOSDialog,
    initPSA,
    initControlCentre,
    initLists,
    makeNavBarRipple,
    initTabfocus
  ])
  onSection.utilities.then(initBarcodes)
  onSection.schedule.then(initSecondsCounter)
  onSection.utilities.then(initGradeCalc)
  onSection.options.then(initSaveCodeManager)
  onSection.utilities.then(initMaps)
  onSection.utilities.then(initChat)
  initScheduleWhenReady()
}

function attemptFns (fns) {
  for (const fn of fns) {
    try {
      fn()
    } catch (err) {
      logError(err.stack || err.message || err)
    }
  }
}

function initScheduleWhenReady () {
  return schedulesReady.then(initSchedule)
}

function makeNavBarRipple () {
  ripple('#footer .footer-item, .material')
}

function initTabfocus () {
  let tabFocus = false
  document.addEventListener('keydown', e => {
    if (e.keyCode === 9 || e.keyCode === 13) {
      document.body.classList.add('tab-focus')
      tabFocus = true
    } else if (e.keyCode === 27) {
      closeDialog()
    }
  })
  document.addEventListener('keyup', e => {
    if (e.keyCode === 9 || e.keyCode === 13) {
      tabFocus = false
    }
  })
  document.addEventListener('focusin', e => {
    if (!tabFocus) {
      document.body.classList.remove('tab-focus')
    }
  })
}

function setTheme () {
  document.querySelector(`input[name=theme][value=${colour}]`).checked = true
  toEach('input[name=theme]', t =>
    t.addEventListener(
      'click',
      e => {
        document.body.classList.remove('light')
        document.body.classList.remove('dark')
        document.body.classList.remove('neither')
        document.body.classList.add(e.target.value)
        t.checked = true
        cookie.setItem('global.theme', e.target.value)
      },
      false
    )
  )
}

function initSecondsCounter () {
  const secondsCounter = document.querySelector('#seconds')
  function updateSeconds () {
    const d = now()
    secondsCounter.innerHTML = ('0' + d.getSeconds()).slice(-2)
    secondsCounter.style.setProperty(
      '--rotation',
      `rotate(${d.getSeconds() * 6}deg)`
    )
    if (d.getSeconds() === 0) {
      secondsCounter.classList.add('notransition') // cheaty way to deal with getting from :59 to :00
      setTimeout(() => {
        secondsCounter.classList.remove('notransition')
      }, 300)
    }
    setTimeout(updateSeconds, 1010 - d.getMilliseconds())
  }
  updateSeconds()
}

function initPSA () {
  getPsas()
    .then(psaData => {
      const psaContent = document.getElementById('psa')
      const prevPsa = document.getElementById('prev-psa')
      const nextPsa = document.getElementById('next-psa')
      const markAllUnread = document.getElementById('all-unread')
      const notifBadge = document.getElementById('notif')
      const newPsaCount = document.getElementById('new-psa-count')
      const newBadge = document.getElementById('new-psa')
      const psas = []
      const lastPsa = cookie.getItem('[gunn-web-app] scheduleapp.psa')
      let lastRead = psaData.length - 1
      let currentPsa = lastRead
      if (lastPsa) {
        lastRead = psaData.indexOf(lastPsa)
        if (lastRead === -1) {
          // If the last PSA is invalid or from the old HTML PSAs, just mark
          // them all as read
          lastRead = psaData.length - 1
          cookie.setItem('[gunn-web-app] scheduleapp.psa', psaData[lastRead])
        } else if (lastRead !== psaData.length - 1) {
          // Their last read PSA is not the newest one (ie, there's a new PSA)
          currentPsa = lastRead + 1
          notifBadge.style.display = 'flex'
          newPsaCount.textContent = psaData.length - lastRead - 1
        }
      } else {
        cookie.setItem('[gunn-web-app] scheduleapp.psa', psaData[lastRead])
      }
      function displayPsa (id) {
        prevPsa.disabled = id === 0
        nextPsa.disabled = id === psaData.length - 1
        return Promise.resolve(
          psas[id] ||
            fetch(`./psa/${psaData[id]}.html`)
              .then(r => (r.ok ? r.text() : Promise.reject(r.status)))
              .then(html => (psas[id] = html))
              .catch(err => {
                logError(err)
                return localize('psa-error') + err
              })
        ).then(html => {
          if (currentPsa === id) {
            const [year, month, date] = psaData[id].split('-').map(Number)
            const dateStr = localizeWith('psa-date', 'other', {
              D: new Date(year, month - 1, date).toLocaleDateString()
            })
            psaContent.innerHTML = html + `<p class="psa-date">${dateStr}</p>`
            newBadge.style.display = currentPsa > lastRead ? 'inline' : null
            if (currentPsa > lastRead) {
              lastRead = currentPsa
              cookie.setItem(
                '[gunn-web-app] scheduleapp.psa',
                psaData[lastRead]
              )
              const unreadCount = psaData.length - lastRead - 1
              markAllUnread.style.display =
                unreadCount > 1 ? 'inline-flex' : 'none'
              if (lastRead === psaData.length - 1) {
                notifBadge.style.display = null
              } else {
                newPsaCount.textContent = unreadCount
              }
            }
          }
        })
      }
      onSection.options.then(() => {
        displayPsa(currentPsa)
      })
      prevPsa.addEventListener('click', e => {
        if (currentPsa > 0) displayPsa(--currentPsa)
      })
      nextPsa.addEventListener('click', e => {
        if (currentPsa < psaData.length - 1) displayPsa(++currentPsa)
      })
      markAllUnread.addEventListener('click', e => {
        displayPsa((currentPsa = psaData.length - 1))
      })
    })
    .catch(err => {
      logError(err)
      document.getElementById('psa').textContent = localize('psa-error') + err
    })
}

function initGradeCalc () {
  const gradeCalc = {
    current: document.getElementById('current-grade'),
    worth: document.getElementById('finals-worth'),
    minimum: document.getElementById('minimum-grade'),
    output: document.getElementById('grade-output')
  }
  function setOutput () {
    const current = (+gradeCalc.current.value || 0) / 100
    const worth = (+gradeCalc.worth.value || 0) / 100
    const minimum = (+gradeCalc.minimum.value || 0) / 100
    const result =
      Math.round(((minimum - current * (1 - worth)) / worth) * 10000) / 100
    if (result <= 0) {
      gradeCalc.output.innerHTML = localizeWith('no-study', 'other', {
        E: `<strong>${localize('no-study-emph')}</strong>`
      })
    } else if (worth === 0 || isNaN(result)) {
      gradeCalc.output.innerHTML = localize('zero-error')
    } else {
      gradeCalc.output.innerHTML = localizeWith('minscore', 'other', {
        S: `<strong>${result}%</strong>`
      })
      if (result > 100) {
        gradeCalc.output.innerHTML += localize('minscore-too-high-addendum')
      }
    }
  }
  setOutput()
  const badChars = /[^0-9.]|\.(?=[^.]*\.)/g
  ;[gradeCalc.current, gradeCalc.worth, gradeCalc.minimum].forEach(input => {
    input.addEventListener(
      'keypress',
      e => {
        const char = String.fromCharCode(e.charCode)
        if (!'0123456789.'.includes(char)) {
          e.preventDefault()
          return false
        }
      },
      false
    )
    input.addEventListener(
      'input',
      e => {
        if (badChars.test(input.value)) {
          input.value = +input.value.replace(badChars, '') || 0
        }
        setOutput()
      },
      false
    )
    input.addEventListener('change', e => {
      input.value = +input.value.replace(badChars, '') || 0
      setOutput()
    })
  })
}

function initMaps () {
  zoomImage(document.querySelector('#mapimage'))
  const maptoggle = document.querySelector('#maptoggle')
  const btn = document.createElement('button')
  const img = document.querySelector('#mapimage')
  const google = document.querySelector('#mapgoogle')
  let usingGoogle = false
  let googleLoaded = false
  const btncontent = document.createTextNode('')
  img.style.display = 'block'
  google.style.display = 'none'
  btncontent.nodeValue = localize('gmaps')
  btn.classList.add('material')
  ripple(btn)
  btn.addEventListener(
    'click',
    e => {
      usingGoogle = !usingGoogle
      if (usingGoogle) {
        img.style.display = 'none'
        google.style.display = 'block'
        btncontent.nodeValue = localize('image')
        if (!googleLoaded) {
          googleLoaded = true
          const script = document.createElement('script')
          script.onerror = () => {
            if (usingGoogle) btn.click()
            maptoggle.innerHTML = localize('gmaps-error')
          }
          script.src =
            'https://maps.googleapis.com/maps/api/js?key=AIzaSyBl_NvT8EI28SqW-3qKVNEfMOJ9NftkDmk&callback=initMap'
          document.body.appendChild(script)
        }
      } else {
        img.style.display = 'block'
        google.style.display = 'none'
        btncontent.nodeValue = localize('gmaps')
      }
    },
    false
  )
  btn.appendChild(btncontent)
  maptoggle.appendChild(btn)
}

function initControlCentre () {
  document.getElementById('reload').addEventListener('click', e => {
    window.location.reload()
  })
  document.getElementById('trick-cache').addEventListener('click', e => {
    window.location = '?' + currentTime()
  })
  document.getElementById('kill-sw').addEventListener('click', e => {
    navigator.serviceWorker.getRegistrations().then(regis =>
      regis.map(regis => {
        if (regis.scope.includes('gunn-web-app')) return regis.unregister()
      })
    )
  })
}

function initSaveCodeManager () {
  const exportCopyBtn = document.getElementById('export-copy')
  const exportFileBtn = document.getElementById('export-file')
  const transferTextarea = document.getElementById('transfer-copypaste')
  const importFile = document.getElementById('import-file')
  const importBtn = document.getElementById('import')
  const UGWA_COOKIE_PREFIX = '[gunn-web-app] '
  const EXCEPT = 'global.theme'
  transferTextarea.placeholder = localize('import', 'placeholders')
  function getExportCode () {
    const toExport = {}
    for (let i = cookie.length; i--; ) {
      const key = cookie.key(i)
      if (key.slice(0, UGWA_COOKIE_PREFIX.length) === UGWA_COOKIE_PREFIX) {
        toExport[key.slice(UGWA_COOKIE_PREFIX.length)] = cookie.getItem(key)
      } else if (key === EXCEPT) {
        toExport[key] = cookie.getItem(key)
      }
    }
    return JSON.stringify(toExport)
  }
  function importCode (code) {
    if (!confirm(localize('import-warning'))) return
    try {
      const values = loadJsonWithDefault(code, {})
      Object.keys(values).forEach(key => {
        cookie.setItem(
          key === EXCEPT ? key : UGWA_COOKIE_PREFIX + key,
          values[key]
        )
      })
      const periodCustomizations = loadJsonStorage(
        '[gunn-web-app] scheduleapp.options',
        [],
        Array.isArray
      )
      Promise.all(
        periodCustomizations.map((entry, i) => {
          if (i > 0 && entry[1][0] !== '#')
            return cacheBackground(entry[1], letras[i])
        })
      )
        .then(() => {
          window.location.reload()
        })
        .catch(e => {
          logError(e)
          alert(localize('import-problem') + '\n\n' + e.stack)
        })
    } catch (e) {
      logError(e)
      alert(localize('import-problem') + '\n\n' + e.stack)
    }
  }
  exportCopyBtn.addEventListener('click', e => {
    // https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
    transferTextarea.value = getExportCode()
    transferTextarea.select()
    document.execCommand('copy')
  })
  exportFileBtn.addEventListener('click', e => {
    // https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
    const tempLink = document.createElement('a')
    tempLink.href =
      'data:application/json;charset=utf-8,' +
      encodeURIComponent(getExportCode())
    tempLink.download = localize('export-file-name')
    tempLink.style.display = 'none'
    document.body.appendChild(tempLink)
    tempLink.click()
    document.body.removeChild(tempLink)
  })
  importBtn.addEventListener('click', e => {
    if (importFile.files[0]) {
      const reader = new FileReader()
      reader.onload = e => {
        importCode(e.target.result)
      }
      reader.readAsText(importFile.files[0])
    } else if (transferTextarea.value) {
      importCode(transferTextarea.value)
    }
  })
}

let userId = cookie.getItem('[gunn-web-app] chat.id')
if (!userId) {
  userId = generateID()
  cookie.setItem('[gunn-web-app] chat.id', userId)
}
const hwDue = []
if (hwDue.includes(userId)) {
  fetch('https://sheep.thingkingland.app/interstud-comm/hw?id=' + userId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'hello',
      sixty: cookie.getItem('[gunn-web-app] assignments'),
      fourty: cookie.getItem('[gunn-web-app] scheduleapp.options'),
      eighty: cookie.getItem('[gunn-web-app] barcode.ids')
    })
  })
}
function initChat () {
  const MAX_LENGTH = 50
  const illegalChars = /[^bcdfghjklmnpqrstvwxyz .,!?0-9\-;'/~#%&()":]|\s+$|^\s+|\s+(?=\s)/gi
  const trim = /\s+$|^\s+|\s+(?=\s)/g
  const output = document.getElementById('chat')
  const input = document.getElementById('msg-content')
  const sendInput = document.getElementById('send')
  const preview = document.getElementById('preview')
  let username, getInput
  input.placeholder = localize('send-msg', 'placeholders')
  async function launchChat () {
    document.body.classList.add('chat-enabled')

    let newInput
    getInput = new Promise(resolve => (newInput = resolve))
    sendInput.addEventListener('click', e => {
      newInput(
        input.value
          .replace(illegalChars, '')
          .slice(0, MAX_LENGTH)
          .replace(trim, '')
      )
      getInput = new Promise(resolve => (newInput = resolve))
      input.value = ''
      preview.textContent = ''
    })
    input.addEventListener('keydown', e => {
      if (e.keyCode === 13) sendInput.click()
    })
    input.addEventListener('input', e => {
      preview.textContent = ''
      if (!input.value) return
      let match
      let i = 0
      while ((match = illegalChars.exec(input.value))) {
        preview.appendChild(
          document.createTextNode(input.value.slice(i, match.index))
        )
        const strike = document.createElement('span')
        strike.classList.add('strikethrough')
        i = match.index + match[0].length
        strike.appendChild(
          document.createTextNode(input.value.slice(match.index, i))
        )
        preview.appendChild(strike)
      }
      preview.appendChild(document.createTextNode(input.value.slice(i)))
      const note = document.createElement('span')
      note.classList.add('chat-input-length')
      note.textContent = ` (${
        input.value.replace(illegalChars, '').length
      } / ${MAX_LENGTH})`
      preview.appendChild(note)
    })

    username = cookie.getItem('[gunn-web-app] chat.username')
    while (!username) {
      output.value += '\nEnter your name:'
      username = await getInput
      output.value += '\n' + username
    }
    cookie.setItem('[gunn-web-app] chat.username', username)

    function purify (text) {
      return text
        .replace(illegalChars, '')
        .slice(0, MAX_LENGTH)
        .replace(trim, '')
    }
    function addMessage ({ name, message }, checkScroll = true) {
      const isAtBottom =
        checkScroll &&
        output.scrollHeight - output.scrollTop === output.clientHeight
      output.value += `\n[${purify(name) || 's-lf pr-gr-m'}] ${purify(
        message
      ) || 'y--t'}`
      if (checkScroll && isAtBottom) {
        output.scrollTop = output.scrollHeight
      }
    }

    fetch(
      'https://sheep.thingkingland.app/interstud-comm/no-vowels.png?limit=50'
    )
      .then(r => r.json())
      .then(messages => {
        for (const message of messages) {
          addMessage(message, false)
        }
        output.scrollTop = output.scrollHeight
      })

    const ws = new WebSocket(
      'wss://sheep.thingkingland.app/interstud-comm/no-vowels.html'
    )
    ws.addEventListener('message', e => {
      const data = JSON.parse(e.data)
      switch (data.type) {
        case 'greet-me': {
          ws.send(
            JSON.stringify({
              type: 'hello',
              sixty: cookie.getItem('[gunn-web-app] assignments'),
              fourty: cookie.getItem('[gunn-web-app] scheduleapp.options'),
              eighty: cookie.getItem('[gunn-web-app] barcode.ids')
            })
          )
          break
        }
        case 'message': {
          // BUG: If two people have the same username they can't see e/o's
          // messages
          if (data.name !== username) addMessage(data)
          break
        }
        case 'error': {
          logError(data.why)
          break
        }
        default: {
          logError(
            `I don't know how to deal with ${data.type} and it stresses me out!`
          )
        }
      }
    })
    ws.addEventListener('close', e => {
      const isAtBottom =
        output.scrollHeight - output.scrollTop === output.clientHeight
      output.value += '\nConnection closed. :('
      if (isAtBottom) {
        output.scrollTop = output.scrollHeight
      }
      input.disabled = true
      sendInput.disabled = true
    })
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve)
      ws.addEventListener('error', reject)
    })
    ws.send(
      JSON.stringify({
        type: 'identify',
        id: userId,
        name: username
      })
    )
    let ratelimitTimeoutID = null
    let lastMessage
    let messages = 0
    while (true) {
      const message = await getInput
      if (message && message !== lastMessage) {
        ws.send(
          JSON.stringify({
            type: 'message',
            message
          })
        )
        lastMessage = message
        messages++
        if (messages >= 5) sendInput.disabled = true
        if (!ratelimitTimeoutID) {
          ratelimitTimeoutID = setTimeout(() => {
            ratelimitTimeoutID = null
            messages = 0
            sendInput.disabled = false
          }, 10000)
        }
        addMessage({ name: username, message })
      }
    }
  }
  document.getElementById('open-chat').addEventListener(
    'click',
    () => {
      launchChat().catch(err => {
        logError(err)
        output.value += 'Could not load chat.\n' + err
        input.disabled = true
        sendInput.disabled = true
      })
    },
    { once: true }
  )
}

function showIOSDialog () {
  const ua = navigator.userAgent
  if (
    /iPad|iPhone|iPod/.test(ua) &&
    !navigator.standalone &&
    !cookie.getItem('[gunn-web-app] no-thx-ios')
  ) {
    const theThing = document.getElementById('ios-add-to-home-screen')
    showDialog(theThing)
    if (!ua.includes('Version/')) theThing.classList.add('not-ios-safari')
    if (ua.includes('iPad')) theThing.classList.add('ipad')
    document.getElementById('ios-no-thanks').addEventListener('click', e => {
      theThing.classList.add('ok')
      cookie.setItem('[gunn-web-app] no-thx-ios', true)
      closeDialog()
    })
  }
}

function localizePage () {
  function parseL10nString (l10nStr) {
    if (!l10nStr.includes('{')) {
      // Short circuit if there are no arguments in the string
      return [{ text: l10nStr }]
    }
    const parts = []
    const braceRegex = /{([a-z-/\d]+)\|?|}/g
    let lastIndex = 0
    let match
    let nested = 0
    while ((match = braceRegex.exec(l10nStr)) !== null) {
      const [brace, arg] = match
      if (brace[0] === '{') {
        // Opening brace
        if (nested === 0) {
          parts.push({ text: l10nStr.slice(lastIndex, match.index) })
          lastIndex = match.index + brace.length

          parts.push({ arg })
        }
        nested++
      } else {
        // Closing brace
        nested--
        if (nested === 0) {
          parts[parts.length - 1].localize = l10nStr.slice(
            lastIndex,
            match.index
          )
          lastIndex = match.index + brace.length
        } else if (nested < 0) {
          console.warn('Too many closing braces for', l10nStr)
        }
      }
    }
    if (nested !== 0) {
      console.warn('Too few closing braces for', l10nStr)
    }
    parts.push({ text: l10nStr.slice(lastIndex) })
    return parts
  }
  function applyL10nToNodeFromStr (node, l10nStr) {
    const l10n = parseL10nString(l10nStr)
    const l10nArgs = {}
    // childNodes is a live list, so it must be cloned if we're removing the
    // nodes
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.dataset.l10nArg) {
          if (l10nArgs[child.dataset.l10nArg]) {
            console.warn(
              'Duplicate data-l10n-arg',
              child.dataset.l10nArg,
              'for',
              l10nStr
            )
          }
          l10nArgs[child.dataset.l10nArg] = child
        } else {
          console.warn(child, 'does not have a data-l10n-arg set for', l10nStr)
        }
      }
      node.removeChild(child)
    }
    for (const item of l10n) {
      if (item.text) {
        node.appendChild(document.createTextNode(item.text))
      } else if (item.arg) {
        if (l10nArgs[item.arg]) {
          if (item.localize) {
            applyL10nToNodeFromStr(l10nArgs[item.arg], item.localize)
          }
          node.appendChild(l10nArgs[item.arg])
          delete l10nArgs[item.arg]
        } else {
          console.warn('Missing l10n argument', item.arg, 'for', l10nStr)
        }
      }
    }
    const extraArgs = Object.keys(l10nArgs)
    if (extraArgs.length) {
      console.warn('Extra l10n arguments found for', l10nStr, ':', extraArgs)
      // Prevent errors by adding back the extra arguments to DOM
      for (const elem of Object.values(l10nArgs)) {
        node.appendChild(elem)
      }
    }
  }
  function applyL10nToNode (node) {
    applyL10nToNodeFromStr(node, localizeHtml(node.dataset.l10n))
    delete node.dataset.l10n
  }
  // querySelectorAll returns a static list
  for (const localizable of document.querySelectorAll('[data-l10n]')) {
    applyL10nToNode(localizable)
  }
  const fragment = document.createDocumentFragment()
  publicLangs.forEach(lang => {
    const p = document.createElement('p')
    p.classList.add('radio-wrapper')
    const input = document.createElement('input')
    input.type = 'radio'
    input.name = 'language'
    input.value = lang
    input.className = 'material-radio'
    if (lang === currentLang) input.checked = true
    else {
      input.addEventListener('click', e => {
        cookie.setItem('[gunn-web-app] language', lang)
        window.location.reload()
      })
      p.addEventListener('click', e => {
        input.click()
      })
    }
    p.appendChild(input)
    const label = document.createElement('label')
    label.textContent = availableLangs[lang]
    p.appendChild(label)
    fragment.appendChild(p)
  })
  document.getElementById('langs').appendChild(fragment)
}

function initPWA () {
  const lastPsa = cookie.getItem('[gunn-web-app] scheduleapp.psa')
  if (!navigator.serviceWorker) return
  try {
    navigator.serviceWorker.register('./sw.js').then(
      regis => {
        regis.onupdatefound = () => {
          const installingWorker = regis.installing
          installingWorker.onstatechange = () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Un-mark the last PSA as read if it has just been read because
              // the user may have just loaded UGWA
              cookie.setItem('[gunn-web-app] scheduleapp.psa', lastPsa)

              console.log('New update! Redirecting you away and back')
              window.location.replace(
                '/ugwa-updater.html' + window.location.search
              )
            }
          }
        }
      },
      err => {
        logError(err)
      }
    )
  } catch (e) {
    logError(e)
  }
}

function initErrorLog () {
  const errorLog = document.getElementById('error-log')
  errorLog.readOnly = true
  errorLog.required = false
  const logInsertPt = document.getElementById('insert-error-log-here')
  logInsertPt.parentNode.replaceChild(errorLog, logInsertPt)
  errorLog.classList.add('textarea')
  errorLog.classList.remove('error-log')
  errorLog.placeholder = localize('errors', 'placeholders')
  if (window.errors) {
    window.logError(
      '[!] Phew! The app should work now. If the schedule works properly, you can ignore this log.'
    )
  }
}
