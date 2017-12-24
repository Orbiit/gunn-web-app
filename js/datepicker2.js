const monthNames = {
  "en": ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
},
dayLetters = {
  "en": ["S", "M", "T", "W", "T", "F", "S"]
};
function datePicker2(startDate, endDate, onchange, lang = "en") {
  function dateToMyDate(dateObj) {
    return {
      date: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: dateObj.getFullYear()
    };
  }
  let today = dateToMyDate(new Date()),
  selectedDate = dateToMyDate(new Date()),
  viewingDate = {};
  startDate = dateToMyDate(startDate);
  endDate = dateToMyDate(endDate);

  let wrapper = document.createElement("div"),
  monthSelect = document.createElement("div"),
  dateSelect = document.createElement("div");
  wrapper.classList.add("dp2-wrapper");
  monthSelect.classList.add("dp2-month-select");
  dateSelect.classList.add("dp2-date-select");

  let viewingMonth = document.createElement("span"),
  viewingYear = document.createElement("span");
  viewingMonth.classList.add("dp2-month");
  viewingYear.classList.add("dp2-year");
  monthSelect.appendChild(viewingYear);
  monthSelect.appendChild(viewingMonth);

  function changeMonth(right) {
    let newMonth = viewingDate.month + viewingDate.year * 12 + (right ? 1 : -1),
    lastCalendar = viewingCalendar,
    newerCalendar,
    removeLastCalendar,
    removeClassesFromNewerCalendar;
    setViewingMonth(Math.floor(newMonth / 12), newMonth % 12);
    newerCalendar = viewingCalendar = createCalendar(viewingDate.year, viewingDate.month);
    dateSelect.appendChild(viewingCalendar);
    lastCalendar.classList.add("dp2-leaving");
    lastCalendar.classList.add(right ? "left-out" : "right-out");
    newerCalendar.classList.add("dp2-coming");
    newerCalendar.classList.add(right ? "right-in" : "left-in");
    if (stopAnimationEarlyFn) stopAnimationEarlyFn();
    stopAnimationEarlyFn = () => {
      lastCalendar.addEventListener("animationend", removeLastCalendar, false);
      lastCalendar.addEventListener("animationend", removeClassesFromNewerCalendar, false);
      removeLastCalendar();
      removeClassesFromNewerCalendar();
    }
    removeLastCalendar = e => {
      dateSelect.removeChild(lastCalendar);
      if (e) stopAnimationEarlyFn = null;
    };
    removeClassesFromNewerCalendar = e => {
      newerCalendar.classList.remove("dp2-coming");
      newerCalendar.classList.remove(right ? "right-in" : "left-in");
      if (e) stopAnimationEarlyFn = null;
    };
    lastCalendar.addEventListener("animationend", removeLastCalendar, false);
    lastCalendar.addEventListener("animationend", removeClassesFromNewerCalendar, false);
  }
  let lastMonthBtn = document.createElement("button"),
  nextMonthBtn = document.createElement("button"),
  stopAnimationEarlyFn = null;
  lastMonthBtn.classList.add("dp2-arrow");
  lastMonthBtn.classList.add("dp2-left");
  lastMonthBtn.addEventListener("click", e => {
    changeMonth(false);
  }, false);
  nextMonthBtn.classList.add("dp2-arrow");
  nextMonthBtn.classList.add("dp2-right");
  nextMonthBtn.addEventListener("click", e => {
    changeMonth(true);
  }, false);
  monthSelect.appendChild(lastMonthBtn);
  monthSelect.appendChild(nextMonthBtn);

  let daysBar = document.createElement("div");
  daysBar.classList.add("dp2-days");
  for (let i = 0; i < 7; i++) {
    let day = document.createElement("span");
    day.textContent = dayLetters[lang][i];
    daysBar.appendChild(day);
  }
  dateSelect.appendChild(daysBar);

  function createCalendar(year, month) {
    let isThisMonth = today.month === month && today.year === year,
    monthHasSelected = selectedDate.month === month && selectedDate.year === year,
    nearStartEdge = startDate.month === month && startDate.year === year,
    nearEndEdge = endDate.month === month && endDate.year === year,
    tempDay = new Date(year, month, 1).getDay(),
    days = new Date(year, month, 0).getDate(),
    wrapper = document.createElement("div");
    wrapper.classList.add("dp2-calendar");

    if (tempDay > 0) {
      let dummyDate = document.createElement("span");
      dummyDate.style.width = (tempDay * 36) + "px";
      dummyDate.classList.add("dp2-dummy-date");
      wrapper.appendChild(dummyDate);
    }

    for (let date = 1; date <= days; date++, tempDay++) {
      let dateSpan = document.createElement("span");
      dateSpan.textContent = date;
      if (isThisMonth && today.date === date) dateSpan.classList.add('today');
      if (monthHasSelected && selectedDate.date === date) dateSpan.classList.add('active');
      if (nearStartEdge && startDate.date > date) dateSpan.classList.add('disabled');
      if (nearEndEdge && endDate.date < date) dateSpan.classList.add('disabled');
      wrapper.appendChild(dateSpan);
    }

    if (tempDay < 6) {
      let dummyDate = document.createElement("span");
      dummyDate.style.width = ((7 - tempDay) * 36) + "px";
      dummyDate.classList.add("dp2-dummy-date");
      wrapper.appendChild(dummyDate);
    }
    return wrapper;
  }
  dateSelect.addEventListener("click", e => {
    if (e.target.tagName === 'SPAN'
        && !e.target.classList.contains('dp2-dummy-date')
        && e.target.parentNode.classList.contains('dp2-calendar')) {
      selectedDate = {
        date: +e.target.textContent,
        month: viewingDate.month,
        year: viewingDate.year
      };
      dateSelect.removeChild(viewingCalendar);
      viewingCalendar = createCalendar(viewingDate.year, viewingDate.month);
      dateSelect.appendChild(viewingCalendar);
      onchange(selectedDate);
    }
  }, false);

  function setViewingMonth(year, month) {
    viewingMonth.textContent = monthNames[lang][month];
    viewingYear.textContent = year;
    lastMonthBtn.disabled = month + year * 12 === startDate.month + startDate.year * 12;
    nextMonthBtn.disabled = month + year * 12 === endDate.month + endDate.year * 12;
    viewingDate = {year: year, month: month};
  }
  setViewingMonth(today.year, today.month);

  let viewingCalendar = createCalendar(viewingDate.year, viewingDate.month);
  dateSelect.appendChild(viewingCalendar);

  wrapper.appendChild(monthSelect);
  wrapper.appendChild(dateSelect);
  document.body.appendChild(wrapper);

  const returnVal = {
    getDate() {
      return selectedDate;
    },
    setDate(year, month, date) {
      let validatedDate = new Date(year, month, date);
      year = validatedDate.getFullYear();
      month = validatedDate.getMonth();
      date = validatedDate.getDate();
      viewingMonth.textContent = monthNames[lang][month];
      viewingYear.textContent = year;
      selectedDate = {
        year: year,
        month: month,
        date: date
      };
      return this;
    }
  };
  return returnVal;
}
