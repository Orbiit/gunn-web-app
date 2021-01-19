(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.mining = factory();
  }
}(typeof self !== 'undefined' ? self : this, function (b) {
  'use strict';

  function loadImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.addEventListener('load', () => resolve(img));
      img.src = url;
    });
  }

  function mining(onDie) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('mining');
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    wrapper.appendChild(canvas);
    const p = document.createElement('p');
    const output = document.createElement('textarea');
    output.rows = 3;
    output.cols = 60;
    output.readOnly = true;
    output.value = 'ARROW KEYS TO MOVE/MINE. COLLECT OIL/MAGMA FOR FUEL. HELL HURTS AFTER PROLONGED EXPOSURE. YOU MAY HEAL IN HEAVEN.';
    p.appendChild(output);
    wrapper.appendChild(p);
    function tdBtn(orientation, arrow) {
      const td = document.createElement('td');
      const button = document.createElement('button');
      button.textContent = arrow;
      button.addEventListener('click', e => {
        player.orientation = orientation;
        player.move();
      });
      td.appendChild(button);
      return td;
    }
    const table = document.createElement('table');
    const tr1 = document.createElement('tr');
    tr1.appendChild(document.createElement('td'));
    tr1.appendChild(tdBtn(1, '^'));
    tr1.appendChild(document.createElement('td'));
    table.appendChild(tr1);
    const tr2 = document.createElement('tr');
    tr2.appendChild(tdBtn(0, '<'));
    tr2.appendChild(tdBtn(3, 'v'));
    tr2.appendChild(tdBtn(2, '>'));
    table.appendChild(tr2);
    wrapper.appendChild(table);

    function drawTile(tile, x, y) {
      const pos = TILE_DATA.indexOf(tile);
      if (~pos) {
        c.drawImage(tileTextures, pos % TILE_WIDTH * SOURCE_TILE_SIZE,
          Math.floor(pos / TILE_WIDTH) * SOURCE_TILE_SIZE, SOURCE_TILE_SIZE,
          SOURCE_TILE_SIZE, x, y, TILE_SIZE, TILE_SIZE);
      }
    }
    loadImage('./otherstuff.png').then(init);

    const handleKeyDown = e => {
      if (e.keyCode >= 37 && e.keyCode <= 40) {
        player.orientation = e.keyCode - 37;
        player.move();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const CANVAS_SIZE = 300;
    const c = canvas.getContext('2d', {alpha: false});
    c.imageSmoothingEnabled = false;
    c.mozImageSmoothingEnabled = false;
    c.webkitImageSmoothingEnabled = false;

    const TILE_DATA = 'odgrlfsmbcht1234>v<^9876'; // order of tiles in the textures
    const ORIENTATIONS = '<^>v';
    const TILE_WIDTH = 4; // tiles per row in the textures
    const SOURCE_TILE_SIZE = 20; // size of tile in textures
    const TILE_SIZE = 60; // size of tile when rendered
    const COLS = Math.floor(CANVAS_SIZE / TILE_SIZE);
    const ROWS = Math.floor(CANVAS_SIZE / TILE_SIZE); // technically the same
    let tileTextures;
    // o - oil,  d - dirt,  g - gold,   r - rock
    // l - lava, f - flesh, s - silver, m - meat
    // b - box,  c - cloud, h - health, t - top (grass)
    // gems 1-4
    // player left, down, right, up
    // break progress 9-6
    function getTile(c, r) {
      return holes.includes(c + '.' + r) ? ' ' : worldData[r * COLS + c];
    }

    const HARD_BLOCKS = 'rm';
    const HOT_BLOCKS = 'lfs';
    const MAX_POWER = 600;
    const MAX_HEALTH = 300;
    const player = {
      x: 2, y: 2, orientation: 2, power: MAX_POWER, health: MAX_HEALTH,
      inv: { gold: 0, silver: 0, gem1: 0, gem2: 0, gem3: 0, gem4: 0 },
      move() {
        let tile = null;
        let newX, newY;
        switch (this.orientation) {
          case 0:
            if (this.x > 0)
              tile = getTile(newX = this.x - 1, newY = this.y);
            break;
          case 1:
            if (this.y > 0)
              tile = getTile(newX = this.x, newY = this.y - 1);
            break;
          case 2:
            if (this.x < COLS - 1)
              tile = getTile(newX = this.x + 1, newY = this.y);
            break;
          case 3:
            tile = getTile(newX = this.x, newY = this.y + 1);
            break;
        }
        if (tile !== ' ') {
          if (HARD_BLOCKS.includes(tile)) {
            const progress = mineProgress[newX + '.' + newY] || 0;
            if (progress < 4) {
              mineProgress[newX + '.' + newY] = progress + 1;
            } else {
              delete mineProgress[newX + '.' + newY];
              holes.push(newX + '.' + newY);
            }
          } else {
            holes.push(newX + '.' + newY);
            switch (tile) {
              case 'o':
              case 'b':
                this.power = Math.min(MAX_POWER, this.power + 120);
                break;
              case 'l':
                this.power = Math.min(MAX_POWER, this.power + 240);
                break;
              case 'h':
                this.health = Math.min(MAX_HEALTH, this.health + MAX_HEALTH / 2);
                break;
              case 'g':
                this.inv.gold++;
                break;
              case 's':
                this.inv.silver++;
                break;
              case '1':
              case '2':
              case '3':
              case '4':
                this.inv['gem' + tile]++;
                break;
            }
          }
          this.power -= 30;
        } else if (this.orientation === 0 || this.orientation === 2) {
          this.x = newX;
        }
        let fall = 0;
        while (getTile(this.x, this.y + 1) === ' ') {
          this.y++, fall++;
          if (getWorldHeight() <= this.y + 1) genWorld();
        }
        if (fall > 2) this.health -= (fall - 2) * 20;
      }
    };
    let cameraY = 0;
    const holes = [];
    const mineProgress = {};
    let worldData = '';
    const dirtBiomeTiles = 'ooodddddddddddddgrrrr ';
    const hellBiomeTiles = 'lllfffffffffffffsmmmm ';
    const skyBiomeTiles = 'bbbccccccccccccccccccccccccccchhh1234                      ';
    function genWorld() {
      const level = getWorldHeight();
      const tiles = [dirtBiomeTiles, hellBiomeTiles, skyBiomeTiles][Math.floor(level / 10 % 3)];
      for (let i = COLS; i--;) worldData += tiles[Math.floor(Math.random() * tiles.length)];
    }
    function getWorldHeight() {
      return Math.floor(worldData.length / COLS);
    }
    function init(textures) {
      tileTextures = textures;
      worldData += ' '.repeat(COLS * 3); // 3 rows of air
      worldData += 't'.repeat(COLS);
      paint();
    }
    const METER_HEIGHT = 4;
    function drawMeter(width, x, y, value, colour) {
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(x - width / 2, y - METER_HEIGHT / 2, width, METER_HEIGHT);
      c.fillStyle = colour;
      if (value >= 0)
        c.fillRect(x - width / 2, y - METER_HEIGHT / 2, width * value, METER_HEIGHT);
    }
    let lastAnimationId;
    let animating = true;
    function paint() {
      c.fillStyle = 'black';
      c.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      if (HOT_BLOCKS.includes(getTile(player.x, player.y + 1))) player.health --;

      // generate world as needed
      while (getWorldHeight() < player.y + ROWS) genWorld();

      // render world
      cameraY += ((player.y * TILE_SIZE - CANVAS_SIZE / 2) - cameraY) / 3;
      for (let start = Math.floor(cameraY / TILE_SIZE),
          stop = Math.ceil(cameraY / TILE_SIZE) + ROWS,
          r = start; r < stop; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * TILE_SIZE, y = r * TILE_SIZE - cameraY;
          drawTile(getTile(c, r), x, y);
          if (c === player.x && r === player.y) {
            drawTile(ORIENTATIONS[player.orientation], x, y);
            drawMeter(TILE_SIZE * 2 / 3, x + TILE_SIZE / 2, y, player.health / MAX_HEALTH, 'rgba(255,0,0,0.8)');
          } else if (mineProgress[c + '.' + r])
            drawTile(10 - mineProgress[c + '.' + r], x, y);
        }
      }
      drawMeter(TILE_SIZE * 2 / 3, CANVAS_SIZE / 2, 10, player.power / MAX_POWER, 'rgba(255,255,0,0.8)');

      if (player.power > 0 && player.health > 0) {
        if (animating) {
          lastAnimationId = window.requestAnimationFrame(paint);
        }
      } else {
        output.value = `GAME OVER - ${player.power <= 0 ? 'NO FUEL' : 'YOU DIED'}\n`
          + `GOLD: ${player.inv.gold}. SILVER: ${player.inv.silver}.`
          + ` RUBY: ${player.inv.gem1}. EMERALD: ${player.inv.gem2}.`
          + ` DIAMOND: ${player.inv.gem3}. AMETHYST : ${player.inv.gem4}.`;
        if (onDie) onDie(player.inv);
      }
    }
    return {
      wrapper: wrapper,
      stop() {
        animating = false;
        window.cancelAnimationFrame(lastAnimationId);
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }
  return mining;
}));
