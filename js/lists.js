window.addEventListener("load",e=>{
  function localizePlaceholder(id) {
    return localize(id, 'placeholders');
  }
  function containsString(pattern) {
    if (!pattern) return () => true;
    if (pattern.slice(0, 2) === 'r/') {
      try {
        const regex = new RegExp(pattern.slice(2), 'i');
        return str => regex.test(str);
      } catch (e) {
        logError(e)
      }
    }
    pattern = pattern.toLowerCase();
    return str => str.toLowerCase().includes(pattern);
  }
  var listDisable = document.querySelector('#disable-lists');
  if (cookie.getItem("[gunn-web-app] scheduleapp.loadLists") === null)
    cookie.setItem("[gunn-web-app] scheduleapp.loadLists", "yes");
  var loadLists = cookie.getItem("[gunn-web-app] scheduleapp.loadLists") === "yes";
  if (loadLists) {
    listDisable.addEventListener('click', e => {
      cookie.setItem("[gunn-web-app] scheduleapp.loadLists", "no");
      window.location.reload();
    }, false);
  } else {
    listDisable.textContent = localize('enable-lists');
    listDisable.addEventListener('click', e => {
      cookie.setItem("[gunn-web-app] scheduleapp.loadLists", "yes");
      window.location.reload();
    }, false);
    toEach('.lists-enabled button', t => t.addEventListener('click', e => {
      cookie.setItem("[gunn-web-app] scheduleapp.loadLists", "yes");
      window.location.reload();
    }, false))
    toEach('.lists-enabled', t => t.classList.remove('lists-enabled'))
    return;
  }
  var staff,
  stafflist=document.querySelector('#staff'),
  staffcontact=document.querySelector('#staffcontact'),
  staffh1=document.querySelector('#staffcontact h1'),
  staffcontent=document.querySelector('#staffcontact .content'),
  staffsearch=document.querySelector('#staffsearch'),
  staffclear=document.querySelector('#staffclear');
  ajax(
    (window.location.protocol==='file:'?"https://orbiit.github.io/gunn-web-app/":"")+'json/staff.json',
    e=>{
      staff=JSON.parse(e);
      staff["Aaryan Agrawal Person"]={game:true,jobTitle:localize('supreme-leader'),department:localize('universe')};
      // staff["Joshua Paley"].jobTitle=localize('blamed-teacher');
      // staff["Christina Woznicki"].woznicki=true;
      // staff["Casey O'Connell"].oc=true;
      var staffnames=Object.keys(staff).sort((a,b)=>a[a.lastIndexOf(' ')+1].charCodeAt()-b[b.lastIndexOf(' ')+1].charCodeAt()),
      innerHTML=``;
      for (var i=0,arr=staffnames,len=arr.length,person=arr[i];i<len;i++,person=arr[i]) {
        innerHTML+=`<li tabindex="0" data-person="${person}" data-search="${person} ${staff[person].jobTitle} ${staff[person].department||''}"><span class="primary">${person}</span><span class="secondary">${staff[person].jobTitle}</span><span class="secondary">${staff[person].department||''}</span></li>`;
      }
      stafflist.innerHTML=innerHTML;
      ripple('#staff li');
      if (staffsearch.value) doStaffSearch();
    },
    e=>{
      stafflist.innerHTML=`<li class="error">${e}${localize('staff-error')}</li>`;
    }
  );
  let timerStarted = false;
  stafflist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI'&&!target.classList.contains('error')) {
      staffcontact.classList.add('show');
      var personName=target.dataset.person;
      staffh1.innerHTML=personName;
      const person = staff[personName];
      if (person.game) {
        staffcontent.innerHTML=`
        <div style="display: flex; align-items: center;">
          <div class="center" style="flex: auto;">
            <style>.egg-snake:focus {box-shadow: 0 0 3px #FF594C;}</style>
            <canvas class="egg-snake" width="20" height="20" tabindex="0" style="height: 100px; image-rendering: pixelated; cursor: pointer; border: 1px solid currentColor;"></canvas>
          </div>
          <div class="center">
            <div><button class="material icon egg-arrow-up"><i class="material-icons">keyboard_arrow_up</i></button></div>
            <div>
              <button class="material icon egg-arrow-left"><i class="material-icons">keyboard_arrow_left</i></button>
              <button class="material icon egg-arrow-play"><i class="material-icons">play_arrow</i></button>
              <button class="material icon egg-arrow-right"><i class="material-icons">keyboard_arrow_right</i></button>
            </div>
            <div><button class="material icon egg-arrow-down"><i class="material-icons">keyboard_arrow_down</i></button></div>
          </div>
        </div>
        <p>Score: <span class="egg-score">[press play to start]</span>; personal high score: <span class="egg-hscore"></span></p>
        <p>Click on the box to give it focus so you can use arrow keys.</p>
        <p><button class="material ripple-light raised egg-btn">click me</button> <span class="egg-count"></span> click(s)</p>
        <p><button class="material ripple-light raised egg-buy-btn">extra click per click</button> <span class="egg-power"></span> click(s) per click (price: <span class="egg-price">50</span> clicks)</p>
        <p><button class="material ripple-light raised egg-buy-t-btn">extra click per second</button> <span class="egg-extra"></span> click(s) per second (price: <span class="egg-t-price">100</span> clicks; note: this resets when UGWA is refreshed)</p>
        `;
        // snake game
        const canvas = staffcontent.querySelector('.egg-snake');
        const c = canvas.getContext('2d');
        const playBtn = staffcontent.querySelector('.egg-arrow-play');
        const leftBtn = staffcontent.querySelector('.egg-arrow-left');
        const upBtn = staffcontent.querySelector('.egg-arrow-up');
        const rightBtn = staffcontent.querySelector('.egg-arrow-right');
        const downBtn = staffcontent.querySelector('.egg-arrow-down');
        const scoreDisplay = staffcontent.querySelector('.egg-score');
        const highScoreDisplay = staffcontent.querySelector('.egg-hscore');
        [playBtn, leftBtn, upBtn, rightBtn, downBtn].forEach(ripple);
        let direction = [0, 1];
        leftBtn.onclick = e => direction = [-1, 0];
        upBtn.onclick = e => direction = [0, -1];
        rightBtn.onclick = e => direction = [1, 0];
        downBtn.onclick = e => direction = [0, 1];
        canvas.onkeydown = e => {
          switch (e.keyCode) {
            case 37: leftBtn.click(); break;
            case 38: upBtn.click(); break;
            case 39: rightBtn.click(); break;
            case 40: downBtn.click(); break;
            default: return;
          }
          e.preventDefault();
        };
        function getApplePos() {
          let proposal;
          do {
            proposal = [Math.random() * 20 >> 0, Math.random() * 20 >> 0];
          } while (inSnake(proposal));
          return proposal;
        }
        function inSnake(loc) {
          for (const [x, y] of snake) {
            if (loc[0] === x && loc[1] === y) return true;
          }
          return false;
        }
        function render() {
          c.clearRect(0, 0, 20, 20);
          c.fillStyle = '#FF594C';
          snake.forEach(([x, y]) => {
            c.fillRect(x, y, 1, 1);
          });
          c.fillStyle = document.body.classList.contains('dark') ? 'white' : 'black';
          c.fillRect(apple[0], apple[1], 1, 1);
        }
        let playing = false, score, snake, apple, idealLength;
        let highScore = +cookie.getItem('[gunn-web-app] scheduleapp.snakeHighScore') || 0;
        highScoreDisplay.textContent = highScore;
        playBtn.onclick = e => {
          scoreDisplay.textContent = score = 0;
          snake = [[9, 9]];
          apple = getApplePos();
          idealLength = 3;
          playing = setInterval(() => {
            if (!document.body.contains(canvas)) {
              clearInterval(playing);
              playing = false;
            }
            const lastPos = snake[snake.length - 1];
            const newPos = [lastPos[0] + direction[0], lastPos[1] + direction[1]];
            if (newPos[0] < 0 || newPos[0] >= 20 || newPos[1] < 0 || newPos[1] >= 20 || inSnake(newPos)) {
              clearInterval(playing);
              playing = false;
              scoreDisplay.textContent = score + ` (GAME OVER${score > highScore ? ' - NEW HIGH SCORE' : ''})`;
              if (score > highScore) {
                highScore = score;
                highScoreDisplay.textContent = highScore;
                cookie.setItem('[gunn-web-app] scheduleapp.snakeHighScore', highScore);
              }
            } else if (newPos[0] === apple[0] && newPos[1] === apple[1]) {
              apple = getApplePos();
              idealLength++;
              scoreDisplay.textContent = ++score;
            }
            snake.push(newPos);
            if (snake.length > idealLength) snake.splice(0, 1);
            render();
          }, 200);
          render();
        };
        // clicker game
        var btn=staffcontent.querySelector('.egg-btn'),
        buyBtn=staffcontent.querySelector('.egg-buy-btn'),
        clicks=staffcontent.querySelector('.egg-count'),
        priceDisplay=staffcontent.querySelector('.egg-price'),
        powerDisplay=staffcontent.querySelector('.egg-power'),
        buyTBtn=staffcontent.querySelector('.egg-buy-t-btn'),
        priceTDisplay=staffcontent.querySelector('.egg-t-price'),
        extraDisplay=staffcontent.querySelector('.egg-extra'),
        stats = timerStarted || {
          count: +cookie.getItem('[gunn-web-app] scheduleapp.clicks')||0,
          power: +cookie.getItem('[gunn-web-app] scheduleapp.clickPower')||1,
          extra: 0
        };
        stats.clicks = clicks;
        ripple(btn);
        ripple(buyBtn);
        ripple(buyTBtn);
        clicks.textContent=stats.count;
        btn.addEventListener("click",e=>{
          stats.count += stats.power;
          cookie.setItem('[gunn-web-app] scheduleapp.clicks',stats.count);
          clicks.textContent=stats.count;
        },false);
        priceDisplay.textContent = (stats.power + 1) * 25;
        powerDisplay.textContent = stats.power;
        buyBtn.addEventListener("click",e=>{
          const price = (stats.power + 1) * 25;
          if (stats.count < price) {
            priceDisplay.textContent = price + ' (which is too many for you)';
          } else {
            stats.count -= price;
            clicks.textContent=stats.count;
            cookie.setItem('[gunn-web-app] scheduleapp.clicks',stats.count);

            stats.power++;
            powerDisplay.textContent = stats.power;
            cookie.setItem('[gunn-web-app] scheduleapp.clickPower',stats.power);
            priceDisplay.textContent = (stats.power + 1) * 25;
          }
        },false);
        priceTDisplay.textContent = stats.extra * 150 + 100;
        extraDisplay.textContent = stats.extra;
        buyTBtn.addEventListener("click",e=>{
          const price = stats.extra * 150 + 100;
          if (stats.count < price) {
            priceTDisplay.textContent = price + ' (which is too many for you)';
          } else {
            stats.count -= price;
            clicks.textContent=stats.count;
            cookie.setItem('[gunn-web-app] scheduleapp.clicks',stats.count);

            stats.extra++;
            extraDisplay.textContent = stats.extra;
            priceTDisplay.textContent = stats.extra * 150 + 100;
          }
        },false);
        if (!timerStarted) {
          timerStarted = stats;
          setInterval(() => {
            stats.count += stats.extra;
            timerStarted.clicks.textContent=stats.count;
            cookie.setItem('[gunn-web-app] scheduleapp.clicks',stats.count);
          }, 1000);
        }
      } else {
        let innerHTML = '';
        innerHTML += `<p><strong>${localize('title')}</strong> ${person.jobTitle}</p>`;
        innerHTML += `<p><strong>${localize('department')}</strong> ${person.department}</p>`;
        innerHTML += `<p><strong>${localize('email')}</strong> <a href="mailto:${person.email}" target="_blank" rel="noopener noreferrer">${person.email}</a></p>`;
        if (person.phone) innerHTML += `<p><strong>${localize('phone')}</strong> ${person.phone}</p>`;
        if (person.webpage) innerHTML += `<p><strong>${localize('website')}</strong> <a href="${person.webpage}" target="_blank" rel="noopener noreferrer">${person.webpage}</a></p>`;
        if (person.oc) innerHTML += `<p><strong>${localize('basement')}</strong> <a href="https://sheeptester.github.io/hello-world/elements.html" target="_blank" rel="noopener noreferrer">${localize('oc-basement')}</a></p>`;
        staffcontent.innerHTML=innerHTML;
      }
    }
  },false);
  function doStaffSearch() {
    const contains = containsString(staffsearch.value);
    for (let i = 0; i < stafflist.children.length; i++) {
      const li = stafflist.children[i];
      li.style.display = contains(li.dataset.search) ? null : 'none';
    }
  }
  const staffSearchValue = /(?:\?|&)staff-search=([^&]+)/.exec(window.location.search);
  if (staffSearchValue) {
    staffsearch.value = staffSearchValue[1];
  }
  staffsearch.addEventListener("input", doStaffSearch,false);
  staffsearch.placeholder = localizePlaceholder('staff');
  staffclear.addEventListener('click', e => {
    staffsearch.value = '';
    doStaffSearch();
  });
  var clubs,
  clublist=document.querySelector('#clubs'),
  clubinfo=document.querySelector('#clubinfo'),
  clubh1=document.querySelector('#clubinfo h1'),
  clubcontent=document.querySelector('#clubinfo .content'),
  clubsearch=document.querySelector('#clubsearch'),
  clubclear=document.querySelector('#clubclear'),
  clubAddList = document.getElementById('club-add-list');
  ajax(
    (window.location.protocol==='file:'?"https://orbiit.github.io/gunn-web-app/":"")+'json/clubs.json',
    e=>{
      clubs=JSON.parse(e);
      clubs[localize('sophomore-club')]={
        "desc":localize('soph-desc'),
        "day":localize('soph-day'),
        "time":localize('soph-time'),
        "room":localize('soph-room'),
        "president":localize('soph-prez'),
        "teacher":localize('soph-teacher'),
        "email":localize('soph-email')
      };
      // ask Ronnie if this club is renewed for next semester/year
      clubs['Sensors & Electronics Club'] = {
        desc: 'We specialized in sensors and electronics, such as Arduino, Raspberry Pi, circuit boards, lidar, and a variety of other sensors, many of which will be on display during meetings. We will have fun projects and competitions including snacks each week.',
        day: 'Friday',
        time: 'Lunch',
        room: 'N-207',
        president: 'Jamisen Ma, Kevin Bao',
        teacher: 'Florina Limburg',
        email: 'flimburg@pausd.org'
      };
      var clubnames=Object.keys(clubs).sort((a, b) => a.toLowerCase() > b.toLowerCase() ? 1 : -1),
      innerHTML=``;
      for (var i=0,arr=clubnames,len=arr.length,club=arr[i];i<len;i++,club=arr[i]) {
        innerHTML+=`<li tabindex="0" data-club="${club}" data-search="${club} ${clubs[club].room} ${clubs[club].day}"><span class="primary">${club}</span><span class="secondary">${clubs[club].room}</span><span class="secondary">${clubs[club].day}</span></li>`;
      }
      clublist.innerHTML=innerHTML;
      ripple('#clubs li');
      if (clubsearch.value) doClubSearch();
    },
    e=>{
      clublist.innerHTML=`<li class="error">${e}${localize('club-error')}</li>`;
    }
  );
  let currentClub = null;
  window.showClub = clubName => {
    clubinfo.classList.add('show');
    clubh1.innerHTML=clubName;
    currentClub = clubName;
    const club = clubs[clubName];
    clubAddList.textContent = savedClubs[clubName] ? localize('remove-from-list') : localize('add-to-list');
    if (!club) {
      clubcontent.innerHTML = `<p>${localize('dead-club')}</p>`;
      return;
    }
    clubAddList.style.display = /lunch/i.test(club.time) ? null : 'none';
    let innerHTML = '';
    innerHTML += `<p><strong>${localize('day')}</strong> ${club.day}</p>`;
    innerHTML += `<p><strong>${localize('time')}</strong> ${club.time}</p>`;
    innerHTML += `<p><strong>${localize('location')}</strong> ${club.room}</p>`;
    innerHTML += `<p><strong>${localize('desc')}</strong> ${club.desc}</p>`;
    innerHTML += `<p><strong>${localize('presidents')}</strong> ${club.president}</p>`;
    innerHTML += `<p><strong>${localize('advisors')}</strong> ${club.teacher}</p>`;
    innerHTML += `<p><strong>${localize('teacher-email')}</strong> <a href="mailto:${club.email}" target="_blank" rel="noopener noreferrer">${club.email}</a></p>`;
    if (club.donation) innerHTML += `<p><strong>${localize('donation')}</strong> ${club.donation}</p>`;
    clubcontent.innerHTML=innerHTML;
    var s=clubcontent.querySelectorAll('a:not([href])');
    for (var i=0;i<s.length;i++) s[i].href=s[i].textContent,s[i].setAttribute('target',"_blank"),s[i].setAttribute('rel',"noopener noreferrer");
  }
  clublist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI'&&!target.classList.contains('error')) {
      showClub(target.dataset.club);
    }
  },false);
  clubAddList.addEventListener('click', e => {
    if (!currentClub) return;
    if (savedClubs[currentClub]) {
      delete savedClubs[currentClub];
      clubAddList.childNodes[0].nodeValue = localize('add-to-list');
    } else {
      savedClubs[currentClub] = 1;
      const days = clubs[currentClub].day;
      if (/monday/i.test(days)) savedClubs[currentClub] *= 2;
      if (/tuesday/i.test(days)) savedClubs[currentClub] *= 3;
      if (/wednesday/i.test(days)) savedClubs[currentClub] *= 5;
      if (/thursday/i.test(days)) savedClubs[currentClub] *= 7;
      if (/friday/i.test(days)) savedClubs[currentClub] *= 11;
      clubAddList.childNodes[0].nodeValue = localize('remove-from-list');
    }
    saveSavedClubs();
  });
  function doClubSearch() {
    const contains = containsString(clubsearch.value);
    for (let i = 0; i < clublist.children.length; i++) {
      const li = clublist.children[i];
      li.style.display = contains(li.dataset.search) ? null : 'none';
    }
  }
  const clubSearchValue = /(?:\?|&)club-search=([^&]+)/.exec(window.location.search);
  if (clubSearchValue) {
    clubsearch.value = clubSearchValue[1];
  } else {
    clubsearch.value = ['', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', ''][now().getDay()];
  }
  clubsearch.addEventListener("input", doClubSearch,false);
  clubsearch.placeholder = localizePlaceholder('clubs');
  clubclear.addEventListener('click', e => {
    clubsearch.value = '';
    doClubSearch();
  });
},false);
