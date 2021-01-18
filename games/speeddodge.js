(function(root,factory){
  if (typeof define === 'function' && define.amd) {
    define([],factory);
  } else {
    // Browser globals
    root.speeddodge=factory();
  }
}(typeof self!=='undefined'?self:this,function(b){
  'use strict';

  function speeddodge(onScore) {
    var wrapper=document.createElement("div"),
    p=document.createElement("p"),
    button=document.createElement("button"),
    ul=document.createElement("ul"),
    canvas=document.createElement("canvas"),
    c=canvas.getContext('2d'),
    y=0,
    currenty=0,
    playerheight=10,
    playerx=30,
    enemies=[],
    lastEnemy=0,
    starttime=new Date().getTime(),
    ammo=3,
    shooting=false,
    shots=[],
    speed=0.1;
    wrapper.className="speeddodge-wrapper";
    p.textContent="collect orange dots; as defense, press ";
    button.textContent="space to shoot";
    p.appendChild(button);
    wrapper.appendChild(p);
    wrapper.appendChild(canvas);
    wrapper.appendChild(ul);
    canvas.className="speeddodge";
    canvas.height=360;
    canvas.width=500;
    canvas.addEventListener("mousemove",e=>{
      y=e.clientY-canvas.getBoundingClientRect().top-playerheight/2;
      if (y>canvas.height-playerheight) y=canvas.height-playerheight;
      else if (y<0) y=0;
    },false);
    canvas.addEventListener("touchmove",e=>{
      y=e.changedTouches[0].clientY-canvas.getBoundingClientRect().top-playerheight/2;
      if (y>canvas.height-playerheight) y=canvas.height-playerheight;
      else if (y<0) y=0;
    },false);
    var handleMouseDown=e=>{
      if (!shooting) {
        if (ammo>0) {
          ammo--;
          shots.push([playerx,y,canvas.width,playerheight,Date.now()]);
        }
        shooting=true;
      }
    },
    handleMouseUp=e=>{
      shooting=false;
    },
    handleKeyDown=e=>{
      if (e.keyCode===32) {
        if (!shooting) {
          if (ammo>0) {
            ammo--;
            shots.push([playerx,y,canvas.width,playerheight,Date.now()]);
          }
          shooting=true;
        }
        e.preventDefault();
      }
    },
    handleKeyUp=e=>{
      if (e.keyCode===32) {
        shooting=false;
        e.preventDefault();
      }
    };
    button.addEventListener("mousedown",handleMouseDown,false);
    button.addEventListener("mouseup",handleMouseUp,false);
    button.addEventListener("touchstart",handleMouseDown,false);
    button.addEventListener("touchend",handleMouseUp,false);
    document.addEventListener("keydown",handleKeyDown,false);
    document.addEventListener("keyup",handleKeyUp,false);
    var animating=true,
    lastAnimationId;
    function fill([x,y,width,height]){
      c.fillRect(x,y,width,height)
    }
    function collide([x1,y1,width1,height1],[x2,y2,width2,height2]){
      return x1<=x2+width2&&y1<=y2+height2&&x2<=x1+width1&&y2<=y1+height1
    }
    function render() {
      c.fillStyle='rgba(255,255,255,0.8)';
      fill([0,0,canvas.width,canvas.height]);
      currenty+=(y-currenty)/5;
      var lose=false;
      if (Date.now()-lastEnemy>50/speed) {
        lastEnemy=Date.now();
        var type;
        switch (Math.floor(Math.random()*7)) {
          case 0:
            type='fast';
            break;
          case 1:
            type='sine';
            break;
          case 2:
            type='fat';
            break;
          case 3:
            type='ammo';
            break;
          default:
            type='normal';
        }
        enemies.push({
          x:500,
          y:Math.random()*(canvas.height-playerheight),
          type:type,
          sinebase:Math.random()*(canvas.height-playerheight-100)+50,
          creation:new Date().getTime()
        });
      }
      var player=[playerx,currenty,20,10];
      for (var i=0;i<enemies.length;i++) {
        switch (enemies[i].type) {
          case 'fast':
            enemies[i].x-=9;
            break;
          case 'fat':
            enemies[i].x-=1;
            break;
          case 'sine':
            enemies[i].y=Math.sin((new Date().getTime()-enemies[i].creation)/50*speed)*50+enemies[i].sinebase;
          default:
            enemies[i].x-=3;
        }
        enemies[i].x-=speed*(enemies[i].type==='fast'?12:9);
        c.fillStyle=enemies[i].type==='fast'?'red':
                    enemies[i].type==='sine'?'green':
                    enemies[i].type==='fat'?'black':
                    enemies[i].type==='ammo'?'orange':
                    'blue';
        if (enemies[i].x+20<0) enemies.splice(i--,1);
        else {
          var rect=[enemies[i].x,enemies[i].y,20,10];
          if (enemies[i].type==='fat') rect=[enemies[i].x,enemies[i].y,20,15];
          else if (enemies[i].type==='ammo') rect=[enemies[i].x,enemies[i].y,5,5];
          fill(rect);
          var shot=false;
          if (enemies[i].type!=='fat') for (var j=0;j<shots.length;j++) {
            if (collide(shots[j],rect)) {
              if (enemies[i].type==='ammo') ammo++;
              enemies.splice(i--,1);
              shot=true;
              break;
            }
          }
          if (!shot&&collide(player,rect)) {
            if (enemies[i].type==='ammo') {
              ammo++;
              enemies.splice(i--,1);
            }
            else lose=true;
          }
        }
      }
      for (var i=0;i<shots.length;i++) {
        var age=Date.now()-shots[i][4];
        c.fillStyle='rgba(255,165,0,'+(1-age/200)+')';
        fill(shots[i]);
        if (age>200) shots.splice(i--, 1);
      }
      speed+=(1-speed)*1e-3;
      c.fillStyle='purple';
      fill(player);
      c.fillStyle='orange';
      for (var i=0;i<ammo;i++) fill([i*10+5,canvas.height-10,5,5]);
      if (lose) {
        var li=document.createElement('li'),
        score=new Date().getTime()-starttime;
        li.innerHTML=score;
        if (onScore) onScore(score);
        if (ul.firstChild) ul.insertBefore(li,ul.firstChild);
        else ul.appendChild(li,ul.firstChild);
        enemies=[],
        lastEnemy=0,
        starttime=new Date().getTime(),
        speed=0.1;
        setTimeout(()=>{
          ammo=3,
          shots=[];
          if (animating) lastAnimationId=window.requestAnimationFrame(render);
        },1000);
      } else if (animating) {
        lastAnimationId=window.requestAnimationFrame(render);
      }
    }
    lastAnimationId=window.requestAnimationFrame(render);
    return {
      wrapper,
      stop:()=>{
        animating=false;
        window.cancelAnimationFrame(lastAnimationId);
        document.removeEventListener("keydown",handleKeyDown,false);
        document.removeEventListener("keyup",handleKeyUp,false);
      }
    };
  }
  return speeddodge
}));
