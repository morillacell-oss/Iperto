(() => {
  'use strict';

  const SB_URL = 'https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY = 'sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  if (!window.supabase) return;
  const db = window.supabase.createClient(SB_URL, SB_KEY);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const bottomNav = $('#bottomNav');
  const overlay = $('#overlay');
  const toastEl = $('#toast');
  const avatarContent = $('#avatarContent');

  const state = {
    session: null,
    profile: null,
    business: null,
    role: 'guest',
    route: 'public',
    publicOffers: [],
    buyerOffers: [],
    buyerWaitlist: [],
    sellerOffers: [],
    sellerEvents: [],
    sellerLoadedAt: 0,
    buyerLoadedAt: 0,
    adminData: null,
    onboarding: { step: 1, name: '', businessType: '', categories: [], cep: '', location: null, logoFile: null },
  };

  const CATEGORIES = [
    ['celulares','Celulares'],['eletronicos','Eletrônicos'],['ferramentas','Ferramentas'],['roupas','Roupas'],
    ['calcados','Calçados'],['restaurantes','Restaurantes'],['pizzarias','Pizzarias'],['lanches','Lanches'],
    ['mercado','Mercado'],['casa','Casa'],['beleza','Beleza'],['pet','Pet'],['automotivo','Automotivo']
  ];

  const icon = (name) => {
    const paths = {
      home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z"/>',
      bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
      users:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9"/>',
      user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',
      pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      plus:'<path d="M12 5v14M5 12h14"/>',
      eye:'<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
      chart:'<path d="M4 19V9m6 10V5m6 14v-7m4 7V3"/>',
      store:'<path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9M8 19v-5h5v5"/>',
      close:'<path d="M6 6l12 12M18 6 6 18"/>',
      edit:'<path d="m4 20 4-1 10-10-3-3L5 16l-1 4Z"/>',
      check:'<path d="m5 12 4 4L19 6"/>',
      clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.bolt}</svg>`;
  };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const pct = (a,b) => b ? Math.min(100, Math.round(Number(a || 0) / Number(b) * 100)) : 0;
  const statsOf = (o) => Array.isArray(o?.offer_stats) ? (o.offer_stats[0] || {}) : (o?.offer_stats || {});
  const tiersOf = (o) => [...(o?.offer_price_tiers || [])].sort((a,b) => Number(a.people_count) - Number(b.people_count));
  const statusLabel = (s) => ({pending:'Em análise',scheduled:'Programada',open:'Aberta',closed:'Encerrada',sold_out:'Esgotada',draft:'Rascunho',cancelled:'Cancelada'})[s] || s || '—';
  const initials = (name) => {
    const p = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!p.length) return 'J';
    if (p.length === 1) return p[0][0].toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };
  const slugify = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50);
  const timeout = (promise, ms = 5500, message = 'A conexão demorou demais. Tente novamente.') => Promise.race([
    promise,
    new Promise((_,reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);

  function toast(message) {
    toastEl.textContent = String(message || '');
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  function openOverlay(html) {
    overlay.innerHTML = html;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    const close = () => closeOverlay();
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    $$('[data-close]', overlay).forEach(b => b.onclick = close);
  }

  function closeOverlay() {
    overlay.hidden = true;
    overlay.innerHTML = '';
    document.body.style.overflow = '';
  }

  function setAvatar() {
    if (state.role === 'seller' && state.business?.logo_url) {
      avatarContent.innerHTML = `<img src="${esc(state.business.logo_url)}" alt="${esc(state.business.name || 'Empresa')}">`;
      return;
    }
    const name = state.profile?.display_name || state.session?.user?.user_metadata?.display_name || '';
    avatarContent.textContent = state.role === 'guest' ? 'J' : initials(name || state.business?.name);
  }

  function track(event_type, offer) {
    const payload = {
      session_id: getSessionId(),
      user_id: state.session?.user?.id || null,
      event_type,
      offer_id: offer?.id || null,
      business_id: offer?.business_id || offer?.businesses?.id || null,
      metadata: { route: state.route }
    };
    db.from('analytics_events').insert(payload).then(({error}) => { if (error) console.warn('analytics', error.message); });
  }

  function getSessionId() {
    let id = sessionStorage.getItem('junta_session_id');
    if (!id) { id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; sessionStorage.setItem('junta_session_id', id); }
    return id;
  }

  function navItem(key, label, ico) {
    return `<button data-route="${key}" class="${state.route === key ? 'active' : ''}">${icon(ico)}<span>${label}</span></button>`;
  }

  function renderBottomNav() {
    if (state.role === 'guest') { bottomNav.hidden = true; bottomNav.innerHTML = ''; return; }
    bottomNav.hidden = false;
    if (state.role === 'seller') {
      bottomNav.innerHTML = navItem('seller-dashboard','Painel','home') + navItem('seller-offers','Ofertas','bag') + navItem('seller-groups','Grupos','users') + navItem('account','Conta','user');
    } else if (state.role === 'master' || state.role === 'admin') {
      bottomNav.innerHTML = navItem('admin','Painel','chart') + navItem('admin-offers','Ofertas','bag') + navItem('admin-businesses','Empresas','store') + navItem('account','Conta','user');
    } else {
      bottomNav.innerHTML = navItem('buyer-home','Início','home') + navItem('buyer-groups','Meus grupos','users') + navItem('buyer-explore','Explorar','search') + navItem('account','Conta','user');
    }
    $$('[data-route]', bottomNav).forEach(b => b.onclick = () => navigate(b.dataset.route));
  }

  function navigate(route, options = {}) {
    state.route = route;
    renderBottomNav();
    if (!options.keepScroll) window.scrollTo({top:0, behavior:'instant'});
    if (route === 'public') return renderPublic();
    if (route === 'seller-dashboard') return renderSeller('dashboard');
    if (route === 'seller-offers') return renderSeller('offers');
    if (route === 'seller-groups') return renderSeller('groups');
    if (route === 'buyer-home') return renderBuyer('home');
    if (route === 'buyer-groups') return renderBuyer('groups');
    if (route === 'buyer-explore') return renderBuyer('explore');
    if (route === 'account') return renderAccount();
    if (route.startsWith('admin')) return renderAdmin(route);
  }

  async function loadProfileAndBusiness() {
    const session = state.session;
    if (!session) return;
    const metaRole = session.user.user_metadata?.account_type === 'seller' ? 'seller' : 'buyer';
    let profile = null;
    try {
      const r = await timeout(db.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle(), 4000);
      if (r.error) throw r.error;
      profile = r.data;
    } catch (e) {
      console.warn('profile', e.message);
      profile = { user_id: session.user.id, display_name: session.user.user_metadata?.display_name || '', role: metaRole };
    }
    state.profile = profile;
    state.role = profile?.role || metaRole;
    localStorage.setItem('junta_role_cache', state.role);
    localStorage.setItem('junta_name_cache', profile?.display_name || '');
    document.body.dataset.role = state.role;

    if (state.role === 'seller') {
      try {
        const r = await timeout(db.from('businesses').select('*').eq('owner_id', session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(), 4500);
        if (r.error) throw r.error;
        state.business = r.data;
      } catch (e) { console.warn('business', e.message); }
    }
    setAvatar();
  }

  async function boot() {
    const cachedRole = localStorage.getItem('junta_role_cache');
    if (cachedRole === 'seller') renderSellerBoot();
    else if (cachedRole === 'buyer') renderBuyerBoot();
    else renderPublicShell();

    try {
      const { data:{session}, error } = await timeout(db.auth.getSession(), 3500, 'Sessão demorou para carregar.');
      if (error) throw error;
      state.session = session;
      if (!session) {
        state.profile = null; state.business = null; state.role = 'guest';
        localStorage.removeItem('junta_role_cache'); localStorage.removeItem('junta_name_cache');
        setAvatar(); renderBottomNav(); renderPublic(); return;
      }
      await loadProfileAndBusiness();
      setAvatar();
      if (state.role === 'seller') {
        if (!state.business?.onboarding_complete) return renderSellerOnboarding();
        return navigate('seller-dashboard');
      }
      if (state.role === 'master' || state.role === 'admin') return navigate('admin');
      return navigate('buyer-home');
    } catch (e) {
      console.error('boot', e);
      toast(e.message || 'Não conseguimos iniciar o Junta.');
      if (cachedRole === 'seller') renderSellerBoot(true); else renderPublic();
    }
  }

  function renderPublicShell() {
    state.route = 'public';
    app.innerHTML = `<div class="j-shell j-view"><section class="j-hero"><div><span class="j-kicker"><i></i> COMPRA EM GRUPO</span><h1>Compre com outras pessoas.<br><span>Pague mais barato.</span></h1><p class="j-lead">Você entra em um grupo para comprar o mesmo produto. Quanto mais pessoas entram, o preço vai diminuindo por faixas.</p></div><div class="j-hero-card"><div class="j-skeleton" style="min-height:360px"></div></div></section></div>`;
  }

  function renderPublic() {
    state.route = 'public'; renderBottomNav();
    app.innerHTML = `<div class="j-view">
      <div class="j-shell">
        <section class="j-hero">
          <div><span class="j-kicker"><i></i> COMPRA EM GRUPO</span><h1>Compre com outras pessoas.<br><span>Pague mais barato.</span></h1><p class="j-lead">Você entra em um grupo para comprar o mesmo produto. Quanto mais pessoas entram, o preço vai diminuindo por faixas.</p><div class="j-actions"><button class="j-btn primary" id="findGroups">Encontrar grupos perto de mim</button><button class="j-btn secondary" id="howBtn">Como funciona</button></div><div class="j-proof"><span>ENTRAR NÃO COBRA</span><span>META VISÍVEL</span><span>PAGAMENTO SÓ DEPOIS</span></div></div>
          <div id="publicHeroCard" class="j-hero-card"><div class="j-skeleton" style="min-height:360px"></div></div>
        </section>
        <section class="j-section"><div class="j-section-head"><div><span class="j-kicker">CATEGORIAS</span><h2>O que você quer pagar menos?</h2></div></div><div class="j-categories">${CATEGORIES.slice(0,9).map(c=>`<button class="j-cat" data-public-cat="${c[0]}">${c[1]}</button>`).join('')}</div></section>
        <section class="j-section" id="publicOffersSection"><div class="j-section-head"><div><span class="j-kicker">GRUPOS REAIS</span><h2>Grupos abertos agora</h2><p>Ofertas publicadas por comércios no Junta.</p></div></div><div class="j-grid" id="publicOffers"><div class="j-skeleton"></div><div class="j-skeleton"></div><div class="j-skeleton"></div></div></section>
        <section class="j-section" id="how"><div class="j-section-head"><div><span class="j-kicker">COMO FUNCIONA</span><h2>Simples para quem compra.</h2></div></div><div class="j-how"><article><b>01</b><h3>Você entra no grupo</h3><p>Sem pagar nada neste momento.</p></article><article><b>02</b><h3>Mais pessoas entram</h3><p>O grupo cresce e aproxima a próxima faixa.</p></article><article><b>03</b><h3>O preço baixa</h3><p>As faixas ficam visíveis para todo mundo.</p></article><article><b>04</b><h3>Você compra</h3><p>Quando a compra abre, o pagamento é feito com segurança.</p></article></div></section>
        <section class="j-section"><div class="j-seller-banner"><div><span class="j-kicker">PARA EMPRESAS</span><h2>Venda mais formando grupos.</h2><p>Crie ofertas, acompanhe interesse real, veja conversão e use reduções de preço para acelerar seus grupos.</p></div><button class="j-btn primary" id="sellCta">Quero vender no Junta</button></div></section>
        <footer class="j-footer"><b>JUNTA</b><p>Compre junto. Pague menos.</p></footer>
      </div>
    </div>`;
    $('#findGroups').onclick = () => openAuth('buyer');
    $('#sellCta').onclick = () => openAuth('seller');
    $('#howBtn').onclick = () => $('#how').scrollIntoView({behavior:'smooth'});
    $$('[data-public-cat]').forEach(b => b.onclick = () => { $('#publicOffersSection').scrollIntoView({behavior:'smooth'}); renderPublicOffers(b.dataset.publicCat); });
    loadPublicOffers();
  }

  async function loadPublicOffers() {
    try {
      const {data, error} = await timeout(db.from('offers').select('id,business_id,title,category,image_url,regular_price,junta_price,status,queue_target,price_flash_until,price_flash_message,offer_stats(waitlist_count,view_count),offer_price_tiers(people_count,unit_price),businesses!inner(id,name,logo_url,city,state,neighborhood,status,verified)').eq('is_demo',false).in('status',['scheduled','open']).eq('businesses.status','approved').order('created_at',{ascending:false}).limit(12), 5000);
      if (error) throw error;
      state.publicOffers = data || [];
    } catch (e) {
      console.warn('public offers', e.message);
      state.publicOffers = [];
    }
    renderPublicOffers();
  }

  function renderPublicOffers(category = '') {
    const rows = category ? state.publicOffers.filter(o => o.category === category) : state.publicOffers;
    const grid = $('#publicOffers'); if (!grid) return;
    grid.innerHTML = rows.length ? rows.map(offerCard).join('') : `<div class="j-empty" style="grid-column:1/-1"><h3>No momento não há ofertas${category ? ' nesta categoria' : ''}.</h3><p>Volte em breve.</p></div>`;
    $$('[data-offer]', grid).forEach(b => b.onclick = () => openPublicOffer(rows.find(o => o.id === b.dataset.offer)));
    const hero = $('#publicHeroCard');
    if (hero) hero.innerHTML = rows[0] ? heroCard(rows[0]) : `<div class="j-empty" style="min-height:330px;display:grid;place-items:center"><div><h3>Os primeiros grupos reais aparecerão aqui.</h3><p>Sem anúncios fingindo ser parceiros.</p></div></div>`;
  }

  function businessOf(o) { return Array.isArray(o?.businesses) ? o.businesses[0] : (o?.businesses || {}); }

  function heroCard(o) {
    const s=statsOf(o), w=Number(s.waitlist_count||0), target=Number(o.queue_target||25), p=pct(w,target), b=businessOf(o);
    return `<div class="j-product-media">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}<span class="j-badge">${w} de ${target} pessoas</span></div><div class="j-card-body"><small>${esc(b.name||'Comércio verificado')}</small><h3>${esc(o.title)}</h3><div class="j-price-row"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div><div class="j-progress" style="margin-top:14px"><i style="width:${p}%"></i></div><div class="j-progress-meta"><span>${w} pessoas no grupo</span><b>faltam ${Math.max(0,target-w)}</b></div></div>`;
  }

  function offerCard(o) {
    const s=statsOf(o), w=Number(s.waitlist_count||0), target=Number(o.queue_target||25), p=pct(w,target), b=businessOf(o);
    return `<button class="j-offer" data-offer="${o.id}"><div class="j-offer-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}</div><div class="j-offer-body"><div class="j-offer-store">${esc(b.name||'Junta')}</div><h3>${esc(o.title)}</h3><div class="j-offer-prices"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div><div class="j-progress"><i style="width:${p}%"></i></div><div class="j-progress-meta"><span>${w}/${target}</span><span>${Math.max(0,target-w)} para a meta</span></div></div></button>`;
  }

  function openPublicOffer(o) {
    if (!o) return;
    track('offer_open', o);
    openOfferModal(o, false);
  }

  function openAuth(defaultRole = 'buyer') {
    let mode = 'login'; let role = defaultRole;
    const paint = () => {
      openOverlay(`<div class="j-modal"><div class="j-modal-head"><div><span class="j-kicker">${mode==='login'?'ENTRAR':'CRIAR CONTA'}</span><h2>${mode==='login'?'Bem-vindo de volta.':'Entre para o Junta.'}</h2></div><button class="j-close" data-close>×</button></div>
        ${mode==='signup'?`<div class="j-role-switch"><button data-role="buyer" class="${role==='buyer'?'active':''}">Quero comprar</button><button data-role="seller" class="${role==='seller'?'active':''}">Quero vender</button></div>`:''}
        <form class="j-form" id="authForm">${mode==='signup'?`<label>Seu nome<input name="name" required autocomplete="name" placeholder="Ex.: Luan Silva"></label>`:''}<label>E-mail<input name="email" type="email" required autocomplete="email"></label><label>Senha<input name="password" type="password" minlength="6" required autocomplete="${mode==='login'?'current-password':'new-password'}"></label><button class="j-btn primary" type="submit">${mode==='login'?'Entrar':'Criar conta'}</button><button class="j-btn secondary" type="button" id="switchAuth">${mode==='login'?'Ainda não tenho conta':'Já tenho conta'}</button></form></div>`);
      $$('[data-role]', overlay).forEach(b=>b.onclick=()=>{role=b.dataset.role;paint();});
      $('#switchAuth',overlay).onclick=()=>{mode=mode==='login'?'signup':'login';paint();};
      $('#authForm',overlay).onsubmit=async(e)=>{
        e.preventDefault(); const form=e.currentTarget, btn=$('button[type="submit"]',form); btn.disabled=true; btn.textContent='Entrando...';
        try{
          const fd=new FormData(form), email=String(fd.get('email')).trim(), password=String(fd.get('password'));
          if(mode==='login'){
            const {data,error}=await db.auth.signInWithPassword({email,password}); if(error)throw error; state.session=data.session;
          } else {
            btn.textContent='Criando conta...'; const name=String(fd.get('name')).trim();
            const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:name,account_type:role}}}); if(error)throw error; state.session=data.session;
            if(!data.session){toast('Conta criada. Confira seu e-mail para entrar.');closeOverlay();return;}
          }
          closeOverlay(); await loadProfileAndBusiness(); setAvatar();
          if(state.role==='seller'){ if(!state.business?.onboarding_complete) renderSellerOnboarding(); else navigate('seller-dashboard'); }
          else if(state.role==='master'||state.role==='admin') navigate('admin'); else navigate('buyer-home');
        }catch(err){toast(err.message||'Não foi possível continuar.');btn.disabled=false;btn.textContent=mode==='login'?'Entrar':'Criar conta';}
      };
    };
    paint();
  }

  function renderSellerBoot(error=false) {
    state.role='seller'; state.route='seller-dashboard'; renderBottomNav();
    const name=localStorage.getItem('junta_name_cache')||'Sua empresa';
    app.innerHTML=`<div class="j-shell j-app-shell"><section class="j-business-hero"><div class="j-business-info"><div class="j-business-logo">${initials(name)}</div><div><span class="j-kicker">JUNTA EMPRESAS</span><h1>${esc(name)}</h1><p>${error?'Reconectando...':'Carregando dados reais...'}</p></div></div></section><div class="j-metrics" style="margin-top:14px"><div class="j-skeleton"></div><div class="j-skeleton"></div><div class="j-skeleton"></div><div class="j-skeleton"></div></div></div>`;
  }

  function renderBuyerBoot(){state.role='buyer';state.route='buyer-home';renderBottomNav();app.innerHTML=`<div class="j-shell j-app-shell"><div class="j-buyer-header"><span class="j-kicker">JUNTA</span><h1>Carregando seus grupos...</h1></div><div class="j-skeleton"></div></div>`;}

  async function loadSellerData(force=false) {
    if (!state.business?.id) return;
    if (!force && state.sellerLoadedAt && Date.now()-state.sellerLoadedAt<12000) return;
    const since=new Date(Date.now()-7*86400000).toISOString();
    const [offersRes,eventsRes]=await timeout(Promise.all([
      db.from('offers').select('id,business_id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,min_sustainable_price,min_paid,max_units,queue_target,status,created_at,last_price_drop_at,price_flash_until,price_flash_message,offer_stats(waitlist_count,view_count,detail_click_count,join_click_count,paid_count,shares_count),offer_price_tiers(people_count,unit_price)').eq('business_id',state.business.id).eq('is_demo',false).order('created_at',{ascending:false}),
      db.from('analytics_events').select('event_type,offer_id,created_at').eq('business_id',state.business.id).gte('created_at',since).order('created_at',{ascending:true})
    ]),5500);
    if(offersRes.error)throw offersRes.error;
    state.sellerOffers=offersRes.data||[]; state.sellerEvents=eventsRes.data||[]; state.sellerLoadedAt=Date.now();
  }

  function sellerShell(tab, body='') {
    const b=state.business||{}, loc=[b.neighborhood,b.city,b.state].filter(Boolean).join(' · ');
    return `<div class="j-shell j-app-shell"><section class="j-business-hero"><div class="j-business-info"><div class="j-business-logo">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}">`:initials(b.name)}</div><div><span class="j-kicker">JUNTA EMPRESAS</span><h1>${esc(b.name||'Sua empresa')}</h1><p>${esc(loc||'Complete sua empresa')}</p></div></div><span class="j-live"><i></i>DADOS REAIS</span></section><nav class="j-tabbar"><button data-seller-tab="dashboard" class="${tab==='dashboard'?'active':''}">Painel</button><button data-seller-tab="offers" class="${tab==='offers'?'active':''}">Minhas ofertas</button><button data-seller-tab="groups" class="${tab==='groups'?'active':''}">Meus grupos</button><button data-new-offer>${icon('plus')} Nova oferta</button></nav><div id="sellerBody">${body}</div></div>`;
  }

  function bindSellerShell() {
    $$('[data-seller-tab]').forEach(b=>b.onclick=()=>navigate(`seller-${b.dataset.sellerTab==='dashboard'?'dashboard':b.dataset.sellerTab}`));
    $$('[data-new-offer]').forEach(b=>b.onclick=openCreateOffer);
  }

  function renderSeller(tab='dashboard') {
    if(state.role!=='seller')return;
    state.route=`seller-${tab}`;renderBottomNav();
    app.innerHTML=sellerShell(tab, `<div class="j-metrics"><div class="j-skeleton"></div><div class="j-skeleton"></div><div class="j-skeleton"></div><div class="j-skeleton"></div></div>`); bindSellerShell();
    const requestedRoute=state.route;
    loadSellerData().then(()=>{if(state.route!==requestedRoute)return;paintSeller(tab);setAvatar();}).catch(err=>{if(state.route!==requestedRoute)return;$('#sellerBody').innerHTML=`<div class="j-empty"><h3>Não conseguimos carregar seus dados.</h3><p>${esc(err.message)}</p><button class="j-btn primary" id="sellerRetry">Tentar novamente</button></div>`;$('#sellerRetry').onclick=()=>{state.sellerLoadedAt=0;renderSeller(tab);};});
  }

  function paintSeller(tab) {
    const root=$('#sellerBody'); if(!root)return; const rows=state.sellerOffers; const ss=rows.map(statsOf);
    const totals={views:ss.reduce((a,s)=>a+Number(s.view_count||0),0),details:ss.reduce((a,s)=>a+Number(s.detail_click_count||0),0),joins:ss.reduce((a,s)=>a+Number(s.join_click_count||0),0),interested:ss.reduce((a,s)=>a+Number(s.waitlist_count||0),0),active:rows.filter(o=>['scheduled','open'].includes(o.status)).length,pending:rows.filter(o=>o.status==='pending').length};
    if(tab==='dashboard') root.innerHTML=sellerDashboard(rows,totals);
    if(tab==='offers') root.innerHTML=sellerOffersView(rows);
    if(tab==='groups') root.innerHTML=sellerGroupsView(rows);
    $$('[data-seller-offer]',root).forEach(b=>b.onclick=()=>openSellerOffer(rows.find(o=>o.id===b.dataset.sellerOffer)));
    $$('[data-new-offer]',root).forEach(b=>b.onclick=openCreateOffer);
  }

  function sellerDashboard(rows,t){
    const conv=t.views?Math.round(t.interested/t.views*100):0;
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
    const counts=days.map(d=>{const n=new Date(d);n.setDate(n.getDate()+1);return state.sellerEvents.filter(e=>{const x=new Date(e.created_at);return x>=d&&x<n}).length});const max=Math.max(1,...counts);
    const best=[...rows].sort((a,b)=>Number(statsOf(b).waitlist_count||0)-Number(statsOf(a).waitlist_count||0)).slice(0,3);
    return `<div class="j-metrics"><article class="j-metric hot"><span>INTERESSADOS</span><strong>${t.interested}</strong><small>${t.joins} cliques em entrar</small></article><article class="j-metric"><span>VISUALIZAÇÕES</span><strong>${t.views}</strong><small>${t.details} abriram detalhes</small></article><article class="j-metric"><span>CONVERSÃO</span><strong>${conv}%</strong><small>view → interesse</small></article><article class="j-metric"><span>OFERTAS ATIVAS</span><strong>${t.active}</strong><small>${t.pending} em análise</small></article></div><div class="j-panel-grid"><section class="j-panel"><span class="j-kicker">ÚLTIMOS 7 DIAS</span><h2>Movimento da sua vitrine</h2><div class="j-chart">${counts.map((n,i)=>`<div class="j-chart-col"><i style="--h:${Math.max(7,Math.round(n/max*100))}%"></i><span>${['D','S','T','Q','Q','S','S'][days[i].getDay()]}</span></div>`).join('')}</div></section><section class="j-panel"><span class="j-kicker">AÇÃO</span><h2>${t.interested?'Seu grupo já tem tração.':'Crie movimento.'}</h2><p style="color:var(--muted);line-height:1.55">${t.interested?'Abra sua oferta e acompanhe as pessoas. Uma redução real de preço pode virar destaque por 48 horas.':'Crie uma oferta forte e acompanhe os primeiros interessados em tempo real.'}</p><button class="j-btn primary" data-new-offer>Nova oferta</button></section></div><section class="j-panel" style="margin-top:14px"><span class="j-kicker">DESTAQUES</span><h2>Grupos com mais interesse</h2>${best.length?`<div class="j-list">${best.map(sellerOfferRow).join('')}</div>`:`<div class="j-empty"><h3>Nenhuma oferta ainda.</h3></div>`}</section>`;
  }

  function sellerOffersView(rows){return `<section class="j-panel"><div class="j-section-head"><div><span class="j-kicker">MINHAS OFERTAS</span><h2>Abra, acompanhe e ajuste.</h2></div><button class="j-btn primary" data-new-offer>Nova oferta</button></div>${rows.length?`<div class="j-list">${rows.map(sellerOfferRow).join('')}</div>`:`<div class="j-empty"><h3>Nenhuma oferta.</h3><p>Crie sua primeira oferta para começar.</p></div>`}</section>`;}

  function sellerGroupsView(rows){const active=rows.filter(o=>['pending','scheduled','open'].includes(o.status));return `<section class="j-panel"><span class="j-kicker">MEUS GRUPOS</span><h2>Grupos em andamento</h2>${active.length?`<div class="j-list">${active.map(sellerOfferRow).join('')}</div>`:`<div class="j-empty"><h3>Nenhum grupo em andamento.</h3></div>`}</section>`;}

  function sellerOfferRow(o){const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target);return `<button class="j-list-item" data-seller-offer="${o.id}"><div class="j-list-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}</div><div class="j-list-main"><span class="j-status ${o.status==='pending'?'pending':''}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3><div class="j-progress"><i style="width:${p}%"></i></div><small>${w}/${target} pessoas · ${Number(s.view_count||0)} views</small></div><div class="j-list-price"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div></button>`;}

  function openSellerOffer(o){
    if(!o)return;const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),floor=Number(o.min_sustainable_price||0),current=Number(o.junta_price||0),ts=tiersOf(o),canLower=['pending','scheduled','open'].includes(o.status)&&current>floor;
    openOverlay(`<div class="j-modal" style="width:min(650px,100%)"><div class="j-modal-head"><div><span class="j-status ${o.status==='pending'?'pending':''}">${statusLabel(o.status)}</span><h2>${esc(o.title)}</h2></div><button class="j-close" data-close>×</button></div>${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}" style="width:100%;height:230px;object-fit:cover;border-radius:20px">`:''}<div class="j-metrics" style="margin:14px 0"><article class="j-metric"><span>INTERESSADOS</span><strong>${w}</strong></article><article class="j-metric"><span>VIEWS</span><strong>${Number(s.view_count||0)}</strong></article><article class="j-metric"><span>CLIQUES</span><strong>${Number(s.detail_click_count||0)}</strong></article><article class="j-metric"><span>PROGRESSO</span><strong>${pct(w,target)}%</strong></article></div><div class="j-progress"><i style="width:${pct(w,target)}%"></i></div><div class="j-progress-meta"><span>${w} de ${target} pessoas</span><span>faltam ${Math.max(0,target-w)}</span></div><section style="margin-top:18px"><span class="j-kicker">FAIXAS</span><div class="j-tiers" style="margin-top:10px">${ts.map(t=>`<div class="j-tier"><span>${t.people_count} pessoas</span><strong>${money(t.unit_price)}</strong></div>`).join('')}</div></section>${canLower?`<section class="j-price-action"><span class="j-kicker">AÇÃO COMERCIAL</span><h3>Baixar o preço agora</h3><p>A redução real pode virar destaque para compradores da sua região por 48 horas. O preço nunca pode passar abaixo do piso sustentável.</p><div class="j-price-field"><label>Novo menor preço</label><input id="lowerPriceInput" type="number" step="0.01" min="${floor}" max="${Math.max(floor,current-.01)}" value="${Math.max(floor,current-.10).toFixed(2)}"></div><div class="j-quickcuts"><button data-cut="3">-3%</button><button data-cut="5">-5%</button><button data-cut="10">-10%</button></div><div class="j-floor">Piso sustentável: <b>${money(floor)}</b></div><button class="j-btn primary" id="lowerPriceBtn">${icon('bolt')} Baixar preço</button></section>`:''}</div>`);
    if(canLower){const inp=$('#lowerPriceInput',overlay);$$('[data-cut]',overlay).forEach(b=>b.onclick=()=>{inp.value=Math.max(floor,current*(1-Number(b.dataset.cut)/100)).toFixed(2)});$('#lowerPriceBtn',overlay).onclick=async()=>{const n=Number(inp.value);if(!(n<current)||n<floor){toast('Use um preço menor que o atual e acima do piso.');return;}const btn=$('#lowerPriceBtn',overlay);btn.disabled=true;btn.textContent='Atualizando...';try{const {error}=await db.rpc('seller_lower_offer_prices',{p_offer_id:o.id,p_new_lowest:n});if(error)throw error;toast('Preço baixou! Destaque ativado ⚡');state.sellerLoadedAt=0;closeOverlay();renderSeller(state.route.endsWith('groups')?'groups':state.route.endsWith('offers')?'offers':'dashboard');}catch(err){toast(err.message||'Não foi possível baixar o preço.');btn.disabled=false;btn.innerHTML=`${icon('bolt')} Baixar preço`;}};}
  }

  function openCreateOffer(){
    if(!state.business?.id){toast('Complete o cadastro da empresa primeiro.');return;}
    const cats=CATEGORIES.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('');
    openOverlay(`<div class="j-modal" style="width:min(680px,100%)"><div class="j-modal-head"><div><span class="j-kicker">NOVA OFERTA</span><h2>Crie um grupo.</h2></div><button class="j-close" data-close>×</button></div><form class="j-form" id="createOfferForm"><label>Foto do produto<input name="image" type="file" accept="image/*" required></label><label>Produto<input name="title" required placeholder="Ex.: Smash duplo"></label><label>Descrição<textarea name="description" rows="3" placeholder="Explique o que está incluso"></textarea></label><label>Categoria<select name="category" required>${cats}</select></label><div class="j-form-row"><label>Preço normal<input name="regular" type="number" min="0.01" step="0.01" required></label><label>Piso sustentável<input name="floor" type="number" min="0.01" step="0.01" required></label></div><div class="j-form-row"><label>Estoque<input name="stock" type="number" min="25" value="25" required></label><label>Preço com 5 pessoas<input name="p5" type="number" step="0.01" required></label></div><div class="j-form-row"><label>Preço com 10<input name="p10" type="number" step="0.01" required></label><label>Preço com 15<input name="p15" type="number" step="0.01" required></label></div><div class="j-form-row"><label>Preço com 20<input name="p20" type="number" step="0.01" required></label><label>Preço com 25<input name="p25" type="number" step="0.01" required></label></div><button class="j-btn primary" type="submit">Enviar para análise</button></form></div>`);
    $('#createOfferForm',overlay).onsubmit=async(e)=>{e.preventDefault();const f=e.currentTarget,btn=$('button[type="submit"]',f),fd=new FormData(f);const regular=Number(fd.get('regular')),floor=Number(fd.get('floor')),prices=[5,10,15,20,25].map(n=>Number(fd.get(`p${n}`)));if(!(regular>prices[0]&&prices.every((v,i)=>v>0&&(i===0||v<prices[i-1]))&&prices[4]>=floor)){toast('Os preços precisam cair a cada faixa e respeitar o piso.');return;}btn.disabled=true;btn.textContent='Enviando...';try{const file=fd.get('image');let image_url='';if(file&&file.size){const safe=String(file.name||'foto.jpg').replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${state.session.user.id}/${Date.now()}-${safe}`;const up=await db.storage.from('offer-images').upload(path,file,{upsert:false});if(up.error)throw up.error;image_url=db.storage.from('offer-images').getPublicUrl(path).data.publicUrl;}const now=new Date(),close=new Date(now.getTime()+14*86400000);const {data:offer,error}=await db.from('offers').insert({business_id:state.business.id,created_by:state.session.user.id,title:String(fd.get('title')).trim(),description:String(fd.get('description')||''),category:String(fd.get('category')),image_url,regular_price:regular,junta_price:prices[4],min_sustainable_price:floor,min_paid:5,max_units:Number(fd.get('stock')),queue_target:25,opens_at:now.toISOString(),closes_at:close.toISOString(),status:'pending',featured:false,is_demo:false,demo_seed_count:0,price_review_status:'unreviewed'}).select('id').single();if(error)throw error;const tiers=[5,10,15,20,25].map((n,i)=>({offer_id:offer.id,people_count:n,unit_price:prices[i]}));const tr=await db.from('offer_price_tiers').insert(tiers);if(tr.error)throw tr.error;toast('Oferta enviada para análise.');state.sellerLoadedAt=0;closeOverlay();navigate('seller-offers');}catch(err){toast(err.message||'Não foi possível criar a oferta.');btn.disabled=false;btn.textContent='Enviar para análise';}};
  }

  function renderBuyer(tab='home'){
    if(state.role!=='buyer')return;state.route=tab==='home'?'buyer-home':tab==='groups'?'buyer-groups':'buyer-explore';renderBottomNav();
    const name=state.profile?.display_name||'Você';const region=[state.profile?.neighborhood,state.profile?.city,state.profile?.state].filter(Boolean).join(' · ');
    app.innerHTML=`<div class="j-shell j-app-shell"><div class="j-buyer-header"><span class="j-kicker">OLÁ, ${esc(name.split(' ')[0]||'')}</span><h1>${tab==='groups'?'Seus grupos.':tab==='explore'?'Explore sua região.':'O que vamos pagar menos hoje?'}</h1><p>${region?`Mostrando a região de ${esc(region)}.`:'Informe seu CEP para ver ofertas reais perto de você.'}</p></div>${tab==='home'?`<section class="j-region-card"><div><span class="j-kicker">SUA REGIÃO</span><h2>${region?esc(region):'CEP ainda não informado'}</h2><p>${region?'Ofertas reais aprovadas da sua cidade.':'Sem CEP, não vamos fingir que uma oferta é perto de você.'}</p></div><button class="j-btn primary" id="changeCep">${icon('pin')} ${region?'Alterar CEP':'Informar CEP'}</button></section>`:''}<div id="buyerBody" style="margin-top:16px"><div class="j-skeleton"></div></div></div>`;
    if($('#changeCep'))$('#changeCep').onclick=openCepModal;
    const requested=state.route;loadBuyerData().then(()=>{if(state.route!==requested)return;paintBuyer(tab);}).catch(err=>{if(state.route!==requested)return;$('#buyerBody').innerHTML=`<div class="j-empty"><h3>Não conseguimos carregar agora.</h3><p>${esc(err.message)}</p><button class="j-btn primary" id="buyerRetry">Tentar novamente</button></div>`;$('#buyerRetry').onclick=()=>{state.buyerLoadedAt=0;renderBuyer(tab)}});
  }

  async function loadBuyerData(force=false){
    if(!state.session)return;if(!force&&state.buyerLoadedAt&&Date.now()-state.buyerLoadedAt<10000)return;
    const city=state.profile?.city,stateCode=state.profile?.state;
    const wait=await db.from('offer_waitlist').select('offer_id,created_at').eq('user_id',state.session.user.id);
    state.buyerWaitlist=wait.data||[];
    if(!city){state.buyerOffers=[];state.buyerLoadedAt=Date.now();return;}
    const businesses=await timeout(db.from('businesses').select('id,name,logo_url,city,state,neighborhood,verified,status').eq('status','approved').ilike('city',city).ilike('state',stateCode||'%'),4500);
    if(businesses.error)throw businesses.error;const ids=(businesses.data||[]).map(b=>b.id);if(!ids.length){state.buyerOffers=[];state.buyerLoadedAt=Date.now();return;}
    const offers=await timeout(db.from('offers').select('id,business_id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,status,queue_target,price_flash_until,price_flash_message,offer_stats(waitlist_count,view_count),offer_price_tiers(people_count,unit_price)').in('business_id',ids).eq('is_demo',false).in('status',['scheduled','open']).order('price_flash_until',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}),5000);
    if(offers.error)throw offers.error;const map=Object.fromEntries((businesses.data||[]).map(b=>[b.id,b]));state.buyerOffers=(offers.data||[]).map(o=>({...o,businesses:map[o.business_id]}));state.buyerLoadedAt=Date.now();
  }

  function paintBuyer(tab){const root=$('#buyerBody');if(!root)return;const joined=new Set(state.buyerWaitlist.map(x=>x.offer_id));const offers=state.buyerOffers;
    if(tab==='groups'){const rows=offers.filter(o=>joined.has(o.id));root.innerHTML=rows.length?`<div class="j-grid">${rows.map(o=>buyerOfferCard(o,true)).join('')}</div>`:`<div class="j-empty"><h3>Você ainda não entrou em nenhum grupo.</h3><p>Explore ofertas da sua região e participe.</p></div>`;}
    else {const flash=offers.filter(o=>o.price_flash_until&&new Date(o.price_flash_until)>new Date());root.innerHTML=`${flash.length?flash.map(flashCard).join(''):''}${offers.length?`<div class="j-grid">${offers.map(o=>buyerOfferCard(o,joined.has(o.id))).join('')}</div>`:`<div class="j-empty"><h3>No momento não há ofertas na sua região.</h3><p>Volte em breve.</p></div>`}`;}
    $$('[data-buyer-offer]',root).forEach(b=>b.onclick=()=>openBuyerOffer(offers.find(o=>o.id===b.dataset.buyerOffer)));
  }

  function buyerOfferCard(o,joined){const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target),b=businessOf(o);return `<button class="j-offer" data-buyer-offer="${o.id}"><div class="j-offer-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}${joined?'<span class="j-badge">VOCÊ ESTÁ NO GRUPO</span>':''}</div><div class="j-offer-body"><div class="j-offer-store">${esc(b.name||'Comércio')}</div><h3>${esc(o.title)}</h3><div class="j-offer-prices"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div><div class="j-progress"><i style="width:${p}%"></i></div><div class="j-progress-meta"><span>${w}/${target}</span><span>${Math.max(0,target-w)} para a meta</span></div></div></button>`;}
  function flashCard(o){const b=businessOf(o);return `<div class="j-flash"><span class="j-kicker" style="background:rgba(255,255,255,.18);color:#fff">⚡ OFERTA NA SUA REGIÃO</span><h2>${esc(o.price_flash_message||'OFERTAAAAA! Corre e se junta.')}</h2><p>${esc(o.title)} · ${esc(b.name||'Comércio')}</p><div class="j-price-row" style="margin-top:12px"><s style="color:#ffd2ce">${money(o.previous_junta_price||o.regular_price)}</s><strong style="color:#fff">${money(o.junta_price)}</strong></div></div>`;}
  function openBuyerOffer(o){if(!o)return;track('offer_open',o);openOfferModal(o,true);}

  function openOfferModal(o,allowJoin){const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),ts=tiersOf(o),b=businessOf(o),joined=state.buyerWaitlist.some(x=>x.offer_id===o.id);openOverlay(`<div class="j-modal"><div class="j-modal-head"><div><span class="j-kicker">${esc(b.name||'JUNTA')}</span><h2>${esc(o.title)}</h2></div><button class="j-close" data-close>×</button></div>${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}" style="width:100%;height:220px;object-fit:cover;border-radius:20px">`:''}<div class="j-price-row" style="margin:16px 0"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div><div class="j-progress"><i style="width:${pct(w,target)}%"></i></div><div class="j-progress-meta"><span>${w} de ${target} pessoas</span><span>faltam ${Math.max(0,target-w)}</span></div>${ts.length?`<div class="j-tiers" style="margin-top:16px">${ts.map(t=>`<div class="j-tier"><span>${t.people_count} pessoas</span><strong>${money(t.unit_price)}</strong></div>`).join('')}</div>`:''}${allowJoin?`<button class="j-btn primary" id="joinOfferBtn" style="width:100%;margin-top:16px" ${joined?'disabled':''}>${joined?'Você já está no grupo':'Entrar no grupo'}</button>`:`<button class="j-btn primary" id="authJoinBtn" style="width:100%;margin-top:16px">Entrar para participar</button>`}</div>`);if(allowJoin&&!joined){$('#joinOfferBtn',overlay).onclick=()=>joinOffer(o);}if(!allowJoin){$('#authJoinBtn',overlay).onclick=()=>{closeOverlay();openAuth('buyer');};}}

  async function joinOffer(o){const btn=$('#joinOfferBtn',overlay);btn.disabled=true;btn.textContent='Entrando...';try{track('join_intent',o);const {error}=await db.from('offer_waitlist').insert({offer_id:o.id,user_id:state.session.user.id});if(error&&error.code!=='23505')throw error;toast('Você entrou no grupo!');state.buyerLoadedAt=0;closeOverlay();renderBuyer(state.route==='buyer-groups'?'groups':state.route==='buyer-explore'?'explore':'home');}catch(err){toast(err.message||'Não foi possível entrar.');btn.disabled=false;btn.textContent='Entrar no grupo';}}

  function openCepModal(){openOverlay(`<div class="j-modal"><div class="j-modal-head"><div><span class="j-kicker">SUA REGIÃO</span><h2>Qual é o seu CEP?</h2></div><button class="j-close" data-close>×</button></div><form class="j-form" id="cepForm"><label>CEP<input name="cep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="${esc(state.profile?.postal_code||'')}" required></label><div id="cepResult"></div><button class="j-btn primary" type="submit">Buscar ofertas</button></form></div>`);const input=$('input[name="cep"]',overlay);input.oninput=()=>{let v=input.value.replace(/\D/g,'').slice(0,8);input.value=v.length>5?`${v.slice(0,5)}-${v.slice(5)}`:v;};$('#cepForm',overlay).onsubmit=async(e)=>{e.preventDefault();const btn=$('button[type="submit"]',e.currentTarget);btn.disabled=true;btn.textContent='Consultando...';try{const cep=input.value.replace(/\D/g,'');const r=await timeout(fetch(`${SB_URL}/functions/v1/lookup-cep?cep=${cep}`,{headers:{apikey:SB_KEY}}),6000);const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||'CEP não encontrado');const up=await db.from('profiles').update({postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''}).eq('user_id',state.session.user.id);if(up.error)throw up.error;state.profile={...state.profile,postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''};state.buyerLoadedAt=0;closeOverlay();toast(`${d.localidade}/${d.uf} encontrada.`);renderBuyer('home');}catch(err){toast(err.message||'Não conseguimos consultar esse CEP.');btn.disabled=false;btn.textContent='Buscar ofertas';}};}

  function renderAccount(){state.route='account';renderBottomNav();const seller=state.role==='seller',b=state.business,p=state.profile||{},name=seller?(b?.name||p.display_name):(p.display_name||'Sua conta'),location=[seller?b?.neighborhood:p.neighborhood,seller?b?.city:p.city,seller?b?.state:p.state].filter(Boolean).join(' · ');app.innerHTML=`<div class="j-shell"><div class="j-account"><div class="j-account-card"><div class="j-account-identity"><div class="j-business-logo">${seller&&b?.logo_url?`<img src="${esc(b.logo_url)}">`:initials(name)}</div><div><span class="j-kicker">${seller?'CONTA EMPRESA':'SUA CONTA'}</span><h2 style="margin:5px 0">${esc(name)}</h2><p style="margin:0;color:var(--muted)">${esc(location||state.session?.user?.email||'')}</p></div></div><div class="j-form"><button class="j-btn secondary" id="editName">Editar nome</button>${state.role==='buyer'?'<button class="j-btn secondary" id="editCep">Alterar CEP</button>':''}${seller?'<button class="j-btn secondary" id="goSellerOffers">Minhas ofertas</button>':''}<button class="j-btn dark" id="logoutBtn">Sair da conta</button></div></div></div></div>`;$('#logoutBtn').onclick=async()=>{await db.auth.signOut();localStorage.removeItem('junta_role_cache');localStorage.removeItem('junta_name_cache');state.session=null;state.profile=null;state.business=null;state.role='guest';setAvatar();closeOverlay();renderPublic();};if($('#editCep'))$('#editCep').onclick=openCepModal;if($('#goSellerOffers'))$('#goSellerOffers').onclick=()=>navigate('seller-offers');$('#editName').onclick=openEditName;}
  function openEditName(){openOverlay(`<div class="j-modal"><div class="j-modal-head"><div><span class="j-kicker">PERFIL</span><h2>Editar nome</h2></div><button class="j-close" data-close>×</button></div><form class="j-form" id="nameForm"><label>Nome<input name="name" value="${esc(state.profile?.display_name||'')}" required></label><button class="j-btn primary" type="submit">Salvar</button></form></div>`);$('#nameForm',overlay).onsubmit=async(e)=>{e.preventDefault();const name=String(new FormData(e.currentTarget).get('name')).trim();const {error}=await db.from('profiles').update({display_name:name}).eq('user_id',state.session.user.id);if(error){toast(error.message);return;}state.profile.display_name=name;localStorage.setItem('junta_name_cache',name);setAvatar();closeOverlay();renderAccount();};}

  function renderSellerOnboarding(){state.role='seller';state.route='seller-onboarding';bottomNav.hidden=true;const d=state.onboarding,step=d.step;app.innerHTML=`<div class="j-shell"><div class="j-onboarding"><div class="j-account-card"><span class="j-kicker">PASSO ${step} DE 4</span><div class="j-stepper">${[1,2,3,4].map(n=>`<i class="${n<=step?'done':''}"></i>`).join('')}</div>${step===1?onboard1():step===2?onboard2():step===3?onboard3():onboard4()}</div></div></div>`;bindOnboarding();}
  function onboard1(){return `<h2 style="font-size:34px;margin:6px 0 18px">Conte sobre sua empresa</h2><div class="j-form"><label>Nome da empresa<input id="obName" value="${esc(state.onboarding.name)}" placeholder="Ex.: Morilla" required></label><label>Tipo de negócio<select id="obType"><option value="">Selecione</option><option>Loja física</option><option>Restaurante</option><option>Mercado</option><option>Prestador local</option><option>Outro</option></select></label><button class="j-btn primary" id="obNext">Continuar</button></div>`;}
  function onboard2(){return `<h2 style="font-size:34px;margin:6px 0 18px">O que você vende?</h2><div class="j-choice-grid">${CATEGORIES.map(c=>`<button class="j-choice ${state.onboarding.categories.includes(c[0])?'active':''}" data-ob-cat="${c[0]}">${c[1]}</button>`).join('')}</div><div class="j-actions"><button class="j-btn secondary" id="obBack">Voltar</button><button class="j-btn primary" id="obNext">Continuar</button></div>`;}
  function onboard3(){return `<h2 style="font-size:34px;margin:6px 0 8px">Onde sua empresa atende?</h2><p style="color:var(--muted)">O CEP aproxima suas ofertas de compradores da região.</p><div class="j-form"><label>CEP<input id="obCep" inputmode="numeric" value="${esc(state.onboarding.cep)}" placeholder="00000-000"></label><div id="obLocation">${state.onboarding.location?`<div class="j-empty"><b>${esc(state.onboarding.location.localidade)}/${esc(state.onboarding.location.uf)}</b><p>${esc(state.onboarding.location.bairro||'')}</p></div>`:''}</div><div class="j-actions"><button class="j-btn secondary" id="obBack">Voltar</button><button class="j-btn primary" id="obLookup">Validar CEP</button></div></div>`;}
  function onboard4(){const loc=state.onboarding.location;return `<h2 style="font-size:34px;margin:6px 0 8px">Sua empresa está pronta.</h2><p style="color:var(--muted)">Adicione sua logo e confira os dados.</p><div class="j-form"><label>Logo/foto da empresa<input id="obLogo" type="file" accept="image/*"></label><div class="j-empty"><h3>${esc(state.onboarding.name)}</h3><p>${esc([loc?.bairro,loc?.localidade,loc?.uf].filter(Boolean).join(' · '))}</p></div><div class="j-actions"><button class="j-btn secondary" id="obBack">Voltar</button><button class="j-btn primary" id="obFinish">Criar Junta Empresas</button></div></div>`;}
  function bindOnboarding(){const d=state.onboarding;if($('#obBack'))$('#obBack').onclick=()=>{d.step--;renderSellerOnboarding()};if(d.step===1){$('#obType').value=d.businessType;$('#obNext').onclick=()=>{d.name=$('#obName').value.trim();d.businessType=$('#obType').value;if(!d.name||!d.businessType){toast('Preencha nome e tipo da empresa.');return;}d.step=2;renderSellerOnboarding();};}if(d.step===2){$$('[data-ob-cat]').forEach(b=>b.onclick=()=>{const c=b.dataset.obCat;d.categories=d.categories.includes(c)?d.categories.filter(x=>x!==c):[...d.categories,c];renderSellerOnboarding()});$('#obNext').onclick=()=>{if(!d.categories.length){toast('Escolha pelo menos uma categoria.');return;}d.step=3;renderSellerOnboarding();};}if(d.step===3){const inp=$('#obCep');inp.oninput=()=>{let v=inp.value.replace(/\D/g,'').slice(0,8);inp.value=v.length>5?`${v.slice(0,5)}-${v.slice(5)}`:v;};$('#obLookup').onclick=async()=>{const btn=$('#obLookup');btn.disabled=true;btn.textContent='Validando...';try{const cep=inp.value.replace(/\D/g,'');const r=await timeout(fetch(`${SB_URL}/functions/v1/lookup-cep?cep=${cep}`,{headers:{apikey:SB_KEY}}),6000);const loc=await r.json();if(!r.ok||loc.error)throw new Error(loc.error||'CEP não encontrado');d.cep=cep;d.location=loc;d.step=4;renderSellerOnboarding();}catch(err){toast(err.message);btn.disabled=false;btn.textContent='Validar CEP';}};}if(d.step===4){$('#obLogo').onchange=e=>{d.logoFile=e.target.files?.[0]||null};$('#obFinish').onclick=finishOnboarding;}}
  async function finishOnboarding(){const d=state.onboarding,btn=$('#obFinish');btn.disabled=true;btn.textContent='Criando empresa...';try{let logo_url='';if(d.logoFile){const safe=String(d.logoFile.name||'logo.jpg').replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${state.session.user.id}/business-${Date.now()}-${safe}`;const up=await db.storage.from('listing-images').upload(path,d.logoFile,{upsert:false});if(up.error)throw up.error;logo_url=db.storage.from('listing-images').getPublicUrl(path).data.publicUrl;}const unique=`${slugify(d.name)}-${state.session.user.id.slice(0,6)}`;const loc=d.location||{};const {data,error}=await db.from('businesses').insert({owner_id:state.session.user.id,name:d.name,slug:unique,category:d.categories[0]||'outros',categories:d.categories,business_type:d.businessType,description:'',logo_url,city:loc.localidade||'',state:loc.uf||'',address_line:loc.logradouro||'',postal_code:d.cep,neighborhood:loc.bairro||'',status:'pending',verified:false,onboarding_step:4,onboarding_complete:true,onboarding_completed_at:new Date().toISOString()}).select('*').single();if(error)throw error;state.business=data;setAvatar();toast('Empresa criada. Agora você já pode criar ofertas.');navigate('seller-dashboard');}catch(err){toast(err.message||'Não foi possível criar sua empresa.');btn.disabled=false;btn.textContent='Criar Junta Empresas';}}

  async function renderAdmin(route='admin'){state.route=route;renderBottomNav();app.innerHTML=`<div class="j-shell j-app-shell"><div class="j-buyer-header"><span class="j-kicker">MASTER</span><h1>Operação Junta</h1><p>Dados reais, sem demos.</p></div><div id="adminBody"><div class="j-skeleton"></div></div></div>`;try{await loadAdminData();paintAdmin(route);}catch(err){$('#adminBody').innerHTML=`<div class="j-empty"><h3>Erro ao abrir o master.</h3><p>${esc(err.message)}</p></div>`;}}
  async function loadAdminData(){const [b,o]=await timeout(Promise.all([db.from('businesses').select('*').not('owner_id','is',null).order('created_at',{ascending:false}),db.from('offers').select('id,business_id,title,status,regular_price,junta_price,min_sustainable_price,created_at,is_demo,offer_stats(waitlist_count,view_count)').eq('is_demo',false).order('created_at',{ascending:false})]),5500);if(b.error)throw b.error;if(o.error)throw o.error;state.adminData={businesses:b.data||[],offers:o.data||[]};}
  function paintAdmin(route){const root=$('#adminBody'),d=state.adminData, pendingB=d.businesses.filter(x=>x.status==='pending'),pendingO=d.offers.filter(x=>x.status==='pending');if(route==='admin'){root.innerHTML=`<div class="j-admin-grid"><article class="j-admin-card"><span>EMPRESAS REAIS</span><strong>${d.businesses.length}</strong></article><article class="j-admin-card"><span>OFERTAS REAIS</span><strong>${d.offers.length}</strong></article><article class="j-admin-card"><span>PENDÊNCIAS</span><strong>${pendingB.length+pendingO.length}</strong></article></div>`;return;}if(route==='admin-businesses'){root.innerHTML=`<div class="j-list">${d.businesses.map(b=>`<div class="j-list-item"><div class="j-list-img">${b.logo_url?`<img src="${esc(b.logo_url)}">`:''}</div><div class="j-list-main"><span class="j-status ${b.status==='pending'?'pending':''}">${esc(b.status)}</span><h3>${esc(b.name)}</h3><small>${esc([b.city,b.state].filter(Boolean).join('/'))}</small>${b.status==='pending'?`<div class="j-admin-actions"><button class="j-btn primary" data-approve-business="${b.id}">Aprovar</button></div>`:''}</div></div>`).join('')}</div>`;$$('[data-approve-business]',root).forEach(b=>b.onclick=()=>approveBusiness(b.dataset.approveBusiness));return;}root.innerHTML=`<div class="j-list">${d.offers.map(o=>`<div class="j-list-item"><div class="j-list-img"></div><div class="j-list-main"><span class="j-status ${o.status==='pending'?'pending':''}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3><small>${money(o.regular_price)} → ${money(o.junta_price)}</small>${o.status==='pending'?`<div class="j-admin-actions"><button class="j-btn primary" data-approve-offer="${o.id}">Aprovar</button></div>`:''}</div></div>`).join('')}</div>`;$$('[data-approve-offer]',root).forEach(b=>b.onclick=()=>approveOffer(b.dataset.approveOffer));}
  async function approveBusiness(id){const {error}=await db.from('businesses').update({status:'approved',verified:true}).eq('id',id);if(error)return toast(error.message);toast('Empresa aprovada.');await renderAdmin('admin-businesses');}
  async function approveOffer(id){const {error}=await db.from('offers').update({status:'scheduled',price_review_status:'approved'}).eq('id',id);if(error)return toast(error.message);toast('Oferta aprovada.');await renderAdmin('admin-offers');}

  $('#brandBtn').onclick=()=>{if(state.role==='seller')navigate('seller-dashboard');else if(state.role==='buyer')navigate('buyer-home');else if(state.role==='master'||state.role==='admin')navigate('admin');else navigate('public');};
  $('#avatarBtn').onclick=()=>{if(state.role==='guest')openAuth('buyer');else navigate('account');};
  $('#searchBtn').onclick=()=>{if(state.role==='seller')navigate('seller-offers');else if(state.role==='buyer')navigate('buyer-explore');else $('#publicOffersSection')?.scrollIntoView({behavior:'smooth'});};

  db.auth.onAuthStateChange((event,session)=>{
    if(event==='SIGNED_OUT'){state.session=null;state.profile=null;state.business=null;state.role='guest';setAvatar();renderPublic();}
    if(event==='SIGNED_IN'&&session&&!state.session){state.session=session;setTimeout(()=>boot(),0);}
  });

  boot();
})();