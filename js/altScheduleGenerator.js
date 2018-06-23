const EARLIEST_AM_HOUR = 6;

const HTMLnewlineRegex = /<(p|div).*?>/g;
const noHTMLRegex = /<.*?>/g;
const noNbspRegex = /&nbsp;/g;
const parserRegex = /(?:\n|,|\))(.*?)\(?(1?[0-9]):([0-9]{2})-(1?[0-9]):([0-9]{2})(?=\))?/g;

function parseAlternate(summary, description) {
  if (/(schedule|extended)/i.test(summary)) {
    if (!description) return undefined;
    description = "\n" + description.replace(HTMLnewlineRegex, "\n").replace(noHTMLRegex, "").replace(noNbspRegex, " ");
    let periods = [];
    description.replace(parserRegex, (m, name, sH, sM, eH, eM) => {
      name = name.trim();
      if (!name) return;

      sH = +sH; sM = +sM; eH = +eH; eM = +eM;
      if (sH < EARLIEST_AM_HOUR) sH += 12;
      if (eH < EARLIEST_AM_HOUR) eH += 12;
      let startTime = sH * 60 + sM,
      endTime = eH * 60 + eM;

      let duplicatePeriod = periods.findIndex(p => p.start === startTime);
      if (~duplicatePeriod) {
        periods[duplicatePeriod].original += "\n" + name;
      } else {
        periods.push({
          name: name,
          start: startTime,
          end: endTime
        });
      }
    });
    return periods;
  } else if (/(holiday|no\sstudents|break)/i.test(summary)) {
    return null;
  }
}

function toAlternateSchedules(eventItems, EARLIEST_AM_HOUR = 6) {
  let altSchedules = {};
  for (let i = eventItems.length; i--;) {
    altSchedules[(eventItems[i].start.date || eventItems[i].start.dateTime).slice(5, 10)]
      = parseAlternate(eventItems[i].summary, eventItems[i].description);
  }
  return altSchedules;
}
