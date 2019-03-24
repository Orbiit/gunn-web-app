class DatePicker {
  // 0 indexed months, but 1 indexed dates and years
  constructor(start,end,elem) {
    this.start=start;
    this.end=end;
    this.selectedelem=null;
    this.selected=null;
    var days=localize('ds').split('  '),
    months=localize('mos').split('  ');
    elem?this.wrapper=elem:this.wrapper=document.createElement("div");
    if (!/(absolute|fixed)/.test(window.getComputedStyle(this.wrapper).position)) this.wrapper.style.position='relative';
    this.wrapper.classList.add('datepicker-wrapper');
    this.header=document.createElement("div");
    DatePicker.css(this.header)`position:absolute` `display:flex` `width:100%` `top:0` `left:0` `z-index:1`;
    this.header.classList.add('datepicker-dayheadings');
    for (var d of days) {
      var t=document.createElement("span");
      DatePicker.css(t)`flex: 1 0 0` `text-align:center`;
      t.classList.add('datepicker-dayheading');
      t.innerHTML=d;
      this.header.appendChild(t);
    }
    this.wrapper.appendChild(this.header);
    this.dates=document.createElement("div");
    DatePicker.css(this.dates)`position:relative` `height: 100%` `box-sizing: border-box` `overflow: auto`;
    this.dates.classList.add('datepicker-days');
    var genesis=new Date(start.y,start.m,start.d),weeknum=0,apocalypse=new Date(end.y,end.m,end.d).getTime(),
    startday=genesis.getDay(),
    today=new Date(start.y,start.m,start.d-startday),
    monthalt=false,
    lastmonth=today.getMonth();
    genesis=genesis.getTime();
    while (today.getTime()<apocalypse) {
      var week=document.createElement("div");
      DatePicker.css(week)`display:flex` `position:relative`;
      week.classList.add('datepicker-week');
      for (var i=0;i<days.length;i++) {
        var day=document.createElement("span");
        today=new Date(start.y,start.m,start.d-startday+weeknum*7+i);
        DatePicker.css(day)`flex: 1 0 0` `text-align:center`;
        day.classList.add('datepicker-day');
        if (today.getTime()>=genesis&&today.getTime()<=apocalypse) {
          day.dataset.month=today.getMonth();
          day.dataset.year=today.getFullYear();
          if ((day.dataset.date=day.innerHTML=today.getDate())===1) monthalt=!monthalt;
          if (monthalt) day.classList.add('datepicker-monthalt');
        } else day.dataset.notinrange="true";
        week.appendChild(day);
        if (i===0&&lastmonth!==today.getMonth()) {
          lastmonth=today.getMonth();
          var t=document.createElement("span");
          DatePicker.css(t)`position:absolute` `z-index: -1`;
          t.classList.add('datepicker-month');
          t.innerHTML=months[lastmonth]+today.getFullYear().toString().slice(-2);
          week.appendChild(t);
        }
      }
      this.dates.appendChild(week);
      weeknum++;
    }
    this.dates.addEventListener("click",e=>{
      if (e.target.classList.contains('datepicker-day')&&e.target.dataset.notinrange!=='true') this.day={d:+e.target.dataset.date,m:+e.target.dataset.month,y:+e.target.dataset.year};
    },false);
    this.wrapper.appendChild(this.dates);
    var d=new Date();
    var t=this.dates.querySelector(`.datepicker-day[data-date="${d.getDate()}"][data-month="${d.getMonth()}"][data-year="${d.getFullYear()}"]`);
    if (t) t.classList.add('datepicker-today');
  }
  get day() {return this.selected;}
  set day(day) {
    if (this.selectedelem) this.selectedelem.classList.remove('datepicker-selected');
    if (day&&this.inrange(day)) {
      day=DatePicker.purify(day);
      this.selectedelem=this.dates.querySelector(`.datepicker-day[data-date="${day.d}"][data-month="${day.m}"][data-year="${day.y}"]`);
      this.selectedelem.classList.add('datepicker-selected');
      this.selected=day;
    } else {
      this.selectedelem=null;
      this.selected=null;
    }
    if (this.onchange) this.onchange(day);
  }
  inrange(day) {
    var d=new Date(day.y,day.m,day.d).getTime();
    return !(d<new Date(this.start.y,this.start.m,this.start.d).getTime()||d>new Date(this.end.y,this.end.m,this.end.d).getTime());
  }
  static purify(day) {
    var d=new Date(day.y,day.m,day.d);
    return {d:d.getDate(),m:d.getMonth(),y:d.getFullYear()};
  }
  static css(elem) {
    function setCSS([declaration]) {
      elem.style.setProperty(declaration.slice(0,declaration.indexOf(':')),declaration.slice(declaration.indexOf(':')+1));
      return setCSS;
    }
    return setCSS;
  }
}
