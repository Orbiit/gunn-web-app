function scheduleApp(options={}) {
  var elem,container=document.createElement("div"),colourtoy=document.createElement("div");
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
    if (options.h24) return `${hr}:${messytime.slice(2)}`;
    else return `${(hr-1)%12+1}:${messytime.slice(2)}${hr<12?'a':'p'}m`;
  }
  function getFontColour(colour) {
    colourtoy.style.backgroundColor=colour;
    colour=colourtoy.style.backgroundColor;
    colour=colour.slice(colour.indexOf('(')+1,colour.indexOf(')')).split(/,\s*/).map(a=>+a);
    // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    return Math.round(((parseInt(colour[0])*299)+(parseInt(colour[1])*587)+(parseInt(colour[2])*114))/1000)>150?'rgba(0,0,0,0.8)':'white';
  }
  function getUsefulTimePhrase(minutes) {
    if (options.compact) return `${Math.floor(minutes/60)}:${('0'+minutes%60).slice(-2)}`;
    else return localizeTime('duration', {T: minutes});
  }
  function getPeriodSpan(period) {
    return `<span style="background-color:${getPeriod(period).colour};color:${getFontColour(getPeriod(period).colour)};" class="schedule-endinginperiod">${getPeriod(period).label}</span>`;
  }
  function isSELFDay(month, date) {
    return options.self && options.selfDays.includes(('0' + (month + 1)).slice(-2) + '-' + ('0' + date).slice(-2));
  }
  getFontColour('rgba(0,0,0,0.2)');
  var days=localize('days').split('  '),
  months=localize('months').split('  ');
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
  let setTitle = false;
  const aps = {
    '5-6': {
      afternoon: 'Chinese Language & Culture (Library, G5, & F5), Environmental Science (Bow Gym)'
    },
    '5-7': {
      morning: 'Spanish Language & Culture (Library, H1, H2, H3)',
      afternoon: 'Japanese Language & Culture (F5), Physics 1: Algebra-based (Bow Gym)'
    },
    '5-8': {
      morning: 'English Literature & Composition (Bow Gym)',
      afternoon: 'French Language & Culture (Library)'
    },
    '5-9': {
      morning: 'Chemistry (Library), Spanish Literature & Culture (G5)',
      afternoon: 'German Language & Culture (Library), Psychology (Bow Gym)'
    },
    '5-10': {
      morning: 'United States History (Bow Gym)',
      afternoon: 'Computer Science Principles (Library)'
    },

    '5-13': {
      morning: 'Biology (Library)',
      afternoon: 'Physics C: Mechanics (12-2PM) (Bow Gym), Physics C: Electricity & Magnetism (2-4PM) (Bow Gym)'
    },
    '5-14': {
      morning: 'Calculus AB (Bow Gym), Calculus BC (Bow Bym and Library)',
      afternoon: 'Art History (V17)'
    },
    '5-15': {
      afternoon: 'Macroeconomics (Bow Gym)'
    },
    '5-16': {
      afternoon: 'Statistics (Bow Gym)'
    },
    '5-17': {
      morning: 'Microeconomics (Bow Gym), Music Theory (Library or Possibly Music Room)',
      afternoon: 'Computer Science A (Library)'
    }
  };
  function generateDay(offset=0) {
    var d=new Date(),innerHTML,day,checkfuture=true,totalminute=d.getMinutes()+d.getHours()*60;
    if (offset!==0) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset),checkfuture=false;
    const ano = d.getFullYear(), mez = d.getMonth(), dia = d.getDate(), weekday = d.getDay();
    day=days[weekday];
    innerHTML=`<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date"><a class="totally-not-a-link" href="?date=${`${ano}-${mez + 1}-${dia}`}">${localizeTime('date', {M: months[mez], D: dia})}</a></h3>`;
    var isSELF = isSELFDay(mez, dia);
    var periods;
    function getPeriodName(index) {
      return periods[index].name === 'Flex' && isSELF ? 'SELF' : periods[index].name;
    }
    if (options.alternates[(mez+1)+'-'+dia]) {
      var sched=options.alternates[(mez+1)+'-'+dia];
      innerHTML+=`<span class="schedule-alternatemsg">${localize('before-alt-msg')}<strong>${sched.description}</strong>${localize('after-alt-msg')}</span>`;
      periods = sched.periods;
    } else if (options.normal[weekday]&&options.normal[weekday].length) {
      periods = options.normal[weekday];
    } else periods = [];
    if (aps[(mez+1)+'-'+dia]) {
      const ap = aps[(mez+1)+'-'+dia];
      innerHTML += `<div class="material-card ap-card"><h1>AP exams today</h1>`;
      if (ap.morning) {
        const current = checkfuture && totalminute >= 8 * 60 && totalminute < 12 * 60;
        innerHTML += `<span class="small-heading">Morning &mdash; 8:00 am &ndash; 12:00 pm</span>`;
        innerHTML += `<span class="${current ? 'ap-current' : ''}">${ap.morning}${current ? ' &mdash; ongoing' : ''}</span>`;
      }
      if (ap.afternoon) {
        const current = checkfuture && totalminute >= 12 * 60 && totalminute < 16 * 60;
        innerHTML += `<span class="small-heading">Afternoon &mdash; 12:00 pm &ndash; 4:00 pm</span>`;
        innerHTML += `<span class="${current ? 'ap-current' : ''}">${ap.afternoon}${current ? ' &mdash; ongoing' : ''}</span>`;
      }
      innerHTML += `</div>`;
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
        }</p>`,compactStr=localize('appname'),options.onEndOfDay&&options.onEndOfDay(options.onEndOfDay = null); // after school
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
        innerHTML+=`<div class="schedule-period" style="background-color:${periodName.colour};color:${getFontColour(periodName.colour)};"><span class="schedule-periodname">${periodName.label}</span><span>${getHumanTime(('0'+period.start.hour).slice(-2)+('0'+period.start.minute).slice(-2))} &ndash; ${getHumanTime(('0'+period.end.hour).slice(-2)+('0'+period.end.minute).slice(-2))} &middot; ${localizeTime('long', {T: getUsefulTimePhrase(period.end.totalminutes - period.start.totalminutes)})}</span>`;
        if (checkfuture) {
          innerHTML+=`<span>`;
          if (totalminute>=period.end.totalminutes) innerHTML+=localizeTime('self-ended', {T: `<strong>${getUsefulTimePhrase(totalminute-period.end.totalminutes)}</strong>`});
          else if (totalminute<period.start.totalminutes) innerHTML+=localizeTime('self-starting', {T: `<strong>${getUsefulTimePhrase(period.start.totalminutes-totalminute)}</strong>`});
          else innerHTML+=localizeTime('self-ending', {T1: `<strong>${getUsefulTimePhrase(period.end.totalminutes-totalminute)}</strong>`, T2: getUsefulTimePhrase(totalminute-period.start.totalminutes)});
          innerHTML+=`</span>`;
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
        if (options.alternates[(d.getMonth()+1)+'-'+d.getDate()]) {
          sched=options.alternates[(d.getMonth()+1)+'-'+d.getDate()].periods;
        } else {
          sched=options.normal[d.getDay()] || [];
        }
        if (sched.length) for (var period of sched) day.push(getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name));
        if (today.getDay()===i) day.today=true;
        week.push(day);
      }
      return week;
    }
  };
  var timeout;
  if (options.update) returnval.update();
  else container.innerHTML=generateDay(options.offset);
  elem.appendChild(container);
  return returnval;
}
