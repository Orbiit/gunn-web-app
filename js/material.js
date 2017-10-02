function ripple(elem) {
  if (typeof elem==='string') {
    var s=document.querySelectorAll(elem);
    for (var i=0;i<s.length;i++) ripple(s[i]);
    return;
  }
  function mousedown(x,y) {
    var r=document.createElement("div"),
    rect=elem.getBoundingClientRect();
    r.classList.add('ripple');
    if (elem.classList.contains('ripple-light')) r.classList.add('ripple-light');
    if (elem.classList.contains('ripple-dark')) r.classList.add('ripple-dark');
    r.style.left=(x-rect.left)+'px';
    r.style.top=(y-rect.top)+'px';
    elem.appendChild(r);
    var start=new Date().getTime(),
    dest=Math.max(rect.width,rect.height)/10,
    duration=dest*31,
    fade=false,fadestart;
    function updateScale() {
      var elapsed=(new Date().getTime()-start)/duration,
      fadeelapsed=(new Date().getTime()-fadestart)/500;
      if (fade&&fadeelapsed>1) {
        elem.removeChild(r);
        r=null;
      } else {
        r.style.transform=`scale(${elapsed*dest})`;
        if (fadeelapsed) r.style.opacity=1-fadeelapsed;
        else r.style.opacity=1;
        window.requestAnimationFrame(updateScale);
      }
    }
    function mouseup(e) {
      fade=true,fadestart=new Date().getTime();
      document.removeEventListener('mouseup',mouseup,false);
      document.removeEventListener('touchend',mouseup,false);
      if (e.type==="touchend") lasttap=fadestart;
    }
    window.requestAnimationFrame(updateScale);
    document.addEventListener('mouseup',mouseup,false);
    document.addEventListener('touchend',mouseup,false);
  }
  var lasttap=0;
  elem.addEventListener("mousedown",e=>{
    if (new Date().getTime()-lasttap>100) mousedown(e.clientX,e.clientY);
  },false);
  elem.addEventListener("touchstart",e=>{
    mousedown(e.touches[0].clientX,e.touches[0].clientY);
  },false);
  var focusblob=document.createElement('div');
  focusblob.classList.add('ripple');
  focusblob.classList.add('ripple-focus');
  /* elem.addEventListener("focus",e=>{
    var rect=elem.getBoundingClientRect();
    focusblob.style.width=focusblob.style.height=(Math.max(rect.width,rect.height)*0.8)+'px';
    elem.appendChild(focusblob);
  },false);
  elem.addEventListener("blur",e=>{
    elem.removeChild(focusblob);
  },false); */
}
window.addEventListener("load",e=>{
  toEach('.material-switch',t=>{
    t.addEventListener("click",e=>{
      t.classList.toggle('checked');
    },false);
  });
  toEach('.radio-wrapper',t=>{
    var radio=t.querySelector('input[type=radio]');
    t.addEventListener("click",e=>{
      radio.click();
      radio.focus();
    },false);
  });
  toEach('.material-dialog > .buttons > button.close',t=>{
    t.addEventListener("click",e=>{
      t.parentNode.parentNode.classList.remove('show');
    },false);
  });
},false);
