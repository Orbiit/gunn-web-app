const UglifyJS = require('uglify-es')
const minify = require('html-minifier').minify
const fs = require('fs')
const path = require('path')
const colours = require('colors/safe')
const { rollup } = require('rollup')

async function buildUgwaJs () {
  const bundle = await rollup({
    input: path.resolve(__dirname, './js/main.js')
  })
  const { output } = await bundle.generate({
    format: 'iife'
  })
  return output.find(({ fileName }) => fileName === 'main.js').code
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
  const js = await buildUgwaJs()
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
    )
  )
}

buildIndexHtml()
