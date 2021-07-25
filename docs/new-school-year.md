# Updating UGWA to a new school year

1. Update `firstDay` and `lastDay` in **js/utils.js** to the first/last day of the school year. (This is for alternate schedule fetching.)

2. Set `ALT_KEY` in **js/utils.js** to a new localStorage key name to store alternate schedules in. It can follow this format: `[gunn-web-app] alts.20xx-xx`.

- You should set `LAST_YEARS_ALT_KEY` in **js/utils.js** to last year's `ALT_KEY` so that it clears the stored alternate schedules.

- **NOTE: You might not want to do this until after the school has released alternate schedules on their Google Calendar**, so it only force updates when it's ready.

3. Update `datePickerRange` in **js/schedule.js** to have the first and last days of the school year. Note that months are zero-indexed here, so August would be `m:7`. (This is for... the date picker range.)

4. Update an if/else statement in the `ugwaifyAlternates` function in **js/schedule.js** to use the new school year's two years.

For example, for the 2054-55 school year, it'd look like

```js
if (month > 6) date = new Date(2054, month - 1, day)
else date = new Date(2055, month - 1, day)
```

This is for determining which year a month-date pair is in. [UGWA stores alternate schedules weirdly.](https://sheeptester.github.io/longer-tweets/ugwa-alt-schedules/)

## Updating Ugwita

Ugwita has been marked as deprecated. However, if you still want to update it,

1. Change `firstDay` and `lastDay` in **lite/data.js**. This is the same as step 1 in the previous section (because UGWA copied from Ugwita).

2. You'll also need to update `startDate` and `endDate` in **lite/main.js**; this is kind of like in step 3 where months are 0 indexed.
