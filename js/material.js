import { closeDialog, currentTime, NADA, toEach } from './utils.js'

export function ripple (elem) {
  if (typeof elem === 'string') {
    const s = document.querySelectorAll(elem)
    for (let i = 0; i < s.length; i++) ripple(s[i])
    return
  }
  function mousedown (x, y) {
    let r = document.createElement('div')
    const rect = elem.getBoundingClientRect()
    r.classList.add('ripple')
    if (elem.classList.contains('ripple-light')) r.classList.add('ripple-light')
    if (elem.classList.contains('ripple-dark')) r.classList.add('ripple-dark')
    r.style.left = x - rect.left + 'px'
    r.style.top = y - rect.top + 'px'
    elem.appendChild(r)
    const start = currentTime()
    const dest = Math.max(rect.width, rect.height) / 10
    const duration = dest * 31
    let fade = false
    let fadestart
    function updateScale () {
      const elapsed = (currentTime() - start) / duration
      const fadeelapsed = (currentTime() - fadestart) / 500
      if (fade && fadeelapsed > 1) {
        elem.removeChild(r)
        r = null
      } else {
        r.style.transform = `scale(${elapsed * dest})`
        if (fadeelapsed) r.style.opacity = 1 - fadeelapsed
        else r.style.opacity = 1
        window.requestAnimationFrame(updateScale)
      }
    }
    function mouseup (e) {
      fade = true
      fadestart = currentTime()
      document.removeEventListener('mouseup', mouseup, false)
      document.removeEventListener('touchend', mouseup, false)
      if (e.type === 'touchend') lasttap = fadestart
    }
    window.requestAnimationFrame(updateScale)
    document.addEventListener('mouseup', mouseup, false)
    document.addEventListener('touchend', mouseup, false)
  }
  let lasttap = 0
  elem.addEventListener(
    'mousedown',
    e => {
      if (currentTime() - lasttap > 100) mousedown(e.clientX, e.clientY)
    },
    false
  )
  elem.addEventListener(
    'touchstart',
    e => {
      mousedown(e.touches[0].clientX, e.touches[0].clientY)
    },
    false
  )
  const focusblob = document.createElement('div')
  focusblob.classList.add('ripple')
  focusblob.classList.add('ripple-focus')
  /* elem.addEventListener("focus",e=>{
    let rect=elem.getBoundingClientRect();
    focusblob.style.width=focusblob.style.height=(Math.max(rect.width,rect.height)*0.8)+'px';
    elem.appendChild(focusblob);
  },false);
  elem.addEventListener("blur",e=>{
    elem.removeChild(focusblob);
  },false); */
}
export function materialInput (
  labeltext,
  type = 'text',
  ariaLabel = labeltext
) {
  const inputwrapper = document.createElement('div')
  const label = document.createElement('label')
  const input = document.createElement('input')
  const line = document.createElement('div')
  inputwrapper.classList.add('customiser-inputwrapper')
  label.classList.add('customiser-label')
  label.innerHTML = labeltext
  input.classList.add('customiser-input')
  input.type = type
  input.setAttribute('aria-label', ariaLabel)
  input.addEventListener(
    'change',
    e => {
      if (input.value) inputwrapper.classList.add('filled')
      else inputwrapper.classList.remove('filled')
    },
    false
  )
  input.addEventListener(
    'mouseenter',
    e => {
      inputwrapper.classList.add('hover')
    },
    false
  )
  input.addEventListener(
    'mouseleave',
    e => {
      inputwrapper.classList.remove('hover')
    },
    false
  )
  input.addEventListener(
    'focus',
    e => {
      inputwrapper.classList.add('focus')
    },
    false
  )
  input.addEventListener(
    'blur',
    e => {
      inputwrapper.classList.remove('focus')
    },
    false
  )
  line.classList.add('customiser-line')
  inputwrapper.appendChild(label)
  inputwrapper.appendChild(input)
  inputwrapper.appendChild(line)
  return {
    wrapper: inputwrapper,
    label: label,
    input: input,
    line: line,
    get disabled () {
      return input.disabled
    },
    set disabled (disabled) {
      input.disabled = disabled
      if (disabled) {
        inputwrapper.classList.add('input-disabled')
      } else {
        inputwrapper.classList.remove('input-disabled')
      }
    }
  }
}
export function makeDropdown (wrapper, values) {
  const selectDisplay = document.createElement('span')
  selectDisplay.classList.add('mdrop-selected')
  selectDisplay.tabIndex = 0
  ripple(selectDisplay)
  const actualSelectDisplay = document.createElement('span')
  selectDisplay.appendChild(actualSelectDisplay)
  selectDisplay.appendChild(
    Object.assign(document.createElement('i'), {
      className: 'material-icons mdrop-arrow',
      textContent: '\ue5c5'
    })
  )
  wrapper.appendChild(selectDisplay)
  const dropdown = document.createElement('div')
  dropdown.classList.add('mdrop-values')
  dropdown.classList.add('show')
  let dropdownAdded = false
  const valuesByIndex = values.map(([valText, elem], i) => {
    const value = document.createElement('div')
    value.classList.add('mdrop-value')
    value.dataset.value = i
    value.tabIndex = 0
    ripple(value)
    if (typeof elem === 'string') {
      const temp = document.createElement('span')
      temp.textContent = elem
      elem = temp
    }
    value.appendChild(elem)
    dropdown.appendChild(value)
    return elem
  })
  function close () {
    dropdown.classList.remove('show')
    document.removeEventListener('click', close)
  }
  selectDisplay.addEventListener('click', e => {
    dropdown.classList.add('show')
    if (dropdownAdded) {
      dropdown.classList.add('show')
    } else {
      wrapper.appendChild(dropdown)
      dropdownAdded = true
    }
    document.addEventListener('click', close)
    e.stopPropagation()
  })
  let selected, onchange
  dropdown.addEventListener('click', e => {
    const value = e.target.closest('.mdrop-value')
    if (value) {
      selected = values[value.dataset.value][0]
      actualSelectDisplay.innerHTML =
        valuesByIndex[value.dataset.value].outerHTML
      if (onchange) onchange(selected)
    }
  })
  return {
    set (to) {
      const index = values.findIndex(pair => pair[0] === to)
      if (index !== -1) {
        selected = to
        actualSelectDisplay.innerHTML = valuesByIndex[index].outerHTML
      }
      return this
    },
    get () {
      return selected
    },
    onChange (fn) {
      onchange = fn
      return this
    }
  }
}
export function createRange (minRange = 0, onchange = NADA, oninput = NADA) {
  const range = document.createElement('div')
  range.classList.add('material-range')
  range.tabIndex = 0
  const minKnob = document.createElement('div')
  minKnob.classList.add('range-knob')
  minKnob.classList.add('range-min')
  range.appendChild(minKnob)
  const maxKnob = document.createElement('div')
  maxKnob.classList.add('range-knob')
  maxKnob.classList.add('range-max')
  range.appendChild(maxKnob)
  const selected = document.createElement('div')
  selected.classList.add('range-selected')
  range.appendChild(selected)
  let min = 0
  let max = 1
  let controlling = null
  function acceptInput (callListener = true) {
    if (max > 1) max = 1
    if (min < 0) min = 0
    range.style.setProperty('--min', min * 100 + '%')
    range.style.setProperty('--max', (1 - max) * 100 + '%')
    if (callListener) oninput([min, max])
  }
  function acceptChange (callListener = true) {
    if (max - min < minRange) max = Math.min(1, min + minRange)
    if (max - min < minRange) min = Math.max(0, max - minRange)
    acceptInput()
    if (callListener) onchange([min, max])
  }
  let rect
  function getPos (e) {
    return Math.max(
      Math.min(
        ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) /
          rect.width,
        1
      ),
      0
    )
  }
  function start (e) {
    if (controlling) return
    rect = range.getBoundingClientRect()
    const pos = getPos(e)
    if (pos < (min + max) / 2) {
      controlling = 'min'
      min = pos
    } else {
      controlling = 'max'
      max = pos
    }
    ;(controlling === 'min' ? minKnob : maxKnob).classList.add(
      'range-controlled'
    )
    document.addEventListener(
      e.type === 'touchstart' ? 'touchmove' : 'mousemove',
      move,
      { passive: false }
    )
    document.addEventListener(
      e.type === 'touchstart' ? 'touchend' : 'mouseup',
      end,
      { passive: false }
    )
    acceptInput()
    e.preventDefault()
  }
  function move (e) {
    const pos = getPos(e)
    if (controlling === 'min') {
      if (pos > max) {
        controlling = 'max'
        maxKnob.classList.add('range-controlled')
        minKnob.classList.remove('range-controlled')
        min = max
        max = pos
      } else {
        min = pos
      }
    } else {
      if (pos < min) {
        controlling = 'min'
        minKnob.classList.add('range-controlled')
        maxKnob.classList.remove('range-controlled')
        max = min
        min = pos
      } else {
        max = pos
      }
    }
    acceptInput()
    e.preventDefault()
  }
  function end (e) {
    ;(controlling === 'min' ? minKnob : maxKnob).classList.remove(
      'range-controlled'
    )
    controlling = null
    document.removeEventListener(
      e.type === 'touchend' ? 'touchmove' : 'mousemove',
      move
    )
    document.removeEventListener(
      e.type === 'touchend' ? 'touchend' : 'mouseup',
      end
    )
    acceptChange()
    e.preventDefault()
  }
  range.addEventListener('mousedown', start)
  range.addEventListener('touchstart', start, { passive: false })
  return {
    elem: range,
    get range () {
      return [min, max]
    },
    set range (to) {
      ;[min, max] = to
      acceptInput(false)
    }
  }
}
window.addEventListener(
  'load',
  e => {
    /*
  // commented out because it makes knowing if the switch is on confusing
  toEach('.material-switch',t=>{
    t.addEventListener("click",e=>{
      t.classList.toggle('checked');
    },false);
  });
  */
    toEach('.radio-wrapper', t => {
      const radio = t.querySelector('input[type=radio]')
      t.addEventListener(
        'click',
        e => {
          radio.click()
          radio.focus()
        },
        false
      )
    })
    toEach('.material-dialog > .buttons > .close', t => {
      t.addEventListener('click', closeDialog)
    })
  },
  false
)
