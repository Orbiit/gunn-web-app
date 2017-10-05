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
      if (localStorage.getItem('[gunn-web-app] scheduleapp.psa')!==e) {
        if (localStorage.getItem('[gunn-web-app] scheduleapp.psa')) {
          psa.innerHTML=e;
          psa.parentNode.classList.add("show");
        }
        localStorage.setItem('[gunn-web-app] scheduleapp.psa',e);
      }
    },
    e=>{
      document.querySelector('#psa').innerHTML=`<p>${e}; couldn't get last PSA; maybe you aren't connected to the internet?</p>`+localStorage.getItem('[gunn-web-app] scheduleapp.psa');
    }
  );
  zoomImage(document.querySelector('#mapimage'));
  var maptoggle=document.querySelector('#maptoggle');
  if (window.googleMapsFailed) {
    maptoggle.innerHTML=`Google Maps not loading! Maybe you aren't connected to the internet?`;
  } else {
    maptoggle.innerHTML='';
    var btn=document.createElement("button"),
    img=document.querySelector('#mapimage'),
    google=document.querySelector('#mapgoogle'),
    usingGoogle=false,
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
      } else {
        img.style.display='block',
        google.style.display='none',
        btncontent.nodeValue='use google maps';
      }
    },false);
    btn.appendChild(btncontent);
    maptoggle.appendChild(btn);
  }
},false);
