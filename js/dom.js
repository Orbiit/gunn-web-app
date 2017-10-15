class Elem extends Array {
  constructor(elems) {
    if (!Array.isArray(elems)) elems=[elems];
    elems=elems.filter(a=>a!==null&&a!==undefined);
    super(...elems);
  }
  each(fn) {
    for (var i=0;i<this.length;i++) fn(this[i]);
  }
  click(fn) {
    this.each(e=>{
      e.addEventListener('click',fn,false);
      // if (!e.hasKey) e.addEventListener("keydown",e=>{
      //   if (e.keyCode===13||e.keyCode===32) fn(e);
      // },false);
    });
    return this;
  }
  on(listener,fn,touch=false) {
    this.each(e=>{
      if (listener==='keydown'||listener==='keypress') e.hasKey=true;
      e.addEventListener(listener,fn,touch?{passive:false}:false);
    });
    return this;
  }
  sel(selector) {
    var t=[];
    this.each(e=>{
      var s=e.querySelectorAll(selector);
      for (var i=0;i<s.length;i++) t.push(s[i]);
    });
    return new Elem(t);
  }
  prop(prop,newval) {
    if (newval!==undefined) {
      this.each(e=>{
        e[prop]=newval;
      });
      return this;
    } else {
      var t=[];
      this.each(e=>{
        t.push(e[prop]);
      });
      return t;
    }
  }
  attr(attr,newval) {
    if (newval!==undefined) {
      this.each(e=>{
        e.setAttribute(attr,newval);
      });
      return this;
    } else {
      var t=[];
      this.each(e=>{
        t.push(e.getAttribute(attr));
      });
      return t;
    }
  }
  html(newhtml) {
    if (newhtml!==undefined) {
      this.each(e=>{
        e.innerHTML=newhtml;
      });
      return this;
    } else {
      var t=[];
      this.each(e=>{
        t.push(e.innerHTML);
      });
      return t;
    }
  }
  child(n) {
    var t=[];
    this.each(e=>{
      t.push(e.children[n]);
    });
    return new Elem(t);
  }
  parent() {
    var t=[];
    this.each(e=>{
      if (!~t.indexOf(e.parentNode)) t.push(e.parentNode);
    });
    return new Elem(t);
  }
  add(elems,pos=-1) {
    var t=document.createDocumentFragment();
    elems.each(e=>{
      t.appendChild(e);
    });
    if (pos===-1) this[0].appendChild(t);
    else if (pos<0) this[0].insertBefore(t,this[0].children[this[0].children.length+pos+1]);
    else this[0].insertBefore(t,this[0].children[pos]);
    return this;
  }
  addClass(...classes) {
    this.each(e=>{
      for (var i=0;i<classes.length;i++) e.classList.add(classes[i]);
    });
    return this;
  }
  removeClass(...classes) {
    this.each(e=>{
      for (var i=0;i<classes.length;i++) e.classList.remove(classes[i]);
    });
    return this;
  }
  toggleClass(...classes) {
    this.each(e=>{
      for (var i=0;i<classes.length;i++) e.classList.toggle(classes[i]);
    });
    return this;
  }
  hasClass(theClass) {
    var t=[];
    this.each(e=>{
      t.push(e.classList.contains(theClass));
    });
    return t;
  }
}
function sel(selector) {
  var t=[],s=document.querySelectorAll(selector);
  for (var i=0;i<s.length;i++) t.push(s[i]);
  return new Elem(t);
}
function cre(tag,times=1) {
  var t=[];
  for (var i=0;i<times;i++) t.push(document.createElement(tag));
  return new Elem(t);
}
function ajax(url,callback,error) {
  var xmlHttp=new XMLHttpRequest();
  xmlHttp.onreadystatechange=()=>{
    if (xmlHttp.readyState===4) xmlHttp.status===200?callback(xmlHttp.responseText):error?error(xmlHttp.responseText,xmlHttp.readyState,xmlHttp.status):0;
  };
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
}
function ready(fn) {
  document.addEventListener("DOMContentLoaded",fn,false);
}
function load(fn) {
  window.addEventListener("load",fn,false);
}
ready(e=>{
  window.DH=new Elem(document.head);
  window.DB=new Elem(document.body);
});
