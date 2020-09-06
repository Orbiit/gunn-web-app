import {
  normalSchedules,
  firstDay,
  lastDay,
  keywords,
  monthNames,
  dayNames,
  legalHashDateRegex
} from './data.js';
import { toAlternateSchedules } from '../js/altScheduleGenerator.js?for=ugwita';

const calendarURL = "https://www.googleapis.com/calendar/v3/calendars/"
  + encodeURIComponent("fg978mo762lqm6get2ubiab0mk0f6m2c@import.calendar.google.com")
  + "/events?singleEvents=true&fields="
  + encodeURIComponent("items(description,end(date,dateTime),start(date,dateTime),summary)")
  + "&key=AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o";

function ajax(url, callback, error = () => {}) {
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = () => {
    if (xmlHttp.readyState === 4) {
      xmlHttp.status === 200 ? callback(xmlHttp.responseText) : error(xmlHttp.responseText, xmlHttp.status);
    }
  };
  xmlHttp.open("GET", url, true);
  xmlHttp.send(null);
}
function refreshAlts() {
  getAlternateSchedules(alts => {
    const today = new Date();
    alts.lastGenerated = [today.getFullYear(), today.getMonth(), today.getDate()];
    storage.setItem("[gunn-web-app] lite.alts20-21", JSON.stringify(alts));
    if (window.location.search === '?genalts') window.location.replace('../');
    else window.location.reload();
  });
}
function getAlternateSchedules(callback) {
  Promise.all(keywords.map(keyword => fetch(calendarURL
      + `&timeMin=${encodeURIComponent(firstDay)}&timeMax=${encodeURIComponent(lastDay)}&q=${keyword}`)
    .then(res => res.json())))
  .then(results => {
    let alternateSchedules = {};
    results.slice(1).forEach(events => Object.assign(alternateSchedules, toAlternateSchedules(events.items)));
    const selfDays = results[0].items
      .filter(day => day.summary.includes('SELF'))
      .map(day => (day.start.dateTime || day.start.date).slice(5, 10));
    alternateSchedules.self = selfDays;
    callback(alternateSchedules);
  });
}
function toTrumpTimeFormat(minutes) {
  let hour = Math.floor(minutes / 60);
  return `${(hour + 11) % 12 + 1}:${("0" + (minutes % 60)).slice(-2)} ${hour < 12 ? "a" : "p"}m`;
}
function minutesToMixedDuration(minutes) {
  return `${Math.floor(minutes / 60)}:${("0" + (minutes % 60)).slice(-2)}`;
}
function toEnglishDuration(totalMinutes) {
  if (totalMinutes === 0) return "0 minutes";
  let hours = Math.floor(totalMinutes / 60),
  minutes = totalMinutes % 60,
  minutesString = minutes === 1 ? "a minute" : minutes + " minutes",
  hoursString = hours === 1 ? "an hour" : hours + " hours";
  if (hours === 0) return minutesString;
  if (minutes === 0) return hoursString;
  return hoursString + " and " + minutesString;
}
function generateScheduleHTML(year, month, date) { // 0-indexed months, not validated
  let innerHTML = "",
  dateString = ("0" + (month + 1)).slice(-2) + "-" + ("0" + date).slice(-2),
  day = new Date(year, month, date).getDay(),
  schedule = alternateSchedules[dateString];
  innerHTML += `<h1>${monthNames[month]} ${date}, ${year}</h1><h2>${dayNames[day]}</h2>`;
  if (schedule !== undefined) innerHTML += `<p>Today follows an alternate schedule:</p>`;
  else schedule = normalSchedules[day];
  if (schedule !== null) {
    innerHTML += `<table><tr><th>Period name</th><th>Time range</th><th>Length</th></tr>`;
    for (let i = 0; i < schedule.length; i++) {
      innerHTML += `<tr><td>${schedule[i].name}</td>`;
      innerHTML += `<td>${toTrumpTimeFormat(schedule[i].start)} &ndash; ${toTrumpTimeFormat(schedule[i].end)}</td>`;
      innerHTML += `<td>${minutesToMixedDuration(schedule[i].end - schedule[i].start)}</td></tr>`;
    }
    innerHTML += `</table>`; // <p>Day ends today at ${toTrumpTimeFormat(schedule[schedule.length - 1].end)}.</p>
  } else {
    innerHTML += `<p>No school today!</p>`
  }
  return innerHTML;
}
function getTimeLeft(timeLeftElem, schedule, setTitle) {
  if (!schedule) {
    if (setTitle) document.title = 'No school today - Ugwita';
    timeLeftElem.innerHTML = "";
    return false;
  }
  const now = new Date(),
  totalMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < schedule.length; i++) {
    if (totalMinutes < schedule[i].end) {
      if (totalMinutes < schedule[i].start) {
        const duration = toEnglishDuration(schedule[i].start - totalMinutes);
        if (setTitle) document.title = `${schedule[i].name} in ${duration} - Ugwita`;
        timeLeftElem.innerHTML = `<strong>${schedule[i].name}</strong> starting in ${duration}.`;
        return schedule[i].start - totalMinutes === 1;
      } else {
        const percentage = Math.round((totalMinutes - schedule[i].start) / (schedule[i].end - schedule[i].start) * 100);
        const duration = toEnglishDuration(schedule[i].end - totalMinutes);
        if (setTitle) document.title = `${duration} left - Ugwita`;
        timeLeftElem.innerHTML = `<strong>${schedule[i].name}</strong> ending in ${duration}. (${percentage}%)`;
        return schedule[i].end - totalMinutes === 1;
      }
    }
  }
  if (setTitle) document.title = 'UGWA Lite';
  timeLeftElem.innerHTML = `<strong>${schedule[schedule.length - 1].name}</strong> ended ${toEnglishDuration(totalMinutes - schedule[schedule.length - 1].end)} ago.`;
  return false;
}
function offsetDate(myDateObj, offset) {
  let dateObj = new Date(myDateObj.year, myDateObj.month, myDateObj.date + offset);
  return {year: dateObj.getFullYear(), month: dateObj.getMonth(), date: dateObj.getDate()};
}

