import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const buyerCard=readFileSync('patches/buyer-card-v120.jsfrag','utf8').trimEnd();
const before=app;
app=app.replace('<video class="j-welcome-video" autoplay muted loop playsinline preload="metadata"','<video class="j-welcome-video" autoplay muted loop playsinline controls preload="metadata"');
app=app.replace(/  function buyerOfferCard\(o,joined,membership\)\{[\s\S]*?\n  function flashCard/,()=>`${buyerCard}\n  function flashCard`);
if(app===before)throw new Error('V120 patch failed: buyer offer card');
for(const token of ['j-saving-chip','j-achieved-ribbon','buyer_submit_group_order','buyer_choose_offer_tier']){
  if(!app.includes(token))throw new Error(`V120 validation missing ${token}`);
}
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
const polish=readFileSync('patches/buyer-app-v120.cssfrag','utf8');
css+=`\n${polish}\n`;
writeFileSync(cssPath,css);

const mustCopy=[
  ['assets-src/junta-apresentacao.mp4','dist/assets/junta-apresentacao.mp4'],
  ['pwa-v120.js','dist/pwa-v120.js'],
  ['sw.js','dist/sw.js'],
  ['icons/icon-192.png','dist/icons/icon-192.png'],
  ['icons/icon-512.png','dist/icons/icon-512.png'],
  ['icons/icon-maskable-512.png','dist/icons/icon-maskable-512.png'],
  ['manifest.webmanifest','dist/manifest.webmanifest']
];
mkdirSync('dist/assets',{recursive:true});
mkdirSync('dist/icons',{recursive:true});
for(const [src,dst] of mustCopy){if(!existsSync(src))throw new Error(`V120 missing ${src}`);copyFileSync(src,dst)}

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=120')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=120')
  .replace(/<meta name="theme-color" content="[^"]+"\s*\/>/,'<meta name="theme-color" content="#ef3f3a" />');
if(!index.includes('apple-touch-icon'))index=index.replace('</head>','  <link rel="apple-touch-icon" href="/icons/icon-192.png" />\n</head>');
if(!index.includes('/pwa-v120.js'))index=index.replace('</body>','  <script defer src="/pwa-v120.js?v=120"></script>\n</body>');
writeFileSync(indexPath,index);
console.log('JUNTA V120 app experience + PWA ready');
