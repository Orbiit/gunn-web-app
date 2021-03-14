import { ripple } from './material.js'
import { localize, localizeWith } from './l10n.js'
import { now } from './utils.js'
// Date format names:
// weird = the weird {d, m, y} object format that this uses for some reason
// js = JavaScript Date object
export class DatePicker {
  // 0 indexed months, but 1 indexed dates and years
  constructor (start, end, elem, { showDaysLeft = false } = {}) {
    this._days = localize('ds').split('  ')
    this._months = localize('months').split('  ')
    const days = this._days
    this.start = start
    this.end = end
    this.min = DatePicker.weirdToJS(start).getTime()
    this.max = DatePicker.weirdToJS(end).getTime()
    this.selected = null
    this.todayEntry = null
    this.dates = {}
    this.weeks = []
    this.showDaysLeft = showDaysLeft
    this.wrapper = elem || document.createElement('div')
    this.wrapper.classList.add('datepicker-wrapper')
    this.wrapper.classList.add('hide')
    let genesis = DatePicker.weirdToJS(start)
    let weeknum = 0
    const apocalypse = DatePicker.weirdToJS(end).getTime()
    const startday = genesis.getDay()
    let today = new Date(start.y, start.m, start.d - startday)
    let lastmonth = null
    genesis = genesis.getTime()
    while (today.getTime() < apocalypse) {
      let week = []
      this.weeks.push(week)
      for (let i = 0; i < days.length; i++) {
        today = new Date(start.y, start.m, start.d - startday + weeknum * 7 + i)
        if (lastmonth !== today.getMonth()) {
          lastmonth = today.getMonth()
          if (week.length > 0) {
            const newWeek = new Array(week.length).fill({
              notinrange: true,
              placeholder: true
            })
            week.push(
              ...new Array(7 - week.length).fill({
                notinrange: true,
                placeholder: true
              })
            )
            this.weeks.push({ month: lastmonth, year: today.getFullYear() })
            this.weeks.push(newWeek)
            week = newWeek
          } else {
            this.weeks.splice(-1, 0, {
              month: lastmonth,
              year: today.getFullYear()
            })
          }
        }
        const todayId = DatePicker.weirdToString(DatePicker.jsToWeird(today))
        const entry = { today, dateId: todayId }
        week.push(entry)
        if (today.getTime() >= genesis && today.getTime() <= apocalypse) {
          entry.month = today.getMonth()
          entry.year = today.getFullYear()
          entry.date = today.getDate()
          this.dates[todayId] = entry
        } else {
          entry.notinrange = true
        }
      }
      weeknum++
    }
  }

  open () {
    if (!this.created) this._createElements()
    if (this.wrapper.classList.contains('hide')) {
      this.wrapper.classList.remove('hide')
      const close = e => {
        if (!this.wrapper.contains(e.target)) {
          this.wrapper.classList.add('hide')
          document.removeEventListener('click', close, false)
        }
      }
      setTimeout(() => {
        document.addEventListener('click', close, false)
      }, 0)
      let t
      if (
        this.selected &&
        (t = this.dates[DatePicker.weirdToString(this.selected)])
      ) {
        if (t.elem.scrollIntoViewIfNeeded) {
          t.elem.scrollIntoViewIfNeeded()
        } else {
          t.elem.scrollIntoView()
        }
      }
      const todayEntry =
        this.dates[DatePicker.weirdToString(DatePicker.jsToWeird(now()))] ||
        null
      if (todayEntry !== this.todayEntry) {
        if (this.todayEntry) {
          this.todayEntry.elem.classList.add('datepicker-today')
        }
        // `todayEntry` might be null if it's outside of the school year.
        if (todayEntry) {
          todayEntry.elem.classList.add('datepicker-today')
        }
        this.todayEntry = todayEntry
      }
      if (this.isSchoolDay) {
        const temp = DatePicker.weirdToJS(this.start)
        const weeksWithSchoolDays = new Set()
        let schoolDays = 0
        let encounteredToday = false
        while (this.compare(DatePicker.jsToWeird(temp), this.end) <= 0) {
          const entry = this.dates[
            DatePicker.weirdToString(DatePicker.jsToWeird(temp))
          ]
          if (entry === todayEntry) {
            encounteredToday = true
          }
          if (entry) {
            if (this.isSchoolDay(temp)) {
              entry.elem.classList.remove('there-is-no-school')
              if (encounteredToday) {
                schoolDays++
                weeksWithSchoolDays.add(this._getWeek(temp))
              }
            } else {
              entry.elem.classList.add('there-is-no-school')
            }
          }
          temp.setDate(temp.getDate() + 1)
        }
        this.schoolYearLeft.textContent = localizeWith('end-date', 'times', {
          D: localizeWith('school-days', 'times', {
            D: schoolDays,
            W: weeksWithSchoolDays.size
          })
        })
      }
    }
  }

