var jetpack = require('fs-jetpack'),
    sass = require('node-sass'),
    pkg = require('./package.json');

const banner = jetpack.read('banner.js')
  .replace('${name}', pkg.name)
  .replace('${version}', pkg.version)
  .replace('${description}', pkg.description)
  .replace('${homepage}', pkg.homepage)
  .replace('${time}', new Date());


sass.render({
  file: 'src/sass/main.scss',
  outputStyle: 'compressed'
}, (err, result) => {
  if (err) throw err.message;

  const dest = jetpack.cwd('build');
  dest.write('boleto-bancario.css', banner + result.css);

  console.log('Built: ', new Date());
});
