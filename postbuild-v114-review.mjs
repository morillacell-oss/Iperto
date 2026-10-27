import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
function rep(label,needle,replacement){const before=app;app=app.replace(needle,()=>replacement);if(app===before)throw new Error(`V114 patch failed: ${label}`);}

rep('checkout stepper','</div><form class="j-form" id="groupOrderForm">','</div><div class="j-checkout-steps" aria-label="Etapas do pedido"><span class="active">Recebimento</span><span>Pagamento</span><span>Enviar</span></div><form class="j-form" id="groupOrderForm">');
rep('recipient attributes','<input name="recipient" value="${esc(existing?.recipient_name||p.display_name||\'\')}" required>','<input name="recipient" value="${esc(existing?.recipient_name||p.display_name||\'\')}" autocomplete="name" maxlength="120" required>');
rep('postal attributes','<input name="postal" value="${esc(existing?.postal_code||p.postal_code||\'\')}" inputmode="numeric">','<input name="postal" value="${esc(existing?.postal_code||p.postal_code||\'\')}" inputmode="numeric" autocomplete="postal-code" maxlength="16">');
rep('street attributes','<input name="street" value="${esc(existing?.street||\'\')}" placeholder="Nome da rua">','<input name="street" value="${esc(existing?.street||\'\')}" placeholder="Nome da rua" autocomplete="address-line1" maxlength="160">');
rep('number attributes','<input name="number" value="${esc(existing?.address_number||\'\')}" placeholder="123">','<input name="number" value="${esc(existing?.address_number||\'\')}" placeholder="123" maxlength="30">');
rep('complement attributes','<input name="complement" value="${esc(existing?.complement||\'\')}" placeholder="Apto, bloco...">','<input name="complement" value="${esc(existing?.complement||\'\')}" placeholder="Apto, bloco..." autocomplete="address-line2" maxlength="120">');
rep('neighborhood attributes','<input name="neighborhood" value="${esc(existing?.neighborhood||p.neighborhood||\'\')}">','<input name="neighborhood" value="${esc(existing?.neighborhood||p.neighborhood||\'\')}" maxlength="120">');
rep('city attributes','<input name="city" value="${esc(existing?.city||p.city||\'\')}">','<input name="city" value="${esc(existing?.city||p.city||\'\')}" autocomplete="address-level2" maxlength="120">');
rep('reference attributes','<input name="reference" value="${esc(existing?.reference_note||\'\')}" placeholder="Próximo a...">','<input name="reference" value="${esc(existing?.reference_note||\'\')}" placeholder="Próximo a..." maxlength="300">');
rep('extras maxlength','<textarea name="extras" rows="3" placeholder="Ex.: 1 refrigerante, adicionar bacon, sem cebola...">','<textarea name="extras" rows="3" maxlength="500" placeholder="Ex.: 1 refrigerante, adicionar bacon, sem cebola...">');
rep('protection copy','<b>Pedido organizado pelo Junta</b>','<b>Compra em grupo protegida pelo Junta</b>');

if(!app.includes('j-checkout-steps'))throw new Error('V114 validation: stepper missing');
if(!app.includes('maxlength="500"'))throw new Error('V114 validation: extras limit missing');
if(!app.includes("$$('[data-buyer-offer]',root).forEach"))throw new Error('V114 validation: buyer selector regressed');
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/review-v114.cssfrag','utf8')+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=114')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=114');
writeFileSync(indexPath,index);
console.log('Junta V114 UX + security review ready');
