/* global fetch, caches, alert, Notification */

import {
  altScheduleRegex,
  noSchoolRegex,
  toAlternateSchedules
} from './altScheduleGenerator.js?for=appdesign'
import { getFontColour, scheduleApp } from './app.js'
import {
  categoryList,
  initAssignments,
  localizeCategory
} from './assignments.js'
import { ColourPicker } from './colour.js'
import { DatePicker } from './date.js'
import { localize, localizeWith } from './l10n.js'
import { onClubsLoaded } from '../js/lists.js'
import { createRange, makeDropdown, materialInput, ripple } from './material.js'
import { setOnSavedClubsUpdate } from './saved-clubs.js'
import {
  ajax,
  ALT_KEY,
  apiKey,
  closeDialog,
  cookie,
  currentTime,
  escapeHTML,
  getAudioContext,
  googleCalendarId,
  isAppDesign,
  logError,
  now,
  schoolTimeZone,
  showDialog,
  THEME_COLOUR,
  toEach
} from './utils.js'

export const letras = [
  null, // Placeholder because the version number is at index 0
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'Flex',
  'Brunch',
  'Lunch',
  'SELF',
  'H',
  '0'
]
// period style save format version
// WARNING: if you change this it'll change everyone's saves; it's best to add a way to convert the saves properly
const VERSION = 5
// radios save format version
const FORMATTING_VERSION = '10'
const normalschedule = [
  null,
  [
    { name: 'A', start: makeHMTM(10, 0), end: makeHMTM(10, 30) },
    { name: 'B', start: makeHMTM(10, 40), end: makeHMTM(11, 10) },
    { name: 'C', start: makeHMTM(11, 20), end: makeHMTM(11, 50) },
    { name: 'D', start: makeHMTM(12, 0), end: makeHMTM(12, 35) },
    { name: 'Lunch', start: makeHMTM(12, 35), end: makeHMTM(13, 5) },
    { name: 'E', start: makeHMTM(13, 15), end: makeHMTM(13, 45) },
    { name: 'F', start: makeHMTM(13, 55), end: makeHMTM(14, 25) },
    { name: 'G', start: makeHMTM(14, 35), end: makeHMTM(15, 5) }
  ],
  [
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(10, 15) },
    { name: 'B', start: makeHMTM(10, 25), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'C', start: makeHMTM(12, 20), end: makeHMTM(13, 40) },
    { name: 'D', start: makeHMTM(13, 50), end: makeHMTM(15, 5) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'E', start: makeHMTM(9, 40), end: makeHMTM(10, 55) },
    { name: 'GT', start: makeHMTM(11, 5), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'F', start: makeHMTM(12, 20), end: makeHMTM(13, 40) },
    { name: 'G', start: makeHMTM(13, 50), end: makeHMTM(15, 5) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(10, 15) },
    { name: 'B', start: makeHMTM(10, 25), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'C', start: makeHMTM(12, 20), end: makeHMTM(13, 40) },
    { name: 'D', start: makeHMTM(13, 50), end: makeHMTM(15, 5) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'E', start: makeHMTM(9, 40), end: makeHMTM(10, 55) },
    { name: 'SELF', start: makeHMTM(11, 5), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'F', start: makeHMTM(12, 20), end: makeHMTM(13, 40) },
    { name: 'G', start: makeHMTM(13, 50), end: makeHMTM(15, 5) }
  ],
  null
]
function makeHMTM (hour, minute = 0) {
  return { hour, minute, totalminutes: hour * 60 + minute }
}

const dateRegex = /^\d+-\d{2}-\d{2}$/
const manualAltPeriodRegex = /^(1?\d):(\d{2}) (1?\d):(\d{2}) ([a-z]+)$/
export function getManualAlternateSchedules () {
  return fetch('./json/alt-schedules-2020.txt' + isAppDesign)
    .then(r => r.text())
    .then(text => {
      const schedules = {}
      const lines = text.split(/\r?\n/)
      let currentDate = null
      for (const line of lines) {
        if (line[0] === '#') continue
        if (currentDate) {
          if (line[0] === '*') {
            if (schedules[currentDate].description) {
              schedules[currentDate].description += ' ' + line.slice(1).trim()
            } else {
              schedules[currentDate].description = line.slice(1).trim()
            }
          } else if (line) {
            const match = line.match(manualAltPeriodRegex)
            if (match) {
              const [, startH, startM, endH, endM, periodLowercase] = match
              const period =
                periodLowercase === 'self'
                  ? 'SELF'
                  : periodLowercase[0].toUpperCase() + periodLowercase.slice(1)
              if (letras.includes(period)) {
                schedules[currentDate].periods.push({
                  name: period,
                  start: makeHMTM(+startH, +startM),
                  end: makeHMTM(+endH, +endM)
                })
              } else {
                console.warn(period, 'is not a valid period on', currentDate)
              }
            } else {
              console.warn(
                line,
                'does not match the period regex on',
                currentDate
              )
            }
          } else {
            currentDate = null
          }
        } else if (line) {
          if (dateRegex.test(line)) {
            currentDate = line
              .split('-')
              .map(Number)
              .join('-')
            if (schedules[currentDate]) {
              console.warn(
                'A schedule already exists on',
                currentDate,
                schedules[currentDate]
              )
            }
            schedules[currentDate] = { periods: [] }
          } else {
            console.warn(line, 'is not a valid date.')
          }
        }
      }
      return schedules
    })
}

