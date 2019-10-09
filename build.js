const UglifyJS = require("uglify-es");
const minify = require('html-minifier').minify;
const fs = require('fs');
const path = require('path');

function readFile(file) {
  return new Promise((res, rej) => {
    fs.readFile(path.resolve(__dirname, file), 'utf8', (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
}
function writeFile(file, contents) {
  fs.writeFile(path.resolve(__dirname, file), contents, console.log);
}

const date = new Date().toDateString();
readFile('./sw.js').then(cache => {
  writeFile('./sw.js', cache.replace(/ugwa-sw-\d+/, 'ugwa-sw-' + Date.now()));
});
/*
readFile('./psa.html').then(html => {
  writeFile('./psa.html', html.replace(/(<strong data-version>).*?(<\/strong>)/, `$1${date}$2`));
});
*/

readFile('./appdesign.html').then(html => {
  const css = [];
  html.replace(/<link rel="stylesheet" href="(.+)">/g, (_, url) => css.push('./' + url));
  const js = [];
  html.replace(/<script src="(.+)" charset="utf-8"><\/script>/g, (_, url) => js.push('./' + url));
  Promise.all(css.map(c => readFile(c))).then(css => {
    css = css.join('\n').replace(/url\(('|")\.\./g, 'url($1.');
    Promise.all(js.map(j => readFile(j))).then(js => {
      js = js.join('\n');
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
            const start = text.match(/^\s*<!--.*/);
            const code = start ? text.slice(start[0].length).replace(/\n\s*-->\s*$/, '') : text;
            const result = UglifyJS.minify(code, {
              compress: {
                drop_console: true,
                keep_fargs: false,
                unused: false, // it gets rid of initMap for being useless
                warnings: true
              },
              parse: {
                bare_returns: inline
              },
              mangle: {
                reserved: ['initMap', 'langs']
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
      writeFile('./index.html', result);
    });
  });
});
