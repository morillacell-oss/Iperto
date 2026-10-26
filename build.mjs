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

copyFileSync('ui-refine.css', 'dist/ui-refine.css');
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

let html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('ui-refine.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/ui-refine.css?v=4">\n</head>');
}
if (!/viewport-fit=cover/.test(html)) {
  html = html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">');
}
writeFileSync('dist/index.html', html);

console.log('Junta static build ready with premium responsive UI');
