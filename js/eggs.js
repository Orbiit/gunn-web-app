import { createReactive } from './dumb-reactive.js'
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

function getRenderedEgg ({
  score,
  highScore,
  gameEnd,
  clicks,
  power,
  extra,
  onKey,
  onUp,
  onLeft,
  onPlay,
  onRight,
  onDown,
  onClick,
  onPower,
  onExtra
}) {
  return [
    [
      { type: 'div', style: { display: 'flex', alignItems: 'center' } },
      [
        { type: 'div.center', style: { flex: 'auto' } },
        ['style', `.egg-snake:focus {box-shadow: 0 0 3px ${THEME_COLOUR};}`],
        [
          {
            type: 'egg-canvas.egg-snake',
            properties: { width: 20, height: 20, tabIndex: 0 },
            style: {
              height: '100px',
              imageRendering: 'pixelated',
              cursor: 'pointer',
              border: '1px solid currentColor'
            },
            options: { onKeyDown: onKey }
          }
        ]
      ]
    ],
    [
      'div.center',
      [
        'div',
        [
          { type: 'ripple-btn.material.icon', options: { onClick: onUp } },
          ['i.material-icons', 'keyboard_arrow_up']
        ]
      ],
      [
        'div',
        [
          { type: 'ripple-btn.material.icon', options: { onClick: onLeft } },
          ['i.material-icons', 'keyboard_arrow_left']
        ],
        [
          { type: 'ripple-btn.material.icon', options: { onClick: onPlay } },
          ['i.material-icons', 'play_arrow']
        ],
        [
          { type: 'ripple-btn.material.icon', options: { onClick: onRight } },
          ['i.material-icons', 'keyboard_arrow_right']
        ]
      ],
      [
        'div',
        [
          { type: 'ripple-btn.material.icon', options: { onClick: onDown } },
          ['i.material-icons', 'keyboard_arrow_down']
        ]
      ]
    ],
    [
      'p',
      'Score: ',
      score === null ? '[press play to start]' : score,
      ...(gameEnd
        ? [' (GAME OVER', gameEnd[0] && ' - NEW HIGH SCORE', ')']
        : []),
      '; personal high score: ',
      highScore
    ],
    ['p', 'Click on the box to give it focus so you can use arrow keys.'],
    [
      'p',
      [
        {
          type: 'ripple-btn.material.ripple-light.raised',
          options: { onClick }
        },
        'click me'
      ],
      ' ',
      clicks
    ],
    [
      'p',
      [
        {
          type: 'ripple-btn.material.ripple-light.raised',
          options: { onClick: onPower }
        },
        'extra click per click'
      ],
      ' ',
      power,
      ' click(s) per click (price: ',
      (power + 1) * 25,
      clicks < (power + 1) * 25 && ' (which is too many for you)',
      ' clicks)'
    ],
    [
      'p',
      [
        {
          type: 'ripple-btn.material.ripple-light.raised',
          options: { onClick: onExtra }
        },
        'extra click per second'
      ],
      ' ',
      extra,
      ' click(s) per second (price: ',
      extra * 150 + 100,
      clicks < extra * 150 + 100 && ' (which is too many for you)',
      ' clicks; note: this resets when UGWA is refreshed)'
    ]
  ]
}

export function egg () {
  // This is me being really lazy
  const wrapper = document.createElement('div')
  const state = {
    score: null,
    highScore:
      +cookie.getItem('[gunn-web-app] scheduleapp.snakeHighScore') || 0,
    gameEnd: false,
    clicks: +cookie.getItem('[gunn-web-app] scheduleapp.clicks') || 0,
    power: +cookie.getItem('[gunn-web-app] scheduleapp.clickPower') || 1,
    extra: 0
  }
  let c
  const setState = createReactive(wrapper, {
    customElems: {
      'egg-canvas': ({ options: { onKeyDown } }) => {
        const canvas = document.createElement('canvas')
        c = canvas.getContext('2d')
        canvas.addEventListener('keydown', onKeyDown)
        return canvas
      },
      'ripple-btn': ({ options: { onClick } }) => {
        const button = document.createElement('button')
        button.addEventListener('click', onClick)
        ripple(button)
        return button
      }
    }
  })

  let direction = [0, 1]
  state.onLeft = () => {
    direction = [-1, 0]
  }
  state.onUp = () => {
    direction = [0, -1]
  }
  state.onRight = () => {
    direction = [1, 0]
  }
  state.onDown = () => {
    direction = [0, 1]
  }
  state.onKey = e => {
    switch (e.keyCode) {
      case 37:
        state.onLeft()
        break
      case 38:
        state.onUp()
        break
      case 39:
        state.onRight()
        break
      case 40:
        state.onDown()
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
  let snake, apple, idealLength

  state.onPlay = () => {
    if (playing) return
    state.score = 0
    state.gameEnd = null
    snake = [[9, 9]]
    apple = getApplePos()
    idealLength = 3
    playing = setInterval(() => {
      if (!document.body.contains(c.canvas)) {
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
        state.gameEnd = [state.score > state.highScore]
        if (state.score > state.highScore) {
          state.highScore = state.score
          cookie.setItem(
            '[gunn-web-app] scheduleapp.snakeHighScore',
            state.highScore
          )
        }
        setState(getRenderedEgg(state))
      } else if (newPos[0] === apple[0] && newPos[1] === apple[1]) {
        apple = getApplePos()
        idealLength++
        state.score++
        setState(getRenderedEgg(state))
      }
      snake.push(newPos)
      if (snake.length > idealLength) snake.splice(0, 1)
      render()
    }, 200)
    render()
    setState(getRenderedEgg(state))
  }

  state.onClick = () => {
    state.clicks += state.power
    cookie.setItem('[gunn-web-app] scheduleapp.clicks', state.clicks)
    setState(getRenderedEgg(state))
  }
  state.onPower = () => {
    const price = (state.power + 1) * 25
    if (state.clicks >= price) {
      state.clicks -= price
      cookie.setItem('[gunn-web-app] scheduleapp.clicks', state.clicks)

      state.power++
      cookie.setItem('[gunn-web-app] scheduleapp.clickPower', state.power)
      setState(getRenderedEgg(state))
    }
  }
  state.onExtra = () => {
    const price = state.extra * 150 + 100
    if (state.clicks >= price) {
      state.clicks -= price
      cookie.setItem('[gunn-web-app] scheduleapp.clicks', state.clicks)

      state.extra++
      setState(getRenderedEgg(state))
    }
  }
  setInterval(() => {
    state.clicks += state.extra
    cookie.setItem('[gunn-web-app] scheduleapp.clicks', state.clicks)
    setState(getRenderedEgg(state))
  }, 1000)

  setState(getRenderedEgg(state))
  return wrapper
}
