var jetpack = require('fs-jetpack'),
    rollup = require('rollup'),
    vue = require('rollup-plugin-vue'),
    commonjs = require('rollup-plugin-commonjs'),
    resolve = require('rollup-plugin-node-resolve'),
    replace = require('rollup-plugin-replace'),
    buble = require('rollup-plugin-buble'),
    minify = require('uglify-js').minify,
    pkg = require('./package.json');

const banner = jetpack.read('banner.js')
  .replace('${name}', pkg.name)
  .replace('${version}', pkg.version)
  .replace('${description}', pkg.description)
  .replace('${homepage}', pkg.homepage)
  .replace('${time}', new Date());

const external = Object.keys(pkg.dependencies);

rollup.rollup({
  entry: 'src/index.js',
  external,
  plugins: [
    vue({
      compileTemplate: true,
      htmlMinifier: {
        removeRedundantAttributes: false,
        removeComments: false
      }
    }),
    replace({'process.env.NODE_ENV': JSON.stringify('development')}),
    resolve(),
    commonjs(),
    buble()
  ]
}).then(bundle => {
  const result = bundle.generate({
    format: 'umd',
    moduleName: 'BoletoBB',
    globals: { vue: 'Vue', moment: 'moment' },
    banner: banner
  }).code;

  const minified = minify(result, {
    fromString: true,
    warnings: false,
    mangle: true,
    output: { comments: /^!/ },
    compress: { screw_ie8: true, drop_console: false }
  }).code;

  const dest = jetpack.cwd('build');
  dest.write('boleto-bb.debug.js', result);
  dest.write('boleto-bb.js', minified);

  console.log('Built: ', new Date());
});
