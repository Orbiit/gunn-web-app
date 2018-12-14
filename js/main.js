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
  ripple("#footer > ul > li, button.material");
  toEach('input[name=theme]',t=>t.addEventListener("click",e=>{
    if (e.target.value==='light') {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      document.querySelector('input[name=theme][value=light]').checked=true;
      cookie.setItem('global.theme','light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      document.querySelector('input[name=theme][value=dark]').checked=true;
      cookie.setItem('global.theme','dark');
    }
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
      document.querySelector('#psa').innerHTML=`<p class="get-error">${e}; couldn't get last PSA; maybe you aren't connected to the internet?</p>`+localStorage.getItem('[gunn-web-app] scheduleapp.psa');
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
      gradeCalc.output.innerHTML = `You <strong>don't need to study</strong>; even if you score 0%, you'll be above your threshold.`;
    } else if (worth === 0 || isNaN(result)) {
      gradeCalc.output.innerHTML = `Please don't enter so many zeroes.`;
    } else {
      gradeCalc.output.innerHTML = `You'll need to score at least <strong>${result}%</strong> to keep your parents happy.`;
      if (result > 100) gradeCalc.output.innerHTML += ` If there's no extra credit, you're screwed.`;
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
  btncontent.nodeValue='use google maps';
  btn.classList.add('material');
  ripple(btn);
  btn.addEventListener("click",e=>{
    usingGoogle=!usingGoogle;
    if (usingGoogle) {
      img.style.display='none',
      google.style.display='block',
      btncontent.nodeValue='use the image';
      if (!googleLoaded) {
        googleLoaded = true;
        var script = document.createElement('script');
        script.onerror = () => {
          if (usingGoogle) btn.click();
          maptoggle.innerHTML=`Google Maps not loading! Maybe you aren't connected to the internet?`;
        };
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBl_NvT8EI28SqW-3qKVNEfMOJ9NftkDmk&callback=initMap';
        document.body.appendChild(script);
      }
    } else {
      img.style.display='block',
      google.style.display='none',
      btncontent.nodeValue='use google maps';
    }
  },false);
  btn.appendChild(btncontent);
  maptoggle.appendChild(btn);
  try {
    window.applicationCache.addEventListener('updateready',e=>{
      if (window.applicationCache.status===window.applicationCache.UPDATEREADY) window.location.reload();
    },false);
  } catch (e) {}
  document.getElementById('force-update').addEventListener('click', e => {
    window.applicationCache.update();
    setTimeout(() => window.location.reload(), 1000);
  });
  document.getElementById('reload').addEventListener('click', e => {
    window.location.reload();
  });
  if (window === window.parent) {
    document.getElementById('ugwa-ga').style.display = 'none';
  } else {
    document.getElementById('ugwa-ga-ok').addEventListener('click', e => {
      window.parent.location.replace('.');
    });
  }
},false);
