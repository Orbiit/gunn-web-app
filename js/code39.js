import { logError } from './utils.js'
/*
  MADE BY SEAN
  CREDITS TO WIKIPEDIA
  https://en.wikipedia.org/wiki/Code_39
  I USED THEIR JQUERY AS WELL TO TURN THEIR HELPFUL TABLE INTO JSON THAT I COPIED AND PASTED HERE
*/
export function code39 (chars, canvaselem) {
  let canvas
  if (canvaselem && canvaselem.tagName === 'CANVAS') canvas = canvaselem
  else {
    canvas = document.createElement('canvas')
    canvaselem = undefined
  }
  const c = canvas.getContext('2d')
  try {
    canvas.style.imageRendering = 'optimizeSpeed'
    canvas.style.imageRendering = '-moz-crisp-edges'
    canvas.style.imageRendering = '-webkit-optimize-contrast'
    canvas.style.imageRendering = '-o-crisp-edges'
    canvas.style.imageRendering = 'pixelated'
    canvas.style.msInterpolationMode = 'nearest-neighbor'
  } catch (e) {
    logError(e)
  }
  chars = '*' + chars.toUpperCase().replace(/[^A-Z0-9\-. +/$%]/g, '') + '*'
  canvas.height = 100
  canvas.width = chars.length * 16 - 1
  if (canvaselem) c.clearRect(0, 0, canvas.width, canvas.height)
  c.fillStyle = 'white'
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.fillStyle = 'black'
  for (let i = 0, x = 0; i < chars.length; i++) {
    const pattern = code39.values[chars[i]].toString(3)
    for (let j = 0; j < pattern.length; j++)
      switch (pattern[j]) {
        case '2':
          c.fillRect(x, 0, 3, canvas.height)
          x += 4
          break
        case '1':
          c.fillRect(x, 0, 1, canvas.height)
          x += 2
          break
        case '0':
          x += 2
          break
      }
  }
  return canvas
}
code39.values = {
  0: 349,
  1: 581,
  2: 419,
  3: 661,
  4: 347,
  5: 589,
  6: 427,
  7: 341,
  8: 583,
  9: 421,
  A: 599,
  K: 605,
  U: 527,
  B: 437,
  L: 443,
  V: 311,
  C: 679,
  M: 685,
  W: 553,
  D: 383,
  N: 389,
  X: 293,
  E: 625,
  O: 631,
  Y: 535,
  F: 463,
  P: 469,
  Z: 319,
  G: 359,
  Q: 371,
  '-': 287,
  H: 601,
  R: 613,
  '.': 529,
  I: 439,
  S: 451,
  ' ': 313,
  J: 385,
  T: 397,
  '*': 295,
  '+': 2521,
  '/': 2467,
  $: 2461,
  '%': 3007
}
