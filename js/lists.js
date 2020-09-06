import { localize, localizeWith } from './l10n.js'
import { materialInput, ripple } from './material.js'
import { savedClubs, saveSavedClubs } from './saved-clubs.js'
import {
  ajax,
  cookie,
  isAppDesign,
  logError,
  now,
  showDialog,
  toEach
} from './utils.js'

function containsString (pattern) {
  if (!pattern) return () => true
  if (pattern.slice(0, 2) === 'r/') {
    try {
      const regex = new RegExp(pattern.slice(2), 'i')
      return str => regex.test(str)
    } catch (e) {
      logError(e)
    }
  }
  pattern = pattern.toLowerCase()
  return str => str.toLowerCase().includes(pattern)
}

function addSemToRow (row, sem) {
  row.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'staff-schedule-class',
      textContent: sem
    })
  )
}
function addRowToTable (table, period, classes) {
  const row = document.createElement('div')
  row.className = 'staff-schedule-row'
  row.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'staff-schedule-period',
      // Should be localized? idk; the lists typically aren't
      textContent: period
    })
  )
  if (classes) {
    if (classes.includes('|')) {
      const [sem1, sem2] = classes.split('|')
      addSemToRow(row, sem1)
      addSemToRow(row, sem2)
    } else {
      addSemToRow(row, classes)
    }
  } else {
    row.classList.add('staff-schedule-no-classes')
  }
  table.appendChild(row)
}

function initList (
  type,
  {
    jsonPath,
    insertExtra = () => {},
    sortName,
    searchableProps = [],
    secondaryProps = [],
    errMsg = '',
    searchPlaceholder = '',
    nonexistentItem = '',
    props = [],
    specialItem = null,
    onShowItem = null,
    defaultSearch = ''
  }
) {
  const section = document.getElementById(`section-${type}`)
  const list = section.querySelector('.list')
  const searchMarker = section.querySelector('.search-input')
  const search = materialInput(searchPlaceholder, 'search')
  const clear = section.querySelector('.clear-btn')
  const info = document.getElementById(`info-${type}`)
  const h1 = info.querySelector('h1')
  const content = info.querySelector('.content')
  searchMarker.parentNode.replaceChild(search.wrapper, searchMarker)
  let data
  ajax(
    (window.location.protocol === 'file:'
      ? 'https://orbiit.github.io/gunn-web-app/'
      : './') + jsonPath,
    json => {
      data = JSON.parse(json)
      insertExtra(data)
      const names = Object.keys(data).sort(sortName)
      const elements = document.createDocumentFragment()
      for (const name of names) {
        const item = data[name]

        const li = Object.assign(document.createElement('li'), {
          tabIndex: 0
        })
        Object.assign(li.dataset, {
          name,
          search: [name, ...searchableProps.map(prop => item[prop] || '')].join(
            ' '
          )
        })
        ripple(li)
        elements.appendChild(li)

        li.appendChild(
          Object.assign(document.createElement('span'), {
            className: 'primary',
            textContent: name
          })
        )

        for (const prop of secondaryProps) {
          li.appendChild(
            Object.assign(document.createElement('span'), {
              className: 'secondary',
              textContent:
                prop === 'email'
                  ? (item.email || '').replace('pausd.org', '')
                  : item[prop]
            })
          )
        }
      }
      list.appendChild(elements)
      if (search.input.value) doSearch()
    },
    err => {
      list.innerHTML = `<li class="error">${err}${errMsg}</li>`
    }
  )
  let current = null
  function showItem (name) {
    showDialog(info)
    h1.innerHTML = name
    current = name
    const item = data[name]
    if (onShowItem) {
      onShowItem(name, item)
    }
    if (!item) {
      content.innerHTML = `<p>${nonexistentItem}</p>`
      return
    } else {
      content.innerHTML = ''
    }
    const elements = document.createDocumentFragment()
    for (const [prop, label, type = 'text'] of props) {
      if (prop in item) {
        const p = document.createElement('p')
        p.appendChild(
          Object.assign(document.createElement('strong'), {
            textContent: label
          })
        )
        p.appendChild(document.createTextNode(' '))
        switch (type) {
          case 'link': {
            p.appendChild(
              Object.assign(document.createElement('a'), {
                href: prop === 'email' ? `mailto:${item[prop]}` : item[prop],
                target: '_blank',
                rel: 'noopener noreferrer',
                textContent: item[prop] + ''
              })
            )
            break
          }
          case 'schedule': {
            const periods = item[prop]

            const hasSelf = periods.SELF
            const hasMeetings = periods.Meetings
            if (hasSelf || hasMeetings) {
              p.appendChild(
                document.createTextNode(
                  localizeWith('staff-self-meetings', 'other', {
                    S: hasSelf,
                    M: hasMeetings
                  })
                )
              )
            }

            // https://github.com/SheepTester/hello-world/blob/master/teacher-periods.js#L49
            const table = document.createElement('div')
            table.className = 'staff-schedule-table'
            let hasClasses = false
            for (const period of '1234567') {
              if (!hasClasses && periods[period]) {
                hasClasses = true
              }

              addRowToTable(table, period, periods[period])
            }
            if (periods['8']) {
              hasClasses = true
              addRowToTable(table, '8', periods['8'])
            }
            if (hasClasses) {
              p.appendChild(table)
            }
            break
          }
          default:
            p.appendChild(document.createTextNode(item[prop] + ''))
        }
        elements.appendChild(p)
      }
    }
    content.appendChild(elements)
    if (item.special && specialItem) {
      specialItem(item, content)
    }
  }
  list.addEventListener(
    'click',
    e => {
      let target = e.target
      if (target.tagName === 'SPAN') target = target.parentNode
      if (target.tagName === 'LI' && !target.classList.contains('error')) {
        showItem(target.dataset.name)
      }
    },
    false
  )
  function doSearch () {
    const contains = containsString(search.input.value)
    for (let i = 0; i < list.children.length; i++) {
      const li = list.children[i]
      li.style.display = contains(li.dataset.search) ? null : 'none'
    }
  }
  const searchValue = new RegExp(`(?:\\?|&)${type}-search=([^&]+)`).exec(
    window.location.search
  )
  if (searchValue) {
    search.input.value = searchValue[1]
  } else {
    search.input.value = defaultSearch
  }
  if (search.input.value) {
    search.wrapper.classList.add('filled')
  }
  search.input.addEventListener('input', doSearch, false)
  clear.addEventListener('click', e => {
    search.input.value = ''
    search.wrapper.classList.remove('filled')
    doSearch()
  })
  return {
    showItem,
    getCurrent: () => {
      return {
        name: current,
        item: data[current]
      }
    }
  }
}

