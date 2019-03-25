/**
 * URL params
 * @param {section.js} section - the section to be viewed
 * @param {lists.js} club-search - default search content in club search bar
 * @param {lists.js} staff-search - deault search content in staff search bar
 * @param {schedule.js} date - the date whose schedule is to be viewed
 */

function ajax(url,callback,error) {
  var xmlHttp=new XMLHttpRequest();
  xmlHttp.onreadystatechange=()=>{
    if (xmlHttp.readyState===4) xmlHttp.status===200?callback(xmlHttp.responseText):error?error(xmlHttp.status):0;
  };
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
}
function toEach(query,fn) {
  var elems=document.querySelectorAll(query);
  for (var i=0,len=elems.length;i<len;i++) fn(elems[i],i);
}
function initMap() {
  var map=new google.maps.Map(document.getElementById('mapgoogle'), {
    zoom:18,
    center:{lat:37.400922,lng:-122.133584}
  });
  map.setMapTypeId('satellite');
  var imageBounds={
    north:37.402294,
    south:37.398824,
    east:-122.130923,
    west:-122.136685
  };
  historicalOverlay=new google.maps.GroundOverlay(
    'http://i.imgur.com/cnsWqDz.png',
    imageBounds
  );
  historicalOverlay.setMap(map);
}
window.addEventListener("load",e=>{
  document.title = localize('appname');
  if (window !== window.parent) {
    document.body.classList.add('anti-ugwaga');
    document.body.innerHTML += `<div id="anti-ugwaga"><span>${localize('anti-ugwaga')}</span></div>`;
    document.addEventListener('click', e => {
      window.parent.location.replace('.');
    });
    return;
  }
  ripple("#footer > ul > li, button.material");
  let tabFocus = false;
  document.addEventListener('keydown', e => {
  	if (e.keyCode === 9 || e.keyCode === 13) {
    	document.body.classList.add('tab-focus');
      tabFocus = true;
    }
  });
  document.addEventListener('keyup', e => {
  	if (e.keyCode === 9 || e.keyCode === 13) {
      tabFocus = false;
    }
  });
  document.addEventListener('focusin', e => {
  	if (!tabFocus) {
      document.body.classList.remove('tab-focus');
    }
  });
  toEach('input[name=theme]',t=>t.addEventListener("click",e=>{
    document.body.classList.remove(cookie.getItem('global.theme')||'light');
    document.body.classList.add(e.target.value);
    t.checked = true;
    cookie.setItem('global.theme',e.target.value);
  },false));
  var secondsCounter=document.querySelector('#seconds');
  function updateSeconds() {
    var d=new Date();
    secondsCounter.innerHTML=('0'+d.getSeconds()).slice(-2);
    secondsCounter.style.setProperty('--rotation',`rotate(${d.getSeconds()*6}deg)`);
    if (d.getSeconds()===0) {
      secondsCounter.classList.add('notransition'); // cheaty way to deal with getting from :59 to :00
      setTimeout(()=>{
        secondsCounter.classList.remove('notransition');
      },300);
    }
    setTimeout(updateSeconds,1010-d.getMilliseconds());
  }
  updateSeconds();
  var psa=document.querySelector('#psadialog .content');
  ajax(
    (window.location.protocol==='file:'?"https://orbiit.github.io/gunn-web-app/":"")+"psa.html",
    e=>{
      document.querySelector('#psa').innerHTML=e;
      if (localStorage.getItem('[gunn-web-app] scheduleapp.psa')!==e+'v1') {
        if (localStorage.getItem('[gunn-web-app] scheduleapp.psa')) {
          psa.innerHTML=e;
          psa.parentNode.classList.add("show");
          document.querySelector('#psadialog > .buttons > .close').addEventListener('click', () => {
            localStorage.setItem('[gunn-web-app] scheduleapp.psa',e+'v1');
          }, {once: true});
        } else {
          localStorage.setItem('[gunn-web-app] scheduleapp.psa',e+'v1');
        }
      }
    },
    e=>{
      document.querySelector('#psa').innerHTML=`<p class="get-error">${e}${localize('psa-error')}</p>`+localStorage.getItem('[gunn-web-app] scheduleapp.psa');
    }
  );
  var gradeCalc = {
    current: document.getElementById('current-grade'),
    worth: document.getElementById('finals-worth'),
    minimum: document.getElementById('minimum-grade'),
    output: document.getElementById('grade-output')
  };
  function setOutput() {
    var current = (+gradeCalc.current.value || 0) / 100,
    worth = (+gradeCalc.worth.value || 0) / 100,
    minimum = (+gradeCalc.minimum.value || 0) / 100,
    result = Math.round((minimum - current * (1 - worth)) / worth * 10000) / 100;
    if (result < 0) {
      gradeCalc.output.innerHTML = `${localize('no-study-before-emph')}<strong>${localize('no-study-emph')}</strong>${localize('no-study-after-emph')}`;
    } else if (worth === 0 || isNaN(result)) {
      gradeCalc.output.innerHTML = localize('zero-error');
    } else {
      gradeCalc.output.innerHTML = `${localize('minscore-before-emph')}<strong>${result}%</strong>${localize('minscore-after-emph')}`;
      if (result > 100) gradeCalc.output.innerHTML += localize('minscore-too-high-addendum');
    }
  }
  setOutput();
  var badChars = /[^0-9.]|\.(?=[^.]*\.)/g;
  [gradeCalc.current, gradeCalc.worth, gradeCalc.minimum].forEach(input => {
    input.addEventListener("keypress", e=>{
      let char = String.fromCharCode(e.charCode);
      if (!'0123456789.'.includes(char)) {
        e.preventDefault();
        return false;
      }
    }, false);
    input.addEventListener("input", e=>{
      if (badChars.test(input.value)) {
        input.value = +input.value.replace(badChars, '') || 0;
      }
      setOutput();
    }, false);
    input.addEventListener('change', e => {
      input.value = +input.value.replace(badChars, '') || 0;
      setOutput();
    });
  });
  zoomImage(document.querySelector('#mapimage'));
  var maptoggle=document.querySelector('#maptoggle');
  var btn=document.createElement("button"),
  img=document.querySelector('#mapimage'),
  google=document.querySelector('#mapgoogle'),
  usingGoogle=false,
  googleLoaded = false,
  btncontent=document.createTextNode('');
  img.style.display='block',
  google.style.display='none',
  btncontent.nodeValue=localize('gmaps');
  btn.classList.add('material');
  ripple(btn);
  btn.addEventListener("click",e=>{
    usingGoogle=!usingGoogle;
    if (usingGoogle) {
      img.style.display='none',
      google.style.display='block',
      btncontent.nodeValue=localize('image');
      if (!googleLoaded) {
        googleLoaded = true;
        var script = document.createElement('script');
        script.onerror = () => {
          if (usingGoogle) btn.click();
          maptoggle.innerHTML=localize('gmaps-error');
        };
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBl_NvT8EI28SqW-3qKVNEfMOJ9NftkDmk&callback=initMap';
        document.body.appendChild(script);
      }
    } else {
      img.style.display='block',
      google.style.display='none',
      btncontent.nodeValue=localize('gmaps');
    }
  },false);
  btn.appendChild(btncontent);
  maptoggle.appendChild(btn);
  try {
    window.applicationCache.addEventListener('updateready',e=>{
      if (window.applicationCache.status===window.applicationCache.UPDATEREADY) {
        try {applicationCache.swapCache();} catch (e) {}
        window.location.reload();
      }
    },false);
  } catch (e) {}
  document.getElementById('force-update').addEventListener('click', e => {
    window.applicationCache.update();
    // setTimeout(() => window.location.reload(), 1000);
  });
  document.getElementById('reload').addEventListener('click', e => {
    window.location.reload();
  });
  document.getElementById('trick-cache').addEventListener('click', e => {
    window.location = '?' + Date.now();
  });
  function getHTMLString(id) {
    return langs[currentLang].html[id] || langs.en.html[id] || id;
  }
  const langStringRegex = /\{\{([a-z0-9\-]+)\}\}/;
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const exec = langStringRegex.exec(walker.currentNode.nodeValue);
    if (exec) {
      textNodes.push(exec[1], walker.currentNode);
      walker.currentNode.nodeValue = getHTMLString(exec[1]);
    }
  }
  const fragment = document.createDocumentFragment();
  Object.keys(availableLangs).forEach(lang => {
    const p = document.createElement('p');
    p.classList.add('radio-wrapper');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'language';
    input.value = lang;
    input.className = 'material-radio';
    if (lang === currentLang) input.checked = true;
    else {
      input.addEventListener('click', e => {
        cookie.setItem('[gunn-web-app] language', lang);
        window.location.reload();
      });
    }
    p.appendChild(input);
    const label = document.createElement('label');
    label.textContent = availableLangs[lang];
    p.appendChild(label);
    fragment.appendChild(p);
  });
  document.getElementById('langs').appendChild(fragment);
},false);
