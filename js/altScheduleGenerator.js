function toAlternateSchedules(eventItems, EARLIEST_AM_HOUR = 6) {
  let altSchedules = {};
  for (let i = eventItems.length; i--;) {
    if (/(schedule|extended)/i.test(eventItems[i].summary)) {
      if (!eventItems[i].description) continue;
      let periodItems = eventItems[i].description.replace(/<p>(.*?)<\/p>/g,"$1\n").replace(/<\/?[a-z]>/gi, "").replace(/&nbsp;/g, " ").replace(/(\).*?),(.*?\()/g, "$1\n$2").split(/\r?\n/),
      periods = [];
      for (let i = 0; i < periodItems.length; i++) {
        let period = periodItems[i],
        matches = /(.*?)\(?(1?[0-9]):([0-9]{2})-(1?[0-9]):([0-9]{2})\)?/g.exec(period);
        if (!period.trim()) continue;
        if (matches) {
          let times = matches.slice(2, 6).map(Number);
          if (times[0] < EARLIEST_AM_HOUR) times[0] += 12;
          let startTime = times[0] * 60 + times[1],
              periodName = matches[1].trim().replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;"),
              foundDuplicate = false,
              j;
          for (j = 0; j < periods.length; j++) {
            if (periods[j].start === startTime) {
              foundDuplicate = true;
              break;
            }
          }
          if (foundDuplicate) {
            periods[j].name += periodName;
          } else {
            if (times[2] < EARLIEST_AM_HOUR) times[2] += 12;
            periods.push({
              name: periodName,
              start: startTime,
              end: times[2] * 60 + times[3]
            });
          }
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
