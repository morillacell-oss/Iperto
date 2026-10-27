(() => {
  if (!window.supabase) return;
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const db=window.__JUNTA_DB||(window.__JUNTA_DB=window.supabase.createClient(SB_URL,SB_KEY));
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const toast=m=>window.showToast?window.showToast(m):console.log(m);
  const pct=(a,b)=>b?Math.min(100,Math.round(Number(a||0)/Number(b)*100)):0;
  const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${({home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z"/>',bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',users:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9"/>',eye:'<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',plus:'<path d="M12 5v14M5 12h14"/>'})[n]||''}</svg>`;
  const statusLabel=s=>({pending:'Em análise',scheduled:'Programada',open:'Aberta',closed:'Encerrada',sold_out:'Esgotada',draft:'Rascunho',cancelled:'Cancelada'})[s]||s||'—';
  const statusClass=s=>['open','scheduled'].includes(s)?'good':s==='pending'?'warn':'muted';
  let ctx=null, cache=null, cacheAt=0, rendering=false, section='dashboard';

  async function getContext(force=false){
    if(!force && ctx) return ctx;
    const {data:{session},error:sErr}=await db.auth.getSession(); if(sErr) throw sErr;
    if(!session) return ctx={session:null,profile:null,business:null};
    const {data:profile,error:pErr}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(); if(pErr) throw pErr;
    let business=null;
    if(profile?.role==='seller'){
      const {data,error}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(); if(error) throw error; business=data;
    }
    return ctx={session,profile,business};
  }

  function activateView(name){
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===name));
    const map={dashboard:'home',offers:'offers',groups:'seller'};
    $$('.bottom-nav [data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===map[section]));
    window.scrollTo({top:0,behavior:'instant'});
  }

  async function load(force=false){
    const c=await getContext(force);
    if(c.profile?.role!=='seller') throw new Error('Esta área é exclusiva da conta empresa.');
    if(!c.business?.id) return {c,offers:[],events:[]};
    if(!force && cache && Date.now()-cacheAt<12000) return {c,...cache};
    const since=new Date(Date.now()-7*86400000).toISOString();
    const [{data:offers,error:oErr},{data:events,error:eErr}] = await Promise.all([
      db.from('offers').select('id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,min_sustainable_price,max_units,queue_target,status,created_at,last_price_drop_at,price_flash_until,offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count,shares_count),offer_price_tiers(people_count,unit_price)').eq('business_id',c.business.id).eq('is_demo',false).order('created_at',{ascending:false}),
      db.from('analytics_events').select('event_type,offer_id,created_at').eq('business_id',c.business.id).gte('created_at',since).order('created_at',{ascending:true})
    ]);
    if(oErr) throw oErr; if(eErr) console.warn(eErr);
    cache={offers:offers||[],events:events||[]}; cacheAt=Date.now();
    return {c,...cache};
  }

  async function show(next='dashboard',force=false){
    if(rendering && !force) return;
    rendering=true; section=next;
    activateView('seller');
    const root=$('[data-view="seller"] .shell'); if(!root){rendering=false;return;}
    if(!root.querySelector('.v80-loading')) root.innerHTML='<div class="v70 seller-v60"><div class="v70-card v80-loading" style="min-height:220px;display:grid;place-items:center"><b>Carregando sua operação…</b></div></div>';
    try{
      const data=await load(force);
      if(!data.c.business?.onboarding_complete){ rendering=false; document.dispatchEvent(new Event('junta:v62-refresh')); return; }
      render(root,data,next);
    }catch(err){
      console.error('seller v80',err);
      root.innerHTML=`<div class="v70 seller-v60"><div class="v70-empty"><h3>Não conseguimos abrir o painel</h3><p>${esc(err.message||'Tente novamente.')}</p><button class="v70-primary" data-v80-retry>Tentar novamente</button></div></div>`;
      $('[data-v80-retry]',root)?.addEventListener('click',()=>show(next,true),{once:true});
    }finally{rendering=false;}
  }

  function stats(o){return Array.isArray(o.offer_stats)?(o.offer_stats[0]||{}):(o.offer_stats||{})}
  function tiers(o){return [...(o.offer_price_tiers||[])].sort((a,b)=>Number(a.people_count)-Number(b.people_count))}

  function render(root,{c,offers,events},tab){
    const b=c.business, all=offers.map(stats);
    const totals={views:all.reduce((a,s)=>a+Number(s.view_count||0),0),details:all.reduce((a,s)=>a+Number(s.detail_click_count||0),0),joins:all.reduce((a,s)=>a+Number(s.join_click_count||0),0),interested:all.reduce((a,s)=>a+Number(s.waitlist_count||0),0),active:offers.filter(o=>['open','scheduled'].includes(o.status)).length,pending:offers.filter(o=>o.status==='pending').length};
    root.innerHTML=`<div class="v70 seller-v60"><div class="v70-shell">
      <section class="v70-top"><div class="v70-store"><div class="v70-store-logo">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}">`:esc((b.name||'E')[0])}</div><div><span class="v70-eyebrow">JUNTA EMPRESAS</span><h1>${esc(b.name||'Sua empresa')}</h1><p>${esc([b.neighborhood,b.city,b.state].filter(Boolean).join(' · '))}</p></div></div><span class="v70-live"><i></i> DADOS AO VIVO</span></section>
      <nav class="v70-tabs"><button class="${tab==='dashboard'?'active':''}" data-v80-tab="dashboard">Painel</button><button class="${tab==='offers'?'active':''}" data-v80-tab="offers">Minhas ofertas</button><button class="${tab==='groups'?'active':''}" data-v80-tab="groups">Meus grupos</button><button data-v80-new>${icon('plus')} Nova oferta</button></nav>
      ${tab==='dashboard'?dashboard(offers,events,totals):tab==='offers'?offersView(offers):groupsView(offers)}
    </div></div>`;
    $$('[data-v80-tab]',root).forEach(x=>x.onclick=()=>show(x.dataset.v80Tab));
    $$('[data-v80-offer]',root).forEach(x=>x.onclick=()=>openOffer(offers.find(o=>o.id===x.dataset.v80Offer)));
    $$('[data-v80-new]',root).forEach(x=>x.onclick=()=>openCreate(c));
  }

  function dashboard(offers,events,t){
    const conv=t.views?Math.round(t.interested/t.views*100):0;
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
    const daily=days.map(d=>{const n=new Date(d);n.setDate(n.getDate()+1);return events.filter(e=>{const x=new Date(e.created_at);return x>=d&&x<n}).length}),max=Math.max(1,...daily);
    const best=[...offers].sort((a,b)=>Number(stats(b).waitlist_count||0)-Number(stats(a).waitlist_count||0)).slice(0,3);
    return `<section class="v70-grid4"><article class="v70-metric hot"><div class="mi">${icon('users')}</div><span>Interessados</span><strong>${t.interested}</strong><small>${t.joins} cliques em entrar</small></article><article class="v70-metric"><div class="mi">${icon('eye')}</div><span>Visualizações</span><strong>${t.views}</strong><small>${t.details} detalhes</small></article><article class="v70-metric"><div class="mi">${icon('home')}</div><span>Conversão</span><strong>${conv}%</strong><small>visualização → interesse</small></article><article class="v70-metric"><div class="mi">${icon('bolt')}</div><span>Ofertas ativas</span><strong>${t.active}</strong><small>${t.pending} em análise</small></article></section>
    <section class="v70-layout"><article class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">ÚLTIMOS 7 DIAS</span><h2>Movimento da sua vitrine</h2></div><span class="v70-chip">REAL</span></div><div class="v70-chart">${daily.map((n,i)=>`<div class="v70-chart-col"><i style="--h:${Math.max(7,Math.round(n/max*100))}%"><b>${n}</b></i><span>${['D','S','T','Q','Q','S','S'][days[i].getDay()]}</span></div>`).join('')}</div><div class="v70-funnel"><div><span>Views</span><strong>${t.views}</strong></div><div><span>Detalhes</span><strong>${t.details}</strong></div><div><span>Cliques</span><strong>${t.joins}</strong></div><div><span>No grupo</span><strong>${t.interested}</strong></div></div></article><article class="v70-card v70-insight"><span class="v70-eyebrow">PRÓXIMA AÇÃO</span><h2>${t.interested?'Seu grupo já tem tração.':'Hora de gerar movimento.'}</h2><p>${t.interested?'Abra a oferta e acompanhe o interesse. Se quiser acelerar, baixe o preço sem passar do seu piso.':'Crie uma oferta forte e acompanhe as primeiras pessoas entrando.'}</p><button class="v70-soft" data-v80-tab="offers">Ver minhas ofertas</button></article></section>
    <section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">DESTAQUES</span><h2>Grupos com mais interesse</h2></div></div>${best.length?`<div class="v70-list">${best.map(offerRow).join('')}</div>`:`<div class="v70-empty"><h3>Nenhuma oferta ainda</h3><p>Crie sua primeira oferta para começar.</p></div>`}</section>`;
  }

  function offersView(rows){return `<section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">MINHAS OFERTAS</span><h2>Abra, acompanhe e ajuste</h2><p>Toque em uma oferta para ver tudo.</p></div><button class="v70-primary" data-v80-new>${icon('plus')} Nova oferta</button></div>${rows.length?`<div class="v70-list">${rows.map(offerRow).join('')}</div>`:`<div class="v70-empty"><h3>Nenhuma oferta</h3></div>`}</section>`}
  function groupsView(rows){const a=rows.filter(o=>['pending','scheduled','open'].includes(o.status));return `<section class="v70-card"><div class="v70-card-head"><div><span class="v70-eyebrow">MEUS GRUPOS</span><h2>Grupos em andamento</h2></div><span class="v70-chip">${a.length}</span></div>${a.length?`<div class="v70-list">${a.map(groupRow).join('')}</div>`:`<div class="v70-empty"><h3>Nenhum grupo em andamento</h3></div>`}</section>`}
  function offerRow(o){const s=stats(o),w=Number(s.waitlist_count||0),t=Number(o.queue_target||25),p=pct(w,t);return `<button class="v70-offer" data-v80-offer="${o.id}"><div class="v70-offer-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:icon('bag')}</div><div class="v70-offer-main"><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3><div class="v70-progress"><i style="--p:${p}%"></i></div><div class="v70-offer-meta"><span>${w}/${t} pessoas</span><span>${Number(s.view_count||0)} views</span></div></div><div class="v70-offer-price"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div></button>`}
  function groupRow(o){const s=stats(o),w=Number(s.waitlist_count||0),t=Number(o.queue_target||25),p=pct(w,t);return `<button class="v70-group-card" data-v80-offer="${o.id}" style="width:100%;text-align:left;color:inherit"><div class="v70-group-title"><div><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3></div><strong>${p}%</strong></div><div class="v70-progress"><i style="--p:${p}%"></i></div><div class="v70-group-numbers"><div><span>NO GRUPO</span><b>${w}</b></div><div><span>FALTAM</span><b>${Math.max(0,t-w)}</b></div><div><span>PREÇO</span><b>${money(o.junta_price)}</b></div></div></button>`}

  function openOffer(o){
    if(!o)return; const s=stats(o),ts=tiers(o),w=Number(s.waitlist_count||0),t=Number(o.queue_target||25),p=pct(w,t),floor=Number(o.min_sustainable_price||0),can=['pending','scheduled','open'].includes(o.status)&&Number(o.junta_price)>floor;
    const d=document.createElement('div');d.className='v70-drawer';d.innerHTML=`<aside class="v70-drawer-panel"><button class="v70-drawer-close">×</button><div class="v70-detail-cover">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:''}</div><div class="v70-detail-head"><span class="v70-status ${statusClass(o.status)}">${statusLabel(o.status)}</span><h2>${esc(o.title)}</h2><div class="v70-detail-price"><s>${money(o.previous_junta_price||o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div></div><div class="v70-detail-grid"><div><span>INTERESSADOS</span><b>${w}</b></div><div><span>VISUALIZAÇÕES</span><b>${Number(s.view_count||0)}</b></div><div><span>CLIQUES</span><b>${Number(s.detail_click_count||0)}</b></div></div><div class="v70-progress"><i style="--p:${p}%"></i></div><section class="v70-card" style="margin-top:15px;box-shadow:none"><span class="v70-eyebrow">FAIXAS</span><div class="v70-tiers">${ts.map(x=>`<div class="v70-tier"><span>${x.people_count} pessoas</span><strong>${money(x.unit_price)}</strong></div>`).join('')}</div></section>${can?`<section class="v70-lower-box"><span class="v70-eyebrow">AÇÃO COMERCIAL</span><h3>Baixar o preço agora</h3><p>A redução vira destaque para compradores da sua região por 48 horas.</p><form class="v80-lower"><input name="price" type="number" step="0.01" min="${floor}" max="${Math.max(floor,Number(o.junta_price)-.01)}" value="${Math.max(floor,Number(o.junta_price)-.10).toFixed(2)}" required><button class="v70-primary">${icon('bolt')} Baixar preço</button></form><small>Piso sustentável: <b>${money(floor)}</b></small></section>`:''}</aside>`;document.body.appendChild(d);
    const close=()=>d.remove(); $('.v70-drawer-close',d).onclick=close; d.onclick=e=>{if(e.target===d)close()};
    const f=$('.v80-lower',d); if(f) f.onsubmit=async e=>{e.preventDefault();const btn=$('button',f),n=Number(new FormData(f).get('price'));btn.disabled=true;btn.textContent='Atualizando…';try{const {error}=await db.rpc('seller_lower_offer_prices',{p_offer_id:o.id,p_new_lowest:n});if(error)throw error;cache=null;toast('Preço baixou! Destaque ativado ⚡');close();await show(section,true);}catch(err){toast(err.message||'Não foi possível alterar');btn.disabled=false;btn.textContent='Baixar preço'}};
  }

  function openCreate(c){
    const d=document.createElement('div');d.className='v70-drawer';d.innerHTML=`<aside class="v70-drawer-panel"><button class="v70-drawer-close">×</button><div class="v70-detail-head"><span class="v70-eyebrow">NOVA OFERTA</span><h2>Crie uma oferta forte.</h2></div><p>Use o botão “Nova oferta” do painel atual. O fluxo de cadastro completo permanece conectado ao formulário validado do Junta.</p><button class="v70-primary v80-use-legacy">Abrir cadastro de oferta</button></aside>`;document.body.appendChild(d);const close=()=>d.remove();$('.v70-drawer-close',d).onclick=close;d.onclick=e=>{if(e.target===d)close()};$('.v80-use-legacy',d).onclick=()=>{close();document.getElementById('newOfferBtn')?.click();setTimeout(()=>document.querySelector('[data-v60-new-offer]')?.click(),50)};
  }

  function invalidate(){cache=null;cacheAt=0;}
  window.JuntaSellerApp={show,refresh:()=>{invalidate();return show(section,true)},invalidate,get section(){return section}};
  document.addEventListener('junta:v71-seller-nav',e=>show(e.detail?.section||'dashboard'));
  db.auth.onAuthStateChange(()=>{ctx=null;invalidate()});
})();