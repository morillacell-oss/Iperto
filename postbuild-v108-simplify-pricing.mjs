import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');

const replacements=[
  ["const tierInputs=$('[data-tier-input]',form);","const tierInputs=$$('[data-tier-input]',form);"],
  ["$('[data-tier-row]',form).forEach(r=>r.classList.remove('valid','invalid'));","$$('[data-tier-row]',form).forEach(r=>r.classList.remove('valid','invalid'));"],
  ['Piso sustentável <small>Menor preço que você aceita</small>','Menor preço que eu aceito <small>O Junta nunca vai baixar além daqui</small>'],
  ['O que é o piso sustentável?','Proteção de preço'],
  ['Nenhuma faixa do grupo poderá ficar abaixo desse valor. Assim você nunca cria uma oferta com prejuízo.','Esse é o menor valor que você aceita vender. O Junta nunca permitirá uma faixa abaixo dele.'],
  ['O último preço deve ser igual ou maior que o piso sustentável.','A última faixa nunca pode ficar abaixo do menor preço que você aceita.'],
  ['Agora informe seu piso sustentável','Agora informe o menor preço que você aceita'],
  ['O piso precisa ser menor que o preço normal','O menor preço precisa ser abaixo do preço normal'],
  ['Piso informado:','Menor preço informado:'],
  ['Pouco espaço entre preço e piso','Os dois preços estão muito próximos'],
  ['entre o preço normal e o piso.','entre o preço normal e o menor preço.'],
  ['está abaixo do piso','está abaixo do seu menor preço'],
  ['é menor que seu piso sustentável de','é menor que o valor mínimo que você aceitou de'],
  ['Aumente essa faixa ou reduza conscientemente o piso.','Aumente essa faixa ou altere o campo “Menor preço que eu aceito”.'],
  ['sem passar do piso de','sem ficar abaixo do mínimo de'],
  ['Informe o piso sustentável','Informe o menor preço que você aceita'],
  ['Esse é o menor preço que o Junta poderá sugerir.','O Junta nunca vai sugerir uma faixa abaixo desse valor.'],
  ['O piso precisa ser menor que o preço normal','O menor preço precisa ser abaixo do preço normal'],
  ['reduza o piso em pelo menos','reduza o menor preço em pelo menos'],
  ['não passar do seu piso.','não ficar abaixo do seu menor preço.']
];

for(const [from,to] of replacements){
  if(app.includes(from)) app=app.split(from).join(to);
}

new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+=`\n/* V108 — linguagem simples para precificação */\n.j-floor-explainer b{font-size:13px}.j-floor-explainer span{font-size:12px}.j-tier-status.invalid{animation:jPricingNudge .24s ease}@keyframes jPricingNudge{0%{transform:translateX(0)}35%{transform:translateX(-3px)}70%{transform:translateX(3px)}100%{transform:translateX(0)}}\n`;
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=108')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=108');
writeFileSync(indexPath,index);

console.log('Junta V108 pricing language simplified');