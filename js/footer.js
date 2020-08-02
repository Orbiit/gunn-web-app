import { cookie } from './utils.js'

let optionsTabShown
export const onOptionsTab = new Promise(resolve => {
  optionsTabShown = resolve
})

export function initFooter () {
  const t = document.querySelector(
    `#footer > ul > li[data-section="${cookie.getItem(
      '[gunn-web-app] section'
    ) || 'schedule'}"]`
  )
  if (t) t.classList.add('active')
  else {
    document
      .querySelector(`#footer > ul > li[data-section="schedule"]`)
      .classList.add('active')
    cookie.setItem('[gunn-web-app] section', 'schedule')
    document.body.classList.add('footer-schedule')
  }
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
    if (optionsTabShown && section === 'options') {
      optionsTabShown()
      optionsTabShown = null
    }
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
      while (n.tagName !== 'LI') n = e.target.parentNode
      setSection(n.dataset.section)
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
  document.body.classList.add(
    `footer-${cookie.getItem('[gunn-web-app] section') || 'schedule'}`
  )
  if (optionsTabShown && document.body.className.includes('footer-options')) {
    optionsTabShown()
    optionsTabShown = null
  }
}
