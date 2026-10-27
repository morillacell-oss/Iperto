import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const modalFrag=readFileSync('patches/buyer-tier-modal-v111.jsfrag','utf8').trimEnd();

function replaceChecked(label,needle,replacement){
  const before=app;
  if(needle instanceof RegExp) app=app.replace(needle,()=>replacement);
  else app=app.replace(needle,replacement);
  if(app===before)throw new Error(`V111 patch failed: ${label}`);
}

replaceChecked(
  'waitlist target select',
  "select('offer_id,created_at,status,cancelled_at,cancellation_reason')",
  "select('offer_id,created_at,status,cancelled_at,cancellation_reason,target_people')"
);

app=app.replaceAll(
  'offer_stats(waitlist_count,view_count)',
  'offer_stats(waitlist_count,view_count,tier_5_count,tier_10_count,tier_15_count,tier_20_count,tier_25_count)'
);

replaceChecked(
  'buyer modal tier flow',
  /  function openOfferModal\(o,allowJoin\)\{[\s\S]*?\n  async function joinOffer\(o\)\{[\s\S]*?\n\n  function openCepModal/,
  `${modalFrag}\n\n  function openCepModal`
);

replaceChecked(
  'shared offer public deep link',
  "    renderPublicOffers();\n  }\n\n  function renderPublicOffers",
  "    renderPublicOffers();\n    const sharedId=new URLSearchParams(location.search).get('offer');\n    if(sharedId&&state._sharedPublicOpened!==sharedId){const shared=state.publicOffers.find(o=>o.id===sharedId);if(shared){state._sharedPublicOpened=sharedId;setTimeout(()=>openPublicOffer(shared),80);}}\n  }\n\n  function renderPublicOffers"
);

if(!app.includes('target_people'))throw new Error('V111 validation failed: target_people missing');
if(!app.includes('tier_5_count'))throw new Error('V111 validation failed: tier counters missing');
if(!app.includes('data-tier-choice'))throw new Error('V111 validation failed: tier picker missing');
if(!app.includes('createShareBanner'))throw new Error('V111 validation failed: share banner missing');
if(!app.includes("$$('[data-buyer-offer]',root).forEach"))throw new Error('V111 validation failed: buyer selector regressed');
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/buyer-tier-v111.cssfrag','utf8')+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=111')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=111');
writeFileSync(indexPath,index);

console.log('Junta V111 buyer tier choice + sharing ready');
