(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const db=window.supabase.createClient(URL,KEY);
  let session=null,profile=null,nearbyIds=null,currentRegion=null,applying=false;
  const icon=name=>{
    const d={buyer:'<path d="M4 7h16M6 7l1 12h10l1-12M9 11v4M15 11v4"/><path d="M8 4h8"/>',seller:'<path d="M4 10h16l-1.3-5H5.3L4 10Zm1 0v9h14v-9M8 19v-5h4v5"/>',pin:'<path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'}[name]||'';
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  };
  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const toast=m=>window.showToast?window.showToast(m):alert(m);

  async function loadIdentity(){
    try{
      const {data:{session:s}}=await db.auth.getSession();session=s;
      profile=null;
      if(session){const {data:p}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();profile=p||null}
      if(profile?.postal_code&&profile?.city){currentRegion={cep:profile.postal_code,bairro:profile.neighborhood||'',localidade:profile.city,uf:profile.state||''}}
      else{try{currentRegion=JSON.parse(localStorage.getItem('junta:v51-region')||'null')}catch{currentRegion=null}}
    }catch{}
  }

  function polishDynamicUI(){
    const auth=$('.j42-auth');
    if(auth&&!auth.dataset.v51){
      auth.dataset.v51='1';
      const roles=$$('[data-j42-role]',auth);
      roles.forEach(r=>{const box=$('.j42-role-icon',r);if(box)box.innerHTML=icon(r.dataset.j42Role==='seller'?'seller':'buyer')});
    }
    const buyerRoot=$('[data-view="account"] .j42-root');
    if(buyerRoot&&/Conta comprador/i.test(buyerRoot.textContent||'')){
      const region=buyerRoot.querySelector('.j42-panel');
      if(region&&!region.classList.contains('j42-region-card')){region.classList.add('j42-region-card');const p=region.querySelector('.j42-sub');if(p)p.insertAdjacentHTML('afterend','<span class="v51-nearby-label"><i class="v51-live-dot"></i>Busca regional conectada</span>')}
    }
    const onboard=$('.j42-onboard'); if(onboard&&!onboard.dataset.v51){onboard.dataset.v51='1'}
    const seller=$('[data-view="seller"] .j42-root'); if(seller&&!seller.dataset.v51){seller.dataset.v51='1'}
  }

  async function lookupCep(raw){
    const cep=String(raw||'').replace(/\D/g,'');
    if(cep.length!==8)throw new Error('Digite um CEP com 8 números.');
    const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{cache:'no-store'});
    if(!r.ok)throw new Error('Não foi possível consultar o CEP agora.');
    const d=await r.json();if(d.erro)throw new Error('CEP não encontrado.');
    return {...d,cep};
  }

  async function queryNearby(region){
    const {data,error}=await db.from('offers').select('id,is_demo,status,businesses!inner(city,state,neighborhood,postal_code)').eq('is_demo',false).in('status',['scheduled','open']);
    if(error)throw error;
    const city=String(region.localidade||'').trim().toLowerCase(),uf=String(region.uf||'').trim().toUpperCase(),bairro=String(region.bairro||'').trim().toLowerCase();
    const same=(data||[]).filter(o=>String(o.businesses?.city||'').trim().toLowerCase()===city&&String(o.businesses?.state||'').trim().toUpperCase()===uf);
    same.sort((a,b)=>{
      const aa=String(a.businesses?.neighborhood||'').trim().toLowerCase()===bairro?0:1;
      const bb=String(b.businesses?.neighborhood||'').trim().toLowerCase()===bairro?0:1;
      return aa-bb;
    });
    nearbyIds=new Set(same.map(x=>x.id));
    currentRegion=region;localStorage.setItem('junta:v51-region',JSON.stringify(region));
    return same;
  }

  async function saveBuyerRegion(region){
    if(!session||profile?.role!=='buyer')return;
    const {error}=await db.from('profiles').update({postal_code:region.cep,neighborhood:region.bairro||'',city:region.localidade||'',state:region.uf||''}).eq('user_id',session.user.id);
    if(error)throw error;
    profile={...profile,postal_code:region.cep,neighborhood:region.bairro||'',city:region.localidade||'',state:region.uf||''};
  }

  function openCepFinder({goOffers=true}={}){
    $('.v51-overlay')?.remove();
    const modal=document.createElement('div');modal.className='v51-overlay';
    modal.innerHTML=`<div class="v51-cep"><button class="v51-close" aria-label="Fechar">×</button><div class="v51-cep-icon">${icon('pin')}</div><h2>O que tem perto de você?</h2><p>Digite seu CEP. O Junta consulta a região online e mostra apenas grupos reais de lojas na sua cidade. Não usamos o número da sua casa.</p><form><input name="cep" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000" value="${esc(currentRegion?.cep||'')}" required><button type="submit">Buscar grupos</button></form><div class="v51-cep-result"></div></div>`;
    document.body.appendChild(modal);$('.v51-close',modal).onclick=()=>modal.remove();modal.onclick=e=>{if(e.target===modal)modal.remove()};
    $('form',modal).onsubmit=async e=>{
      e.preventDefault();const btn=$('button[type=submit]',modal),res=$('.v51-cep-result',modal),raw=new FormData(e.currentTarget).get('cep');
      const old=btn.innerHTML;btn.disabled=true;btn.innerHTML='<span class="v51-spinner"></span>Consultando';
      try{
        const region=await lookupCep(raw);const list=await queryNearby(region);await saveBuyerRegion(region);
        res.classList.add('show');res.innerHTML=`<b>${esc(region.bairro||region.localidade)} · ${esc(region.localidade)} / ${esc(region.uf)}</b><span>CEP consultado online com sucesso.</span><em>${list.length?`${list.length} grupo${list.length>1?'s':''} real${list.length>1?'is':''} encontrado${list.length>1?'s':''}`:'Ainda não há grupos reais ativos nessa cidade.'}</em>`;
        setTimeout(()=>{modal.remove();if(goOffers){goToOffers();setTimeout(()=>applyNearbyToOffers(),220)}else polishDynamicUI()},650);
      }catch(err){toast(err.message||'Não foi possível consultar esse CEP.')}finally{btn.disabled=false;btn.innerHTML=old}
    };
  }

  function goToOffers(){
    const btn=$('.bottom-nav [data-nav="offers"]')||$('[data-nav="offers"]');if(btn)btn.click();else if(typeof window.navigate==='function')window.navigate('offers');
  }

  function addRegionBanner(){
    const view=$('[data-view="offers"] .page-shell');if(!view||!currentRegion)return;
    view.querySelector('.v51-local-banner')?.remove();
    const banner=document.createElement('div');banner.className='v51-local-banner';banner.innerHTML=`<div><b>${icon('pin')} ${esc(currentRegion.bairro||currentRegion.localidade)} · ${esc(currentRegion.localidade)} / ${esc(currentRegion.uf)}</b><span>Mostrando grupos reais dessa cidade${currentRegion.bairro?' e priorizando seu bairro':''}.</span></div><button>Trocar CEP</button>`;banner.querySelector('svg')?.setAttribute('style','width:14px;height:14px;fill:none;stroke:#ea1d2c;stroke-width:2;vertical-align:-3px;margin-right:4px');banner.querySelector('button').onclick=()=>openCepFinder();
    const search=view.querySelector('.search-box');(search||view.firstChild).insertAdjacentElement(search?'beforebegin':'afterend',banner);
  }

  function emptyNearby(){
    return `<div class="v51-empty-local"><div class="pin">${icon('pin')}</div><h3>Ainda não abriu um grupo por aqui.</h3><p>O CEP está funcionando e a busca foi feita online. Quando um comércio real da sua cidade publicar e o Junta aprovar uma oferta, ela aparece aqui automaticamente.</p><button data-v51-change>Trocar CEP</button></div>`;
  }

  function applyNearbyToOffers(){
    if(applying)return;applying=true;
    try{
      const view=$('[data-view="offers"]');if(!view?.classList.contains('active')||!currentRegion)return;
      addRegionBanner();const grid=$('#allOffers');if(!grid)return;
      const cards=$$('[data-offer]',grid);
      cards.forEach(c=>c.style.display=nearbyIds?.has(c.dataset.offer)?'':'none');
      const visible=cards.filter(c=>c.style.display!=='none').length;
      grid.querySelector('.v51-empty-local')?.remove();
      if(!visible)grid.insertAdjacentHTML('beforeend',emptyNearby());
      grid.querySelector('[data-v51-change]')?.addEventListener('click',()=>openCepFinder());
      const p=view.querySelector('.page-title p');if(p)p.textContent=`Grupos reais em ${currentRegion.localidade} / ${currentRegion.uf}. Use a busca para encontrar produto, loja ou categoria.`;
    }finally{applying=false}
  }

  async function restoreRegionAndFilter(){
    await loadIdentity();if(currentRegion)try{await queryNearby(currentRegion)}catch{}
    applyNearbyToOffers();
  }

  async function annotateDemoCards(){
    try{
      const {data}=await db.from('offers').select('id,is_demo');const demo=new Set((data||[]).filter(x=>x.is_demo).map(x=>x.id));
      $$('[data-offer]').forEach(c=>{if(demo.has(c.dataset.offer)&&!c.querySelector('.v51-demo-tag')){const media=c.querySelector('.offer-media');if(media)media.insertAdjacentHTML('beforeend','<span class="v51-demo-tag" style="position:absolute;left:12px;bottom:12px;background:rgba(255,255,255,.94);color:#6f625c;border-radius:999px;padding:6px 9px;font-size:8px;font-weight:950;letter-spacing:.08em;z-index:4">DEMONSTRAÇÃO</span>')}})
    }catch{}
  }

  function bindCapture(){
    document.addEventListener('click',async e=>{
      const cep=e.target.closest('[data-j42-cep]');if(cep){e.preventDefault();e.stopImmediatePropagation();await loadIdentity();openCepFinder({goOffers:false});return}
      const explore=e.target.closest('[data-j42-offers]');if(explore){e.preventDefault();e.stopImmediatePropagation();await loadIdentity();if(!currentRegion){openCepFinder();return}try{await queryNearby(currentRegion)}catch{}goToOffers();setTimeout(applyNearbyToOffers,180);return}
      const hero=e.target.closest('.pl-hero [data-pl-auth="buyer"]');if(hero){e.preventDefault();e.stopImmediatePropagation();await loadIdentity();openCepFinder();return}
    },true);
  }

  function protectDirectSellerRoute(){
    const check=async()=>{if(location.hash!=='#seller')return;await loadIdentity();if(!session){const b=$('[data-nav="account"]');b?.click()}else if(profile?.role==='buyer'){const b=$('[data-nav="account"]');b?.click();toast('Sua conta é de comprador. Para vender, crie uma conta de vendedor.')}};window.addEventListener('hashchange',check);setTimeout(check,120);
  }

  const obs=new MutationObserver(()=>{polishDynamicUI();if($('[data-view="offers"].active'))setTimeout(applyNearbyToOffers,20);setTimeout(annotateDemoCards,40)});
  window.addEventListener('load',async()=>{await restoreRegionAndFilter();polishDynamicUI();annotateDemoCards();obs.observe($('#app')||document.body,{subtree:true,childList:true});bindCapture();protectDirectSellerRoute()});
  db.auth.onAuthStateChange(()=>setTimeout(async()=>{await loadIdentity();polishDynamicUI()},80));
})();