## JS files

### UGWA-only

**barcodes.js** - Handles the barcodes' functionality in the Utilities section

**footer.js** - Footer functionality and section visibility

**lists.js** - Club and staff list getting and displaying

**main.js** - Google Maps functionality, utility functions, current second display, PSA, and AppCache updating

**material.js** - Material ripples, material switch/radio and dialog close button functionality

**schedule.js** - Schedule display, alternate schedule handling, period customisation, events fetching, week preview, and deals with the date picker

### Libraries that UGWA uses

**altScheduleGenerator.js** - Generates a schedule based on the summary and description of a Google Calendar event from Gunn's calendar; used in [Ugwita](../lite/) as well.

**code39.js**/code39.min.js - Barcode rendering based on the Code 39 specification ([wiki](https://github.com/Orbiit/gunn-web-app/wiki/code39.js))

**colour.js**/colour.min.js - Colour picker ([wiki](https://github.com/Orbiit/gunn-web-app/wiki/colour.js))

**date.js**/date.min.js - Date picker ([wiki](https://github.com/Orbiit/gunn-web-app/wiki/date.js))

### Others used in the [designs](../designs/)

**datepicker2.js** - Material date picker ([demo](../designs/dateselector.html))

**dom.js** - Makes DOM manipulation easier, but only used in the [mixed design concept](../designs/mix.html)

**inputFitContent.js** - Adjusts the width of an input to fit its value length; only used in the [day view design concept](../designs/dayview.html)

### Demos

[**eventsGenerator.html**](eventsGenerator.html) - Displays all of Gunn's Google Calendar events in the 2017-18 school year

[**mergefiles.html**](mergefiles.html) - Fetches a bunch of files and puts them together; originally used to minify UGWA

[**scroll.html**](scroll.html) - Some arbitrary tests with native scrolling