function egg () {
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
        textContent: '.egg-snake:focus {box-shadow: 0 0 3px #FF594C;}'
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
    c.fillStyle = '#FF594C'
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

export function initLists () {
  const listDisable = document.querySelector('#disable-lists')
  if (cookie.getItem('[gunn-web-app] scheduleapp.loadLists') === null)
    cookie.setItem('[gunn-web-app] scheduleapp.loadLists', 'yes')
  const loadLists =
    cookie.getItem('[gunn-web-app] scheduleapp.loadLists') === 'yes'
  if (loadLists) {
    listDisable.addEventListener(
      'click',
      e => {
        cookie.setItem('[gunn-web-app] scheduleapp.loadLists', 'no')
        window.location.reload()
      },
      false
    )
  } else {
    listDisable.textContent = localize('enable-lists')
    listDisable.addEventListener(
      'click',
      e => {
        cookie.setItem('[gunn-web-app] scheduleapp.loadLists', 'yes')
        window.location.reload()
      },
      false
    )
    toEach('.lists-enabled button', t =>
      t.addEventListener(
        'click',
        e => {
          cookie.setItem('[gunn-web-app] scheduleapp.loadLists', 'yes')
          window.location.reload()
        },
        false
      )
    )
    toEach('.lists-enabled', t => t.classList.remove('lists-enabled'))
    return
  }
  const eggWrapper = egg()
  initList('staff', {
    jsonPath: 'json/staff.json' + isAppDesign,
    insertExtra: staff => {
      staff['Aaryan Agrawal Person'] = {
        game: true,
        jobTitle: localize('supreme-leader'),
        department: localize('universe'),
        special: true
      }
      // staff['Joshua Paley'].jobTitle = localize('blamed-teacher');
      // staff['Christina Woznicki'].woznicki = true;
      // staff['Casey O\'Connell'].oc = 'https://sheeptester.github.io/hello-world/elements.html'
    },
    sortName: (a, b) =>
      a[a.lastIndexOf(' ') + 1].charCodeAt() -
      b[b.lastIndexOf(' ') + 1].charCodeAt(),
    searchableProps: ['jobTitle', 'department'],
    secondaryProps: ['jobTitle', 'email'],
    errMsg: localize('staff-error'),
    searchPlaceholder: localize('staff', 'placeholders'),
    props: [
      ['jobTitle', localize('title')],
      ['department', localize('department')],
      ['email', localize('email'), 'link'],
      ['phone', localize('phone')],
      ['webpage', localize('website'), 'link'],
      ['oc', localize('basement'), 'link'],
      ['periods', localize('schedule'), 'schedule']
    ],
    specialItem: (person, content) => {
      if (person.game) {
        content.innerHTML = ''
        content.appendChild(eggWrapper)
      }
    }
  })
  // Hi Gavin
  const clubAddList = document.getElementById('club-add-list')
  const { showItem: showClub, getCurrent: getCurrentClub } = initList('club', {
    jsonPath: 'json/clubs.json' + isAppDesign,
    insertExtra: clubs => {
      clubs[localize('sophomore-club')] = {
        desc: localize('soph-desc'),
        day: localize('soph-day'),
        time: localize('soph-time'),
        room: localize('soph-room'),
        president: localize('soph-prez'),
        teacher: localize('soph-teacher'),
        email: localize('soph-email')
      }
      // ask Ronnie if this club is renewed for next semester/year
      clubs['Sensors & Electronics Club'] = {
        desc:
          'We specialized in sensors and electronics, such as Arduino, Raspberry Pi, circuit boards, lidar, and a variety of other sensors, many of which will be on display during meetings. We will have fun projects and competitions including snacks each week.',
        day: 'Friday',
        time: 'Lunch',
        room: 'N-207',
        president: 'Jamisen Ma, Kevin Bao',
        teacher: 'Florina Limburg',
        email: 'flimburg@pausd.org'
      }
    },
    sortName: (a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1),
    searchableProps: ['room', 'day'],
    secondaryProps: ['room', 'day'],
    errMsg: localize('club-error'),
    searchPlaceholder: localize('clubs', 'placeholders'),
    nonexistentItem: localize('dead-club'),
    props: [
      ['day', localize('day')],
      ['time', localize('time')],
      ['room', localize('location')],
      ['desc', localize('desc')],
      ['president', localize('presidents')],
      ['teacher', localize('advisors')],
      ['email', localize('teacher-email'), 'link'],
      ['donation', localize('donation')]
    ],
    onShowItem: (clubName, club) => {
      clubAddList.textContent = savedClubs[clubName]
        ? localize('remove-from-list')
        : localize('add-to-list')
      clubAddList.style.display =
        (club && /lunch/i.test(club.time)) || savedClubs[clubName]
          ? null
          : 'none'
    },
    defaultSearch: [
      '',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      ''
    ][now().getDay()]
  })
  window.showClub = showClub
  clubAddList.addEventListener('click', e => {
    const { name: currentClub, item: club } = getCurrentClub()
    if (!currentClub) return
    if (savedClubs[currentClub]) {
      delete savedClubs[currentClub]
      clubAddList.childNodes[0].nodeValue = localize('add-to-list')
    } else {
      savedClubs[currentClub] = 1
      const days = club.day
      if (/monday/i.test(days)) savedClubs[currentClub] *= 2
      if (/tuesday/i.test(days)) savedClubs[currentClub] *= 3
      if (/wednesday/i.test(days)) savedClubs[currentClub] *= 5
      if (/thursday/i.test(days)) savedClubs[currentClub] *= 7
      if (/friday/i.test(days)) savedClubs[currentClub] *= 11
      clubAddList.childNodes[0].nodeValue = localize('remove-from-list')
    }
    saveSavedClubs()
  })
}
