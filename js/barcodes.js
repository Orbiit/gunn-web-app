window.addEventListener("load",e=>{
  var barcodeul=document.querySelector('#barcode'),
  add=document.querySelector('#addbarcode'),
  barcodes=["95012345"],
  barcodeelems=[];
  if (localStorage.getItem('[gunn-web-app] barcode.ids')) {
    barcodes=localStorage.getItem('[gunn-web-app] barcode.ids').split(',');
  }
  function updateSave() {
    localStorage.setItem('[gunn-web-app] barcode.ids',barcodeelems.map(a=>a.value).join(','));
  }
  function newBarcodeLi(code="95012345") {
    var li=document.createElement("li"),
    divcanvas=document.createElement("div"),
    input=document.createElement("input"),
    canvas=document.createElement("canvas"),
    divbtn=document.createElement("div"),
    removebtn=document.createElement("button"),
    viewbtn=document.createElement("button");
    divcanvas.classList.add('canvas');
    input.type='number';
    input.value=code;
    input.addEventListener("input",e=>{
      code39(input.value,canvas);
      updateSave();
    },false);
    barcodeelems.push(input);
    updateSave();
    divcanvas.appendChild(input);
    code39(code,canvas);
    canvas.addEventListener("click",e=>{
      canvas.classList.remove('viewbarcode');
    },false);
    divcanvas.appendChild(canvas);
    li.appendChild(divcanvas);
    removebtn.classList.add('material');
    removebtn.classList.add('icon');
    ripple(removebtn);
    removebtn.addEventListener("click",e=>{
      barcodeelems.splice(barcodeelems.indexOf(input),1);
      barcodeul.removeChild(li);
      li=divcanvas=input=canvas=divbtn=removebtn=viewbtn=null;
      updateSave();
    },false);
    removebtn.innerHTML=`<i class="material-icons">remove</i>`;
    divbtn.appendChild(removebtn);
    viewbtn.classList.add('material');
    viewbtn.classList.add('icon');
    ripple(viewbtn);
    viewbtn.addEventListener("click",e=>{
      canvas.classList.add('viewbarcode');
    },false);
    viewbtn.innerHTML=`<i class="material-icons">visibility</i>`;
    divbtn.appendChild(viewbtn);
    li.appendChild(divbtn);
    return li;
  }
  var t=document.createDocumentFragment();
  for (var i=0;i<barcodes.length;i++) {
    t.appendChild(newBarcodeLi(barcodes[i]));
  }
  barcodeul.insertBefore(t,add.parentNode);
  add.addEventListener("click",e=>{
    barcodeul.insertBefore(newBarcodeLi(),add.parentNode);
  },false);
},false);
