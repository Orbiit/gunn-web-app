window.addEventListener("load",e=>{
  var barcodeul=document.querySelector('#barcode'),
  add=document.querySelector('#addbarcode'),
  barcodes=[['You', "95012345"]],
  barcodeelems=[];
  let code = cookie.getItem('[gunn-web-app] barcode.ids');
  if (code) {
    if (code[0] === 'A') barcodes = JSON.parse(code.slice(1));
    else barcodes=code.split(',').map((a, i) => ['Student #' + i, a]);
  }
  function updateSave() {
    cookie.setItem('[gunn-web-app] barcode.ids', 'A' + JSON.stringify(barcodeelems.map(([a, b])=>[a.value, b.value])));
  }
  function newBarcodeLi([name = 'Intellectual student', code = "95012345"] = []) {
    var li=document.createElement("li"),
    divcanvas=document.createElement("div"),
    input=document.createElement("input"),
    canvas=document.createElement("canvas"),
    divbtn=document.createElement("div"),
    removebtn=document.createElement("button"),
    viewbtn=document.createElement("button");
    divcanvas.classList.add('canvas');
    const studentNameInput = document.createElement('input');
    studentNameInput.value = name;
    studentNameInput.placeholder = "Who's ID is this?";
    studentNameInput.classList.add('barcode-student-name');
    studentNameInput.addEventListener("input",e=>{
      updateSave();
    },false);
    divcanvas.appendChild(studentNameInput);
    //input.type='number';
    input.value=code;
    input.classList.add('barcode-student-id');
    input.addEventListener("input",e=>{
      code39(input.value,canvas);
      updateSave();
    },false);
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
    removebtn.innerHTML=`<i class="material-icons">&#xE15B;</i>`;
    divbtn.appendChild(removebtn);
    viewbtn.classList.add('material');
    viewbtn.classList.add('icon');
    ripple(viewbtn);
    viewbtn.addEventListener("click",e=>{
      canvas.classList.add('viewbarcode');
    },false);
    viewbtn.innerHTML=`<i class="material-icons">&#xE8F4;</i>`;
    divbtn.appendChild(viewbtn);
    li.appendChild(divbtn);
    barcodeelems.push([studentNameInput, input]);
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
  updateSave();
},false);
