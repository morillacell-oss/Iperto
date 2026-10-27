(() => {
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  if(!window.supabase)return;
  const db=window.supabase.createClient(SB_URL,SB_KEY);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const toast=m=>window.showToast?window.showToast(m):console.log(m);
  const CATS=[['celulares','Celulares'],['eletronicos','Eletrônicos'],['ferramentas','Ferramentas'],['roupas','Roupas'],['moda','Calçados'],['restaurantes','Restaurantes'],['pizzarias','Pizzarias'],['comida','Lanches'],['mercado','Mercado'],['casa','Casa'],['beleza','Beleza'],['pet','Pet'],['automotivo','Automotivo']];
  let state={session:null,profile:null,business:null,section:'dashboard',offers:[],events:[]};
  let booting=false;

  function icon(name){
    const p={home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3v-9.5Z"/>',bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',eye:'<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',chart:'<path d="M4 19V9m6 10V5m6 14v-7m4 7V3"/>',plus:'<path d="M12 5v14M5 12h14"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',edit:'<path d="m4 20 4.2-1 10-10-3.2-3.2-10 10L4 20Z"/><path d="m13.8 7 3.2 3.2"/>',close:'<path d="M6 6l12 12M18 6 6 18"/>',store:'<path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9M8 19v-5h5v5"/>',spark:'<path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/>',pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[name]||p.bolt}</svg>`;
  }
  const pct=(a,b)=>b>0?Math.min(100,Math.round(Number(a||0)/Number(b||1)*100)):0;
  const stats=o=>Array.isArray(o.offer_stats)?(o.offer_stats[0]||{}):(o.offer_stats||{});
  const tiers=o=>[...(o.offer_price_tiers||[])].sort((a,b)=>Number(a.people_count)-Number(b.people_count));
  const statusLabel=s=>({pending:'Em análise',scheduled:'Programada',open:'Aberta',closed:'Encerrada',sold_out:'Esgotada',draft:'Rascunho',cancelled:'Cancelada'})[s]||s||'—';
  const statusClass=s=>['open','scheduled'].includes(s)?'good':s==='pending'?'warn':'muted';
  function go(view){if(typeof window.navigate==='function')window.navigate(view);else{$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));}}

  async function context(){
    const {data:{session}}=await db.auth.getSession();
    if(!session)return {session:null,profile:null,business:null};
    const {data:profile}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();
    let business=null;
    if(profile?.role==='seller'){
      const {data}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
      business=data;
    }
    return {session,profile,business};
  }

  async function refreshContext(){
    const c=await context();
    state={...state,...c};
    document.body.dataset.juntaRole=c.profile?.role||'guest';
    syncRoleChrome();
    return c;
  }

  function syncRoleChrome(){
    const role=state.profile?.role;
    const navs={home:$('.nav-item[data-nav="home"]'),offers:$('.nav-item[data-nav="offers"]'),seller:$('.nav-item[data-nav="seller"]'),account:$('.nav-item[data-nav="account"]')};
    if(role==='seller'){
      if(navs.home)navs.home.querySelector('span').textContent='Painel';
      if(navs.offers)navs.offers.querySelector('span').textContent='Ofertas';
      if(navs.seller){navs.seller.style.display='flex';navs.seller.querySelector('span').textContent='Grupos';}
      if(navs.account)navs.account.querySelector('span').textContent='Conta';
      const label=$('.account-label');if(label)label.textContent='Empresa';
      const av=$('.avatar-mini');if(av)av.textContent=(state.business?.name||'E').slice(0,1).toUpperCase();
    }else if(role==='buyer'){
      if(navs.home)navs.home.querySelector('span').textContent='Início';
      if(navs.offers)navs.offers.querySelector('span').textContent='Grupos';
      if(navs.seller)navs.seller.style.display='none';
      if(navs.account)navs.account.querySelector('span').textContent='Conta';
    }
  }

  function setSellerNav(section){
    const map={dashboard:'home',offers:'offers',groups:'seller'};
    $$('.bottom-nav [data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===map[section]));
  }

  async function loadSellerData(){
    const b=state.business;if(!b?.id)return;
    const since=new Date(Date.now()-7*86400000).toISOString();
    const [{data:offers,error:oErr},{data:events,error:eErr}]=await Promise.all([
      db.from('offers').select('id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,min_sustainable_price,min_paid,max_units,queue_target,status,created_at,updated_at,last_price_drop_at,price_flash_until,price_flash_message,offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count,shares_count),offer_price_tiers(people_count,unit_price)').eq('business_id',b.id).eq('is_demo',false).order('created_at',{ascending:false}),
      db.from('analytics_events').select('event_type,offer_id,created_at').eq('business_id',b.id).gte('created_at',since).order('created_at',{ascending:true})
    ]);
    if(oErr)throw oErr;if(eErr)console.warn(eErr);
    state.offers=offers||[];state.events=events||[];
  }

  async function showSeller(section='dashboard'){
    const c=state.session?state:await refreshContext();
    if(c.profile?.role!=='seller')return;
    state.section=section;
    go('seller');
    setSellerNav(section);
    const root=$('[data-view="seller"] .shell');if(!root)return;
    if(!c.business?.onboarding_complete){return;}
    root.innerHTML='<div class="v70 seller-v60"><div class="v70-card" style="min-height:240px;display:grid;place-items:center"><b>Carregando sua operação...</b></div></div>';
    try{await loadSellerData();renderSeller(root,section);}catch(err){console.error(err);root.innerHTML=`<div class="v70 seller-v60"><div class="v70-empty"><h3>Não conseguimos abrir seu painel</h3><p>${esc(err.message||'Tente novamente.')}</p><button class="v70-primary" data-v70-retry>Tentar novamente</button></div></div>`;$('[data-v70-retry]',root)?.addEventListener('click',()=>showSeller(section));}
  }

  function renderSeller(root,section){
    const b=state.business,rows=state.offers,allStats=rows.map(stats);
    const views=allStats.reduce((a,s)=>a+Number(s.view_count||0),0),details=allStats.reduce((a,s)=>a+Number(s.detail_click_count||0),0),interested=allStats.reduce((a,s)=>a+Number(s.waitlist_count||0),0),joins=allStats.reduce((a,s)=>a+Number(s.join_click_count||0),0),active=rows.filter(o=>['scheduled','open'].includes(o.status)).length,pending=rows.filter(o=>o.status==='pending').length;
    root.innerHTML=`<div class="v70 seller-v60"><div class="v70-shell">
      <section class="v70-top"><div class="v70-store"><div class="v70-store-logo">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}">`:esc((b.name||'J').slice(0,1))}</div><div><span class="v70-eyebrow">JUNTA EMPRESAS</span><h1>${esc(b.name||'Sua empresa')}</h1><p>${esc([b.neighborhood,b.city,b.state].filter(Boolean).join(' · '))}</p></div></div><span class="v70-live"><i></i> DADOS AO VIVO</span></section>
      <nav class="v70-tabs"><button class="${section==='dashboard'?'active':''}" data-v70-section="dashboard">Painel</button><button class="${section==='offers'?'active':''}" data-v70-section="offers">Minhas ofertas</button><button class="${section==='groups'?'active':''}" data-v70-section="groups">Meus grupos</button><button data-v70-new>${icon('plus')} Nova oferta</button></nav>
      ${section==='dashboard'?dashboardMarkup(rows,{views,details,interested,joins,active,pending}):section==='offers'?offersMarkup(rows):groupsMarkup(rows)}
    </div></div>`;
    $$('[data-v70-section]',root).forEach(b=>b.onclick=()=>showSeller(b.dataset.v70Section));
    $$('[data-v70-offer]',root).forEach(b=>b.onclick=()=>openOffer(b.dataset.v70Offer));
    $$('[data-v70-new]',root).forEach(b=>b.onclick=openCreateOffer);
  }

  function dashboardMarkup(rows,m){
    const conv=m.views?Math.round(m.interested/m.views*100):0;
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
    const daily=days.map(d=>{const n=new Date(d);n.setDate(n.getDate()+1);return state.events.filter(e=>{const t=new Date(e.created_at);return t>=d&&t<n}).length}),max=Math.max(1,...daily);
    const best=[...rows].sort((a,b)=>Number(stats(b).waitlist_count||0)-Number(stats(a).waitlist_count||0)).slice(0,3);
    return `<section class="v70-grid4"><article class="v70-metric hot"><div class="mi">${icon('users')}</div><span>Pessoas interessadas</span><strong>${m.interested}</strong><small>${m.joins} cliques em entrar</small></article><article class="v70-metric"><div class="mi">${icon('eye')}</div><span>Visualizações</span><strong>${m.views}</strong><small>${m.details} abriram detalhes</small></article><article class="v70-metric"><div class="mi">${icon('chart')}</div><span>Conversão</span><strong>${conv}%</strong><small>view → interesse</small></article><article class="v70-metric"><div class="mi">${icon('bolt')}</div><span>Ofertas ativas</span><strong>${m.active}</strong><small>${m.pending} em análise</small></article></section>
      <section class="v70-layout"><article class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">ÚLTIMOS 7 DIAS</span><h2>Movimento da sua vitrine</h2><p>Interações reais registradas no Junta.</p></div><span class="v70-chip">DADOS REAIS</span></div><div class="v70-chart">${daily.map((n,i)=>`<div class="v70-chart-col"><i style="--h:${Math.max(7,Math.round(n/max*100))}%"><b>${n}</b></i><span>${['D','S','T','Q','Q','S','S'][days[i].getDay()]}</span></div>`).join('')}</div><div class="v70-funnel"><div><span>Visualizações</span><strong>${m.views}</strong></div><div><span>Detalhes</span><strong>${m.details}</strong></div><div><span>Cliques entrar</span><strong>${m.joins}</strong></div><div><span>No grupo</span><strong>${m.interested}</strong></div></div></article><article class="v70-card v70-insight"><span class="v70-eyebrow">AÇÃO RECOMENDADA</span><h2>${m.interested?'Seu grupo já tem tração.':'Hora de gerar movimento.'}</h2><p>${m.interested?'Abra a oferta com mais interesse. Você pode baixar o preço sem passar do seu piso e transformar a redução em um alerta animado para compradores da região.':'Compartilhe suas ofertas e acompanhe as primeiras pessoas entrando. Quando houver tração, o painel mostra tudo em tempo real.'}</p><button class="v70-soft" data-v70-section="offers">${icon('bolt')} Ver minhas ofertas</button></article></section>
      <section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">DESTAQUES</span><h2>Grupos com mais interesse</h2></div><button class="v70-soft" data-v70-section="offers">Ver todas</button></div>${best.length?`<div class="v70-list">${best.map(offerRow).join('')}</div>`:`<div class="v70-empty"><h3>Crie sua primeira oferta</h3><p>Ela aparecerá aqui com números reais de interesse, visualizações e progresso.</p></div>`}</section>`;
  }

  function offersMarkup(rows){return `<section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">MINHAS OFERTAS</span><h2>Abra, acompanhe e ajuste</h2><p>Cada oferta mostra interesse real e pode ser aberta para operação.</p></div><button class="v70-primary" data-v70-new>${icon('plus')} Nova oferta</button></div>${rows.length?`<div class="v70-list">${rows.map(offerRow).join('')}</div>`:`<div class="v70-empty"><h3>Nenhuma oferta ainda</h3><p>Crie sua primeira campanha coletiva e acompanhe tudo daqui.</p></div>`}</section>`}
  function groupsMarkup(rows){
    const active=rows.filter(o=>['pending','scheduled','open'].includes(o.status));
    return `<section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">MEUS GRUPOS</span><h2>Grupos em andamento</h2><p>Veja quantas pessoas entraram e quanto falta para chegar à meta.</p></div><span class="v70-chip">${active.length} grupos</span></div>${active.length?`<div class="v70-list">${active.map(groupCard).join('')}</div>`:`<div class="v70-empty"><h3>Nenhum grupo em andamento</h3><p>Quando uma oferta estiver em análise ou ativa, ela aparece aqui.</p></div>`}</section>`;
  }
  function offerRow(o){const s=stats(o),wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pr=pct(wait,target);return `<button class="v70-offer" data-v70-offer="${o.id}"><div class="v70-offer-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:icon('bag')}</div><div class="v70-offer-main"><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3><div class="v70-progress"><i style="--p:${pr}%"></i></div><div class="v70-offer-meta"><span>${wait}/${target} pessoas</span><span>${Number(s.view_count||0)} views</span><span>${Number(s.detail_click_count||0)} detalhes</span></div></div><div class="v70-offer-price"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div></button>`}
  function groupCard(o){const s=stats(o),wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pr=pct(wait,target),left=Math.max(0,target-wait);return `<button class="v70-group-card" data-v70-offer="${o.id}" style="width:100%;text-align:left;color:inherit;cursor:pointer"><div class="v70-group-title"><div><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3></div><strong>${pr}%</strong></div><div class="v70-progress"><i style="--p:${pr}%"></i></div><div class="v70-group-numbers"><div><span>NO GRUPO</span><b>${wait}</b></div><div><span>FALTAM</span><b>${left}</b></div><div><span>PREÇO ATUAL</span><b>${money(o.junta_price)}</b></div></div></button>`}

  function openOffer(id){
    const o=state.offers.find(x=>x.id===id);if(!o)return;
    const s=stats(o),ts=tiers(o),wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pr=pct(wait,target),floor=Number(o.min_sustainable_price||0),canLower=['pending','scheduled','open'].includes(o.status)&&Number(o.junta_price)>floor;
    const d=document.createElement('div');d.className='v70-drawer';
    d.innerHTML=`<aside class="v70-drawer-panel"><button class="v70-drawer-close" aria-label="Fechar">×</button><div class="v70-detail-cover">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}</div><div class="v70-detail-head"><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h2>${esc(o.title)}</h2><div class="v70-detail-price">${o.previous_junta_price?`<s>${money(o.previous_junta_price)}</s>`:`<s>${money(o.regular_price)}</s>`}<strong>${money(o.junta_price)}</strong></div></div><div class="v70-detail-grid"><div><span>INTERESSADOS</span><b>${wait}</b></div><div><span>VISUALIZAÇÕES</span><b>${Number(s.view_count||0)}</b></div><div><span>CLIQUES</span><b>${Number(s.detail_click_count||0)}</b></div></div><div class="v70-progress"><i style="--p:${pr}%"></i></div><div class="v70-offer-meta" style="justify-content:space-between;font-size:12px"><span>${wait} de ${target} pessoas</span><span>${Math.max(0,target-wait)} para a meta</span></div><section class="v70-card" style="margin-top:15px;box-shadow:none"><div class="v70-card-head"><div><span class="v70-eyebrow">FAIXAS DE PREÇO</span><h2>Quanto mais gente, menor o preço</h2></div></div><div class="v70-tiers">${ts.map(t=>`<div class="v70-tier"><span>${t.people_count} pessoas</span><strong>${money(t.unit_price)}</strong></div>`).join('')}</div></section><section class="v70-lower-box"><span class="v70-eyebrow">AÇÃO COMERCIAL</span><h3>Baixar o preço agora</h3><p>${o.status==='pending'?'Você pode reduzir enquanto está em análise. O alerta só será ativado quando a oferta estiver publicada.':canLower?'Uma redução real vira destaque por 48h para compradores da sua região. As faixas caem proporcionalmente e nunca passam do seu piso sustentável.':'Esta oferta já chegou ao menor preço sustentável ou não pode ser alterada neste status.'}</p>${canLower?`<form class="v70-price-form"><input name="newprice" type="number" step="0.01" min="${floor}" max="${Math.max(floor,Number(o.junta_price)-.01)}" value="${Math.max(floor,Number(o.junta_price)-.10).toFixed(2)}" required><button class="v70-primary" type="submit">${icon('bolt')} Baixar preço</button></form><div class="v70-quickcuts"><button type="button" data-cut="3">-3%</button><button type="button" data-cut="5">-5%</button><button type="button" data-cut="10">-10%</button><span style="font-size:11px;color:#7d716d;padding:8px 0">Piso: <b>${money(floor)}</b></span></div><div class="v70-drop-preview"></div><div class="v70-alert-note">Subir o preço de uma oferta publicada não é permitido por aqui. Isso protege o comprador e evita desconto artificial.</div>`:''}</section></aside>`;
    document.body.appendChild(d);const close=()=>d.remove();$('.v70-drawer-close',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};
    if(canLower){const form=$('.v70-price-form',d),inp=$('input[name="newprice"]',d),preview=$('.v70-drop-preview',d);const paint=()=>{const n=Number(inp.value);if(n>0&&n<Number(o.junta_price)&&n>=floor){const save=Number(o.junta_price)-n;preview.className='v70-drop-preview show';preview.innerHTML=`<span>Comprador verá <b>OFERTAAAAA! ⚡</b></span><strong>${money(o.junta_price)} → ${money(n)} <small>(-${money(save)})</small></strong>`}else{preview.className='v70-drop-preview'}};inp.oninput=paint;paint();$$('[data-cut]',d).forEach(b=>b.onclick=()=>{const n=Math.max(floor,Number(o.junta_price)*(1-Number(b.dataset.cut)/100));inp.value=n.toFixed(2);paint()});form.onsubmit=async e=>{e.preventDefault();const btn=$('button[type="submit"]',form),n=Number(inp.value);if(!(n<Number(o.junta_price))||n<floor){toast('Digite um valor menor que o atual e acima do piso.');return}btn.disabled=true;btn.textContent='Ativando oferta...';try{const {data,error}=await db.rpc('seller_lower_offer_prices',{p_offer_id:o.id,p_new_lowest:n});if(error)throw error;toast('Preço baixou! O destaque foi ativado ⚡');close();await showSeller(state.section);setTimeout(()=>celebrate(),120)}catch(err){toast(err.message||'Não foi possível alterar o preço.');btn.disabled=false;btn.innerHTML=`${icon('bolt')} Baixar preço`}}};}
  }

  function celebrate(){for(let i=0;i<14;i++){const s=document.createElement('i');s.style.cssText=`position:fixed;z-index:12000;left:${45+Math.random()*10}vw;top:40vh;width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;border-radius:50%;background:${i%2?'#ff3b37':'#171310'};pointer-events:none;transition:all .9s cubic-bezier(.2,.8,.2,1)`;document.body.appendChild(s);requestAnimationFrame(()=>{s.style.transform=`translate(${(Math.random()-.5)*360}px,${80+Math.random()*260}px) scale(.3)`;s.style.opacity='0'});setTimeout(()=>s.remove(),1000)}}

  function openCreateOffer(){
    if(!state.session||!state.business)return;
    const d=document.createElement('div');d.className='v70-drawer';d.innerHTML=`<aside class="v70-drawer-panel"><button class="v70-drawer-close">×</button><div class="v70-detail-head"><span class="v70-eyebrow">NOVA OFERTA</span><h2>Crie um grupo que dá vontade de entrar.</h2><p style="color:#756c67">Foto boa, preço claro e faixas progressivas. Depois ela vai para análise.</p></div><form class="v70-create" style="display:grid;gap:12px"><label>Produto<input name="title" required placeholder="Ex.: Smash duplo"></label><label>Categoria<select name="category" required>${CATS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label><label>Descrição<textarea name="description" rows="3" placeholder="O que está incluso, retirada, detalhes..."></textarea></label><label>Foto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label>Preço normal<input name="regular" type="number" step="0.01" min="1" required></label><label>Piso sustentável<input name="floor" type="number" step="0.01" min="1" required></label></div><label>Estoque<input name="stock" type="number" min="25" value="25" required></label><div class="v70-card" style="box-shadow:none"><span class="v70-eyebrow">FAIXAS</span>${[5,10,15,20,25].map(n=>`<label style="margin-top:9px">${n} pessoas<input name="tier${n}" type="number" step="0.01" min="0.01" required></label>`).join('')}</div><button class="v70-primary" type="submit">Enviar para análise</button></form><style>.v70-create label{display:grid;gap:6px;font-size:12px;font-weight:900;color:#4f4541}.v70-create input,.v70-create select,.v70-create textarea{width:100%;border:1px solid #eadcd6;border-radius:13px;padding:12px;background:#fff;outline:none}.v70-create input:focus,.v70-create textarea:focus,.v70-create select:focus{border-color:#ff928b;box-shadow:0 0 0 4px #fff0ed}</style></aside>`;document.body.appendChild(d);const close=()=>d.remove();$('.v70-drawer-close',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};const form=$('.v70-create',d),regular=$('[name="regular"]',form),floor=$('[name="floor"]',form),inputs=[5,10,15,20,25].map(n=>$(`[name="tier${n}"]`,form));const suggest=()=>{const r=Number(regular.value),f=Number(floor.value);if(!r||!f||f>r)return;[.02,.04,.06,.08,.10].forEach((x,i)=>inputs[i].value=Math.max(f,r*(1-x)).toFixed(2))};regular.oninput=suggest;floor.oninput=suggest;form.onsubmit=async e=>{e.preventDefault();const btn=$('button[type="submit"]',form),fd=new FormData(form),r=Number(fd.get('regular')),f=Number(fd.get('floor')),stock=Number(fd.get('stock')),prices=[5,10,15,20,25].map(n=>Number(fd.get(`tier${n}`)));try{if(f>r)throw new Error('O piso sustentável não pode ser maior que o preço normal.');if(stock<25)throw new Error('O estoque precisa comportar o grupo de 25 pessoas.');for(let i=0;i<prices.length;i++){if(prices[i]<f)throw new Error('Nenhuma faixa pode ficar abaixo do seu piso sustentável.');if(prices[i]>=r)throw new Error('Toda faixa precisa ficar abaixo do preço normal.');if(i&&prices[i]>prices[i-1])throw new Error('Quanto mais pessoas entram, o preço não pode aumentar.')}const file=fd.get('photo');if(!file?.size)throw new Error('A foto do produto é obrigatória.');btn.disabled=true;btn.textContent='Enviando...';const path=`${state.session.user.id}/offer-${Date.now()}-${String(file.name).replace(/[^a-zA-Z0-9._-]/g,'')}`;const up=await db.storage.from('listing-images').upload(path,file,{upsert:false});if(up.error)throw up.error;const {data:pub}=db.storage.from('listing-images').getPublicUrl(path);const now=new Date(),closeAt=new Date(Date.now()+7*86400000);const {data:offer,error}=await db.from('offers').insert({business_id:state.business.id,created_by:state.session.user.id,title:String(fd.get('title')).trim(),description:String(fd.get('description')||'').trim(),category:fd.get('category'),image_url:pub.publicUrl,regular_price:r,junta_price:prices[4],min_sustainable_price:f,min_paid:5,max_units:stock,queue_target:25,opens_at:now.toISOString(),closes_at:closeAt.toISOString(),status:'pending',featured:false,is_demo:false,demo_seed_count:0,price_review_status:'unreviewed'}).select('id').single();if(error)throw error;const {error:tErr}=await db.from('offer_price_tiers').insert([5,10,15,20,25].map((n,i)=>({offer_id:offer.id,people_count:n,unit_price:prices[i]})));if(tErr)throw tErr;toast('Oferta enviada para análise ✓');d.remove();await showSeller('offers')}catch(err){toast(err.message||'Não foi possível criar a oferta.');btn.disabled=false;btn.textContent='Enviar para análise'}};
  }

  async function injectBuyerFlash(){
    const active=$('.view.active')?.dataset.view;if(!['account','offers'].includes(active))return;
    const c=state.profile?.role==='buyer'?state:await refreshContext();if(c.profile?.role!=='buyer'||!c.profile.city||!c.profile.state)return;
    const {data:rows,error}=await db.from('offers').select('id,title,image_url,regular_price,junta_price,previous_junta_price,queue_target,price_flash_message,price_flash_until,businesses!inner(name,city,state,status),offer_stats(waitlist_count)').eq('is_demo',false).in('status',['scheduled','open']).eq('businesses.status','approved').ilike('businesses.city',c.profile.city).eq('businesses.state',c.profile.state).gt('price_flash_until',new Date().toISOString()).order('last_price_drop_at',{ascending:false}).limit(3);
    if(error||!rows?.length)return;
    const host=active==='account'?($('[data-view="account"] .shell .v62-account')||$('[data-view="account"] .shell')):($('[data-view="offers"] .page-title')?.parentElement||$('[data-view="offers"] .shell'));if(!host||$('.v70-flash',host))return;
    const o=rows[0],s=Array.isArray(o.offer_stats)?(o.offer_stats[0]||{}):(o.offer_stats||{}),wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pr=pct(wait,target);
    const {data:joined}=await db.from('offer_waitlist').select('offer_id').eq('user_id',c.session.user.id).eq('offer_id',o.id).maybeSingle();
    const box=document.createElement('section');box.className='v70-flash';box.innerHTML=`<div class="v70-flash-top"><div><span class="v70-flash-kicker">⚡ OFERTA RELÂMPAGO NA SUA REGIÃO</span><h2>OFERTAAAAA! Corre e se junta.</h2><p>${esc(o.businesses?.name||'Comércio local')} baixou o preço de <b>${esc(o.title)}</b>.</p></div><div class="v70-flash-price">${o.previous_junta_price?`<s>${money(o.previous_junta_price)}</s>`:''}<strong>${money(o.junta_price)}</strong></div></div><div class="v70-flash-bottom"><div><div class="v70-progress"><i style="--p:${pr}%"></i></div><small>${wait} de ${target} pessoas · quanto mais gente entra, mais perto da meta.</small></div><button ${joined?'disabled':''} data-v70-flash-join="${o.id}">${joined?'Você já está no grupo':'Entrar no grupo agora'}</button></div>`;
    if(active==='account')host.insertBefore(box,host.children[1]||null);else host.insertBefore(box,host.firstChild);
    const btn=$('[data-v70-flash-join]',box);if(btn&&!joined)btn.onclick=async()=>{btn.disabled=true;btn.textContent='Entrando...';const {error:jErr}=await db.from('offer_waitlist').insert({offer_id:o.id,user_id:c.session.user.id});if(jErr&&jErr.code!=='23505'){toast(jErr.message);btn.disabled=false;btn.textContent='Entrar no grupo agora';return}try{await db.from('analytics_events').insert({user_id:c.session.user.id,event_type:'group_join',offer_id:o.id,metadata:{source:'price_drop_flash'}})}catch{}btn.textContent='Você está no grupo ✓';toast('Você entrou no grupo ⚡')};
  }

  function openBuyerHub(){go('account');document.dispatchEvent(new Event('junta:v62-open-account'));setTimeout(injectBuyerFlash,500)}

  function interceptRoleNavigation(e){
    const nav=e.target?.closest?.('[data-nav]');if(!nav)return;
    const role=state.profile?.role,view=nav.dataset.nav;
    if(role==='seller'&&['home','offers','seller'].includes(view)){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      showSeller(view==='home'?'dashboard':view==='offers'?'offers':'groups');
    }else if(role==='buyer'&&view==='home'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openBuyerHub();
    }
  }

  async function boot(){
    if(booting)return;booting=true;
    try{const c=await refreshContext();const active=$('.view.active')?.dataset.view;if(c.profile?.role==='seller'&&c.business?.onboarding_complete&&['home','offers','seller'].includes(active)){await showSeller(active==='offers'?'offers':active==='seller'?'groups':'dashboard')}else if(c.profile?.role==='buyer'){setTimeout(injectBuyerFlash,350)}}catch(err){console.warn('V70 boot',err)}finally{booting=false}
  }

  window.addEventListener('click',interceptRoleNavigation,true);
  document.addEventListener('click',()=>setTimeout(()=>{if(state.profile?.role==='buyer')injectBuyerFlash()},220),true);
  db.auth.onAuthStateChange(()=>setTimeout(boot,120));
  window.addEventListener('load',()=>setTimeout(boot,250));
  document.addEventListener('junta:v62-refresh',()=>setTimeout(boot,100));
})();
