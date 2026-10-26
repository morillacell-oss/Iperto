import { rmSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('site', 'dist', { recursive: true });
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

let html = readFileSync('dist/index.html', 'utf8');
html = html.replace('/styles.css?v=8', '/styles.css?v=10');
html = html.replace('+38%', 'Fila');
html = html.replace('economia média*', 'sem pagar');
if (!html.includes('assets-fix.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets-fix.css?v=2">\n</head>');
} else {
  html = html.replace('/assets-fix.css?v=1', '/assets-fix.css?v=2');
}
writeFileSync('dist/index.html', html);

console.log('Junta V3 visual refresh ready');
