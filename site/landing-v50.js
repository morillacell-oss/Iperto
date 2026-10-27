(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const icon=(name)=>{
    const p={
      phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 19h2"/>',
      tv:'<rect x="3" y="5" width="18" height="13" rx="2"/><path d="m9 2 3 3 3-3M8 21h8"/>',
      tool:'<path d="m14 6 4-4 4 4-4 4-4-4ZM3 21l9-9M5 12l7 7"/>',
      shirt:'<path d="m8 4-4 2-2 5 4 2v9h12v-9l4-2-2-5-4-2a4 4 0 0 1-8 0Z"/>',
      pizza:'<path d="M4 20 20 4M7 17l10-10M4 20l16-3-13-13L4 20Z"/><circle cx="11" cy="9" r="1"/><circle cx="13" cy="14" r="1"/>',
      food:'<path d="M6 2v8M3 2v5a3 3 0 0 0 6 0V2M6 10v12M16 2v20M16 2c4 2 4 8 0 10"/>',
      cart:'<path d="M3 4h2l2 11h10l3-8H6M9 20h.01M17 20h.01"/>',
      home:'<path d="m3 11 9-8 9 8v10H5V11Z"/><path d="M9 21v-6h6v6"/>',
      beauty:'<path d="M9 3h6M10 3v5l-3 4v9h10v-9l-3-4V3M7 14h10"/>',
      shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
      bars:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 15h4"/>',
      people:'<path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5M2 20a6 6 0 0 1 12 0M14 14a5 5 0 0 1 8 4"/>',
      userplus:'<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a7 7 0 0 1 14 0M18 8h5M20.5 5.5v5"/>',
      pin:'<path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
      store:'<path d="M4 10h16l-1.3-5H5.3L4 10Zm1 0v9h14v-9M8 19v-5h4v5"/>'
    }[name]||'';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  };
  const cats=[
    ['celulares','Celulares','phone'],['eletronicos','Eletrônicos','tv'],['ferramentas','Ferramentas','tool'],['roupas','Roupas','shirt'],['pizzarias','Pizzarias','pizza'],['restaurantes','Restaurantes','food'],['mercado','Mercado','cart'],['casa','Casa','home'],['beleza','Beleza','beauty']
  ];
  function landingMarkup(){return `<div class="public-landing">
    <section class="pl-hero reveal">
      <div class="pl-hero-copy">
        <span class="pl-kicker">Compra em grupo</span>
        <h1>Compre com outras pessoas.<br><span>Pague mais barato.</span></h1>
        <p class="pl-sub">Você entra em um grupo para comprar o mesmo produto. Quanto mais pessoas entram, o preço vai diminuindo por faixas.</p>
        <div class="pl-actions">
          <button class="pl-btn primary" data-pl-auth="buyer">${icon('pin')} Encontrar grupos perto de mim →</button>
          <button class="pl-btn secondary" data-pl-scroll="how">▶ &nbsp; Como funciona</button>
        </div>
        <div class="pl-trust"><span>${icon('shield')}Entrar não cobra</span><span>${icon('bars')}Meta visível</span><span>${icon('card')}Pagamento só depois</span></div>
      </div>
      <div class="pl-hero-product">
        <article class="pl-product-card">
          <div class="pl-product-media"><img src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=88" alt="Smartphone em compra coletiva"><span class="pl-heart">♡</span><span class="pl-hot">MAIS PROCURADO</span></div>
          <div class="pl-product-body"><h3>iPhone 15 128 GB</h3><p>Exemplo de grupo</p><div class="pl-merchant"><i>J</i><span>Loja parceira</span><b>● verificado</b></div><div class="pl-hero-price"><div><small>Preço normal</small><s>R$ 5.499,00</s></div><div><small>Preço no grupo</small><strong>R$ 4.299,00</strong></div></div><div class="pl-progress"><i></i></div><div class="pl-progress-copy"><b>18 de 25 pessoas</b><span>Faltam 7 para liberar<br>o próximo preço</span></div></div>
        </article>
      </div>
    </section>

    <section class="pl-section" id="plCategories">
      <div class="pl-row-head"><div><h2>O que você quer pagar menos?</h2></div><button class="pl-link" data-pl-view="offers">Ver todas as categorias →</button></div>
      <div class="pl-categories">${cats.map(([key,label,ico])=>`<button class="pl-cat" data-pl-category="${key}">${icon(ico)}<span>${label}</span></button>`).join('')}</div>
    </section>

    <section class="pl-section" id="plOffers">
      <div class="pl-row-head"><div><h2>Grupos abertos agora</h2><p>Produtos de comércios da sua região. Entre e ajude o grupo a liberar um preço melhor.</p></div><button class="pl-link" data-pl-view="offers">Ver mais ofertas →</button></div>
      <div id="homeOffers"><div class="offer-skeleton"></div><div class="offer-skeleton"></div></div>
    </section>

    <section class="pl-section" id="plHow">
      <div class="pl-row-head"><div><span class="pl-kicker">Como funciona</span><h2 style="margin-top:10px">Como o Junta funciona</h2><p>É simples, transparente e todo mundo acompanha a mesma meta.</p></div></div>
      <div class="pl-how-grid">
        <article class="pl-how-card reveal"><div class="pl-step-top"><span class="pl-step-num">1</span><span class="pl-how-icon">${icon('userplus')}</span></div><h3>Você entra no grupo</h3><p>Escolhe um produto e entra no grupo sem pagar nada agora.</p></article>
        <article class="pl-how-card reveal"><div class="pl-step-top"><span class="pl-step-num">2</span><span class="pl-how-icon">${icon('people')}</span></div><h3>Mais pessoas entram</h3><p>Quanto mais pessoas entram, maior fica o pedido coletivo.</p></article>
        <article class="pl-how-card reveal"><div class="pl-step-top"><span class="pl-step-num">3</span><span class="pl-how-icon">${icon('bars')}</span></div><h3>O preço baixa por faixa</h3><p>Cada quantidade pode destravar uma faixa de preço melhor para o grupo.</p></article>
        <article class="pl-how-card reveal"><div class="pl-step-top"><span class="pl-step-num">4</span><span class="pl-how-icon">${icon('card')}</span></div><h3>Quando libera, você compra</h3><p>Atingiu a meta? O grupo é avisado e a compra abre com o preço liberado.</p></article>
      </div>
      <div class="pl-tier-example reveal">
        <div class="pl-tier-product"><img src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=300&q=82" alt="iPhone"><div><b>Exemplo de como o preço vai baixando</b><small>iPhone 15 128 GB</small><s>Preço normal R$ 5.499,00</s></div></div>
        <div class="pl-tier-line"><div class="pl-tier-point"><small>5 pessoas</small><b>R$ 5.099</b><em>-7%</em></div><div class="pl-tier-point"><small>10 pessoas</small><b>R$ 4.799</b><em>-13%</em></div><div class="pl-tier-point"><small>15 pessoas</small><b>R$ 4.499</b><em>-18%</em></div><div class="pl-tier-point"><small>20 pessoas</small><b>R$ 4.299</b><em>-22%</em></div><div class="pl-tier-point"><small>25 pessoas</small><b>R$ 3.999</b><em>-27%</em></div></div>
      </div>
    </section>

    <section class="pl-section">
      <div class="pl-seller">
        <div><span class="pl-kicker">Para empresas</span><h2 class="pl-title">Para quem vende</h2><p class="pl-sub">O Junta também é para o seu negócio. Crie ofertas em grupo, atraia mais clientes e transforme desconto em volume de vendas.</p><div class="pl-checks"><span><i>✓</i>Cadastre produtos e defina as faixas de preço</span><span><i>✓</i>Escolha as categorias do seu negócio</span><span><i>✓</i>Acompanhe o interesse em tempo real</span><span><i>✓</i>Depois da meta, os clientes compram e retiram na loja</span></div><button class="pl-btn primary" data-pl-auth="seller">Quero vender no Junta →</button></div>
        <div class="pl-dashboard reveal"><aside class="pl-dash-side"><div class="pl-dash-brand">◉ JUNTA</div><span class="active">Painel</span><span>Meus produtos</span><span>Grupos ativos</span><span>Pedidos</span><span>Estatísticas</span><span>Configurações</span></aside><div class="pl-dash-main"><div class="pl-dash-head"><b>Visão geral</b><small>Exemplo visual do painel</small></div><div class="pl-dash-kpis"><article><strong>324</strong><span>Pessoas interessadas</span><em>+28%</em></article><article><strong>12</strong><span>Ofertas ativas</span><em>+3</em></article><article><strong>R$ 8,4 mil</strong><span>Potencial</span><em>+41%</em></article></div><div class="pl-dash-chart"><b style="font-size:10px">Interesse nas ofertas</b><div class="pl-bars"><i style="--h:20%"></i><i style="--h:33%"></i><i style="--h:28%"></i><i style="--h:46%"></i><i style="--h:59%"></i><i style="--h:76%"></i><i style="--h:91%"></i></div></div></div></div>
      </div>
    </section>

    <section class="pl-section">
      <div class="pl-row-head"><div><h2>Mais segurança para você comprar em grupo</h2></div></div>
      <div class="pl-security"><article><i>${icon('shield')}</i><div><b>Você entra sem pagar</b><p>Entre nos grupos primeiro. O pagamento só acontece quando a compra abrir.</p></div></article><article><i>${icon('card')}</i><div><b>Pagamento só quando abre</b><p>Se a faixa for liberada, você é avisado e paga pelo parceiro de pagamento.</p></div></article><article><i>${icon('pin')}</i><div><b>Ofertas perto da sua região</b><p>Use seu CEP para encontrar grupos e comércios próximos.</p></div></article><article><i>${icon('store')}</i><div><b>Retirada simples no comércio</b><p>Depois do pagamento, é só retirar diretamente no estabelecimento.</p></div></article></div>
    </section>

    <section class="pl-final reveal"><div><h2>Junte gente.<br>Destrave preço.</h2><p>Entre em grupos de compra e transforme várias compras pequenas em um pedido grande.</p></div><div class="pl-final-actions"><button class="pl-btn primary" data-pl-auth="buyer">Criar conta →</button><button class="pl-btn secondary" data-pl-login>Entrar</button></div></section>
    <footer class="pl-footer"><div class="pl-footer-brand"><span class="pl-mini-mark"></span>JUNTA</div><div class="pl-footer-links"><button data-pl-scroll="how">Como funciona</button><button data-pl-auth="seller">Para empresas</button><button data-pl-view="offers">Ofertas</button><button data-pl-login>Entrar</button></div><div class="pl-footer-note">Junte pessoas.<br>Destrave possibilidades.</div></footer>
  </div>`}

  function replaceLanding(){
    const host=$('[data-view="home"] .home-shell');if(!host)return;
    host.innerHTML=landingMarkup();
    const topAccount=$('.account-pill');if(topAccount){topAccount.removeAttribute('data-nav');topAccount.onclick=()=>openAuth('login')}
    try{
      render=function(){
        const list=filtered();
        const home=$('#homeOffers'),all=$('#allOffers');
        if(home)home.innerHTML=(list.filter(o=>o.featured).length?list.filter(o=>o.featured).slice(0,5):list.slice(0,5)).map(offerCard).join('')||emptyState();
        if(all)all.innerHTML=list.map(offerCard).join('')||emptyState();
        bindCards();
      };
      render();
    }catch(e){console.warn('landing render waiting',e)}
    bindLanding();
    if(typeof initReveal==='function')setTimeout(initReveal,50);
  }
  function openAuth(mode='signup',role='buyer'){
    const accountNav=$('.bottom-nav [data-nav="account"]')||$('[data-nav="account"]');
    if(!accountNav)return;
    accountNav.click();
    setTimeout(()=>{
      const tab=$(`[data-j42-authmode="${mode}"]`);if(tab)tab.click();
      if(mode==='signup')setTimeout(()=>{$(`[data-j42-role="${role}"]`)?.click()},40);
    },80);
  }
  function openView(view){const btn=$(`.bottom-nav [data-nav="${view}"]`)||$(`[data-nav="${view}"]`);if(btn)btn.click();else if(typeof navigate==='function')navigate(view)}
  function bindLanding(){
    $$('[data-pl-auth]').forEach(b=>b.onclick=()=>openAuth('signup',b.dataset.plAuth));
    $$('[data-pl-login]').forEach(b=>b.onclick=()=>openAuth('login'));
    $$('[data-pl-view]').forEach(b=>b.onclick=()=>openView(b.dataset.plView));
    $$('[data-pl-scroll]').forEach(b=>b.onclick=()=>document.getElementById(`pl${b.dataset.plScroll[0].toUpperCase()+b.dataset.plScroll.slice(1)}`)?.scrollIntoView({behavior:'smooth',block:'start'}));
    $$('[data-pl-category]').forEach(b=>b.onclick=()=>{
      try{activeCategory=b.dataset.plCategory;$$('[data-pl-category]').forEach(x=>x.classList.toggle('active',x===b));render();$('#plOffers')?.scrollIntoView({behavior:'smooth',block:'start'})}catch{}
    });
  }
  window.addEventListener('load',()=>setTimeout(replaceLanding,120));
})();