  /**
   * Gives an ID that should be the same for all dates within a week but
   * different for dates across different weeks.
   */
  _getWeek (date) {
    const temp = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - date.getDay()
    )
    return temp.toISOString().slice(0, 10)
  }

  _createElements () {
    if (this.created) return
    this.created = true
    const days = this._days

    // header
    this.header = document.createElement('div')
    this.header.classList.add('datepicker-dayheadings')
    for (const d of days) {
      const t = document.createElement('span')
      t.classList.add('datepicker-dayheading')
      t.innerHTML = d
      this.header.appendChild(t)
    }
    this.wrapper.appendChild(this.header)

    // days
    const dates = document.createElement('div')
    dates.classList.add('datepicker-days')
    for (const weekDates of this.weeks) {
      const week = document.createElement('div')
      week.classList.add('datepicker-week')
      dates.appendChild(week)

      if (weekDates.month !== undefined) {
        week.classList.add('datepicker-has-month')
        const t = document.createElement('span')
        t.classList.add('datepicker-month')
        t.textContent = localizeWith('month', 'times', {
          M: this._months[weekDates.month],
          Y: weekDates.year
        })
        week.appendChild(t)
        continue
      }

      for (const entry of weekDates) {
        const day = document.createElement('span')
        entry.elem = day
        day.classList.add('datepicker-day')
        day.dataset.dateId = entry.dateId
        if (!entry.notinrange) {
          day.textContent = entry.date
        }
        week.appendChild(day)
      }
    }
    dates.addEventListener(
      'click',
      e => {
        if (e.target.classList.contains('datepicker-day')) {
          const entry = this.dates[e.target.dataset.dateId]
          if (entry && !entry.notinrange) {
            this.day = { d: entry.date, m: entry.month, y: entry.year }
          }
        }
      },
      false
    )
    this.schoolYearLeft = document.createElement('p')
    this.schoolYearLeft.className = 'datepicker-school-year-left'
    dates.appendChild(this.schoolYearLeft)
    this.wrapper.appendChild(dates)

    if (this.selected) {
      const t = this.dates[DatePicker.weirdToString(this.selected)]
      if (t) {
        t.elem.classList.add('datepicker-selected')
      }
    }

    const todayWrapper = document.createElement('div')
    todayWrapper.className = 'datepicker-bottom'
    const todayBtn = document.createElement('button')
    todayBtn.className = 'material datepicker-today-btn'
    todayBtn.textContent = localize('today')
    ripple(todayBtn)
    todayBtn.addEventListener('click', e => {
      this.day = DatePicker.jsToWeird(now())
      const todayElem = this.dates[DatePicker.weirdToString(this.day)]
      if (todayElem) {
        todayElem.elem.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    })
    todayWrapper.appendChild(todayBtn)
    this.wrapper.appendChild(todayWrapper)
  }

  get day () {
    return this.selected
  }

  set day (day) {
    let t
    if (
      this.created &&
      this.selected &&
      (t = this.dates[DatePicker.weirdToString(this.selected)])
    ) {
      t.elem.classList.remove('datepicker-selected')
    }
    if (day) {
      day = DatePicker.purify(day)
      if (
        this.created &&
        this.inrange(day) &&
        (t = this.dates[DatePicker.weirdToString(day)])
      ) {
        t.elem.classList.add('datepicker-selected')
      }
    }
    this.selected = day
    if (this.onchange) this.onchange(day)
  }

  inrange (day) {
    const d = DatePicker.weirdToJS(day).getTime()
    return !(d < this.min || d > this.max)
  }

  compare (d1, d2) {
    return (
      DatePicker.weirdToJS(d1).getTime() - DatePicker.weirdToJS(d2).getTime()
    )
  }

  static weirdToJS ({ y, m, d }) {
    return new Date(y, m, d)
  }

  static jsToWeird (d) {
    return { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
  }

  static weirdToString ({ y, m, d }) {
    // using dots bc some teachers use dots and since there's no leading zeroes
    // it wouldn't look like iso 8601 if i used hyphens
    return `${y}.${m}.${d}`
  }

  static purify (day) {
    const d = new Date(day.y, day.m, day.d)
    return { d: d.getDate(), m: d.getMonth(), y: d.getFullYear() }
  }
}
