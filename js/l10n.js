import { cookie, isAppDesign } from './utils.js'
import en from './languages/en.js'

const langs = { en }
window.langs = langs

export const availableLangs = {
  en: 'English',
  'en-gt': 'English (Google Translated through Chinese)',
  es: 'español',
  fr: 'français',
  test: 'le language test',
  'x-mleng': "L'leng"
}
export const publicLangs = /(?:\?|&)all-langs/.exec(window.location.search)
  ? Object.keys(availableLangs)
  : ['en', 'en-gt', 'fr']
if (!availableLangs[cookie.getItem('[gunn-web-app] language')]) {
  let lang = 'en'
  if (navigator.languages) {
    lang = navigator.languages.find(lang => availableLangs[lang]) || lang
  } else {
    const userLang = navigator.language || navigator.userLanguage
    if (availableLangs[userLang]) lang = userLang
  }
  cookie.setItem('[gunn-web-app] language', lang)
}
export const currentLang = cookie.getItem('[gunn-web-app] language')
export function localize (id, src = 'other', lang = currentLang) {
  if (!langs[lang]) {
    console.warn(`Language ${lang} not loaded.`)
    langs[lang] = {}
  }
  const path = [src, ...id.split('/')]
  let obj = langs[lang]
  for (const key of path) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj = obj[key]
    } else if (lang === 'en') {
      console.warn(`Nothing set for en/${src}/${id}`)
      return id
    } else {
      console.warn(`Nothing set for ${lang}/${src}/${id}`)
      return localize(id, src, 'en')
    }
  }
  return obj
}
export function localizeWith (id, src = 'other', params = {}) {
  let entry = localize(id, src)
  if (typeof entry === 'function') {
    return entry(params)
  } else {
    entry = entry + ''
    Object.keys(params).forEach(id => {
      entry = entry.replace(`{${id}}`, params[id])
    })
    return entry
  }
}
export function localizeHtml (id) {
  return localize(id, 'html')
}
function loadLanguage (langCode) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.addEventListener('load', resolve)
    script.addEventListener('error', reject)
    script.src = `./js/languages/${langCode}.js` + isAppDesign
    document.head.appendChild(script)
  })
}
export const ready =
  currentLang !== 'en' ? loadLanguage(currentLang) : Promise.resolve()
