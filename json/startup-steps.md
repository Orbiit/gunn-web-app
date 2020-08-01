# Should I ever clean up/rewrite UGWA's code

In preparation for our evitable egress from Gunn, UGWA should be able to be legible for any students willing to take over. UGWA should look the same to the average user, unless we also update the design to the new material specifications.

## Startup process

The following lists most things related to the core [features of UGWA](./feature-set.md) (eg schedules, period colours and names, assignments, localization).

### Data preparation (back end)

- **options** requires parsing from localStorage
- **period styles** requires _options_
- **localization** requires _options_, possibly importing localization data for other languages
- **time formatting** requires _options_, _localization_
- **alternate schedule data** requires possibly fetching alternate schedules from the school, _options_
- **get schedule** requires _alternate schedule data_, normal schedule data, _options_
- **preview date** requires _current date_ (by default)
- **assignments** requires _options_, possibly fetching from Assync
- **club/staff data** requires fetching the JSON files

### On DOM ready (front end)

- **theme** requires _options_
- **schedule rendering** requires _get schedule_, _localization_, _period styles_, _preview date_, _current time_, _assignments_, _club/staff data_, _options_ (for displaying clubs during lunch), _time formatting_, getting events
- **period status** requires _get schedule_, _current date_, _localization_, _time formatting_, _period styles_
- **upcoming assignments** requires _assignments_, _current date_, _localization_, _options_, _period styles_
- **period customization** requires _period styles_, _localization_
- **display language** requires _localization_
- **club/staff lists** requires _club/staff data_

## Data formats

Data formats used in UGWA:

- **date**
  - `08-10` - used to store alternate schedules and SELF days (from Ugwita)
  - `8-10` - used to refer to alternate schedules and SELF days (translated from Ugwita to legacy UGWA for `scheduleApp`)
  - `{d: 10, m: 7, y: 2019}` - used to refer to a day outside of `scheduleApp` and assignment dates (from `DatePicker`)
  - `offset` - used internally in `scheduleApp` to refer to a day relative to the current date
  - `2019-08-10` - announcement date
  - Note: club list also relies on the current date for the default search query
- **time**
  - `795` - H period times, stored periods
  - `{hour: 13, minute: 15, totalminutes: 795}` - `scheduleApp`
  - `1315` - `scheduleApp`'s `getHumanTime`
- **period colour**
  - `#abc123` - a colour
  - [anything else] - an image

## Other notes

- the current time and date should be returned by a function so simulating different times is easier
- likewise, the beginning and end of the year should be declared in one place
- make every step asynchronous in order to prevent an error in one part of UGWA to break the rest of the app
- clean up how UGWA stores things, so this may require a compatibility.js to translate old save data to new
- localization should be better at how it deals with
- period styles should use CSS variables and classes so it doesn't require rerendering the schedule when the styles are updated
- separate schedule rendering from period status
  - avoid recreating elements when just updating current time
  - only recreate elements when schedule is updated
- make sure to define spaces to insert special things such as AP schedule, summer school, ads (dialogs), etc.
