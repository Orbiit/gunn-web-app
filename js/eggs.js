import { ripple } from './material.js'
import { cookie, loadJsonStorage, THEME_COLOUR } from './utils.js'

const plugins = {}
export function loadPlugin (pluginId) {
  if (!plugins[pluginId]) {
    const css = new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = `./games/${pluginId}.css`
      link.addEventListener('load', resolve)
      link.addEventListener('error', reject)
      document.head.appendChild(link)
    })
    const js = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `./games/${pluginId}.js`
      script.addEventListener('load', resolve)
      script.addEventListener('error', reject)
      document.head.appendChild(script)
    })
    plugins[pluginId] = Promise.all([css, js])
  }
  return plugins[pluginId]
}

export function highScore (scoreId, newScore = null) {
  const highScores = loadJsonStorage('[gunn-web-app] scheduleapp.plugins', {})
  if (!highScores[scoreId]) {
    highScores[scoreId] = 0
  }
  if (newScore !== null) {
    if (typeof newScore !== 'number') {
      throw new TypeError('New score must be a number')
    }
    if (newScore > highScores[scoreId]) {
      highScores[scoreId] = newScore
      cookie.setItem(
        '[gunn-web-app] scheduleapp.plugins',
        JSON.stringify(highScores)
      )
    }
  }
  return highScores[scoreId]
}

