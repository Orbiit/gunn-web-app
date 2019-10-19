# UGWA feature set

- PWA

- sections: saved state, (selectable from URL)

- iOS add to home screen prompt

- materialesque

- **utilities**

  - (PAUSD login page)

  - barcodes: rendering, add/remove, scannable view, set name/ID, (displayable from URL)

  - (student resources)

  - minimum score calculator

  - (interstudent communication)

  - map: image, (Google Maps)

- **club/staff list**

  - search: regex, current day by default for clubs, clear entry

  - list of clubs to show in lunch card

  - easter eggs: SELF club, Aaryan

  - (disableable)

  - (set search content from URL)

- **options**

  - announcements: history

  - (current version)

  - easter egg options

  - dark/light theme

  - 12-/24-hour

  - compact/full times

  - languages

  - settings code/file

  - (reload UGWA)

  - error log

  - **periods**

    - name, colour/image (colour picker)

    - (show/hide SELF)

    - show/hide zero period

    - hide preps

    - set H period days and times

  - **assignments**

    - show/hide add assignment button

    - assignments position

    - (sorting method)

    - cross-device sync

- **schedule**

  - (current second)

  - back/forward a day

  - date selector

  - day of week, month and date

  - permalink to day

  - summer, no school, and alternate schedule message

  - school end time

  - time until next/end of current period

  - **periods**

    - time range, length, (time until start/end), assignments due

    - zero period only if school on previous day

  - week overview

  - add assignment: assignment text, day, period, category, priority, delete

  - upcoming and overdue assignments, confetti when marked done

  - calendar events: update alternate schedule

# [Material components](https://material.io/components/)

[Text](https://material.io/design/typography/the-type-system.html#type-scale), colours (NOTE: could use a lighter version of theme colour for [dark theme](https://material.io/design/color/dark-theme.html#properties)), [shadows](https://material.io/develop/web/components/elevation/), [ripples](https://material.io/design/interaction/states.html)

- bottom navigation (NOTE: could make the navbar theme colour for light theme only?)

- buttons (NOTE: can be `a`, `button`, or `label` for an `input[type=file]`)

- cards (periods, maybe announcements)

- chips? (assignment overdue/category badge, new announcement badge)

- lists (club/staff list, student resources)

- menus (assignment category)

- (date) pickers (NOTE: can also use for colour picker)

- selection controls: checkboxes (H period days, assignments)

- selection controls: radios (options)

- selection controls: switches (options)

- sheets: (expanding) bottom (club/staff information, assignment editor - NOTE: [on desktop, it shouldn't take up the whole screen](https://material.io/components/sheets-bottom/#standard-bottom-sheet-figure-caption-5))

- sliders (H period times)

- snackbars (Assync, new update)

- text fields (period names, assignment text, minimum score calculator, search, paste save code, colour picker image URL, Assync ID)

- tooltips (barcode, assignment, search clear)

Not material: interstudent communication, map
