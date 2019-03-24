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
    if (options.compact) return `${Math.floor(minutes/60)}:${('0'+minutes%60).slice(-2)}`
    else {
      if (minutes<1) return 'less than a minute';
      return (minutes>=120?Math.floor(minutes/60)+' hours':minutes>=60?'an hour':'')+(minutes%60===0?'':(minutes>=60?' and ':'')+(minutes%60===1?'a minute':(minutes%60)+' minutes'));
    }
  }
  function getTotalMinutes(messytime) {
    return (+messytime.slice(0,2))*60+(+messytime.slice(2));
  }
  function getPeriodSpan(period) {
    return `<span style="background-color:${getPeriod(period).colour};color:${getFontColour(getPeriod(period).colour)};" class="schedule-endinginperiod">${getPeriod(period).label}</span>`;
  }
  function isSELFDay(month, date) {
    return options.self && options.selfDays.includes(('0' + (month + 1)).slice(-2) + '-' + ('0' + date).slice(-2));
  }
  getFontColour('rgba(0,0,0,0.2)');
  var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  function generateDay(offset=0) {
    var d=new Date(),innerHTML,day,checkfuture=true,totalminute=d.getMinutes()+d.getHours()*60;
    if (offset!==0) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset),checkfuture=false;
    const ano = d.getFullYear(), mez = d.getMonth(), dia = d.getDate();
    day=days[d.getDay()];
    innerHTML=`<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date"><a class="totally-not-a-link" href="?date=${`${ano}-${mez + 1}-${dia}`}">${months[mez]} ${dia}</a></h3>`;
    var isSELF = isSELFDay(mez, dia);
    var periods;
    function getPeriodName(index) {
      return periods[index].name === 'Flex' && isSELF ? 'SELF' : periods[index].name;
    }
    if (options.alternates[(mez+1)+'-'+dia]) {
      var sched=options.alternates[(mez+1)+'-'+dia];
      innerHTML+=`<span class="schedule-alternatemsg">This is an alternate schedule. The school says, "<strong>${sched.description}</strong>"</span>`;
      periods = sched.periods;
    } else if (options.normal[day]&&options.normal[day].length) {
      periods = options.normal[day];
    } else periods = [];
    if (periods.length) {
      if (checkfuture) {
        for (var i=0;i<periods.length;i++) if (totalminute<periods[i].end.totalminutes) break;
        var str;
        var compactTime, period, compactStr;
        if (i>=periods.length) str=`<p class="schedule-endingin">${getPeriodSpan(period=getPeriodName(periods.length-1))} ended <strong>${compactTime=getUsefulTimePhrase(totalminute-periods[periods.length-1].end.totalminutes)}</strong> ago.</p>`,compactStr='Unofficial Gunn Web App (UGWA)'; // after school
        else if (totalminute>=periods[i].start.totalminutes) str=`<div class="schedule-periodprogress"><div style="width: ${(totalminute-periods[i].start.totalminutes)/(periods[i].end.totalminutes-periods[i].start.totalminutes)*100}%;"></div></div><p class="schedule-endingin">${getPeriodSpan(period=getPeriodName(i))} ending in <strong>${compactTime=getUsefulTimePhrase(periods[i].end.totalminutes-totalminute)}</strong>.</p>`,compactStr=compactTime + ' left'; // during a period
        else if (i===0) str=`<p class="schedule-endingin">${getPeriodSpan(period=getPeriodName(0))} starting in <strong>${compactTime=getUsefulTimePhrase(periods[0].start.totalminutes-totalminute)}</strong>.</p>`,compactStr = compactTime + ' until ' + getPeriod(period).label; // before school
        else str=`<p class="schedule-endingin">${getPeriodSpan(period=getPeriodName(i))} starting in <strong>${compactTime=getUsefulTimePhrase(periods[i].start.totalminutes-totalminute)}</strong>.</p>`,compactStr = compactTime + ' until ' + getPeriod(period).label; // passing period
        innerHTML += str;
        if (options.compact) document.title = compactStr;
        else document.title = str.replace(/<[^>]+>/g, '');
      }
      for (var period of periods) {
        var periodName = getPeriod(period.name === 'Flex' && isSELF ? 'SELF' : period.name);
        innerHTML+=`<div class="schedule-period" style="background-color:${periodName.colour};color:${getFontColour(periodName.colour)};"><span class="schedule-periodname">${periodName.label}</span><span>${getHumanTime(('0'+period.start.hour).slice(-2)+('0'+period.start.minute).slice(-2))} &ndash; ${getHumanTime(('0'+period.end.hour).slice(-2)+('0'+period.end.minute).slice(-2))} &middot; ${getUsefulTimePhrase(period.end.totalminutes - period.start.totalminutes)} long</span>`;
        if (checkfuture) {
          innerHTML+=`<span>`;
          if (totalminute>=period.end.totalminutes) innerHTML+=`Ended <strong>${getUsefulTimePhrase(totalminute-period.end.totalminutes)}</strong> ago.`;
          else if (totalminute<period.start.totalminutes) innerHTML+=`Starting in <strong>${getUsefulTimePhrase(period.start.totalminutes-totalminute)}</strong>.`;
          else innerHTML+=`Ending in <strong>${getUsefulTimePhrase(period.end.totalminutes-totalminute)}</strong>; started ${getUsefulTimePhrase(totalminute-period.start.totalminutes)} ago.`;
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
  var returnval={
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
          sched=options.normal[['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]] || [];
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
