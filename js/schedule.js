/* global fetch, caches, alert, Notification, atob */

import {
  altScheduleRegex,
  noSchoolRegex,
  toAlternateSchedules
} from './altScheduleGenerator.js?for=appdesign'
import apSchedule from './ap-schedule.js'
import { customElems, getFontColour, scheduleApp } from './app.js'
import {
  categoryList,
  initAssignments,
  localizeCategory
} from './assignments.js'
import { ColourPicker } from './colour.js'
import { DatePicker, Day } from './date.js'
import { createReactive } from './dumb-reactive.js'
import { onSection } from './footer.js'
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
  isOnline,
  loadJsonStorage,
  logError,
  outsideSchool,
  onBlur,
  now,
  schoolTimeZone,
  showDialog,
  shuffleInPlace,
  THEME_COLOUR,
  toEach
} from './utils.js'

/*
  This file is so large that it needs a...

  Table of Contents
  - Cache of period image backgrounds
  - Period customisation of names and colours
  - Other customisation options (called "format options")
  - Support (in the Utilities tab)
  - Assignments
  - Period reminders (notifications, virtual bell, and automatic link opening)
  - Normal and alternate schedules, and updating them from the events
  - Events (for some reason `renderEvents` is only called by `makeWeekHappen`)
  - Week preview
  - Schedule app and date picker
  - H period editor
  - initSchedule, called when `localize` is ready

  Why is this file so long anyways? If you make your way to the "Other
  customisation" section, you can see that there's a lot of features not
  relevant to the schedule listed. Since these so-called "format options" were
  made to be too easily extensible, a lot of unrelated features now use it to
  store almost all options, like the radios and switches you see the Options
  tab.
*/

/// Cache of period image backgrounds
const IMAGE_CACHE = 'ugwa-img-cache-YEET'
export function cacheBackground (url, pd) {
  return Promise.all([
    caches.open(IMAGE_CACHE),
    fetch(url, { mode: 'no-cors', cache: 'no-cache' })
  ]).then(([cache, res]) => cache.put(`./.period-images/${pd}`, res))
}

/// Period customisation of names and colours
/**
 * Period customisation save format version
 * WARNING: if you change this it'll change everyone's saves; it's best to add a
 * way to convert the saves properly
 */
const VERSION = 5
/** Ordering of period letters in period customisation data */
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
/** Period customisation values (names, colours, etc.) */
let periodstyles
function savePeriodStyles () {
  const options = new Array(letras.length)
  options[0] = VERSION
  for (let i = 1; i < letras.length; i++) {
    const { label, colour, link } = periodstyles[letras[i]]
    options[i] = [label, colour, link]
  }
  cookie.setItem('[gunn-web-app] scheduleapp.options', JSON.stringify(options))
}
const materialcolours = [
  'f44336',
  'E91E63',
  '9C27B0',
  '673AB7',
  '3F51B5',
  '2196F3',
  '03A9F4',
  '00BCD4',
  '009688',
  '4CAF50',
  '8BC34A',
  'CDDC39',
  'FFEB3B',
  'FFC107',
  'FF9800',
  'FF5722',
  '795548',
  '9E9E9E',
  '607D8B'
]
function allLetters () {
  for (const letter of 'ABCDEFGH') {
    const { label } = periodstyles[letter]
    if (label !== localizeWith('periodx', 'other', { X: letter })) {
      return false
    }
  }
  return true
}
function checkGlitch () {
  if (allLetters()) {
    document.body.classList.add('glitch')
  } else {
    document.body.classList.remove('glitch')
  }
}
function addCustomiser (parent, name, id) {
  const { label: val = '', colour = THEME_COLOUR, link = '' } = periodstyles[id]
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
      checkGlitch()
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
  parent.appendChild(div)
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
            scheduleapp.setPeriod(id, { colour: imageInput.input.value }, true)
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
  return div
}
function initPeriodCustomisers () {
  const f = document.createDocumentFragment()
  if (formatOptions.showZero === 'yes') {
    addCustomiser(f, localize('p0'), '0')
  }
  addCustomiser(f, localizeWith('periodx', 'other', { X: '1' }), 'A')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '2' }), 'B')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '3' }), 'C')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '4' }), 'D')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '5' }), 'E')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '6' }), 'F')
  addCustomiser(f, localizeWith('periodx', 'other', { X: '7' }), 'G')
  // Always showing because why not (it's hard to dynamically show/hide this)
  addCustomiser(f, localizeWith('periodx', 'other', { X: '8' }), 'H')
  addCustomiser(f, localize('flex'), 'Flex')
  // if (+formatOptions.showSelf)
  addCustomiser(f, localize('self'), 'SELF')
  // TEMP: Brunch is not on the schedule
  // addCustomiser(localize('brunch'), 'Brunch')
  addCustomiser(f, localize('lunch'), 'Lunch')
  document
    .querySelector('.section.options')
    .insertBefore(f, document.querySelector('#periodcustomisermarker'))
}

