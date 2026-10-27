import { rmSync, mkdirSync, cpSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('site', 'dist', { recursive: true });
copyFileSync('favicon.svg', 'dist/favicon.svg');
copyFileSync('manifest.webmanifest', 'dist/manifest.webmanifest');

const appPath = 'dist/app-v100.js';
let app = readFileSync(appPath, 'utf8');

function replaceChecked(label, regex, replacement) {
  const before = app;
  app = app.replace(regex, replacement);
  if (app === before) throw new Error(`Patch V103 não aplicado: ${label}`);
}

replaceChecked(
  'seller group cancellation',
  /  function openSellerOffer\(o\)\{[\s\S]*?\n  \}\n\n  function openCreateOffer/,
  `  function openSellerOffer(o){
    if(!o)return;
    const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),floor=Number(o.min_sustainable_price||0),current=Number(o.junta_price||0),ts=tiersOf(o),paid=Number(s.paid_count||0);
    const canLower=['pending','scheduled','open'].includes(o.status)&&current>floor;
    const canCancel=['pending','scheduled','open'].includes(o.status)&&paid===0;
    openOverlay(\`<div class="j-modal" style="width:min(650px,100%)"><div class="j-modal-head"><div><span class="j-status \${o.status==='pending'?'pending':''}">\${statusLabel(o.status)}</span><h2>\${esc(o.title)}</h2></div><button class="j-close" data-close>×</button></div>\${o.image_url?\`<img src="\${esc(o.image_url)}" alt="\${esc(o.title)}" style="width:100%;height:230px;object-fit:cover;border-radius:20px">\`:''}<div class="j-metrics" style="margin:14px 0"><article class="j-metric"><span>INTERESSADOS</span><strong>\${w}</strong></article><article class="j-metric"><span>VIEWS</span><strong>\${Number(s.view_count||0)}</strong></article><article class="j-metric"><span>CLIQUES</span><strong>\${Number(s.detail_click_count||0)}</strong></article><article class="j-metric"><span>PROGRESSO</span><strong>\${pct(w,target)}%</strong></article></div><div class="j-progress"><i style="width:\${pct(w,target)}%"></i></div><div class="j-progress-meta"><span>\${w} de \${target} pessoas</span><span>faltam \${Math.max(0,target-w)}</span></div><section style="margin-top:18px"><span class="j-kicker">FAIXAS</span><div class="j-tiers" style="margin-top:10px">\${ts.map(t=>\`<div class="j-tier"><span>\${t.people_count} pessoas</span><strong>\${money(t.unit_price)}</strong></div>\`).join('')}</div></section>\${canLower?\`<section class="j-price-action"><span class="j-kicker">AÇÃO COMERCIAL</span><h3>Baixar o preço agora</h3><p>A redução real pode virar destaque para compradores da sua região por 48 horas. O preço nunca pode passar abaixo do piso sustentável.</p><div class="j-price-field"><label>Novo menor preço</label><input id="lowerPriceInput" type="number" step="0.01" min="\${floor}" max="\${Math.max(floor,current-.01)}" value="\${Math.max(floor,current-.10).toFixed(2)}"></div><div class="j-quickcuts"><button data-cut="3">-3%</button><button data-cut="5">-5%</button><button data-cut="10">-10%</button></div><div class="j-floor">Piso sustentável: <b>\${money(floor)}</b></div><button class="j-btn primary" id="lowerPriceBtn">\${icon('bolt')} Baixar preço</button></section>\`:''}\${canCancel?\`<section class="j-cancel-action"><div><span class="j-kicker">CONTROLE DO GRUPO</span><h3>Cancelar este grupo</h3><p>Use somente se você realmente não for continuar. Os participantes serão retirados do grupo ativo e verão “Grupo cancelado · incompleto” no histórico.</p></div><button class="j-btn danger" id="cancelGroupBtn">Cancelar grupo</button></section>\`:''}</div>\`);
    if(canLower){
      const inp=$('#lowerPriceInput',overlay);
      $$('[data-cut]',overlay).forEach(b=>b.onclick=()=>{inp.value=Math.max(floor,current*(1-Number(b.dataset.cut)/100)).toFixed(2)});
      $('#lowerPriceBtn',overlay).onclick=async()=>{const n=Number(inp.value);if(!(n<current)||n<floor){toast('Use um preço menor que o atual e acima do piso.');return;}const btn=$('#lowerPriceBtn',overlay);btn.disabled=true;btn.textContent='Atualizando...';try{const {error}=await db.rpc('seller_lower_offer_prices',{p_offer_id:o.id,p_new_lowest:n});if(error)throw error;toast('Preço baixou! Destaque ativado ⚡');state.sellerLoadedAt=0;closeOverlay();renderSeller(state.route.endsWith('groups')?'groups':state.route.endsWith('offers')?'offers':'dashboard');}catch(err){toast(err.message||'Não foi possível baixar o preço.');btn.disabled=false;btn.innerHTML=\`\${icon('bolt')} Baixar preço\`;}};
    }
    if(canCancel) $('#cancelGroupBtn',overlay).onclick=()=>confirmCancelGroup(o,w);
  }

  function confirmCancelGroup(o,members){
    openOverlay(\`<div class="j-modal j-confirm-cancel"><div class="j-modal-head"><div><span class="j-kicker">CONFIRMAÇÃO</span><h2>Cancelar “\${esc(o.title)}”?</h2></div><button class="j-close" data-close>×</button></div><div class="j-cancel-warning"><b>Essa ação encerra o grupo.</b><p>\${members?\`\${members} participante\${members===1?'':'s'} deixar\${members===1?'á':'ão'} de contar no grupo ativo.\`:'Ainda não há participantes ativos.'} Para quem já entrou, o histórico mostrará <strong>GRUPO CANCELADO · INCOMPLETO</strong>.</p></div><div class="j-actions"><button class="j-btn secondary" data-close>Voltar</button><button class="j-btn danger solid" id="confirmCancelGroup">Sim, cancelar grupo</button></div></div>\`);
    $('#confirmCancelGroup',overlay).onclick=async()=>{
      const btn=$('#confirmCancelGroup',overlay);btn.disabled=true;btn.textContent='Cancelando...';
      try{
        const {data,error}=await db.rpc('seller_cancel_group',{p_offer_id:o.id,p_reason:'Cancelado pelo vendedor'});
        if(error)throw error;
        state.sellerLoadedAt=0;
        closeOverlay();
        toast(data?.cancelled_members?\`Grupo cancelado. \${data.cancelled_members} participante\${data.cancelled_members===1?'':'s'} avisado\${data.cancelled_members===1?'':'s'} no histórico.\`:'Grupo cancelado.');
        renderSeller('groups');
      }catch(err){toast(err.message||'Não foi possível cancelar o grupo.');btn.disabled=false;btn.textContent='Sim, cancelar grupo';}
    };
  }

  function openCreateOffer`
);

replaceChecked(
  'buyer cancelled history data',
  /  async function loadBuyerData\(force=false\)\{[\s\S]*?\n  \}\n\n  function paintBuyer/,
  `  async function loadBuyerData(force=false){
    if(!state.session)return;
    if(!force&&state.buyerLoadedAt&&Date.now()-state.buyerLoadedAt<10000)return;
    const city=state.profile?.city,stateCode=state.profile?.state;
    const wait=await db.from('offer_waitlist').select('offer_id,created_at,status,cancelled_at,cancellation_reason').eq('user_id',state.session.user.id).order('created_at',{ascending:false});
    if(wait.error)throw wait.error;
    state.buyerWaitlist=wait.data||[];
    const joinedIds=state.buyerWaitlist.map(x=>x.offer_id);
    let regional=[];
    if(city){
      const businesses=await timeout(db.from('businesses').select('id,name,logo_url,city,state,neighborhood,verified,status').eq('status','approved').ilike('city',city).ilike('state',stateCode||'%'),4500);
      if(businesses.error)throw businesses.error;
      const ids=(businesses.data||[]).map(b=>b.id);
      if(ids.length){
        const offers=await timeout(db.from('offers').select('id,business_id,title,description,category,image_url,regular_price,junta_price,previous_junta_price,status,queue_target,price_flash_until,price_flash_message,offer_stats(waitlist_count,view_count),offer_price_tiers(people_count,unit_price)').in('business_id',ids).eq('is_demo',false).in('status',['scheduled','open']).order('price_flash_until',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}),5000);
        if(offers.error)throw offers.error;
        const map=Object.fromEntries((businesses.data||[]).map(b=>[b.id,b]));
        regional=(offers.data||[]).map(o=>({...o,businesses:map[o.business_id]}));
      }
    }
    let cancelled=[];
    if(joinedIds.length){
      const history=await timeout(db.from('offers').select('id,business_id,title,description,category,image_url,regular_price,junta_price,status,queue_target,cancelled_at,cancel_reason,businesses(id,name,logo_url,city,state,neighborhood,verified,status),offer_stats(waitlist_count,view_count),offer_price_tiers(people_count,unit_price)').in('id',joinedIds).eq('is_demo',false).eq('status','cancelled').order('cancelled_at',{ascending:false}),4500);
      if(history.error)throw history.error;
      cancelled=history.data||[];
    }
    const seen=new Set(regional.map(o=>o.id));
    state.buyerOffers=[...regional,...cancelled.filter(o=>!seen.has(o.id))];
    state.buyerLoadedAt=Date.now();
  }

  function paintBuyer`
);

replaceChecked(
  'buyer cancelled history UI',
  /  function paintBuyer\(tab\)\{[\s\S]*?\n  function flashCard/,
  `  function paintBuyer(tab){
    const root=$('#buyerBody');if(!root)return;
    const membership=new Map(state.buyerWaitlist.map(x=>[x.offer_id,x]));
    const activeJoined=new Set(state.buyerWaitlist.filter(x=>x.status!=='cancelled').map(x=>x.offer_id));
    const offers=state.buyerOffers;
    if(tab==='groups'){
      const rows=offers.filter(o=>membership.has(o.id)).sort((a,b)=>(a.status==='cancelled')-(b.status==='cancelled'));
      root.innerHTML=rows.length?\`<div class="j-grid">\${rows.map(o=>buyerOfferCard(o,activeJoined.has(o.id),membership.get(o.id))).join('')}</div>\`:\`<div class="j-empty"><h3>Você ainda não entrou em nenhum grupo.</h3><p>Explore ofertas da sua região e participe.</p></div>\`;
    } else {
      const activeOffers=offers.filter(o=>o.status!=='cancelled');
      const flash=activeOffers.filter(o=>o.price_flash_until&&new Date(o.price_flash_until)>new Date());
      root.innerHTML=\`\${flash.length?flash.map(flashCard).join(''):''}\${activeOffers.length?\`<div class="j-grid">\${activeOffers.map(o=>buyerOfferCard(o,activeJoined.has(o.id),membership.get(o.id))).join('')}</div>\`:\`<div class="j-empty"><h3>No momento não há ofertas na sua região.</h3><p>Volte em breve.</p></div>\`}\`;
    }
    $$('[data-buyer-offer]',root).forEach(b=>b.onclick=()=>openBuyerOffer(offers.find(o=>o.id===b.dataset.buyerOffer)));
  }

  function buyerOfferCard(o,joined,membership){
    const cancelled=o.status==='cancelled'||membership?.status==='cancelled';
    const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),p=pct(w,target),b=businessOf(o);
    return \`<button class="j-offer \${cancelled?'j-offer-cancelled':''}" data-buyer-offer="\${o.id}"><div class="j-offer-img">\${o.image_url?\`<img src="\${esc(o.image_url)}" alt="\${esc(o.title)}">\`:''}\${cancelled?'<span class="j-badge cancelled">GRUPO CANCELADO</span>':joined?'<span class="j-badge">VOCÊ ESTÁ NO GRUPO</span>':''}</div><div class="j-offer-body"><div class="j-offer-store">\${esc(b.name||'Comércio')}</div><h3>\${esc(o.title)}</h3>\${cancelled?\`<div class="j-cancelled-note"><strong>GRUPO CANCELADO</strong><span>INCOMPLETO</span><small>\${esc(membership?.cancellation_reason||o.cancel_reason||'Este grupo foi encerrado pelo vendedor.')}</small></div>\`:\`<div class="j-offer-prices"><s>\${money(o.regular_price)}</s><strong>\${money(o.junta_price)}</strong></div><div class="j-progress"><i style="width:\${p}%"></i></div><div class="j-progress-meta"><span>\${w}/\${target}</span><span>\${Math.max(0,target-w)} para a meta</span></div>\`}</div></button>\`;
  }
  function flashCard`
);

replaceChecked(
  'buyer cancelled modal',
  /  function openOfferModal\(o,allowJoin\)\{[\s\S]*?\n\n  async function joinOffer/,
  `  function openOfferModal(o,allowJoin){
    const membership=state.buyerWaitlist.find(x=>x.offer_id===o.id);
    const cancelled=o.status==='cancelled'||membership?.status==='cancelled';
    const s=statsOf(o),w=Number(s.waitlist_count||0),target=Number(o.queue_target||25),ts=tiersOf(o),b=businessOf(o),joined=membership?.status!=='cancelled'&&!!membership;
    openOverlay(\`<div class="j-modal"><div class="j-modal-head"><div><span class="j-kicker">\${esc(b.name||'JUNTA')}</span><h2>\${esc(o.title)}</h2></div><button class="j-close" data-close>×</button></div>\${o.image_url?\`<img src="\${esc(o.image_url)}" alt="\${esc(o.title)}" style="width:100%;height:220px;object-fit:cover;border-radius:20px">\`:''}\${cancelled?\`<div class="j-cancelled-modal"><span>GRUPO CANCELADO</span><strong>INCOMPLETO</strong><p>\${esc(membership?.cancellation_reason||o.cancel_reason||'O vendedor encerrou este grupo antes da meta.')}</p><small>Você não precisa fazer nada. Este registro fica aqui apenas no seu histórico.</small></div>\`:\`<div class="j-price-row" style="margin:16px 0"><s>\${money(o.regular_price)}</s><strong>\${money(o.junta_price)}</strong></div><div class="j-progress"><i style="width:\${pct(w,target)}%"></i></div><div class="j-progress-meta"><span>\${w} de \${target} pessoas</span><span>faltam \${Math.max(0,target-w)}</span></div>\${ts.length?\`<div class="j-tiers" style="margin-top:16px">\${ts.map(t=>\`<div class="j-tier"><span>\${t.people_count} pessoas</span><strong>\${money(t.unit_price)}</strong></div>\`).join('')}</div>\`:''}\${allowJoin?\`<button class="j-btn primary" id="joinOfferBtn" style="width:100%;margin-top:16px" \${joined?'disabled':''}>\${joined?'Você já está no grupo':'Entrar no grupo'}</button>\`:\`<button class="j-btn primary" id="authJoinBtn" style="width:100%;margin-top:16px">Entrar para participar</button>\`}\`}</div>\`);
    if(!cancelled&&allowJoin&&!joined) $('#joinOfferBtn',overlay).onclick=()=>joinOffer(o);
    if(!cancelled&&!allowJoin) $('#authJoinBtn',overlay).onclick=()=>{closeOverlay();openAuth('buyer');};
  }

  async function joinOffer`
);

writeFileSync(appPath, app);

const cssPath = 'dist/app-v100.css';
let css = readFileSync(cssPath, 'utf8');
css += `
/* V103 — cancelamento seguro de grupos */
.j-cancel-action{margin-top:18px;padding:18px;border:1px solid #ffd5d1;border-radius:22px;background:#fff8f6;display:flex;align-items:center;justify-content:space-between;gap:18px}.j-cancel-action h3{margin:7px 0 5px;font-size:22px}.j-cancel-action p{margin:0;color:var(--muted);line-height:1.5;max-width:470px}.j-btn.danger{background:#fff;color:#c92828;border:1px solid #f0b9b7;box-shadow:none}.j-btn.danger:hover{background:#fff0ee}.j-btn.danger.solid{background:#d92c2c;color:#fff;border-color:#d92c2c}.j-cancel-warning{padding:18px;border-radius:20px;background:#fff2ef;border:1px solid #ffd2ce;margin:12px 0 18px}.j-cancel-warning b{font-size:18px}.j-cancel-warning p{margin:7px 0 0;color:#665b56;line-height:1.55}.j-offer-cancelled{opacity:.88;border-style:dashed}.j-offer-cancelled .j-offer-img img{filter:grayscale(.55);opacity:.7}.j-badge.cancelled{background:#2b2624;color:#fff}.j-cancelled-note{margin-top:10px;padding:13px;border-radius:16px;background:#f7f2ef;text-align:left}.j-cancelled-note strong,.j-cancelled-note span{display:block}.j-cancelled-note strong{font-size:12px;color:#b42c2c;letter-spacing:.08em}.j-cancelled-note span{font-size:22px;font-weight:950;margin-top:2px}.j-cancelled-note small{display:block;color:#766c67;margin-top:7px;line-height:1.4}.j-cancelled-modal{margin-top:16px;padding:22px;border-radius:22px;background:#f7f2ef;border:1px dashed #d7c9c3}.j-cancelled-modal span{display:block;color:#b42c2c;font-weight:950;font-size:12px;letter-spacing:.1em}.j-cancelled-modal strong{display:block;font-size:32px;letter-spacing:-.04em;margin:2px 0 8px}.j-cancelled-modal p{margin:0 0 8px;line-height:1.5}.j-cancelled-modal small{color:#766c67;line-height:1.45}.j-confirm-cancel .j-actions{justify-content:flex-end}
@media(max-width:640px){.j-cancel-action{align-items:stretch;flex-direction:column}.j-cancel-action .j-btn{width:100%}.j-confirm-cancel .j-actions{display:grid;grid-template-columns:1fr;gap:8px}.j-confirm-cancel .j-btn{width:100%}}
`;
writeFileSync(cssPath, css);

const indexPath = 'dist/index.html';
let index = readFileSync(indexPath, 'utf8');
index = index.replace(/app-v100\.css\?v=\d+/g, 'app-v100.css?v=103').replace(/app-v100\.js\?v=\d+/g, 'app-v100.js?v=103');
writeFileSync(indexPath, index);

console.log('Junta V103 single-runtime SPA ready — safe group cancellation enabled');
