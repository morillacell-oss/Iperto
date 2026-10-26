import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

mkdirSync('dist', { recursive: true });

for (const [source, target] of [
  ['source/index.html.gz', 'dist/index.html'],
  ['source/styles.css.gz', 'dist/styles.css'],
  ['source/app.js.gz', 'dist/app.js'],
]) {
  const packed = readFileSync(source);
  writeFileSync(target, gunzipSync(packed));
}

copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

console.log('Junta static build ready');
