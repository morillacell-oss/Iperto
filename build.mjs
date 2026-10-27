import { rmSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('site', 'dist', { recursive: true });
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

let html = readFileSync('dist/index.html', 'utf8');
if (!html.includes('assets-fix.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/assets-fix.css?v=2">\n</head>');
if (!html.includes('categories-ui.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/categories-ui.css?v=30">\n</head>');
if (!html.includes('identity-v30.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/identity-v30.css?v=30">\n</head>');
if (!html.includes('identity-v31.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/identity-v31.css?v=31">\n</head>');
if (!html.includes('product-v40.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/product-v40.css?v=40">\n</head>');
if (!html.includes('product-v42.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/product-v42.css?v=42">\n</head>');
if (!html.includes('categories-ui.js')) html = html.replace('</body>', '  <script src="/categories-ui.js?v=30"></script>\n</body>');
if (!html.includes('polish-v31.js')) html = html.replace('</body>', '  <script src="/polish-v31.js?v=31"></script>\n</body>');
if (!html.includes('product-v40.js')) html = html.replace('</body>', '  <script src="/product-v40.js?v=40"></script>\n</body>');
if (!html.includes('copy-v41.js')) html = html.replace('</body>', '  <script src="/copy-v41.js?v=41"></script>\n</body>');
if (!html.includes('product-v42.js')) html = html.replace('</body>', '  <script src="/product-v42.js?v=42"></script>\n</body>');
if (!html.includes('master-v43.js')) html = html.replace('</body>', '  <script src="/master-v43.js?v=43"></script>\n</body>');
writeFileSync('dist/index.html', html);

console.log('Junta V43 real-only master analytics ready');
