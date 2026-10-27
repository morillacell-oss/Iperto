import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
function rep(label,needle,replacement){const before=app;app=app.replace(needle,()=>replacement);if(app===before)throw new Error(`V115 patch failed: ${label}`);}

rep('postal input validation',
  '<input name="postal" value="${esc(existing?.postal_code||p.postal_code||\'\')}" inputmode="numeric" autocomplete="postal-code" maxlength="16">',
  '<input name="postal" value="${esc(existing?.postal_code||p.postal_code||\'\')}" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000">'
);
rep('delivery validation',
  "      if(isDelivery&&(!String(fd.get('street')||'').trim()||!String(fd.get('number')||'').trim()||!String(fd.get('city')||'').trim()||!String(fd.get('state')||'').trim())){toast('Para entrega, preencha rua, número, cidade e estado.');return;}",
  "      const postalDigits=String(fd.get('postal')||'').replace(/\\D/g,'');const stateCode=String(fd.get('state')||'').trim().toUpperCase();\n      if(isDelivery&&postalDigits.length!==8){toast('Digite um CEP válido com 8 números.');return;}\n      if(isDelivery&&(!String(fd.get('street')||'').trim()||!String(fd.get('number')||'').trim()||!String(fd.get('city')||'').trim()||!/^[A-Z]{2}$/.test(stateCode))){toast('Confira rua, número, cidade e UF antes de continuar.');return;}"
);
rep('normalized postal payload',
  "p_postal_code:String(fd.get('postal')||'').trim(),",
  "p_postal_code:isDelivery?postalDigits:'',"
);

if(!app.includes("postalDigits.length!==8"))throw new Error('V115 validation: CEP guard missing');
if(!app.includes("/^[A-Z]{2}$/"))throw new Error('V115 validation: UF guard missing');
if(!app.includes("buyer_submit_group_order"))throw new Error('V115 validation: checkout RPC missing');
new Function(app);
writeFileSync(appPath,app);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8').replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=115').replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=115');
writeFileSync(indexPath,index);
console.log('Junta V115 checkout validation ready');
