(() => {
  const nativeFetch = window.fetch.bind(window);
  const EDGE = 'https://rrulyvkarrwbopqeciyz.supabase.co/functions/v1/lookup-cep';

  function extractCep(input) {
    try {
      const u = typeof input === 'string' ? input : input?.url || '';
      const m = u.match(/viacep\.com\.br\/ws\/(\d{8})\/json/i);
      return m?.[1] || null;
    } catch { return null; }
  }

  async function fetchCepViaBackend(cep) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const r = await nativeFetch(`${EDGE}?cep=${encodeURIComponent(cep)}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || data?.error) {
        return new Response(JSON.stringify({ erro: true, message: data?.error || 'CEP não encontrado' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        cep: data.cep || cep,
        logradouro: data.logradouro || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        localidade: data.localidade || '',
        uf: data.uf || ''
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ erro: true, message: 'Não foi possível consultar o CEP agora.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } finally {
      clearTimeout(timer);
    }
  }

  window.fetch = async function(input, init) {
    const cep = extractCep(input);
    if (cep) return fetchCepViaBackend(cep);
    return nativeFetch(input, init);
  };

  function formatCepInputs() {
    document.querySelectorAll('input[autocomplete="postal-code"], #obCep, input[name="cep"]').forEach(input => {
      if (input.dataset.v52Cep) return;
      input.dataset.v52Cep = '1';
      input.addEventListener('input', () => {
        const digits = input.value.replace(/\D/g, '').slice(0, 8);
        input.value = digits.length > 5 ? `${digits.slice(0,5)}-${digits.slice(5)}` : digits;
      });
    });
  }

  function hardenOnboarding() {
    const form = document.querySelector('#j42Onboard');
    if (!form || form.dataset.v52) return;
    form.dataset.v52 = '1';
    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      form.addEventListener('submit', () => {
        submit.disabled = true;
        const old = submit.textContent;
        submit.dataset.oldText = old;
        submit.textContent = 'Validando...';
        setTimeout(() => {
          if (document.contains(submit)) {
            submit.disabled = false;
            submit.textContent = submit.dataset.oldText || 'Continuar';
          }
        }, 12000);
      }, true);
    }
  }

  function improveErrors() {
    window.addEventListener('unhandledrejection', ev => {
      const msg = String(ev.reason?.message || ev.reason || '');
      if (/failed to fetch/i.test(msg)) {
        ev.preventDefault();
        if (window.showToast) window.showToast('Falha de conexão. Tente novamente em alguns segundos.');
      }
    });
  }

  const observer = new MutationObserver(() => {
    formatCepInputs();
    hardenOnboarding();
  });

  window.addEventListener('load', () => {
    formatCepInputs();
    hardenOnboarding();
    improveErrors();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();