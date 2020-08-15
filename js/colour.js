import { localize } from './l10n.js'
import { materialInput } from './material.js'

export class ColourPicker {
  constructor (onchange = () => {}) {
    this.onchange = onchange
    this.window = document.createElement('div')
    this.input = materialInput(localize('hex'))
    this.sv = document.createElement('div')
    this.svindicator = document.createElement('div')
    this.hue = document.createElement('div')
    this.hueindicator = document.createElement('div')
    ColourPicker.css(
      this.window
    )`position:fixed``opacity:0``pointer-events:none`
    this.window.classList.add('colourpicker-window')
    this.input.wrapper.classList.add('colourpicker-input')
    this.input.input.addEventListener(
      'change',
      e => {
        this.colour = this.input.input.value
      },
      false
    )
    ColourPicker.css(
      this.sv
    )`position:relative``background-image: linear-gradient(0deg,black,transparent), linear-gradient(90deg,white,transparent)`
    this.sv.classList.add('colourpicker-svslider')
    ColourPicker.mouseMove(this.sv, (x, y) => {
      const rect = this.sv.getBoundingClientRect()
      x = x - rect.left
      y = y - rect.top
      if (x > rect.width) x = rect.width
      else if (x < 0) x = 0
      if (y > rect.height) y = rect.height
      else if (y < 0) y = 0
      this.svindicator.style.left = x + 'px'
      this.svindicator.style.top = y + 'px'
      this.hsv[1] = (x / rect.width) * 100
      this.hsv[2] = 100 - (y / rect.height) * 100
      this.hue.style.backgroundImage = this.getHueGradient()
      this.input.input.value = this.getHex()
      this._setFilled()
      this.onchange(this.input.input.value)
    })
    ColourPicker.css(
      this.svindicator
    )`position:absolute``pointer-events:none``z-index:1`
    this.svindicator.classList.add('colourpicker-svindicator')
    ColourPicker.css(this.hue)`position:relative`
    this.hue.classList.add('colourpicker-hueslider')
    ColourPicker.mouseMove(this.hue, (x, y) => {
      const rect = this.hue.getBoundingClientRect()
      y = y - rect.top
      if (y > rect.height) y = rect.height
      else if (y < 0) y = 0
      this.hueindicator.style.top = y + 'px'
      this.hsv[0] = (y / rect.height) * 360
      this.sv.style.backgroundColor = `hsl(${this.hsv[0]},100%,50%)`
      this.input.input.value = this.getHex()
      this._setFilled()
      this.onchange(this.input.input.value)
    })
    this.hue.addEventListener(
      'wheel',
      e => {
        this.hsv[0] =
          (Math.round(e.deltaY / 25) +
            this.hsv[0] +
            Math.ceil(Math.abs(e.deltaY) / 360) * 360) %
          360
        this.sv.style.backgroundColor = `hsl(${this.hsv[0]},100%,50%)`
        this.hueindicator.style.top = this.hsv[0] / 3.6 + '%'
        this.input.input.value = this.getHex()
        this._setFilled()
        this.onchange(this.input.input.value)
      },
      false
    )
    ColourPicker.css(
      this.hueindicator
    )`position:absolute``pointer-events:none``z-index:1`
    this.hueindicator.classList.add('colourpicker-hueindicator')
    this.hue.appendChild(this.hueindicator)
    this.sv.appendChild(this.svindicator)
    this.window.appendChild(this.input.wrapper)
    this.window.appendChild(this.sv)
    this.window.appendChild(this.hue)
    document.body.appendChild(this.window)
  }

  _setFilled () {
    if (this.input.input.value) {
      this.input.wrapper.classList.add('filled')
    } else {
      this.input.wrapper.classList.remove('filled')
    }
  }

  trigger (src) {
    ColourPicker.css(this.window)`opacity:1``pointer-events:all`
    if (src) {
      const rect = src.getBoundingClientRect()
      const windowrect = this.window.getBoundingClientRect()
      this.window.style.top =
        (rect.bottom + windowrect.height > window.innerHeight
          ? rect.top - windowrect.height < 0
            ? 0
            : rect.top - windowrect.height
          : rect.bottom) + 'px'
      this.window.style.left =
        (rect.left + windowrect.width > window.innerWidth
          ? rect.right - windowrect.width < 0
            ? 0
            : rect.right - windowrect.width
          : rect.left) + 'px'
    }
    const dismiss = e => {
      if (!this.window.contains(e.target) && e.target !== src) {
        ColourPicker.css(this.window)`opacity:0``pointer-events:none`
        document.removeEventListener('click', dismiss, false)
      }
    }
    document.addEventListener('click', dismiss, false)
  }

