import en from './en.js'
import fetch from 'node-fetch'
import fs from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function mapObjValues (obj, mapFn) {
  const newObj = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      newObj[key] = mapObjValues(value, mapFn)
    } else {
      newObj[key] = mapFn(value)
    }
  }
  return newObj
}

function getPieces (str) {
  const regex = /{[a-z\d/-]+\|?|}/g
  const parts = []
  let lastIndex = 0
  let match
  while ((match = regex.exec(str)) !== null) {
    parts.push(str.slice(lastIndex, match.index))
    parts.push(match[0])
    lastIndex = match.index + match[0].length
  }
  parts.push(str.slice(lastIndex))
  return parts
}

function getToTranslate (original) {
  let transId = 0
  const toTranslate = []
  mapObjValues(original, value => {
    if (typeof value === 'string') {
      getPieces(value).forEach((part, i) => {
        if (i % 2 === 0) {
          toTranslate[transId++] = part
        }
      })
    }
  })
  return toTranslate
}

function transformObj (original, translations) {
  let transId = 0
  return mapObjValues(original, value => {
    if (typeof value === 'string') {
      return getPieces(value).map((part, i) => i % 2 === 0 ? translations[transId++] : part).join('')
    } else {
      return value
    }
  })
}

const getWord = /\w+|./g // Groups alphanumeric letters together
const noSpaceBefore = [...'.,?!:;)]}”/"']
const noSpaceAfter = [...'([{“/"']
function translateToChineseAndBack (string) {
  // Sorry ST
  return fetch(`https://translate-service.scratch.mit.edu/translate?language=zh-tw&text=${encodeURIComponent(string)}`)
    .then(r => r.ok ? r.json() : r.text().then(err => Promise.reject(new Error(err))))
    .then(r => r.result)
    .then(chinese => fetch(`https://translate-service.scratch.mit.edu/translate?language=en&text=${encodeURIComponent((chinese.match(getWord) || []).join('\n'))}`))
    .then(r => r.ok ? r.json() : r.text().then(err => Promise.reject(new Error(err))))
    .then(r => r.result)
    .then(englishLines => englishLines
      .replace(/。/g, '.')
      .replace(/，/g, '.')
      .replace(/？/g, '?')
      .replace(/：/g, ':')
      .replace(/；/g, ';')
      .replace(/（/g, '(')
      .replace(/）/g, ')')
      .split('\n\n\n')
      .map(englishParts => {
        let english = ''
        for (const word of englishParts.split('\n')) {
          if (english === '') {
            english = word
            continue
          }
          if (noSpaceBefore.includes(word) || noSpaceAfter.includes(english[english.length - 1])) {
            english += word
          } else {
            english += ' ' + word
          }
        }
        return english
      })
      .join('\n'))
}

async function main () {
  const translations = getToTranslate(en)
  const translationGroups = []
  translations.forEach((translation, transId) => {
    if (translation) {
      if (!translationGroups[0] || translationGroups[0].totalLength + translation.length >= 500) {
        translationGroups.unshift({
          totalLength: 0,
          translations: []
        })
      }
      translationGroups[0].translations.push([translation, transId])
      translationGroups[0].totalLength += translation.length
    }
  })
  for (const { translations: group, totalLength } of translationGroups) {
    console.log(`Translating ${group.length} items (${totalLength} chars)`);
    const translated = (await translateToChineseAndBack(group.map(trans => trans[0]).join('\n'))).split('\n')
    console.log(`${group.length} -> ${translated.length}`);
    group.forEach(([, transId], i) => {
      translations[transId] = translated[i]
    })
  }
  await fs.writeFile(resolve(__dirname, './en-gt.js'), `export default ${JSON.stringify(transformObj(en, translations), null, 2)}\n`)
}

main()
