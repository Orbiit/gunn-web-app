var colours={'red':'f44336','deep-orange':'FF5722','orange':'FF9800','amber':'FFC107','yellow':'FFEB3B','lime':'CDDC39','light-green':'8BC34A','green':'4CAF50','teal':'009688','cyan':'00BCD4','light-blue':'03A9F4','blue':'2196F3','indigo':'3F51B5','deep-purple':'673AB7','purple':'9C27B0','pink':'E91E63','white':'FFFFFF','grey':'9E9E9E','blue-grey':'607D8B','black':'000000','brown':'795548'},
blacktext={yellow:true,white:true,"blue-grey lighten-4":true,"blue-grey lighten-3":true},
options,
schedule=[
  [
    {name:'Sunday',begin:'0000',end:'2400'}
  ],[
    {name:'Before school starts',begin:'0000',end:'0825'},
    {name:':0',begin:'0825',end:'0945'},
    {name:'Brunch',begin:'0945',end:'1000'},
    {name:':1',begin:'1000',end:'1115'},
    {name:'Passing period',begin:'1115',end:'1125'},
    {name:':2',begin:'1125',end:'1240'},
    {name:'Lunch',begin:'1240',end:'1320'},
    {name:':5',begin:'1320',end:'1435'},
    {name:'School\'s over!',begin:'1435',end:'2400'}
  ],[
    {name:'Before school starts',begin:'0000',end:'0825'},
    {name:':3',begin:'0825',end:'0945'},
    {name:'Brunch',begin:'0945',end:'1000'},
    {name:'Flex',begin:'1000',end:'1050'},
    {name:'Passing period',begin:'1050',end:'1100'},
    {name:':4',begin:'1100',end:'1215'},
    {name:'Lunch',begin:'1215',end:'1255'},
    {name:':0',begin:'1255',end:'1415'},
    {name:'Passing period',begin:'1415',end:'1425'},
    {name:':6',begin:'1425',end:'1540'},
    {name:'School\'s over!',begin:'1540',end:'2400'}
  ],[
    {name:'Before school starts',begin:'0000',end:'0825'},
    {name:':1',begin:'0825',end:'0950'},
    {name:'Brunch',begin:'0950',end:'1005'},
    {name:':2',begin:'1005',end:'1125'},
    {name:'Passing period',begin:'1125',end:'1135'},
    {name:':3',begin:'1135',end:'1255'},
    {name:'Lunch',begin:'1255',end:'1335'},
    {name:':5',begin:'1335',end:'1455'},
    {name:'School\'s over!',begin:'1455',end:'2400'}
  ],[
    {name:'Before school starts',begin:'0000',end:'0825'},
    {name:':4',begin:'0825',end:'0950'},
    {name:'Brunch',begin:'0950',end:'1005'},
    {name:'Flex',begin:'1005',end:'1055'},
    {name:'Passing period',begin:'1055',end:'1105'},
    {name:':1',begin:'1105',end:'1215'},
    {name:'Lunch',begin:'1215',end:'1255'},
    {name:':0',begin:'1255',end:'1405'},
    {name:'Passing period',begin:'1405',end:'1415'},
    {name:':6',begin:'1415',end:'1535'},
    {name:'School\'s over!',begin:'1535',end:'2400'}
  ],[
    {name:'Before school starts',begin:'0000',end:'0825'},
    {name:':2',begin:'0825',end:'0940'},
    {name:'Brunch',begin:'0940',end:'0955'},
    {name:':3',begin:'0955',end:'1105'},
    {name:'Passing period',begin:'1105',end:'1115'},
    {name:':4',begin:'1115',end:'1225'},
    {name:'Lunch',begin:'1225',end:'1305'},
    {name:':5',begin:'1305',end:'1415'},
    {name:'Passing period',begin:'1415',end:'1425'},
    {name:':6',begin:'1425',end:'1535'},
    {name:'School\'s over!',begin:'1535',end:'2400'}
  ],[
    {name:'Saturday',begin:'0000',end:'2400'}
  ]
],timecolours={
  "Sunday":"red",
  "Saturday":"red",
  "Before school starts":"blue-grey lighten-3",
  "School's over!":"blue-grey lighten-3",
  "Brunch":"blue-grey lighten-2",
  "Lunch":"blue-grey lighten-2",
  "Passing period":"blue-grey lighten-4",
  "Flex":"blue-grey darken-2"
},
weekdays='Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(' ');
function settings(set) {
  if (set) {
    $('#settings .modal-content > div').each(function (i) {
      this.querySelector('input').value=set[i].name;
      $(this).css('--colour','#'+colours[set[i].colour]);
      $(this.querySelector('a')).css('background-color','#'+colours[set[i].colour]);
      if (blacktext[set[i].colour]) $(this.querySelector('i')).addClass('black-text');
      else $(this.querySelector('i')).removeClass('black-text');
    });
  } else {
    var periods=[];
    $('#settings .modal-content > div').each(function () {
      periods.push({
        name:this.querySelector('input').value,
        colour:(t=>{
          for (var s in colours) if (colours[s]===t) return s;
          return '';
        })($(this).css('--colour').slice(1))
      });
    });
    return periods;
  }
}
function makeDayHappen(day,notime=false,id='day') {
  var now;
  function makeDays() {
    var t=[];
    for (var period of schedule[day]) {
      var s=period.name[0]===':'?options[period.name.slice(1)].colour:timecolours[period.name];
      t.push(
        $('<div></div>').addClass('card '+s).append(
          $('<div></div>').addClass('card-content '+(blacktext[s]?'black-text':'white-text')).append(
            $('<span></span>').addClass('card-title').append(period.name[0]===':'?options[period.name.slice(1)].name:period.name),
            $('<p></p>').append(weirdTo24H(period.begin)+' &ndash; '+weirdTo24H(period.end)),
            notime?undefined:$('<p></p>').append(
              inPast(period.end)?
              'Ended <strong>'+minTo24H(-timeDist(period.end))+'</strong> ago.':
              inPast(period.begin)?
              (now=schedule[day].indexOf(period),'Ending in <strong>'+minTo24H(timeDist(period.end))+'</strong>; started <strong>'+minTo24H(-timeDist(period.begin))+'</strong> ago.'):
              'Starting in <strong>'+minTo24H(timeDist(period.begin))+'</strong>.'
            )
          )
        )
      );
    }
    return t;
  }
  $('#'+id).append(...makeDays());
  return now;
}
function inPast(weird) {
  var d=new Date();
  return d.getMinutes()+60*d.getHours()>(+weird.slice(0,2)*60)+ +weird.slice(2);
}
function timeDist(weird) {
  var d=new Date();
  return ((+weird.slice(0,2)*60)+ +weird.slice(2))-(d.getMinutes()+60*d.getHours());
}
function minTo24H(min) {
  return (min>60?Math.floor(min/60)+' hours, ':'')+(min%60===0?'':Math.floor(min%60)+' minutes');
}
function weirdTo24H(weird) {
  return (+weird.slice(0,2)%24)+':'+weird.slice(2);
}
function update(id='day',offset=0) {
  var d=(new Date().getDay()+offset)%7;
  $('#'+id).html('<h1 class="center">'+weekdays[d]+'</h1>'+(offset===0?'<div class="progress red lighten-4"><div class="determinate red" style="width: 70%" id="prog"></div></div><p id="time"></p>':''));
  var t=makeDayHappen(d,offset!==0,id),
  s;
  if (offset===0) {
    s='<strong>'+minTo24H(timeDist(schedule[d][t].end))+'</strong> left in <strong>'+(
      schedule[d][t].name[0]===':'?
      options[schedule[d][t].name.slice(1)].name:
      schedule[d][t].name
    )+'</strong>'+(t+1<schedule[d].length?' until <strong>'+(
      schedule[d][t+1].name[0]===':'?
      options[schedule[d][t+1].name.slice(1)].name:
      schedule[d][t+1].name
    )+'</strong>':'');
    $('#time').append(s);
    $('#prog').css('width',(timeDist(schedule[d][t].begin)/(timeDist(schedule[d][t].begin)-timeDist(schedule[d][t].end))*100)+'%');
  }
}
function createInput(period,defaultcolour='black',name='') {
  function generateColours() {
    var t=[];
    for (var c in colours) (c=>{
      t.push(
        $('<li></li>').addClass(c).click(e=>{
          b.css('--colour','#'+colours[c]);
          a.css('background-color','#'+colours[c]);
          if (blacktext[c]) z.addClass('black-text');
          else z.removeClass('black-text');
        }).append(
          $('<a></a>').addClass((blacktext[c]?'black-text':'white-text waves-light')+' waves-effect').attr('href','#!').append(c)
        )
      );
    })(c);
    return t;
  }
  var z=$('<i></i>').addClass('large material-icons prefix'+(blacktext[colours[defaultcolour]]?' black-text':'')).append('color_lens'),
  a=$('<a></a>').addClass('dropdown-button btn-floating btn-large waves-effect waves-light waves-circle tooltipped right')
  .css('background-color','#'+colours[defaultcolour])
  .attr('href','#')
  .attr('data-activates','colour'+period)
  .attr('data-position','right')
  .attr('data-tooltip','Represent period '+period+' with a colour')
  .append(z),
  b=$('<div></div>').addClass('row').css('--colour','#'+colours[defaultcolour]).append(
    $('<div></div>').addClass('col s3 m2 xl1').append(a),
    $('<div></div>').addClass('col s9 m10 xl11 input-field').append(
      $('<input>')
      .attr('placeholder','Period '+period+' name')
      .attr('id','period'+period)
      .attr('type','text')
      .val(name),
      $('<label></label>').addClass('active').attr('for','period'+period).append('Period '+period)
    )
  );
  $('#settings .modal-content').append(b);
  $('body').append(
    $('<ul></ul>').attr('id','colour'+period).addClass('dropdown-content').append(...generateColours())
  );
  $('.dropdown-button').dropdown({
      constrainWidth:false,
      belowOrigin:true
  });
  $('.tooltipped').tooltip({delay: 50});
  Materialize.updateTextFields();
}
$(document).ready(function(){
  createInput('A','red','Period A');
  createInput('B','blue','Period B');
  createInput('C','yellow','Period C');
  createInput('D','brown','Period D');
  createInput('E','orange','Period E');
  createInput('F','purple','Period F');
  createInput('G','green','Period G');
  if (localStorage.getItem('[gunn-web-app] schedule.options')) {
    options=JSON.parse(localStorage.getItem('[gunn-web-app] schedule.options'));
    settings(options);
  } else {
    options=settings();
    localStorage.setItem('[gunn-web-app] schedule.options',JSON.stringify(options));
    window.location.reload();
  }
  $('.modal').modal();
  $('.simplecolourwrapper input').addClass('browser-default').attr('type','text');
  $('#dontsavesets').click(e=>settings(options));
  $('#savesets').click(e=>{
    options=settings();
    localStorage.setItem('[gunn-web-app] schedule.options',JSON.stringify(options));
    update();
    update('tom1',1);
    update('tom2',2);
    update('tom3',3);
    update('tom4',4);
    update('tom5',5);
    update('tom6',6);
    update('tom7',7);
  });
  update();
  setTimeout(()=>{
    update();
    setInterval(()=>{
      update();
    },60000);
  },Math.floor(new Date()/1000)%60);
  var d=new Date().getDay();
  $('#tomday2').html(weekdays[(d+2)%7]);
  $('#tomday3').html(weekdays[(d+3)%7]);
  $('#tomday4').html(weekdays[(d+4)%7]);
  $('#tomday5').html(weekdays[(d+5)%7]);
  $('#tomday6').html(weekdays[(d+6)%7]);
  update('tom1',1);
  update('tom2',2);
  update('tom3',3);
  update('tom4',4);
  update('tom5',5);
  update('tom6',6);
  update('tom7',7);
  $('ul.tabs').tabs({
    swipeable:true
  });
});
