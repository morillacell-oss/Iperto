import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
const app=readFileSync(appPath,'utf8');
new Function(app);
if(!app.includes("buyer_submit_group_order"))throw new Error('V116 validation: checkout flow missing');
if(!app.includes("buyer_choose_offer_tier"))throw new Error('V116 validation: tier flow missing');
if(!app.includes("startNotificationRealtime"))throw new Error('V116 validation: notifications missing');

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
const premium=readFileSync('patches/premium-v116.cssfrag','utf8');
if(!premium.includes('.j-bottom-nav')||!premium.includes('.j-business-hero')||!premium.includes('.j-offer'))throw new Error('V116 validation: premium CSS incomplete');
css+='\n'+premium+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=116')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=116');
writeFileSync(indexPath,index);
console.log('Junta V116 premium visual system ready');
