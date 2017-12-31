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
function generateScheduleHTML(year, month, date) { // 0-indexed months
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

try {
  window.storage = localStorage;
} catch (e) {
  window.storage = {
    getItem: a => storage[a],
    setItem: (a, b) => storage[a] = b,
    removeItem: a => delete storage[a]
  }
}

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
if (storage.getItem("[gunn-web-app] lite.offline") === "on") {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register('sw.js').then(regis => {
        console.log('MUAHAHAHAHA I REGISTERED THE SERVICE WORKER! THE SCOPE IS:', regis.scope);
      }, err => {
        console.log(':( couldnt register service worker', err);
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", e => {
  let scheduleWrapper = document.getElementById("schedule"),
  offlineCheckbox = document.getElementById("offline"),
  themeCheckbox = document.getElementById("theme"),
  timeLeft = document.getElementById("timeleft"),

  today = new Date(2017, 11, 18);
  today = {
    obj: today,
    year: today.getFullYear(),
    month: today.getMonth(),
    date: today.getDate(),
    day: today.getDay()
  };
  today.dateString = ("0" + (today.month + 1)).slice(-2) + "-" + ("0" + today.date).slice(-2);
  today.schedule = alternateSchedules[today.dateString] || normalSchedules[today.day];

  document.getElementById("refreshalts").addEventListener("click", refreshAlts, false);
  scheduleWrapper.innerHTML = generateScheduleHTML(today.year, today.month, today.date);
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
}, false);
