window.addEventListener("load",e=>{
  var t=document.querySelector(`#footer > ul > li[data-section="${cookie.getItem('[gunn-web-app] section')||'schedule'}"]`);
  if (t) t.classList.add('active');
  else {
    document.querySelector(`#footer > ul > li[data-section="schedule"]`).classList.add('active');
    cookie.setItem('[gunn-web-app] section','schedule');
    document.body.classList.add('footer-schedule');
  }
  var ul=document.querySelector('#footer > ul');
  function ulclick(e) {
    if (e.target!==ul&&ul.contains(e.target)) {
      var t=ul.querySelector('.active');
      if (t) {
        t.classList.remove('active');
        document.body.classList.remove('footer-'+t.children[1].textContent.toLowerCase());
      }
      var n=e.target;
      while (n.tagName!=="LI") n=e.target.parentNode;
      n.classList.add('active');
      document.body.classList.add('footer-'+n.children[1].textContent.toLowerCase());
      cookie.setItem('[gunn-web-app] section',n.children[1].textContent.toLowerCase());
    }
  }
  ul.addEventListener("click",ulclick,false);
  ul.addEventListener("keydown",e=>{
    if (e.keyCode===13) ulclick(e);
  },false);
},false);