const datePickerRange = [
  { d: 17, m: 7, y: 2020 },
  { d: 3, m: 5, y: 2021 }
] // change for new school year, months are 0-indexed
const IMAGE_CACHE = 'ugwa-img-cache-YEET'
export function cacheBackground (url, pd) {
  return Promise.all([
    caches.open(IMAGE_CACHE),
    fetch(url, { mode: 'no-cors', cache: 'no-cache' })
  ]).then(([cache, res]) => cache.put(`./.period-images/${pd}`, res))
}
export function initSchedule (manualAltSchedulesProm) {
  function getDefaultPeriodName (periodName) {
    return localizeWith('periodx', 'other', { X: periodName })
  }
  const periodstyles = {
    NO_SCHOOL: { label: localize('no-school') },
    // Default period names and styles
    Brunch: { label: localize('brunch'), colour: '#9E9E9E' },
    Lunch: { label: localize('lunch'), colour: '#9E9E9E' },
    Flex: { label: localize('flex'), colour: '#607D8B' },
    SELF: { label: localize('self'), colour: '#455a64' },
    A: { label: getDefaultPeriodName('1'), colour: '#f44336' },
    B: { label: getDefaultPeriodName('2'), colour: '#2196F3' },
    C: { label: getDefaultPeriodName('3'), colour: '#FFEB3B' },
    D: { label: getDefaultPeriodName('4'), colour: '#795548' },
    E: { label: getDefaultPeriodName('5'), colour: '#FF9800' },
    F: { label: getDefaultPeriodName('6'), colour: '#9C27B0' },
    G: { label: getDefaultPeriodName('7'), colour: '#4CAF50' },
    H: { label: getDefaultPeriodName('8'), colour: '#673AB7' },
    '0': { label: localize('p0'), colour: '#009688' }
  }
  const periodStyleCookie = cookie.getItem('[gunn-web-app] scheduleapp.options')
  let options = []
  if (periodStyleCookie) {
    options = JSON.parse(periodStyleCookie)
    if (!(options[0] <= VERSION)) {
      console.warn(
        'Period styles seem to be from the future? Was expecting version',
        VERSION,
        'but got',
        options
      )
    }
  }
  for (let i = 1; i < letras.length; i++) {
    if (!periodstyles[letras[i]]) periodstyles[letras[i]] = {}
    if (options[i]) {
      const [label, colour, link] = options[i]
      Object.assign(periodstyles[letras[i]], { label, colour, link })
    }
  }
  function savePeriodStyles () {
    const options = new Array(letras.length)
    options[0] = VERSION
    for (let i = 1; i < letras.length; i++) {
      const { label, colour, link } = periodstyles[letras[i]]
      options[i] = [label, colour, link]
    }
    cookie.setItem(
      '[gunn-web-app] scheduleapp.options',
      JSON.stringify(options)
    )
  }
  /* SCHEDULE APP */
  // FORBIDDEN CHARACTERS: " (used for radio CSS selector) and . (used for
  // storing in localStorage)
  const formatOptionInfo = {
    // 0
    _: { default: FORMATTING_VERSION },
    // 1
    hourCycle: { default: '12', radio: { name: 'hour' } },
    // 2
    timeLength: { default: 'full', radio: { name: 'format' } },
    // 3
    showSelf: {
      default: '0'
      // toggle: {
      //   id: 'self',
      //   on: '1',
      //   off: '0'
      // }
    },
    // 4
    asgnPos: {
      default: 'after',
      radio: {
        name: 'asgn-display',
        onChange: value => asgnThing.displaySection(value)
      }
    },
    // 5
    asgnSort: {
      default: 'chrono-primero',
      radio: {
        name: 'asgn-sort',
        onChange: value => asgnThing.todayIs(getPeriodSpan, now(), value)
      }
    },
    // 6
    showAddAsgn: {
      default: 'yes',
      toggle: {
        id: 'toggle-pd-add-asgn',
        on: 'yes',
        off: 'no',
        onChange: checked => {
          scheduleapp.options.displayAddAsgn = checked
          scheduleapp.render()
        }
      }
    },
    // 7
    showRock: { default: 'show' },
    // 8
    showZero: { default: 'no', toggle: { id: 'show0', on: 'yes', off: 'no' } },
    // 9
    hidePreps: {
      default: 'preps',
      toggle: { id: 'hide-preps', on: 'prepnt', off: 'prep' }
    },
    // 10
    showH: {
      default: 'unset',
      toggle: {
        id: 'show-h',
        on: 'yes-h-period2',
        off: 'no-h-period',
        onChange: checked => {
          hEditBtn.disabled = !checked
          scheduleapp.render()
          makeWeekHappen()
        }
      }
    },
    // 11
    timeBeforeNotif: { default: 'off' },
    // 12
    allowSwipe: {
      default: 'swipe',
      toggle: {
        id: 'allow-swipe',
        on: 'swipe',
        off: 'both',
        onChange: 'no-reload'
      }
    },
    // 13
    timeBeforeAutoLink: { default: 'off' },
    // 14
    openNewTab: {
      default: '',
      toggle: {
        id: 'use-iframe',
        on: '',
        off: 'yes',
        onChange: checked => {
          // Set it to `setIframe` only if checked
          openLinkInIframe = checked && setIframe
        }
      }
    },
    // 15
    bellVolume: { default: '' },
    // 16
    _reserved: { default: '' }
  }
  const formatOptionsCookie = cookie.getItem(
    '[gunn-web-app] scheduleapp.formatOptions'
  )
  const formatOptions = {}
  if (formatOptionsCookie) {
    const values = formatOptionsCookie.split('.')
    values[0] = FORMATTING_VERSION
    const keys = Object.keys(formatOptionInfo)
    for (let i = 0; i < keys.length; i++) {
      formatOptions[keys[i]] = values[i] || formatOptionInfo[keys[i]].default
    }
  } else {
    for (const key of Object.keys(formatOptionInfo)) {
      formatOptions[key] = formatOptionInfo[key].default
    }
  }
  function saveFormatOptions () {
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      Object.keys(formatOptionInfo)
        .map(key => formatOptions[key])
        .join('.')
    )
  }
  for (const [key, { radio, toggle }] of Object.entries(formatOptionInfo)) {
    const startValue = formatOptions[key]
    if (radio) {
      const { name, onChange = null } = radio
      document.querySelector(
        `input[name="${name}"][value="${startValue}"]`
      ).checked = true
      toEach(`input[name="${name}"]`, t => {
        t.addEventListener(
          'click',
          e => {
            formatOptions[key] = e.target.value
            saveFormatOptions()
            if (onChange) {
              if (typeof onChange === 'function') {
                onChange(e.target.value)
              }
            } else {
              window.location.reload()
            }
          },
          false
        )
      })
    }
    if (toggle) {
      const { id, on, off, onChange = null } = toggle
      const toggleSwitch = document.getElementById(id)
      if (startValue === on) toggleSwitch.classList.add('checked')
      toggleSwitch.parentNode.addEventListener('click', e => {
        toggleSwitch.classList.toggle('checked')
        const checked = toggleSwitch.classList.contains('checked')
        formatOptions[key] = checked ? on : off
        saveFormatOptions()
        if (onChange) {
          if (typeof onChange === 'function') {
            onChange(checked)
          }
        } else {
          window.location.reload()
        }
      })
    }
  }
  const hideSupportIcon = document.getElementById('hide-support')
  const supportList = document.getElementById('support-list')
  if (formatOptions.showRock === 'hide') {
    hideSupportIcon.textContent = 'expand_more'
    supportList.style.height = 0
  }
  hideSupportIcon.parentNode.addEventListener('click', e => {
    const nowHidden = hideSupportIcon.textContent === 'expand_less'
    if (supportList.style.height) {
      supportList.style.height = nowHidden ? 0 : supportList.scrollHeight + 'px'
    } else {
      supportList.style.height = supportList.scrollHeight + 'px'
      window.requestAnimationFrame(() => {
        supportList.style.height = nowHidden
          ? 0
          : supportList.scrollHeight + 'px'
      })
    }
    hideSupportIcon.textContent = nowHidden ? 'expand_more' : 'expand_less'
    formatOptions.showRock = nowHidden ? 'hide' : 'show'
    saveFormatOptions()
  })

  function getPeriodSpan (pd) {
    // yay hoisting (see three lines above)
    if (!periodstyles[pd]) return '???' // just in case
    let css
    const colour = periodstyles[pd].colour
    if (colour[0] === '#') {
      css = `background-color:${colour};color:${getFontColour(colour)};`
    } else {
      css = `background-image: url('./.period-images/${pd}?${encodeURIComponent(
        colour
      )}'); color: white; text-shadow: 0 0 10px black;`
    }
    return `<span style="${css}" class="schedule-endinginperiod">${escapeHTML(
      periodstyles[pd].label
    )}</span>`
  }
  const contentInput = document.getElementById('asgn-content')
  contentInput.addEventListener('keydown', e => {
    if (e.keyCode === 13) {
      asgnSaveBtn.click()
    } else if (e.keyCode === 27) {
      asgnCancelBtn.click()
    }
  })
  const dueDateTrigger = document.getElementById('date')
  const importanceBtns = [
    document.getElementById('low-imp'),
    document.getElementById('medium-imp'),
    document.getElementById('high-imp')
  ]
  const catDropdown = makeDropdown(
    document.getElementById('cat-drop'),
    categoryList.map(cat => {
      const categoryBadge = document.createElement('span')
      categoryBadge.classList.add('asgn-category')
      categoryBadge.classList.add('asgn-category-' + cat)
      categoryBadge.textContent = localizeCategory(cat)
      return [cat, categoryBadge]
    })
  )
  const pdDropdown = makeDropdown(document.getElementById('period-drop'), [
    [null, 'the day'],
    ...letras
      .slice(1)
      .sort((a, b) => a.length - b.length || (a < b ? -1 : 1))
      .map(pd => {
        const span = document.createElement('span')
        span.classList.add('schedule-endinginperiod')
        ;(periodstyles[pd].update = () => {
          span.textContent = periodstyles[pd].label
          if (periodstyles[pd].colour[0] === '#') {
            span.style.backgroundColor = periodstyles[pd].colour
            span.style.color = getFontColour(periodstyles[pd].colour)
            span.style.textShadow = null
          } else {
            span.style.backgroundImage = `url('./.period-images/${pd}?${encodeURIComponent(
              periodstyles[pd].colour
            )}')`
            span.style.color = 'white'
            span.style.textShadow = '0 0 10px black'
          }
        })()
        return [pd, span]
      })
  ])
  const dueDate = new DatePicker(...datePickerRange)
  dueDate.isSchoolDay = isSchoolDay
  dueDateTrigger.addEventListener('click', e => {
    dueDate.open()
    e.stopPropagation()
  })
  dueDate.onchange = date => {
    dueDateTrigger.textContent = localizeWith('date', 'times', {
      M: months[date.m],
      D: date.d
    })
  }
  contentInput.placeholder = localize('assignment', 'placeholders')
  let selectedImportance
  function setImportance (importance) {
    selectedImportance = importance
    importanceBtns.forEach((btn, i) => {
      if (i === importance) btn.classList.add('raised')
      else btn.classList.remove('raised')
    })
  }
  importanceBtns.forEach((btn, i) => {
    btn.addEventListener('click', e => {
      setImportance(i)
    })
  })

  const editorDialog = document.getElementById('asgn-editor')
  const asgnDeleteBtn = document.getElementById('asgn-delete')
  const asgnCancelBtn = document.getElementById('asgn-cancel')
  const asgnSaveBtn = document.getElementById('asgn-save')
  let currentCancelFn, onDeleteClick, onSaveClick
  asgnDeleteBtn.addEventListener('click', e => {
    if (onDeleteClick) onDeleteClick()
  })
  asgnCancelBtn.addEventListener('click', e => {
    if (currentCancelFn) currentCancelFn()
  })
  asgnSaveBtn.addEventListener('click', e => {
    if (onSaveClick) onSaveClick()
  })
  editorDialog.appendChild(dueDate.wrapper)
  function asgnEditor ({ text, category, importance, dueObj, period }) {
    if (currentCancelFn) currentCancelFn()
    pdDropdown.set(period)
    catDropdown.set(category)
    dueDateTrigger.textContent = localizeWith('date', 'times', {
      M: months[dueObj.m],
      D: dueObj.d
    })
    dueDate.day = dueObj
    contentInput.value = text
    showDialog(editorDialog)
    contentInput.focus()
    setImportance(importance)
    let onSave, onDelete, onFinish
    currentCancelFn = () => {
      onDeleteClick = onSaveClick = currentCancelFn = null
      closeDialog()
    }
    onDeleteClick = () => {
      currentCancelFn()
      if (onDelete) onDelete()
      if (onFinish) onFinish()
      cookie.setItem('[gunn-web-app] assignments', asgnThing.getSaveable())
    }
    onSaveClick = () => {
      currentCancelFn()
      if (onSave)
        onSave({
          text: contentInput.value,
          category: catDropdown.get(),
          importance: selectedImportance,
          dueObj: dueDate.day,
          period: pdDropdown.get()
        })
      if (onFinish) onFinish()
      cookie.setItem('[gunn-web-app] assignments', asgnThing.getSaveable())
    }
    const thing = {
      onSave (fn) {
        onSave = fn
        return thing
      },
      onDelete (fn) {
        onDelete = fn
        return thing
      },
      onFinish (fn) {
        onFinish = fn
        return thing
      }
    }
    return thing
  }

  const ASSYNC_ID = '[gunn-web-app] assignments.assync'
  const assyncID = cookie.getItem(ASSYNC_ID)
  const assyncIDDisplay = document.getElementById('assync-id')
  assyncIDDisplay.textContent = assyncID
  const refresh = document.createElement('button')
  refresh.classList.add('material')
  refresh.classList.add('raised')
  refresh.classList.add('icon')
  refresh.classList.add('assync-refresh')
  ripple(refresh)
  refresh.innerHTML = `<i class="material-icons">&#xe5d5;</i>`
  if (!assyncID) refresh.style.display = 'none'
  refresh.addEventListener('click', e => {
    refresh.disabled = true
    asgnThing.refreshAssync().then(() => {
      refresh.disabled = false
      cookie.setItem('[gunn-web-app] assignments', asgnThing.getSaveable())
    })
  })
  const wrapper = document.getElementById('assync-auth-wrapper')
  wrapper.className = assyncID ? 'is-using-assync' : 'isnt-using-assync'
  document.getElementById('create-assync').addEventListener('click', e => {
    wrapper.className = 'is-loading'
    asgnThing
      .joinAssync()
      .then(hash => {
        cookie.setItem(ASSYNC_ID, hash)
        assyncIDDisplay.textContent = hash
        wrapper.className = 'is-using-assync'
        refresh.style.display = null
        refresh.click()
      })
      .catch(err => {
        logError(err)
        wrapper.className = 'isnt-using-assync'
      })
  })
  const join = document.getElementById('join-assync')
  const joinID = document.getElementById('join-assync-id')
  joinID.placeholder = localize('assync', 'placeholders')
  joinID.addEventListener('keydown', e => {
    if (e.keyCode === 13) join.click()
  })
  join.addEventListener('click', e => {
    wrapper.className = 'is-loading'
    asgnThing
      .joinAssync(joinID.value)
      .then(hash => {
        cookie.setItem(ASSYNC_ID, hash)
        assyncIDDisplay.textContent = hash
        wrapper.className = 'is-using-assync'
        refresh.style.display = null
        refresh.click()
      })
      .catch(err => {
        logError(err)
        wrapper.className = 'isnt-using-assync'
      })
  })
  document.getElementById('leave-assync').addEventListener('click', e => {
    asgnThing.leaveAssync()
    cookie.removeItem(ASSYNC_ID)
    wrapper.className = 'isnt-using-assync'
    refresh.style.display = 'none'
  })

  const asgnThing = initAssignments({
    editor: asgnEditor,
    save () {
      cookie.setItem('[gunn-web-app] assignments', asgnThing.getSaveable())
    },
    rerender () {
      scheduleapp.render()
    },
    getDefaultDate () {
      return datepicker.day
    },
    loadJSON: cookie.getItem('[gunn-web-app] assignments'),
    failQueueCookie: '[gunn-web-app] assignments.failQueue',
    assyncID
  })
  asgnThing.insertButton(refresh)
  asgnThing.todayIs(getPeriodSpan, now(), formatOptions.asgnSort)
  asgnThing.displaySection(formatOptions.asgnPos)
  if (assyncID) {
    refresh.click()
  }

  const periodSymbols = {
    Brunch: localize('symbols/brunch'),
    Lunch: localize('symbols/lunch'),
    Flex: localize('symbols/flex'),
    SELF: localize('symbols/self'),
    A: localize('symbols/period-a'),
    B: localize('symbols/period-b'),
    C: localize('symbols/period-c'),
    D: localize('symbols/period-d'),
    E: localize('symbols/period-e'),
    F: localize('symbols/period-f'),
    G: localize('symbols/period-g'),
    H: localize('symbols/period-h'),
    '0': localize('symbols/period-zero'),
    GT: '?'
  }
  const ICON_SIZE = 256
  const ICON_FONT = '"Roboto", sans-serif'
  const ICON_PADDING = 0.2
  const maxSize = ICON_SIZE * (1 - 2 * ICON_PADDING)
  const iconCanvas = document.createElement('canvas')
  const iconCtx = iconCanvas.getContext('2d')
  iconCanvas.width = ICON_SIZE
  iconCanvas.height = ICON_SIZE
  iconCtx.textAlign = 'center'
  iconCtx.textBaseline = 'middle'
  function getIcon (period) {
    const { colour = '#000000', label } = periodstyles[period]
    if (colour[0] === '#') {
      iconCtx.fillStyle = colour
      iconCtx.fillRect(0, 0, ICON_SIZE, ICON_SIZE)
      iconCtx.fillStyle = getFontColour(colour)
    } else {
      return `./.period-images/${period}?${colour}`
    }
    const text = periodSymbols[period] || label
    iconCtx.font = `${maxSize}px ${ICON_FONT}`
    const { width } = iconCtx.measureText(text)
    const fontSize = Math.min((maxSize * maxSize) / width, maxSize)
    iconCtx.font = `${fontSize}px ${ICON_FONT}`
    // It is annoying having to do fontSize * 0.1 so it looks vertically centred
    iconCtx.fillText(text, ICON_SIZE / 2, ICON_SIZE / 2 + fontSize * 0.1)
    return iconCanvas.toDataURL()
  }
  const notifSettings = {
    enabled: false,
    timeBefore: 5 * 60
  }
  const notifDropdownWrapper = document.getElementById('notif-time-before')
  const notifDropdown = makeDropdown(notifDropdownWrapper, [
    [15 * 60, localize('time-before/before-0-15-00')],
    [10 * 60, localize('time-before/before-0-10-00')],
    [5 * 60, localize('time-before/before-0-05-00')],
    [2 * 60, localize('time-before/before-0-02-00')],
    [1 * 60, localize('time-before/before-0-01-00')],
    [30, localize('time-before/before-0-00-30')],
    [10, localize('time-before/before-0-00-10')],
    [0, localize('time-before/immediately')],
    [null, localize('time-before/never')]
  ]).set(null)
  if ('Notification' in window) {
    if (
      formatOptions.timeBeforeNotif !== 'off' &&
      Notification.permission === 'granted'
    ) {
      notifDropdown.set(+formatOptions.timeBeforeNotif)
      notifSettings.enabled = true
      notifSettings.timeBefore = +formatOptions.timeBeforeNotif
    }
    notifDropdown.onChange(async time => {
      if (time !== null) {
        if (
          Notification.permission === 'granted' ||
          (await Notification.requestPermission()) === 'granted'
        ) {
          notifSettings.enabled = true
          notifSettings.timeBefore = time
          formatOptions.timeBeforeNotif = time
        } else {
          time = null
          notifDropdown.set(null)
        }
      }
      if (time === null) {
        formatOptions.timeBeforeNotif = 'off'
        notifSettings.enabled = false
      }
      nextNotif.update()
      saveFormatOptions()
    })
  } else {
    // Remove option if notifications aren't supported
    notifDropdownWrapper.parentNode.parentNode.removeChild(
      notifDropdownWrapper.parentNode
    )
  }
  let stopBell = null
  let updateVolume = null
  function playBell () {
    if (stopBell) stopBell()
    const audioCtx = getAudioContext()
    const oscillator = audioCtx.createOscillator()
    oscillator.type = 'square'
    // Thanks Matthew for the bell pitch
    // https://en.wikipedia.org/wiki/E_(musical_note)#Designation_by_octave
    oscillator.frequency.setValueAtTime(659.255, audioCtx.currentTime) // value in hertz
    const gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(
      +formatOptions.bellVolume / 100,
      audioCtx.currentTime
    )
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 5)
    updateVolume = (volume = +formatOptions.bellVolume / 100) => {
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime)
    }
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    oscillator.start()
    stopBell = () => {
      clearTimeout(timeoutId)
      oscillator.stop()
      stopBell = null
      updateVolume = null
    }
    // Thanks Timothy for timing the bell!
    const timeoutId = setTimeout(stopBell, 5000)
  }
  const volumeSliderMarker = document.getElementById('bell-volume-marker')
  const volumeSlider = createRange({
    showMin: false,
    oninput: ([, volume]) => updateVolume && updateVolume(volume),
    onchange: ([, volume]) => {
      if (updateVolume) updateVolume(volume)
      formatOptions.bellVolume = Math.round(volume * 100)
      saveFormatOptions()
    }
  })
  volumeSlider.range = [0, +formatOptions.bellVolume / 100]
  volumeSliderMarker.parentNode.replaceChild(
    volumeSlider.elem,
    volumeSliderMarker
  )
  const playBellBtn = document.getElementById('play-bell')
  playBellBtn.addEventListener('click', e => {
    playBell()
  })
  if (+formatOptions.bellVolume !== 0) {
    const noAudioWarning = document.getElementById('no-audio')
    noAudioWarning.style.display = 'flex'
    document.addEventListener(
      'click',
      e => {
        noAudioWarning.style.display = null
      },
      { once: true }
    )
  }
  const weekwrapper = document.querySelector('#weekwrapper')
  let lastWeek = null
  function makeWeekHappen () {
    const week = scheduleapp.getWeek()
    const serialized = JSON.stringify(week)
    if (lastWeek !== serialized) {
      // Only regenerate the weekwrapper if the week changed
      lastWeek = serialized
      weekwrapper.innerHTML = ''
      const days = localize('ds').split('  ')
      for (let i = 0; i < week.length; i++) {
        const day = week[i]
        const div = Object.assign(document.createElement('div'), {
          className: day.today ? 'today' : ''
        })
        ripple(div)
        div.addEventListener('click', e => {
          const d = day.date
          datepicker.day = {
            d: d.getDate(),
            m: d.getMonth(),
            y: d.getFullYear()
          }
        })
        div.appendChild(
          Object.assign(document.createElement('h1'), {
            textContent: days[i]
          })
        )
        for (const period of day) {
          const span = Object.assign(document.createElement('span'), {
            title: period.label
          })
          if (period.colour[0] === '#') {
            span.style.backgroundColor = period.colour
          } else {
            span.style.backgroundImage = `url(./.period-images/${
              period.id
            }?${encodeURIComponent(period.colour)})`
          }
          if (period.id === 'GT') {
            span.title = localize('gunn-together/name')
            span.classList.add('gt-confuse')
          }
          div.appendChild(span)
        }
        weekwrapper.appendChild(div)
      }
    }
    for (let i = 0; i < weekwrapper.children.length; i++) {
      const day = week[i]
      const div = weekwrapper.children[i]
      div.className = day.today ? 'today' : ''
    }
    renderEvents()
  }
  const eventsul = document.querySelector('#events')
  const events = {}
  const months = localize('months').split('  ')
  const eventsHeading = document.createElement('h1')
  eventsHeading.textContent = localize('events')
  eventsul.parentNode.insertBefore(eventsHeading, eventsul)
  function renderEvents () {
    const offset = scheduleapp.offset
    const d = now()
    eventsul.innerHTML = `<li><span class="secondary center">${localize(
      'loading'
    )}</span></li>`
    function actuallyRenderEvents (items) {
      let innerHTML = ``
      if (items.length) {
        for (let i = 0; i < items.length; i++) {
          let timerange = ''
          if (items[i].start) {
            const start = new Date(items[i].start)
            const end = new Date(items[i].end)
            if (formatOptions.hourCycle === '0')
              timerange = `${start.getMinutes()} &ndash; ${end.getMinutes()}`
            else if (formatOptions.hourCycle === '24')
              timerange = `${start.getHours()}:${(
                '0' + start.getMinutes()
              ).slice(-2)} &ndash; ${end.getHours()}:${(
                '0' + end.getMinutes()
              ).slice(-2)}`
            else
              timerange = `${((start.getHours() - 1) % 12) + 1}:${(
                '0' + start.getMinutes()
              ).slice(-2)}${
                start.getHours() < 12 ? 'a' : 'p'
              }m &ndash; ${((end.getHours() - 1) % 12) + 1}:${(
                '0' + end.getMinutes()
              ).slice(-2)}${end.getHours() < 12 ? 'a' : 'p'}m`
          }
          if (items[i].loc) {
            if (timerange) timerange += ' &mdash; '
            timerange += items[i].loc
          }
          if (timerange)
            timerange = `<span class="secondary">${timerange}</span>`
          innerHTML += `<li><span class="primary">${
            items[i].name
          }</span><span class="secondary${
            items[i].error ? ' get-error' : ''
          }">${items[i].desc || ''}</span>${timerange}</li>`
        }
      } else {
        innerHTML = `<li><span class="secondary center">${localize(
          'no-events'
        )}</span></li>`
      }
      eventsul.innerHTML = innerHTML
    }
    if (events[offset]) {
      if (events[offset] !== 'loading') {
        actuallyRenderEvents(events[offset])
      }
    } else {
      const dateDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + offset
      ).toISOString()
      const end = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + offset + 1
      )
      end.setMilliseconds(-1) // Do not include the first millisecond of the next day
      events[offset] = 'loading'
      ajax(
        // timeZone=America/Los_Angeles because the calendar is in UTC so
        // full-day events from the next day would otherwise be included
        `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events?key=${apiKey}&timeMin=${dateDate}&timeMax=${end.toISOString()}&timeZone=${schoolTimeZone}&showDeleted=false&singleEvents=true&orderBy=startTime&fields=items(description%2Cend(date%2CdateTime)%2Clocation%2Cstart(date%2CdateTime)%2Csummary)`,
        json => {
          json = JSON.parse(json).items
          const e = []
          for (let i = 0; i < json.length; i++) {
            e[i] = {
              start: json[i].start.dateTime,
              end: json[i].end.dateTime,
              name: json[i].summary,
              desc: json[i].description,
              loc: json[i].location
            }
          }
          events[offset] = e
          if (scheduleapp.offset === offset)
            actuallyRenderEvents(events[offset])

          const date = dateDate.slice(5, 10)
          const alternateJSON = json.filter(
            ev =>
              altScheduleRegex.test(ev.summary) ||
              noSchoolRegex.test(ev.summary)
          )
          const altSched = toAlternateSchedules(alternateJSON)
          let ugwitaAltObj = {}
          let change = false
          if (cookie.getItem(ALT_KEY))
            ugwitaAltObj = JSON.parse(cookie.getItem(ALT_KEY))
          const selfDay = json.find(ev => ev.summary.includes('SELF'))
          if (selfDay) {
            if (!selfDays.includes(date)) {
              selfDays.push(date)
              change = true
              ugwitaAltObj.self = selfDays
            }
          } else {
            const index = selfDays.indexOf(date)
            if (~index) {
              selfDays.splice(index, 1)
              change = true
              ugwitaAltObj.self = selfDays
            }
          }
          if (altSched[date] !== undefined) {
            ugwitaAltObj[date] = altSched[date]
            ugwaifyAlternates(
              alternates,
              date,
              altSched[date],
              alternateJSON[0].summary
            )
            change = true
          } else if (ugwitaAltObj[date] !== undefined) {
            delete ugwitaAltObj[date]
            delete alternates[
              date
                .split('-')
                .map(Number)
                .join('-')
            ]
            change = true
          }
          if (change) {
            cookie.setItem(ALT_KEY, JSON.stringify(ugwitaAltObj))
            if (scheduleapp.options.autorender) scheduleapp.render()
            makeWeekHappen()
          }
        },
        e => {
          events[offset] = [
            { name: '', desc: `${e}${localize('events-error')}`, error: true }
          ]
          if (scheduleapp.offset === offset)
            actuallyRenderEvents(events[offset])
        }
      )
    }
  }
  function identifyPeriod (name) {
    name = name.toLowerCase()
    if (~name.indexOf('period')) {
      // Detect PeriodE/PeriodG (2020-03-31)
      const letter = /(?:\b|period)([a-g1-7])\b/i.exec(name)
      if (letter) {
        return isNaN(+letter[1])
          ? // Letter period
            letter[1].toUpperCase()
          : // Number period
            ' ABCDEFG'[letter[1]]
      }
    }
    if (~name.indexOf('self')) return 'SELF'
    else if (
      ~name.indexOf('flex') ||
      ~name.indexOf('assembl') ||
      ~name.indexOf('attend') || // HACK to detect PSAT day (2018-10-10) - as per Ugwisha
      ~name.indexOf('tutorial')
    )
      return 'Flex'
    else if (~name.indexOf('brunch') || ~name.indexOf('break')) return 'Brunch'
    else if (~name.indexOf('unch') || ~name.indexOf('turkey')) return 'Lunch'
    else if (~name.indexOf('together')) return 'GT'
    else return name
  }
  const daynames = localize('days').split('  ')
  function toTraditionalUGWATime (minutes) {
    return {
      totalminutes: minutes,
      hour: Math.floor(minutes / 60),
      minute: minutes % 60
    }
  }
  function ugwaifyAlternates (altObj, dayString, ugwitaData, desc) {
    if (ugwitaData === undefined) return true
    const [month, day] = dayString.split('-').map(Number)
    let date
    if (month > 6) date = new Date(2020, month - 1, day)
    else date = new Date(2021, month - 1, day)
    const periods = []
    if (ugwitaData !== null) {
      ugwitaData.forEach(p => {
        if (!/collaboration|meeting/i.test(p.name)) {
          const pd = identifyPeriod(p.name)
          periods.push({
            name: pd,
            start: p.start,
            end: p.end
          })
        }
      })
      for (let i = 0; i < periods.length; i++) {
        const period = periods[i]
        if (period.name === 'Brunch' || period.name === 'Lunch') {
          if (i === 0) periods.splice(i--, 1)
          else if (i === periods.length - 1) periods.splice(i--, 1)
          else {
            period.end = periods[i + 1].start - 10
          }
        }
        period.start = toTraditionalUGWATime(period.start)
        period.end = toTraditionalUGWATime(period.end)
      }
    }
    alternates[`${month}-${day}`] = {
      dayname: daynames[date.getDay()],
      day: date.getDay(),
      monthname: months[month],
      month: month,
      date: day,
      description: desc || localize('default-alt-msg'),
      periods: periods
    }
    return true
  }
  let alternates
  if (cookie.getItem(ALT_KEY)) alternates = JSON.parse(cookie.getItem(ALT_KEY))
  else alternates = {}
  const selfDays = alternates.self || []
  for (const dayString in alternates) {
    if (!dayString.includes('-')) continue
    ugwaifyAlternates(alternates, dayString, alternates[dayString])
  }
  const hPeriods = JSON.parse(
    cookie.getItem('[gunn-web-app] scheduleapp.h')
  ) || [
    null,
    [makeHMTM(15, 45).totalminutes, makeHMTM(16, 15).totalminutes],
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    null,
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    null,
    null
  ]
  const scheduleAppWrapper = document.querySelector('#schedulewrapper')
  let manualAltSchedules = {}
  manualAltSchedulesProm.then(schedules => {
    manualAltSchedules = schedules
    scheduleapp.render()
    makeWeekHappen()
  })
  const scheduleapp = scheduleApp({
    element: scheduleAppWrapper,
    periods: periodstyles,
    normal: normalschedule,
    alternates: alternates,
    selfDays: selfDays,
    get hPeriods () {
      return formatOptions.showH === 'yes-h-period2' ? hPeriods : []
    },
    offset: 0,
    update: true,
    h24: formatOptions.hourCycle === '24',
    h0Joke: formatOptions.hourCycle === '0',
    compact: formatOptions.timeLength === 'compact',
    // No longer relevant, for SELF has taken over the school :(
    // self: +formatOptions.showSelf,
    self: true,
    displayAddAsgn: formatOptions.showAddAsgn === 'yes',
    show0: formatOptions.showZero === 'yes' && {
      name: '0',
      start: { hour: 7, minute: 15, totalminutes: 435 },
      end: { hour: 8, minute: 5, totalminutes: 485 }
    },
    hidePreps: formatOptions.hidePreps === 'prepnt',
    getAssignments (date, getPeriodSpan) {
      return asgnThing.getScheduleAsgns(date, getPeriodSpan)
    },
    customSchedule (date, y, m, d, wd) {
      const schedule = manualAltSchedules[`${y}-${m + 1}-${d}`]
      if (!schedule) return
      const { periods, description = localize('default-alt-msg') } = schedule
      return {
        periods:
          formatOptions.showH === 'yes-h-period2'
            ? periods
            : periods.filter(pd => pd.name !== 'H'),
        alternate: { description }
      }
    },
    autorender: false
  })
  setOnSavedClubsUpdate(scheduleapp.render)
  asgnThing.todayIs() // rerender now that the customization has loaded properly into periodstyles
  const yesterdayer = document.querySelector('#plihieraux')
  const tomorrower = document.querySelector('#plimorgaux')
  const datepicker = new DatePicker(...datePickerRange)
  const d = now()
  datepicker.onchange = e => {
    if (scheduleapp.options.autorender) {
      e.d--
      yesterdayer.disabled = datepicker.compare(e, datepicker.start) < 0
      e.d += 2
      tomorrower.disabled = datepicker.compare(e, datepicker.end) > 0
      e.d--
      if (previewingFuture) {
        previewingFuture.remove()
        previewingFuture = null
      }
    }
    if (e !== null) {
      const d = new Date(e.y, e.m, e.d).getTime()
      const today = currentTime()
      scheduleapp.offset = Math.floor((d - today) / 86400000) + 1
      if (scheduleapp.options.autorender) makeWeekHappen()
    }
  }
  scheduleapp.options.isSummer = (y, m, d) =>
    !datepicker.inrange({ y: y, m: m, d: d })
  const nextNotif = scheduleapp
    .addTimer(
      getNext => {
        const { timeBefore } = notifSettings
        const next = getNext((pdTime, nowTime) => pdTime - timeBefore > nowTime)
        return (
          next && {
            time: next.time - timeBefore * 1000,
            link: next.type === 'start'
          }
        )
      },
      (next, { getDate, getSchedule, getUsefulTimePhrase }) => {
        const today = getDate(now())
        const currentMinute = (currentTime() - today.getTime()) / 1000 / 60
        // Apparently getPeriodName gets the period type even though it's
        // already in `periods[index].name` in order to deal with SELF
        // becoming flex even though this could've been dealt with in
        // getSchedule before returning the schedule??
        const { periods, getPeriodName } = getSchedule(today)
        const currentPeriod = periods.findIndex(
          period => currentMinute < period.end.totalminutes
        )
        const { label, link } =
          (currentPeriod !== -1 &&
            periodstyles[getPeriodName(currentPeriod)]) ||
          {}
        const text =
          currentPeriod === -1
            ? localize('over', 'times')
            : currentMinute < periods[currentPeriod].start.totalminutes
            ? localizeWith('starting', 'times', {
                P: label,
                T: getUsefulTimePhrase(
                  Math.ceil(
                    periods[currentPeriod].start.totalminutes - currentMinute
                  )
                )
              })
            : localizeWith('ending', 'times', {
                P: label,
                T: getUsefulTimePhrase(
                  Math.ceil(
                    periods[currentPeriod].end.totalminutes - currentMinute
                  )
                )
              })
        const openLink = next.link && link
        const notification = new Notification(text, {
          icon:
            currentPeriod === -1 ? null : getIcon(getPeriodName(currentPeriod)),
          body: openLink ? localize('notif-click-desc') : ''
        })
        notification.addEventListener('click', e => {
          e.preventDefault()
          if (openLink) {
            const win = window.open(link, '_blank')
            win.focus()
          }
        })
      },
      {
        get enabled () {
          return notifSettings.enabled
        }
      }
    )
    .update()
  const nextLinkOpen = scheduleapp
    .addTimer(
      getNext => {
        if (formatOptions.timeBeforeAutoLink !== 'off') {
          const openLinkBefore = +formatOptions.timeBeforeAutoLink
          const next = getNext(
            (pdTime, nowTime, pdName) =>
              periodstyles[pdName].link && pdTime - openLinkBefore > nowTime,
            { end: false }
          )
          if (next) {
            return { ...next, time: next.time - openLinkBefore * 1000 }
          }
        }
        return null
      },
      next => {
        if (openLinkInIframe) {
          const { link, label } = periodstyles[next.period]
          openLinkInIframe(link, label)
        } else {
          // https://stackoverflow.com/a/11384018
          window.open(periodstyles[next.period].link, '_blank')
        }
      },
      {
        get enabled () {
          return formatOptions.timeBeforeAutoLink !== 'off'
        }
      }
    )
    .update()
  scheduleapp
    .addTimer(
      getNext => {
        if (+formatOptions.bellVolume !== 0) {
          // The five second bell ends when the period starts
          const next = getNext((pdTime, nowTime) => pdTime - 5 > nowTime)
          return next && { time: next.time - 5000 }
        } else {
          return null
        }
      },
      next => {
        playBell()
      },
      {
        get enabled () {
          return +formatOptions.bellVolume !== 0
        }
      }
    )
    .update()
  // TEMP: Unity day orange
  scheduleapp.onNewDay(() => {
    if (now().getDate() === 21 && now().getMonth() === 10 - 1) {
      document.body.classList.add('unity-day')
    }
  }, true)
  function isSchoolDay (d) {
    return scheduleapp.getSchedule(d).periods.length
  }
  datepicker.isSchoolDay = isSchoolDay
  // skip to next school day
  let previewingFuture = false
  if (scheduleapp.endOfDay) {
    d.setDate(d.getDate() + 1)
    previewingFuture = true
  }
  while (
    datepicker.compare(
      { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() },
      datepicker.end
    ) <= 0 &&
    !isSchoolDay(d)
  ) {
    d.setDate(d.getDate() + 1)
    previewingFuture = true
  }
  datepicker.day = { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
  // set from ?date= parameter in URL
  const viewingDate = /(?:\?|&)date=([^&]+)/.exec(window.location.search)
  if (viewingDate) {
    const [y, m, d] = viewingDate[1].split('-').map(Number)
    const proposal = { y: y || 0, m: isNaN(m) ? 0 : m - 1, d: isNaN(d) ? 1 : d }
    if (datepicker.inrange(proposal)) {
      datepicker.day = proposal
      previewingFuture = false
    }
  }
  if (previewingFuture) {
    previewingFuture = document.createElement('div')
    previewingFuture.className = 'previewing-future-notice-wrapper'
    const card = document.createElement('div')
    card.className = 'material-card previewing-future-notice'
    previewingFuture.appendChild(card)
    const span = document.createElement('span')
    span.textContent = localize('previewing-future')
    card.appendChild(span)
    const todayBtn = document.createElement('button')
    todayBtn.className = 'material'
    todayBtn.textContent = localize('return-today')
    todayBtn.addEventListener('click', e => {
      const d = now()
      datepicker.day = { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
      // Probably will be removed by datepicker's onchange handler
      if (previewingFuture) {
        previewingFuture.remove()
        previewingFuture = null
      }
    })
    ripple(todayBtn)
    card.appendChild(todayBtn)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'material'
    closeBtn.textContent = localize('close-future')
    closeBtn.addEventListener('click', e => {
      previewingFuture.remove()
      previewingFuture = null
    })
    ripple(closeBtn)
    card.appendChild(closeBtn)
    const parent = document.querySelector('.section.schedule')
    parent.insertBefore(previewingFuture, parent.firstChild)
  }
  document.body.appendChild(datepicker.wrapper)

  // Date setting is done, so we can now autorender
  scheduleapp.options.autorender = true
  // Begin to autoupdate
  scheduleapp.update()
  makeWeekHappen()
  // Disable buttons accordingly
  const selectedDay = datepicker.day
  selectedDay.d--
  yesterdayer.disabled = datepicker.compare(selectedDay, datepicker.start) < 0
  selectedDay.d += 2
  tomorrower.disabled = datepicker.compare(selectedDay, datepicker.end) > 0
  selectedDay.d--

  onClubsLoaded.then(() => {
    scheduleapp.render()
  })

  // Date control buttons
  document.querySelector('#datepicker').addEventListener(
    'click',
    e => {
      datepicker.open()
    },
    false
  )
  yesterdayer.addEventListener(
    'click',
    e => {
      const proposal = {
        d: datepicker.day.d - 1,
        m: datepicker.day.m,
        y: datepicker.day.y
      }
      if (datepicker.compare(proposal, datepicker.start) >= 0)
        datepicker.day = proposal
    },
    false
  )
  tomorrower.addEventListener(
    'click',
    e => {
      const proposal = {
        d: datepicker.day.d + 1,
        m: datepicker.day.m,
        y: datepicker.day.y
      }
      if (datepicker.compare(proposal, datepicker.end) <= 0)
        datepicker.day = proposal
    },
    false
  )
  document.addEventListener('keydown', e => {
    if (
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.shiftKey &&
      !e.metaKey
    ) {
      if (
        document.body.classList.contains('footer-schedule') &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        if (e.key === 'ArrowLeft') {
          yesterdayer.click()
        } else {
          tomorrower.click()
        }
      }
    }
  })

  if (formatOptions.allowSwipe === 'swipe') {
    scheduleAppWrapper.classList.add('allowing-swipe')
  }
  const MIN_SWIPE_DIST = 40
  const SWIPE_THRESHOLD = 0.3
  const swipePreview = document.getElementById('swipe-preview')
  let swiping = null
  scheduleAppWrapper.addEventListener('pointerdown', e => {
    if (formatOptions.allowSwipe === 'swipe' && swiping === null) {
      swiping = {
        pointerId: e.pointerId,
        swiping: false,
        startX: e.clientX,
        swipingOffset: 0
      }
      e.target.setPointerCapture(e.pointerId)
    }
  })
  scheduleAppWrapper.addEventListener('pointermove', e => {
    if (swiping && swiping.pointerId === e.pointerId) {
      const { width } = scheduleapp.container.getBoundingClientRect()
      if (!swiping.swiping) {
        if (Math.abs(e.clientX - swiping.startX) > MIN_SWIPE_DIST) {
          swiping.swiping = true
          scheduleAppWrapper.classList.add('swiping')
          scheduleAppWrapper.style.userSelect = 'none'
        }
      }
      if (swiping.swiping) {
        const offset = e.clientX > swiping.startX ? -1 : 1
        if (offset !== swiping.swipingOffset) {
          swiping.swipingOffset = offset
          swipePreview.innerHTML = scheduleapp.generateHtmlForOffset(
            scheduleapp.offset + offset
          )
          swipePreview.style.transform =
            offset === -1 ? 'translate(-100%)' : 'translate(100%)'
        }
        const swipeX = e.clientX - swiping.startX
        scheduleapp.container.style.transform = `translateX(${swipeX}px)`
        scheduleapp.container.style.opacity = 1 - Math.abs(swipeX) / width
        swipePreview.style.left = swipeX + 'px'
        swipePreview.style.opacity = Math.abs(swipeX) / width
      }
    }
  })
  async function swipeEnd (e) {
    if (swiping && swiping.pointerId === e.pointerId) {
      if (swiping.swiping) {
        const { width } = scheduleapp.container.getBoundingClientRect()
        const swipeX = e.clientX - swiping.startX
        let change = false
        if (swiping.swipingOffset === -1) {
          if (swipeX > width * SWIPE_THRESHOLD) {
            change = true
            yesterdayer.click()
            scheduleapp.container.style.transform = `translateX(${swipeX -
              width}px)`
          }
        } else {
          if (swipeX < -width * SWIPE_THRESHOLD) {
            change = true
            tomorrower.click()
            scheduleapp.container.style.transform = `translateX(${swipeX +
              width}px)`
          }
        }
        if (change) {
          scheduleapp.container.style.opacity = swipePreview.style.opacity
          // Force repaint
          window
            .getComputedStyle(scheduleapp.container)
            .getPropertyValue('transform')
        }
        scheduleAppWrapper.classList.remove('swiping')
        scheduleAppWrapper.style.userSelect = null
        scheduleapp.container.style.transform = null
        scheduleapp.container.style.opacity = null
      }
      swiping = null
    }
  }
  scheduleAppWrapper.addEventListener('pointerup', swipeEnd)
  scheduleAppWrapper.addEventListener('pointercancel', swipeEnd)

  /* CUSTOMISE PERIODS */
  const materialcolours = 'f44336 E91E63 9C27B0 673AB7 3F51B5 2196F3 03A9F4 00BCD4 009688 4CAF50 8BC34A CDDC39 FFEB3B FFC107 FF9800 FF5722 795548 9E9E9E 607D8B'.split(
    ' '
  )
  function addPeriodCustomisers (elem) {
    function period (name, id) {
      const { label: val = '', colour = THEME_COLOUR, link = '' } = periodstyles[
        id
      ]
      let isImage = colour[0] !== '#'
      let init = true
      const div = document.createElement('div')
      div.classList.add('customiser-wrapper')
      const pickertrigger = document.createElement('button')
      const picker = new ColourPicker(e => {
        if (isImage) return
        pickertrigger.style.backgroundColor = e
        // Changes made by .setPeriod are also reflected in periodstyles by
        // reference
        if (scheduleapp) scheduleapp.setPeriod(id, { colour: e }, !init)
        makeWeekHappen()
        if (init) {
          init = false
        } else {
          if (periodstyles[id].update) periodstyles[id].update()
          savePeriodStyles()
        }
        if (picker.darkness() > 125) {
          pickertrigger.classList.add('ripple-dark')
          pickertrigger.classList.remove('ripple-light')
        } else {
          pickertrigger.classList.add('ripple-light')
          pickertrigger.classList.remove('ripple-dark')
        }
      })
      ripple(pickertrigger)
      pickertrigger.classList.add('material')
      pickertrigger.classList.add('customiser-colour')
      if (isImage) {
        pickertrigger.style.backgroundImage = `url(./.period-images/${id}?${currentTime()})`
        // colour input already triggers this, so we only need to update image
        if (periodstyles[id].update) periodstyles[id].update()
      }
      pickertrigger.addEventListener(
        'click',
        e => {
          picker.trigger(pickertrigger)
        },
        false
      )
      picker.colour = isImage ? THEME_COLOUR : colour
      div.appendChild(pickertrigger)
      const inputWrapper = document.createElement('div')
      inputWrapper.className = 'inputs-wrapper'
      const input = materialInput(
        name,
        'text',
        localizeWith('period-name-label', 'other', { P: name })
      )
      if (val) {
        input.input.value = val
        input.wrapper.classList.add('filled')
      }
      input.input.addEventListener(
        'change',
        e => {
          if (scheduleapp) {
            scheduleapp.setPeriod(id, { name: input.input.value }, true)
          }
          makeWeekHappen()
          if (periodstyles[id].update) periodstyles[id].update()
          savePeriodStyles()
        },
        false
      )
      inputWrapper.appendChild(input.wrapper)
      const linkInput = materialInput(
        localizeWith('period-link', 'other', { P: name }),
        'url',
        localizeWith('period-set-link', 'other', { P: name })
      )
      if (link) {
        linkInput.input.value = link
        linkInput.wrapper.classList.add('filled')
      }
      linkInput.input.addEventListener(
        'change',
        e => {
          if (scheduleapp) {
            scheduleapp.setPeriod(id, { link: linkInput.input.value }, true)
          }
          makeWeekHappen()
          // No need to call .update() on periodstyles because the link is not
          // relevant to rendering the period dropdowns
          savePeriodStyles()
        },
        false
      )
      inputWrapper.appendChild(linkInput.wrapper)
      div.appendChild(inputWrapper)
      elem.appendChild(div)
      const t = document.createElement('div')
      t.classList.add('customiser-colourwrapper')
      for (
        let i = 0, arr = materialcolours, len = arr.length, c = arr[i];
        i < len;
        i++, c = arr[i]
      )
        (c => {
          const s = document.createElement('span')
          s.classList.add('customiser-materialcolour')
          s.addEventListener(
            'click',
            e => {
              picker.colour = c
            },
            false
          )
          s.style.backgroundColor = c
          t.appendChild(s)
        })('#' + c)
      const s = document.createElement('span')
      s.classList.add('customiser-materialcolour')
      s.classList.add('customiser-blackwhite')
      s.addEventListener(
        'click',
        e => {
          picker.colour = document.body.classList.contains('light')
            ? '#000000'
            : '#ffffff'
        },
        false
      )
      t.appendChild(s)
      picker.window.appendChild(t)
      const imageInput = materialInput(localize('image-url'), 'url')
      imageInput.wrapper.classList.add('customiser-image')
      if (isImage) {
        imageInput.input.value = colour
        imageInput.wrapper.classList.add('filled')
      }
      imageInput.input.addEventListener('change', e => {
        imageInput.disabled = true
        if (imageInput.input.value) {
          cacheBackground(imageInput.input.value, id)
            .then(() => {
              imageInput.disabled = false
              isImage = true
              // intentionally not resetting backgroundColor because transparency meh
              pickertrigger.style.backgroundImage = `url(./.period-images/${id}?${currentTime()})`
              if (scheduleapp) {
                scheduleapp.setPeriod(
                  id,
                  { colour: imageInput.input.value },
                  true
                )
              }
              makeWeekHappen()
              if (periodstyles[id].update) periodstyles[id].update()
              savePeriodStyles()
              pickertrigger.classList.add('ripple-dark')
              pickertrigger.classList.remove('ripple-light')
            })
            .catch(err => {
              imageInput.disabled = false
              logError(err)
              alert(localize('cannot'))
            })
        } else {
          caches
            .open(IMAGE_CACHE)
            .then(cache => {
              imageInput.disabled = false
              cache.delete(`./.period-images/${id}`)
              isImage = false
              pickertrigger.style.backgroundColor = picker.colour
              pickertrigger.style.backgroundImage = null
              if (scheduleapp) {
                scheduleapp.setPeriod(id, { colour: picker.colour }, true)
              }
              makeWeekHappen()
              if (periodstyles[id].update) periodstyles[id].update()
              savePeriodStyles()
              if (picker.darkness() > 125) {
                pickertrigger.classList.add('ripple-dark')
                pickertrigger.classList.remove('ripple-light')
              } else {
                pickertrigger.classList.add('ripple-light')
                pickertrigger.classList.remove('ripple-dark')
              }
            })
            .catch(err => {
              imageInput.disabled = false
              logError(err)
            })
        }
      })
      picker.window.appendChild(imageInput.wrapper)
      return period
    }
    return period
  }
  const periodCustomisers = document.createDocumentFragment()
  const addCustomiser = addPeriodCustomisers(periodCustomisers)
  if (formatOptions.showZero === 'yes') {
    addCustomiser(localize('p0'), '0')
  }
  addCustomiser(localizeWith('periodx', 'other', { X: '1' }), 'A')
  addCustomiser(localizeWith('periodx', 'other', { X: '2' }), 'B')
  addCustomiser(localizeWith('periodx', 'other', { X: '3' }), 'C')
  addCustomiser(localizeWith('periodx', 'other', { X: '4' }), 'D')
  addCustomiser(localizeWith('periodx', 'other', { X: '5' }), 'E')
  addCustomiser(localizeWith('periodx', 'other', { X: '6' }), 'F')
  addCustomiser(localizeWith('periodx', 'other', { X: '7' }), 'G')
  // Always showing because why not (it's hard to dynamically show/hide this)
  addCustomiser(localizeWith('periodx', 'other', { X: '8' }), 'H')
  addCustomiser(localize('flex'), 'Flex')
  // if (+formatOptions.showSelf)
  addCustomiser(localize('self'), 'SELF')
  // TEMP: Brunch is not on the schedule
  // addCustomiser(localize('brunch'), 'Brunch')
  addCustomiser(localize('lunch'), 'Lunch')
  document
    .querySelector('.section.options')
    .insertBefore(
      periodCustomisers,
      document.querySelector('#periodcustomisermarker')
    )

  const openLinkBefore =
    formatOptions.timeBeforeAutoLink === 'off'
      ? null
      : +formatOptions.timeBeforeAutoLink
  let openLinkInIframe
  const openLinkDropdownWrapper = document.getElementById('link-time-before')
  const openLinkDropdown = makeDropdown(openLinkDropdownWrapper, [
    [60 * 60, localize('time-before/before-1-00-00')],
    [30 * 60, localize('time-before/before-0-30-00')],
    [15 * 60, localize('time-before/before-0-15-00')],
    [10 * 60, localize('time-before/before-0-10-00')],
    [5 * 60, localize('time-before/before-0-05-00')],
    [2 * 60, localize('time-before/before-0-02-00')],
    [1 * 60, localize('time-before/before-0-01-00')],
    [0, localize('time-before/immediately')],
    [null, localize('time-before/never')]
  ]).set(openLinkBefore)
  openLinkDropdown.onChange(async time => {
    formatOptions.timeBeforeAutoLink = time === null ? 'off' : time
    nextLinkOpen.update()
    saveFormatOptions()
  })
  openLinkInIframe = formatOptions.openNewTab !== 'yes' && setIframe
  const iframeDialog = document.getElementById('iframe-window')
  const iframe = document.getElementById('iframe')
  const iframeTitleLink = document.getElementById('iframe-title')
  const iframeTitle = document.createTextNode('')
  iframeTitleLink.insertBefore(iframeTitle, iframeTitleLink.firstChild)
  function setIframe (url, name) {
    iframe.src = url
    iframeTitleLink.href = url
    iframeTitle.nodeValue = name
    showDialog(iframeDialog)
  }

  const hEditBtn = document.getElementById('edit-h')
  initHEditor(hPeriods, scheduleapp, formatOptions, makeWeekHappen, hEditBtn)
}

function initHEditor (
  hPeriods,
  scheduleapp,
  formatOptions,
  makeWeekHappen,
  hEditBtn
) {
  function getHumanTime (minutes) {
    if (formatOptions.hourCycle === '0') return minutes % 60
    const h = Math.floor(minutes / 60)
    const m = ('0' + (minutes % 60)).slice(-2)
    if (formatOptions.hourCycle === '24') return `${h}:${m}`
    else return `${((h - 1) % 12) + 1}:${m}${h < 12 ? 'a' : 'p'}m`
  }

  const defaultHPeriods = [
    null,
    [makeHMTM(15, 45).totalminutes, makeHMTM(16, 15).totalminutes],
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
    null
  ]

  const days = localize('days').split('  ')
  const MIN_TIME = 15 * 60
  const MAX_TIME = 21 * 60
  const MIN_LENGTH = 10
  const STEP = 5
  const hEditor = document.getElementById('h-editor')
  hEditBtn.addEventListener('click', e => {
    showDialog(hEditor)
  })
  hEditBtn.disabled = formatOptions.showH !== 'yes-h-period2'
  const hDays = document.createDocumentFragment()
  for (let day = 1; day <= 5; day++) {
    const wrapper = document.createElement('div')
    wrapper.classList.add('h-day')
    hDays.appendChild(wrapper)

    const checkbox = document.createElement('div')
    checkbox.classList.add('material-switch')
    checkbox.tabIndex = 0
    if (hPeriods[day]) checkbox.classList.add('checked')
    checkbox.addEventListener('click', e => {
      // checkbox class checked not yet toggled because the listener that does that is added later
      checkbox.classList.toggle('checked')
      if (checkbox.classList.contains('checked')) {
        range.elem.classList.remove('disabled')
        hPeriods[day] = range.range.map(n =>
          Math.round(n * (MAX_TIME - MIN_TIME) + MIN_TIME)
        )
        label.textContent =
          days[day] +
          ' ' +
          getHumanTime(hPeriods[day][0]) +
          '–' +
          getHumanTime(hPeriods[day][1])
      } else {
        range.elem.classList.add('disabled')
        hPeriods[day] = null
        label.textContent = days[day]
      }
      scheduleapp.render()
      makeWeekHappen()
      cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
    })
    wrapper.appendChild(checkbox)

    const sliderWrapper = document.createElement('div')
    sliderWrapper.classList.add('slider-wrapper')
    wrapper.appendChild(sliderWrapper)

    const label = document.createElement('span')
    label.classList.add('label')
    label.textContent =
      days[day] +
      ' ' +
      (hPeriods[day]
        ? getHumanTime(hPeriods[day][0]) + '–' + getHumanTime(hPeriods[day][1])
        : '')
    sliderWrapper.appendChild(label)

    const range = createRange({
      minRange: MIN_LENGTH / (MAX_TIME - MIN_TIME),
      onchange: r => {
        range.range = r.map(
          n =>
            (Math.round((n * (MAX_TIME - MIN_TIME)) / STEP) * STEP) /
            (MAX_TIME - MIN_TIME)
        )
        hPeriods[day] = range.range.map(n =>
          Math.round(n * (MAX_TIME - MIN_TIME) + MIN_TIME)
        )
        // Apparently there's this `autorender` option that I should be
        // checking? but meh
        scheduleapp.render()
        makeWeekHappen()
        cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
      },
      oninput: r => {
        r = r.map(
          n => Math.round((n * (MAX_TIME - MIN_TIME)) / STEP) * STEP + MIN_TIME
        )
        label.textContent =
          days[day] + ' ' + (getHumanTime(r[0]) + '–' + getHumanTime(r[1]))
      }
    })
    range.range = (hPeriods[day] || defaultHPeriods[day]).map(
      m => (m - MIN_TIME) / (MAX_TIME - MIN_TIME)
    )
    if (!hPeriods[day]) range.elem.classList.add('disabled')
    sliderWrapper.appendChild(range.elem)
  }
  document.getElementById('h-days').appendChild(hDays)
}
