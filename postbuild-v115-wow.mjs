import { readFileSync, writeFileSync } from 'node:fs';
const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/wow-v115.cssfrag','utf8')+'\n';
writeFileSync(cssPath,css);
const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=115')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=115');
writeFileSync(indexPath,index);
console.log('Junta V115 premium visual refinement ready');
