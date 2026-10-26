async function readPacked(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (!('DecompressionStream' in window)) throw new Error('Navegador sem suporte à descompactação segura.');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return await new Response(stream).text();
  }
  return new TextDecoder().decode(bytes);
}

try {
  const [html, css, js] = await Promise.all([
    readPacked('/source/index.html.gz'),
    readPacked('/source/styles.css.gz'),
    readPacked('/source/app.js.gz')
  ]);

  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const cssUrl = URL.createObjectURL(new Blob([css], { type: 'text/css' }));
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = cssUrl;
  document.head.appendChild(stylesheet);
  await new Promise((resolve, reject) => {
    stylesheet.onload = resolve;
    stylesheet.onerror = reject;
  });

  document.title = parsed.title || document.title;
  document.body.innerHTML = parsed.body.innerHTML;

  const jsUrl = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
  await import(jsUrl);
} catch (error) {
  console.error(error);
  const boot = document.getElementById('boot');
  if (boot) {
    boot.classList.add('error');
    boot.innerHTML = '<div class="boot-mark"><i></i><i></i></div><strong>JUNTA</strong><span>Não conseguimos abrir a plataforma agora. Atualize a página. Se continuar, tente novamente em outro navegador.</span>';
  }
}
