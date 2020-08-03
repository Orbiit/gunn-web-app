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
export function localize (id, src = 'other') {
  if (!langs[currentLang]) {
    console.warn(`Language ${currentLang} not loaded.`)
    langs[currentLang] = {}
  }
  if (!langs[currentLang][src]) {
    langs[currentLang][src] = {}
  }
  if (langs[currentLang][src][id] !== undefined)
    return langs[currentLang][src][id]
  if (!langs.en[src]) {
    console.warn(`Source ${src} does not exist.`)
    return id
  }
  if (langs.en[src][id] === undefined) {
    console.warn(`Nothing set for ${src}/${id}`)
    return id
  }
  return langs.en[src][id]
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
