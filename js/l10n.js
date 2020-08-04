import { cookie } from './utils.js'
import en from './languages/en.js'

const langs = { en }

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
  if (!langs[currentLang]) {
    console.warn(`Language ${currentLang} not loaded.`)
    langs[currentLang] = {}
  }
  const path = [src, ...id.split('/')]
  let obj = langs[currentLang]
  for (const key of path) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj = obj[key]
    } else if (lang === 'en') {
      console.warn(`Nothing set for ${src}/${id}`)
      return id
    } else {
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
  return import(new URL(`./js/languages/${langCode}.js`, window.location)).then(
    ({ default: langData }) => {
      langs[langCode] = langData
    }
  )
}
export const ready =
  currentLang !== 'en' ? loadLanguage(currentLang) : Promise.resolve()