  getHueGradient () {
    const [s, l] = ColourPicker.SVtoSL(this.hsv[1], this.hsv[2])
    return `linear-gradient(hsl(0,${s}%,${l}%),hsl(60,${s}%,${l}%),hsl(120,${s}%,${l}%),hsl(180,${s}%,${l}%),hsl(240,${s}%,${l}%),hsl(300,${s}%,${l}%),hsl(0,${s}%,${l}%))`
  }

  getHex () {
    const [r, g, b] = ColourPicker.HSVtoRGB(...this.hsv)
    return (
      '#' +
      ('0' + r.toString(16)).slice(-2) +
      ('0' + g.toString(16)).slice(-2) +
      ('0' + b.toString(16)).slice(-2)
    )
  }

  set colour (c) {
    c = c
      .toUpperCase()
      .replace(/[^0-9A-F]/g, '')
      .slice(0, 6)
    if (c.length === 4) c = c.slice(0, 3)
    if (c.length === 3)
      c = c
        .split('')
        .map(a => a + a)
        .join('')
    if (c.length === 6) {
      this.input.input.value = '#' + c
      this.hsv = ColourPicker.RGBtoHSV(
        parseInt(c.slice(0, 2), 16),
        parseInt(c.slice(2, 4), 16),
        parseInt(c.slice(4, 6), 16)
      )
      this.sv.style.backgroundColor = `hsl(${this.hsv[0]},100%,50%)`
      this.hueindicator.style.top = this.hsv[0] / 3.6 + '%'
      this.svindicator.style.left = this.hsv[1] + '%'
      this.svindicator.style.top = 100 - this.hsv[2] + '%'
      this.hue.style.backgroundImage = this.getHueGradient()
      this.onchange(this.input.input.value)
    } else this.input.input.value = this.getHex()
    this._setFilled()
  }

  get colour () {
    return this.input.input.value
  }

  darkness () {
    const [r, g, b] = ColourPicker.HSVtoRGB(...this.hsv)
    return Math.round(
      (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000
    )
  }

  static mouseMove (elem, fn) {
    elem.addEventListener(
      'mousedown',
      e => {
        const move = e => {
          fn(e.clientX, e.clientY)
          e.preventDefault()
        }
        const up = e => {
          fn(e.clientX, e.clientY)
          document.removeEventListener('mousemove', move, false)
          document.removeEventListener('mouseup', up, false)
          e.preventDefault()
        }
        document.addEventListener('mousemove', move, false)
        document.addEventListener('mouseup', up, false)
        e.preventDefault()
      },
      false
    )
    elem.addEventListener(
      'touchstart',
      e => {
        const move = e => {
          fn(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
          e.preventDefault()
        }
        const up = e => {
          fn(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
          document.removeEventListener('touchmove', move, { passive: false })
          document.removeEventListener('touchend', up, { passive: false })
          e.preventDefault()
        }
        document.addEventListener('touchmove', move, { passive: false })
        document.addEventListener('touchend', up, { passive: false })
        e.preventDefault()
      },
      { passive: false }
    )
  }

  static css (elem) {
    function setCSS ([declaration]) {
      elem.style.setProperty(
        declaration.slice(0, declaration.indexOf(':')),
        declaration.slice(declaration.indexOf(':') + 1)
      )
      return setCSS
    }
    return setCSS
  }

  // ranges: 255, 360, 100 (figure out what that means yourself)
  static SVtoSL (s, v) {
    s /= 100
    v /= 100
    let _l = (2 - s) * v
    _l = [
      Math.round(((s * v) / (_l <= 1 ? _l : 2 - _l)) * 100),
      Math.round(_l * 50)
    ]
    if (isNaN(_l[0])) _l[0] = 0
    return _l
  }

  static SLtoSV (s, l) {
    l /= 50
    s /= 100
    s *= l <= 1 ? l : 2 - l
    return [Math.round(((2 * s) / (l + s)) * 100), Math.round((l + s) * 50)]
  }

  static RGBtoHSV (r, g, b) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h
    const s = max === 0 ? 0 : d / max
    const v = max / 255
    switch (max) {
      case min:
        h = 0
        break
      case r:
        h = g - b + d * (g < b ? 6 : 0)
        h /= 6 * d
        break
      case g:
        h = b - r + d * 2
        h /= 6 * d
        break
      case b:
        h = r - g + d * 4
        h /= 6 * d
        break
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
  }

  static HSVtoRGB (h, s, v) {
    let r, g, b
    h /= 360
    s /= 100
    v /= 100
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)
    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break
      case 1:
        r = q
        g = v
        b = p
        break
      case 2:
        r = p
        g = v
        b = t
        break
      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break
      case 5:
        r = v
        g = p
        b = q
        break
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  }
}