/// Other customisation options (called "format options")
/** Save format version for other customisation options (eg the radios) */
const FORMATTING_VERSION = '10'
let hEditBtn, setIframe, openLinkInIframe
/**
 * Definition of each "format option"
 * FORBIDDEN CHARACTERS: " (used for radio CSS selector) and . (used for storing
 * in localStorage)
 */
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
      onChange: value => asgnThing.todayIs(getPeriodSpan, Day.today(), value)
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
        scheduleUpdated()
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
  // 16: "TEMP"
  tempCheckState: { default: '0' },
  // 17:
  updateTitle: {
    // Disable by default on phones, where the tab title doesn't show in the
    // browser anyways (533 might be the wrong boundary for the blurry edge
    // between phones and tablets--kindles are 533 while some obscure phones are
    // 540--but whatever)
    default:
      Math.min(window.screen.width, window.screen.height) < 533 ? 'no' : 'yes',
    toggle: {
      id: 'update-title',
      on: 'yes',
      off: 'no',
      onChange: checked => {
        scheduleapp.options.updateTitle = checked
        if (checked) {
          scheduleapp.displayCurrentStatus()
        } else {
          scheduleapp.resetCurrentStatus()
        }
      }
    }
  },
  // 18:
  suppressGraduation: { default: '0' }
}
// Load format options from localStorage
const formatOptionsCookie = cookie.getItem(
  '[gunn-web-app] scheduleapp.formatOptions'
)
const formatOptions = {}
let newUser = false
if (formatOptionsCookie) {
  const values = formatOptionsCookie.split('.')
  values[0] = FORMATTING_VERSION
  const keys = Object.keys(formatOptionInfo)
  for (let i = 0; i < keys.length; i++) {
    if (typeof values[i] === 'string') {
      formatOptions[keys[i]] = values[i]
    } else {
      formatOptions[keys[i]] = formatOptionInfo[keys[i]].default
    }
  }
} else {
  for (const key of Object.keys(formatOptionInfo)) {
    formatOptions[key] = formatOptionInfo[key].default
  }
  saveFormatOptions()
  newUser = true
}
function saveFormatOptions () {
  cookie.setItem(
    '[gunn-web-app] scheduleapp.formatOptions',
    Object.keys(formatOptionInfo)
      .map(key => formatOptions[key])
      .join('.')
  )
}
function initFormatSwitches () {
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
}
if (formatOptions.tempCheckState < 4) {
  try {
    formatOptions.tempCheckState = '4'
    // Stolen from `initSaveCodeManager` in main.js
    const UGWA_COOKIE_PREFIX = '[gunn-web-app] '
    const EXCEPT = 'global.theme'
    const toExport = { '2ua': navigator.userAgent }
    for (let i = cookie.length; i--; ) {
      const key = cookie.key(i)
      if (key.slice(0, UGWA_COOKIE_PREFIX.length) === UGWA_COOKIE_PREFIX) {
        toExport['2_' + key.slice(UGWA_COOKIE_PREFIX.length)] = String(
          cookie.getItem(key)
        )
      } else if (key === EXCEPT) {
        toExport['2_' + key] = String(cookie.getItem(key))
      }
    }
    for (const [key, value] of Object.entries(formatOptions)) {
      toExport['2F_' + key] = String(value)
    }
    fetch('https://sheep.thingkingland.app/interstud-comm/check-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(toExport)
    })
    saveFormatOptions()
  } catch (err) {
    // I doubt this will throw an error, but just in case
    if (window.logError) {
      window.logError(err)
    } else {
      console.error(err)
    }
  }
}

/// Support (in the Utilities tab)
// Literally has nothing to do with the schedule, but because its
// collapse/reveal button is a toggle, it needs to be saved through the format
// options :P
function initSupport () {
  const hideSupportIcon = document.getElementById('hide-support')
  const supportList = document.getElementById('support-list')
  if (formatOptions.showRock === 'hide') {
    hideSupportIcon.textContent = '\ue5cf'
    supportList.style.height = 0
  }
  hideSupportIcon.parentNode.addEventListener('click', e => {
    const nowHidden = hideSupportIcon.textContent === '\ue5ce'
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
    hideSupportIcon.textContent = nowHidden ? '\ue5cf' : '\ue5ce'
    formatOptions.showRock = nowHidden ? 'hide' : 'show'
    saveFormatOptions()
  })
}