try {
  window.storage = localStorage;
} catch (e) {
  window.storage = {
    getItem: a => storage[a],
    setItem: (a, b) => storage[a] = b,
    removeItem: a => delete storage[a]
  }
}

if (window.location.search === '?genalts') refreshAlts();

const startDate = {year: 2020, month: 7, date: 17},
endDate = {year: 2021, month: 5, date: 3};

let alternateSchedules;
try {
  alternateSchedules = JSON.parse(storage.getItem("[gunn-web-app] lite.alts20-21") || false);
} catch (e) {
  storage.setItem("[gunn-web-app] lite.alts20-21", "");
  alternateSchedules = {};
}
if (!storage.getItem("[gunn-web-app] lite.alts20-21") || !alternateSchedules.lastGenerated
    || Date.now() - new Date(...alternateSchedules.lastGenerated).getTime() > 2592000000) { // 30 days
  refreshAlts();
}
if ("serviceWorker" in navigator) {
  if (storage.getItem("[gunn-web-app] lite.offline") === "on") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register('sw.js').then(regis => {
        regis.onupdatefound = () => {
          const installingWorker = regis.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('new update! redirecting away and back...');
              window.location.replace('../lite-updater.html');
            }
          };
        };
      }, err => {
        console.log(':( couldnt register service worker', err);
      });
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('service worker version ' + event.data);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations()
      .then(regis => regis.map(regis => regis.unregister()))
      .catch(err => console.log(err));
  }
}

