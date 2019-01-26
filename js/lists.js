window.addEventListener("load",e=>{
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
    listDisable.textContent = 'Enable club/staff lists';
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
      staff["Aaryan Agrawal Person"]={game:true,jobTitle:"Supreme Leader",department:"Universe"};
      staff["Joshua Paley"].jobTitle="Blamed Teacher";
      staff["Christina Woznicki"].woznicki=true;
      staff["Casey O'Connell"].oc=true;
      var staffnames=Object.keys(staff).sort((a,b)=>a[a.lastIndexOf(' ')+1].charCodeAt()-b[b.lastIndexOf(' ')+1].charCodeAt()),
      innerHTML=``;
      for (var i=0,arr=staffnames,len=arr.length,person=arr[i];i<len;i++,person=arr[i]) {
        innerHTML+=`<li tabindex="0" data-person="${person}" data-search="${person} ${staff[person].jobTitle} ${staff[person].department||''}"><span class="primary">${person}</span><span class="secondary">${staff[person].jobTitle}</span><span class="secondary">${staff[person].department||''}</span></li>`;
      }
      stafflist.innerHTML=innerHTML;
      ripple('#staff li');
    },
    e=>{
      stafflist.innerHTML=`<li class="error">${e}; couldn't get staff data; maybe you aren't connected to the internet?</li>`;
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
        staffcontent.innerHTML=`<p><strong>Title:</strong> ${staff[person].jobTitle}</p>${staff[person].department?`<p><strong>Department:</strong> ${staff[person].department}</p>`:''}<p><strong>Email:</strong> <a href="mailto:${staff[person].email}" target="_blank" rel="noopener noreferrer">${staff[person].email}</a></p><p><strong>Phone:</strong> ${staff[person].phone}</p>${staff[person].webpage?`<p><strong>Website:</strong> <a href="${staff[person].webpage}" target="_blank" rel="noopener noreferrer">${staff[person].webpage}</a></p>`:''}${staff[person].oc?`<p><strong>Basement:</strong> <a href="https://sheeptester.github.io/hello-world/elements.html" target="_blank" rel="noopener noreferrer">OC's Basement</a></p>`:''}${staff[person].woznicki?`<p><i>Behind that blush and smile<br>Lies <a href="https://www.urbandictionary.com/define.php?term=woznicki">Woznicki</a>'s brain and bile<br>Her auntie's knee<br>Is bent 'round like a tree<br>And she won't get unblocked for a while</i></p>`:''}`;
      }
    }
  },false);
  staffsearch.addEventListener("input",e=>{
    staffstyle.innerHTML=staffsearch.value?`#staff li:not([data-search*="${staffsearch.value.replace(/\\/g,'\\\\')}"i]){display:none}`:'';
  },false);
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
      clubs["Sophomore Club"]={
        "desc":"A club to commemorate the class of 2021, the first class to undergo SELF, with one of the best attendance rates. All grades welcome!",
        "day":"Thursday",
        "time":"Flex",
        "room":"Any room",
        "president":"Tara Firenzi",
        "teacher":"Courtney Carlomagno",
        "email":"ccarlomagno@pausd.org"
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
      clublist.innerHTML=`<li class="error">${e}; couldn't get club data; maybe you aren't connected to the internet?</li>`;
    }
  );
  clublist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI'&&!target.classList.contains('error')) {
      clubinfo.classList.add('show');
      var club=target.dataset.club;
      clubh1.innerHTML=club;
      clubcontent.innerHTML=`<p><strong>Meeting day:</strong> ${clubs[club].day}</p><p><strong>Meeting time:</strong> ${clubs[club].time}</p><p><strong>Location:</strong> ${clubs[club].room}</p><p><strong>Description:</strong> ${clubs[club].desc}</p><p><strong>President(s):</strong> ${clubs[club].president}</p><p><strong>Teacher Advisor(s):</strong> ${clubs[club].teacher}</p><p><strong>Teacher Email:</strong> <a href="mailto:${clubs[club].email}" target="_blank" rel="noopener noreferrer">${clubs[club].email}</a></p>${clubs[club].donation?`<p><strong>Suggested donation:</strong> ${clubs[club].donation}</p>`:''}`;
      var s=clubcontent.querySelectorAll('a:not([href])');
      for (var i=0;i<s.length;i++) s[i].href=s[i].textContent,s[i].setAttribute('target',"_blank"),s[i].setAttribute('rel',"noopener noreferrer");
    }
  },false);
  clubsearch.addEventListener("input",e=>{
    clubstyle.innerHTML=clubsearch.value?`#clubs li:not([data-search*="${clubsearch.value.replace(/\\/g,'\\\\')}"i]){display:none}`:'';
  },false);
},false);
