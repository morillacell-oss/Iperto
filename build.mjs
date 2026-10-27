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
if (!html.includes('landing-v50.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/landing-v50.css?v=50">\n</head>');
if (!html.includes('experience-v51.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/experience-v51.css?v=51">\n</head>');
if (!html.includes('product-v60.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/product-v60.css?v=60">\n</head>');
if (!html.includes('account-v62.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/account-v62.css?v=62">\n</head>');
if (!html.includes('seller-app-v70.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/seller-app-v70.css?v=70">\n</head>');
if (!html.includes('role-gate-v71.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/role-gate-v71.css?v=82">\n</head>');
if (!html.includes('runtime-v80.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/runtime-v80.css?v=82">\n</head>');

if (!html.includes('role-gate-v71.js')) {
  html = html.replace(
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <script src="/role-gate-v71.js?v=82"></script>'
  );
}

if (!html.includes('categories-ui.js')) html = html.replace('</body>', '  <script src="/categories-ui.js?v=30"></script>\n</body>');
if (!html.includes('polish-v31.js')) html = html.replace('</body>', '  <script src="/polish-v31.js?v=31"></script>\n</body>');
if (!html.includes('product-v40.js')) html = html.replace('</body>', '  <script src="/product-v40.js?v=40"></script>\n</body>');
if (!html.includes('copy-v41.js')) html = html.replace('</body>', '  <script src="/copy-v41.js?v=41"></script>\n</body>');
if (!html.includes('product-v42.js')) html = html.replace('</body>', '  <script src="/product-v42.js?v=42"></script>\n</body>');
if (!html.includes('master-v43.js')) html = html.replace('</body>', '  <script src="/master-v43.js?v=43"></script>\n</body>');
if (!html.includes('landing-v50.js')) html = html.replace('</body>', '  <script src="/landing-v50.js?v=50"></script>\n</body>');
if (!html.includes('experience-v51.js')) html = html.replace('</body>', '  <script src="/experience-v51.js?v=51"></script>\n</body>');
if (!html.includes('fixes-v52.js')) html = html.replace('</body>', '  <script src="/fixes-v52.js?v=52"></script>\n</body>');
if (!html.includes('buyer-region-v53.js')) html = html.replace('</body>', '  <script src="/buyer-region-v53.js?v=53"></script>\n</body>');
if (!html.includes('product-v60.js')) html = html.replace('</body>', '  <script src="/product-v60.js?v=60"></script>\n</body>');
if (!html.includes('runtime-v61.js')) html = html.replace('</body>', '  <script src="/runtime-v61.js?v=61"></script>\n</body>');
if (!html.includes('account-v62.js')) html = html.replace('</body>', '  <script src="/account-v62.js?v=62"></script>\n</body>');
if (!html.includes('seller-app-v80.js')) html = html.replace('</body>', '  <script src="/seller-app-v80.js?v=82"></script>\n</body>');
if (!html.includes('runtime-v80.js')) html = html.replace('</body>', '  <script src="/runtime-v80.js?v=82"></script>\n</body>');
writeFileSync('dist/index.html', html);

console.log('Junta V82 instant role routing, nonblocking boot and fast runtime ready');
