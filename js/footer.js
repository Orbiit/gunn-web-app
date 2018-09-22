window.addEventListener("load",e=>{
  var t=document.querySelector(`#footer > ul > li[data-section="${cookie.getItem('[gunn-web-app] section')||'schedule'}"]`);
  if (t) t.classList.add('active');
  else {
    document.querySelector(`#footer > ul > li[data-section="schedule"]`).classList.add('active');
    cookie.setItem('[gunn-web-app] section','schedule');
    document.body.classList.add('footer-schedule');
  }
  var ul=document.querySelector('#footer > ul');
  function setSection(section) {
    var t=ul.querySelector('.active');
    if (t) {
      t.classList.remove('active');
      document.body.classList.remove('footer-'+t.children[1].textContent.toLowerCase());
    }
    document.querySelector(`#footer > ul > li[data-section="${section}"]`).classList.add('active');
    document.body.classList.add('footer-'+section);
    cookie.setItem('[gunn-web-app] section',section);
  }
  if (window.location.search) {
    const params = {};
    window.location.search.slice(1).split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      params[key] = value;
    });
    if (params.section) {
      setSection(params.section);
    }
    // if (params.clubSearch) {
    //   document.querySelector('#clubsearch').value = params.clubSearch;
    // }
    // if (params.staffSearch) {
    //   document.querySelector('#staffsearch').value = params.staffSearch;
    // }
  }
  function ulclick(e) {
    if (e.target!==ul&&ul.contains(e.target)) {
      var n=e.target;
      while (n.tagName!=="LI") n=e.target.parentNode;
      setSection(n.children[1].textContent.toLowerCase());
    }
  }
  ul.addEventListener("click",ulclick,false);
  ul.addEventListener("keydown",e=>{
    if (e.keyCode===13) ulclick(e);
  },false);
},false);
