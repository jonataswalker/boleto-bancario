import { readFileSync } from 'fs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import buble from 'rollup-plugin-buble';
import vue from 'rollup-plugin-vue';
import uglify from 'rollup-plugin-uglify';
import commonjs from 'rollup-plugin-commonjs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const build = process.env.DEV ? 'development' : 'production';
const browser = (process.env.BROWSER || process.env.STANDALONE) || false;
const external = process.env.STANDALONE ? [] : Object.keys(pkg.dependencies);
const target = browser ? { ie: 9 } : { node: 6 };
const format = browser ? 'umd' : 'cjs';
let dest = browser ? 'build/boleto-bancario.debug.js' : pkg.main;

console.log('build .... ', build);

const plugins = [
  resolve(),
  vue({ compileTemplate: true }),
  buble({ target })
];

if (process.env.STANDALONE) {
  // include deps
  plugins.push(commonjs());
  plugins.push(uglify({ output: { comments: /^!/ }}));
  plugins.push(replace({ 'process.env.NODE_ENV': JSON.stringify(build) }));
  dest = 'build/boleto-bancario.standalone.js';
}

const banner = readFileSync('banner.js', 'utf-8')
    .replace('${name}', pkg.name)
    .replace('${version}', pkg.version)
    .replace('${description}', pkg.description)
    .replace('${homepage}', pkg.homepage)
    .replace('${time}', new Date());

export default {
  external,
  banner,
  format,
  dest,
  entry: 'src/main.js',
  globals: { vue: 'Vue', moment: 'moment' },
  moduleName: 'BoletoBancario',
  plugins
};
