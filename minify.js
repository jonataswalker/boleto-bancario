var jetpack = require('fs-jetpack'),
    minify = require('uglify-js').minify,
    pkg = require('./package.json');

const dest = jetpack.cwd('build');
const code = dest.read('boleto-bancario.debug.js');

const minified = minify(code, {
  fromString: true,
  warnings: false,
  mangle: true,
  output: { comments: /^!/ },
  compress: { screw_ie8: true, drop_console: false }
}).code;

dest.write('boleto-bancario.js', minified);

console.log('Now: ', new Date());
