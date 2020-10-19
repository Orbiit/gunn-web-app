import { onSection } from './footer.js'
import { localize, localizeWith } from './l10n.js'
import { materialInput, ripple } from './material.js'
import { savedClubs, saveSavedClubs } from './saved-clubs.js'
import {
  ajax,
  cookie,
  isAppDesign,
  isOnline,
  logError,
  now,
  showDialog,
  shuffleInPlace,
  THEME_COLOUR,
  toEach
} from './utils.js'

export let showClub
export let getClubByName
let clubsLoaded
export const onClubsLoaded = new Promise(resolve => (clubsLoaded = resolve))

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

function addSemToRow (row, courses) {
  const courseNames = row.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'staff-schedule-class',
      textContent: courses.map(([course]) => course).join(', ')
    })
  )
  // Find first course with a room
  const courseWithRoom = courses.find(([, room]) => room)
  if (courseWithRoom) {
    // Assumes all the courses are in the same room, but that's not the case for
    // Bissegger's second semester period 4 it seems.
    const [, room] = courseWithRoom
    courseNames.appendChild(
      Object.assign(document.createElement('span'), {
        className: 'staff-schedule-room',
        textContent: ` (${room})`
      })
    )
  }
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
    // Classes format is pretty unpredictable it seems
    try {
      const [sem1, sem2] = classes
      if (sem2 !== null) {
        addSemToRow(row, sem1)
        addSemToRow(row, sem2)
      } else {
        addSemToRow(row, sem1)
      }
    } catch (err) {
      logError(err)
    }
  } else {
    row.classList.add('staff-schedule-no-classes')
  }
  table.appendChild(row)
}

