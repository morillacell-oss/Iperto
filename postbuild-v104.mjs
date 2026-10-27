import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'dist/app-v100.js';
let app = readFileSync(appPath, 'utf8');
app = app
  .replace("$('[data-cut]',overlay).forEach", () => "$$('[data-cut]',overlay).forEach")
  .replace("$('[data-buyer-offer]',root).forEach", () => "$$('[data-buyer-offer]',root).forEach");

new Function(app);
writeFileSync(appPath, app);

const indexPath = 'dist/index.html';
let index = readFileSync(indexPath, 'utf8').replace(/v=103|v=104/g, 'v=105');
writeFileSync(indexPath, index);

console.log('Junta V105 runtime parsed and repaired');
