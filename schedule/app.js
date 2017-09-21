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
    return `${+messytime.slice(0,2)}:${messytime.slice(2)}`;
  }
  function getFontColour(colour) {
    colourtoy.style.backgroundColor=colour;
    colour=colourtoy.style.backgroundColor;
    colour=colour.slice(colour.indexOf('(')+1,colour.indexOf(')')).split(/,\s*/).map(a=>+a);
    // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    return Math.round(((parseInt(colour[0])*299)+(parseInt(colour[1])*587)+(parseInt(colour[2])*114))/1000)>150?'rgba(0,0,0,0.8)':'white';
  }
  function getUsefulTimePhrase(minutes) {
    if (minutes<1) return 'less than a minute';
    return (minutes>=120?Math.floor(minutes/60)+' hours':minutes>=60?'an hour':'')+(minutes%60===0?'':(minutes>=60?' and ':'')+(minutes%60===1?'a minute':(minutes%60)+' minutes'));
  }
  function getTotalMinutes(messytime) {
    return (+messytime.slice(0,2))*60+(+messytime.slice(2));
  }
  function getPeriodSpan(period) {
    return `<span style="background-color:${getPeriod(period).colour};color:${getFontColour(getPeriod(period).colour)};" class="schedule-endinginperiod">${getPeriod(period).label}</span>`;
  }
  getFontColour('rgba(0,0,0,0.2)');
  var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  function generateDay(offset=0) {
    var d=new Date(),innerHTML,day,checkfuture=true,totalminute=d.getMinutes()+d.getHours()*60;
    if (offset!==0) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset),checkfuture=false;
    day=days[d.getDay()];
    innerHTML=`<h2 class="schedule-dayname">${day}</h2><h3 class="schedule-date">${months[d.getMonth()]} ${d.getDate()}</h3>`;
    if (options.alternates[(d.getMonth()+1)+'-'+d.getDate()]) {
      var sched=options.alternates[(d.getMonth()+1)+'-'+d.getDate()];
      innerHTML+=`<span class="schedule-alternatemsg">This is an alternate schedule. The school says, "<strong>${sched.description}</strong>"</span>`;
      if (sched.periods.length) {
        if (checkfuture) {
          for (var i=0;i<sched.periods.length;i++) if (totalminute<sched.periods[i].end.totalminutes) break;
          if (i>=sched.periods.length) innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(sched.periods[sched.periods.length-1].name)} ended <strong>${getUsefulTimePhrase(totalminute-sched.periods[sched.periods.length-1].end.totalminutes)}</strong> ago.</p>`; // after school
          else if (totalminute>=sched.periods[i].start.totalminutes) innerHTML+=`<div class="schedule-periodprogress"><div style="width: ${(totalminute-sched.periods[i].start.totalminutes)/(sched.periods[i].end.totalminutes-sched.periods[i].start.totalminutes)*100}%;"></div></div><p class="schedule-endingin">${getPeriodSpan(sched.periods[i].name)} ending in <strong>${getUsefulTimePhrase(sched.periods[i].end.totalminutes-totalminute)}</strong>.</p>`; // during a period
          else if (i===0) innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(sched.periods[0].name)} starting in <strong>${getUsefulTimePhrase(sched.periods[0].start.totalminutes-totalminute)}</strong>.</p>`; // before school
          else innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(sched.periods[i].name)} starting in <strong>${getUsefulTimePhrase(sched.periods[i].start.totalminutes-totalminute)}</strong>.</p>`; // passing period
        }
        for (var period of sched.periods) {
          innerHTML+=`<div class="schedule-period" style="background-color:${getPeriod(period.name).colour};color:${getFontColour(getPeriod(period.name).colour)};"><span class="schedule-periodname">${getPeriod(period.name).label}</span><span>${period.start.hour}:${('0'+period.start.minute).slice(-2)} &ndash; ${period.end.hour}:${('0'+period.end.minute).slice(-2)}</span>`;
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
    } else {
      if (options.normal[day]&&options.normal[day].length) {
        if (checkfuture) {
          for (var i=0;i<options.normal[day].length;i++) if (totalminute<getTotalMinutes(options.normal[day][i].end)) break;
          if (i>=options.normal[day].length) innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(options.normal[day][options.normal[day].length-1].type)} ended <strong>${getUsefulTimePhrase(totalminute-getTotalMinutes(options.normal[day][options.normal[day].length-1].end))}</strong> ago.</p>`; // after school
          else if (totalminute>=getTotalMinutes(options.normal[day][i].begin)) innerHTML+=`<div class="schedule-periodprogress"><div style="width: ${(totalminute-getTotalMinutes(options.normal[day][i].begin))/(getTotalMinutes(options.normal[day][i].end)-getTotalMinutes(options.normal[day][i].begin))*100}%;"></div></div><p class="schedule-endingin">${getPeriodSpan(options.normal[day][i].type)} ending in <strong>${getUsefulTimePhrase(getTotalMinutes(options.normal[day][i].end)-totalminute)}</strong>.</p>`; // during a period
          else if (i===0) innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(options.normal[day][0].type)} starting in <strong>${getUsefulTimePhrase(getTotalMinutes(options.normal[day][0].begin)-totalminute)}</strong>.</p>`; // before school
          else innerHTML+=`<p class="schedule-endingin">${getPeriodSpan(options.normal[day][i].type)} starting in <strong>${getUsefulTimePhrase(getTotalMinutes(options.normal[day][i].begin)-totalminute)}</strong>.</p>`; // passing period
        }
        for (var period of options.normal[day]) {
          innerHTML+=`<div class="schedule-period" style="background-color:${getPeriod(period.type).colour};color:${getFontColour(getPeriod(period.type).colour)};"><span class="schedule-periodname">${getPeriod(period.type).label}</span><span>${getHumanTime(period.begin)} &ndash; ${getHumanTime(period.end)}</span>`;
          if (checkfuture) {
            innerHTML+=`<span>`;
            if (totalminute>=getTotalMinutes(period.end)) innerHTML+=`Ended <strong>${getUsefulTimePhrase(totalminute-getTotalMinutes(period.end))}</strong> ago.`;
            else if (totalminute<getTotalMinutes(period.begin)) innerHTML+=`Starting in <strong>${getUsefulTimePhrase(getTotalMinutes(period.begin)-totalminute)}</strong>.`;
            else innerHTML+=`Ending in <strong>${getUsefulTimePhrase(getTotalMinutes(period.end)-totalminute)}</strong>; started ${getUsefulTimePhrase(totalminute-getTotalMinutes(period.begin))} ago.`;
            innerHTML+=`</span>`;
          }
          innerHTML+=`</div>`;
        }
      } else innerHTML+=`<span class="schedule-noschool">${getPeriod("NO_SCHOOL").label}</span>`;
    }
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
        if (options.alternates[(d.getMonth()+1)+'-'+d.getDate()]) {
          var sched=options.alternates[(d.getMonth()+1)+'-'+d.getDate()];
          if (sched.periods.length) for (var period of sched.periods) day.push(getPeriod(period.name));
        } else {
          var periods=options.normal[['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]];
          if (periods&&periods.length) for (var period of periods) day.push(getPeriod(period.type));
        }
        if (options.offset===0&&actualtoday.getDay()===i) day.today=true;
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
