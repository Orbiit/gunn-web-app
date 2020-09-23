import { cookie } from './utils.js'

const sections = ['utilities', 'clubs', 'schedule', 'staff', 'options']
const triggerSection = {}
export const onSection = {}
for (const section of sections) {
  onSection[section] = new Promise(resolve => {
    triggerSection[section] = resolve
  }).then(() => {
    triggerSection[section] = null
  })
}

export function initFooter () {
  let initSection = cookie.getItem('[gunn-web-app] section') || 'schedule'
  const t = document.querySelector(
    `#footer > ul > li[data-section="${initSection}"]`
  )
  if (t) t.classList.add('active')
  else {
    document
      .querySelector(`#footer > ul > li[data-section="schedule"]`)
      .classList.add('active')
    cookie.setItem('[gunn-web-app] section', 'schedule')
    document.body.classList.add('footer-schedule')
    initSection = 'schedule'
  }
  if (triggerSection[initSection]) triggerSection[initSection]()
  const ul = document.querySelector('#footer > ul')
  function setSection (section) {
    const t = ul.querySelector('.active')
    if (t) {
      t.classList.remove('active')
      document.body.classList.remove('footer-' + t.dataset.section)
    }
    document
      .querySelector(`#footer > ul > li[data-section="${section}"]`)
      .classList.add('active')
    document.body.classList.add('footer-' + section)
    cookie.setItem('[gunn-web-app] section', section)
    if (triggerSection[section]) triggerSection[section]()
  }
  if (window.location.search) {
    const section = /(?:\?|&)section=([^&]+)/.exec(window.location.search)
    if (section) {
      setSection(section[1])
    }
  }
  function ulclick (e) {
    if (e.target !== ul && ul.contains(e.target)) {
      let n = e.target
      while (n.tagName !== 'LI') n = n.parentNode
      if (n.classList.contains('footer-item')) setSection(n.dataset.section)
    }
  }
  ul.addEventListener('click', ulclick, false)
  ul.addEventListener(
    'keydown',
    e => {
      if (e.keyCode === 13) ulclick(e)
    },
    false
  )
  document.body.classList.add(`footer-${initSection}`)
}
