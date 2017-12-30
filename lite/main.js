'use strict';

try {
  window.storage = localStorage;
} catch (e) {
  window.storage = {
    getItem: a => storage[a],
    setItem: (a, b) => storage[a] = b,
    removeItem: a => delete storage[a]
  }
}

const normalSchedules = [
  null,
  [
    {name: "Period A", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 600},
    {name: "Period B", start: 600, end: 675},
    {name: "Period C", start: 685, end: 760},
    {name: "Lunch", start: 760, end: 800},
    {name: "Period F", start: 800, end: 875}
  ], [
    {name: "Period D", start: 505, end: 585},
    {name: "Brunch", start: 585, end: 600},
    {name: "FlexTime", start: 600, end: 650},
    {name: "Period E", start: 660, end: 735},
    {name: "Lunch", start: 735, end: 775},
    {name: "Period A", start: 775, end: 855},
    {name: "Period G", start: 865, end: 940}
  ], [
    {name: "Period B", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 605},
    {name: "Period C", start: 605, end: 685},
    {name: "Period D", start: 695, end: 775},
    {name: "Lunch", start: 775, end: 815},
    {name: "Period F", start: 815, end: 895}
  ], [
    {name: "Period E", start: 505, end: 590},
    {name: "Brunch", start: 590, end: 605},
    {name: "FlexTime", start: 605, end: 655},
    {name: "Period B", start: 665, end: 735},
    {name: "Lunch", start: 735, end: 775},
    {name: "Period A", start: 775, end: 845},
    {name: "Period G", start: 855, end: 935}
  ], [
    {name: "Period C", start: 505, end: 580},
    {name: "Brunch", start: 580, end: 595},
    {name: "Period D", start: 595, end: 665},
    {name: "Period E", start: 675, end: 745},
    {name: "Lunch", start: 745, end: 785},
    {name: "Period F", start: 785, end: 855},
    {name: "Period G", start: 865, end: 935}
  ],
  null
],
times = [
  "2017-08-14T00%3A00%3A00.000-07%3A00",
  "2017-09-01T00%3A00%3A00.000-07%3A00",
  "2017-10-01T00%3A00%3A00.000-07%3A00",
  "2017-11-01T00%3A00%3A00.000-07%3A00",
  "2017-12-01T00%3A00%3A00.000-07%3A00",
  "2018-01-01T00%3A00%3A00.000-07%3A00",
  "2018-02-01T00%3A00%3A00.000-07%3A00",
  "2018-03-01T00%3A00%3A00.000-07%3A00",
  "2018-04-01T00%3A00%3A00.000-07%3A00",
  "2018-05-01T00%3A00%3A00.000-07%3A00",
  "2018-06-01T23%3A59%3A59.999-07%3A00"
],
monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
    innerHTML += `</table><p>Day ends today at ${toTrumpTimeFormat(schedule[schedule.length - 1].end)}.</p>`;
  } else {
    innerHTML += `<p>No school today!</p>`
  }
  return innerHTML;
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

document.addEventListener("DOMContentLoaded", e => {
  let scheduleWrapper = document.getElementById("schedule"),
  today = new Date();
  today = {
    obj: today,
    year: today.getFullYear(),
    month: today.getMonth(),
    date: today.getDate(),
    day: today.getDay()
  };
  document.getElementById("refreshalts").addEventListener("click", refreshAlts, false);
  scheduleWrapper.innerHTML = generateScheduleHTML(2017, 11, 18);
}, false);
