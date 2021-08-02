export function zoomImage (img) {
  let dragging = false
  let currentScale = 1
  let currentRotate = 0
  let translate = { x: 0, y: 0 }
  const rotator = document.createElement('div')
  const rotatedial = document.createElement('div')
  rotatedial.classList.add('zoom-dial')
  rotator.classList.add('zoom-rotate')
  rotator.appendChild(rotatedial)
  Math.hypot =
    Math.hypot ||
    function (...x) {
      let sum = 0
      for (let i = 0; i < x.length; i++) sum += x[i] * x[i]
      return Math.sqrt(sum)
    }
  function update () {
    img.style.transform = `translate(${translate.x}px,${
      translate.y
    }px) rotate(${currentRotate}deg) scale(${currentScale})`
    rotator.style.transform = `rotate(${currentRotate}deg)`
  }
  img.addEventListener(
    'touchstart',
    e => {
      if (dragging) {
        if (dragging.fingers === 1) {
          const x = e.touches[0].clientX - e.touches[1].clientX
          const y = e.touches[1].clientY - e.touches[0].clientY
          dragging = {
            fingers: 2,
            initangle: (Math.atan(x / y) / Math.PI) * 180 + 180 * (y < 0),
            initrot: currentRotate,
            initdist: Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            ),
            initscale: currentScale,
            initmidx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            initmidy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            initposx: translate.x,
            initposy: translate.y
          }
        }
      } else {
        dragging = {
          fingers: 1,
          initx: e.touches[0].clientX,
          inity: e.touches[0].clientY,
          initposx: translate.x,
          initposy: translate.y
        }
        document.addEventListener('touchmove', touchmove, { passive: false })
        document.addEventListener('touchend', touchend, { passive: false })
      }
      e.preventDefault()
    },
    { passive: false }
  )
  function touchmove (e) {
    if (dragging) {
      if (dragging.fingers === 2) {
        const x = e.touches[0].clientX - e.touches[1].clientX
        const y = e.touches[1].clientY - e.touches[0].clientY
        currentRotate =
          dragging.initrot +
          (Math.atan(x / y) / Math.PI) * 180 +
          180 * (y < 0) -
          dragging.initangle
        currentScale =
          (Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          ) /
            dragging.initdist) *
          dragging.initscale
        translate = {
          x:
            (e.touches[0].clientX + e.touches[1].clientX) / 2 -
            dragging.initmidx +
            dragging.initposx,
          y:
            (e.touches[0].clientY + e.touches[1].clientY) / 2 -
            dragging.initmidy +
            dragging.initposy
        }
        update()
      } else if (dragging.fingers === 1) {
        translate = {
          x: e.touches[0].clientX - dragging.initx + dragging.initposx,
          y: e.touches[0].clientY - dragging.inity + dragging.initposy
        }
        update()
      }
    }
    e.preventDefault()
  }
  function touchend (e) {
    dragging = false
    document.removeEventListener('touchmove', touchmove, false)
    document.removeEventListener('touchend', touchend, false)
    e.preventDefault()
  }
  img.addEventListener(
    'mousedown',
    e => {
      if (!dragging) {
        if (e.which === 3) {
          dragging = {
            rotate: true,
            up: 0,
            initx: e.clientX,
            inity: e.clientY
          }
          document.body.appendChild(rotator)
          rotator.style.left = e.clientX + 'px'
          rotator.style.top = e.clientY + 'px'
        } else {
          dragging = {
            initx: e.clientX,
            inity: e.clientY,
            initposx: translate.x,
            initposy: translate.y
          }
        }
        document.addEventListener('mousemove', mousemove, false)
        document.addEventListener('mouseup', mouseup, false)
        e.preventDefault()
      }
    },
    false
  )
  function mousemove (e) {
    if (dragging) {
      if (dragging.rotate) {
        // TODO: rotate around original right click point
        const x = e.clientX - dragging.initx
        const y = dragging.inity - e.clientY
        currentRotate = (Math.atan(x / y) / Math.PI) * 180 + 180 * (y < 0)
      } else {
        translate = {
          x: e.clientX - dragging.initx + dragging.initposx,
          y: e.clientY - dragging.inity + dragging.initposy
        }
      }
      update()
    }
    e.preventDefault()
  }
  function mouseup (e) {
    if (dragging.rotate && dragging.up < 1) {
      dragging.up++
    } else {
      if (dragging.rotate) document.body.removeChild(rotator)
      dragging = false
      document.removeEventListener('mousemove', mousemove, false)
      document.removeEventListener('mouseup', mouseup, false)
    }
    e.preventDefault()
  }
  img.addEventListener(
    'wheel',
    e => {
      // TODO: zoom in towards cursor like on Google maps
      const change = Math.abs(e.deltaY / 1000) + 1
      if (e.deltaY < 0) {
        currentScale *= change
        translate.x *= change
        translate.y *= change
      } else if (e.deltaY > 0) {
        currentScale /= change
        translate.x /= change
        translate.y /= change
      }
      update()
      e.preventDefault()
    },
    false
  )
  img.addEventListener(
    'contextmenu',
    e => {
      e.preventDefault()
    },
    false
  )
}
