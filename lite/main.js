'use strict';

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
    alternateSchedules = alts;
    storage.setItem("[gunn-web-app] lite.alts", JSON.stringify(alts));
  });
}
function getAlternateSchedules(callback) {
  let done = 0,
  alternateSchedules = {};
  for (let i = 0; i < times.length - 1; i++) {
    ajax(
      "https://www.googleapis.com/calendar/v3/calendars/u5mgb2vlddfj70d7frf3r015h0%40group.calendar.google.com/events"
        + "?singleEvents=true&timeMax="
        + times[i + 1]
        + "&timeMin="
        + times[i]
        + "&fields=items(description%2Cend(date%2CdateTime)%2CiCalUID%2Clocation%2Cstart(date%2CdateTime)%2Csummary)"
        + "&key=AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o",
      json => {
        done++;
        Object.assign(alternateSchedules, toAlternateSchedules(JSON.parse(json).items));
        if (done === times.length - 1) callback(alternateSchedules);
      }
    );
  }
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
  if (schedule !== undefined) innerHTML += `<p><em>Today follows an alternate schedule:</em></p>`;
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
function getTimeLeft(schedule) {
  if (!schedule) return "";
  let now = new Date(),
  totalMinutes = now.getHours() * 60 + now.getMinutes();
  for (let i = 0; i < schedule.length; i++) {
    if (totalMinutes < schedule[i].end) {
      if (totalMinutes < schedule[i].start) {
        return `<strong>${schedule[i].name}</strong> starting in ${toEnglishDuration(schedule[i].start - totalMinutes)}.`;
      } else {
        let percentage = Math.round((totalMinutes - schedule[i].start) / (schedule[i].end - schedule[i].start) * 100);
        return `<strong>${schedule[i].name}</strong> ending in ${toEnglishDuration(schedule[i].end - totalMinutes)}. (${percentage}%)`;
      }
    }
  }
  return `<strong>${schedule[schedule.length - 1].name}</strong> ended ${toEnglishDuration(totalMinutes - schedule[schedule.length - 1].end)} ago.`;
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

const startDate = {year: 2017, month: 7, date: 14},
endDate = {year: 2018, month: 5, date: 1};

let alternateSchedules;
try {
  alternateSchedules = JSON.parse(storage.getItem("[gunn-web-app] lite.alts") || false);
} catch (e) {
  storage.setItem("[gunn-web-app] lite.alts", "");
  alternateSchedules = {};
}
if (!storage.getItem("[gunn-web-app] lite.alts")) {
  refreshAlts();
}
if ("serviceWorker" in navigator) {
  if (storage.getItem("[gunn-web-app] lite.offline") === "on") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register('sw.js').then(regis => {
        console.log('MUAHAHAHAHA I REGISTERED THE SERVICE WORKER! THE SCOPE IS:', regis.scope);
      }, err => {
        console.log(':( couldnt register service worker', err);
      });
    });
  } else {
    navigator.serviceWorker.getRegistrations().then(regis => regis.map(regis => regis.unregister()));
  }
}

document.addEventListener("DOMContentLoaded", e => {
  function updateCalendar() {
    scheduleWrapper.innerHTML = generateScheduleHTML(viewingDate.year, viewingDate.month, viewingDate.date);
  }
  let scheduleWrapper = document.getElementById("schedule"),
  offlineCheckbox = document.getElementById("offline"),
  themeCheckbox = document.getElementById("theme"),
  timeLeft = document.getElementById("timeleft"),
  yesterday = document.getElementById("yesterday"),
  tomorrow = document.getElementById("tomorrow"),

  daySelectOpen = document.getElementById("dateselect"),
  daySelectWrapper = document.getElementById("dateselectwrapper"),
  daySelectCancel = document.getElementById("dateselectcancel"),
  monthSelect = document.getElementById("monthselect"),
  monthDone = document.getElementById("monthselectdone"),
  dateSelect = document.getElementById("dateinput"),
  dateDone = document.getElementById("dateinputdone"),
  dateError = document.getElementById("dateinputerror"),

  viewingDate,
  today = new Date();
  today = {
    obj: today,
    year: today.getFullYear(),
    month: today.getMonth(),
    date: today.getDate(),
    day: today.getDay()
  };
  today.dateString = ("0" + (today.month + 1)).slice(-2) + "-" + ("0" + today.date).slice(-2);
  today.schedule = alternateSchedules[today.dateString] || normalSchedules[today.day];
  viewingDate = {year: today.year, month: today.month, date: today.date};

  document.getElementById("refreshalts").addEventListener("click", refreshAlts, false);
  updateCalendar();
  timeLeft.innerHTML = getTimeLeft(today.schedule);
  setInterval(() => {
    timeLeft.innerHTML = getTimeLeft(today.schedule);
  }, 5000);

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
}, false);
