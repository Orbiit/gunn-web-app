/* global fetch, caches, alert */

import { toAlternateSchedules } from './altScheduleGenerator.js?for=appdesign'
import { getFontColour, scheduleApp } from './app.js'
import {
  categoryList,
  initAssignments,
  localizeCategory
} from './assignments.js'
import { ColourPicker } from './colour.js'
import { DatePicker } from './date.js'
import { localize, localizeWith } from './l10n.js'
import { makeDropdown, ripple } from './material.js'
import { setOnSavedClubsUpdate } from './saved-clubs.js'
import {
  ajax,
  ALT_KEY,
  cookie,
  currentTime,
  escapeHTML,
  logError,
  now,
  toEach
} from './utils.js'

let options
export const letras = [
  0,
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
const VERSION = 4
// radios save format version
const FORMATTING_VERSION = '7'
const normalschedule = [
  null,
  // Keeping old schedule in case the school ever returns to it if the pandemic goes away
  /*
  [
    {name:'A',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:45,totalminutes:585}},
    {name:'Brunch',start:{hour:9,minute:45,totalminutes:585},end:{hour:9,minute:50,totalminutes:590}},
    {name:'B',start:{hour:10,minute:0,totalminutes:600},end:{hour:11,minute:15,totalminutes:675}},
    {name:'C',start:{hour:11,minute:25,totalminutes:685},end:{hour:12,minute:40,totalminutes:760}},
    {name:'Lunch',start:{hour:12,minute:40,totalminutes:760},end:{hour:13,minute:10,totalminutes:790}},
    {name:'F',start:{hour:13,minute:20,totalminutes:800},end:{hour:14,minute:35,totalminutes:875}}
  ], [
    {name:'D',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:45,totalminutes:585}},
    {name:'Brunch',start:{hour:9,minute:45,totalminutes:585},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Flex',start:{hour:10,minute:0,totalminutes:600},end:{hour:10,minute:50,totalminutes:650}},
    {name:'E',start:{hour:11,minute:0,totalminutes:660},end:{hour:12,minute:15,totalminutes:735}},
    {name:'Lunch',start:{hour:12,minute:15,totalminutes:735},end:{hour:12,minute:45,totalminutes:765}},
    {name:'A',start:{hour:12,minute:55,totalminutes:775},end:{hour:14,minute:15,totalminutes:855}},
    {name:'G',start:{hour:14,minute:25,totalminutes:865},end:{hour:15,minute:40,totalminutes:940}}
  ], [
    {name:'B',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Brunch',start:{hour:9,minute:50,totalminutes:590},end:{hour:9,minute:55,totalminutes:595}},
    {name:'C',start:{hour:10,minute:5,totalminutes:605},end:{hour:11,minute:25,totalminutes:685}},
    {name:'D',start:{hour:11,minute:35,totalminutes:695},end:{hour:12,minute:55,totalminutes:775}},
    {name:'Lunch',start:{hour:12,minute:55,totalminutes:775},end:{hour:13,minute:25,totalminutes:805}},
    {name:'F',start:{hour:13,minute:35,totalminutes:815},end:{hour:14,minute:55,totalminutes:895}},
  ], [
    {name:'E',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Brunch',start:{hour:9,minute:50,totalminutes:590},end:{hour:9,minute:55,totalminutes:595}},
    {name:'Flex',start:{hour:10,minute:5,totalminutes:605},end:{hour:10,minute:55,totalminutes:655}},
    {name:'B',start:{hour:11,minute:5,totalminutes:665},end:{hour:12,minute:15,totalminutes:735}},
    {name:'Lunch',start:{hour:12,minute:15,totalminutes:735},end:{hour:12,minute:45,totalminutes:765}},
    {name:'A',start:{hour:12,minute:55,totalminutes:775},end:{hour:14,minute:5,totalminutes:845}},
    {name:'G',start:{hour:14,minute:15,totalminutes:855},end:{hour:15,minute:35,totalminutes:935}},
  ], [
    {name:'C',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:40,totalminutes:580}},
    {name:'Brunch',start:{hour:9,minute:40,totalminutes:580},end:{hour:9,minute:45,totalminutes:585}},
    {name:'D',start:{hour:9,minute:55,totalminutes:595},end:{hour:11,minute:5,totalminutes:665}},
    {name:'E',start:{hour:11,minute:15,totalminutes:675},end:{hour:12,minute:25,totalminutes:745}},
    {name:'Lunch',start:{hour:12,minute:25,totalminutes:745},end:{hour:12,minute:55,totalminutes:775}},
    {name:'F',start:{hour:13,minute:5,totalminutes:785},end:{hour:14,minute:15,totalminutes:855}},
    {name:'G',start:{hour:14,minute:25,totalminutes:865},end:{hour:15,minute:35,totalminutes:935}}
  ],
  */
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
    { name: 'C', start: makeHMTM(12, 20), end: makeHMTM(13, 35) },
    { name: 'D', start: makeHMTM(13, 45), end: makeHMTM(15, 0) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'E', start: makeHMTM(9, 40), end: makeHMTM(10, 55) },
    {
      name (d) {
        const week = Math.floor(
          (d - new Date(2020, 8 - 1, 17)) / 1000 / 60 / 60 / 24 / 7
        )
        // scheduleApp can get days outside of the school year because it
        // calculates the schedule immediately before isSummer is set
        if (week < 0) return 'SELF'
        // First week's Gunn together is 5th period for some reason
        if (week === 0) return 'E'
        return 'ABCDEFG'[(week - 1) % 7]
      },
      start: makeHMTM(11, 5),
      end: makeHMTM(11, 40)
    },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'F', start: makeHMTM(12, 20), end: makeHMTM(13, 35) },
    { name: 'G', start: makeHMTM(13, 45), end: makeHMTM(15, 0) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'A', start: makeHMTM(9, 0), end: makeHMTM(10, 15) },
    { name: 'B', start: makeHMTM(10, 25), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'C', start: makeHMTM(12, 20), end: makeHMTM(13, 35) },
    { name: 'D', start: makeHMTM(13, 45), end: makeHMTM(15, 0) },
    { name: 'Flex', start: makeHMTM(15, 10), end: makeHMTM(15, 40) }
  ],
  [
    { name: 'E', start: makeHMTM(9, 40), end: makeHMTM(10, 55) },
    { name: 'SELF', start: makeHMTM(11, 5), end: makeHMTM(11, 40) },
    { name: 'Lunch', start: makeHMTM(11, 40), end: makeHMTM(12, 10) },
    { name: 'F', start: makeHMTM(12, 20), end: makeHMTM(13, 35) },
    { name: 'G', start: makeHMTM(13, 45), end: makeHMTM(15, 0) }
  ],
  null
]
function makeHMTM (hour, minute = 0) {
  return { hour, minute, totalminutes: hour * 60 + minute }
}

