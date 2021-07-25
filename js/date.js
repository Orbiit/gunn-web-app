import { ripple } from './material.js'
import { localize, localizeWith } from './l10n.js'
import { now } from './utils.js'

/**
 * A single, unified Day object representing a day (no time). Months are
 * 0-indexed.
 */
export class Day {
  constructor (utcDate) {
    this._date = utcDate
  }

  get year () {
    return this._date.getUTCFullYear()
  }

  get month () {
    return this._date.getUTCMonth()
  }

  get date () {
    return this._date.getUTCDate()
  }

  get day () {
    return this._date.getUTCDay()
  }

  /**
   * Returns the number of days between the Unix epoch and this date. It should
   * be unique per date, so it can be used as an ID.
   */
  get dayId () {
    return this._date.getTime() / 86400000
  }

  /**
   * Returns the Sunday of a week, which can be used to get a unique ID for a
   * week of dates.
   */
  get sunday () {
    return this.add(-this.day)
  }

  /**
   * Return a new Day that is `days` days after this date.
   */
  add (days) {
    const clone = new Date(this._date)
    clone.setUTCDate(this.date + days)
    return new Day(clone)
  }

  /**
   * Returns the UGWA legacy alternate schedule date ID, which is in the form
   * M-D with no leading zeroes.
   */
  ugwaLegacy () {
    return `${this.month + 1}-${this.date}`
  }

  /**
   * Converts the Date to the date in local time at the start of the day.
   */
  toLocal () {
    return new Date(this.year, this.month, this.date)
  }

  /**
   * Returns the ISO 8601 representation of the date: YYYY-MM-DD.
   */
  toString () {
    return [
      this.year.toString().padStart(4, '0'),
      (this.month + 1).toString().padStart(2, '0'),
      this.date.toString().padStart(2, '0')
    ].join('-')
  }

  /**
   * Returns the day ID. JS calls this implicitly for things like comparisons,
   * so you can directly compare a Day.
   */
  valueOf () {
    return this.dayId
  }

  static get EPOCH () {
    return new Day(new Date(0))
  }

  static from (year, month, date) {
    return new Day(new Date(Date.UTC(year, month, date)))
  }

  static today () {
    const today = now()
    return Day.from(today.getFullYear(), today.getMonth(), today.getDate())
  }

  static parse (str) {
    const [year, month, date] = str.split('-').map(Number)
    const parsed = Day.from(year, month - 1, date)
    return Number.isNaN(parsed.dayId) ? null : parsed
  }

  static fromDay (dayId) {
    return Day.EPOCH.add(dayId)
  }
}

export class DatePicker {
  // 0 indexed months, but 1 indexed dates and years
  constructor (start, end, elem, { showDaysLeft = false } = {}) {
    this._days = localize('ds').split('  ')
    this._months = localize('months').split('  ')
    const days = this._days
    this.start = start
    this.end = end
    this.selected = null
    this.todayEntry = null
    this._onChange = new Set()
    this.dates = {}
    this.weeks = []
    this.showDaysLeft = showDaysLeft
    this.wrapper = elem || document.createElement('div')
    this.wrapper.classList.add('datepicker-wrapper')
    this.wrapper.classList.add('hide')
    let lastmonth = null
    let today = start.sunday
    while (today < end) {
      let week = []
      this.weeks.push(week)
      for (let i = 0; i < days.length; i++) {
        if (lastmonth !== today.month) {
          lastmonth = today.month
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
            this.weeks.push({ month: lastmonth, year: today.year })
            this.weeks.push(newWeek)
            week = newWeek
          } else {
            this.weeks.splice(-1, 0, {
              month: lastmonth,
              year: today.year
            })
          }
        }
        const entry = { day: today, dateId: today.dayId }
        week.push(entry)
        if (today >= start && today <= end) {
          this.dates[today.dayId] = entry
        } else {
          entry.notinrange = true
        }
        today = today.add(1)
      }
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
      if (this.selected) {
        const selectedEntry = this.dates[this.selected.dayId]
        if (selectedEntry) {
          if (selectedEntry.elem.scrollIntoViewIfNeeded) {
            selectedEntry.elem.scrollIntoViewIfNeeded()
          } else {
            selectedEntry.elem.scrollIntoView()
          }
        }
      }
      const todayEntry = this.dates[Day.today().dayId] || null
      if (todayEntry !== this.todayEntry) {
        if (this.todayEntry) {
          this.todayEntry.elem.classList.remove('datepicker-today')
        }
        // `todayEntry` might be null if it's outside of the school year.
        if (todayEntry) {
          todayEntry.elem.classList.add('datepicker-today')
        }
        this.todayEntry = todayEntry
      }
      if (this.isSchoolDay) {
        const weeksWithSchoolDays = new Set()
        let schoolDays = 0
        let encounteredToday = Day.today() < this.start
        let curr = this.start
        while (curr <= this.end) {
          const entry = this.dates[curr.dayId]
          if (entry === todayEntry) {
            encounteredToday = true
          }
          if (entry) {
            if (this.isSchoolDay(curr)) {
              entry.elem.classList.remove('there-is-no-school')
              if (encounteredToday) {
                schoolDays++
                weeksWithSchoolDays.add(curr.sunday.dayId)
              }
            } else {
              entry.elem.classList.add('there-is-no-school')
            }
          }
          curr = curr.add(1)
        }
        this.schoolYearLeft.textContent =
          schoolDays === 0
            ? localize('ended')
            : localizeWith('end-date', 'times', {
                D: localizeWith('school-days', 'times', {
                  D: schoolDays,
                  W: weeksWithSchoolDays.size
                })
              })
      }
    }
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
          day.textContent = entry.day.date
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
            this.day = entry.day
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
      const t = this.dates[this.selected.dayId]
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
      this.day = Day.today()
      const todayElem = this.dates[this.day.dayId]
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
    if (this.created && this.selected) {
      const selectedEntry = this.dates[this.selected.dayId]
      if (selectedEntry) {
        selectedEntry.elem.classList.remove('datepicker-selected')
      }
    }
    if (day) {
      if (this.created && this.inrange(day)) {
        const entry = this.dates[day.dayId]
        if (entry) {
          entry.elem.classList.add('datepicker-selected')
        }
      }
    }
    this.selected = day
    for (const onChange of this._onChange) {
      onChange(day)
    }
  }

  inrange (day) {
    return day >= this.start && day <= this.end
  }

  onChange (func) {
    this._onChange.add(func)
  }

  offChange (func) {
    this._onChange.delete(func)
  }
}
