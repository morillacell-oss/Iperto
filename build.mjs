import { rmSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('site', 'dist', { recursive: true });
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

let html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('assets-fix.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets-fix.css?v=1">\n</head>');
}
writeFileSync('dist/index.html', html);

console.log('Junta V2 static build ready');
