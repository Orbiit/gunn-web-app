const UglifyJS = require("uglify-es");
const minify = require('html-minifier').minify;
const fs = require('fs');

const css = [
  './css/main.css',
  './css/material.css',
  './css/colourpicker.css',
  './css/datepicker.css',
  './css/periodcustomisation.css',
  './schedule/schedule.css'
];
const js = [
  './js/main.js',
  './js/date.js',
  './js/colour.min.js',
  './js/code39.min.js',
  './js/material.js',
  './js/footer.js',
  './js/schedule.js',
  './js/lists.js',
  './js/barcodes.js',
  './schedule/app.js',
  './touchy/rotate1.min.js'
];

function readFile(path) {
  return new Promise((res, rej) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
}

Promise.all(css.map(c => readFile(c))).then(css => {
  css = css.join('\n');
  Promise.all(js.map(j => readFile(j))).then(js => {
    js = js.join('\n');
    readFile('./appdesign.html').then(html => {
      const result = minify(
        html
          .replace('<html', '<html manifest="cache.appcache"')
          .replace(/<!-- STYLES [^]* \/STYLES -->/, `<style>${css}</style>`)
          .replace(/<!-- SCRIPTS [^]* \/SCRIPTS -->/, `<script>${js}</script>`)
          .replace(/<!-- NOAPPDESIGN [^]* \/NOAPPDESIGN -->/, ''),
        {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          decodeEntities: true,
          minifyCSS: true,
          minifyJS: (text, inline) => {
            // https://github.com/kangax/html-minifier/blob/gh-pages/src/htmlminifier.js
            const start = text.match(/^\s*<!--.*/);
            const code = start ? text.slice(start[0].length).replace(/\n\s*-->\s*$/, '') : text;
            const result = UglifyJS.minify(code, {
              compress: {
                drop_console: true,
                keep_fargs: false
              },
              parse: {
                bare_returns: inline
              },
              toplevel: true
            });
            if (result.error) {
              return text;
            }
            return result.code.replace(/;$/, '');
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
      );
      fs.writeFile('./index.html', result, console.log);
    });
  });
});
