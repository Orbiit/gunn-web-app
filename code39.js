/*
  MADE BY SEAN
  CREDITS TO WIKIPEDIA
  https://en.wikipedia.org/wiki/Code_39
  I USED THEIR JQUERY AS WELL TO TURN THEIR HELPFUL TABLE INTO JSON THAT I COPIED AND PASTED HERE
*/
function code39(chars,canvaselem) {
  var canvas;
  if (canvaselem&&canvaselem.tagName==='CANVAS') canvas=canvaselem;
  else canvas=document.createElement("canvas"),canvaselem=undefined;
  var c=canvas.getContext('2d');
  canvas.height=100;
  canvas.width=chars.length*16+31;
  try {
    canvas.style.imageRendering='optimizeSpeed';
    canvas.style.imageRendering='-moz-crisp-edges';
    canvas.style.imageRendering='-webkit-optimize-contrast';
    canvas.style.imageRendering='-o-crisp-edges';
    canvas.style.imageRendering='pixelated';
    canvas.style.msInterpolationMode='nearest-neighbor';
  } catch (e) {
    console.log(e);
  }
  if (canvaselem) c.clearRect(0,0,canvas.width,canvas.height);
  c.fillStyle='white';
  c.fillRect(0,0,canvas.width,canvas.height);
  c.fillStyle='black';
  chars='*'+chars.toUpperCase().replace(/[^A-Z0-9\-\. \+/\$%]/g,'')+'*';
  for (var i=0,x=0;i<chars.length;i++) {
    var pattern=code39.values[chars[i]];
    for (var j=0;j<pattern.length;j++) switch (pattern[j]) {
      case 'm':c.fillRect(x,0,3,canvas.height);x+=4;break;
      case 'n':c.fillRect(x,0,1,canvas.height);x+=2;break;
      case ' ':x+=2;break;
    }
  }
  return canvas;
}
code39.values={"0":"nn mmn","1":"mn nnm","2":"nm nnm","3":"mm nnn","4":"nn mnm","5":"mn mnn","6":"nm mnn","7":"nn nmm","8":"mn nmn","9":"nm nmn","A":"mnn nm","K":"mnnn m","U":"m nnnm","B":"nmn nm","L":"nmnn m","V":"n mnnm","C":"mmn nn","M":"mmnn n","W":"m mnnn","D":"nnm nm","N":"nnmn m","X":"n nmnm","E":"mnm nn","O":"mnmn n","Y":"m nmnn","F":"nmm nn","P":"nmmn n","Z":"n mmnn","G":"nnn mm","Q":"nnnm m","-":"n nnmm","H":"mnn mn","R":"mnnm n",".":"m nnmn","I":"nmn mn","S":"nmnm n"," ":"n mnmn","J":"nnm mn","T":"nnmm n","*":"n nmmn","+":"n nn n n","/":"n n nn n","$":"n n n nn","%":"nn n n n"};
