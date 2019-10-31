let days, months;

function localizeTime(id, params = {}) {
    let entry = localize(id, 'times');
    if (typeof entry === 'function') {
        return entry(params);
    } else {
        entry = entry + '';
        Object.keys(params).forEach(id => {
            entry = entry.replace(`{${id}}`, params[id]);
        });
        return entry;
    }
}

const colorToy = document.createElement("div");

function getFontColour(colour) {
    colorToy.style.backgroundColor = colour;
    colour = colorToy.style.backgroundColor;
    colour = colour.slice(colour.indexOf('(') + 1, colour.indexOf(')')).split(/,\s*/).map(a => +a);
    // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    return Math.round(((parseInt(colour[0]) * 299) + (parseInt(colour[1]) * 587) + (parseInt(colour[2]) * 114)) / 1000) > 150 ? 'rgba(0,0,0,0.8)' : 'white';
}

function scheduleApp(options = {}) {
    let elem, container = document.createElement("div");
    if (options.element) elem = options.element;
    else elem = document.createElement("div");
    container.classList.add('schedule-container');
    if (!options.alternates) options.alternates = {};
    if (!options.periods) options.periods = {};
    if (!options.normal) options.normal = {};

    function getPeriod(name) {
        return options.periods[name] || {label: name, colour: "#000"};
    }

    function getHumanTime(messyTime) {
        const hr = +messyTime.slice(0, 2) % 24;
        if (options.h0Joke) return +messyTime.slice(2) + '';
        else if (options.h24) return `${hr}:${messyTime.slice(2)}`;
        else return `${(hr - 1) % 12 + 1}:${messyTime.slice(2)}${hr < 12 ? 'a' : 'p'}m`;
    }

    function getCSS(colour, id) {
        if (colour[0] === '#') {
            return `background-color:${colour};color:${getFontColour(colour)};`;
        } else {
            return `background-image: url('./.period-images/${id}?${encodeURIComponent(colour)}'); color: white; text-shadow: 0 0 10px black;`
        }
    }

    function getUsefulTimePhrase(minutes) {
        if (options.compact) return `${Math.floor(minutes / 60)}:${('0' + minutes % 60).slice(-2)}`;
        else return localizeTime('duration', {T: minutes});
    }

    function getPeriodSpan(period) {
        return `<span style="${getCSS(getPeriod(period).colour, period)}" class="schedule-endinginperiod">${escapeHTML(getPeriod(period).label)}</span>`;
    }

    function isSELFDay(month, date) {
        return options.self && options.selfDays.includes(('0' + (month + 1)).slice(-2) + '-' + ('0' + date).slice(-2));
    }

    getFontColour('rgba(0,0,0,0.2)');
    let setTitle = false;
    const dayToPrime = {1: 2, 2: 3, 3: 5, 4: 7, 5: 11};

    function getSchedule(d, includeZero = options.show0) {
        const ano = d.getFullYear(), mez = d.getMonth(), dia = d.getDate(), weekday = d.getDay();
        let alternate = false, summer = false;
        let isSELF = isSELFDay(mez, dia);
        let periods;

        function getPeriodName(index) {
            return periods[index].name === 'Flex' && isSELF ? 'SELF' : periods[index].name;
        }

        if (options.customSchedule) periods = options.customSchedule(d, ano, mez, dia, weekday);
        if (periods) periods = periods.slice();
        else if (options.isSummer && options.isSummer(ano, mez, dia)) {
            summer = true;
            periods = [];
        } else if (options.alternates[(mez + 1) + '-' + dia]) {
            let sched = options.alternates[(mez + 1) + '-' + dia];
            alternate = sched;
            periods = sched.periods.slice();
        } else if (options.normal[weekday] && options.normal[weekday].length) {
            periods = options.normal[weekday].slice();
        } else periods = [];
        if (periods.length) {
            if (options.hPeriods[weekday]) {
                const [start, end] = options.hPeriods[weekday];
                periods.push({
                    name: 'H',
                    start: {hour: Math.floor(start / 60), minute: start % 60, totalminutes: start},
                    end: {hour: Math.floor(end / 60), minute: end % 60, totalminutes: end}
                });
            }
            if (includeZero) {
                if (getSchedule(new Date(ano, mez, dia - 1), false).periods.length) {
                    periods.unshift(options.show0);
                }
            }
        }
        // putting this after it checks if the day is a school day because
        // you can have all day prep and still have H period on that day, maybe
        if (options.hidePreps) {
            periods = periods.filter(({name}) => !getPeriod(name).label.toLowerCase().includes('prep'));
        }
        return {
            periods,
            alternate,
            summer,
            getPeriodName,
            isSELF,
            date: {ano, mez, dia, weekday}
        };
    }

    function generateDay(offset = 0) {
      let period;
      let d = new Date(), innerHTML, day, checkFuture = true, totalMinute = d.getMinutes() + d.getHours() * 60;
      if (offset !== 0) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset), checkFuture = false;
        const {
            periods,
            alternate,
            summer,
            getPeriodName,
            isSELF,
            date: {ano, mez, dia, weekday}
        } = getSchedule(d);
        day = days[weekday];
        innerHTML = `<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date"><a class="totally-not-a-link" href="?date=${`${ano}-${mez + 1}-${dia}`}">${localizeTime('date', {
            M: months[mez],
            D: dia
        })}</a></h3>`;
        const assignments = options.getAssignments(d);
        if (assignments.noPeriod) {
            innerHTML += assignments.noPeriod;
        }
        if (summer) return innerHTML + `<span class="schedule-noschool">${localize("summer")}</span>`;
        if (alternate) {
            innerHTML += `<span class="schedule-alternatemsg">${localize('before-alt-msg')}<strong>${alternate.description}</strong>${localize('after-alt-msg')}</span>`;
        }
        if (periods.length) {
            innerHTML += `<span class="schedule-end">${localizeTime('end-time', {
                T: `<strong>${getHumanTime(('0' + periods[periods.length - 1].end.hour).slice(-2) + ('0' + periods[periods.length - 1].end.minute).slice(-2))}</strong>`
            })}</span>`;
            if (checkFuture) {
                for (var i = 0; i < periods.length; i++) if (totalMinute < periods[i].end.totalminutes) break;
              let str;
              let compactTime, compactStr;
              if (i >= periods.length) str = `<p class="schedule-endingin">${
                    localizeTime('ended', {
                        P: getPeriodSpan(period = getPeriodName(periods.length - 1)),
                        T: `<strong>${compactTime = getUsefulTimePhrase(totalMinute - periods[periods.length - 1].end.totalminutes)}</strong>`
                    })
                }</p>`, compactStr = localize('appname'), returnval.endOfDay = true; // after school
                else if (totalMinute >= periods[i].start.totalminutes) str = `<div class="schedule-periodprogress"><div style="width: ${(totalMinute - periods[i].start.totalminutes) / (periods[i].end.totalminutes - periods[i].start.totalminutes) * 100}%;"></div></div><p class="schedule-endingin">${
                    localizeTime('ending', {
                        P: getPeriodSpan(period = getPeriodName(i)),
                        T: `<strong>${compactTime = getUsefulTimePhrase(periods[i].end.totalminutes - totalMinute)}</strong>`
                    })
                }</p>`, compactStr = localizeTime('ending-short', {T: compactTime}); // during a period
                else str = `<p class="schedule-endingin">${
                        localizeTime('starting', {
                            P: getPeriodSpan(period = getPeriodName(i)),
                            T: `<strong>${compactTime = getUsefulTimePhrase(periods[i].start.totalminutes - totalMinute)}</strong>`
                        })
                    }</p>`, compactStr = localizeTime('starting-short', {T: compactTime, P: getPeriod(period).label}); // passing period or before school
                innerHTML += str;
                if (setTitle) {
                    if (options.compact) document.title = compactStr;
                    else document.title = str.replace(/<[^>]+>/g, '');
                }
            }
            for (period of periods) {
              let periodName = getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name);
              innerHTML += `<div class="schedule-period" style="${
                    getCSS(periodName.colour, period.name)
                }"><span class="schedule-periodname">${
                    escapeHTML(periodName.label)
                }${
                    options.displayAddAsgn ? `<button class="material add-asgn" data-pd="${period.name}">${localize('add-asgn')}</button>` : ''
                }</span><span>${
                    getHumanTime(('0' + period.start.hour).slice(-2) + ('0' + period.start.minute).slice(-2))
                } &ndash; ${
                    getHumanTime(('0' + period.end.hour).slice(-2) + ('0' + period.end.minute).slice(-2))
                } &middot; ${
                    localizeTime('long', {T: getUsefulTimePhrase(period.end.totalminutes - period.start.totalminutes)})
                }</span>`;
                if (checkFuture) {
                    innerHTML += `<span>`;
                    if (totalMinute >= period.end.totalminutes) innerHTML += localizeTime('self-ended', {T: `<strong>${getUsefulTimePhrase(totalMinute - period.end.totalminutes)}</strong>`});
                    else if (totalMinute < period.start.totalminutes) innerHTML += localizeTime('self-starting', {T: `<strong>${getUsefulTimePhrase(period.start.totalminutes - totalMinute)}</strong>`});
                    else innerHTML += localizeTime('self-ending', {
                            T1: `<strong>${getUsefulTimePhrase(period.end.totalminutes - totalMinute)}</strong>`,
                            T2: getUsefulTimePhrase(totalMinute - period.start.totalminutes)
                        });
                    innerHTML += `</span>`;
                }
                if (assignments[period.name]) {
                    innerHTML += assignments[period.name];
                }
                if (period.name === 'Lunch' && dayToPrime[weekday]) {
                    const clubs = [];
                    Object.keys(savedClubs).forEach(clubName => {
                        if (savedClubs[clubName] % dayToPrime[weekday] === 0) {
                            clubs.push(clubName);
                        }
                    });
                    if (clubs.length) {
                        innerHTML += `<span class="small-heading">${localize('lunch-clubs')}</span>`
                            + clubs.map(club => `<a class="club-link" href="#" onclick="showClub(\`${club}\`);event.preventDefault()">${club}</a>`).join('');
                    }
                }
                innerHTML += `</div>`;
            }
        } else innerHTML += `<span class="schedule-noschool">${getPeriod("NO_SCHOOL").label}</span>`;
        return innerHTML;
    }

    if (!options.offset) options.offset = 0;

    function refocus() {
        if (options.update) container.innerHTML = generateDay(options.offset);
    }

    function onBlur() {
        setTitle = true;
        generateDay(options.offset);
        window.removeEventListener('blur', onBlur, false);
    }

    window.addEventListener('blur', onBlur, false);
    var returnval = {
        options,
        element: elem,
        update() {
            options.update = true;
            container.innerHTML = generateDay(options.offset);
            clearTimeout(timeout);
            timeout = setTimeout(returnval.update, (60 - new Date().getSeconds()) * 1000);
            window.addEventListener("focus", refocus, false);
            onSavedClubsUpdate = refocus;
        },
        stopupdate() {
            options.update = false;
            clearTimeout(t);
            window.removeEventListener("focus", refocus, false);
        },
        get offset() {
            return options.offset
        },
        set offset(o) {
            options.offset = o;
            container.innerHTML = generateDay(options.offset);
        },
        setPeriod(id, name, colour) {
            if (name) options.periods[id].label = name;
            if (colour) options.periods[id].colour = colour;
            container.innerHTML = generateDay(options.offset);
        },
        getWeek() {
            var actualtoday = new Date(), week = [];
            today = new Date(actualtoday.getFullYear(), actualtoday.getMonth(), actualtoday.getDate() + options.offset);
            for (var i = 0; i < 7; i++) {
                var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + i),
                    day = [];
                var isSELF = isSELFDay(d.getMonth(), d.getDate());
                var sched = getSchedule(d).periods;
                if (sched.length) for (var period of sched) {
                    // q stands for 'quick' because I'm too lazy to make a variable name
                    // but I am not lazy enough to make a comment explaining it
                    const q = getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name);
                    q.id = period.name;
                    day.push(q);
                }
                if (today.getDay() === i) day.today = true;
                week.push(day);
            }
            return week;
        },
        getPeriodSpan
    };
    var timeout;
    if (options.update) returnval.update();
    else container.innerHTML = generateDay(options.offset);
    elem.appendChild(container);
    return returnval;
}
