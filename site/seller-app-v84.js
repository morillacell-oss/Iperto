(() => {
  if (!window.supabase) return;
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const db=window.__JUNTA_DB||(window.__JUNTA_DB=window.supabase.createClient(SB_URL,SB_KEY));
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const pct=(a,b)=>b?Math.min(100,Math.round(Number(a||0)/Number(b)*100)):0;
  const timeout=(p,ms,label='A conexão demorou demais')=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(label)),ms))]);
  const statusLabel=s=>({pending:'Em análise',scheduled:'Programada',open:'Aberta',closed:'Encerrada',sold_out:'Esgotada',draft:'Rascunho',cancelled:'Cancelada'})[s]||s||'—';
  const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${({eye:'<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',users:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',plus:'<path d="M12 5v14M5 12h14"/>'})[n]||''}</svg>`;
  const CACHE_KEY='junta_seller_v84';
  let current='dashboard', seq=0, context=null, data={offers:[],events:[],loaded:false,error:''};

  function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'null')}catch{return null}}
  function saveCache(){try{if(context?.business?.id)localStorage.setItem(CACHE_KEY,JSON.stringify({business:context.business,offers:data.offers,events:data.events,at:Date.now()}))}catch{}}
  function root(){return $('[data-view="seller"] .shell')}
  function activeSellerView(){
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view==='seller'));
    const map={dashboard:'home',offers:'offers',groups:'seller'};
    $$('.bottom-nav [data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===map[current]));
    document.documentElement.style.overflowY='auto';document.body.style.overflowY='auto';
  }
  function paintAvatar(b){
    const a=$('.avatar-mini'); if(!a||!b)return;
    a.classList.remove('has-business-logo');a.replaceChildren();
    if(b.logo_url){const img=document.createElement('img');img.src=b.logo_url;img.alt=b.name||'Logo';img.loading='eager';a.appendChild(img);a.classList.add('has-business-logo')}
    else a.textContent=(b.name||'E').trim().charAt(0).toUpperCase();
    const l=$('.account-label');if(l)l.textContent=b.name||'Empresa';
  }
  function shell(b){
    const name=b?.name||'Sua empresa', place=[b?.neighborhood,b?.city,b?.state].filter(Boolean).join(' · ');
    return `<div class="v84-app"><section class="v84-store"><div class="v84-logo">${b?.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(name)}">`:esc(name.charAt(0))}</div><div class="v84-store-copy"><span>JUNTA EMPRESAS</span><h1>${esc(name)}</h1><p>${esc(place||'Sua operação no Junta')}</p></div><b class="v84-live"><i></i> AO VIVO</b></section><nav class="v84-tabs"><button data-v84-tab="dashboard" class="${current==='dashboard'?'active':''}">Painel</button><button data-v84-tab="offers" class="${current==='offers'?'active':''}">Ofertas</button><button data-v84-tab="groups" class="${current==='groups'?'active':''}">Grupos</button><button data-v84-new>${icon('plus')} Nova oferta</button></nav><div class="v84-body">${body()}</div></div>`;
  }
  function body(){
    if(!data.loaded && !data.offers.length) return loadingBody();
    if(current==='offers')return offersBody();
    if(current==='groups')return groupsBody();
    return dashboardBody();
  }
  function loadingBody(){
    const title=current==='offers'?'Minhas ofertas':current==='groups'?'Meus grupos':'Visão geral';
    return `<section class="v84-section"><div class="v84-head"><div><span>${title.toUpperCase()}</span><h2>${esc(title)}</h2></div></div><div class="v84-skeleton-row"><i></i><i></i><i></i></div><p class="v84-loading-text">Atualizando dados reais…</p></section>`;
  }
  function stats(o){return Array.isArray(o.offer_stats)?(o.offer_stats[0]||{}):(o.offer_stats||{})}
  function dashboardBody(){
    const ss=data.offers.map(stats), views=ss.reduce((a,s)=>a+Number(s.view_count||0),0), interested=ss.reduce((a,s)=>a+Number(s.waitlist_count||0),0), clicks=ss.reduce((a,s)=>a+Number(s.join_click_count||0),0), active=data.offers.filter(o=>['scheduled','open'].includes(o.status)).length, conv=views?Math.round(interested/views*100):0;
    return `${data.error?errorBanner():''}<section class="v84-metrics"><article class="hot"><div>${icon('users')}</div><span>Interessados</span><strong>${interested}</strong><small>${clicks} cliques em entrar</small></article><article><div>${icon('eye')}</div><span>Visualizações</span><strong>${views}</strong><small>dados reais</small></article><article><div>${icon('bolt')}</div><span>Conversão</span><strong>${conv}%</strong><small>view → interesse</small></article><article><div>${icon('bag')}</div><span>Ofertas ativas</span><strong>${active}</strong><small>${data.offers.filter(o=>o.status==='pending').length} em análise</small></article></section><section class="v84-section"><div class="v84-head"><div><span>DESTAQUES</span><h2>Suas ofertas</h2></div><button data-v84-tab="offers">Ver todas</button></div>${data.offers.length?`<div class="v84-list">${data.offers.slice(0,3).map(offerRow).join('')}</div>`:empty('Você ainda não criou ofertas.')}</section>`;
  }
  function offersBody(){return `${data.error?errorBanner():''}<section class="v84-section"><div class="v84-head"><div><span>MINHAS OFERTAS</span><h2>Ofertas da empresa</h2><p>Toque para ver interessados, progresso e preço.</p></div><button data-v84-new>+ Nova oferta</button></div>${data.offers.length?`<div class="v84-list">${data.offers.map(offerRow).join('')}</div>`:empty('Nenhuma oferta cadastrada.')}</section>`}
  function groupsBody(){const rows=data.offers.filter(o=>['pending','scheduled','open'].includes(o.status));return `${data.error?errorBanner():''}<section class="v84-section"><div class="v84-head"><div><span>MEUS GRUPOS</span><h2>Grupos em andamento</h2><p>Acompanhe quantas pessoas estão se juntando em cada oferta.</p></div></div>${rows.length?`<div class="v84-groups">${rows.map(groupRow).join('')}</div>`:empty('Nenhum grupo em andamento.')}</section>`}
  function errorBanner(){return `<div class="v84-warn">A conexão demorou mais que o normal. Mostrando os últimos dados disponíveis. <button data-v84-retry>Atualizar</button></div>`}
  function empty(t){return `<div class="v84-empty"><b>${esc(t)}</b><p>Quando houver dados, eles aparecem aqui automaticamente.</p></div>`}
  function offerRow(o){const s=stats(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target);return `<button class="v84-offer" data-v84-offer="${o.id}"><div class="v84-photo">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:icon('bag')}</div><div class="v84-offer-main"><span class="v84-status">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3><div class="v84-progress"><i style="width:${p}%"></i></div><small>${w}/${target} pessoas · ${Number(s.view_count||0)} views</small></div><div class="v84-price"><s>${money(o.regular_price)}</s><b>${money(o.junta_price)}</b></div></button>`}
  function groupRow(o){const s=stats(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target);return `<button class="v84-group" data-v84-offer="${o.id}"><div><span>${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3></div><strong>${p}%</strong><div class="v84-progress wide"><i style="width:${p}%"></i></div><div class="v84-group-stats"><b>${w}<small>no grupo</small></b><b>${Math.max(0,target-w)}<small>faltam</small></b><b>${money(o.junta_price)}<small>preço atual</small></b></div></button>`}
  function render(){
    activeSellerView(); const r=root();if(!r)return;
    const b=context?.business||readCache()?.business||{};r.innerHTML=shell(b);paintAvatar(b);bind(r);
  }
  function bind(r){
    $$('[data-v84-tab]',r).forEach(b=>b.onclick=()=>show(b.dataset.v84Tab));
    $$('[data-v84-new]',r).forEach(b=>b.onclick=()=>{document.getElementById('newOfferBtn')?.click();setTimeout(()=>document.querySelector('[data-v60-new-offer]')?.click(),40)});
    $$('[data-v84-offer]',r).forEach(b=>b.onclick=()=>openOffer(data.offers.find(o=>o.id===b.dataset.v84Offer)));
    $('[data-v84-retry]',r)?.addEventListener('click',()=>refresh(),{once:true});
  }
  function openOffer(o){
    if(!o)return;const s=stats(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target);
    const d=document.createElement('div');d.className='v84-drawer';d.innerHTML=`<aside><button class="v84-close">×</button><span class="v84-kicker">${statusLabel(o.status)}</span><h2>${esc(o.title)}</h2>${o.image_url?`<img class="v84-detail-img" src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}<div class="v84-detail-metrics"><div><small>Interessados</small><b>${w}</b></div><div><small>Visualizações</small><b>${Number(s.view_count||0)}</b></div><div><small>Cliques</small><b>${Number(s.join_click_count||0)}</b></div></div><div class="v84-progress wide"><i style="width:${p}%"></i></div><p><b>${w} de ${target}</b> pessoas no grupo.</p><div class="v84-detail-price"><span>Preço atual <b>${money(o.junta_price)}</b></span><span>Preço normal <s>${money(o.regular_price)}</s></span></div><button class="v84-primary" data-v84-edit>Gerenciar oferta</button></aside>`;document.body.appendChild(d);document.body.classList.add('v84-modal-open');const close=()=>{d.remove();document.body.classList.remove('v84-modal-open')};$('.v84-close',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};$('[data-v84-edit]',d).onclick=()=>{close();if(window.JuntaSellerAppLegacy?.openOffer)window.JuntaSellerAppLegacy.openOffer(o)};
  }
  async function getContext(){
    if(context?.business?.id)return context;
    const gate=window.JuntaRoleGate; if(gate?.business?.id){context={profile:gate.profile,business:gate.business};return context}
    const {data:{session},error:sErr}=await timeout(db.auth.getSession(),1200);if(sErr)throw sErr;if(!session)throw new Error('Sessão expirada');
    const role=session.user.user_metadata?.account_type||'seller';
    const bp=timeout(db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),2200);
    const pp=timeout(db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(),2200).catch(()=>({data:{role}}));
    const [{data:business,error:bErr},{data:profile}]=await Promise.all([bp,pp]);if(bErr)throw bErr;context={profile:profile||{role},business};return context;
  }
  async function fetchData(token){
    const c=await getContext(); if(!c.business?.id)throw new Error('Empresa não encontrada');
    const since=new Date(Date.now()-7*86400000).toISOString();
    const offersP=timeout(db.from('offers').select('id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,min_sustainable_price,max_units,queue_target,status,created_at,last_price_drop_at,price_flash_until,offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count,shares_count),offer_price_tiers(people_count,unit_price)').eq('business_id',c.business.id).eq('is_demo',false).order('created_at',{ascending:false}),3200,'Ofertas demoraram para responder');
    const eventsP=timeout(db.from('analytics_events').select('event_type,offer_id,created_at').eq('business_id',c.business.id).gte('created_at',since).order('created_at',{ascending:true}),3200,'Analytics demorou para responder').catch(()=>({data:[],error:null}));
    const [{data:offers,error:oErr},{data:events}]=await Promise.all([offersP,eventsP]);if(oErr)throw oErr;if(token!==seq)return;
    data={offers:offers||[],events:events||[],loaded:true,error:''};saveCache();render();
  }
  function hydrateCache(){const c=readCache();if(c&&Date.now()-Number(c.at||0)<86400000){context={business:c.business};data={offers:c.offers||[],events:c.events||[],loaded:true,error:''}}}
  function show(next='dashboard'){
    current=['dashboard','offers','groups'].includes(next)?next:'dashboard';seq++;const token=seq;hydrateCache();render();
    fetchData(token).catch(err=>{if(token!==seq)return;console.warn('seller v84',err);data={...data,loaded:true,error:err?.message||'Falha de conexão'};render()});
  }
  function refresh(){seq++;const token=seq;data.error='';render();fetchData(token).catch(err=>{if(token!==seq)return;data={...data,loaded:true,error:err?.message||'Falha de conexão'};render()})}
  window.JuntaSellerAppLegacy=window.JuntaSellerApp;
  window.JuntaSellerApp={show,refresh,get section(){return current}};
  document.addEventListener('junta:v71-seller-nav',e=>show(e.detail?.section||'dashboard'));
  document.addEventListener('junta:v71-role-ready',()=>{if((window.JuntaRoleGate?.role||window.__JUNTA_ROLE)==='seller')show(current)});
  if((window.JuntaRoleGate?.role||window.__JUNTA_ROLE)==='seller')show('dashboard');
})();