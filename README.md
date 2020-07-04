# The Unofficial Gunn Web App (UGWA)
The Gunn App, this project's predecessor, was originally only available to [Android](https://github.com/RiceCakess/TheGunnApp) and [iOS](https://github.com/xaviloinaz/thegunnapp) users.

The **Unofficial Gunn Web App** (abbrev. UGWA, pronounced `/ˈuːɡwə/` or OOG-wah) aims to bring the capabilities of the Gunn App to the web (Chrome and maybe iOS Safari; it'd be a miracle if it worked on other browsers too).

## Versions
and their faults:
- [**Gunn Schedule**](https://orbiit.github.io/gunn-web-app/schedule/) — doesn't work offline, uses jQuery and Materialize, no alternate schedules, only light theme
- [**Unofficial Gunn Web App** / UGWA](https://orbiit.github.io/gunn-web-app/) — doesn't use service workers
- [**Ugwita** / UGWA Lite](https://orbiit.github.io/gunn-web-app/lite/) — only shows schedule, ugly
- [**Ugwa 2**](https://orbiit.github.io/ugwa2/) — "not done"
- [**Ugwisha**](https://orbiit.github.io/ugwisha/) — not as featureful as UGWA

Please give us your ideas/suggestions! :D

## Files used
`build.js` reads `appdesign.html`, the source HTML, replaces the `<link>` tags with a `<style>` tag containing the contents of all the linked CSS files (in order), replaces the `<script>` tags with a `<script>` tag containing the contents of the linked JS files (in order), then minifies the entire thing and writes it to `index.html`.

## Contingency

Refer to [new-school-year.md](./docs/new-school-year.md) for updating UGWA to a new school year.
