import UglifyJS from 'uglify-es'
import htmlMinifier from 'html-minifier'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import colours from 'colors/safe.js'
import { rollup } from 'rollup'
import cheerio from 'cheerio'

const { minify } = htmlMinifier
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://ascii.co.uk/art/sheep
const SHEEP = `<!--
         ,ww
   wWWWWWWW_)
   \`WWWWWW'
    II  II
-->`

async function buildUgwaJs () {
  const l10nUses = new Map()
  const localizeUseChecker = /localize(?:With)?\s*\((?:\s*'([a-z\d/-]+)'(?:,\s+'([a-z\d/-]+)'\s*)?(?:\s*\)|,\s+{))?/g
  const bundle = await rollup({
    input: path.resolve(__dirname, './js/main.js'),
    plugins: [
      {
        name: 'query-remover',
        resolveId (source, importer) {
          const index = source.lastIndexOf('?')
          if (index !== -1) {
            return fileURLToPath(
              new URL(source.slice(0, index), pathToFileURL(importer))
            )
            // return path.resolve(importer, source.slice(0, index))
          } else {
            return null
          }
        }
      },
      {
        name: 'js-analyzer',
        transform (code, moduleId) {
          if (!moduleId.endsWith('l10n.js')) {
            for (const {
              index,
              0: match,
              1: id,
              2: src = 'other'
            } of code.matchAll(localizeUseChecker)) {
              if (id) {
                l10nUses.set(`${src}/${id}`, [])
              } else {
                console.warn(
                  colours.red('[!]') +
                    ` Invalid use of localize[With] in character ${colours.bold(
                      index
                    )}\n  ` +
                    colours.cyan(
                      match +
                        code.slice(
                          index + match.length,
                          index + match.length + 40
                        ) +
                        '...'
                    ) +
                    colours.grey(`\nin ${moduleId}`)
                )
              }
            }
          }
          // Don't do anything to the code
          return null
        }
      }
    ]
  })
  const { output } = await bundle.generate({
    format: 'iife'
  })
  return {
    code: output.find(({ fileName }) => fileName === 'main.js').code,
    l10nUses
  }
}

function readFile (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, file), 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
function writeFile (file, contents) {
  fs.writeFile(path.resolve(__dirname, file), contents, () => {
    console.log(colours.cyan(file + ' written'))
  })
}

const date = new Date().toDateString()
readFile('./sw.js').then(cache => {
  writeFile('./sw.js', cache.replace(/ugwa-sw-\d+/, 'ugwa-sw-' + Date.now()))
})

const importCss = /^@import url\('(.+)'\);$/gm

async function buildIndexHtml () {
  const html = await readFile('./appdesign.html')
  let css = ''
  for (const [, cssFile] of (await readFile('./css/index.css')).matchAll(
    importCss
  )) {
    css += await readFile(path.resolve(__dirname, './css/', cssFile))
  }
  const { code: js, l10nUses } = await buildUgwaJs()

  const $ = cheerio.load(html)
  $('[data-l10n]').each(function () {
    const localizable = $(this)
    const id = localizable.attr('data-l10n')
    const args = []
    localizable.children('[data-l10n-arg]').each(function () {
      const arg = $(this)
      args.push(arg.attr('data-l10n-arg'))
    })
    l10nUses.set(`html/${id}`, args)
  })
  writeFile(
    './js/languages/example.json',
    JSON.stringify(
      Object.fromEntries([...l10nUses].sort((a, b) => (a[0] > b[0] ? 1 : -1))),
      null,
      2
    )
  )

  writeFile(
    './index.html',
    minify(
      html
        .replace(/<!-- STYLES [^]* \/STYLES -->/, `<style>${css}</style>`)
        .replace(/<!-- SCRIPTS [^]* \/SCRIPTS -->/, `<script>${js}</script>`)
        .replace(/<!-- NOAPPDESIGN [^]* \/NOAPPDESIGN -->/, '')
        .replace(/\{VERSION\}/, date),
      {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        minifyCSS: {
          // This is to fix CSS image urls, but idk why '../' works
          rebaseTo: path.resolve(__dirname, '../')
        },
        minifyJS: (text, inline) => {
          // https://github.com/kangax/html-minifier/blob/gh-pages/src/htmlminifier.js
          const start = text.match(/^\s*<!--.*/)
          const code = start
            ? text.slice(start[0].length).replace(/\n\s*-->\s*$/, '')
            : text
          const result = UglifyJS.minify(code, {
            compress: {
              keep_fargs: false
            },
            parse: {
              bare_returns: inline
            },
            // Warnings won't give helpful line numbers because everything's
            // mushed together
            warnings: false,
            toplevel: true
          })
          if (result.error) {
            console.log(colours.bold.underline.red('PROBLEM'))
            console.log(colours.red(JSON.stringify(result.error, null, 2)))
            return text
          }
          return result.code.replace(/;$/, '')
        },
        processConditionalComments: true,
        processScripts: ['text/html'],
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        trimCustomFragments: true,
        useShortDoctype: true
      }
    ).replace('<insert-sheep></insert-sheep>', SHEEP)
  )
}

buildIndexHtml()
