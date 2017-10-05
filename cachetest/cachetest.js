function ajax(url,callback,error) {
  var xmlHttp=new XMLHttpRequest();
  xmlHttp.onreadystatechange=()=>{
    if (xmlHttp.readyState===4) xmlHttp.status===200?callback(xmlHttp.responseText):error?error(xmlHttp.status):0;
  };
  xmlHttp.open("GET",url,true);
  xmlHttp.send(null);
}
window.onload=e=>{
  document.querySelector('#test').innerHTML="The cache works if you see me! If this text is red as well, the cache works!";
  ajax("cachetest.txt",e=>{
    var p=document.createElement('p');
    p.innerHTML=e;
    document.body.appendChild(p);
  },e=>{
    alert("Couldn't use AJAX to load file; "+e);
  });
};
