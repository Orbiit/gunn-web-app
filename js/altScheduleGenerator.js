function toAlternateSchedules(eventItems, EARLIEST_AM_HOUR = 6) {
  let altSchedules = {};
  for (let i = eventItems.length; i--;) {
    if (/(schedule|extended)/i.test(eventItems[i].summary)) {
      if (!eventItems[i].description) continue;
      let periodItems = eventItems[i].description.split(/\r?\n/).filter(a => a),
      periods = [];
      for (let i = 0, lastString = ""; i < periodItems.length; i++) {
        let period = periodItems[i],
        times = /([0-9]+):([0-9]+)-([0-9]+):([0-9]+)/
          .exec(period.slice(period.lastIndexOf("(") + 1, period.lastIndexOf(")")));
        if (times === null) {
          lastString = period + "\n";
        } else {
          times = times.slice(1).map(Number);
          if (times[0] < EARLIEST_AM_HOUR) times[0] += 12;
          if (times[2] < EARLIEST_AM_HOUR) times[2] += 12;
          periods.push({
            name: lastString + period.slice(0, period.lastIndexOf(" (")),
            start: times[0] * 60 + times[1],
            end: times[2] * 60 + times[3]
          });
          lastString = "";
        }
      }
      altSchedules[(eventItems[i].start.date || eventItems[i].start.dateTime).slice(5, 10)] = periods;
    } else if (/(holiday|no\sstudents|break)/i.test(eventItems[i].summary)) {
      altSchedules[(eventItems[i].start.date || eventItems[i].start.dateTime).slice(5, 10)] = null;
    }
  }
  return altSchedules;
}