export function egg () {
  // This is me being really lazy
  const wrapper = document.createElement('div')
  const canvas = wrapper
    .appendChild(
      Object.assign(document.createElement('div'), {
        style: 'display: flex; align-items: center;'
      })
    )
    .appendChild(
      Object.assign(document.createElement('div'), {
        className: 'center',
        style: 'flex: auto;'
      })
    )
    .appendChild(
      Object.assign(document.createElement('style'), {
        textContent: `.egg-snake:focus {box-shadow: 0 0 3px ${THEME_COLOUR};}`
      })
    )
    .parentNode.appendChild(
      Object.assign(document.createElement('canvas'), {
        className: 'egg-snake',
        width: 20,
        height: 20,
        tabIndex: 0,
        style:
          'height: 100px; image-rendering: pixelated; cursor: pointer; border: 1px solid currentColor;'
      })
    )
  const c = canvas.getContext('2d')
  const upBtn = canvas.parentNode.parentNode
    .appendChild(
      Object.assign(document.createElement('div'), {
        className: 'center'
      })
    )
    .appendChild(document.createElement('div'))
    .appendChild(
      Object.assign(document.createElement('button'), {
        className: 'material icon',
        innerHTML: '<i class="material-icons">keyboard_arrow_up</i>'
      })
    )
  const leftBtn = upBtn.parentNode.parentNode
    .appendChild(document.createElement('div'))
    .appendChild(
      Object.assign(document.createElement('button'), {
        className: 'material icon',
        innerHTML: '<i class="material-icons">keyboard_arrow_left</i>'
      })
    )
  const playBtn = leftBtn.parentNode.appendChild(
    Object.assign(document.createElement('button'), {
      className: 'material icon',
      innerHTML: '<i class="material-icons">play_arrow</i>'
    })
  )
  const rightBtn = playBtn.parentNode.appendChild(
    Object.assign(document.createElement('button'), {
      className: 'material icon',
      innerHTML: '<i class="material-icons">keyboard_arrow_right</i>'
    })
  )
  const downBtn = rightBtn.parentNode.parentNode
    .appendChild(document.createElement('div'))
    .appendChild(
      Object.assign(document.createElement('button'), {
        className: 'material icon',
        innerHTML: '<i class="material-icons">keyboard_arrow_down</i>'
      })
    )
  const scoreDisplay = wrapper
    .appendChild(document.createElement('p'))
    .appendChild(document.createTextNode('Score: '))
    .parentNode.appendChild(document.createElement('span'))
    .appendChild(document.createTextNode('[press play to start]')).parentNode
  const highScoreDisplay = scoreDisplay.parentNode
    .appendChild(document.createTextNode('; personal high score: '))
    .parentNode.appendChild(document.createElement('span'))
  wrapper.appendChild(
    Object.assign(document.createElement('p'), {
      textContent:
        'Click on the box to give it focus so you can use arrow keys.'
    })
  )
  const btn = wrapper.appendChild(document.createElement('p')).appendChild(
    Object.assign(document.createElement('button'), {
      className: 'material ripple-light raised',
      textContent: 'click me'
    })
  )
  const clicks = btn.parentNode
    .appendChild(document.createTextNode(' '))
    .parentNode.appendChild(document.createElement('span'))
  const buyBtn = wrapper.appendChild(document.createElement('p')).appendChild(
    Object.assign(document.createElement('button'), {
      className: 'material ripple-light raised',
      textContent: 'extra click per click'
    })
  )
  const powerDisplay = buyBtn.parentNode
    .appendChild(document.createTextNode(' '))
    .parentNode.appendChild(document.createElement('span'))
  const priceDisplay = buyBtn.parentNode
    .appendChild(document.createTextNode(' click(s) per click (price: '))
    .parentNode.appendChild(document.createElement('span'))
  buyBtn.parentNode.appendChild(document.createTextNode(' clicks)'))
  const buyTBtn = wrapper.appendChild(document.createElement('p')).appendChild(
    Object.assign(document.createElement('button'), {
      className: 'material ripple-light raised',
      textContent: 'extra click per second'
    })
  )
  const extraDisplay = buyTBtn.parentNode
    .appendChild(document.createTextNode(' '))
    .parentNode.appendChild(document.createElement('span'))
  const priceTDisplay = buyTBtn.parentNode
    .appendChild(document.createTextNode(' click(s) per second (price: '))
    .parentNode.appendChild(document.createElement('span'))
  buyTBtn.parentNode.appendChild(
    document.createTextNode(
      ' clicks; note: this resets when UGWA is refreshed)'
    )
  )
  ;[playBtn, leftBtn, upBtn, rightBtn, downBtn].forEach(ripple)
  ripple(btn)
  ripple(buyBtn)
  ripple(buyTBtn)

  let direction = [0, 1]
  leftBtn.onclick = e => (direction = [-1, 0])
  upBtn.onclick = e => (direction = [0, -1])
  rightBtn.onclick = e => (direction = [1, 0])
  downBtn.onclick = e => (direction = [0, 1])
  canvas.onkeydown = e => {
    switch (e.keyCode) {
      case 37:
        leftBtn.click()
        break
      case 38:
        upBtn.click()
        break
      case 39:
        rightBtn.click()
        break
      case 40:
        downBtn.click()
        break
      default:
        return
    }
    e.preventDefault()
  }
  const getApplePos = () => {
    let proposal
    do {
      proposal = [(Math.random() * 20) >> 0, (Math.random() * 20) >> 0]
    } while (inSnake(proposal))
    return proposal
  }
  const inSnake = loc => {
    for (const [x, y] of snake) {
      if (loc[0] === x && loc[1] === y) return true
    }
    return false
  }
  const render = () => {
    c.clearRect(0, 0, 20, 20)
    c.fillStyle = THEME_COLOUR
    snake.forEach(([x, y]) => {
      c.fillRect(x, y, 1, 1)
    })
    c.fillStyle = document.body.classList.contains('dark') ? 'white' : 'black'
    c.fillRect(apple[0], apple[1], 1, 1)
  }
  let playing = false
  let score, snake, apple, idealLength
  let highScore =
    +cookie.getItem('[gunn-web-app] scheduleapp.snakeHighScore') || 0
  highScoreDisplay.textContent = highScore
  playBtn.onclick = e => {
    scoreDisplay.textContent = score = 0
    snake = [[9, 9]]
    apple = getApplePos()
    idealLength = 3
    playing = setInterval(() => {
      if (!document.body.contains(canvas)) {
        clearInterval(playing)
        playing = false
      }
      const lastPos = snake[snake.length - 1]
      const newPos = [lastPos[0] + direction[0], lastPos[1] + direction[1]]
      if (
        newPos[0] < 0 ||
        newPos[0] >= 20 ||
        newPos[1] < 0 ||
        newPos[1] >= 20 ||
        inSnake(newPos)
      ) {
        clearInterval(playing)
        playing = false
        scoreDisplay.textContent =
          score + ` (GAME OVER${score > highScore ? ' - NEW HIGH SCORE' : ''})`
        if (score > highScore) {
          highScore = score
          highScoreDisplay.textContent = highScore
          cookie.setItem('[gunn-web-app] scheduleapp.snakeHighScore', highScore)
        }
      } else if (newPos[0] === apple[0] && newPos[1] === apple[1]) {
        apple = getApplePos()
        idealLength++
        scoreDisplay.textContent = ++score
      }
      snake.push(newPos)
      if (snake.length > idealLength) snake.splice(0, 1)
      render()
    }, 200)
    render()
  }

  const stats = {
    count: +cookie.getItem('[gunn-web-app] scheduleapp.clicks') || 0,
    power: +cookie.getItem('[gunn-web-app] scheduleapp.clickPower') || 1,
    extra: 0
  }

  clicks.textContent = stats.count
  btn.addEventListener(
    'click',
    e => {
      stats.count += stats.power
      cookie.setItem('[gunn-web-app] scheduleapp.clicks', stats.count)
      clicks.textContent = stats.count
    },
    false
  )
  priceDisplay.textContent = (stats.power + 1) * 25
  powerDisplay.textContent = stats.power
  buyBtn.addEventListener(
    'click',
    e => {
      const price = (stats.power + 1) * 25
      if (stats.count < price) {
        priceDisplay.textContent = price + ' (which is too many for you)'
      } else {
        stats.count -= price
        clicks.textContent = stats.count
        cookie.setItem('[gunn-web-app] scheduleapp.clicks', stats.count)

        stats.power++
        powerDisplay.textContent = stats.power
        cookie.setItem('[gunn-web-app] scheduleapp.clickPower', stats.power)
        priceDisplay.textContent = (stats.power + 1) * 25
      }
    },
    false
  )
  priceTDisplay.textContent = stats.extra * 150 + 100
  extraDisplay.textContent = stats.extra
  buyTBtn.addEventListener(
    'click',
    e => {
      const price = stats.extra * 150 + 100
      if (stats.count < price) {
        priceTDisplay.textContent = price + ' (which is too many for you)'
      } else {
        stats.count -= price
        clicks.textContent = stats.count
        cookie.setItem('[gunn-web-app] scheduleapp.clicks', stats.count)

        stats.extra++
        extraDisplay.textContent = stats.extra
        priceTDisplay.textContent = stats.extra * 150 + 100
      }
    },
    false
  )
  setInterval(() => {
    stats.count += stats.extra
    clicks.textContent = stats.count
    cookie.setItem('[gunn-web-app] scheduleapp.clicks', stats.count)
  }, 1000)
  return wrapper
}
