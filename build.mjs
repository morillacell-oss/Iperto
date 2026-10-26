import { rmSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('site', 'dist', { recursive: true });
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

let html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('assets-fix.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/assets-fix.css?v=2">\n</head>');
}
if (!html.includes('categories-ui.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/categories-ui.css?v=30">\n</head>');
}
if (!html.includes('identity-v30.css')) {
  html = html.replace('</head>', '  <link rel="stylesheet" href="/identity-v30.css?v=30">\n</head>');
}
if (!html.includes('categories-ui.js')) {
  html = html.replace('</body>', '  <script src="/categories-ui.js?v=30"></script>\n</body>');
}
writeFileSync('dist/index.html', html);

console.log('Junta V30 identity build ready');