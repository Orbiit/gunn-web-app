function fitContent(input,extrapadding=0) {
  var t=document.createElement('span'),
  updatewidth=e=>{
    t.textContent=input.value;
    document.body.appendChild(t);
    input.style.width=(t.getBoundingClientRect().width+extrapadding)+'px';
    document.body.removeChild(t);
  };
  t.style.whiteSpace='pre';
  t.style.font=getComputedStyle(input).font;
  input.addEventListener("input",updatewidth,false);
  updatewidth();
}
