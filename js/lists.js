window.addEventListener("load",e=>{
  function localizePlaceholder(id) {
    return langs[currentLang].placeholders[id] || langs.en.placeholders[id] || `{{${id}}}`;
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
  staffstyle=document.createElement("style");
  document.body.appendChild(staffstyle);
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
    },
    e=>{
      stafflist.innerHTML=`<li class="error">${e}${localize('staff-error')}</li>`;
    }
  );
  stafflist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI'&&!target.classList.contains('error')) {
      staffcontact.classList.add('show');
      var person=target.dataset.person;
      staffh1.innerHTML=person;
      if (staff[person].game) {
        staffcontent.innerHTML=``;
        var btn=document.createElement("button"),
        clicks=document.createElement("p"),
        count=+localStorage.getItem('[gunn-web-app] scheduleapp.clicks')||0;
        btn.innerHTML="click me";
        btn.className="material ripple-light raised";
        ripple(btn);
        clicks.innerHTML=`${count} click(s)`;
        btn.addEventListener("click",e=>{
          count++;
          localStorage.setItem('[gunn-web-app] scheduleapp.clicks',count);
          clicks.innerHTML=`${count} click(s)`;
        },false);
        staffcontent.appendChild(btn);
        staffcontent.appendChild(clicks);
      } else {
        staffcontent.innerHTML=`<p><strong>${localize('title')}</strong> ${staff[person].jobTitle}</p>${staff[person].department?`<p><strong>${localize('department')}</strong> ${staff[person].department}</p>`:''}<p><strong>${localize('email')}</strong> <a href="mailto:${staff[person].email}" target="_blank" rel="noopener noreferrer">${staff[person].email}</a></p><p><strong>${localize('phone')}</strong> ${staff[person].phone}</p>${staff[person].webpage?`<p><strong>${localize('website')}</strong> <a href="${staff[person].webpage}" target="_blank" rel="noopener noreferrer">${staff[person].webpage}</a></p>`:''}${staff[person].oc?`<p><strong>${localize('basement')}</strong> <a href="https://sheeptester.github.io/hello-world/elements.html" target="_blank" rel="noopener noreferrer">${localize('oc-basement')}</a></p>`:''}`;
      }
    }
  },false);
  function doStaffSearch() {
    staffstyle.innerHTML=staffsearch.value?`#staff li:not([data-search*="${staffsearch.value.replace(/\\/g,'\\\\')}"i]){display:none}`:'';
  }
  const staffSearchValue = /(?:\?|&)staff-search=([^&]+)/.exec(window.location.search);
  if (staffSearchValue) {
    staffsearch.value = staffSearchValue[1];
    doStaffSearch();
  }
  staffsearch.addEventListener("input", doStaffSearch,false);
  staffsearch.placeholder = localizePlaceholder('staff');
  var clubs,
  clublist=document.querySelector('#clubs'),
  clubinfo=document.querySelector('#clubinfo'),
  clubh1=document.querySelector('#clubinfo h1'),
  clubcontent=document.querySelector('#clubinfo .content'),
  clubsearch=document.querySelector('#clubsearch'),
  clubstyle=document.createElement("style");
  document.body.appendChild(clubstyle);
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
      var clubnames=Object.keys(clubs).sort(),
      innerHTML=``;
      for (var i=0,arr=clubnames,len=arr.length,club=arr[i];i<len;i++,club=arr[i]) {
        innerHTML+=`<li tabindex="0" data-club="${club}" data-search="${club} ${clubs[club].room} ${clubs[club].day}"><span class="primary">${club}</span><span class="secondary">${clubs[club].room}</span><span class="secondary">${clubs[club].day}</span></li>`;
      }
      clublist.innerHTML=innerHTML;
      ripple('#clubs li');
    },
    e=>{
      clublist.innerHTML=`<li class="error">${e}${localize('club-error')}</li>`;
    }
  );
  clublist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI'&&!target.classList.contains('error')) {
      clubinfo.classList.add('show');
      var club=target.dataset.club;
      clubh1.innerHTML=club;
      clubcontent.innerHTML=`<p><strong>${localize('day')}</strong> ${clubs[club].day}</p><p><strong>${localize('time')}</strong> ${clubs[club].time}</p><p><strong>${localize('location')}</strong> ${clubs[club].room}</p><p><strong>${localize('desc')}</strong> ${clubs[club].desc}</p><p><strong>${localize('presidents')}</strong> ${clubs[club].president}</p><p><strong>${localize('advisors')}</strong> ${clubs[club].teacher}</p><p><strong>${localize('teacher-email')}</strong> <a href="mailto:${clubs[club].email}" target="_blank" rel="noopener noreferrer">${clubs[club].email}</a></p>${clubs[club].donation?`<p><strong>${localize('donation')}</strong> ${clubs[club].donation}</p>`:''}`;
      var s=clubcontent.querySelectorAll('a:not([href])');
      for (var i=0;i<s.length;i++) s[i].href=s[i].textContent,s[i].setAttribute('target',"_blank"),s[i].setAttribute('rel',"noopener noreferrer");
    }
  },false);
  function doClubSearch() {
    clubstyle.innerHTML=clubsearch.value?`#clubs li:not([data-search*="${clubsearch.value.replace(/\\/g,'\\\\')}"i]){display:none}`:'';
  }
  const clubSearchValue = /(?:\?|&)club-search=([^&]+)/.exec(window.location.search);
  if (clubSearchValue) {
    clubsearch.value = clubSearchValue[1];
    doClubSearch();
  }
  clubsearch.addEventListener("input", doClubSearch,false);
  clubsearch.placeholder = localizePlaceholder('clubs');
},false);
