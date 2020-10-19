import { localize, localizeWith } from '../js/l10n.js'
import { showClub, getClubByName } from '../js/lists.js'
import { savedClubs } from '../js/saved-clubs.js'
import { currentTime, escapeHTML, now } from '../js/utils.js'

export let days, months
export function setDaysMonths (newDays, newMonths) {
  days = newDays
  months = newMonths
}
function getDateId () {
  const today = now()
  // toISOString uses UTC D:
  // Just returns a unique ID per day, so no leading zeroes or adding one to
  // month needed
  return `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
}
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
  let elem
  const container = document.createElement('div')
  if (options.element) elem = options.element
  else elem = document.createElement('div')
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
  function getHumanTime (messytime) {
    const hr = +messytime.slice(0, 2) % 24
    if (options.h0Joke) return +messytime.slice(2) + ''
    else if (options.h24) return `${hr}:${messytime.slice(2)}`
    else
      return `${((hr - 1) % 12) + 1}:${messytime.slice(2)}${
        hr < 12 ? 'a' : 'p'
      }m`
  }
  function getCSS (colour, id) {
    if (colour[0] === '#') {
      return `background-color:${colour};color:${getFontColour(colour)};`
    } else {
      return `background-image: url('./.period-images/${id}?${encodeURIComponent(
        colour
      )}'); color: white; text-shadow: 0 0 10px black;`
    }
  }
  function getUsefulTimePhrase (minutes) {
    if (options.compact)
      return `${Math.floor(minutes / 60)}:${('0' + (minutes % 60)).slice(-2)}`
    else return localizeWith('duration', 'times', { T: minutes })
  }
  function getPeriodSpan (period) {
    if (period === 'GT') {
      return `<span class="schedule-endinginperiod gt-confuse">${localize(
        'gunn-together/name'
      )}</span>`
    }
    return `<span style="${getCSS(
      getPeriod(period).colour,
      period
    )}" class="schedule-endinginperiod">${escapeHTML(
      getPeriod(period).label
    )}</span>`
  }
  function isSELFDay (month, date) {
    return (
      options.self &&
      options.selfDays.includes(
        ('0' + (month + 1)).slice(-2) + '-' + ('0' + date).slice(-2)
      )
    )
  }
  getFontColour('rgba(0,0,0,0.2)')
  let setTitle = false
  const dayToPrime = { 1: 2, 2: 3, 3: 5, 4: 7, 5: 11 }
  function getSchedule (d, includeZero = options.show0) {
    const ano = d.getFullYear()
    const mez = d.getMonth()
    const dia = d.getDate()
    const weekday = d.getDay()
    let alternate = false
    let summer = false
    const isSELF = isSELFDay(mez, dia)
    let periods
    // For Gunn Together period resolution (see below)
    const gtWeek = Math.floor(
      (d - new Date(2020, 8 - 1, 17)) / 1000 / 60 / 60 / 24 / 7
    )
    // Don't touch this function because it's reimplemented under getWeek and
    // maybe elsewhere for some reason >_<
    function getPeriodName (index) {
      if (periods[index].name === 'Flex' && isSELF) {
        return 'SELF'
      }
      return periods[index].name
    }
    if (options.customSchedule) {
      periods = options.customSchedule(d, ano, mez, dia, weekday)
      if (periods && periods.alternate) {
        alternate = periods.alternate
        periods = periods.periods
      }
    }
    if (periods) periods = periods.slice()
    else if (options.isSummer && options.isSummer(ano, mez, dia)) {
      summer = true
      periods = []
    } else if (options.alternates[mez + 1 + '-' + dia]) {
      const sched = options.alternates[mez + 1 + '-' + dia]
      alternate = sched
      periods = sched.periods.slice()
    } else if (options.normal[weekday] && options.normal[weekday].length) {
      periods = options.normal[weekday].map(period => {
        if (typeof period.name === 'function') {
          return { ...period, name: period.name(d) }
        } else {
          return period
        }
      })
    } else periods = []
    if (periods.length) {
      if (options.hPeriods[weekday] && !periods.find(pd => pd.name === 'H')) {
        const [start, end] = options.hPeriods[weekday]
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
      if (includeZero && !periods.find(pd => pd.name === '0')) {
        if (getSchedule(new Date(ano, mez, dia - 1), false).periods.length) {
          periods.unshift(options.show0)
        }
      }
    }
    // Putting this before hiding preps so that if you have a prep for Gunn
    // Together it is hidden
    periods = periods.map(period => {
      if (period.name === 'GT') {
        // So far: 55 6432171
        //         0123456789
        let name
        if (gtWeek >= 0 && gtWeek < 2) name = 'E'
        else if (gtWeek === 3) name = 'F'
        else if (gtWeek < 8) name = 'ABCDEFG'[7 - gtWeek]
        else if (gtWeek === 8) name = 'G'
        else if (gtWeek === 9) name = 'A'
        if (name) {
          return { ...period, name, gunnTogether: true }
        }
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
      summer,
      getPeriodName,
      isSELF,
      date: { ano, mez, dia, weekday }
    }
  }
  function generateDay (offset = 0) {
    let d = now()
    let innerHTML
    let checkfuture = true
    const totalminute = d.getMinutes() + d.getHours() * 60
    if (offset !== 0) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)
      checkfuture = false
    }
    const {
      periods,
      alternate,
      summer,
      getPeriodName,
      isSELF,
      date: { ano, mez, dia, weekday }
    } = getSchedule(d)
    const day = days[weekday]
    innerHTML = `<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date"><a class="totally-not-a-link" href="?date=${`${ano}-${mez +
      1}-${dia}`}">${localizeWith('date', 'times', {
      M: months[mez],
      D: dia
    })}</a></h3>`
    const assignments = options.getAssignments(d)
    if (assignments.noPeriod) {
      innerHTML += assignments.noPeriod
    }
    if (summer)
      return (
        innerHTML +
        `<span class="schedule-noschool">${localize('summer')}</span>`
      )
    if (alternate) {
      innerHTML += `<span class="schedule-alternatemsg">${localizeWith(
        'alt-msg',
        'other',
        { D: `<strong>${alternate.description}</strong>` }
      )}</span>`
    }
    if (periods.length) {
      // If a day ends in an optional period, don't count it.
      // 'Flex' is temporarily in the list because it's kind of optional this
      // year.
      const optionalPeriods = ['Lunch', 'Brunch', 'Flex']
      const [lastRequiredPeriod] = periods
        .filter(({ name }) => !optionalPeriods.includes(name))
        .slice(-1)
      if (lastRequiredPeriod) {
        innerHTML += `<span class="schedule-end">${localizeWith(
          'end-time',
          'times',
          {
            T: `<strong>${getHumanTime(
              ('0' + lastRequiredPeriod.end.hour).slice(-2) +
                ('0' + lastRequiredPeriod.end.minute).slice(-2)
            )}</strong>`
          }
        )}</span>`
      }
      // QUESTION: Should there be feedback for days with only optional periods?
      // Later QUESTION: What did I mean by "feedback"??
      // "Feedback" as in a note that the entire day is optional.
      if (checkfuture) {
        let i
        for (i = 0; i < periods.length; i++)
          if (totalminute < periods[i].end.totalminutes) break
        let str
        let compactTime, period, compactStr
        if (i >= periods.length) {
          str = `<p class="schedule-endingin">${localizeWith('ended', 'times', {
            P: getPeriodSpan((period = getPeriodName(periods.length - 1))),
            T: `<strong>${(compactTime = getUsefulTimePhrase(
              totalminute - periods[periods.length - 1].end.totalminutes
            ))}</strong>`
          })}</p>`
          compactStr = localize('appname')
          returnval.endOfDay =
            totalminute - periods[periods.length - 1].end.totalminutes >= 60
        }
        // after school (endOfDay is an hour past)
        else if (totalminute >= periods[i].start.totalminutes) {
          str = `<div class="schedule-periodprogress"><div style="width: ${((totalminute -
            periods[i].start.totalminutes) /
            (periods[i].end.totalminutes - periods[i].start.totalminutes)) *
            100}%;"></div></div><p class="schedule-endingin">${localizeWith(
            'ending',
            'times',
            {
              P: getPeriodSpan((period = getPeriodName(i))),
              T: `<strong>${(compactTime = getUsefulTimePhrase(
                periods[i].end.totalminutes - totalminute
              ))}</strong>`
            }
          )}</p>`
          compactStr = localizeWith('ending-short', 'times', { T: compactTime })
        }
        // during a period
        else {
          str = `<p class="schedule-endingin">${localizeWith(
            'starting',
            'times',
            {
              P: getPeriodSpan((period = getPeriodName(i))),
              T: `<strong>${(compactTime = getUsefulTimePhrase(
                periods[i].start.totalminutes - totalminute
              ))}</strong>`
            }
          )}</p>`
          compactStr = localizeWith('starting-short', 'times', {
            T: compactTime,
            P: getPeriod(period).label
          }) // passing period or before school
        }
        innerHTML += str
        if (setTitle) {
          if (options.compact) document.title = compactStr
          else
            document.title = str
              .replace(/<[^>]+>/g, '')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
        }
      }
      for (const period of periods) {
        const periodName = getPeriod(
          period.name === 'Flex' && isSELF ? 'SELF' : period.name
        )
        innerHTML += `<div class="schedule-period ${
          period.name === 'GT' ? 'gunn-together' : ''
        } ${isLight(periodName.colour) ? 'light' : 'dark'}" style="${getCSS(
          periodName.colour,
          period.name
        )}">`
        if (period.name !== 'GT') {
          innerHTML += `<span class="schedule-periodname">${escapeHTML(
            periodName.label
          )}<span class="pd-btns">${
            options.displayAddAsgn
              ? `<button class="material icon pd-btn add-asgn" data-pd="${
                  period.name
                }" title="${localize(
                  'add-asgn'
                )}"><i class="material-icons">add_task</i></button>`
              : ''
          }${
            periodName.link
              ? `<a class="material icon pd-btn" target="_blank" href="${periodName.link}" rel="noopener noreferrer"><i class="material-icons">\ue89e</i></a>`
              : ''
          }</span></span>`
        }
        if (period.gunnTogether || period.name === 'GT') {
          innerHTML += `<div class="gunn-together-badge">${localize(
            'gunn-together/name'
          )}</div>`
        }
        if (period.name === 'GT') {
          innerHTML += `<span>${localize('gunn-together/subtitle')}</span>`
        }
        innerHTML += `<span>${getHumanTime(
          ('0' + period.start.hour).slice(-2) +
            ('0' + period.start.minute).slice(-2)
        )} &ndash; ${getHumanTime(
          ('0' + period.end.hour).slice(-2) +
            ('0' + period.end.minute).slice(-2)
        )} &middot; ${localizeWith('long', 'times', {
          T: getUsefulTimePhrase(
            period.end.totalminutes - period.start.totalminutes
          )
        })}</span>`
        if (checkfuture) {
          innerHTML += `<span>`
          if (totalminute >= period.end.totalminutes)
            innerHTML += localizeWith('self-ended', 'times', {
              T: `<strong>${getUsefulTimePhrase(
                totalminute - period.end.totalminutes
              )}</strong>`
            })
          else if (totalminute < period.start.totalminutes)
            innerHTML += localizeWith('self-starting', 'times', {
              T: `<strong>${getUsefulTimePhrase(
                period.start.totalminutes - totalminute
              )}</strong>`
            })
          else
            innerHTML += localizeWith('self-ending', 'times', {
              T1: `<strong>${getUsefulTimePhrase(
                period.end.totalminutes - totalminute
              )}</strong>`,
              T2: getUsefulTimePhrase(totalminute - period.start.totalminutes)
            })
          innerHTML += `</span>`
        }
        if (assignments[period.name]) {
          innerHTML += assignments[period.name]
        }
        if (period.name === 'Lunch' && dayToPrime[weekday]) {
          const clubs = []
          Object.keys(savedClubs).forEach(clubName => {
            if (savedClubs[clubName] % dayToPrime[weekday] === 0) {
              clubs.push(clubName)
            }
          })
          if (clubs.length) {
            innerHTML +=
              `<span class="small-heading">${localize('lunch-clubs')}</span>` +
              clubs
                .map(club => {
                  const clubData = getClubByName && getClubByName(club)
                  const extraData =
                    clubData &&
                    [
                      clubData.link
                        ? `<a href="${escapeHTML(
                            clubData.link
                          )}" target="_blank" rel="noopener noreferrer" class="join-club-link">${localize(
                            'join'
                          )}</a>`
                        : null,
                      clubData.time ? escapeHTML(clubData.time) : null
                    ].filter(d => d)
                  return `<span class="club-links"><a href="#" data-club="${escapeHTML(
                    club
                  )}">${club}</a>${
                    extraData ? ` (${extraData.join(' &middot; ')})` : ''
                  }</span>`
                })
                .join('')
          }
        }
        innerHTML += `</div>`
      }
    } else {
      innerHTML += `<span class="schedule-noschool">${
        getPeriod('NO_SCHOOL').label
      }</span>`
    }
    return innerHTML
  }
  if (!options.offset) options.offset = 0
  /**
   * onBlur runs once when the tab loses focus. This is to prevent Google from
   * using the current time in the tab title for the site name in Google Search
   * (see #82). I think this is fine because mobile devices won't need the tab
   * title, and those who do need the tab title probably fire blur reliably.
   */
  function onBlur () {
    setTitle = true
    // Recalculate the schedule to update the title.
    generateDay(options.offset)
    window.removeEventListener('blur', onBlur, false)
  }
  window.addEventListener('blur', onBlur, false)
  function getDate (date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }
  function getNext (timeOk, { start = true, end = true } = {}) {
    const today = getDate(now())
    const schedule = getSchedule(today)
    // Use seconds as common unit for these things
    const time = (currentTime() - today.getTime()) / 1000
    for (const period of schedule.periods) {
      if (start && timeOk(period.start.totalminutes * 60, time, period.name)) {
        return {
          period: period.name,
          time: period.start.totalminutes * 60 * 1000 + today.getTime(),
          type: 'start'
        }
      }
      if (end && timeOk(period.end.totalminutes * 60, time, period.name)) {
        return {
          period: period.name,
          time: period.end.totalminutes * 60 * 1000 + today.getTime(),
          type: 'end'
        }
      }
    }
    return null
  }
  const timers = []
  const onNewDays = []
  let lastToday = getDateId()
  const checkSpeed = 50 // Every 50 ms
  let lastMinute, timeoutID, animationID
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
    }
    if (options.update) {
      timeoutID = setTimeout(checkMinute, checkSpeed)
    } else {
      animationID = null
    }
    for (const { next, onNext, update } of timers) {
      if (next && currentTime() >= next.time) {
        onNext()
        update()
      }
    }
    if (getDateId() !== lastToday) {
      lastToday = getDateId()
      for (const onNewDay of onNewDays) onNewDay()
    }
  }
  const returnval = {
    options,
    element: elem,
    container,
    render () {
      container.innerHTML = generateDay(options.offset)
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
      window.cancelAnimationFrame(animationID)
    },
    get offset () {
      return options.offset
    },
    set offset (o) {
      options.offset = o
      if (options.autorender) returnval.render()
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
      const actualtoday = now()
      const week = []
      const today = new Date(
        actualtoday.getFullYear(),
        actualtoday.getMonth(),
        actualtoday.getDate() + options.offset
      )
      for (let i = 0; i < 7; i++) {
        const d = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - today.getDay() + i
        )
        const day = []
        const isSELF = isSELFDay(d.getMonth(), d.getDate())
        const sched = getSchedule(d).periods
        if (sched.length)
          for (const period of sched) {
            // q stands for 'quick' because I'm too lazy to make a variable name
            // but I am not lazy enough to make a comment explaining it
            const q = getPeriod(
              period.name === 'Flex' && isSELF ? 'SELF' : period.name
            )
            q.id = period.name
            day.push(q)
          }
        if (today.getDay() === i) day.today = true
        day.date = d
        week.push(day)
      }
      return week
    },
    addTimer (getNextFn, onNext, timer = { enabled: true }) {
      timer.update = () => {
        entry.next = timer.enabled ? getNextFn(getNext) : null
        return timer
      }
      const entry = {
        timer,
        onNext: () => {
          onNext(entry.next, { getDate, getSchedule, getUsefulTimePhrase })
        },
        update: timer.update,
        next: null
      }
      timers.push(entry)
      return timer
    },
    onNewDay (callback, callImmediately = false) {
      onNewDays.push(callback)
      if (callImmediately) callback()
    },
    getPeriodSpan,
    getSchedule,
    generateHtmlForOffset: generateDay
  }
  elem.appendChild(container)
  generateDay() // Calculate endOfDay, but don't render the HTML yet
  return returnval
}
