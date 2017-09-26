window.addEventListener("load",e=>{
  var staff,
  stafflist=document.querySelector('#staff'),
  staffcontact=document.querySelector('#staffcontact'),
  staffh1=document.querySelector('#staffcontact h1'),
  staffcontent=document.querySelector('#staffcontact .content');
  ajax(
    window.location.protocol==='file:'?"https://orbiit.github.io/gunn-web-app/staff.json":'staff.json',
    e=>{
      staff=JSON.parse(e);
      staff["Nick Mount"]={game:true,jobTitle:"Easter Bunny",department:"Easter"};
      staff["Josh Paley"].jobTitle="Blamed Teacher";
      var staffnames=Object.keys(staff).sort((a,b)=>a[a.lastIndexOf(' ')+1].charCodeAt()-b[b.lastIndexOf(' ')+1].charCodeAt()),
      innerHTML=``;
      for (var i=0,arr=staffnames,len=arr.length,person=arr[i];i<len;i++,person=arr[i]) {
        innerHTML+=`<li data-person="${person}"><span class="primary">${person}</span><span class="secondary">${staff[person].jobTitle}</span><span class="secondary">${staff[person].department}</span></li>`;
      }
      stafflist.innerHTML=innerHTML;
      ripple('#staff li');
    }
  );
  stafflist.addEventListener("click",e=>{
    var target=e.target;
    if (target.tagName==='SPAN') target=target.parentNode;
    if (target.tagName==='LI') {
      staffcontact.classList.add('show');
      var person=target.dataset.person;
      staffh1.innerHTML=person;
      if (staff[person].game) {
        staffcontent.innerHTML=`<p>I hope to have a game here one day</p>`;
      } else {
        staffcontent.innerHTML=`<p><strong>Title</strong> ${staff[person].jobTitle}</p>${staff[person].department?`<p><strong>Department</strong> ${staff[person].department}</p>`:''}<p><strong>Email</strong> <a href="mailto:${staff[person].email}" target="_blank" rel="noopener noreferrer">${staff[person].email}</a></p><p><strong>Phone</strong> ${staff[person].phone}</p>${staff[person].webpage?`<p><strong>Website</strong> <a href="${staff[person].webpage}" target="_blank" rel="noopener noreferrer">${staff[person].webpage}</a></p>`:''}`;
      }
    }
  },false);
  document.querySelector('#staffcontact button').addEventListener("click",e=>{
    staffcontact.classList.remove('show');
  },false);
},false);
