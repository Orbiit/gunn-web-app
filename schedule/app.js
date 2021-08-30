import { Day } from '../js/date.js'
import { createL10nApplier, createReactive } from '../js/dumb-reactive.js'
import { ripple } from '../js/material.js'
import { localize, localizeWith } from '../js/l10n.js'
import { showClub, getClubByName } from '../js/lists.js'
import { savedClubs } from '../js/saved-clubs.js'
import {
  currentTime,
  identity,
  mulberry32,
  now,
  outsideSchool,
  THEME_COLOUR
} from '../js/utils.js'

const FAVICON_SIZE = 32

const SHEEP_COUNT = 16
const SHEEP_VISUAL_HEIGHT = 200

export let days, months
export function setDaysMonths (newDays, newMonths) {
  days = newDays
  months = newMonths
}

export const customElems = {
  customElems: {
    'ext-link': ({ options: { ripple: rippleEffect } }) => {
      const link = document.createElement('a')
      link.target = '_blank'
      if (rippleEffect) ripple(link)
      return link
    },
    'ripple-btn': () => {
      const button = document.createElement('button')
      ripple(button)
      return button
    }
  }
}
const applyEndTime = createL10nApplier(localize('end-time', 'times'), {
  T: 'strong'
})
const applyEndTimeIn = createL10nApplier(localize('end-time-in', 'times'), {
  T: 'strong',
  D: null
})
const applyEndedAgo = createL10nApplier(localize('ended', 'times'), {
  P: null,
  T: 'strong'
})
const applyEndingIn = createL10nApplier(localize('ending', 'times'), {
  P: null,
  T: 'strong'
})
const applyStartingIn = createL10nApplier(localize('starting', 'times'), {
  P: null,
  T: 'strong'
})
const applyPdEndedAgo = createL10nApplier(localize('self-ended', 'times'), {
  T: 'strong'
})
const applyPdEndingIn = createL10nApplier(localize('self-ending', 'times'), {
  T1: 'strong',
  T2: null
})
const applyPdStarting = createL10nApplier(localize('self-starting', 'times'), {
  T: 'strong'
})
const applyAltSchedMsg = createL10nApplier(localize('alt-msg'), {
  D: 'strong'
})

const wattMessages = [
  localize('watt/other/message1'),
  localize('watt/other/message2'),
  localize('watt/other/message3'),
  localize('watt/other/message4'),
  localize('watt/other/message5'),
  localize('watt/other/message6'),
  localize('watt/other/message7')
]

