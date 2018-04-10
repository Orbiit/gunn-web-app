function toAlternateSchedules(eventItems, EARLIEST_AM_HOUR = 6) {
  let altSchedules = {};
  function decodeHTMLEntities(string) { // vulnerable to XSS
    let span = document.createElement("span");
    span.innerHTML = string;
    return span.textContent;
  }
  for (let i = eventItems.length; i--;) {
    if (/(schedule|extended)/i.test(eventItems[i].summary)) {
      if (!eventItems[i].description) continue;
      let periodItems = eventItems[i].description.replace(/<p>(.*?)<\/p>/g,"$1\n").split(/\r?\n/),
      periods = [];
      for (let i = 0; i < periodItems.length; i++) {
        let period = periodItems[i],
        matches = /(.*?)\(?(1?[0-9]):([0-9]{2})-(1?[0-9]):([0-9]{2})\)?/g.exec(period);
        if (!decodeHTMLEntities(period).trim()) continue;
        if (matches) {
          let times = matches.slice(2, 6).map(Number);
          if (+times[0] < EARLIEST_AM_HOUR) times[0] += 12;
          if (+times[2] < EARLIEST_AM_HOUR) times[2] += 12;
          periods.push({
            name: matches[1].trim().replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"),
            start: times[0] * 60 + times[1],
            end: times[2] * 60 + times[3]
          });
        } else if (periods.length > 0) {
          periods[periods.length - 1].name += periodItems[i].trim().replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
        }
      }
      altSchedules[(eventItems[i].start.date || eventItems[i].start.dateTime).slice(5, 10)] = periods;
    } else if (/(holiday|no\sstudents|break)/i.test(eventItems[i].summary)) {
      altSchedules[(eventItems[i].start.date || eventItems[i].start.dateTime).slice(5, 10)] = null;
    }
  }
  return altSchedules;
}
