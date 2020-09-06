# The Unofficial Gunn Web App (UGWA)

The Gunn App, this project's predecessor, was originally only available to
[Android](https://github.com/RiceCakess/TheGunnApp) and
[iOS](https://github.com/xaviloinaz/thegunnapp) users.

The **Unofficial Gunn Web App** (abbrev. UGWA, pronounced `/ˈuːɡwə/` or OOG-wah)
aims to bring the capabilities of the Gunn App to the web (Chrome and maybe iOS
Safari; it'd be a miracle if it worked on other browsers too).

## Versions

and their faults:

- [**Gunn Schedule**](https://orbiit.github.io/gunn-web-app/schedule/) — doesn't
  work offline, uses jQuery and Materialize, no alternate schedules, only light
  theme
- [**Unofficial Gunn Web App** / UGWA](https://orbiit.github.io/gunn-web-app/) —
  doesn't use service workers
- [**Ugwita** / UGWA Lite](https://orbiit.github.io/gunn-web-app/lite/) — only
  shows schedule, ugly
- [**Ugwa 2**](https://orbiit.github.io/ugwa2/) — "not done"
- [**Ugwisha**](https://orbiit.github.io/ugwisha/) — not as featureful as UGWA

Please give us your ideas/suggestions! :D

## Development

This repository contains a lot of files, most of which aren't actually used by
UGWA. UGWA uses no framework or libraries for its front end, which allows you to
directly open
[`appdesign.html`](https://orbiit.github.io/gunn-web-app/appdesign.html) (the
source HTML) in a browser. You can then view the Sources tab in inspect element
to see all the relevant source files used by UGWA:

- **HTML** — `/appdesign.html`

- **CSS** — `/css/index.css`, linked by appdesign.html, which imports the other
  CSS files using `@import`:

  - `/css/assignments.css` — assignments

  - `/css/colourpicker.css` — colour picker

  - `/css/datepicker.css` — date picker

  - `/css/material.css` — Material design components like the ripple, buttons,
    switches, radios, and sliders EXCEPT for inputs (see below)

  - `/css/periodcustomisation.css` — Material input and other required
    components for the period customisation options

  - `/schedule/schedule.css` — schedule, specifically anything in the `<div class="schedule-container">` element (**NOTE**: this is in a different
    folder)

  - `/css/main.css` — everything else

- **JS** — `/js/main.js`, linked by appdesign.html, which is an ES module that
  imports the other JS files:

  - `/js/altScheduleGenerator.js?for=appdesign` — alternate schedule parsing
    from the school's Google Calendar (note that the same file is used by
    Ugwita)

  - `/js/assignments.js` — assignments

  - `/js/barcodes.js` — student ID generator in the Utilities section

  - `/js/code39.js` — barcode rendering using [Code
    39](https://en.wikipedia.org/wiki/Code_39)

  - `/js/colour.js` — colour picker

  - `/js/date.js` — date picker

  - `/js/footer.js` — the bottom navbar and showing/hiding sections

  - `/js/l10n.js` — allow translating UGWA by using translation strings

  - `/js/languages/` has translation files for English (`en.js`), French
    (`fr.js`), and Google Translated English (`en-gt.js`); there are also other
    languages that can be accessed by adding `?all-langs` to the URL

  - `/js/lists.js` — club and staff lists

  - `/js/material.js` — animations and functionality for Material design
    components like the ripple, inputs, and dropdowns
  - `/js/saved-clubs.js` — centralized manager for saved clubs

  - `/js/utils.js` — constants and utility functions; getting the current time
    is centralized here so it's easier to simulate a specific time

  - `/touchy/rotate1.js` — zoom/rotation/pan interactions for the image campus
    map

  - `/js/app.js` — re-exports `/schedule/app.js`, which is in a separate folder
    for some reason

  - `/schedule/app.js` — renders the schedule and anything time-related
    regarding the schedule (eg notifications and updating the tab title)

  - `/js/schedule.js` — anything remotely related to the schedule, such as
    personalisation options, editing assignments, events, the week preview,
    saving/loading/fetching alternate schedules, etc.

  - `/js/main.js` — everything else

- **IMAGES**:

  - `/js/gunn-together.svg` — the animated SVG used for unknown Gunn Together
    periods

  - `/js/images/newmap.min.png` — the map

  - `/favicon/` — creates cool embeds for when UGWA is linked on other platforms

After modifying UGWA's code, you can minify everything by doing

```sh
# Optional: ensure that your code follows the StandardJS style guide
npm run format

# Install dependencies (you only really need to do this once)
npm install

# Build
npm run build
```

This will automatically bundle and minify the source files using `build.js` into
a single `index.html` and update the service worker (`sw.js`).

Good luck!

### Simulating a different time

On `appdesign.html` in the console, you can run

```js
const start = Date.now()
// Set `baseTime` to be the desired start time (months are 0-indexed)
const baseTime = new Date(2020, 8, 9, 11, 0).getTime()
const speed = 100
setCurrentTime(() => {
  return (Date.now() - start) * speed + baseTime
})
```

### Updating staff and club lists

See [updating-staff-and-club-lists.md](./docs/updating-staff-and-club-lists.md).

### Updating UGWA for a new school year

Refer to [new-school-year.md](./docs/new-school-year.md) for updating UGWA to a
new school year.

### Creating a PSA

```sh
# IMPORTANT: If a PSA has already been created for today, it'll overwrite that
# file
npm run newpsa
```

Then edit the newly created file in the `/psa/` folder.

### Localization

You can run the following command to check that the published languages have all
the required translations. You can edit the `langs` array in
`/js/languages/check-l10n.js` to check other languages.

```sh
npm run check-l10n
```

To add a new language, just make a copy of `/js/languages/en.js` and name in
`<language code>.js`. Replace `export default` with `window.langs.<language code> =`. In the `availableLangs` object in `js/l10n.js`, specify the language's
name, and when you want to publish it, add it to the array in the else condition
of the ternary statement that determines `publicLangs`'s value.

You can automatically generate `/js/languages/en-gt.js` by running the following
command; you might have to manually translate some strings yourself, though.

```sh
node js/languages/make-en-gt.js
```
