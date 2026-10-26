async function loadPako() {
  const mod = await import('https://cdn.jsdelivr.net/npm/pako@2.1.0/+esm');
  return mod.default || mod;
}

async function decompressGzip(bytes) {
  if ('DecompressionStream' in window) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return await new Response(stream).text();
    } catch (error) {
      console.warn('DecompressionStream falhou; usando fallback.', error);
    }
  }

  const pako = await loadPako();
  const output = pako.ungzip(bytes);
  return new TextDecoder().decode(output);
}

async function readPacked(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar ${url}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return await decompressGzip(bytes);
  }

  return new TextDecoder().decode(bytes);
}

function showBootError(error) {
  console.error(error);
  const boot = document.getElementById('boot');
  if (!boot) return;
  boot.classList.add('error');
  boot.innerHTML = `
    <div class="boot-mark"><i></i><i></i></div>
    <strong>JUNTA</strong>
    <span>Não conseguimos abrir a plataforma neste navegador agora.</span>
    <button id="retryBoot" type="button" style="border:0;border-radius:999px;padding:12px 18px;background:#ef3f3a;color:#fff;font-weight:800;cursor:pointer">Tentar novamente</button>
  `;
  document.getElementById('retryBoot')?.addEventListener('click', () => location.reload());
}

async function start() {
  const [html, css, js] = await Promise.all([
    readPacked('/source/index.html.gz'),
    readPacked('/source/styles.css.gz'),
    readPacked('/source/app.js.gz')
  ]);

  const parsed = new DOMParser().parseFromString(html, 'text/html');

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  document.title = parsed.title || document.title;
  document.body.innerHTML = parsed.body.innerHTML;

  const jsUrl = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
  try {
    await import(jsUrl);
  } finally {
    setTimeout(() => URL.revokeObjectURL(jsUrl), 2000);
  }
}

start().catch(showBootError);
