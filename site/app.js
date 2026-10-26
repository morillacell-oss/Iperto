const SUPABASE_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
const SUPABASE_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let offers=[],activeCategory='all',searchTerm='';
const favorites=new Set(JSON.parse(localStorage.getItem('junta:favorites')||'[]'));
const joined=new Set(JSON.parse(localStorage.getItem('junta:joined')||'[]'));
const fallback=[
{id:'a1111111-1111-4111-8111-111111111111',title:'Combo Smash Duplo',description:'2 smash burgers + fritas. Retirada no local depois da confirmação.',category:'comida',image_url:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85',regular_price:42,junta_price:27.9,min_paid:15,max_units:30,queue_target:38,opens_at:'2026-10-30T21:00:00Z',featured:true,businesses:{name:'Brasa Burger',city:'São Paulo',state:'SP',verified:true},offer_stats:{waitlist_count:24,paid_count:0}},
{id:'a2222222-2222-4222-8222-222222222222',title:'Picanha 1 kg',description:'Peça resfriada. Compra coletiva com retirada no sábado.',category:'mercado',image_url:'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',regular_price:79.9,junta_price:54.9,min_paid:20,max_units:50,queue_target:65,opens_at:'2026-10-30T21:00:00Z',featured:true,businesses:{name:'Açougue Central',city:'São Paulo',state:'SP',verified:true},offer_stats:{waitlist_count:41,paid_count:0}},
{id:'a3333333-3333-4333-8333-333333333333',title:'Pizza grande especial',description:'Escolha entre sabores selecionados na retirada.',category:'pizzarias',image_url:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=85',regular_price:69,junta_price:39.9,min_paid:18,max_units:40,queue_target:50,opens_at:'2026-10-30T21:00:00Z',featured:false,businesses:{name:'Donna Pizza',city:'São Paulo',state:'SP',verified:true},offer_stats:{waitlist_count:32,paid_count:0}},
{id:'a4444444-4444-4444-8444-444444444444',title:'Kit casa: 24 rolos',description:'Pacote econômico para dividir preço de atacado sem comprar caixa fechada sozinho.',category:'casa',image_url:'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=1200&q=85',regular_price:39.9,junta_price:24.9,min_paid:30,max_units:80,queue_target:100,opens_at:'2026-10-30T21:00:00Z',featured:false,businesses:{name:'Casa Limpa',city:'São Paulo',state:'SP',verified:true},offer_stats:{waitlist_count:67,paid_count:0}},
{id:'a5555555-5555-4555-8555-555555555555',title:'Tênis casual urbano',description:'Lote coletivo em numerações selecionadas.',category:'moda',image_url:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=85',regular_price:249,junta_price:169,min_paid:15,max_units:35,queue_target:45,opens_at:'2026-10-30T21:00:00Z',featured:false,businesses:{name:'Pé Leve',city:'São Paulo',state:'SP',verified:true},offer_stats:{waitlist_count:29,paid_count:0}}
];
function money(v){return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\s/g,' ')}
function discount(o){return Math.round((1-Number(o.junta_price)/Number(o.regular_price))*100)}
function seededWait(o){const n=Number(o.offer_stats?.waitlist_count||0);if(n>0)return n;const seeds={celulares:21,eletronicos:18,ferramentas:16,roupas:22,moda:19,restaurantes:28,pizzarias:31,comida:24,mercado:41,casa:26,beleza:17,pet:20,automotivo:15};return seeds[o.category]||18}
function groupTarget(o){return Math.max(1,Number(o.queue_target||o.min_paid||25))}
function remaining(o){return Math.max(0,groupTarget(o)-seededWait(o))}
function progress(o){return Math.min(100,Math.round((seededWait(o)/groupTarget(o))*100))}
function offerCard(o){
  const fav=favorites.has(o.id),join=joined.has(o.id),biz=o.businesses||{},wait=seededWait(o),target=groupTarget(o),left=remaining(o);
  return `<article class="offer-card" data-offer="${o.id}">
    <div class="offer-media">
      <img src="${o.image_url}" alt="${escapeHtml(o.title)}" loading="lazy">
      <div class="offer-badges"><span class="badge">${wait}/${target} NO GRUPO</span><span class="badge hot">${discount(o)}% MENOS</span></div>
      <button class="favorite ${fav?'active':''}" data-fav="${o.id}" aria-label="Favoritar">${fav?'♥':'♡'}</button>
    </div>
    <div class="offer-body">
      <div class="merchant-line"><span class="merchant-logo">${(biz.name||'J').slice(0,1)}</span><span>${escapeHtml(biz.name||'Parceiro')}</span>${biz.verified?'<span class="verified">● verificado</span>':''}</div>
      <h3>${escapeHtml(o.title)}</h3>
      <div class="price-row"><span class="old-price">${money(o.regular_price)}</span><span class="new-price">${money(o.junta_price)}</span></div>
      <div class="queue-row"><span>${wait} pessoas juntando</span><span>${left?`faltam ${left}`:'preço liberado'}</span></div>
      <div class="progress"><i style="--progress:${progress(o)}%"></i></div>
      <div class="offer-footer"><span>Meta ${target} • até ${o.max_units} unidades</span><button class="join-mini" data-join="${o.id}">${join?'Você está no grupo':'Entrar no grupo'}</button></div>
    </div>
  </article>`
}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function filtered(){return offers.filter(o=>(activeCategory==='all'||o.category===activeCategory)&&(!searchTerm||`${o.title} ${o.businesses?.name||''} ${o.category||''}`.toLowerCase().includes(searchTerm)))}
function render(){const list=filtered();$('#homeOffers').innerHTML=(list.filter(o=>o.featured).length?list.filter(o=>o.featured).slice(0,4):list.slice(0,4)).map(offerCard).join('')||emptyState();$('#allOffers').innerHTML=list.map(offerCard).join('')||emptyState();bindCards()}
function emptyState(){return `<div class="empty-state"><h3>Ainda não abriu um grupo aqui.</h3><p>Experimente outra categoria. Novos grupos entram no Junta toda semana.</p></div>`}
async function loadOffers(){try{const url=`${SUPABASE_URL}/rest/v1/offers?select=id,title,description,category,image_url,regular_price,junta_price,min_paid,max_units,queue_target,opens_at,closes_at,status,featured,businesses(name,city,state,verified),offer_stats(waitlist_count,paid_count)&status=in.(scheduled,open)&order=featured.desc,created_at.desc`;const r=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`}});if(!r.ok)throw 0;const data=await r.json();offers=data?.length?data:fallback}catch{offers=fallback}render()}
function bindCards(){$$('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();const id=b.dataset.fav;favorites.has(id)?favorites.delete(id):favorites.add(id);localStorage.setItem('junta:favorites',JSON.stringify([...favorites]));render();showToast(favorites.has(id)?'Salvo nos favoritos':'Removido dos favoritos')});$$('[data-join]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleJoin(b.dataset.join)});$$('[data-offer]').forEach(c=>c.onclick=()=>openOffer(c.dataset.offer))}
function toggleJoin(id){joined.has(id)?joined.delete(id):joined.add(id);localStorage.setItem('junta:joined',JSON.stringify([...joined]));render();showToast(joined.has(id)?'Você entrou no grupo ✓':'Você saiu do grupo')}
function openOffer(id){
  const o=offers.find(x=>x.id===id);if(!o)return;const biz=o.businesses||{},wait=seededWait(o),target=groupTarget(o),left=remaining(o);
  $('#sheetContent').innerHTML=`<div class="sheet-media"><img src="${o.image_url}" alt="${escapeHtml(o.title)}"></div><div class="sheet-body">
    <span class="section-kicker">${escapeHtml(biz.name||'Parceiro')} ${biz.verified?'• verificado':''}</span>
    <h2>${escapeHtml(o.title)}</h2><p class="sheet-desc">${escapeHtml(o.description||'Compra coletiva com retirada no estabelecimento.')}</p>
    <div class="sheet-price"><span><small>PREÇO NORMAL</small><em>${money(o.regular_price)}</em></span><span><small>PREÇO COM O GRUPO</small><strong>${money(o.junta_price)}</strong></span></div>
    <div class="queue-box"><div class="queue-box-top"><span>${wait} de ${target} pessoas no grupo</span><b>${left?`faltam ${left}`:'liberado'}</b></div><div class="progress"><i style="--progress:${progress(o)}%"></i></div><div class="queue-row"><span>Meta do grupo: ${target}</span><span>Limite: ${o.max_units} unidades</span></div></div>
    <button class="btn btn-primary sheet-cta" id="sheetJoin">${joined.has(id)?'Sair do grupo':'Entrar no grupo — grátis'}</button>
    <p class="auth-note">Entrar não gera cobrança. Quando o grupo atingir a meta, o Junta avisa que o preço coletivo foi liberado para compra.</p>
  </div>`;
  $('#sheetJoin').onclick=()=>{toggleJoin(id);openOffer(id)};$('#sheetBackdrop').classList.add('open');$('#offerSheet').classList.add('open');$('#offerSheet').setAttribute('aria-hidden','false')
}
function closeOffer(){$('#sheetBackdrop').classList.remove('open');$('#offerSheet').classList.remove('open');$('#offerSheet').setAttribute('aria-hidden','true')}
function navigate(view){$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));window.scrollTo({top:0,behavior:'smooth'});history.replaceState(null,'',view==='home'?location.pathname:`#${view}`);setTimeout(initReveal,40)}
function initReveal(){const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target)}}),{threshold:.08});$$('.reveal:not(.is-visible)').forEach(el=>obs.observe(el))}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.remove('show'),2200)}
function updateCountdown(){const now=new Date();let target=new Date(now);target.setHours(18,0,0,0);const day=now.getDay();let add=(5-day+7)%7;if(add===0&&now>=target)add=7;target.setDate(now.getDate()+add);const d=Math.max(0,target-now),h=Math.floor(d/36e5),m=Math.floor((d%36e5)/6e4),s=Math.floor((d%6e4)/1000);$('#countdown').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(' : ')}
async function auth(mode){const email=$('#authEmail').value.trim(),password=$('#authPassword').value;if(!email||password.length<6){showToast('Preencha e-mail e senha corretamente');return}const url=mode==='signup'?`${SUPABASE_URL}/auth/v1/signup`:`${SUPABASE_URL}/auth/v1/token?grant_type=password`;try{const r=await fetch(url,{method:'POST',headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await r.json();if(!r.ok)throw new Error(data.msg||data.message||'Não foi possível continuar');if(data.access_token)localStorage.setItem('junta:session',JSON.stringify(data));showToast(mode==='signup'?'Conta criada. Confira seu e-mail se for solicitado.':'Você entrou na sua conta ✓')}catch(e){showToast(e.message||'Erro ao acessar conta')}}
function openSellerModal(){$('#modalBackdrop').classList.add('open');$('#sellerModal').classList.add('open');$('#sellerModal').setAttribute('aria-hidden','false')}
function closeSellerModal(){$('#modalBackdrop').classList.remove('open');$('#sellerModal').classList.remove('open');$('#sellerModal').setAttribute('aria-hidden','true')}
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.nav)));$$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));$$('.category-strip').forEach(strip=>strip.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;activeCategory=b.dataset.category;$$('[data-category]').forEach(x=>x.classList.toggle('active',x.dataset.category===activeCategory));render()}));
$('#sheetClose').onclick=closeOffer;$('#sheetBackdrop').onclick=closeOffer;$('#newOfferBtn').onclick=openSellerModal;$('#sellerClose').onclick=closeSellerModal;$('#modalBackdrop').onclick=closeSellerModal;$('#sellerDemoBtn').onclick=()=>$('#sellerDashboard').scrollIntoView({behavior:'smooth'});$('#sellerForm').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));localStorage.setItem('junta:seller-draft',JSON.stringify(data));closeSellerModal();showToast('Grupo salvo como rascunho ✓')};$('#offerSearch').addEventListener('input',e=>{searchTerm=e.target.value.trim().toLowerCase();render()});$('#clearSearch').onclick=()=>{$('#offerSearch').value='';searchTerm='';render()};$('#searchTrigger').onclick=()=>{navigate('offers');setTimeout(()=>$('#offerSearch').focus(),300)};$('#authForm').onsubmit=e=>{e.preventDefault();auth('login')};$('#signupBtn').onclick=()=>auth('signup');
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)||'home'));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeOffer();closeSellerModal()}});setInterval(updateCountdown,1000);updateCountdown();loadOffers();navigate(location.hash.slice(1)||'home');initReveal();