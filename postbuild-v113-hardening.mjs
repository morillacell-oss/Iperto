import { readFileSync, writeFileSync } from 'node:fs';
const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
function rep(label,needle,replacement){const before=app;app=app.replace(needle,()=>replacement);if(app===before)throw new Error(`V113 patch failed: ${label}`);}
rep('disable simple cancel after achieved tier',"    const canCancel=['pending','scheduled','open'].includes(o.status)&&paid===0;","    const canCancel=['pending','scheduled','open'].includes(o.status)&&paid===0&&!sellerTierRunsFor(o.id).length;");
rep('launch WhatsApp without popup blocker',"    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,'_blank','noopener');","    location.href=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;");
if(!app.includes("buyer_submit_group_order"))throw new Error('V113 validation: checkout missing');
if(!app.includes("!sellerTierRunsFor(o.id).length"))throw new Error('V113 validation: achieved cancellation lock missing');
if(app.includes("window.open(`https://wa.me/${phone}"))throw new Error('V113 validation: WhatsApp popup path still present');
new Function(app);
writeFileSync(appPath,app);
const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8').replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=113').replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=113');
writeFileSync(indexPath,index);
console.log('Junta V113 achieved-group hardening ready');
