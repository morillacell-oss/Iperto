import { mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const joinParts = (dir) => readdirSync(dir).filter(f => f.endsWith('.txt')).sort().map(f => readFileSync(join(dir, f), 'utf8')).join('');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/assets', { recursive: true });

let html = readFileSync('index.html', 'utf8')
  .replaceAll('/assets/collective.png', '/assets/collective.webp')
  .replace('<img src="/assets/unlock.png" alt="Oferta liberada" />', '<img src="/assets/collective.webp" alt="Compra coletiva Junta" />')
  .replace('<img src="/assets/queue.png" alt="Entrar na fila" />', '<div class="step-symbol queue-symbol" aria-hidden="true"><span>•••</span></div>')
  .replace('<img src="/assets/unlock.png" alt="Oferta liberada" />', '<div class="step-symbol unlock-symbol" aria-hidden="true"><span>✓</span></div>')
  .replace('<img src="/assets/queue.png" alt="Demanda coletiva chegando ao painel da empresa" />', '<img src="/assets/collective.webp" alt="Demanda coletiva Junta" />');

writeFileSync('dist/index.html', html);
writeFileSync('dist/styles.css', joinParts('source-v2/css'));
writeFileSync('dist/app.js', joinParts('source-v2/app'));
const collective = joinParts('source-v2/assets/collective');
writeFileSync('dist/assets/collective.webp', Buffer.from(collective, 'base64'));
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');
console.log('Junta V2 build ready');
