/**
 * URL params
 * @param {section.js} section - the section to be viewed
 * @param {lists.js} club-search - default search content in club search bar
 * @param {lists.js} staff-search - deault search content in staff search bar
 * @param {schedule.js} date - the date whose schedule is to be viewed
 * @param {barcodes.js} barcode - the barcode to display
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

// BEGIN MASSIVE PASTE FROM UGWITA
const calendarURL = "https://www.googleapis.com/calendar/v3/calendars/"
  + encodeURIComponent("u5mgb2vlddfj70d7frf3r015h0@group.calendar.google.com")
  + "/events?singleEvents=true&fields="
  + encodeURIComponent("items(description,end(date,dateTime),start(date,dateTime),summary)")
  + "&key=AIzaSyDBYs4DdIaTjYx5WDz6nfdEAftXuctZV0o";
const firstDay = "2019-08-13T00:00:00.000-07:00";
const lastDay = "2020-06-04T23:59:59.999-07:00";
const keywords = ["self", "schedule", "extended", "holiday", "no students", "break", "development"];
function refreshAlts() {
  return getAlternateSchedules().then(alts => {
    const today = new Date();
    alts.lastGenerated = [today.getFullYear(), today.getMonth(), today.getDate()];
    cookie.setItem("[gunn-web-app] alts.2019-20", JSON.stringify(alts));
  });
}
function getAlternateSchedules() {
  return Promise.all(keywords.map(keyword => fetch(calendarURL
      + `&timeMin=${encodeURIComponent(firstDay)}&timeMax=${encodeURIComponent(lastDay)}&q=${keyword}`)
    .then(res => res.json())))
  .then(results => {
    let alternateSchedules = {};
    results.slice(1).forEach(events => Object.assign(alternateSchedules, toAlternateSchedules(events.items)));
    const selfDays = results[0].items
      .filter(day => day.summary.includes('SELF'))
      .map(day => (day.start.dateTime || day.start.date).slice(5, 10));
    alternateSchedules.self = selfDays;
    return alternateSchedules;
  });
}
const schedulesReady = cookie.getItem('[gunn-web-app] alts.2019-20') ? Promise.resolve() : refreshAlts();
// END MASSIVE PASTE FROM UGWITA

if (cookie.getItem('[gunn-web-app] lite.alts')) cookie.removeItem('[gunn-web-app] lite.alts'); // delete old 2019-20 alts; can remove by, er, how about 2019-09-01?
let savedClubs = {}, onSavedClubsUpdate = null;
if (cookie.getItem('[gunn-web-app] club-list.spring18-19')) {
  try {
    savedClubs = JSON.parse(cookie.getItem('[gunn-web-app] club-list.spring18-19'));
  } catch (e) {}
}
function saveSavedClubs() {
  cookie.setItem('[gunn-web-app] club-list.spring18-19', JSON.stringify(savedClubs));
  if (onSavedClubsUpdate) onSavedClubsUpdate();
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
  schedulesReady.then(initSchedule);
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
      if (cookie.getItem('[gunn-web-app] scheduleapp.psa')!==e) {
        if (cookie.getItem('[gunn-web-app] scheduleapp.psa')) {
          psa.innerHTML=e;
          psa.parentNode.classList.add("show");
          document.querySelector('#psadialog > .buttons > .close').addEventListener('click', () => {
            cookie.setItem('[gunn-web-app] scheduleapp.psa',e);
          }, {once: true});
        } else {
          cookie.setItem('[gunn-web-app] scheduleapp.psa',e);
        }
      }
    },
    e=>{
      document.querySelector('#psa').innerHTML=`<p class="get-error">${e}${localize('psa-error')}</p>`+cookie.getItem('[gunn-web-app] scheduleapp.psa');
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
    if (result <= 0) {
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
  document.getElementById('reload').addEventListener('click', e => {
    window.location.reload();
  });
  document.getElementById('trick-cache').addEventListener('click', e => {
    window.location = '?' + Date.now();
  });
  const MAX_LENGTH = 50;
  const illegalChars = /[^bcdfghjklmnpqrstvwxyz .,!?0-9\-;'/~#%&()":]|\s+$|^\s+|\s+(?=\s)/gi;
  const trim = /\s+$|^\s+|\s+(?=\s)/g;
  const output = document.getElementById('chat');
  const input = document.getElementById('msg-content');
  const sendInput = document.getElementById('send');
  const preview = document.getElementById('preview');
  const FETCH_DELAY = 5000;
  let username, getInput, jsonStore;
  input.placeholder = localize('send-msg', 'placeholders');
  document.getElementById('open-chat').addEventListener('click', e => {
    document.body.classList.add('chat-enabled');
    output.value = 'Loading...\n';
    fetch('./chats.txt?v=' + Date.now()).then(r => r.text()).then(urls => {
      urls = urls.split(/\r?\n/);
      jsonStore = urls.find(url => url[0] === 'h');
      if (!jsonStore) return Promise.reject('No current chat open.');
      let newInput;
      getInput = new Promise(res => newInput = res);
      sendInput.addEventListener('click', e => {
        newInput(input.value.replace(illegalChars, '').slice(0, MAX_LENGTH).replace(trim, ''));
        getInput = new Promise(res => newInput = res);
        input.value = '';
        preview.textContent = '';
      });
      input.addEventListener('keydown', e => {
        if (e.keyCode === 13) sendInput.click();
      });
      input.addEventListener('input', e => {
        preview.textContent = '';
        if (!input.value) return;
        let match, i = 0;
        while (match = illegalChars.exec(input.value)) {
          preview.appendChild(document.createTextNode(input.value.slice(i, match.index)));
          const strike = document.createElement('span');
          strike.classList.add('strikethrough');
          i = match.index + match[0].length;
          strike.appendChild(document.createTextNode(input.value.slice(match.index, i)));
          preview.appendChild(strike);
        }
        preview.appendChild(document.createTextNode(input.value.slice(i)));
        const note = document.createElement('span');
        note.classList.add('chat-input-length');
        note.textContent = ` (${input.value.replace(illegalChars, '').length} / ${MAX_LENGTH})`;
        preview.appendChild(note);
      });
    }).then(async () => {
      username = cookie.getItem('[gunn-web-app] chat.username');
      while (!username) {
        output.value += 'Enter your name:\n';
        username = await getInput;
        output.value += username + '\n';
      }
      cookie.setItem('[gunn-web-app] chat.username', username);
    }).then(async () => {
      let nextMessageGetTimeoutID = null, ratelimitTimeoutID = null;
      function getMessages() {
        if (nextMessageGetTimeoutID) {
          clearTimeout(nextMessageGetTimeoutID);
          nextMessageGetTimeoutID = null;
        }
        // only load messages when viewing utilities section
        if (cookie.getItem('[gunn-web-app] section') !== 'utilities') {
          nextMessageGetTimeoutID = setTimeout(getMessages, FETCH_DELAY);
          return;
        }
        fetch(jsonStore).then(r => r.json()).then(({result: messages}) => {
          const isAtBottom = output.scrollHeight - output.scrollTop === output.clientHeight;
          output.value = Object.values(messages || {}).map(m => {
            const [username, msg] = m
              .split('|')
              .map(p => p
                .replace(illegalChars, '')
                .slice(0, MAX_LENGTH)
                .replace(trim, ''));
            return `[${username || 's-lf pr-gr-m'}] ${msg || 'y--t'}`;
          }).join('\n');
          if (isAtBottom) output.scrollTop = output.scrollHeight;
          if (nextMessageGetTimeoutID) clearTimeout(nextMessageGetTimeoutID);
          nextMessageGetTimeoutID = setTimeout(getMessages, FETCH_DELAY);
        });
      }
      getMessages();
      let lastMessage, messages = 0;
      while (true) {
        let message = await getInput;
        if (message && message !== lastMessage) {
          fetch(jsonStore + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2), {
            method: 'POST',
            headers: {'Content-type': 'application/json'},
            body: JSON.stringify(`${new Date().toISOString().slice(5, 16).replace('T', ' ')} - ${username}|${message}`)
          }).then(getMessages);
          lastMessage = message;
          messages++;
          if (messages >= 5) sendInput.disabled = true;
          if (!ratelimitTimeoutID) {
            ratelimitTimeoutID = setTimeout(() => {
              ratelimitTimeoutID = null;
              messages = 0;
              sendInput.disabled = false;
            }, 10000);
          }
        }
      }
    }).catch(e => {
      output.value += 'Could not load chat.\n' + e;
      input.disabled = true;
      sendInput.disabled = true;
    });
  });
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !navigator.standalone && !cookie.getItem('[gunn-web-app] no-thx-ios')) {
    const theThing = document.getElementById('ios-add-to-home-screen');
    theThing.classList.add('show');
    if (!ua.includes('Version/')) theThing.classList.add('not-ios-safari');
    if (ua.includes('iPad')) theThing.classList.add('ipad');
    document.getElementById('ios-no-thanks').addEventListener('click', e => {
      theThing.classList.add('ok');
      cookie.setItem('[gunn-web-app] no-thx-ios', true);
    });
  }
  function getHTMLString(id) {
    return localize(id, 'html');
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
  navigator.serviceWorker.register('./sw.js').then(regis => {
    regis.onupdatefound = () => {
      const installingWorker = regis.installing;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New update! Redirecting you away and back');
          window.location.replace('/ugwa-updater.html' + window.location.search);
        }
      };
    };
  }, err => {
    console.log(':( Couldn\'t register service worker', err);
  });
},false);
