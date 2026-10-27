import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const renderBuyer=readFileSync('patches/renderBuyer-v118.jsfrag','utf8').trimEnd();
const buyerCard=readFileSync('patches/buyer-card-v118.jsfrag','utf8').trimEnd();

function replaceChecked(label,regex,replacement){
  const before=app;
  app=app.replace(regex,()=>replacement);
  if(app===before)throw new Error(`V119 patch failed: ${label}`);
}

replaceChecked(
  'buyer home',
  /  function renderBuyer\(tab='home'\)\{[\s\S]*?\n  \}\n\n  async function loadBuyerData/,
  `${renderBuyer}\n\n  async function loadBuyerData`
);
replaceChecked(
  'buyer offer card',
  /  function buyerOfferCard\(o,joined,membership\)\{[\s\S]*?\n  function flashCard/,
  `${buyerCard}\n  function flashCard`
);

for(const token of ['j-buyer-video-hero','j-buyer-card-badges','j-price-showcase','buyer_submit_group_order','buyer_choose_offer_tier']){
  if(!app.includes(token))throw new Error(`V119 validation missing ${token}`);
}
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
const refinement=readFileSync('patches/refine-v118.cssfrag','utf8');
const videoPolish=readFileSync('patches/video-v118.cssfrag','utf8');
const mobileVideo=readFileSync('patches/video-v119.cssfrag','utf8');
for(const token of ['.j-buyer-card-badges','.j-price-showcase','.j-bottom-nav','.j-video-dismiss','.j-buyer-video-frame']){
  if(!(refinement+videoPolish+mobileVideo).includes(token))throw new Error(`V119 CSS missing ${token}`);
}
css+=`\n${refinement}\n${videoPolish}\n${mobileVideo}\n`;
writeFileSync(cssPath,css);

const sourceVideo='assets-src/junta-apresentacao.mp4';
if(!existsSync(sourceVideo))throw new Error('V119 buyer intro video missing');
mkdirSync('dist/assets',{recursive:true});
copyFileSync(sourceVideo,'dist/assets/junta-apresentacao.mp4');

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=119')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=119');
writeFileSync(indexPath,index);
console.log('JUNTA V119 buyer refinement ready');