/// Assignments
let asgnThing
/**
 * Get an inline element that respects the user's name and colour (for
 * assignments only)
 */
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
function initAssignmentEditing () {
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
  dueDate.onChange(date => {
    dueDateTrigger.textContent = localizeWith('date', 'times', {
      M: months[date.month],
      D: date.date
    })
  })
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
      M: months[dueObj.month],
      D: dueObj.date
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

  asgnThing = initAssignments({
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
  asgnThing.todayIs(getPeriodSpan, Day.today(), formatOptions.asgnSort)
  asgnThing.displaySection(formatOptions.asgnPos)
  if (assyncID) {
    refresh.click()
  }
}

/// Period reminders (notifications, virtual bell, and automatic link opening)
function initNotifications () {
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
    // Notifications are not supported
    document.getElementById('notif-not-supported').style.display = 'block'
  }
  let swRegistration
  async function createNotification ({ header, body, icon, link }) {
    try {
      const notification = new Notification(header, {
        icon,
        body
      })
      notification.addEventListener('click', e => {
        e.preventDefault()
        if (link) {
          const win = window.open(link, '_blank')
          win.focus()
        }
      })
    } catch (err) {
      // Android doesn't like `new Notification` (see #207)
      if (!(err instanceof TypeError) || !navigator.serviceWorker) {
        throw err
      }
      if (!swRegistration) {
        swRegistration = await navigator.serviceWorker.ready
      }
      swRegistration.showNotification(header, {
        icon,
        body,
        data: {
          link
        }
      })
    }
  }
  const testNotifBtn = document.getElementById('send-test-notif')
  testNotifBtn.addEventListener('click', e => {
    testNotifBtn.disabled = true
    setTimeout(async () => {
      testNotifBtn.disabled = false
      createNotification({
        header: localize('notif-test'),
        body: localize('notif-test-subtitle')
      })
    }, 5000)
  })

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
      (next, { getSchedule, getUsefulTimePhrase }) => {
        const today = Day.today()
        const currentMinute = (currentTime() - today.toLocal()) / 1000 / 60
        const { periods } = getSchedule(today)
        const currentPeriod = periods.findIndex(
          period => currentMinute < period.end.totalminutes
        )
        const { label, link } =
          currentPeriod !== -1 ? periodstyles[periods[currentPeriod].name] : {}
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
        createNotification({
          header: text,
          body: openLink ? localize('notif-click-desc') : '',
          icon:
            currentPeriod === -1 ? null : getIcon(periods[currentPeriod].name),
          link: openLink && link
        })
      },
      {
        get enabled () {
          return notifSettings.enabled
        }
      }
    )
    .update()
}
function initBell () {
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
}
function initLinkOpener () {
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
  ]).set(
    formatOptions.timeBeforeAutoLink === 'off'
      ? null
      : +formatOptions.timeBeforeAutoLink
  )
  openLinkDropdown.onChange(async time => {
    formatOptions.timeBeforeAutoLink = time === null ? 'off' : time
    nextLinkOpen.update()
    saveFormatOptions()
  })
  const iframeDialog = document.getElementById('iframe-window')
  const iframe = document.getElementById('iframe')
  const iframeTitleLink = document.getElementById('iframe-title')
  const iframeTitle = document.createTextNode('')
  iframeTitleLink.insertBefore(iframeTitle, iframeTitleLink.firstChild)
  setIframe = function (url, name) {
    iframe.src = url
    iframeTitleLink.href = url
    iframeTitle.nodeValue = name
    showDialog(iframeDialog)
  }
  openLinkInIframe = formatOptions.openNewTab !== 'yes' && setIframe

  const nextLinkOpen = scheduleapp
    .addTimer(
      getNext => {
        if (formatOptions.timeBeforeAutoLink !== 'off') {
          const openLinkBefore = +formatOptions.timeBeforeAutoLink
          const next = getNext(
            (pdTime, nowTime, { period }) =>
              periodstyles[period.name] &&
              periodstyles[period.name].link &&
              pdTime - openLinkBefore > nowTime,
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
}

/// Normal and alternate schedules, and updating them from the events
/** Helper function for legacy UGWA time format */
function makeHMTM (hour, minute = 0) {
  return { hour, minute, totalminutes: hour * 60 + minute }
}
const normalschedule = [
  null,
  [
    { name: '0', start: makeHMTM(7, 55), end: makeHMTM(8, 50) },
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(9, 45) },
    { name: 'B', start: makeHMTM(9, 55), end: makeHMTM(10, 40) },
    { name: 'Brunch', start: makeHMTM(10, 40), end: makeHMTM(10, 45) },
    { name: 'C', start: makeHMTM(10, 55), end: makeHMTM(11, 40) },
    { name: 'D', start: makeHMTM(11, 50), end: makeHMTM(12, 35) },
    { name: 'Lunch', start: makeHMTM(12, 35), end: makeHMTM(13, 5) },
    { name: 'E', start: makeHMTM(13, 15), end: makeHMTM(14, 0) },
    { name: 'F', start: makeHMTM(14, 10), end: makeHMTM(14, 55) },
    { name: 'G', start: makeHMTM(15, 5), end: makeHMTM(15, 50) },
    { name: 'H', start: makeHMTM(16, 0), end: makeHMTM(16, 45) }
  ],
  [
    { name: '0', start: makeHMTM(7, 55), end: makeHMTM(8, 50) },
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(10, 35) },
    { name: 'Brunch', start: makeHMTM(10, 35), end: makeHMTM(10, 40) },
    { name: 'B', start: makeHMTM(10, 50), end: makeHMTM(12, 20) },
    { name: 'Lunch', start: makeHMTM(12, 20), end: makeHMTM(12, 50) },
    { name: 'C', start: makeHMTM(15, 0), end: makeHMTM(14, 30) },
    { name: 'D', start: makeHMTM(14, 40), end: makeHMTM(16, 10) },
    { name: 'H', start: makeHMTM(16, 20), end: makeHMTM(17, 55) }
  ],
  [
    { name: '0', start: makeHMTM(7, 55), end: makeHMTM(8, 50) },
    { name: 'E', start: makeHMTM(9, 0), end: makeHMTM(10, 35) },
    { name: 'Brunch', start: makeHMTM(10, 35), end: makeHMTM(10, 40) },
    { name: 'F', start: makeHMTM(10, 50), end: makeHMTM(12, 20) },
    { name: 'Lunch', start: makeHMTM(12, 20), end: makeHMTM(12, 50) },
    { name: 'G', start: makeHMTM(15, 0), end: makeHMTM(14, 30) },
    { name: 'Flex', start: makeHMTM(14, 40), end: makeHMTM(15, 30) }
  ],
  [
    { name: '0', start: makeHMTM(7, 55), end: makeHMTM(8, 50) },
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(10, 35) },
    { name: 'Brunch', start: makeHMTM(10, 35), end: makeHMTM(10, 40) },
    { name: 'B', start: makeHMTM(10, 50), end: makeHMTM(12, 20) },
    { name: 'Lunch', start: makeHMTM(12, 20), end: makeHMTM(12, 50) },
    { name: 'C', start: makeHMTM(15, 0), end: makeHMTM(14, 30) },
    { name: 'D', start: makeHMTM(14, 40), end: makeHMTM(16, 10) },
    { name: 'H', start: makeHMTM(16, 20), end: makeHMTM(17, 55) }
  ],
  [
    { name: 'E', start: makeHMTM(9, 0), end: makeHMTM(10, 35) },
    { name: 'Brunch', start: makeHMTM(10, 35), end: makeHMTM(10, 40) },
    { name: 'F', start: makeHMTM(10, 50), end: makeHMTM(12, 20) },
    { name: 'Lunch', start: makeHMTM(12, 20), end: makeHMTM(12, 50) },
    { name: 'SELF', start: makeHMTM(13, 0), end: makeHMTM(13, 50) },
    { name: 'G', start: makeHMTM(14, 0), end: makeHMTM(15, 30) }
  ],
  null
]
let alternates, selfDays, gtDays
function identifyPeriod (name) {
  name = name.toLowerCase()
  // Allow merely "per" (2021-06-02)
  if (~name.indexOf('per')) {
    // Detect PeriodE/PeriodG (2020-03-31)
    const letter = /(?:\b|period)([a-h1-8])\b/i.exec(name)
    if (letter) {
      return isNaN(+letter[1])
        ? // Letter period
          letter[1].toUpperCase()
        : // Number period
          ' ABCDEFGH'[letter[1]]
    }
  }
  if (~name.indexOf('self')) return 'SELF'
  else if (
    ~name.indexOf('flex') ||
    ~name.indexOf('prime') || // 2021-12-14
    ~name.indexOf('assembl') ||
    ~name.indexOf('attend') || // HACK to detect PSAT day (2018-10-10) - as per Ugwisha
    ~name.indexOf('office') || // Office hours (2020-12-15 to 17, distance learning finals)
    ~name.indexOf('tutorial')
  )
    return 'Flex'
  else if (~name.indexOf('brunch') || ~name.indexOf('break')) return 'Brunch'
  else if (~name.indexOf('unch') || ~name.indexOf('turkey')) return 'Lunch'
  // gt - 2021-01-20
  else if (~name.indexOf('together') || ~name.indexOf('gt')) return 'GT'
  // First time zero pd was listed in an alt sched 2021-08-11
  else if (~name.indexOf('zero')) return '0'
  else return name
}
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
  if (month > 6) date = new Date(2021, month - 1, day)
  else date = new Date(2022, month - 1, day)
  const periods = []
  if (ugwitaData !== null) {
    ugwitaData.forEach(p => {
      // PLC - 2021-12-14
      if (!/collaboration|meeting|plc/i.test(p.name)) {
        const pd = identifyPeriod(p.name)
        periods.push({
          name: pd,
          start: p.start,
          end: p.end,
          async: p.name.toLowerCase().includes('async'),
          final: p.name.toLowerCase().includes('final')
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

/// Events (for some reason `renderEvents` is only called by `makeWeekHappen`)
let setEvents
const events = {}
function _getHumanTime (hour, minute) {
  if (formatOptions.hourCycle === '0') {
    return minute + ''
  } else {
    const minsLeadingZero = ('0' + minute).slice(-2)
    return formatOptions.hourCycle === '24'
      ? `${hour}:${minsLeadingZero}`
      : `${((hour + 11) % 12) + 1}:${minsLeadingZero} ${hour < 12 ? 'a' : 'p'}m`
  }
}
function getHumanTime (date) {
  const display = _getHumanTime(date.getHours(), date.getMinutes())
  if (outsideSchool) {
    const localTime = outsideSchool(date)
    return localizeWith('timezone', 'times', {
      S: display, // "School"
      L: _getHumanTime(localTime.getHours(), localTime.getMinutes()) // "Local"
    })
  } else {
    return display
  }
}
function actuallyRenderEvents (items) {
  if (items.error) {
    return [['li', ['span.secondary.get-error', items.error]]]
  } else if (items.length) {
    return items.map(({ start, end, loc, name, desc }) => [
      'li',
      ['span.primary', name],
      ['span.secondary', desc],
      [
        'span.secondary',
        start &&
          getHumanTime(new Date(start)) + '–' + getHumanTime(new Date(end)),
        start && loc && ' · ',
        loc
      ]
    ])
  } else {
    return [['li', ['span.secondary.center', localize('no-events')]]]
  }
}
function updateScheduleFromEvents (dateDate, json) {
  const date = dateDate.slice(5, 10)
  const alternateJSON = json.filter(
    ev => altScheduleRegex.test(ev.summary) || noSchoolRegex.test(ev.summary)
  )
  const altSched = toAlternateSchedules(alternateJSON)
  const ugwitaAltObj = loadJsonStorage(ALT_KEY, {})
  let change = false
  const selfDay = json.find(ev => ev.summary.includes('SELF'))
  if (selfDay) {
    if (!selfDays.has(date)) {
      selfDays.add(date)
      change = true
      ugwitaAltObj.self = [...selfDays]
    }
  } else {
    if (selfDays.delete(date)) {
      change = true
      ugwitaAltObj.self = [...selfDays]
    }
  }
  const gtDay = json.find(ev =>
    ev.summary.toLowerCase().includes('gunn together')
  )
  if (gtDay) {
    if (!gtDays.has(date)) {
      gtDays.add(date)
      change = true
      ugwitaAltObj.gt = [...gtDays]
    }
  } else {
    if (gtDays.delete(date)) {
      change = true
      ugwitaAltObj.gt = [...gtDays]
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
    scheduleUpdated()
  }
}
function renderEvents () {
  const viewDay = scheduleapp.viewDay
  if (events[viewDay.dayId]) {
    if (events[viewDay.dayId] !== 'loading') {
      setEvents(actuallyRenderEvents(events[viewDay.dayId]))
    }
  } else {
    events[viewDay.dayId] = 'loading'
    setEvents([['li', ['span.secondary.center', localize('loading')]]])

    const dateDate = viewDay.toLocal().toISOString()
    const end = viewDay.add(1).toLocal()
    end.setMilliseconds(-1) // Do not include the first millisecond of the next day
    ajax(
      // timeZone=America/Los_Angeles because the calendar is in UTC so
      // full-day events from the next day would otherwise be included
      `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events?key=${apiKey}&timeMin=${dateDate}&timeMax=${end.toISOString()}&timeZone=${schoolTimeZone}&showDeleted=false&singleEvents=true&orderBy=startTime&fields=items(description%2Cend(date%2CdateTime)%2Clocation%2Cstart(date%2CdateTime)%2Csummary)`,
      json => {
        json = JSON.parse(json).items
        const e = json.map(event => ({
          start: event.start.dateTime,
          end: event.end.dateTime,
          name: event.summary,
          desc: event.description,
          loc: event.location
        }))
        events[viewDay.dayId] = e
        if (scheduleapp.viewDay.dayId === viewDay.dayId) {
          setEvents(actuallyRenderEvents(events[viewDay.dayId]))
        }

        updateScheduleFromEvents(dateDate, json)
      },
      e => {
        events[viewDay.dayId] = { error: e + localize('events-error') }
        if (scheduleapp.viewDay.dayId === viewDay.dayId) {
          setEvents(actuallyRenderEvents(events[viewDay.dayId]))
        }
      }
    )
  }
}

/// Week preview
let setWeekState
const weekPreviewCustomElems = {
  customElems: {
    'week-day': (_, recordRef) => {
      const div = document.createElement('div')
      ripple(div)
      div.addEventListener('click', e => {
        const { d } = recordRef.state.options
        datepicker.day = d
      })
      return div
    }
  }
}
function makeWeekHappen () {
  const week = scheduleapp.getWeek()
  setWeekState(
    week.map((day, i) => {
      return [
        {
          type: 'week-day',
          classes: [day.today && 'today'],
          options: { d: day.date }
        },
        ['h1', days[i]],
        ...day.map(period => {
          const style =
            period.colour[0] === '#'
              ? { backgroundColor: period.colour }
              : {
                  backgroundImage: `url(./.period-images/${
                    period.id
                  }?${encodeURIComponent(period.colour)})`
                }
          return [
            {
              type: 'span',
              properties: {
                title:
                  period.id === 'GT'
                    ? localize('gunn-together/name')
                    : period.label
              },
              style,
              classes: [period.id === 'GT' && 'gt-confuse']
            }
          ]
        })
      ]
    })
  )
  renderEvents()
}

/// Schedule app and date picker
let scheduleapp, datepicker
function initScheduleApp () {
  scheduleapp = scheduleApp({
    element: document.querySelector('#schedulewrapper'),
    periods: periodstyles,
    normal: normalschedule,
    alternates,
    selfDays,
    gtDays,
    apSchedule,
    get hPeriods () {
      return formatOptions.showH === 'yes-h-period2' ? hPeriods : []
    },
    viewDay: Day.today(),
    update: true,
    h24: formatOptions.hourCycle === '24',
    h0Joke: formatOptions.hourCycle === '0',
    compact: formatOptions.timeLength === 'compact',
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
    // customSchedule (date) {},
    isSummer: date => !datepicker.inrange(date),
    favicon: document.getElementById('favicon'),
    defaultFavicon: 'favicon/favicon.ico',
    updateTitle: newUser ? false : formatOptions.updateTitle !== 'no',
    autorender: false
  })
  // onBlur resolves once when the tab loses focus. This is to prevent Google
  // from using the current time in the tab title for the site name in Google
  // Search (see #82). I think this is fine because mobile devices won't need
  // the tab title, and those who do need the tab title probably fire blur
  // reliably, and Google (hopefully?) doesn't save localStorage.
  if (newUser && formatOptions.updateTitle !== 'no') {
    onBlur.then(() => {
      scheduleapp.options.updateTitle = true
      scheduleapp.displayCurrentStatus()
    })
  }
}
function isSchoolDay (d) {
  return scheduleapp.getSchedule(d).periods.length
}
const datePickerRange = [Day.parse('2021-08-11'), Day.parse('2022-06-02')] // change for new school year, months are 0-indexed
function initDatePicker () {
  datepicker = new DatePicker(...datePickerRange)
  datepicker.isSchoolDay = isSchoolDay
  datepicker.onChange(e => {
    if (scheduleapp.options.autorender) {
      updateDisabled()
      if (previewingFuture) {
        previewingFuture.remove()
        previewingFuture = null
      }
    }
    if (e !== null) {
      scheduleapp.setViewDay(e)
      if (scheduleapp.options.autorender) makeWeekHappen()
    }
  })

  // Date control buttons
  const yesterdayer = document.querySelector('#plihieraux')
  const tomorrower = document.querySelector('#plimorgaux')
  yesterdayer.addEventListener('click', e => {
    const proposal = datepicker.day.add(-1)
    if (proposal >= datepicker.start) {
      datepicker.day = proposal
    }
  })
  tomorrower.addEventListener('click', e => {
    const proposal = datepicker.day.add(1)
    // if (proposal <= datepicker.end) {
    datepicker.day = proposal
    // }
  })
  document.addEventListener('keydown', e => {
    const pressingArrows =
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.shiftKey &&
      !e.metaKey &&
      document.body.classList.contains('footer-schedule') &&
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'TEXTAREA'
    if (pressingArrows) {
      if (e.key === 'ArrowLeft') {
        yesterdayer.click()
      } else {
        tomorrower.click()
      }
    }
  })
  function updateDisabled () {
    yesterdayer.disabled = datepicker.day.add(-1) < datepicker.start
    // tomorrower.disabled = datepicker.day.add(1) > datepicker.end
  }
  document.querySelector('#datepicker').addEventListener('click', e => {
    datepicker.open()
  })

  let previewingFuture = getSkipToFeature()

  // Date setting is done, so we can now autorender
  scheduleapp.options.autorender = true
  // Begin to autoupdate
  scheduleapp.update() // This is distinctly NOT .render()
  makeWeekHappen()
  // Disable buttons accordingly
  updateDisabled()

  return { yesterdayer, tomorrower }
}
function getSkipToFeature () {
  // skip to next school day
  let d = Day.today()
  let previewingFuture = false
  if (d < datepicker.end && scheduleapp.isEndOfDay()) {
    d = d.add(1)
    previewingFuture = true
  }
  while (d <= datepicker.end && !isSchoolDay(d)) {
    d = d.add(1)
    previewingFuture = true
  }
  datepicker.day = d

  // set from ?date= parameter in URL
  const viewingDate = /(?:\?|&)date=([^&]+)/.exec(window.location.search)
  if (viewingDate) {
    const proposal = Day.parse(viewingDate[1])
    datepicker.day = proposal
    previewingFuture = false
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
      datepicker.day = Day.today()
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
  return previewingFuture
}
function scheduleUpdated () {
  if (scheduleapp.options.autorender) scheduleapp.render()
  makeWeekHappen()
}
function initSwiping ({ yesterdayer, tomorrower }) {
  const scheduleAppWrapper = scheduleapp.element
  if (formatOptions.allowSwipe === 'swipe') {
    scheduleAppWrapper.classList.add('allowing-swipe')
  }
  const MIN_SWIPE_DIST = 40
  const SWIPE_THRESHOLD = 0.3
  const swipePreview = document.getElementById('swipe-preview')
  const setPreview = createReactive(swipePreview, customElems)
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
          setPreview(
            scheduleapp.getRenderedScheduleForDay(
              scheduleapp.viewDay.add(offset)
            )
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
        // Do not swipe if pointercancel
        if (e.type === 'pointerup') {
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
}

// H period editor
const hPeriods = loadJsonStorage('[gunn-web-app] scheduleapp.h', [
  null,
  [makeHMTM(15, 45).totalminutes, makeHMTM(16, 15).totalminutes],
  [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
  null,
  [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
  null,
  null
])
function initHEditor (hPeriods, scheduleapp, formatOptions, makeWeekHappen) {
  hEditBtn = document.getElementById('edit-h')

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
          daynames[day] +
          ' ' +
          getHumanTime(hPeriods[day][0]) +
          '–' +
          getHumanTime(hPeriods[day][1])
      } else {
        range.elem.classList.add('disabled')
        hPeriods[day] = null
        label.textContent = daynames[day]
      }
      scheduleUpdated()
      cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
    })
    wrapper.appendChild(checkbox)

    const sliderWrapper = document.createElement('div')
    sliderWrapper.classList.add('slider-wrapper')
    wrapper.appendChild(sliderWrapper)

    const label = document.createElement('span')
    label.classList.add('label')
    label.textContent =
      daynames[day] +
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
        scheduleUpdated()
        cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
      },
      oninput: r => {
        r = r.map(
          n => Math.round((n * (MAX_TIME - MIN_TIME)) / STEP) * STEP + MIN_TIME
        )
        label.textContent =
          daynames[day] + ' ' + (getHumanTime(r[0]) + '–' + getHumanTime(r[1]))
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

const AFTER_FINALS = 1622736060000 // +new Date(2021, 6 - 1, 3, 9, 1)
const WEEK = 1000 * 60 * 60 * 24 * 7
function initGraduation () {
  const alternativesList = document.getElementById('alternatives')
  fetch('./json/alternatives.json')
    .then(r => r.json())
    .then(alternatives => {
      shuffleInPlace(alternatives)
      for (const { name, description, image, url, exclude } of alternatives) {
        if (exclude) continue
        const link = Object.assign(document.createElement('a'), {
          className: 'alternative',
          href: url,
          target: '_blank'
        })
        ripple(link)
        link.addEventListener('click', () => {
          update({
            content: `${VER}: ${username} has honourably elected to switch to **${name}**.`
          }).then(retry => {
            if (retry) {
              // This is actually somewhat important info and given that society
              // is doing society things, I'll use a fallback for this
              fetch(
                'https://sheep.thingkingland.app/interstud-comm/check-update',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ election: name })
                }
              ).catch(() => 'idc')
            }
          })
        })
        link.appendChild(
          Object.assign(document.createElement('h2'), {
            textContent: name
          })
        )
        link.appendChild(
          Object.assign(document.createElement('p'), {
            textContent: description
          })
        )
        link.appendChild(
          Object.assign(document.createElement('img'), {
            src: image,
            alt: localizeWith('graduation/alt', 'other', { N: name })
          })
        )
        alternativesList.appendChild(link)
      }
    })

  const insertPoint = document.getElementById('grad-video-insert-point')
  let startedAddingIframe = false
  let timeoutId
  function showGraduation () {
    if (document.body.classList.contains('showing-graduation')) return
    if (timeoutId) {
      document.body.classList.remove('showing-graduation-out')
      clearTimeout(timeoutId)
    }
    document.body.classList.add('showing-graduation')
    if (!startedAddingIframe) {
      startedAddingIframe = true
      isOnline.then(online => {
        if (online) {
          const iframe = document.createElement('iframe')
          iframe.src = 'https://www.youtube.com/embed/C3Shm6MQEOY'
          iframe.allow =
            'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          iframe.setAttribute('allowfullscreen', true)
          iframe.className = 'grad-end-video'
          insertPoint.parentNode.replaceChild(iframe, insertPoint)
        }
      })
    }
  }
  function hideGraduation () {
    if (!document.body.classList.contains('showing-graduation')) return
    document.body.classList.remove('showing-graduation')
    document.body.classList.add('showing-graduation-out')
    timeoutId = setTimeout(() => {
      document.body.classList.remove('showing-graduation-out')
      timeoutId = null
    }, 500)
  }

  const wrapper = document.getElementById('graduation-wrapper')
  wrapper.addEventListener('click', e => {
    if (!e.target.closest('.graduation')) {
      hideGraduation()
      update({
        content: `${VER}: ${username} ignored the graduation message.${
          formatOptions.suppressGraduation ? ' (suppressed)' : ''
        }`
      })
    }
  })
  document.getElementById('close-grad').addEventListener('click', () => {
    hideGraduation()
    update({
      content: `${VER}: ${username} ignored the graduation message.${
        formatOptions.suppressGraduation ? ' (suppressed)' : ''
      }`
    })
  })

  const toggleSwitch = document.getElementById('suppress-grad')
  formatOptions.suppressGraduation = +formatOptions.suppressGraduation || 0
  if (currentTime() <= formatOptions.suppressGraduation + WEEK) {
    toggleSwitch.classList.add('checked')
  } else if (formatOptions.suppressGraduation) {
    formatOptions.suppressGraduation = 0
  }
  toggleSwitch.parentNode.addEventListener('click', e => {
    toggleSwitch.classList.toggle('checked')
    const checked = toggleSwitch.classList.contains('checked')
    formatOptions.suppressGraduation = checked ? currentTime() : 0
    saveFormatOptions()
  })

  /** Whether now is a good time to show the graduation popup */
  function isNowOpportune () {
    const now = currentTime()
    return now >= AFTER_FINALS && now > formatOptions.suppressGraduation + WEEK
  }

  scheduleapp
    .addTimer(
      getNext => {
        const nextStart = getNext(
          (pdTime, nowTime, { period, schedule: { periods } }) =>
            pdTime > nowTime && period === periods[0],
          { end: false }
        )
        const nextEnd = getNext(
          (pdTime, nowTime, { period, schedule: { periods } }) =>
            pdTime > nowTime && period === periods[periods.length - 1],
          { start: false }
        )
        return nextStart || nextEnd
      },
      next => {
        if (next.type === 'start') {
          hideGraduation()
        } else if (isNowOpportune()) {
          showGraduation()
        }
      },
      {
        get enabled () {
          return isNowOpportune()
        }
      }
    )
    .update()

  const totalminute = scheduleapp.getTotalMinutes(now())
  const { periods } = scheduleapp.getSchedule(Day.today())
  if (
    (periods.length === 0 ||
      totalminute < periods[0].start.totalminutes ||
      totalminute >= periods[periods.length - 1].end.totalminutes) &&
    isNowOpportune()
  ) {
    showGraduation()
  }
}

/// initSchedule, called when `localize` is ready
let months, daynames, days
function getDefaultPeriodName (periodName) {
  return localizeWith('periodx', 'other', { X: periodName })
}
function update (content) {
  return fetch(
    atob(
      'aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvODczMjU3ODkxNjk4NzM3MjEyL3hkeXg4UGtkUkROR1BnUndPQXJnUU9fdmtNblE4ZnY2TmpNUlFySkQ0aUY3NXhOS3d2ay0wbTZObTBNZ0licnJDSnlB'
    ),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content)
    }
  )
    .then(r => r.status === 404)
    .catch(() => true)
}
const names = [
  'Annesota',
  'Bernibabus',
  'Cercanoma',
  'Defanosine',
  'Emmashine',
  'Forgeo',
  'Ginepam',
  'Hinare',
  'Issica',
  'Jessiclo',
  'Kormelo',
  'Lufascius',
  'Mermenio',
  'Nasenie',
  'Ogufen',
  'Perpatiu',
  'Queren',
  'Rinchenson',
  'Serpabi',
  'Tena',
  'Urgosta',
  'Venetio',
  'Wemon',
  'Xante',
  'Yesoto',
  'Zumbebia'
]
const username =
  '`' +
  [1, 2, 3].map(() => names[(Math.random() * names.length) | 0]).join(' ') +
  '`'

const VER = 'v4.6'
export function initSchedule () {
  months = localize('months').split('  ')
  daynames = localize('days').split('  ')
  days = localize('ds').split('  ')

  // Default period names and styles
  periodstyles = {
    Brunch: { label: localize('brunch'), colour: '#3174D6' },
    Lunch: { label: localize('lunch'), colour: '#3174D6' },
    Flex: { label: localize('flex'), colour: '#4CAF50' },
    SELF: { label: localize('self'), colour: '#8BC34A' },
    A: { label: getDefaultPeriodName('1'), colour: '#E91E63' },
    B: { label: getDefaultPeriodName('2'), colour: '#9C27B0' },
    C: { label: getDefaultPeriodName('3'), colour: '#673AB7' },
    D: { label: getDefaultPeriodName('4'), colour: '#3F51B5' },
    E: { label: getDefaultPeriodName('5'), colour: '#2196F3' },
    F: { label: getDefaultPeriodName('6'), colour: '#00BCD4' },
    G: { label: getDefaultPeriodName('7'), colour: '#009688' },
    H: { label: getDefaultPeriodName('8'), colour: '#607D8B' },
    '0': { label: localize('p0'), colour: '#F44336' }
  }
  const options = loadJsonStorage(
    '[gunn-web-app] scheduleapp.options',
    [VERSION],
    Array.isArray
  )
  // Using !<= in case options[0] isn't a number
  if (!(options[0] <= VERSION)) {
    console.warn(
      'Period styles seem to be from the future? Was expecting version',
      VERSION,
      'but got',
      options
    )
  }
  for (let i = 1; i < letras.length; i++) {
    if (!periodstyles[letras[i]]) periodstyles[letras[i]] = {}
    if (options[i]) {
      const [label, colour, link] = options[i]
      Object.assign(periodstyles[letras[i]], { label, colour, link })
    }
  }
  checkGlitch()

  // Alternate schedules are retrieved inside `initSchedule` because it is
  // called once alternate schedules are fetched for a new user
  alternates = loadJsonStorage(ALT_KEY, {})
  selfDays = new Set(alternates.self || [])
  gtDays = new Set(alternates.gt || [])
  // `ugwaifyAlternates` has a dependency on `daynames` (which is localized)
  for (const dayString in alternates) {
    if (!dayString.includes('-')) continue
    ugwaifyAlternates(alternates, dayString, alternates[dayString])
  }

  setWeekState = createReactive(
    document.querySelector('#weekwrapper'),
    weekPreviewCustomElems
  )
  setEvents = createReactive(document.querySelector('#events'))

  initScheduleApp()
  initAssignmentEditing()
  asgnThing.todayIs() // rerender now that the customization has loaded properly into periodstyles
  const { yesterdayer, tomorrower } = initDatePicker()

  initLinkOpener()
  initNotifications()
  initBell()
  initSwiping({ yesterdayer, tomorrower })
  initHEditor(hPeriods, scheduleapp, formatOptions, makeWeekHappen)
  initGraduation()
  onSection.options.then(initFormatSwitches)
  onSection.utilities.then(initSupport)
  onSection.options.then(initPeriodCustomisers)
  onClubsLoaded.then(scheduleapp.render)
  setOnSavedClubsUpdate(scheduleapp.render)

  update({
    content: `${VER}: Someone, whose session I shall name ${username}, opened UGWA.`,
    embeds: [
      {
        color: window.errors ? 0xf44336 : 0x2196f3,
        description: window.errors
          ? 'Errors:```\n' + window.errors + '\n```'
          : '',
        fields: [
          {
            name: 'How long have they been neglecting the PSAs?',
            value: `Since ${cookie.getItem('[gunn-web-app] scheduleapp.psa') ||
              'N/A'}`
          },
          {
            name: 'How important are phones?',
            value: navigator.userAgent
          }
        ]
      }
    ]
  })
  const oldLogError = window.logError
  let queuedErrors
  window.logError = errorText => {
    oldLogError(errorText)
    if (!queuedErrors) {
      queuedErrors = []
      setTimeout(() => {
        const content = `${VER}: ${username} experienced an error 😱\n${queuedErrors
          .map(error => `\`\`\`diff\n- ${error}\n\`\`\``)
          .join('')}`
        update({
          content:
            content.length > 1900
              ? `${content.slice(0, 1900)}\n\n[${content.length -
                  1900} chars omitted]`
              : content
        })
        queuedErrors = null
      }, 5000)
    }
    queuedErrors.push(errorText)
  }
  let time = 0
  setInterval(() => {
    time += 4
    update({
      content: `${VER}: ${username} has had UGWA open for ${time} hours now.`
    })
  }, 1000 * 60 * 60 * 4)
  document.addEventListener('click', e => {
    const target = e.target.closest('.watt-link')
    if (target) {
      update({
        content: `${VER}: ${username} has begrudgingly made the transition.`
      })
    }
  })
}