const colourtoy = document.createElement('div')
function isLight (colour) {
  colourtoy.style.backgroundColor = colour
  colour = colourtoy.style.backgroundColor
  colour = colour
    .slice(colour.indexOf('(') + 1, colour.indexOf(')'))
    .split(/,\s*/)
    .map(a => +a)
  // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
  return (
    Math.round(
      (parseInt(colour[0]) * 299 +
        parseInt(colour[1]) * 587 +
        parseInt(colour[2]) * 114) /
        1000
    ) > 150
  )
}
export function getFontColour (colour) {
  return isLight(colour) ? 'rgba(0,0,0,0.8)' : 'white'
}
export function scheduleApp (options = {}) {
  let element
  const container = document.createElement('div')
  if (options.element) element = options.element
  else element = document.createElement('div')
  container.classList.add('schedule-container')
  container.addEventListener('click', e => {
    if (e.target.dataset.club) {
      showClub(e.target.dataset.club)
      e.preventDefault()
    }
  })
  if (!options.alternates) options.alternates = {}
  if (!options.periods) options.periods = {}
  if (!options.normal) options.normal = {}
  function getPeriod (name) {
    return options.periods[name] || { label: name, colour: '#000' }
  }
  function _getHumanTime (hour, minute) {
    if (options.h0Joke) {
      return minute + ''
    } else {
      const minsLeadingZero = ('0' + minute).slice(-2)
      return options.h24
        ? `${hour}:${minsLeadingZero}`
        : `${((hour + 11) % 12) + 1}:${minsLeadingZero} ${
            hour < 12 ? 'a' : 'p'
          }m`
    }
  }
  function getHumanTime ({ hour, minute }, date) {
    const display = _getHumanTime(hour, minute)
    if (outsideSchool) {
      const localDate = date.toLocal()
      localDate.setHours(hour)
      localDate.setMinutes(minute)
      const localTime = outsideSchool(localDate)
      return localizeWith('timezone', 'times', {
        S: display, // "School"
        L: _getHumanTime(localTime.getHours(), localTime.getMinutes()) // "Local"
      })
    } else {
      return display
    }
  }
  function getCSS (colour, id) {
    if (colour[0] === '#') {
      return {
        backgroundColor: colour,
        color: getFontColour(colour)
      }
    } else {
      return {
        backgroundImage: `url('./.period-images/${id}?${encodeURIComponent(
          colour
        )}')`,
        color: 'white',
        textShadow: '0 0 10px black'
      }
    }
  }
  function getUsefulTimePhrase (minutes) {
    if (options.compact)
      return `${Math.floor(minutes / 60)}:${('0' + (minutes % 60)).slice(-2)}`
    else return localizeWith('duration', 'times', { T: minutes })
  }
  function getPeriodSpan (period) {
    if (period === 'GT') {
      return [
        'span.schedule-endinginperiod.gt-confuse',
        localize('gunn-together/name')
      ]
    }
    return [
      {
        type: 'span.schedule-endinginperiod',
        style: getCSS(getPeriod(period).colour, period)
      },
      getPeriod(period).label
    ]
  }
  // This is probably dead code, but I'm leaving it here for sentimental reasons
  // https://github.com/Orbiit/gunn-web-app/commit/98f1efd3cfc58c6e5f9fed904b5278da87fe1996#diff-16d1d8c89ba7f1c2eb9aab9a424e84b092dd81f763087cd79995bbf56d4dd408R22
  getFontColour('rgba(0,0,0,0.2)')
  const dayToPrime = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 11 }
  function getSchedule (d, includeZero = options.show0) {
    let alternate = false
    let summer = false
    const dateId =
      ('0' + (d.month + 1)).slice(-2) + '-' + ('0' + d.date).slice(-2)
    const isSelfDay = options.selfDays.has(dateId)
    const isGtDay = options.gtDays.has(dateId)
    let periods
    // For Gunn Together period resolution (see below)
    const gtWeek = Math.floor(
      (d - Day.from(2020, 8 - 1, 17)) / 1000 / 60 / 60 / 24 / 7
    )
    if (options.customSchedule) {
      periods = options.customSchedule(d)
      if (periods && periods.alternate) {
        alternate = periods.alternate
        periods = periods.periods
      }
    }
    if (periods) periods = periods.slice()
    else if (options.isSummer && options.isSummer(d)) {
      summer = true
      periods = []
    } else if (options.alternates[d.ugwaLegacy()]) {
      const sched = options.alternates[d.ugwaLegacy()]
      alternate = sched
      periods = sched.periods.slice()
    } else if (options.normal[d.day] && options.normal[d.day].length) {
      periods = options.normal[d.day].map(period => {
        if (typeof period.name === 'function') {
          return { ...period, name: period.name(d) }
        } else {
          return period
        }
      })
    } else periods = []
    if (periods.length) {
      if (options.hPeriods[d.day]) {
        // Only add period 8 if there isn't already a period 8 in the schedule
        if (!periods.find(pd => pd.name === 'H')) {
          const [start, end] = options.hPeriods[d.day]
          periods.push({
            name: 'H',
            start: {
              hour: Math.floor(start / 60),
              minute: start % 60,
              totalminutes: start
            },
            end: {
              hour: Math.floor(end / 60),
              minute: end % 60,
              totalminutes: end
            }
          })
        }
      } else {
        periods = periods.filter(pd => pd.name !== 'H')
      }
      if (includeZero) {
        // Only add zero period if there isn't already a zero period in the
        // schedule; zero periods in previous years were on all days except the
        // first day of the week. (See #102)
        if (
          !periods.find(pd => pd.name === '0') &&
          getSchedule(d.add(-1), false).periods.length
        ) {
          periods.unshift(options.show0)
        }
      } else {
        periods = periods.filter(pd => pd.name !== '0')
      }
    }
    // Putting this before hiding preps so that if you have a prep for Gunn
    // Together it is hidden
    periods = periods.map(period => {
      if (period.name === 'GT') {
        // Replace GT with SELF if it's a SELF day
        if (isSelfDay) {
          return { ...period, name: 'SELF' }
        }
        // So far:
        // GTPD 55 643217674ss 32
        // Week 0         1
        //      012345678901234567
        let name
        if (gtWeek >= 0 && gtWeek < 2) name = 'E'
        else if (gtWeek === 3) name = 'F'
        else if (gtWeek < 8) name = 'ABCDEFG'[7 - gtWeek]
        else if (gtWeek >= 8 && gtWeek <= 9) name = ' ABCDEFG'[15 - gtWeek]
        else if (gtWeek === 10) name = 'G'
        else if (gtWeek === 11) name = 'D'
        // Week 12 was an alternate schedule and already listed SELF
        else if (gtWeek === 12 || gtWeek === 13) name = 'SELF'
        else if (gtWeek === 15) name = 'C'
        else if (gtWeek === 16) name = 'B'
        else if (gtWeek > 20) name = 'E'
        if (name) {
          return { ...period, name, gunnTogether: gtWeek > 20 ? 'sem2' : true }
        }
      } else if (period.name === 'SELF' && isGtDay) {
        return { ...period, name: 'E', gunnTogether: 'sem2' }
      }
      return period
    })
    // putting this after it checks if the day is a school day because
    // you can have all day prep and still have H period on that day, maybe
    if (options.hidePreps) {
      periods = periods.filter(
        ({ name }) =>
          !getPeriod(name)
            .label.toLowerCase()
            .includes('prep')
      )
    }
    return {
      periods,
      alternate,
      summer
    }
  }
  function getTotalMinutes (d = now()) {
    return d.getMinutes() + d.getHours() * 60
  }
  function getCurrentStatus () {
    const d = now()
    const totalminute = getTotalMinutes(d)
    const { periods } = getSchedule(Day.today())
    if (!periods.length) {
      return {
        title: localize('appname'),
        end: null,
        favicon: null
      }
    }
    let currPd // current period
    for (currPd = 0; currPd < periods.length; currPd++) {
      if (totalminute < periods[currPd].end.totalminutes) {
        break
      }
    }
    const period = periods[Math.min(currPd, periods.length - 1)]
    if (currPd >= periods.length) {
      // after school
      return {
        title: localize('appname'),
        end: null,
        favicon: null
      }
    } else if (totalminute >= period.start.totalminutes) {
      // during a period
      const { label, colour } = getPeriod(period.name)
      return {
        title: options.compact
          ? localizeWith('ending-short', 'times', {
              T: getUsefulTimePhrase(period.end.totalminutes - totalminute)
            })
          : localizeWith('ending', 'times', {
              P: label,
              T: getUsefulTimePhrase(period.end.totalminutes - totalminute)
            }),
        titleInfo: { type: 'ending', label },
        end: period.end.totalminutes,
        favicon: {
          minutes: period.end.totalminutes - totalminute,
          colour
        }
      }
    } else {
      // passing period or before school
      const { label, colour } = getPeriod(period.name)
      return {
        title: options.compact
          ? localizeWith('starting-short', 'times', {
              P: label,
              T: getUsefulTimePhrase(period.start.totalminutes - totalminute)
            })
          : localizeWith('starting', 'times', {
              P: label,
              T: getUsefulTimePhrase(period.start.totalminutes - totalminute)
            }),
        titleInfo: { type: 'starting', label },
        end: period.start.totalminutes,
        // Favicon can only show like 2 digits
        favicon:
          period.start.totalminutes - totalminute < 100
            ? {
                minutes: period.start.totalminutes - totalminute,
                colour
              }
            : null
      }
    }
  }
  const borderRadius = FAVICON_SIZE * 0.15
  const faviconCanvas = document.createElement('canvas')
  faviconCanvas.width = FAVICON_SIZE
  faviconCanvas.height = FAVICON_SIZE
  const fc = faviconCanvas.getContext('2d')
  fc.textAlign = 'center'
  fc.textBaseline = 'middle'
  fc.lineWidth = FAVICON_SIZE * 0.1
  fc.lineJoin = 'round'
  fc.lineCap = 'round'
  const sRadius = FAVICON_SIZE * 0.45 // radius for last seconds
  let lastMinuteData = null
  function displayLastSeconds () {
    if (!options.updateTitle) {
      lastMinuteData = null
      return
    }

    const now = currentTime()
    const seconds = (lastMinuteData.end - now) / 1000
    if (seconds < 0) {
      lastMinuteData = null
      displayCurrentStatus()
      return
    }

    if (lastMinuteData.titleInfo) {
      const { type, label } = lastMinuteData.titleInfo
      const secs = localizeWith('seconds', 'times', { T: seconds.toFixed(3) })
      let title
      if (type === 'ending') {
        title = options.compact
          ? localizeWith('ending-short', 'times', { T: secs })
          : localizeWith('ending', 'times', { P: label, T: secs })
      } else if (type === 'starting') {
        title = options.compact
          ? localizeWith('starting-short', 'times', { P: label, T: secs })
          : localizeWith('starting', 'times', { P: label, T: secs })
      }
      document.title = localizeWith('branded', 'times', { T: title })
    }

    const primaryColour = lastMinuteData.colour
      ? isLight(lastMinuteData.colour)
        ? 'black'
        : 'white'
      : THEME_COLOUR
    fc.fillStyle = lastMinuteData.colour || 'white'
    fc.strokeStyle = primaryColour

    fc.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE)

    fc.beginPath()
    fc.moveTo(FAVICON_SIZE / 2 + sRadius, FAVICON_SIZE / 2)
    fc.arc(FAVICON_SIZE / 2, FAVICON_SIZE / 2, sRadius, 0, 2 * Math.PI)
    fc.closePath()
    fc.fill()

    fc.beginPath()
    fc.moveTo(FAVICON_SIZE / 2, FAVICON_SIZE / 2 - sRadius)
    // Rounding seconds so when it shows 30 seconds always will show half-way,
    // even if it's not exactly 30s
    fc.arc(
      FAVICON_SIZE / 2,
      FAVICON_SIZE / 2,
      sRadius,
      Math.PI * 1.5,
      2 * Math.PI * (1 - Math.round(seconds) / 60) - Math.PI / 2,
      true
    )
    fc.stroke()

    fc.fillStyle = primaryColour
    fc.font = `bold ${FAVICON_SIZE * 0.6}px "Roboto", sans-serif`
    fc.fillText(
      Math.round(seconds)
        .toString()
        .padStart(2, '0'),
      FAVICON_SIZE / 2,
      FAVICON_SIZE * 0.575
    )

    options.favicon.href = faviconCanvas.toDataURL()

    if (lastMinuteData) {
      // requestAnimationFrame only works when viewing the tab
      setTimeout(displayLastSeconds, 1000 / 15)
    }
  }
  function displayCurrentStatus () {
    if (lastMinuteData || !options.updateTitle) return
    const { title, favicon, end, titleInfo } = getCurrentStatus()
    if (end !== null) {
      const endDateTime = Day.today().toLocal()
      endDateTime.setMinutes(end)
      if (endDateTime - now() < 60000) {
        lastMinuteData = {
          end: endDateTime.getTime(),
          colour: favicon && favicon.colour[0] === '#' ? favicon.colour : null,
          titleInfo
        }
        displayLastSeconds()
        return
      }
    }
    document.title = localizeWith('branded', 'times', { T: title })
    if (favicon === null) {
      options.favicon.href = options.defaultFavicon
    } else {
      const { minutes, colour } = favicon
      const isColour = colour[0] === '#'

      fc.clearRect(0, 0, FAVICON_SIZE, FAVICON_SIZE)

      fc.fillStyle = isColour ? colour : 'white'
      fc.beginPath()
      // Rounded square
      fc.moveTo(0, borderRadius)
      fc.arc(borderRadius, borderRadius, borderRadius, Math.PI, Math.PI * 1.5)
      fc.lineTo(FAVICON_SIZE - borderRadius, 0)
      fc.arc(
        FAVICON_SIZE - borderRadius,
        borderRadius,
        borderRadius,
        -Math.PI / 2,
        0
      )
      fc.lineTo(FAVICON_SIZE, FAVICON_SIZE - borderRadius)
      fc.arc(
        FAVICON_SIZE - borderRadius,
        FAVICON_SIZE - borderRadius,
        borderRadius,
        0,
        Math.PI / 2
      )
      fc.lineTo(borderRadius, FAVICON_SIZE)
      fc.arc(
        borderRadius,
        FAVICON_SIZE - borderRadius,
        borderRadius,
        Math.PI / 2,
        Math.PI
      )
      fc.closePath()
      fc.fill()

      fc.fillStyle = isColour
        ? isLight(colour)
          ? 'black'
          : 'white'
        : THEME_COLOUR
      fc.font = `bold ${FAVICON_SIZE * 0.8}px "Roboto", sans-serif`
      fc.fillText(minutes, FAVICON_SIZE / 2, FAVICON_SIZE * 0.575)

      options.favicon.href = faviconCanvas.toDataURL()
    }
  }
  function resetCurrentStatus () {
    document.title = localize('appname')
    options.favicon.href = options.defaultFavicon
  }
  function getRenderedScheduleForDay (date) {
    let isToday = true
    const totalminute = getTotalMinutes(now())
    if (Day.today().dayId !== date.dayId) {
      isToday = false
    }
    const { periods, alternate, summer } = getSchedule(date)
    const day = days[date.day]
    const isSchool = !summer && periods.length
    const noSchool = !summer && !periods.length
    const assignments = options.getAssignments(date)

    let apExams
    if (options.apSchedule[date.toString()]) {
      apExams = [
        'div.material-card.ap-card',
        ['h1', localize('ap/today')],
        [
          {
            type: 'a',
            properties: {
              href:
                'https://docs.google.com/spreadsheets/d/1o4mS60WSlz64mkgOD1a3-Cw746DSDQwfP_-CyV_YYfk/'
            }
          },
          localize('ap/source')
        ],
        ...options.apSchedule[date.toString()].map(([time, name, inPerson]) => [
          'div',
          [
            'span.small-heading',
            inPerson ? localize('ap/in-person') : localize('ap/digital'),
            ' · ',
            getHumanTime(
              { hour: Math.floor(time / 60), minute: time % 60 },
              date
            )
          ],
          ['span', name]
        ])
      ]
    }

    const optionalPeriods = ['Lunch', 'Brunch', 'Flex']
    let schedule = []
    if (isSchool) {
      schedule = []

      const [lastRequiredPeriod] = periods
        .filter(({ name }) => !optionalPeriods.includes(name))
        .slice(-1)
      if (lastRequiredPeriod) {
        if (!isToday || totalminute > lastRequiredPeriod.end.totalminutes) {
          schedule.push([
            'span.schedule-end',
            applyEndTime({
              T: getHumanTime(lastRequiredPeriod.end, date)
            })
          ])
        } else {
          schedule.push([
            'span.schedule-end',
            applyEndTimeIn({
              T: getHumanTime(lastRequiredPeriod.end, date),
              D: getUsefulTimePhrase(
                lastRequiredPeriod.end.totalminutes - totalminute
              )
            })
          ])
        }
      }

      if (isToday) {
        let currPd // current period
        for (currPd = 0; currPd < periods.length; currPd++) {
          if (totalminute < periods[currPd].end.totalminutes) {
            break
          }
        }
        const period = periods[Math.min(currPd, periods.length - 1)]
        if (currPd >= periods.length) {
          // after school
          schedule.push([
            'p.schedule-endingin',
            applyEndedAgo({
              P: getPeriodSpan(period.name),
              T: getUsefulTimePhrase(totalminute - period.end.totalminutes)
            })
          ])
        } else if (totalminute >= period.start.totalminutes) {
          // during a period
          const progress =
            ((totalminute - period.start.totalminutes) /
              (period.end.totalminutes - period.start.totalminutes)) *
            100
          schedule.push(
            [
              'div.schedule-periodprogress',
              [{ type: 'div', style: { width: progress + '%' } }]
            ],
            [
              'p.schedule-endingin',
              applyEndingIn({
                P: getPeriodSpan(period.name),
                T: getUsefulTimePhrase(period.end.totalminutes - totalminute)
              })
            ]
          )
        } else {
          // passing period or before school
          schedule.push([
            'p.schedule-endingin',
            applyStartingIn({
              P: getPeriodSpan(period.name),
              T: getUsefulTimePhrase(period.start.totalminutes - totalminute)
            })
          ])
        }
      }

      schedule.push(apExams)

      for (const [i, period] of periods.entries()) {
        const periodStyle = getPeriod(period.name)
        let periodTimeLeft = null
        if (isToday) {
          if (totalminute >= period.end.totalminutes) {
            periodTimeLeft = applyPdEndedAgo({
              T: getUsefulTimePhrase(totalminute - period.end.totalminutes)
            })
          } else if (totalminute < period.start.totalminutes) {
            periodTimeLeft = applyPdStarting({
              T: getUsefulTimePhrase(period.start.totalminutes - totalminute)
            })
          } else {
            periodTimeLeft = applyPdEndingIn({
              T1: getUsefulTimePhrase(period.end.totalminutes - totalminute),
              T2: getUsefulTimePhrase(totalminute - period.start.totalminutes)
            })
          }
        }
        // Get people to use WATT by intentionally not fixing the typo in the
        // schedule
        if (period.end.totalminutes < period.start.totalminutes) {
          schedule.push([
            'div.watt-ad',
            ['h3', localize('watt/heading')],
            [
              'p',
              localizeWith('watt/message', 'other', { NAME: periodStyle.label })
            ],
            [
              {
                type: 'ext-link.material.raised.watt-link',
                properties: {
                  href: 'https://gunnwatt.web.app/'
                },
                options: { ripple: true }
              },
              localize('watt/switch')
            ]
          ])
        } else {
          schedule.push([
            'div.watt-ad',
            ['h3', localize('watt/other/heading')],
            [
              'p',
              wattMessages[(date.dayId * 17 + i * 53) % wattMessages.length]
            ],
            [
              {
                type: 'ext-link.material.raised.watt-link',
                properties: {
                  href: 'https://gunnwatt.web.app/'
                },
                options: { ripple: true }
              },
              localize('watt/switch')
            ]
          ])
        }
        let clubItems = []
        if (period.name === 'Lunch' && dayToPrime[date.day]) {
          const clubs = []
          Object.keys(savedClubs).forEach(clubName => {
            if (savedClubs[clubName] % dayToPrime[date.day] === 0) {
              clubs.push(clubName)
            }
          })
          if (clubs.length) {
            clubItems = [
              ['span.small-heading', localize('lunch-clubs')],
              ...clubs.map(club => {
                const clubData = getClubByName && getClubByName(club)
                const extraData = clubData
                  ? [
                      clubData.link && [
                        {
                          type: 'ext-link.join-club-link',
                          properties: { href: clubData.link }
                        },
                        localize('join')
                      ],
                      clubData.time
                    ]
                      .filter(identity)
                      .map(datum => [' · ', datum])
                  : []
                return [
                  'span.club-links',
                  [
                    { type: 'a', properties: { href: '#' }, dataset: { club } },
                    club
                  ],
                  ...(extraData.length
                    ? [' (', ...[].concat(...extraData).slice(1), ')']
                    : [])
                ]
              })
            ]
          }
        }
        schedule.push([
          {
            type: 'div.schedule-period',
            classes: [
              period.name === 'GT' && 'gunn-together',
              isLight(periodStyle.colour) ? 'light' : 'dark'
            ],
            style: getCSS(periodStyle.colour, period.name)
          },
          period.name !== 'GT' && [
            'span.schedule-periodname',
            periodStyle.label,
            [
              'span.pd-btns',
              options.displayAddAsgn && [
                {
                  type: 'ripple-btn.material.icon.pd-btn.add-asgn',
                  dataset: { pd: period.name }
                },
                ['i.material-icons', 'add_task']
              ],
              periodStyle.link && [
                {
                  type: 'ext-link.material.icon.pd-btn',
                  properties: { href: periodStyle.link },
                  options: { ripple: true }
                },
                ['i.material-icons', '\ue89e']
              ]
            ]
          ],
          period.async && ['div.period-badge', localize('async')],
          period.final && ['div.period-badge.finals-badge', localize('finals')],
          (period.gunnTogether || period.name === 'GT') && [
            'div.period-badge.gunn-together-badge',
            localize('gunn-together/name')
          ],
          period.name === 'GT' && ['span', localize('gunn-together/subtitle')],
          period.gunnTogether === 'sem2' && [
            'span',
            localize('gunn-together/sem2')
          ],
          [
            'span',
            localizeWith('range', 'times', {
              T1: getHumanTime(period.start, date),
              T2: getHumanTime(period.end, date),
              D: localizeWith('long', 'times', {
                T: getUsefulTimePhrase(
                  period.end.totalminutes - period.start.totalminutes
                )
              })
            })
          ],
          ['span', periodTimeLeft],
          assignments[period.name],
          ...clubItems
        ])
      }
    } else if (noSchool || summer) {
      // Although intended to be deterministic, this could change if I add more
      // sheep
      const seededRandom = mulberry32(date.dayId * 8)
      // Alternate between two sets of sheep between days so the same sheep
      // can't appear twice
      const sheepId =
        date.dayId % 2 < 1
          ? // Left half (including middle sheep)
            Math.floor(seededRandom() * Math.ceil(SHEEP_COUNT / 2))
          : // Right half (excluding middle sheep)
            Math.floor(seededRandom() * Math.floor(SHEEP_COUNT / 2)) +
            Math.ceil(SHEEP_COUNT / 2)
      schedule = [
        summer
          ? ['span.schedule-noschool', localize('summer')]
          : ['span.schedule-noschool', localize('no-school')],
        apExams,
        [
          {
            type: 'div.schedule-noschool-sheep',
            style: {
              backgroundPositionY: sheepId * SHEEP_VISUAL_HEIGHT + 'px'
            }
          }
        ]
      ]
    }

    return [
      ['h2.schedule-dayname', day],
      [
        'h3.schedule-date',
        [
          {
            type: 'a.totally-not-a-link',
            properties: { href: `?date=${date}` }
          },
          localizeWith('date', 'times', {
            M: months[date.month],
            D: date.date
          })
        ]
      ],
      assignments.noPeriod,
      !summer &&
        alternate && [
          'span.schedule-alternatemsg',
          applyAltSchedMsg({ D: alternate.description })
        ],
      ...schedule
    ]
  }
  if (!options.viewDay) options.viewDay = Day.today()
  const setState = createReactive(container, customElems)
  /**
   * TypeScript type:
   * (
   *   timeOk: (
   *     periodTime: number,
   *     currentTime: number,
   *     period: Period,
   *   ) => boolean,
   *   options?: { start?: boolean; end?: boolean },
   * ) =>
   *   | { period: Period; time: number; type: 'start' | 'end' }
   *   | null
   */
  function getNext (timeOk, { start = true, end = true } = {}) {
    const today = Day.today()
    const startOfDay = today.toLocal()
    const schedule = getSchedule(today)
    // Use seconds as common unit for these things
    /** Seconds since the start of the day */
    const time = (currentTime() - startOfDay) / 1000
    for (const period of schedule.periods) {
      const data = { period, schedule }
      if (start && timeOk(period.start.totalminutes * 60, time, data)) {
        return {
          period: period.name,
          time: period.start.totalminutes * 60 * 1000 + startOfDay.getTime(),
          type: 'start'
        }
      }
      if (end && timeOk(period.end.totalminutes * 60, time, data)) {
        return {
          period: period.name,
          time: period.end.totalminutes * 60 * 1000 + startOfDay.getTime(),
          type: 'end'
        }
      }
    }
    return null
  }
  const timers = []
  const onNewDays = []
  const onViewingDayChanges = []
  const onMinutes = []
  let lastToday = Day.today().dayId
  const checkSpeed = 50 // Every 50 ms
  let lastMinute, timeoutID
  function checkMinute () {
    const currentMinute = now()
      .toISOString()
      .slice(0, 16)
    if (currentMinute !== lastMinute) {
      returnval.render()
      lastMinute = currentMinute
      // If it's enabled yet there's no next set, keep trying to get one. This
      // is not very efficient but it should suffice.
      for (const { timer, next, update } of timers) {
        if (timer.enabled && !next) {
          update()
        }
      }
      for (const trigger of onMinutes) {
        trigger()
      }
    }
    if (options.update) {
      timeoutID = setTimeout(checkMinute, checkSpeed)
    } else {
      timeoutID = null
    }
    for (const { next, onNext, update } of timers) {
      if (next && currentTime() >= next.time) {
        onNext()
        update()
      }
    }
    const todayId = Day.today().dayId
    if (todayId !== lastToday) {
      if (lastToday === options.viewDay.dayId) {
        options.viewDay = Day.today()
        if (options.autorender) returnval.render()
      }
      lastToday = todayId
      for (const onNewDay of onNewDays) onNewDay()
    }
  }
  const returnval = {
    options,
    element,
    container,
    render () {
      setState(getRenderedScheduleForDay(options.viewDay))
      displayCurrentStatus()
    },
    update () {
      options.update = true
      returnval.render()

      if (timeoutID) clearTimeout(timeoutID)
      lastMinute = now()
        .toISOString()
        .slice(0, 16)
      timeoutID = setTimeout(checkMinute, checkSpeed)
    },
    stopupdate () {
      options.update = false
      if (timeoutID) {
        clearTimeout(timeoutID)
        timeoutID = null
      }
    },
    get viewDay () {
      return options.viewDay
    },
    setViewDay (day) {
      const oldDay = options.viewDay
      options.viewDay = day
      if (options.autorender) returnval.render()
      for (const listener of onViewingDayChanges) {
        listener({
          date: options.viewDay,
          change: oldDay.dayId !== day.dayId
        })
      }
    },
    setPeriod (id, { name, colour, link }, update) {
      if (name !== undefined) options.periods[id].label = name
      if (colour !== undefined) options.periods[id].colour = colour
      if (link !== undefined) options.periods[id].link = link
      if (update) {
        returnval.render()
      }
    },
    getWeek () {
      const week = []
      const today = options.viewDay.sunday
      for (let i = 0; i < 7; i++) {
        const d = today.add(i)
        const day = []
        const sched = getSchedule(d).periods
        if (sched.length)
          for (const period of sched) {
            const style = getPeriod(period.name)
            style.id = period.name
            day.push(style)
          }
        if (options.viewDay.day === i) day.today = true
        day.date = d
        week.push(day)
      }
      return week
    },
    // Runs the given callback some amount of time before a period starts/ends
    addTimer (getNextFn, onNext, timer = { enabled: true }) {
      timer.update = () => {
        entry.next = timer.enabled ? getNextFn(getNext) : null
        return timer
      }
      const entry = {
        timer,
        onNext: () => {
          onNext(entry.next, { getSchedule, getUsefulTimePhrase })
        },
        update: timer.update,
        next: null
      }
      timers.push(entry)
      return timer
    },
    // Runs the given callback when a new day starts
    onNewDay (listener, callImmediately = false) {
      onNewDays.push(listener)
      if (callImmediately) listener()
    },
    // Runs the given callback when the user views a different day
    onViewingDayChange (
      listener,
      { onNewDay = false, callImmediately = false } = {}
    ) {
      onViewingDayChanges.push(listener)
      if (onNewDay) {
        onNewDays.push(() => {
          listener({
            date: options.viewDay,
            change: 'new day'
          })
        })
      }
      if (callImmediately) {
        listener({
          date: options.viewDay,
          change: 'init'
        })
      }
    },
    // Runs the given callback when the minute changes
    onMinute (listener, callImmediately = false) {
      const trigger = () => {
        listener({
          getUsefulTimePhrase,
          totalMinutes: getTotalMinutes()
        })
      }
      onMinutes.push(trigger)
      if (callImmediately) trigger()
      return trigger
    },
    getTotalMinutes,
    getPeriodSpan,
    getSchedule,
    isEndOfDay: () => {
      const d = now()
      const totalminute = getTotalMinutes(d)
      const { periods } = getSchedule(Day.today())
      // endOfDay is an hour after end of school
      return (
        periods.length &&
        totalminute - periods[periods.length - 1].end.totalminutes >= 60
      )
    },
    getRenderedScheduleForDay,
    displayCurrentStatus,
    resetCurrentStatus
  }
  element.appendChild(container)
  return returnval
}
