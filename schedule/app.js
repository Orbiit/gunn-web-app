var days, months;
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
const colourtoy=document.createElement("div");
function getFontColour(colour) {
  colourtoy.style.backgroundColor=colour;
  colour=colourtoy.style.backgroundColor;
  colour=colour.slice(colour.indexOf('(')+1,colour.indexOf(')')).split(/,\s*/).map(a=>+a);
  // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
  return Math.round(((parseInt(colour[0])*299)+(parseInt(colour[1])*587)+(parseInt(colour[2])*114))/1000)>150?'rgba(0,0,0,0.8)':'white';
}
function scheduleApp(options={}) {
  var elem,container=document.createElement("div");
  if (options.element) elem=options.element;
  else elem=document.createElement("div");
  container.classList.add('schedule-container');
  if (!options.alternates) options.alternates={};
  if (!options.periods) options.periods={};
  if (!options.normal) options.normal={};
  function getPeriod(name) {
    return options.periods[name]||{label:name,colour:"#000"};
  }
  function getHumanTime(messytime) {
    var hr=+messytime.slice(0,2)%24;
    if (options.h0Joke) return +messytime.slice(2) + '';
    else if (options.h24) return `${hr}:${messytime.slice(2)}`;
    else return `${(hr-1)%12+1}:${messytime.slice(2)}${hr<12?'a':'p'}m`;
  }
  function getCSS(colour, id) {
    if (colour[0] === '#') {
      return `background-color:${colour};color:${getFontColour(colour)};`;
    } else {
      return `background-image: url('./.period-images/${id}?${encodeURIComponent(colour)}'); color: white; text-shadow: 0 0 10px black;`
    }
  }
  function getUsefulTimePhrase(minutes) {
    if (options.compact) return `${Math.floor(minutes/60)}:${('0'+minutes%60).slice(-2)}`;
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
  function generateDay(offset=0) {
    var d=new Date(),innerHTML,day,checkfuture=true,totalminute=d.getMinutes()+d.getHours()*60;
    if (offset!==0) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset),checkfuture=false;
    const ano = d.getFullYear(), mez = d.getMonth(), dia = d.getDate(), weekday = d.getDay();
    day=days[weekday];
    innerHTML=`<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date"><a class="totally-not-a-link" href="?date=${`${ano}-${mez + 1}-${dia}`}">${localizeTime('date', {M: months[mez], D: dia})}</a></h3>`;
    const assignments = options.getAssignments(d);
    if (assignments.noPeriod) {
      innerHTML += assignments.noPeriod;
    }
    var isSELF = isSELFDay(mez, dia);
    var periods;
    function getPeriodName(index) {
      return periods[index].name === 'Flex' && isSELF ? 'SELF' : periods[index].name;
    }
    if (options.customSchedule) periods = options.customSchedule(d, ano, mez, dia, weekday);
    if (periods) periods = periods.slice();
    else if (options.isSummer && options.isSummer(ano, mez, dia)) {
      return innerHTML + `<span class="schedule-noschool">${localize("summer")}</span>`;
    } else if (options.alternates[(mez+1)+'-'+dia]) {
      var sched=options.alternates[(mez+1)+'-'+dia];
      innerHTML+=`<span class="schedule-alternatemsg">${localize('before-alt-msg')}<strong>${sched.description}</strong>${localize('after-alt-msg')}</span>`;
      periods = sched.periods.slice();
    } else if (options.normal[weekday]&&options.normal[weekday].length) {
      periods = options.normal[weekday].slice();
    } else periods = [];
    if (options.hPeriods[weekday]) {
      const [start, end] = options.hPeriods[weekday];
      periods.push({
        name: 'H',
        start: {hour: Math.floor(start / 60), minute: start % 60, totalminutes: start},
        end: {hour: Math.floor(end / 60), minute: end % 60, totalminutes: end}
      });
    }
    if (periods.length) {
      if (checkfuture) {
        for (var i=0;i<periods.length;i++) if (totalminute<periods[i].end.totalminutes) break;
        var str;
        var compactTime, period, compactStr;
        if (i>=periods.length) str=`<p class="schedule-endingin">${
          localizeTime('ended', {
            P: getPeriodSpan(period=getPeriodName(periods.length-1)),
            T: `<strong>${compactTime=getUsefulTimePhrase(totalminute-periods[periods.length-1].end.totalminutes)}</strong>`
          })
        }</p>`,compactStr=localize('appname'),returnval.endOfDay = true; // after school
        else if (totalminute>=periods[i].start.totalminutes) str=`<div class="schedule-periodprogress"><div style="width: ${(totalminute-periods[i].start.totalminutes)/(periods[i].end.totalminutes-periods[i].start.totalminutes)*100}%;"></div></div><p class="schedule-endingin">${
          localizeTime('ending', {
            P: getPeriodSpan(period=getPeriodName(i)),
            T: `<strong>${compactTime=getUsefulTimePhrase(periods[i].end.totalminutes-totalminute)}</strong>`
          })
        }</p>`,compactStr=localizeTime('ending-short', {T: compactTime}); // during a period
        else str=`<p class="schedule-endingin">${
          localizeTime('starting', {
            P: getPeriodSpan(period=getPeriodName(i)),
            T: `<strong>${compactTime=getUsefulTimePhrase(periods[i].start.totalminutes-totalminute)}</strong>`
          })
        }</p>`,compactStr = localizeTime('starting-short', {T: compactTime, P: getPeriod(period).label}); // passing period or before school
        innerHTML += str;
        if (setTitle) {
          if (options.compact) document.title = compactStr;
          else document.title = str.replace(/<[^>]+>/g, '');
        }
      }
      for (var period of periods) {
        var periodName = getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name);
        innerHTML+=`<div class="schedule-period" style="${getCSS(periodName.colour, period.name)}"><span class="schedule-periodname">${escapeHTML(periodName.label)}<button class="material add-asgn" data-pd="${period.name}">${localize('add-asgn')}</button></span><span>${getHumanTime(('0'+period.start.hour).slice(-2)+('0'+period.start.minute).slice(-2))} &ndash; ${getHumanTime(('0'+period.end.hour).slice(-2)+('0'+period.end.minute).slice(-2))} &middot; ${localizeTime('long', {T: getUsefulTimePhrase(period.end.totalminutes - period.start.totalminutes)})}</span>`;
        if (checkfuture) {
          innerHTML+=`<span>`;
          if (totalminute>=period.end.totalminutes) innerHTML+=localizeTime('self-ended', {T: `<strong>${getUsefulTimePhrase(totalminute-period.end.totalminutes)}</strong>`});
          else if (totalminute<period.start.totalminutes) innerHTML+=localizeTime('self-starting', {T: `<strong>${getUsefulTimePhrase(period.start.totalminutes-totalminute)}</strong>`});
          else innerHTML+=localizeTime('self-ending', {T1: `<strong>${getUsefulTimePhrase(period.end.totalminutes-totalminute)}</strong>`, T2: getUsefulTimePhrase(totalminute-period.start.totalminutes)});
          innerHTML+=`</span>`;
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
        innerHTML+=`</div>`;
      }
    } else innerHTML+=`<span class="schedule-noschool">${getPeriod("NO_SCHOOL").label}</span>`;
    return innerHTML;
  }
  if (!options.offset) options.offset=0;
  function refocus() {
    if (options.update) container.innerHTML=generateDay(options.offset);
  }
  function onBlur() {
    setTitle = true;
    generateDay(options.offset);
    window.removeEventListener('blur', onBlur, false);
  }
  window.addEventListener('blur', onBlur, false);
  var returnval={
    options,
    element:elem,
    update() {
      options.update=true;
      container.innerHTML=generateDay(options.offset);
      clearTimeout(timeout);
      timeout=setTimeout(returnval.update,(60-new Date().getSeconds())*1000);
      window.addEventListener("focus",refocus,false);
      onSavedClubsUpdate = refocus;
    },
    stopupdate() {
      options.update=false;
      clearTimeout(t);
      window.removeEventListener("focus",refocus,false);
    },
    get offset() {return options.offset},
    set offset(o) {
      options.offset=o;
      container.innerHTML=generateDay(options.offset);
    },
    setPeriod(id,name,colour) {
      if (name) options.periods[id].label=name;
      if (colour) options.periods[id].colour=colour;
      container.innerHTML=generateDay(options.offset);
    },
    getWeek() {
      var actualtoday=new Date(),week=[];
      today=new Date(actualtoday.getFullYear(),actualtoday.getMonth(),actualtoday.getDate()+options.offset);
      for (var i=0;i<7;i++) {
        var d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-today.getDay()+i),
        day=[];
        var isSELF = isSELFDay(d.getMonth(), d.getDate());
        var sched;
        if (options.customSchedule) {
          sched = options.customSchedule(d, d.getFullYear(), d.getMonth(), d.getDate(), d.getDay()).slice();
        } else if (options.isSummer && options.isSummer(d.getFullYear(), d.getMonth(), d.getDate())) {
          sched = [];
        } else if (options.alternates[(d.getMonth()+1)+'-'+d.getDate()]) {
          sched=options.alternates[(d.getMonth()+1)+'-'+d.getDate()].periods.slice();
        } else {
          sched=(options.normal[d.getDay()] || []).slice();
        }
        if (options.hPeriods[d.getDay()]) {
          sched.push({name: 'H'});
        }
        if (sched.length) for (var period of sched) {
          // q stands for 'quick' because I'm too lazy to make a variable name
          // but I am not lazy enough to make a comment explaining it
          const q = getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name);
          q.id = period.name;
          day.push(q);
        }
        if (today.getDay()===i) day.today=true;
        week.push(day);
      }
      return week;
    },
    getPeriodSpan
  };
  var timeout;
  if (options.update) returnval.update();
  else container.innerHTML=generateDay(options.offset);
  elem.appendChild(container);
  return returnval;
}
