import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const renderBuyer=readFileSync('patches/renderBuyer-v109.jsfrag','utf8').trimEnd();
const paintBuyer=readFileSync('patches/paintBuyer-v109.jsfrag','utf8').trimEnd();

function replaceChecked(label,regex,replacement){
  const before=app;
  app=app.replace(regex,()=>replacement);
  if(app===before)throw new Error(`V110 patch failed: ${label}`);
}

replaceChecked(
  'renderBuyer',
  /  function renderBuyer\(tab='home'\)\{[\s\S]*?\n  \}\n\n  async function loadBuyerData/,
  `${renderBuyer}\n\n  async function loadBuyerData`
);

replaceChecked(
  'paintBuyer',
  /  function paintBuyer\(tab\)\{[\s\S]*?\n  function flashCard/,
  `${paintBuyer}\n  function flashCard`
);

if(!app.includes("$$('[data-buyer-offer]',root).forEach")){
  throw new Error('V110 validation failed: buyer offer selector must remain querySelectorAll');
}

new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/buyer-home-v109.cssfrag','utf8')+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=110')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=110');
writeFileSync(indexPath,index);

console.log('Junta V110 buyer selector build fixed and validated');