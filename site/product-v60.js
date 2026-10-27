(() => {
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  if(!window.supabase) return;
  const db=window.supabase.createClient(SB_URL,SB_KEY);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const toast=m=>window.showToast?window.showToast(m):alert(m);
  const CATS=[['celulares','Celulares'],['eletronicos','Eletrônicos'],['ferramentas','Ferramentas'],['roupas','Roupas'],['moda','Calçados'],['restaurantes','Restaurantes'],['pizzarias','Pizzarias'],['comida','Lanches'],['mercado','Mercado'],['casa','Casa'],['beleza','Beleza'],['pet','Pet'],['automotivo','Automotivo']];
  let busy=false;

  function go(view){
    if(typeof window.navigate==='function') window.navigate(view);
    else {
      $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }
  async function ctx(){
    const {data:{session}}=await db.auth.getSession();
    if(!session) return {session:null,profile:null,business:null};
    const {data:profile}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();
    let business=null;
    if(profile?.role==='seller'){
      const {data}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
      business=data;
    }
    return {session,profile,business};
  }
  function statusLabel(s){return ({pending:'Em análise',scheduled:'Programada',open:'Aberta',closed:'Encerrada',sold_out:'Esgotada',draft:'Rascunho',cancelled:'Cancelada'})[s]||s||'—'}
  function statusClass(s){return ['open','scheduled'].includes(s)?'good':s==='pending'?'warn':['closed','sold_out'].includes(s)?'muted':'neutral'}
  function pct(a,b){return b>0?Math.round((a/b)*100):0}
  function svgIcon(name){
    const p={chart:'<path d="M4 19V9m6 10V5m6 14v-7m4 7V3"/>',eye:'<path d="M2 12s3.7-6 10-6 10 6 10 6-3.7 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',plus:'<path d="M12 5v14M5 12h14"/>',pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'};
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[name]||p.bolt}</svg>`;
  }

  async function renderSellerPremium(root,c){
    const b=c.business;
    if(!b?.onboarding_complete) return; // keep existing onboarding flow
    const [{data:offers,error:oErr},{data:events,error:eErr}] = await Promise.all([
      db.from('offers').select('id,title,description,category,image_url,regular_price,junta_price,min_sustainable_price,min_paid,max_units,queue_target,status,created_at,opens_at,closes_at,offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count,shares_count),offer_price_tiers(people_count,unit_price)').eq('business_id',b.id).eq('is_demo',false).order('created_at',{ascending:false}),
      db.from('analytics_events').select('event_type,offer_id,created_at').eq('business_id',b.id).gte('created_at',new Date(Date.now()-30*86400000).toISOString()).order('created_at',{ascending:true})
    ]);
    if(oErr){console.error(oErr);return}
    const rows=offers||[]; const ev=events||[];
    const sum=(key)=>rows.reduce((a,o)=>a+Number(o.offer_stats?.[key]||0),0);
    const views=sum('view_count'),detail=sum('detail_click_count'),joinClicks=sum('join_click_count'),interested=sum('waitlist_count');
    const active=rows.filter(o=>['open','scheduled'].includes(o.status)).length,pending=rows.filter(o=>o.status==='pending').length;
    const conversion=pct(interested,Math.max(views,1));
    const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));return d});
    const daily=days.map(d=>{const next=new Date(d);next.setDate(d.getDate()+1);return ev.filter(x=>{const t=new Date(x.created_at);return t>=d&&t<next}).length});
    const maxDay=Math.max(1,...daily);
    const top=[...rows].sort((a,z)=>Number(z.offer_stats?.waitlist_count||0)-Number(a.offer_stats?.waitlist_count||0)).slice(0,4);
    root.innerHTML=`<div class="v60 seller-v60">
      <section class="v60-hero seller-hero-v60">
        <div class="v60-brand-block">
          <div class="v60-logo-wrap">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(b.name)}">`:`<span>${esc((b.name||'J').slice(0,1))}</span>`}</div>
          <div><span class="v60-kicker">JUNTA EMPRESAS</span><h1>${esc(b.name||'Sua empresa')}</h1><p>${esc([b.neighborhood,b.city,b.state].filter(Boolean).join(' · '))}</p></div>
        </div>
        <div class="v60-hero-actions"><span class="v60-status ${b.verified?'good':'warn'}">${b.verified?'● Empresa verificada':'● Em revisão'}</span><button class="v60-btn primary" data-v60-new>${svgIcon('plus')} Nova oferta</button></div>
      </section>

      <section class="v60-kpi-grid">
        <article class="v60-kpi hot"><div class="v60-kpi-icon">${svgIcon('users')}</div><span>Pessoas interessadas</span><strong>${interested}</strong><small>${interested?`${joinClicks} cliques em entrar`:'Ainda sem entradas'}</small></article>
        <article class="v60-kpi"><div class="v60-kpi-icon">${svgIcon('eye')}</div><span>Visualizações</span><strong>${views}</strong><small>${detail} abriram detalhes</small></article>
        <article class="v60-kpi"><div class="v60-kpi-icon">${svgIcon('chart')}</div><span>Conversão em interesse</span><strong>${conversion}%</strong><small>visualização → grupo</small></article>
        <article class="v60-kpi"><div class="v60-kpi-icon">${svgIcon('bolt')}</div><span>Ofertas ativas</span><strong>${active}</strong><small>${pending} em análise</small></article>
      </section>

      <section class="v60-main-grid">
        <article class="v60-panel v60-performance">
          <div class="v60-panel-head"><div><span class="v60-kicker">ÚLTIMOS 7 DIAS</span><h2>Movimento nas ofertas</h2></div><span class="v60-real">DADOS REAIS</span></div>
          <div class="v60-bars">${daily.map((n,i)=>`<div class="v60-bar-col"><i style="--h:${Math.max(8,Math.round(n/maxDay*100))}%"><b>${n}</b></i><span>${['D','S','T','Q','Q','S','S'][days[i].getDay()]}</span></div>`).join('')}</div>
          <div class="v60-funnel"><div><span>Visualizações</span><strong>${views}</strong></div><i></i><div><span>Detalhes</span><strong>${detail}</strong></div><i></i><div><span>Entrar</span><strong>${joinClicks}</strong></div><i></i><div><span>No grupo</span><strong>${interested}</strong></div></div>
        </article>
        <article class="v60-panel v60-insight">
          <div class="v60-panel-head"><div><span class="v60-kicker">LEITURA RÁPIDA</span><h2>O que fazer agora</h2></div></div>
          ${rows.length?`<div class="v60-insight-card"><span class="v60-insight-icon">${svgIcon('bolt')}</span><div><b>${pending?'Você tem oferta aguardando análise':'Sua vitrine já está no ar'}</b><p>${pending?`${pending} oferta${pending>1?'s':''} precisa${pending>1?'m':''} de aprovação antes de aparecer para compradores.`: interested?`Sua melhor oferta já gerou interesse real. Compartilhar o grupo pode acelerar a próxima faixa de preço.`:'Suas ofertas ainda estão começando. As primeiras visualizações e entradas aparecerão aqui em tempo real.'}</p></div></div>`:`<div class="v60-empty-mini"><b>Crie sua primeira oferta</b><p>Defina preço normal, piso sustentável e faixas de 5 a 25 pessoas.</p></div>`}
        </article>
      </section>

      <section class="v60-panel v60-offers-panel">
        <div class="v60-panel-head"><div><span class="v60-kicker">SUAS OFERTAS</span><h2>Desempenho por grupo</h2></div><button class="v60-btn soft" data-v60-new>${svgIcon('plus')} Criar oferta</button></div>
        <div class="v60-offer-list">${rows.length?rows.map(o=>sellerOfferRow(o)).join(''):`<div class="v60-empty-state"><div>${svgIcon('bag')}</div><h3>Nenhuma oferta criada ainda</h3><p>Crie um grupo e acompanhe cada visualização, clique e pessoa interessada daqui.</p><button class="v60-btn primary" data-v60-new>Criar primeira oferta</button></div>`}</div>
      </section>
    </div>`;
    $$('[data-v60-new]',root).forEach(b=>b.onclick=()=>openNewOffer(c));
  }

  function sellerOfferRow(o){
    const s=o.offer_stats||{},tiers=[...(o.offer_price_tiers||[])].sort((a,b)=>a.people_count-b.people_count),wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),progress=Math.min(100,pct(wait,target));
    const next=tiers.find(t=>t.people_count>wait)||tiers[tiers.length-1];
    return `<article class="v60-offer-row">
      <div class="v60-offer-thumb">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:`<span>${svgIcon('bag')}</span>`}</div>
      <div class="v60-offer-core"><div class="v60-offer-title"><div><span class="v60-pill ${statusClass(o.status)}">${statusLabel(o.status)}</span><h3>${esc(o.title)}</h3></div><strong>${money(o.junta_price)}</strong></div>
        <div class="v60-progress-label"><span>${wait} de ${target} pessoas</span><b>${progress}%</b></div><div class="v60-progress"><i style="--p:${progress}%"></i></div>
        <div class="v60-offer-metrics"><span>${svgIcon('eye')} ${Number(s.view_count||0)} views</span><span>${svgIcon('search')} ${Number(s.detail_click_count||0)} detalhes</span><span>${svgIcon('users')} ${wait} no grupo</span><span>${next?`Próxima faixa: ${next.people_count} por ${money(next.unit_price)}`:'Faixas completas'}</span></div>
      </div>
    </article>`;
  }

  async function renderBuyerPremium(root,c){
    const p=c.profile;
    if(!p||p.role!=='buyer') return;
    const [{data:waitlist},{data:orders}]=await Promise.all([
      db.from('offer_waitlist').select('created_at,offer_id,offers(id,title,image_url,junta_price,regular_price,queue_target,status,businesses(name,city,state),offer_stats(waitlist_count))').eq('user_id',c.session.user.id).order('created_at',{ascending:false}),
      db.from('orders').select('id,offer_id,total_amount,payment_status,order_status,created_at').eq('user_id',c.session.user.id).order('created_at',{ascending:false})
    ]);
    let local=[];
    if(p.city&&p.state){
      const {data}=await db.from('offers').select('id,title,image_url,regular_price,junta_price,queue_target,status,category,businesses!inner(name,city,state,postal_code,neighborhood,status,verified),offer_stats(waitlist_count)').eq('is_demo',false).in('status',['scheduled','open']).eq('businesses.status','approved').ilike('businesses.city',p.city).eq('businesses.state',p.state).order('created_at',{ascending:false});
      local=data||[];
    }
    const joined=waitlist||[];
    root.innerHTML=`<div class="v60 buyer-v60">
      <section class="v60-hero buyer-hero-v60"><div><span class="v60-kicker">OLÁ, ${esc((p.display_name||'COMPRADOR').toUpperCase())}</span><h1>Seus grupos.<br><span>Perto de você.</span></h1><p>Entre em grupos reais da sua região e acompanhe o preço cair conforme mais pessoas entram.</p></div><button class="v60-btn soft" data-v60-cep>${svgIcon('pin')} ${p.postal_code?'Alterar CEP':'Definir CEP'}</button></section>
      <section class="v60-location-card"><div class="v60-location-icon">${svgIcon('pin')}</div><div><span>SUA REGIÃO</span><strong>${p.city?esc([p.neighborhood,p.city,p.state].filter(Boolean).join(' · ')):'Região ainda não definida'}</strong><small>${p.postal_code?`CEP ${esc(formatCep(p.postal_code))}`:'Informe seu CEP para ver ofertas reais próximas.'}</small></div><button data-v60-cep>Alterar</button></section>
      <section class="v60-kpi-grid buyer-kpis"><article class="v60-kpi hot"><div class="v60-kpi-icon">${svgIcon('users')}</div><span>Grupos que você entrou</span><strong>${joined.length}</strong><small>${joined.length?'Acompanhe abaixo':'Entre no seu primeiro grupo'}</small></article><article class="v60-kpi"><div class="v60-kpi-icon">${svgIcon('pin')}</div><span>Ofertas na sua região</span><strong>${local.length}</strong><small>${p.city?esc(`${p.city} · ${p.state}`):'Defina seu CEP'}</small></article><article class="v60-kpi"><div class="v60-kpi-icon">${svgIcon('bag')}</div><span>Compras</span><strong>${(orders||[]).length}</strong><small>${(orders||[]).length?'Histórico da sua conta':'Nenhuma compra ainda'}</small></article></section>

      <section class="v60-panel"><div class="v60-panel-head"><div><span class="v60-kicker">PERTO DE VOCÊ</span><h2>Grupos disponíveis agora</h2></div>${p.city?`<span class="v60-real">${esc(p.city)}</span>`:''}</div>
        <div class="v60-buyer-grid">${!p.postal_code?buyerNoCep():local.length?local.map(o=>buyerOfferCard(o,joined)).join(''):buyerEmptyRegion()}</div>
      </section>
      <section class="v60-panel"><div class="v60-panel-head"><div><span class="v60-kicker">SEUS GRUPOS</span><h2>Você está acompanhando</h2></div></div><div class="v60-joined-list">${joined.length?joined.map(w=>joinedCard(w)).join(''):`<div class="v60-empty-state compact"><div>${svgIcon('users')}</div><h3>Você ainda não entrou em nenhum grupo</h3><p>Quando entrar, o progresso e as próximas faixas vão aparecer aqui.</p><button class="v60-btn primary" data-v60-offers>Explorar ofertas</button></div>`}</div></section>
    </div>`;
    $$('[data-v60-cep]',root).forEach(b=>b.onclick=()=>openCepPremium(c,root));
    $$('[data-v60-offers]',root).forEach(b=>b.onclick=()=>go('offers'));
    $$('[data-v60-join]',root).forEach(b=>b.onclick=()=>joinOffer(c,b.dataset.v60Join,root));
  }
  function formatCep(v=''){const d=String(v).replace(/\D/g,'').slice(0,8);return d.length===8?`${d.slice(0,5)}-${d.slice(5)}`:d}
  function buyerNoCep(){return `<div class="v60-empty-state"><div>${svgIcon('pin')}</div><h3>Defina sua região</h3><p>Digite seu CEP para o Junta mostrar somente grupos reais de comércios próximos.</p><button class="v60-btn primary" data-v60-cep>Informar CEP</button></div>`}
  function buyerEmptyRegion(){return `<div class="v60-empty-state"><div>${svgIcon('pin')}</div><h3>No momento não há ofertas na sua região.</h3><p>Novos comércios entram no Junta constantemente. Volte em breve para ver os próximos grupos.</p></div>`}
  function buyerOfferCard(o,joined){
    const s=o.offer_stats||{},wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),isJoined=joined.some(w=>w.offer_id===o.id),left=Math.max(0,target-wait),pr=Math.min(100,pct(wait,target));
    return `<article class="v60-buyer-card"><div class="v60-buyer-media"><img src="${esc(o.image_url||'')}" alt="${esc(o.title)}"><span>${wait}/${target} NO GRUPO</span></div><div class="v60-buyer-body"><small>${esc(o.businesses?.name||'Comércio local')}</small><h3>${esc(o.title)}</h3><div class="v60-price-line"><s>${money(o.regular_price)}</s><strong>${money(o.junta_price)}</strong></div><div class="v60-progress"><i style="--p:${pr}%"></i></div><div class="v60-progress-label"><span>${left?`Faltam ${left} para a meta`:'Meta atingida'}</span><b>${pr}%</b></div><button class="v60-btn ${isJoined?'soft':'primary'}" ${isJoined?'disabled':''} data-v60-join="${o.id}">${isJoined?'Você está no grupo':'Entrar no grupo'}</button></div></article>`
  }
  function joinedCard(w){const o=w.offers||{},s=o.offer_stats||{},wait=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pr=Math.min(100,pct(wait,target));return `<article class="v60-joined-card"><div>${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:svgIcon('bag')}</div><section><span>${esc(o.businesses?.name||'Comércio')}</span><h3>${esc(o.title||'Grupo')}</h3><div class="v60-progress"><i style="--p:${pr}%"></i></div><small>${wait} de ${target} pessoas · ${pr}%</small></section><strong>${money(o.junta_price)}</strong></article>`}

  async function joinOffer(c,id,root){
    if(busy)return;busy=true;
    try{
      const {error}=await db.from('offer_waitlist').upsert({offer_id:id,user_id:c.session.user.id},{onConflict:'offer_id,user_id',ignoreDuplicates:true}); if(error)throw error;
      await db.from('analytics_events').insert({user_id:c.session.user.id,event_type:'join_group',offer_id:id,metadata:{source:'buyer_dashboard_v60'}}).catch(()=>{});
      toast('Você entrou no grupo ✓');await renderBuyerPremium(root,c);
    }catch(e){toast(e.message||'Não foi possível entrar no grupo')}finally{busy=false}
  }

  function openCepPremium(c,root){
    const modal=document.createElement('div');modal.className='v60-modal';modal.innerHTML=`<div class="v60-modal-card"><button class="v60-x">×</button><div class="v60-modal-icon">${svgIcon('pin')}</div><span class="v60-kicker">SUA REGIÃO</span><h2>Qual é o seu CEP?</h2><p>Usamos apenas cidade e bairro para encontrar grupos reais próximos. Você não precisa informar o número da sua casa.</p><form><label>CEP<input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" value="${esc(formatCep(c.profile?.postal_code||''))}" placeholder="00000-000" required></label><button class="v60-btn primary" type="submit">Encontrar ofertas</button></form><div class="v60-modal-result"></div></div>`;document.body.appendChild(modal);
    const input=$('input',modal);input.oninput=()=>input.value=formatCep(input.value);$('.v60-x',modal).onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
    $('form',modal).onsubmit=async e=>{e.preventDefault();const btn=$('button[type=submit]',modal),cep=String(new FormData(e.currentTarget).get('cep')).replace(/\D/g,'');if(cep.length!==8){toast('Digite um CEP válido');return}btn.disabled=true;btn.textContent='Buscando...';try{const r=await fetch(`${SB_URL}/functions/v1/lookup-cep?cep=${cep}`,{headers:{Accept:'application/json'}});const d=await r.json();if(!r.ok||d.error)throw new Error(d.error||'Não conseguimos consultar esse CEP');const {error}=await db.from('profiles').update({postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''}).eq('user_id',c.session.user.id);if(error)throw error;c.profile={...c.profile,postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''};modal.remove();toast('Região atualizada ✓');await renderBuyerPremium(root,c)}catch(err){$('.v60-modal-result',modal).innerHTML=`<b>Não conseguimos consultar esse CEP</b><span>${esc(err.message||'Tente novamente em instantes.')}</span>`;$('.v60-modal-result',modal).classList.add('show')}finally{btn.disabled=false;btn.textContent='Encontrar ofertas'}};
  }

  function openNewOffer(c){
    const modal=document.createElement('div');modal.className='v60-modal';modal.innerHTML=`<div class="v60-modal-card wide"><button class="v60-x">×</button><span class="v60-kicker">NOVA OFERTA</span><h2>Monte um grupo que vale a pena.</h2><p>O Junta usa faixas progressivas: quanto mais gente entra, menor precisa ficar o preço.</p><form class="v60-offer-form">
      <div class="v60-form-grid"><label>Produto<input name="title" required placeholder="Ex.: Smash duplo"></label><label>Categoria<select name="category" required>${CATS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label></div>
      <label>Descrição<textarea name="description" rows="3" placeholder="O que está incluso, retirada, detalhes importantes..."></textarea></label>
      <label class="v60-file">Foto do produto<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required><span>Escolher foto</span></label>
      <div class="v60-form-grid"><label>Preço normal (R$)<input name="regular" type="number" step="0.01" min="1" required></label><label>Menor preço sustentável (R$)<input name="floor" type="number" step="0.01" min="1" required></label></div>
      <label>Quantidade disponível<input name="stock" type="number" min="25" value="25" required></label>
      <div class="v60-tier-box"><div><span class="v60-kicker">PREÇO POR VOLUME</span><b>Quanto mais gente, menor o valor</b></div><div class="v60-tier-grid">${[5,10,15,20,25].map(n=>`<label>${n} pessoas<input name="tier${n}" type="number" step="0.01" min="0" required></label>`).join('')}</div><small>O sistema não permite preços abaixo do seu piso sustentável nem uma faixa maior mais cara que a anterior.</small></div>
      <button class="v60-btn primary" type="submit">Enviar para análise</button>
    </form><div class="v60-modal-result"></div></div>`;document.body.appendChild(modal);$('.v60-x',modal).onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
    const form=$('form',modal),regular=$('[name=regular]',form),floor=$('[name=floor]',form),tierInputs=[5,10,15,20,25].map(n=>$(`[name=tier${n}]`,form));
    function suggest(){const r=Number(regular.value),f=Number(floor.value);if(!r||!f||f>r)return;[.02,.04,.06,.08,.10].forEach((d,i)=>{tierInputs[i].value=Math.max(f,r*(1-d)).toFixed(2)})}regular.oninput=suggest;floor.oninput=suggest;
    form.onsubmit=async e=>{e.preventDefault();const btn=$('button[type=submit]',form);btn.disabled=true;btn.textContent='Enviando...';try{const fd=new FormData(form),r=Number(fd.get('regular')),f=Number(fd.get('floor')),stock=Number(fd.get('stock')),prices=[5,10,15,20,25].map(n=>Number(fd.get(`tier${n}`)));if(f>r)throw new Error('O menor preço sustentável não pode ser maior que o preço normal.');for(let i=0;i<prices.length;i++){if(prices[i]<f)throw new Error(`A faixa de ${[5,10,15,20,25][i]} pessoas ficou abaixo do seu preço sustentável.`);if(prices[i]>=r)throw new Error('Toda faixa precisa ser mais barata que o preço normal.');if(i&&prices[i]>prices[i-1])throw new Error('Quanto mais pessoas, o preço precisa cair ou permanecer igual.')}const file=fd.get('photo');if(!file||!file.size)throw new Error('A foto do produto é obrigatória.');const path=`${c.session.user.id}/offer-${Date.now()}-${String(file.name).replace(/[^a-zA-Z0-9._-]/g,'')}`;const up=await db.storage.from('listing-images').upload(path,file,{upsert:false});if(up.error)throw up.error;const {data:pub}=db.storage.from('listing-images').getPublicUrl(path);const now=new Date(),close=new Date(Date.now()+7*86400000);const {data:offer,error}=await db.from('offers').insert({business_id:c.business.id,created_by:c.session.user.id,title:String(fd.get('title')).trim(),description:String(fd.get('description')||'').trim(),category:fd.get('category'),image_url:pub.publicUrl,regular_price:r,junta_price:prices[4],min_sustainable_price:f,min_paid:5,max_units:stock,queue_target:25,opens_at:now.toISOString(),closes_at:close.toISOString(),status:'pending',featured:false,is_demo:false,demo_seed_count:0,price_review_status:'unreviewed'}).select('id').single();if(error)throw error;const {error:tErr}=await db.from('offer_price_tiers').insert([5,10,15,20,25].map((n,i)=>({offer_id:offer.id,people_count:n,unit_price:prices[i]})));if(tErr)throw tErr;modal.remove();toast('Oferta enviada para análise ✓');const view=$('[data-view="seller"] .shell');if(view)await renderSellerPremium(view,c)}catch(err){const box=$('.v60-modal-result',modal);box.innerHTML=`<b>Não foi possível enviar</b><span>${esc(err.message||'Revise os dados e tente novamente.')}</span>`;box.classList.add('show')}finally{btn.disabled=false;btn.textContent='Enviar para análise'}};
  }

  async function enhance(){
    if(busy)return;
    const active=$('.view.active')?.dataset.view; if(!['seller','account'].includes(active))return;
    const c=await ctx(); if(!c.session||!c.profile)return;
    if(active==='seller'&&c.profile.role==='seller'&&c.business?.onboarding_complete){const root=$('[data-view="seller"] .shell');if(root&&!root.querySelector('.seller-v60'))renderSellerPremium(root,c)}
    if(active==='account'&&c.profile.role==='buyer'){const root=$('[data-view="account"] .shell');if(root&&!root.querySelector('.buyer-v60'))renderBuyerPremium(root,c)}
  }

  const mo=new MutationObserver(()=>setTimeout(enhance,80));
  window.addEventListener('load',()=>{mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});setTimeout(enhance,500)});
  document.addEventListener('click',()=>setTimeout(enhance,180),true);
  window.addEventListener('hashchange',()=>setTimeout(enhance,180));
})();