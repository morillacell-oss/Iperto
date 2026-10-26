import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, cpSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

for (const [source, target] of [
  ['source/index.html.gz', 'dist/index.html'],
  ['source/styles.css.gz', 'dist/styles.css'],
  ['source/app.js.gz', 'dist/app.js'],
]) {
  writeFileSync(target, gunzipSync(readFileSync(source)));
}

copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');
cpSync('assets', 'dist/assets', { recursive: true });

console.log('Junta V2 static build ready');
