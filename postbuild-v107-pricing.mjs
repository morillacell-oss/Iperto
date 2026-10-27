import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const fragment=readFileSync('patches/openCreateOffer-v107.jsfrag','utf8').trimEnd();
const re=/  function openCreateOffer\(\)\{[\s\S]*?\n  \}\n\n  function renderBuyer/;
if(!re.test(app)) throw new Error('V107 pricing patch: openCreateOffer not found');
app=app.replace(re,fragment+'\n\n  function renderBuyer');
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/pricing-v107.css','utf8')+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=107')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=107');
writeFileSync(indexPath,index);
console.log('Junta V107 guided pricing ready');