document.addEventListener("DOMContentLoaded", e => {
  function updateCalendar() {
    scheduleWrapper.innerHTML = generateScheduleHTML(viewingDate.year, viewingDate.month, viewingDate.date);
    // window.location.hash = `${viewingDate.year}-${("0" + (viewingDate.month + 1)).slice(-2)}-${("0" + viewingDate.date).slice(-2)}`;
  }
  let scheduleWrapper = document.getElementById("schedule"),
  offlineCheckbox = document.getElementById("offline"),
  themeCheckbox = document.getElementById("theme"),
  timeLeft = document.getElementById("timeleft"),
  yesterday = document.getElementById("yesterday"),
  todayBtn = document.getElementById("today"),
  tomorrow = document.getElementById("tomorrow"),
  notes = document.getElementById("notesinput"),

  daySelectOpen = document.getElementById("dateselect"),
  daySelectWrapper = document.getElementById("dateselectwrapper"),
  daySelectCancel = document.getElementById("dateselectcancel"),
  monthSelect = document.getElementById("monthselect"),
  monthDone = document.getElementById("monthselectdone"),
  dateSelect = document.getElementById("dateinput"),
  dateDone = document.getElementById("dateinputdone"),
  dateError = document.getElementById("dateinputerror"),

  viewingDate,
  today = setToday(),
  countingSeconds = false;

  function setToday() {
    const today = new Date();
    const obj = {
      obj: today,
      year: today.getFullYear(),
      month: today.getMonth(),
      date: today.getDate(),
      day: today.getDay()
    };
    obj.dateString = ("0" + (obj.month + 1)).slice(-2) + "-" + ("0" + obj.date).slice(-2);
    obj.schedule = alternateSchedules[obj.dateString];
    if (obj.schedule === undefined) obj.schedule = normalSchedules[obj.day];
    viewToday(obj);
    return obj;
  }
  function viewToday(todayObj) {
    viewingDate = {year: todayObj.year, month: todayObj.month, date: todayObj.date};
    updateCalendar();
  }

  document.getElementById("refreshalts").addEventListener("click", refreshAlts, false);
  const loop = () => {
    const oneMinuteLeft = getTimeLeft(timeLeft, today.schedule, !countingSeconds);
    if (oneMinuteLeft) {
      if (!countingSeconds) {
        countingSeconds = true;
        let lastSecond = null;
        let interval = setInterval(() => {
          if (countingSeconds) {
            const secondsLeft = 60 - Date.now() % 60000 / 1000;
            if (lastSecond !== null && secondsLeft > lastSecond) {
              countingSeconds = false;
              loop();
            } else {
              lastSecond = secondsLeft;
              document.title = `${secondsLeft.toFixed(3)} second${secondsLeft === 1 ? '' : 's'} left - Ugwita`;
              return;
            }
          } else {
            countingSeconds = false;
          }
          clearInterval(interval);
        }, 100);
      }
    } else if (countingSeconds) {
      countingSeconds = false;
    }
    if (today.day !== new Date().getDay()) today = setToday();
  };
  setInterval(loop, 5000);
  loop();

  if (storage.getItem("[gunn-web-app] lite.offline") === "on") offlineCheckbox.checked = true;
  offlineCheckbox.addEventListener("click", e => {
    storage.setItem(
      "[gunn-web-app] lite.offline",
      storage.getItem("[gunn-web-app] lite.offline") === "on" ? "off" : "on"
    );
    window.location.reload();
  }, false);

  if (storage.getItem("global.theme") === "dark") {
    themeCheckbox.checked = true;
    document.body.classList.add("dark");
  }
  else storage.setItem("global.theme", "light");
  themeCheckbox.addEventListener("click", e => {
    if (themeCheckbox.checked) {
      storage.setItem("global.theme", "dark");
      document.body.classList.add("dark");
    } else {
      storage.setItem("global.theme", "light");
      document.body.classList.remove("dark");
    }
  }, false);

  yesterday.addEventListener("click", e => {
    viewingDate = offsetDate(viewingDate, -1);
    updateCalendar();
  }, false);
  todayBtn.addEventListener("click", e => {
    viewToday(today);
  }, false);
  tomorrow.addEventListener("click", e => {
    viewingDate = offsetDate(viewingDate, 1);
    updateCalendar();
  }, false);

  let monthItems = document.createDocumentFragment();
  for (let month = startDate.month, year = startDate.year; month <= endDate.month || year <= startDate.year; month++) {
    if (month >= monthNames.length) month = 0, year++;
    let monthItem = document.createElement("option");
    monthItem.textContent = monthNames[month] + " " + year;
    monthItems.appendChild(monthItem);
  }
  monthSelect.appendChild(monthItems);

  daySelectWrapper.style.display = "none";
  daySelectOpen.addEventListener("click", e => {
    daySelectWrapper.style.display = "table";
    monthSelect.disabled = monthDone.disabled = false;
    dateSelect.disabled = dateDone.disabled = true;
    dateSelect.value = "";
    dateError.textContent = "";
  }, false);
  daySelectCancel.addEventListener("click", e => {
    daySelectWrapper.style.display = "none";
  }, false);
  monthDone.addEventListener("click", e => {
    monthSelect.disabled = monthDone.disabled = true;
    dateSelect.disabled = dateDone.disabled = false;
    dateSelect.max = new Date(
      +monthSelect.value.slice(monthSelect.value.indexOf(" ") + 1),
      monthNames.indexOf(monthSelect.value.slice(0, monthSelect.value.indexOf(" "))) + 1,
      0
    ).getDate();
  }, false);
  dateDone.addEventListener("click", e => {
    if (/[^0-9]/.test(dateSelect.value)) dateError.textContent = "not a positive integer";
    else if (+dateSelect.value < 1 || +dateSelect.value > +dateSelect.max) dateError.textContent = "out of range";
    else {
      daySelectWrapper.style.display = "none";
      viewingDate.year = +monthSelect.value.slice(monthSelect.value.indexOf(" ") + 1);
      viewingDate.month = monthNames.indexOf(monthSelect.value.slice(0, monthSelect.value.indexOf(" ")));
      viewingDate.date = +dateSelect.value;
      updateCalendar();
    }
  }, false);

  notes.value = storage.getItem("[gunn-web-app] lite.notes") || "";
  notes.addEventListener("input", e => {
    storage.setItem("[gunn-web-app] lite.notes", notes.value);
  }, false);
  window.addEventListener("storage", e => {
    notes.value = storage.getItem("[gunn-web-app] lite.notes") || "";
  }, false);

  function viewingDateFromHash() {
    if (legalHashDateRegex.test(window.location.hash)) {
      const [year, month, date] = window.location.hash.slice(1).split('-').map(Number);
      if (year === viewingDate.year && month - 1 === viewingDate.month && date === viewingDate.date) return;
      viewingDate = offsetDate({year: year, month: month - 1, date: date}, 0);
      updateCalendar();
    }
  }
  window.addEventListener("hashchange", viewingDateFromHash, false);
  viewingDateFromHash();
}, false);
