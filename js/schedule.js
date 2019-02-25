var options,
letras=[0,'A','B','C','D','E','F','G','Flex','Brunch','Lunch','SELF'],
VERSION=2, // WARNING: if you change this it'll change everyone's saves; it's best to add a way to convert the saves properly
FORMATTING_VERSION='2',
periodstyles={
  NO_SCHOOL:{label:"No school today!"},
  "Brunch":{label:"Brunch",colour:"#90a4ae"},
  "Lunch":{label:"Lunch",colour:"#90a4ae"},
  "Flex":{label:"Flex",colour:"#455a64"},
  "SELF":{label:"SELF",colour:"#455a64"},
  "A":{label:"Period A",colour:"#f44336"},
  "B":{label:"Period B",colour:"#2196F3"},
  "C":{label:"Period C",colour:"#FFEB3B"},
  "D":{label:"Period D",colour:"#795548"},
  "E":{label:"Period E",colour:"#FF9800"},
  "F":{label:"Period F",colour:"#9C27B0"},
  "G":{label:"Period G",colour:"#4CAF50"}
},
normalschedule={
  Monday:[
    {name:'A',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:45,totalminutes:585}},
    {name:'Brunch',start:{hour:9,minute:45,totalminutes:585},end:{hour:9,minute:50,totalminutes:590}},
    {name:'B',start:{hour:10,minute:0,totalminutes:600},end:{hour:11,minute:15,totalminutes:675}},
    {name:'C',start:{hour:11,minute:25,totalminutes:685},end:{hour:12,minute:40,totalminutes:760}},
    {name:'Lunch',start:{hour:12,minute:40,totalminutes:760},end:{hour:13,minute:10,totalminutes:790}},
    {name:'F',start:{hour:13,minute:20,totalminutes:800},end:{hour:14,minute:35,totalminutes:875}}
  ],
  Tuesday:[
    {name:'D',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:45,totalminutes:585}},
    {name:'Brunch',start:{hour:9,minute:45,totalminutes:585},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Flex',start:{hour:10,minute:0,totalminutes:600},end:{hour:10,minute:50,totalminutes:650}},
    {name:'E',start:{hour:11,minute:0,totalminutes:660},end:{hour:12,minute:15,totalminutes:735}},
    {name:'Lunch',start:{hour:12,minute:15,totalminutes:735},end:{hour:12,minute:45,totalminutes:765}},
    {name:'A',start:{hour:12,minute:55,totalminutes:775},end:{hour:14,minute:15,totalminutes:855}},
    {name:'G',start:{hour:14,minute:25,totalminutes:865},end:{hour:15,minute:40,totalminutes:940}}
  ],
  Wednesday:[
    {name:'B',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Brunch',start:{hour:9,minute:50,totalminutes:590},end:{hour:9,minute:55,totalminutes:595}},
    {name:'C',start:{hour:10,minute:5,totalminutes:605},end:{hour:11,minute:25,totalminutes:685}},
    {name:'D',start:{hour:11,minute:35,totalminutes:695},end:{hour:12,minute:55,totalminutes:775}},
    {name:'Lunch',start:{hour:12,minute:55,totalminutes:775},end:{hour:13,minute:25,totalminutes:805}},
    {name:'F',start:{hour:13,minute:35,totalminutes:815},end:{hour:14,minute:55,totalminutes:895}},
  ],
  Thursday:[
    {name:'E',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:50,totalminutes:590}},
    {name:'Brunch',start:{hour:9,minute:50,totalminutes:590},end:{hour:9,minute:55,totalminutes:595}},
    {name:'Flex',start:{hour:10,minute:5,totalminutes:605},end:{hour:10,minute:55,totalminutes:655}},
    {name:'B',start:{hour:11,minute:5,totalminutes:665},end:{hour:12,minute:15,totalminutes:735}},
    {name:'Lunch',start:{hour:12,minute:15,totalminutes:735},end:{hour:12,minute:45,totalminutes:765}},
    {name:'A',start:{hour:12,minute:55,totalminutes:775},end:{hour:14,minute:5,totalminutes:845}},
    {name:'G',start:{hour:14,minute:15,totalminutes:855},end:{hour:15,minute:35,totalminutes:935}},
  ],
  Friday:[
    {name:'C',start:{hour:8,minute:25,totalminutes:505},end:{hour:9,minute:40,totalminutes:580}},
    {name:'Brunch',start:{hour:9,minute:40,totalminutes:580},end:{hour:9,minute:45,totalminutes:585}},
    {name:'D',start:{hour:9,minute:55,totalminutes:595},end:{hour:11,minute:5,totalminutes:665}},
    {name:'E',start:{hour:11,minute:15,totalminutes:675},end:{hour:12,minute:25,totalminutes:745}},
    {name:'Lunch',start:{hour:12,minute:25,totalminutes:745},end:{hour:12,minute:55,totalminutes:775}},
    {name:'F',start:{hour:13,minute:5,totalminutes:785},end:{hour:14,minute:15,totalminutes:855}},
    {name:'G',start:{hour:14,minute:25,totalminutes:865},end:{hour:15,minute:35,totalminutes:935}}
  ]
};
if (!window.cookie) try {window.cookie=localStorage;} catch (e) {window.cookie={getItem(a){return cookie[a];},setItem(a,b){cookie[a]=b;},removeItem(a){delete cookie[a];}}}
if (cookie.getItem('[gunn-web-app] scheduleapp.options')) {
  options=JSON.parse(cookie.getItem('[gunn-web-app] scheduleapp.options'));
  if (options[0]!==VERSION) {
    switch (options[0]) {
      case 1:
        options[0] = 2;
        options.push([periodstyles.SELF.label,periodstyles.SELF.colour]);
        break;
      default:
        options=null;
    }
  }
}
if (!options) {
  options=[VERSION];
  for (var i=0,arr=letras,len=arr.length,l=arr[i];i<len;i++,l=arr[i]) if (l!==0) {
    options.push([periodstyles[l].label,periodstyles[l].colour]);
  }
}
window.addEventListener("load",e=>{
  /* SCHEDULE APP */
  var formatOptions = cookie.getItem('[gunn-web-app] scheduleapp.formatOptions')?cookie.getItem('[gunn-web-app] scheduleapp.formatOptions').split('.'):[FORMATTING_VERSION,'12','full','0'];
  if (formatOptions[0] === '1') {
    formatOptions[0] = '2';
    formatOptions[3] = '0';
    cookie.setItem('[gunn-web-app] scheduleapp.formatOptions', formatOptions.join('.'));
  }
  if (formatOptions[0] !== FORMATTING_VERSION) {
    // you should be worried
    cookie.setItem('[gunn-web-app] scheduleapp.formatOptions', FORMATTING_VERSION+'.12.full.0');
    window.location.reload();
  }
  toEach('input[name=hour]',t=>t.addEventListener("click",e=>{
    formatOptions[1] = e.target.value==='h12' ? '12' : '24';
    cookie.setItem('[gunn-web-app] scheduleapp.formatOptions',formatOptions.join('.'));
    window.location.reload();
  },false));
  toEach('input[name=format]',t=>t.addEventListener("click",e=>{
    formatOptions[2] = e.target.value==='full' ? 'full' : 'compact';
    cookie.setItem('[gunn-web-app] scheduleapp.formatOptions',formatOptions.join('.'));
    window.location.reload();
  },false));
  toEach('input[name=self]',t=>t.addEventListener("click",e=>{
    formatOptions[3] = e.target.value==='hide' ? '0' : '1';
    cookie.setItem('[gunn-web-app] scheduleapp.formatOptions',formatOptions.join('.'));
    window.location.reload();
  },false));
  var scheduleapp;
  var weekwrapper=document.querySelector('#weekwrapper');
  function makeWeekHappen() {
    var innerHTML='',
    days=['S','M','T','W','&Theta;','F','S'],
    week=scheduleapp.getWeek();
    for (var i=0;i<7;i++) {
      innerHTML+=`<div${week[i].today?' class="today"':''}><h1>${days[i]}</h1>`;
      for (var j=0,arr=week[i],len=arr.length,period=arr[j];j<len;j++,period=arr[j]) innerHTML+=`<span style="background-color:${period.colour};" title="${period.label}"></span>`;
      innerHTML+=`</div>`;
    }
    weekwrapper.innerHTML=innerHTML;
    renderEvents();
  }
  var altSchedRegex = /schedule|extended|holiday|no students|break|development/i;
  var selfDays;
  var eventsul=document.querySelector('#events'),events={},
  months="January February March April May June July August September October November December".split(' ');
  function renderEvents() {
    var offset=scheduleapp.offset,d=new Date();
    eventsul.innerHTML=`<li><span class="secondary center">Loading</span></li>`;
    function actuallyRenderEvents(items) {
      var innerHTML=``;
      if (items.length) {
        for (var i=0;i<items.length;i++) {
          var timerange='';
          if (items[i].start) {
            var start=new Date(items[i].start),
            end=new Date(items[i].end);
            if (formatOptions[1]==='24') timerange=`${start.getHours()}:${('0'+start.getMinutes()).slice(-2)} &ndash; ${end.getHours()}:${('0'+end.getMinutes()).slice(-2)}`;
            else timerange=`${(start.getHours()-1)%12+1}:${('0'+start.getMinutes()).slice(-2)}${start.getHours()<12?'a':'p'}m &ndash; ${(end.getHours()-1)%12+1}:${('0'+end.getMinutes()).slice(-2)}${end.getHours()<12?'a':'p'}m`;
          }
          if (items[i].loc) {
            if (timerange) timerange+=' &mdash; ';
            timerange+=items[i].loc;
          }
          if (timerange) timerange=`<span class="secondary">${timerange}</span>`;
          innerHTML+=`<li><span class="primary">${items[i].name}</span><span class="secondary${items[i].error?' get-error':''}">${items[i].desc||""}</span>${timerange}</li>`;
        }
      } else {
        innerHTML=`<li><span class="secondary center">No events today :(</span></li>`;
      }
      eventsul.innerHTML=innerHTML;
    }
    if (events[offset]) actuallyRenderEvents(events[offset]);
    else {
      const dateDate = new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset).toISOString();
      ajax(
        `https://www.googleapis.com/calendar/v3/calendars/u5mgb2vlddfj70d7frf3r015h0@group.calendar.google.com/events?key=AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o&timeMin=${dateDate}&timeMax=${new Date(d.getFullYear(),d.getMonth(),d.getDate()+offset+1).toISOString()}&showDeleted=false&singleEvents=true&orderBy=startTime&fields=items(description%2Cend(date%2CdateTime)%2Clocation%2Cstart(date%2CdateTime)%2Csummary)`,
        json=>{
          json=JSON.parse(json).items;
          var e = [];
          for (var i=0;i<json.length;i++) {
            e[i]={
              start:json[i].start.dateTime,
              end:json[i].end.dateTime,
              name:json[i].summary,
              desc:json[i].description,
              loc:json[i].location
            };
          }
          events[offset]=e;
          if (scheduleapp.offset===offset) actuallyRenderEvents(events[offset]);
          var alternateJSON = json.filter(ev => altSchedRegex.test(ev.summary));
          var altSched = toAlternateSchedules(alternateJSON);
          var ugwitaAltObj = {};
          var change = false;
          if (cookie.getItem('[gunn-web-app] lite.alts'))
            ugwitaAltObj = JSON.parse(cookie.getItem('[gunn-web-app] lite.alts'));
          var selfDay = json.find(ev => ev.summary.includes('SELF'));
          if (selfDay) {
            var date = (selfDay.start.dateTime || selfDay.start.date).slice(5, 10);
            if (!selfDays.includes(date)) {
              selfDays.push(date);
              change = true;
              ugwitaAltObj.self = selfDays;
            }
          } else {
            const index = selfDays.indexOf(dateDate.slice(5, 10));
            if (~index) {
              selfDays.splice(index, 1);
              change = true;
              ugwitaAltObj.self = selfDays;
            }
          }
          Object.keys(altSched).forEach(date => {
            if (date) {
              ugwitaAltObj[date] = altSched[date];
              if (ugwaifyAlternates(alternates, date, altSched[date], alternateJSON[0].summary)) {
                change = true;
                return;
              }
            }
            if (ugwitaAltObj[date] !== undefined) {
              delete ugwitaAltObj[date];
              delete alternates[date.split('-').map(Number).join('-')];
              change = true;
            }
          });
          if (change) {
            cookie.setItem('[gunn-web-app] lite.alts', JSON.stringify(ugwitaAltObj));
            scheduleapp.offset = scheduleapp.offset;
            makeWeekHappen();
          }
        },
        e=>{
          events[offset]=[{name:'',desc:`${e}; couldn't get events; maybe you aren't connected to the internet?`,error:true}];
          if (scheduleapp.offset===offset) actuallyRenderEvents(events[offset]);
        }
      );
    }
  }
  function identifyPeriod(name) {
    name = name.toLowerCase();
    if (~name.indexOf("period")) {
      let letter = /\b[a-g]\b/.exec(name);
      if (letter) return letter[0].toUpperCase();
    }
    if (~name.indexOf("self")) return "SELF";
    else if (~name.indexOf("flex")
        || ~name.indexOf("assembl")
        || ~name.indexOf("tutorial"))
      return "Flex";
    else if (~name.indexOf("brunch") || ~name.indexOf("break")) return "Brunch";
    else if (~name.indexOf("lunch") || ~name.indexOf("turkey")) return "Lunch";
    else return name;
  }
  var daynames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  months=["January","February","March","April","May","June","July","August","September","October","November","December"];
  function ugwaifyAlternates(altObj, dayString, ugwitaData, desc) {
    if (ugwitaData === undefined) return true;
    var [month, day] = dayString.split('-').map(Number);
    var date;
    if (month > 6) date = new Date(2018, month - 1, day);
    else date = new Date(2019, month - 1, day);
    alternates[`${month}-${day}`] = {
      dayname: daynames[date.getDay()],
      day: date.getDay(),
      monthname: months[month],
      month: month,
      date: day,
      description: desc || 'good luck with our schedule lol',
      periods: ugwitaData === null ? []
        : ugwitaData.map(p => /collaboration|meeting/i.test(p.name)
          ? null
          : ({
            name: identifyPeriod(p.name),
            start: {
              totalminutes: p.start,
              hour: Math.floor(p.start / 60),
              minute: p.start % 60
            },
            end: {
              totalminutes: p.end,
              hour: Math.floor(p.end / 60),
              minute: p.end % 60
            }
          })).filter(a => a)
    };
    return true;
  }
  function alternateGet() {
    if (cookie.getItem('[gunn-web-app] lite.alts')) alternates=JSON.parse(cookie.getItem('[gunn-web-app] lite.alts'));
    else alternates={};
    selfDays = alternates.self || [];
    for (var dayString in alternates) {
      if (!dayString.includes('-')) continue;
      ugwaifyAlternates(alternates, dayString, alternates[dayString]);
    }
    for (var i=0;i<letras.length;i++) periodstyles[letras[i]]={label:options[i][0],colour:options[i][1]};
    scheduleapp=scheduleApp({
      element:document.querySelector('#schedulewrapper'),
      periods:periodstyles,
      normal:normalschedule,
      alternates:alternates,
      selfDays: selfDays,
      offset:0,
      update:true,
      h24: formatOptions[1] === '24',
      compact: formatOptions[2] === 'compact',
      self: +formatOptions[3]
    });
    makeWeekHappen();
  }
  alternateGet();
  var datepicker=new DatePicker({d:13,m:7,y:2018},{d:31,m:4,y:2019}),
  d=new Date();
  datepicker.day={d:d.getDate(),m:d.getMonth(),y:d.getFullYear()};
  datepicker.onchange=e=>{
    if (e!==null) {
      var d=new Date(e.y,e.m,e.d).getTime(),
      today=new Date().getTime();
      scheduleapp.offset=Math.floor((d-today)/86400000)+1;
      makeWeekHappen();
    }
  };
  datepicker.wrapper.classList.add('hide');
  datepicker.wrapper.style.position='fixed';
  document.body.appendChild(datepicker.wrapper);
  document.querySelector('#datepicker').addEventListener("click",e=>{
    if (datepicker.wrapper.classList.contains('hide')) {
      datepicker.wrapper.classList.remove('hide');
      function close(e) {
        if (!datepicker.wrapper.contains(e.target)) {
          datepicker.wrapper.classList.add('hide');
          document.removeEventListener("click",close,false);
        }
      }
      setTimeout(()=>{
        document.addEventListener("click",close,false);
      },0);
    }
  },false);
  document.querySelector('#plihieraux').addEventListener("click",e=>{
    var proposal={d:datepicker.day.d-1,m:datepicker.day.m,y:datepicker.day.y};
    if (datepicker.inrange(proposal)) datepicker.day=proposal;
  },false);
  document.querySelector('#plimorgaux').addEventListener("click",e=>{
    var proposal={d:datepicker.day.d+1,m:datepicker.day.m,y:datepicker.day.y};
    if (datepicker.inrange(proposal)) datepicker.day=proposal;
  },false);
  if (cookie.getItem('global.theme'))
    document.querySelector(`input[name=theme][value=${cookie.getItem('global.theme')}]`).checked=true;
  else
    document.querySelector('input[name=theme][value=light]').checked=true;
  document.querySelector(`input[name=hour][value=h${formatOptions[1]}]`).checked=true;
  document.querySelector(`input[name=format][value=${formatOptions[2]}]`).checked=true;
  document.querySelector(`input[name=self][value=${['hide','show'][formatOptions[3]]}]`).checked=true;

  /* CUSTOMISE PERIODS */
  var materialcolours='f44336 E91E63 9C27B0 673AB7 3F51B5 2196F3 03A9F4 00BCD4 009688 4CAF50 8BC34A CDDC39 FFEB3B FFC107 FF9800 FF5722 795548 9E9E9E 607D8B'.split(' ');
  function materialInput(labeltext) {
    var inputwrapper=document.createElement("div"),
    label=document.createElement("label"),
    input=document.createElement("input"),
    line=document.createElement("div");
    inputwrapper.classList.add('customiser-inputwrapper');
    label.classList.add('customiser-label');
    label.innerHTML=labeltext;
    input.classList.add('customiser-input');
    input.setAttribute('aria-label','Set label for '+labeltext);
    input.addEventListener("change",e=>{
      if (input.value) inputwrapper.classList.add('filled');
      else inputwrapper.classList.remove('filled');
    },false);
    input.addEventListener("mouseenter",e=>{
      inputwrapper.classList.add('hover');
    },false);
    input.addEventListener("mouseleave",e=>{
      inputwrapper.classList.remove('hover');
    },false);
    input.addEventListener("focus",e=>{
      inputwrapper.classList.add('focus');
    },false);
    input.addEventListener("blur",e=>{
      inputwrapper.classList.remove('focus');
    },false);
    line.classList.add('customiser-line');
    inputwrapper.appendChild(label);
    inputwrapper.appendChild(input);
    inputwrapper.appendChild(line);
    return {
      wrapper:inputwrapper,
      label:label,
      input:input,
      line:line
    };
  }
  function addPeriodCustomisers(elem) {
    function period(name,id,colour='#FF594C',val='') {
      var div=document.createElement("div"),
      pickertrigger=document.createElement("button"),
      picker=new ColourPicker(e=>{
        pickertrigger.style.backgroundColor=e;
        if (scheduleapp) scheduleapp.setPeriod(id,'',e);
        options[letras.indexOf(id)][1]=e;
        cookie.setItem('[gunn-web-app] scheduleapp.options',JSON.stringify(options));
        if (picker.darkness()>125) {
          pickertrigger.classList.add('ripple-dark');
          pickertrigger.classList.remove('ripple-light');
        } else {
          pickertrigger.classList.add('ripple-light');
          pickertrigger.classList.remove('ripple-dark');
        }
      }),
      input=materialInput(name);
      div.classList.add('customiser-wrapper');
      ripple(pickertrigger);
      pickertrigger.classList.add('material');
      pickertrigger.classList.add('customiser-colour');
      pickertrigger.addEventListener("click",e=>{
        picker.trigger(pickertrigger);
      },false);
      picker.colour=colour;
      div.appendChild(pickertrigger);
      if (val) {
        input.input.value=val;
        input.wrapper.classList.add('filled');
      }
      input.input.addEventListener("change",e=>{
        if (scheduleapp) scheduleapp.setPeriod(id,input.input.value);
        options[letras.indexOf(id)][0]=input.input.value;
        cookie.setItem('[gunn-web-app] scheduleapp.options',JSON.stringify(options));
      },false);
      div.appendChild(input.wrapper);
      elem.appendChild(div);
      var t=document.createElement("div");
      t.classList.add('customiser-colourwrapper');
      for (var i=0,arr=materialcolours,len=arr.length,c=arr[i];i<len;i++,c=arr[i])
        (c=>{
          var s=document.createElement("span");
          s.classList.add('customiser-materialcolour');
          s.addEventListener("click",e=>{
            picker.colour=c;
          },false);
          s.style.backgroundColor=c;
          t.appendChild(s);
        })('#'+c);
      var s=document.createElement("span");
      s.classList.add('customiser-materialcolour');
      s.classList.add('customiser-blackwhite');
      s.addEventListener("click",e=>{
        picker.colour=document.body.classList.contains('light')?'#000000':'#ffffff';
      },false);
      t.appendChild(s);
      picker.window.appendChild(t);
      return period;
    }
    return period;
  }
  var periodCustomisers=document.createDocumentFragment();
  var customiserAdder = addPeriodCustomisers(periodCustomisers)
    ('Period A','A',options[1][1],options[1][0])
    ('Period B','B',options[2][1],options[2][0])
    ('Period C','C',options[3][1],options[3][0])
    ('Period D','D',options[4][1],options[4][0])
    ('Period E','E',options[5][1],options[5][0])
    ('Period F','F',options[6][1],options[6][0])
    ('Period G','G',options[7][1],options[7][0])
    ('Flex','Flex',options[8][1],options[8][0]);
  if (+formatOptions[3]) customiserAdder = customiserAdder('SELF','SELF',options[11][1],options[11][0]);
  customiserAdder('Brunch','Brunch',options[9][1],options[9][0])
    ('Lunch','Lunch',options[10][1],options[10][0]);
  document.querySelector('.section.options').insertBefore(periodCustomisers,document.querySelector('#periodcustomisermarker'));
},false);
