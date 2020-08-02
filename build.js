const UglifyJS = require('uglify-es')
const minify = require('html-minifier').minify
const fs = require('fs')
const path = require('path')
const colours = require('colors/safe')

// meh whatever
// https://stackoverflow.com/a/26815894
// if (!fs.existsSync(path.resolve(__dirname, './source-maps/'))){
//   fs.mkdirSync(path.resolve(__dirname, './source-maps/'));
// }

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
/*
readFile('./psa.html').then(html => {
  writeFile('./psa.html', html.replace(/(<strong data-version>).*?(<\/strong>)/, `$1${date}$2`));
});
*/

readFile('./appdesign.html').then(html => {
  const css = []
  html.replace(/<link rel="stylesheet" href="(.+)">/g, (_, url) =>
    css.push('./' + url)
  )
  const js = []
  html.replace(/<script src="(.+)" charset="utf-8"><\/script>/g, (_, url) =>
    js.push('./' + url)
  )
  Promise.all(css.map(c => readFile(c))).then(css => {
    css = css.join('\n').replace(/url\(('|")\.\./g, 'url($1.')
    Promise.all(js.map(j => readFile(j))).then(js => {
      js = `(()=>{
        ${js.join('\n')}
        window.initMap = initMap;
        window.langs = langs;
      })();`
      const result = minify(
        html
          .replace(/<!-- STYLES [^]* \/STYLES -->/, `<style>${css}</style>`)
          .replace(/<!-- SCRIPTS [^]* \/SCRIPTS -->/, `<script>${js}</script>`)
          .replace(/<!-- NOAPPDESIGN [^]* \/NOAPPDESIGN -->/, '')
          .replace(/\{VERSION\}/, date),
        {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          decodeEntities: true,
          minifyCSS: true,
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
              // sourceMap: {
              //   // filename: id,
              //   url: id + '.map'
              // },
              warnings: false, // Warnings weren't very helpful bc I mushed everything together oof
              toplevel: true
            })
            if (result.warnings && result.warnings.length) {
              console.log(colours.bold.underline.yellow('WARNING'))
              console.log(colours.yellow(result.warnings.join('\n')))
            }
            if (result.error) {
              console.log(colours.bold.underline.red('PROBLEM'))
              console.log(colours.red(JSON.stringify(result.error, null, 2)))
              return text
            }
            // writeFile(id + '.map', result.map)
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
      writeFile('./index.html', result)
    })
  })
})
