# Should I ever clean up/rewrite UGWA's code

In preparation for our evitable egress from Gunn, UGWA should be able to be legible for any students willing to take over. UGWA should look the same to the average user, unless we also update the design to the new material specifications.

## Startup process

The following lists most things related to the core [features of UGWA](./feature-set.md) (eg schedules, period colours and names, assignments, localization).

### Data preparation (back end)

- **options** requires parsing from localStorage
- **period styles** requires *options*
- **localization** requires *options*, possibly importing localization data for other languages
- **time formatting** requires *options*, *localization*
- **alternate schedule data** requires possibly fetching alternate schedules from the school, *options*
- **get schedule** requires *alternate schedule data*, normal schedule data, *options*
- **preview date** requires *current date* (by default)
- **assignments** requires *options*, possibly fetching from Assync
- **club/staff data** requires fetching the JSON files

### On DOM ready (front end)

- **theme** requires *options*
- **schedule rendering** requires *get schedule*, *localization*, *period styles*, *preview date*, *current time*, *assignments*, *club/staff data*, *options* (for displaying clubs during lunch), *time formatting*, getting events
- **period status** requires *get schedule*, *current date*, *localization*, *time formatting*, *period styles*
- **upcoming assignments** requires *assignments*, *current date*, *localization*, *options*, *period styles*
- **period customization** requires *period styles*, *localization*
- **display language** requires *localization*
- **club/staff lists** requires *club/staff data*

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
