import fs from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import colours from 'colors/safe.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MAX = 10

const langs = ['en', 'en-gt', 'fr']

function insertIntoMap (map, obj, prefix = '') {
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      insertIntoMap(map, value, (prefix && prefix + '/') + key)
    }
  } else {
    map.set(prefix, obj)
  }
}

async function main () {
  const example = new Map(
    Object.entries(
      JSON.parse(
        await fs.readFile(resolve(__dirname, './example.json'), 'utf8')
      )
    )
  )
  for (const lang of langs) {
    console.log(colours.bold.underline(lang))
    const { default: language } = await import(`./${lang}.js`)
    const map = new Map()
    insertIntoMap(map, language)
    const missing = []
    for (const [id, args] of example) {
      const value = map.get(id)
      if (map.delete(id)) {
        if (typeof value === 'string') {
          for (const arg of args) {
            if (!value.includes(`{${arg}`)) {
              console.warn(
                colours.red('[!]') + ` Missing argument {${arg}} for ${id}.`
              )
            }
          }
        }
      } else {
        missing.push(id)
      }
    }
    if (missing.length) {
      console.warn(
        colours.yellow('[!]') +
          ' Missing l10n for:' +
          missing.slice(0, MAX).map(id => `\n  ${id}`) +
          (missing.length > MAX ? `\n  [${missing.length} total]` : '')
      )
    }
    // Remaining keys in `map` were not in `example`
    const extra = [...map.keys()]
    if (extra.length) {
      console.warn(
        colours.yellow('[!]') +
          ' Extra l10n:' +
          extra.slice(0, MAX).map(id => `\n  ${id}`) +
          (extra.length > MAX ? `\n  [${extra.length} total]` : '')
      )
    }
  }
}

main()
