const EARLIEST_AM_HOUR = 6;

const HTMLnewlineRegex = /<\/?(p|div|br).*?>|\),? *(?=[A-Z0-9])/g;
const noHTMLRegex = /<.*?>/g;
const noNbspRegex = /&nbsp;/g;
const timeGetterRegex = /\(?(1?[0-9]):([0-9]{2}) *(?:-|–) *(1?[0-9]):([0-9]{2}) *(pm)?\)?/;
const newLineRegex = /\r?\n/g;
const noNewLineBeforeTimeRegex = /\n\(/g; // hack for 2019-09-06 schedule

const altScheduleRegex = /schedule|extended|lunch/i;
const noSchoolRegex = /holiday|no\sstudents|break|development/i;

function parseAlternate(summary, description) {
  if (altScheduleRegex.test(summary)) {
    if (!description) return undefined;
    description = "\n" + description
      .replace(noNewLineBeforeTimeRegex, '(')
      .replace(HTMLnewlineRegex, "\n")
      .replace(noHTMLRegex, "")
      .replace(noNbspRegex, " ");
    let periods = [];
    description.split(newLineRegex).map(str => {
      let times;
      const name = str.replace(timeGetterRegex, (...matches) => {
        times = matches;
        return '';
      }).trim();

      if (!times) {
        if (periods.length > 0) {
          periods[periods.length - 1].original += "\n" + name;
        }
        return;
      }

      let [, sH, sM, eH, eM, pm] = times;

      sH = +sH; sM = +sM; eH = +eH; eM = +eM;
      if (sH < EARLIEST_AM_HOUR || pm) sH += 12;
      if (eH < EARLIEST_AM_HOUR || pm) eH += 12;
      const startTime = sH * 60 + sM,
      endTime = eH * 60 + eM;

      const duplicatePeriod = periods.findIndex(p => p.start === startTime);
      if (~duplicatePeriod) {
        periods[duplicatePeriod].name += "\n" + name;
        if (endTime > periods[duplicatePeriod].end)
          periods[duplicatePeriod].end = endTime;
      } else {
        // customise your format here
        periods.push({
          name: name,
          start: startTime,
          end: endTime
        });
      }
    });
    return periods;
  } else if (noSchoolRegex.test(summary)) {
    if (description) return undefined;
    return null;
  }
}

function toAlternateSchedules(eventItems, EARLIEST_AM_HOUR = 6) {
  let altSchedules = {};
  for (let i = eventItems.length; i--;) {
    const schedule = parseAlternate(eventItems[i].summary, eventItems[i].description);
    if (schedule === undefined) continue;
    if (eventItems[i].start.date) {
      const dateObj = new Date(eventItems[i].start.date);
      while (dateObj.toISOString().slice(5, 10) !== eventItems[i].end.date.slice(5, 10)) {
        altSchedules[dateObj.toISOString().slice(5, 10)] = schedule;
        dateObj.setUTCDate(dateObj.getUTCDate() + 1);
      }
    } else {
      altSchedules[eventItems[i].start.dateTime.slice(5, 10)] = schedule;
    }
  }
  return altSchedules;
}