const dateRegex = /^\d+-\d{2}-\d{2}$/
const manualAltPeriodRegex = /^(1?\d):(\d{2}) (1?\d):(\d{2}) ([a-z]+)$/
export function getManualAlternateSchedules () {
  return fetch('./json/alt-schedules-2020.txt')
    .then(r => r.text())
    .then(text => {
      const schedules = {}
      const lines = text.split(/\r?\n/)
      let currentDate = null
      for (const line of lines) {
        if (line[0] === '#') continue
        if (currentDate) {
          if (line) {
            const match = line.match(manualAltPeriodRegex)
            if (match) {
              const [, startH, startM, endH, endM, periodLowercase] = match
              const period =
                periodLowercase === 'self'
                  ? 'SELF'
                  : periodLowercase[0].toUpperCase() + periodLowercase.slice(1)
              if (letras.includes(period)) {
                schedules[currentDate].push({
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
            schedules[currentDate] = []
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
export function initSchedule (manualAltSchedules = {}) {
  const letterPdFormat = localize('periodx')
  const periodstyles = {
    NO_SCHOOL: { label: localize('no-school') },
    // Default period names and styles
    Brunch: { label: localize('brunch'), colour: '#9E9E9E' },
    Lunch: { label: localize('lunch'), colour: '#9E9E9E' },
    Flex: { label: localize('flex'), colour: '#607D8B' },
    SELF: { label: localize('self'), colour: '#455a64' },
    A: { label: letterPdFormat.replace('{X}', '1'), colour: '#f44336' },
    B: { label: letterPdFormat.replace('{X}', '2'), colour: '#2196F3' },
    C: { label: letterPdFormat.replace('{X}', '3'), colour: '#FFEB3B' },
    D: { label: letterPdFormat.replace('{X}', '4'), colour: '#795548' },
    E: { label: letterPdFormat.replace('{X}', '5'), colour: '#FF9800' },
    F: { label: letterPdFormat.replace('{X}', '6'), colour: '#9C27B0' },
    G: { label: letterPdFormat.replace('{X}', '7'), colour: '#4CAF50' },
    H: { label: letterPdFormat.replace('{X}', '8'), colour: '#673AB7' },
    '0': { label: localize('p0'), colour: '#009688' }
  }
  if (cookie.getItem('[gunn-web-app] scheduleapp.options')) {
    options = JSON.parse(cookie.getItem('[gunn-web-app] scheduleapp.options'))
    if (options[0] !== VERSION) {
      if (options[0] <= 1) {
        options.push([periodstyles.SELF.label, periodstyles.SELF.colour])
      }
      if (options[0] <= 2) {
        options.push([periodstyles.H.label, periodstyles.H.colour])
      }
      if (options[0] <= 3) {
        options.push([periodstyles[0].label, periodstyles[0].colour])

        options[0] = VERSION
      } else {
        options = null
      }
    }
  }
  if (!options) {
    options = [VERSION]
    for (
      let i = 0, arr = letras, len = arr.length, l = arr[i];
      i < len;
      i++, l = arr[i]
    )
      if (l !== 0) {
        options.push([periodstyles[l].label, periodstyles[l].colour])
      }
  }
  /* SCHEDULE APP */
  const defaultThings = [
    FORMATTING_VERSION, // 0
    '12', // 1
    'full', // 2
    '0', // 3
    'after', // 4
    'chrono-primero', // 5
    'yes', // 6
    'show', // 7
    'no', // 8
    'preps', // 9
    'yes-h-period' // 10
  ]
  const formatOptions = cookie.getItem(
    '[gunn-web-app] scheduleapp.formatOptions'
  )
    ? cookie.getItem('[gunn-web-app] scheduleapp.formatOptions').split('.')
    : defaultThings
  if (formatOptions[0] === '1') {
    formatOptions[0] = '2'
    formatOptions[3] = '0' // Show SELF? (Unused)
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] === '2') {
    formatOptions[0] = '3'
    formatOptions[4] = 'after' // asgn pos
    formatOptions[5] = 'chrono-primero' // asgn sort
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] === '3') {
    formatOptions[0] = '4'
    formatOptions[6] = 'yes' // h period
    formatOptions[7] = 'show' // show ROCK section
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] === '4') {
    formatOptions[0] = '5'
    formatOptions[8] = 'no' // zero period
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] === '5') {
    formatOptions[0] = '6'
    formatOptions[9] = 'preps' // hide preps?
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] === '6') {
    formatOptions[0] = '7'
    formatOptions[10] = 'yes-h-period' // show H period?
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  }
  if (formatOptions[0] !== FORMATTING_VERSION) {
    // you should be worried
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      defaultThings.join('.')
    )
    window.location.reload()
  }
  document.querySelector(
    `input[name=hour][value=h${formatOptions[1]}]`
  ).checked = true
  toEach('input[name=hour]', t =>
    t.addEventListener(
      'click',
      e => {
        formatOptions[1] =
          e.target.value === 'h12' ? '12' : e.target.value === 'h0' ? '0' : '24'
        cookie.setItem(
          '[gunn-web-app] scheduleapp.formatOptions',
          formatOptions.join('.')
        )
        window.location.reload()
      },
      false
    )
  )
  document.querySelector(
    `input[name=format][value=${formatOptions[2]}]`
  ).checked = true
  toEach('input[name=format]', t =>
    t.addEventListener(
      'click',
      e => {
        formatOptions[2] = e.target.value === 'full' ? 'full' : 'compact'
        cookie.setItem(
          '[gunn-web-app] scheduleapp.formatOptions',
          formatOptions.join('.')
        )
        window.location.reload()
      },
      false
    )
  )
  // const selfSwitch = document.getElementById('self')
  // if (formatOptions[3] === '1') selfSwitch.classList.add('checked')
  // selfSwitch.parentNode.addEventListener('click', e => {
  //   selfSwitch.classList.toggle('checked')
  //   formatOptions[3] = selfSwitch.classList.contains('checked') ? '1' : '0'
  //   cookie.setItem(
  //     '[gunn-web-app] scheduleapp.formatOptions',
  //     formatOptions.join('.')
  //   )
  //   window.location.reload()
  // })
  document.querySelector(
    `input[name=asgn-display][value=${formatOptions[4]}]`
  ).checked = true
  toEach('input[name=asgn-display]', t =>
    t.addEventListener(
      'click',
      e => {
        formatOptions[4] = e.target.value
        cookie.setItem(
          '[gunn-web-app] scheduleapp.formatOptions',
          formatOptions.join('.')
        )
        asgnThing.displaySection(e.target.value)
      },
      false
    )
  )
  document.querySelector(
    `input[name=asgn-sort][value=${formatOptions[5]}]`
  ).checked = true
  toEach('input[name=asgn-sort]', t =>
    t.addEventListener(
      'click',
      e => {
        formatOptions[5] = e.target.value
        cookie.setItem(
          '[gunn-web-app] scheduleapp.formatOptions',
          formatOptions.join('.')
        )
        asgnThing.todayIs(getPeriodSpan, now(), e.target.value)
      },
      false
    )
  )
  const showZero = document.getElementById('show0')
  if (formatOptions[8] === 'yes') showZero.classList.add('checked')
  showZero.parentNode.addEventListener('click', e => {
    showZero.classList.toggle('checked')
    formatOptions[8] = showZero.classList.contains('checked') ? 'yes' : 'no'
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
    window.location.reload()
  })
  const togglePdAsgn = document.getElementById('toggle-pd-add-asgn')
  if (formatOptions[6] === 'yes') togglePdAsgn.classList.add('checked')
  togglePdAsgn.parentNode.addEventListener('click', e => {
    togglePdAsgn.classList.toggle('checked')
    formatOptions[6] = togglePdAsgn.classList.contains('checked') ? 'yes' : 'no'
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
    scheduleapp.options.displayAddAsgn = formatOptions[6] === 'yes'
    scheduleapp.render()
  })
  const prepSwitch = document.getElementById('hide-preps')
  if (formatOptions[9] === 'prepnt') prepSwitch.classList.add('checked')
  prepSwitch.parentNode.addEventListener('click', e => {
    prepSwitch.classList.toggle('checked')
    formatOptions[9] = prepSwitch.classList.contains('checked')
      ? 'prepnt'
      : 'prep'
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
    window.location.reload()
  })
  const pd8Switch = document.getElementById('show-h')
  if (formatOptions[10] === 'yes-h-period') pd8Switch.classList.add('checked')
  pd8Switch.parentNode.addEventListener('click', e => {
    pd8Switch.classList.toggle('checked')
    formatOptions[10] = pd8Switch.classList.contains('checked')
      ? 'yes-h-period'
      : 'no-h-period'
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
    scheduleapp.render()
    makeWeekHappen()
  })
  const hideSupportIcon = document.getElementById('hide-support')
  const supportList = document.getElementById('support-list')
  if (formatOptions[7] === 'hide') {
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
    formatOptions[7] = nowHidden ? 'hide' : 'show'
    cookie.setItem(
      '[gunn-web-app] scheduleapp.formatOptions',
      formatOptions.join('.')
    )
  })

  // function getHumanTime (minutes) {
  //   if (formatOptions[1] === '0') return minutes % 60
  //   const h = Math.floor(minutes / 60)
  //   const m = ('0' + (minutes % 60)).slice(-2)
  //   if (formatOptions[1] === '24') return `${h}:${m}`
  //   else return `${((h - 1) % 12) + 1}:${m}${h < 12 ? 'a' : 'p'}m`
  // }

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
    editorDialog.classList.add('show')
    contentInput.focus()
    setImportance(importance)
    let onSave, onDelete, onFinish
    currentCancelFn = () => {
      onDeleteClick = onSaveClick = currentCancelFn = null
      editorDialog.classList.remove('show')
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
  asgnThing.todayIs(getPeriodSpan, now(), formatOptions[5])
  asgnThing.displaySection(formatOptions[4])
  if (assyncID) {
    refresh.click()
  }

  const weekwrapper = document.querySelector('#weekwrapper')
  function makeWeekHappen () {
    let innerHTML = ''
    const days = localize('ds').split('  ')
    const week = scheduleapp.getWeek()
    for (let i = 0; i < 7; i++) {
      innerHTML += `<div${week[i].today ? ' class="today"' : ''}><h1>${
        days[i]
      }</h1>`
      for (
        let j = 0, arr = week[i], len = arr.length, period = arr[j];
        j < len;
        j++, period = arr[j]
      )
        innerHTML += `<span style="${
          period.colour[0] === '#'
            ? `background-color:${period.colour};`
            : `background-image: url(./.period-images/${
                period.id
              }?${encodeURIComponent(period.colour)});`
        }" title="${escapeHTML(period.label)}"></span>`
      innerHTML += `</div>`
    }
    weekwrapper.innerHTML = innerHTML
    renderEvents()
  }
  const altSchedRegex = /schedule|extended|holiday|no students|break|development/i
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
            if (formatOptions[1] === '0')
              timerange = `${start.getMinutes()} &ndash; ${end.getMinutes()}`
            else if (formatOptions[1] === '24')
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
    if (events[offset]) actuallyRenderEvents(events[offset])
    else {
      const dateDate = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() + offset
      ).toISOString()
      ajax(
        `https://www.googleapis.com/calendar/v3/calendars/u5mgb2vlddfj70d7frf3r015h0@group.calendar.google.com/events?key=AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o&timeMin=${dateDate}&timeMax=${new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + offset + 1
        ).toISOString()}&showDeleted=false&singleEvents=true&orderBy=startTime&fields=items(description%2Cend(date%2CdateTime)%2Clocation%2Cstart(date%2CdateTime)%2Csummary)`,
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
          const alternateJSON = json.filter(ev =>
            altSchedRegex.test(ev.summary)
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
      const letter = /(?:\b|period)([a-g])\b/i.exec(name)
      if (letter) return letter[1].toUpperCase()
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
  for (let i = 0; i < letras.length; i++) {
    if (!periodstyles[letras[i]]) periodstyles[letras[i]] = {}
    periodstyles[letras[i]].label = options[i][0]
    periodstyles[letras[i]].colour = options[i][1]
  }
  // const hPeriods =
  //   JSON.parse(cookie.getItem('[gunn-web-app] scheduleapp.h')) || []
  const scheduleapp = scheduleApp({
    element: document.querySelector('#schedulewrapper'),
    periods: periodstyles,
    normal: normalschedule,
    alternates: alternates,
    selfDays: selfDays,
    get hPeriods () {
      return formatOptions[10] === 'yes-h-period'
        ? [
            null,
            [makeHMTM(15, 45).totalminutes, makeHMTM(16, 15).totalminutes],
            [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
            null,
            [makeHMTM(15, 45).totalminutes, makeHMTM(17, 0).totalminutes],
            null
          ]
        : []
    },
    offset: 0,
    update: true,
    h24: formatOptions[1] === '24',
    h0Joke: formatOptions[1] === '0',
    compact: formatOptions[2] === 'compact',
    // No longer relevant, for SELF has taken over the school :(
    // self: +formatOptions[3],
    self: true,
    displayAddAsgn: formatOptions[6] === 'yes',
    show0: formatOptions[8] === 'yes' && {
      name: '0',
      start: { hour: 7, minute: 15, totalminutes: 435 },
      end: { hour: 8, minute: 5, totalminutes: 485 }
    },
    hidePreps: formatOptions[9] === 'prepnt',
    getAssignments (date, getPeriodSpan) {
      return asgnThing.getScheduleAsgns(date, getPeriodSpan)
    },
    customSchedule (date, y, m, d, wd) {
      const sched = manualAltSchedules[`${y}-${m + 1}-${d}`]
      if (!sched) return
      if (formatOptions[10] === 'yes-h-period') {
        return sched
      } else {
        return sched.filter(pd => pd.name !== 'H')
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
    previewingFuture.className = 'material-card previewing-future-notice'
    const span = document.createElement('span')
    span.textContent = localize('previewing-future')
    previewingFuture.appendChild(span)
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
    previewingFuture.appendChild(todayBtn)
    const closeBtn = document.createElement('button')
    closeBtn.className = 'material'
    closeBtn.textContent = localize('close-future')
    closeBtn.addEventListener('click', e => {
      previewingFuture.remove()
      previewingFuture = null
    })
    ripple(closeBtn)
    previewingFuture.appendChild(closeBtn)
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

  /* CUSTOMISE PERIODS */
  const materialcolours = 'f44336 E91E63 9C27B0 673AB7 3F51B5 2196F3 03A9F4 00BCD4 009688 4CAF50 8BC34A CDDC39 FFEB3B FFC107 FF9800 FF5722 795548 9E9E9E 607D8B'.split(
    ' '
  )
  function materialInput (labeltext) {
    const inputwrapper = document.createElement('div')
    const label = document.createElement('label')
    const input = document.createElement('input')
    const line = document.createElement('div')
    inputwrapper.classList.add('customiser-inputwrapper')
    label.classList.add('customiser-label')
    label.innerHTML = labeltext
    input.classList.add('customiser-input')
    input.setAttribute('aria-label', localize('period-name-label') + labeltext)
    input.addEventListener(
      'change',
      e => {
        if (input.value) inputwrapper.classList.add('filled')
        else inputwrapper.classList.remove('filled')
      },
      false
    )
    input.addEventListener(
      'mouseenter',
      e => {
        inputwrapper.classList.add('hover')
      },
      false
    )
    input.addEventListener(
      'mouseleave',
      e => {
        inputwrapper.classList.remove('hover')
      },
      false
    )
    input.addEventListener(
      'focus',
      e => {
        inputwrapper.classList.add('focus')
      },
      false
    )
    input.addEventListener(
      'blur',
      e => {
        inputwrapper.classList.remove('focus')
      },
      false
    )
    line.classList.add('customiser-line')
    inputwrapper.appendChild(label)
    inputwrapper.appendChild(input)
    inputwrapper.appendChild(line)
    return {
      wrapper: inputwrapper,
      label: label,
      input: input,
      line: line
    }
  }
  function addPeriodCustomisers (elem) {
    function period (name, id, colour = '#FF594C', val = '') {
      let isImage = colour[0] !== '#'
      let init = true
      const div = document.createElement('div')
      const pickertrigger = document.createElement('button')
      const picker = new ColourPicker(e => {
        if (isImage) return
        pickertrigger.style.backgroundColor = e
        if (scheduleapp) scheduleapp.setPeriod(id, '', e, !init)
        if (init) {
          init = false
        } else {
          if (periodstyles[id].update) periodstyles[id].update()
          cookie.setItem(
            '[gunn-web-app] scheduleapp.options',
            JSON.stringify(options)
          )
        }
        options[letras.indexOf(id)][1] = e
        if (picker.darkness() > 125) {
          pickertrigger.classList.add('ripple-dark')
          pickertrigger.classList.remove('ripple-light')
        } else {
          pickertrigger.classList.add('ripple-light')
          pickertrigger.classList.remove('ripple-dark')
        }
      })
      const input = materialInput(name)
      div.classList.add('customiser-wrapper')
      ripple(pickertrigger)
      pickertrigger.classList.add('material')
      pickertrigger.classList.add('customiser-colour')
      if (isImage) {
        pickertrigger.style.backgroundImage = `url(./.period-images/${id}?${currentTime()})`
        if (periodstyles[id].update) periodstyles[id].update() // colour input already triggers this, so we only need to update image
      }
      pickertrigger.addEventListener(
        'click',
        e => {
          picker.trigger(pickertrigger)
        },
        false
      )
      picker.colour = isImage ? '#FF594C' : colour
      div.appendChild(pickertrigger)
      if (val) {
        input.input.value = val
        input.wrapper.classList.add('filled')
      }
      input.input.addEventListener(
        'change',
        e => {
          // `null` for third input means do not change `colour`
          // (`setPeriod` checks whether third input is truthy)
          if (scheduleapp)
            scheduleapp.setPeriod(id, input.input.value, null, true)
          options[letras.indexOf(id)][0] = input.input.value
          if (periodstyles[id].update) periodstyles[id].update()
          cookie.setItem(
            '[gunn-web-app] scheduleapp.options',
            JSON.stringify(options)
          )
        },
        false
      )
      div.appendChild(input.wrapper)
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
      const imageInput = document.createElement('input')
      imageInput.classList.add('customiser-image')
      imageInput.classList.add('notmaterial-input')
      imageInput.placeholder = localize('image-url')
      if (isImage) {
        imageInput.value = colour
      }
      imageInput.addEventListener('change', e => {
        imageInput.disabled = true
        if (imageInput.value) {
          cacheBackground(imageInput.value, id)
            .then(() => {
              imageInput.disabled = false
              isImage = true
              // intentionally not resetting backgroundColor because transparency meh
              pickertrigger.style.backgroundImage = `url(./.period-images/${id}?${currentTime()})`
              if (scheduleapp)
                scheduleapp.setPeriod(id, '', imageInput.value, true)
              options[letras.indexOf(id)][1] = imageInput.value
              if (periodstyles[id].update) periodstyles[id].update()
              cookie.setItem(
                '[gunn-web-app] scheduleapp.options',
                JSON.stringify(options)
              )
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
              if (scheduleapp)
                scheduleapp.setPeriod(id, '', picker.colour, true)
              options[letras.indexOf(id)][1] = picker.colour
              if (periodstyles[id].update) periodstyles[id].update()
              cookie.setItem(
                '[gunn-web-app] scheduleapp.options',
                JSON.stringify(options)
              )
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
      picker.window.appendChild(imageInput)
      return period
    }
    return period
  }
  const periodCustomisers = document.createDocumentFragment()
  let customiserAdder = addPeriodCustomisers(periodCustomisers)
  if (formatOptions[8] === 'yes')
    customiserAdder = customiserAdder(
      localize('p0'),
      '0',
      options[13][1],
      options[13][0]
    )
  customiserAdder(
    letterPdFormat.replace('{X}', '1'),
    'A',
    options[1][1],
    options[1][0]
  )(letterPdFormat.replace('{X}', '2'), 'B', options[2][1], options[2][0])(
    letterPdFormat.replace('{X}', '3'),
    'C',
    options[3][1],
    options[3][0]
  )(letterPdFormat.replace('{X}', '4'), 'D', options[4][1], options[4][0])(
    letterPdFormat.replace('{X}', '5'),
    'E',
    options[5][1],
    options[5][0]
  )(letterPdFormat.replace('{X}', '6'), 'F', options[6][1], options[6][0])(
    letterPdFormat.replace('{X}', '7'),
    'G',
    options[7][1],
    options[7][0]
  )(letterPdFormat.replace('{X}', '8'), 'H', options[12][1], options[12][0])(
    localize('flex'),
    'Flex',
    options[8][1],
    options[8][0]
  )
  // if (+formatOptions[3])
  customiserAdder = customiserAdder(
    localize('self'),
    'SELF',
    options[11][1],
    options[11][0]
  )
  // TEMP: Brunch is not on the schedule
  // customiserAdder(localize('brunch'), 'Brunch', options[9][1], options[9][0])(
  customiserAdder(localize('lunch'), 'Lunch', options[10][1], options[10][0])
  document
    .querySelector('.section.options')
    .insertBefore(
      periodCustomisers,
      document.querySelector('#periodcustomisermarker')
    )

  // TEMP: H period editor not needed this year?
  // const MIN_TIME = 15 * 60
  // const MAX_TIME = 21 * 60
  // const MIN_LENGTH = 10
  // const STEP = 5
  // const hEditor = document.getElementById('h-editor')
  // document.getElementById('edit-h').addEventListener('click', e => {
  //   hEditor.classList.add('show')
  // })
  // const hDays = document.createDocumentFragment()
  // for (let day = 1; day <= 5; day++) {
  //   const wrapper = document.createElement('div')
  //   wrapper.classList.add('h-day')
  //   hDays.appendChild(wrapper)
  //
  //   const checkbox = document.createElement('div')
  //   checkbox.classList.add('material-switch')
  //   checkbox.tabIndex = 0
  //   if (hPeriods[day]) checkbox.classList.add('checked')
  //   checkbox.addEventListener('click', e => {
  //     // checkbox class checked not yet toggled because the listener that does that is added later
  //     checkbox.classList.toggle('checked')
  //     if (checkbox.classList.contains('checked')) {
  //       range.elem.classList.remove('disabled')
  //       hPeriods[day] = range.range.map(n =>
  //         Math.round(n * (MAX_TIME - MIN_TIME) + MIN_TIME)
  //       )
  //       label.textContent =
  //         days[day] +
  //         ' ' +
  //         getHumanTime(hPeriods[day][0]) +
  //         '–' +
  //         getHumanTime(hPeriods[day][1])
  //     } else {
  //       range.elem.classList.add('disabled')
  //       hPeriods[day] = null
  //       label.textContent = days[day]
  //     }
  //     scheduleapp.render()
  //     cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
  //   })
  //   wrapper.appendChild(checkbox)
  //
  //   const sliderWrapper = document.createElement('div')
  //   sliderWrapper.classList.add('slider-wrapper')
  //   wrapper.appendChild(sliderWrapper)
  //
  //   const label = document.createElement('span')
  //   label.classList.add('label')
  //   label.textContent =
  //     days[day] +
  //     ' ' +
  //     (hPeriods[day]
  //       ? getHumanTime(hPeriods[day][0]) + '–' + getHumanTime(hPeriods[day][1])
  //       : '')
  //   sliderWrapper.appendChild(label)
  //
  //   const range = createRange(
  //     MIN_LENGTH / (MAX_TIME - MIN_TIME),
  //     r => {
  //       range.range = r.map(
  //         n =>
  //           (Math.round((n * (MAX_TIME - MIN_TIME)) / STEP) * STEP) /
  //           (MAX_TIME - MIN_TIME)
  //       )
  //       hPeriods[day] = range.range.map(n =>
  //         Math.round(n * (MAX_TIME - MIN_TIME) + MIN_TIME)
  //       )
  //       scheduleapp.render()
  //       cookie.setItem('[gunn-web-app] scheduleapp.h', JSON.stringify(hPeriods))
  //     },
  //     r => {
  //       r = r.map(
  //         n => Math.round((n * (MAX_TIME - MIN_TIME)) / STEP) * STEP + MIN_TIME
  //       )
  //       label.textContent =
  //         days[day] + ' ' + (getHumanTime(r[0]) + '–' + getHumanTime(r[1]))
  //     }
  //   )
  //   range.range = (hPeriods[day] || [17 * 60, 18 * 60]).map(
  //     m => (m - MIN_TIME) / (MAX_TIME - MIN_TIME)
  //   )
  //   if (!hPeriods[day]) range.elem.classList.add('disabled')
  //   sliderWrapper.appendChild(range.elem)
  // }
  // document.getElementById('h-days').appendChild(hDays)
}
