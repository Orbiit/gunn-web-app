function scheduleApp(options={}) {
  var elem,container=document.createElement("div"),colourtoy=document.createElement("div");
  if (options.element) elem=options.element;
  else elem=document.createElement("div");
  container.classList.add('container');
  if (!options.alternates) options.alternates={};
  if (!options.periods) options.periods={};
  if (!options.normal) options.normal={};
  function getPeriod(name) {
    return options.periods[name]||{label:name,colour:"#bbb"};
  }
  function getHumanTime(messytime) {
    return `${+messytime.slice(0,2)}:${messytime.slice(2)}`;
  }
  function getFontColour(colour) {
    colourtoy.style.backgroundColor=colour;
    colour=colourtoy.style.backgroundColor;
    colour=colour.slice(colour.indexOf('(')+1,colour.indexOf(')')).split(/,\s*/).map(a=>+a);
    // https://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    return Math.round(((parseInt(colour[0])*299)+(parseInt(colour[1])*587)+(parseInt(colour[2])*114))/1000)>125?'rgba(0,0,0,0.8)':'white';
  }
  getFontColour('rgba(0,0,0,0.2)');
  var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  function generateDay(offset=0) {
    function generateNoSchool() {
      return `<div class="period" style="background-color:${getPeriod("NO_SCHOOL").colour};color:${getFontColour(getPeriod("NO_SCHOOL").colour)};"><span class="name">${getPeriod("NO_SCHOOL").label}</span></div>`;
    }
    var d=new Date(),innerHTML,day;
    if (offset!==0) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset);
    day=days[d.getDay()];
    innerHTML=`<h2 class="dayname">${day}</h2><h3 class="date">${months[d.getMonth()]} ${d.getDate()}</h3>`;
    if (options.alternates[(d.getMonth()+1)+'-'+d.getDate()]) {
      var sched=options.alternates[(d.getMonth()+1)+'-'+d.getDate()];
      innerHTML+=`<span class="alternate">This is an alternate schedule. The school says, "${sched.description}"</span>`;
      if (sched.periods.length) {
        //
      } else innerHTML+=generateNoSchool();
    } else {
      if (options.normal[day]&&options.normal[day].length) {
        for (var period of options.normal[day]) innerHTML+=`<div class="period" style="background-color:${getPeriod(period.type).colour};color:${getFontColour(getPeriod(period.type).colour)};"><span class="periodname">${getPeriod(period.type).label}</span><span class="periodtimerange">${getHumanTime(period.begin)} &ndash; ${getHumanTime(period.end)}</span></div>`;
      } else innerHTML+=generateNoSchool();
    }
    return innerHTML;
  }
  container.innerHTML=generateDay();
  elem.appendChild(container);
  return elem;
}