function normalizeFromUrl (str) {
  return str.toLowerCase().replace(/\W/g, '')
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
  const permalink = info.querySelector('.info-permalink')
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
          // Hidden feature: to search by a specific property, you can use
          // P_R_O_P_N_A_M_E and regex search (r/...).
          search: [
            'N_A_M_E ' + name,
            ...searchableProps.map(prop =>
              typeof prop === 'function'
                ? prop(item)
                : [...prop.toUpperCase()].join('_') + ' ' + (item[prop] || '')
            )
          ].join('\n')
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

      const showItemOnLoad = new RegExp(`(?:\\?|&)show-${type}=([^&]+)`).exec(
        window.location.search
      )
      if (showItemOnLoad) {
        const normalized = normalizeFromUrl(showItemOnLoad[1])
        const name = Object.keys(data).find(
          name => normalizeFromUrl(name) === normalized
        )
        if (name) {
          showItem(name)
        }
        window.history.replaceState({}, '', window.location.pathname)
      }
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
            let first = true
            for (const link of (item[prop] || '').split(' ')) {
              if (first) {
                first = false
              } else {
                p.appendChild(document.createTextNode(' '))
              }
              if (link.startsWith('http') || link.includes('@')) {
                p.appendChild(
                  Object.assign(document.createElement('a'), {
                    href: link.includes('@') ? `mailto:${item[prop]}` : link,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    textContent: link
                  })
                )
              } else {
                p.appendChild(document.createTextNode(link))
              }
            }
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
    permalink.href = `?show-${type}=${normalizeFromUrl(name)}`
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
    },
    getByName: name => data && data[name]
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
    searchableProps: [
      'jobTitle',
      'department',
      'email',
      'phone',
      ({ periods }) =>
        periods
          ? 'P_E_R_I_O_D_S ' +
            Object.entries(periods)
              .map(
                ([pd, sems]) =>
                  pd +
                  ': ' +
                  sems
                    .map(sem =>
                      sem
                        ? sem
                            .map(([course, room]) => `${course} - ${room}`)
                            .join(', ')
                        : ''
                    )
                    .join(' / ')
              )
              .join(' | ')
          : ''
    ],
    secondaryProps: ['jobTitle', 'email'],
    errMsg: localize('staff/error'),
    searchPlaceholder: localize('staff', 'placeholders'),
    props: [
      ['jobTitle', localize('staff/title')],
      ['department', localize('staff/department')],
      ['email', localize('staff/email'), 'link'],
      ['phone', localize('staff/phone')],
      ['webpage', localize('staff/website'), 'link'],
      ['oc', localize('staff/basement'), 'link'],
      ['periods', localize('staff/schedule'), 'schedule']
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
  const clubAdsWrapper = document.getElementById('club-ads-wrapper')
  const clubAdsList = document.getElementById('club-ads')
  const clubAdWrapper = document.getElementById('club-ad-wrapper')
  const clubName = document.getElementById('club-name')
  const ytIframe = document.getElementById('club-ad-viewer')
  const showClubFromAd = document.getElementById('show-club-from-ad')
  const closeClubAd = document.getElementById('close-club-ad')
  const {
    showItem: forceShowClub,
    getCurrent: getCurrentClub,
    getByName
  } = initList('club', {
    jsonPath: 'json/clubs.json' + isAppDesign,
    insertExtra: clubs => {
      clubs[localize('club/self/club')] = {
        desc: localize('club/self/desc'),
        day: localize('club/self/day'),
        time: localize('club/self/time'),
        // room: localize('club/self/room'),
        president: localize('club/self/prez'),
        teacher: localize('club/self/teacher'),
        email: localize('club/self/email')
      }

      clubsLoaded()

      const getYouTube = /(?:youtu\.be\/|www\.youtube\.com\/watch\?v=)([\w-]+)/
      const showable = Object.entries(clubs)
        .map(([clubName, { video, thumbnail }]) => {
          if (thumbnail) {
            // `thumbnail` is probably only defined for Google Drive videos
            return {
              name: clubName,
              link: video,
              embed: video.replace('view', 'preview'),
              thumbnail
            }
          }
          const match = getYouTube.exec(video)
          if (match) {
            const [, videoId] = match
            return {
              name: clubName,
              link: `https://www.youtube.com/watch?v=${videoId}`,
              embed: `https://www.youtube.com/embed/${videoId}/`,
              thumbnail: `https://img.youtube.com/vi/${videoId}/default.jpg`
            }
          } else {
            return null
          }
        })
        .filter(pair => pair)
      shuffleInPlace(showable)
      Promise.all([isOnline, onSection.clubs]).then(([online]) => {
        if (!online) return
        clubAdsWrapper.classList.add('club-ad-available')

        function addClubVideo ({ name, link, embed, thumbnail }) {
          const entry = Object.assign(document.createElement('a'), {
            href: link,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'club-ad'
          })
          Object.assign(entry.dataset, { name, embed })
          ripple(entry)
          entry.appendChild(
            Object.assign(document.createElement('img'), {
              src: thumbnail,
              className: 'club-ad-thumbnail',
              draggable: false
            })
          )
          entry.appendChild(
            Object.assign(document.createElement('span'), {
              textContent: name,
              className: 'club-ad-name'
            })
          )
          clubAdsList.appendChild(entry)
        }
        showable.slice(0, 3).forEach(addClubVideo)
        if (showable.length > 3) {
          const button = Object.assign(document.createElement('button'), {
            className: 'material club-ad-show-more'
          })
          ripple(button)
          button.appendChild(
            Object.assign(document.createElement('i'), {
              textContent: '\ue5cc',
              className: 'material-icons club-ad-show-more-icon'
            })
          )
          button.appendChild(
            Object.assign(document.createElement('span'), {
              textContent: localize('show-more'),
              className: 'club-ad-show-more-label'
            })
          )
          clubAdsList.appendChild(button)
          button.addEventListener('click', e => {
            showable.slice(3).forEach(addClubVideo)
            clubAdsList.removeChild(button)
            clubAdsList.appendChild(
              Object.assign(document.createElement('div'), {
                textContent: localize('yt-only'),
                className: 'club-ad-yt-only'
              })
            )
          })
        }

        let selectedClub = null
        clubAdsList.addEventListener('click', e => {
          const video = e.target.closest('.club-ad')
          if (!video) return
          e.preventDefault()
          const { name, embed } = video.dataset
          clubAdWrapper.classList.add('club-ad-available')
          clubName.textContent = name
          ytIframe.src = embed
          selectedClub = name
        })
        showClubFromAd.addEventListener('click', e => {
          forceShowClub(selectedClub)
        })
        closeClubAd.addEventListener('click', e => {
          selectedClub = null
          ytIframe.src = 'about:blank'
          clubAdWrapper.classList.remove('club-ad-available')
        })
      })
    },
    sortName: (a, b) => a.localeCompare(b),
    searchableProps: [
      'room',
      'day',
      'time',
      'desc',
      'presidents',
      'teacher',
      'coteacher',
      'tier'
    ],
    secondaryProps: ['day', 'time'],
    errMsg: localize('club/error'),
    searchPlaceholder: localize('clubs', 'placeholders'),
    nonexistentItem: localize('dead-club'),
    props: [
      ['day', localize('club/day')],
      ['time', localize('club/time')],
      ['room', localize('club/location')],
      ['link', localize('club/zoom'), 'link'],
      ['video', localize('club/video'), 'link'],
      ['desc', localize('club/desc')],
      ['president', localize('club/presidents')],
      ['tier', localize('club/tier')],
      ['signup', localize('club/signup'), 'link'],
      ['teacher', localize('club/advisors')],
      ['email', localize('club/teacher-email'), 'link'],
      ['coteacher', localize('club/coadvisor/name')],
      ['coemail', localize('club/coadvisor/email'), 'link'],
      ['donation', localize('club/donation')]
    ],
    onShowItem: (clubName, club) => {
      clubAddList.textContent = savedClubs[clubName]
        ? localize('remove-from-list')
        : localize('add-to-list')
      // clubAddList.style.display =
      //   (club && /lunch/i.test(club.time)) || savedClubs[clubName]
      //     ? null
      //     : 'none'
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
  showClub = forceShowClub
  getClubByName = getByName
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
