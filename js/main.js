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
      document.querySelector('#psa').innerHTML=`<p>${e}; either you aren't connected to the internet or you should try reloading.</p>`+localStorage.getItem('[gunn-web-app] scheduleapp.psa');
    }
  );
},false);
