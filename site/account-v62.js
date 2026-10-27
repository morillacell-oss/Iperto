(() => {
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  if(!window.supabase) return;
  const db=window.supabase.createClient(SB_URL,SB_KEY);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const toast=m=>window.showToast?window.showToast(m):console.log(m);
  let renderToken=0;
  let authMode='login';
  let signupRole='buyer';

  function icon(name){
    const p={
      user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
      bag:'<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
      store:'<path d="M4 10h16l-1.2-5H5.2L4 10Z"/><path d="M5 10v9h14v-9M8 19v-5h5v5"/>',
      chart:'<path d="M4 19V9m6 10V5m6 14v-7m4 7V3"/>',
      shield:'<path d="M12 3 4 6v5c0 5.2 3.4 8.6 8 10 4.6-1.4 8-4.8 8-10V6l-8-3Z"/><path d="m9 12 2 2 4-5"/>',
      logout:'<path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10"/>',
      chevron:'<path d="m9 6 6 6-6 6"/>',
      sparkle:'<path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/>',
      group:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3v-9.5Z"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${p[name]||p.user}</svg>`;
  }

  function go(view){
    if(typeof window.navigate==='function') window.navigate(view);
    else {
      $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
      $$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));
      window.scrollTo({top:0,behavior:'smooth'});
    }
  }

  function accountRoot(){return $('[data-view="account"] .shell')}
  function loading(root){
    root.innerHTML=`<div class="v62-account v62-loading buyer-v60"><div class="v62-loadmark"><span></span><span></span></div><p>Preparando sua conta...</p></div>`;
  }

  async function context(){
    const {data:{session},error:sErr}=await db.auth.getSession();
    if(sErr) throw sErr;
    if(!session) return {session:null,profile:null,business:null};
    const {data:profile,error:pErr}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();
    if(pErr) throw pErr;
    let business=null;
    if(profile?.role==='seller'){
      const {data,error}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
      if(error) throw error;
      business=data;
    }
    return {session,profile,business};
  }

  async function openAccount(){
    const token=++renderToken;
    go('account');
    const root=accountRoot();
    if(!root) return;
    loading(root);
    try{
      const c=await context();
      if(token!==renderToken) return;
      if(!c.session){renderAuth(root);return}
      if(['master','admin'].includes(c.profile?.role)){renderMasterAccount(root,c);return}
      if(c.profile?.role==='seller'){await renderSellerAccount(root,c);return}
      await renderBuyerAccount(root,c);
    }catch(err){
      console.error(err);
      root.innerHTML=`<div class="v62-account buyer-v60"><section class="v62-error"><div>${icon('shield')}</div><h2>Não conseguimos carregar sua conta</h2><p>${esc(err.message||'Tente novamente.')}</p><button class="v62-primary" data-v62-retry>Tentar novamente</button></section></div>`;
      $('[data-v62-retry]',root)?.addEventListener('click',openAccount);
    }
  }

  function renderAuth(root){
    const signup=authMode==='signup';
    root.innerHTML=`<div class="v62-account v62-auth buyer-v60">
      <section class="v62-auth-story">
        <span class="v62-kicker">SUA CONTA JUNTA</span>
        <h1>${signup?'Comece do seu jeito.':'Bom ter você de volta.'}</h1>
        <p>${signup?'Escolha se você veio para comprar em grupo ou criar ofertas para sua empresa. Cada conta recebe uma experiência própria.':'Entre para acompanhar seus grupos, sua região ou o desempenho da sua empresa.'}</p>
        <div class="v62-story-card"><div class="v62-story-icon">${icon('sparkle')}</div><div><b>Uma conta. Uma experiência certa.</b><span>Comprador vê grupos e ofertas. Vendedor vê negócio, métricas e campanhas.</span></div></div>
      </section>
      <section class="v62-auth-card">
        <div class="v62-tabs"><button class="${!signup?'active':''}" data-v62-mode="login">Entrar</button><button class="${signup?'active':''}" data-v62-mode="signup">Criar conta</button></div>
        ${signup?`<div class="v62-role-grid">
          <button class="v62-role ${signupRole==='buyer'?'active':''}" data-v62-role="buyer"><span>${icon('group')}</span><b>Quero comprar</b><small>Entrar em grupos e pagar menos.</small></button>
          <button class="v62-role ${signupRole==='seller'?'active':''}" data-v62-role="seller"><span>${icon('store')}</span><b>Quero vender</b><small>Criar ofertas e vender em volume.</small></button>
        </div>`:''}
        <form class="v62-form" id="v62AuthForm">
          ${signup?`<label>Seu nome<input name="name" required autocomplete="name" placeholder="Como devemos te chamar?"></label>`:''}
          ${signup&&signupRole==='buyer'?`<label>CEP<input name="cep" required inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="00000-000"><small>Usamos apenas para encontrar ofertas da sua região.</small></label>`:''}
          <label>E-mail<input name="email" type="email" required autocomplete="email" placeholder="voce@email.com"></label>
          <label>Senha<input name="password" type="password" minlength="6" required autocomplete="${signup?'new-password':'current-password'}" placeholder="Mínimo 6 caracteres"></label>
          <button class="v62-primary" type="submit">${signup?(signupRole==='buyer'?'Criar conta para comprar':'Criar conta de vendedor'):'Entrar no Junta'}</button>
        </form>
        <div class="v62-secure">${icon('shield')} <span>Seu tipo de conta fica protegido no servidor.</span></div>
      </section>
    </div>`;
    $$('[data-v62-mode]',root).forEach(b=>b.onclick=()=>{authMode=b.dataset.v62Mode;renderAuth(root)});
    $$('[data-v62-role]',root).forEach(b=>b.onclick=()=>{signupRole=b.dataset.v62Role;renderAuth(root)});
    const cep=$('input[name="cep"]',root); if(cep) bindCepMask(cep);
    $('#v62AuthForm',root).onsubmit=handleAuth;
  }

  async function handleAuth(e){
    e.preventDefault();
    const form=e.currentTarget,btn=$('button[type="submit"]',form),fd=new FormData(form);
    const email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||''),name=String(fd.get('name')||'').trim(),cep=String(fd.get('cep')||'').replace(/\D/g,'');
    btn.disabled=true;const old=btn.textContent;btn.innerHTML='<span class="v62-spinner"></span> Entrando...';
    try{
      if(authMode==='signup'){
        if(signupRole==='buyer'&&cep.length!==8) throw new Error('Digite um CEP válido com 8 números.');
        const {data,error}=await db.auth.signUp({email,password,options:{data:{account_type:signupRole,display_name:name}}});
        if(error) throw error;
        if(signupRole==='buyer'&&cep) localStorage.setItem('junta:pending-cep',cep);
        if(!data.session){authMode='login';toast('Conta criada. Agora entre para continuar.');renderAuth(accountRoot());return}
      } else {
        const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;
      }
      const c=await context();
      if(c.profile?.role==='buyer') await applyPendingCep(c);
      toast('Tudo certo ✓');
      if(c.profile?.role==='seller'||['master','admin'].includes(c.profile?.role)){go('seller');setTimeout(()=>document.dispatchEvent(new Event('junta:v62-refresh')),60)}
      else await openAccount();
    }catch(err){toast(err.message||'Não foi possível continuar.');btn.disabled=false;btn.textContent=old}
  }

  async function applyPendingCep(c){
    const cep=localStorage.getItem('junta:pending-cep'); if(!cep||!c.session) return;
    try{const d=await lookupCep(cep);const {error}=await db.from('profiles').update({postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''}).eq('user_id',c.session.user.id);if(error)throw error;localStorage.removeItem('junta:pending-cep')}catch(err){console.warn('CEP pendente',err)}
  }

  async function renderBuyerAccount(root,c){
    const p=c.profile||{};
    const [{data:wait,error:wErr},{data:orders,error:oErr}] = await Promise.all([
      db.from('offer_waitlist').select('id,created_at,offer_id,offers(id,title,image_url,junta_price,regular_price,queue_target,status,businesses(name,city,state),offer_stats(waitlist_count))').eq('user_id',c.session.user.id).order('created_at',{ascending:false}),
      db.from('orders').select('id,total_amount,payment_status,order_status,created_at,offer_id').eq('user_id',c.session.user.id).order('created_at',{ascending:false}).limit(8)
    ]);
    if(wErr) console.warn(wErr);if(oErr) console.warn(oErr);
    const groups=wait||[],purchases=orders||[];
    const name=p.display_name||c.session.user.email?.split('@')[0]||'Comprador';
    root.innerHTML=`<div class="v62-account buyer-v60">
      <section class="v62-profile-hero">
        <div class="v62-profile-main"><div class="v62-avatar">${esc(name.slice(0,1).toUpperCase())}</div><div><span class="v62-kicker">CONTA COMPRADOR</span><h1>${esc(name)}</h1><p>${esc(c.session.user.email||'')}</p></div></div>
        <button class="v62-ghost" data-v62-signout>${icon('logout')} Sair</button>
      </section>
      <section class="v62-stat-strip">
        <article><span>${icon('group')}</span><div><strong>${groups.length}</strong><small>grupos acompanhando</small></div></article>
        <article><span>${icon('bag')}</span><div><strong>${purchases.length}</strong><small>compras registradas</small></div></article>
        <article><span>${icon('pin')}</span><div><strong>${p.city?esc(p.city):'—'}</strong><small>sua região</small></div></article>
      </section>
      <section class="v62-grid-two">
        <article class="v62-card v62-region-card"><div class="v62-card-icon">${icon('pin')}</div><span class="v62-kicker">SUA REGIÃO</span><h2>${p.city?esc([p.neighborhood,p.city,p.state].filter(Boolean).join(' · ')):'Defina onde você está'}</h2><p>${p.postal_code?`CEP ${formatCep(p.postal_code)}. É essa região que usamos para encontrar grupos reais perto de você.`:'Informe seu CEP para o Junta mostrar ofertas próximas de verdade.'}</p><button class="v62-primary compact" data-v62-cep>${p.postal_code?'Alterar CEP':'Definir CEP'}</button></article>
        <article class="v62-card v62-action-card"><span class="v62-kicker">PRÓXIMO PASSO</span><h2>${groups.length?'Acompanhe seus grupos':'Encontre seu primeiro grupo'}</h2><p>${groups.length?'Veja quanto falta para a próxima faixa de preço e quando a compra for liberada.':'Explore ofertas reais da sua região e entre sem pagar nada agora.'}</p><button class="v62-primary compact" data-v62-offers>${icon('sparkle')} Explorar grupos</button></article>
      </section>
      <section class="v62-card v62-list-card"><div class="v62-section-head"><div><span class="v62-kicker">MEUS GRUPOS</span><h2>O que você está acompanhando</h2></div><button data-v62-offers>Ver ofertas</button></div>${groups.length?`<div class="v62-group-list">${groups.slice(0,6).map(g=>groupRow(g)).join('')}</div>`:`<div class="v62-empty"><span>${icon('group')}</span><h3>Você ainda não entrou em nenhum grupo</h3><p>Quando entrar, o progresso aparece aqui em tempo real.</p></div>`}</section>
      <section class="v62-settings"><button data-v62-profile>${icon('user')}<span><b>Dados da conta</b><small>Nome e informações básicas</small></span>${icon('chevron')}</button><button data-v62-cep>${icon('pin')}<span><b>Região</b><small>${p.city?esc(`${p.city} · ${p.state}`):'Definir localização por CEP'}</small></span>${icon('chevron')}</button><button data-v62-signout>${icon('logout')}<span><b>Sair da conta</b><small>Encerrar esta sessão</small></span>${icon('chevron')}</button></section>
    </div>`;
    bindCommon(root,c);
    $$('[data-v62-offers]',root).forEach(b=>b.onclick=()=>go('offers'));
    $$('[data-v62-cep]',root).forEach(b=>b.onclick=()=>openCepEditor(c));
    $('[data-v62-profile]',root)?.addEventListener('click',()=>openProfileEditor(c));
  }

  function groupRow(g){
    const o=g.offers||{},s=o.offer_stats||{},count=Number(s.waitlist_count||0),target=Number(o.queue_target||25),pct=Math.min(100,Math.round(count/Math.max(target,1)*100));
    return `<article class="v62-group-row"><div class="v62-group-img">${o.image_url?`<img src="${esc(o.image_url)}" alt="${esc(o.title)}">`:`${icon('bag')}`}</div><div class="v62-group-info"><span>${esc(o.businesses?.name||'Parceiro')}</span><h3>${esc(o.title||'Oferta')}</h3><div class="v62-progress"><i style="--p:${pct}%"></i></div><small>${count} de ${target} pessoas · ${pct}%</small></div><div class="v62-group-price"><small>preço do grupo</small><strong>${money(o.junta_price)}</strong></div></article>`;
  }

  async function renderSellerAccount(root,c){
    const b=c.business||{},p=c.profile||{};
    const [{count:offersCount},{data:stats}] = await Promise.all([
      db.from('offers').select('id',{count:'exact',head:true}).eq('business_id',b.id).eq('is_demo',false),
      db.from('offers').select('offer_stats(view_count,waitlist_count,detail_click_count)').eq('business_id',b.id).eq('is_demo',false)
    ]);
    const rows=stats||[],sum=k=>rows.reduce((a,o)=>a+Number(o.offer_stats?.[k]||0),0),views=sum('view_count'),interest=sum('waitlist_count');
    const name=b.name||p.display_name||'Sua empresa';
    root.innerHTML=`<div class="v62-account seller-account-v62">
      <section class="v62-profile-hero seller"><div class="v62-profile-main"><div class="v62-avatar business">${b.logo_url?`<img src="${esc(b.logo_url)}" alt="${esc(name)}">`:esc(name.slice(0,1).toUpperCase())}</div><div><span class="v62-kicker">CONTA EMPRESA</span><h1>${esc(name)}</h1><p>${esc(c.session.user.email||'')}</p></div></div><div class="v62-account-actions"><span class="v62-verified ${b.verified?'ok':'wait'}">${b.verified?'● Verificada':'● Em revisão'}</span><button class="v62-ghost" data-v62-signout>${icon('logout')} Sair</button></div></section>
      <section class="v62-stat-strip seller"><article><span>${icon('bag')}</span><div><strong>${offersCount||0}</strong><small>ofertas criadas</small></div></article><article><span>${icon('chart')}</span><div><strong>${views}</strong><small>visualizações reais</small></div></article><article><span>${icon('group')}</span><div><strong>${interest}</strong><small>pessoas interessadas</small></div></article></section>
      <section class="v62-grid-two"><article class="v62-card seller-brand"><div class="v62-card-icon">${icon('store')}</div><span class="v62-kicker">SEU NEGÓCIO</span><h2>${esc(name)}</h2><p>${esc([b.business_type,b.neighborhood,b.city,b.state].filter(Boolean).join(' · ')||'Complete os dados do seu negócio.')}</p><div class="v62-tags">${(b.categories||[]).slice(0,5).map(x=>`<span>${esc(String(x).replace(/_/g,' '))}</span>`).join('')}</div></article><article class="v62-card v62-action-card red"><span class="v62-kicker">PAINEL DA EMPRESA</span><h2>Acompanhe o que vende.</h2><p>Veja visualizações, cliques, pessoas no grupo e desempenho de cada oferta em tempo real.</p><button class="v62-primary inverse" data-v62-panel>${icon('chart')} Abrir painel</button></article></section>
      <section class="v62-settings"><button data-v62-business>${icon('store')}<span><b>Perfil da empresa</b><small>Nome, categoria, região e identidade</small></span>${icon('chevron')}</button><button data-v62-panel>${icon('chart')}<span><b>Painel de desempenho</b><small>Métricas e suas ofertas</small></span>${icon('chevron')}</button><button data-v62-signout>${icon('logout')}<span><b>Sair da conta</b><small>Encerrar esta sessão</small></span>${icon('chevron')}</button></section>
    </div>`;
    bindCommon(root,c);
    $$('[data-v62-panel]',root).forEach(b=>b.onclick=()=>{go('seller');document.dispatchEvent(new Event('junta:v62-refresh'))});
    $('[data-v62-business]',root)?.addEventListener('click',()=>openBusinessEditor(c));
  }

  function renderMasterAccount(root,c){
    root.innerHTML=`<div class="v62-account master-account-v62"><section class="v62-profile-hero"><div class="v62-profile-main"><div class="v62-avatar">M</div><div><span class="v62-kicker">ACESSO MASTER</span><h1>Central administrativa</h1><p>${esc(c.session.user.email||'')}</p></div></div><button class="v62-ghost" data-v62-signout>${icon('logout')} Sair</button></section><section class="v62-card v62-master-cta"><div>${icon('shield')}</div><div><span class="v62-kicker">CONTROLE DO JUNTA</span><h2>Abra o painel master</h2><p>Revise empresas, ofertas, métricas e o que está performando na plataforma.</p></div><button class="v62-primary" data-v62-master>Abrir painel</button></section></div>`;
    bindCommon(root,c);$('[data-v62-master]',root).onclick=()=>go('seller');
  }

  function bindCommon(root,c){
    $$('[data-v62-signout]',root).forEach(b=>b.onclick=async()=>{b.disabled=true;await db.auth.signOut();renderToken++;go('home');toast('Você saiu da conta.');syncHeaderLoggedOut()});
  }

  function syncHeaderLoggedOut(){const l=$('.account-label');if(l)l.textContent='Entrar';const a=$('.avatar-mini');if(a)a.textContent='J'}
  function formatCep(v){const d=String(v||'').replace(/\D/g,'').slice(0,8);return d.length===8?`${d.slice(0,5)}-${d.slice(5)}`:d}
  function bindCepMask(input){input.addEventListener('input',()=>input.value=formatCep(input.value))}
  async function lookupCep(raw){const cep=String(raw||'').replace(/\D/g,'');if(cep.length!==8)throw new Error('Digite um CEP válido.');const r=await fetch(`${SB_URL}/functions/v1/lookup-cep?cep=${cep}`,{headers:{Accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok||d.error)throw new Error(d.error||'CEP não encontrado.');return d}

  function modalShell(inner){const d=document.createElement('div');d.className='v62-modal';d.innerHTML=`<div class="v62-modal-card"><button class="v62-modal-close" aria-label="Fechar">×</button>${inner}</div>`;document.body.appendChild(d);$('.v62-modal-close',d).onclick=()=>d.remove();d.addEventListener('click',e=>{if(e.target===d)d.remove()});return d}
  function openCepEditor(c){const d=modalShell(`<span class="v62-kicker">SUA REGIÃO</span><h2>Onde você quer encontrar ofertas?</h2><p>Digite seu CEP. O Junta guarda apenas CEP, bairro, cidade e estado.</p><form class="v62-form"><label>CEP<input name="cep" required inputmode="numeric" maxlength="9" value="${esc(formatCep(c.profile?.postal_code||''))}" placeholder="00000-000"></label><button class="v62-primary" type="submit">Salvar região</button><div class="v62-form-result"></div></form>`);const input=$('input',d);bindCepMask(input);$('form',d).onsubmit=async e=>{e.preventDefault();const btn=$('button[type=submit]',d),result=$('.v62-form-result',d);btn.disabled=true;btn.innerHTML='<span class="v62-spinner"></span> Consultando...';try{const cep=input.value.replace(/\D/g,''),data=await lookupCep(cep);const {error}=await db.from('profiles').update({postal_code:cep,neighborhood:data.bairro||'',city:data.localidade||'',state:data.uf||''}).eq('user_id',c.session.user.id);if(error)throw error;d.remove();toast(`Região alterada para ${data.localidade}/${data.uf}`);await openAccount()}catch(err){result.textContent=err.message||'Não foi possível salvar.';result.classList.add('show');btn.disabled=false;btn.textContent='Salvar região'}}}
  function openProfileEditor(c){const d=modalShell(`<span class="v62-kicker">SEUS DADOS</span><h2>Como devemos te chamar?</h2><form class="v62-form"><label>Nome<input name="name" required maxlength="60" value="${esc(c.profile?.display_name||'')}"></label><button class="v62-primary" type="submit">Salvar</button><div class="v62-form-result"></div></form>`);$('form',d).onsubmit=async e=>{e.preventDefault();const name=String(new FormData(e.currentTarget).get('name')||'').trim();try{const {error}=await db.from('profiles').update({display_name:name}).eq('user_id',c.session.user.id);if(error)throw error;d.remove();toast('Nome atualizado ✓');await openAccount()}catch(err){const r=$('.v62-form-result',d);r.textContent=err.message;r.classList.add('show')}}}
  function openBusinessEditor(c){const b=c.business||{};const d=modalShell(`<span class="v62-kicker">PERFIL DA EMPRESA</span><h2>Identidade do seu negócio</h2><p>Esses dados aparecem para compradores e ajudam a localizar suas ofertas.</p><form class="v62-form"><label>Nome público<input name="name" required maxlength="80" value="${esc(b.name||'')}"></label><label>Tipo do comércio<input name="type" maxlength="80" value="${esc(b.business_type||'')}"></label><label>CEP<input name="cep" inputmode="numeric" maxlength="9" value="${esc(formatCep(b.postal_code||''))}"></label><button class="v62-primary" type="submit">Salvar alterações</button><div class="v62-form-result"></div></form>`);const cep=$('input[name="cep"]',d);bindCepMask(cep);$('form',d).onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),name=String(fd.get('name')||'').trim(),type=String(fd.get('type')||'').trim(),raw=String(fd.get('cep')||'').replace(/\D/g,'');try{let location={bairro:b.neighborhood||'',localidade:b.city||'',uf:b.state||''};if(raw&&raw!==String(b.postal_code||'').replace(/\D/g,''))location=await lookupCep(raw);const {error}=await db.from('businesses').update({name,business_type:type,postal_code:raw||b.postal_code,neighborhood:location.bairro||'',city:location.localidade||'',state:location.uf||''}).eq('id',b.id);if(error)throw error;d.remove();toast('Empresa atualizada ✓');await openAccount()}catch(err){const r=$('.v62-form-result',d);r.textContent=err.message;r.classList.add('show')}}}

  function interceptAccount(e){
    const nav=e.target?.closest?.('[data-nav="account"]'); if(!nav)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAccount();
  }
  window.addEventListener('click',interceptAccount,true);
  document.addEventListener('junta:v62-open-account',openAccount);
  db.auth.onAuthStateChange((_event,_session)=>{if($('.view.active')?.dataset.view==='account')setTimeout(openAccount,80)});

  // keep framing stable on rotations / browser chrome changes
  const fixViewport=()=>document.documentElement.style.setProperty('--v62-vh',`${window.innerHeight*.01}px`);
  fixViewport();window.addEventListener('resize',fixViewport,{passive:true});window.addEventListener('orientationchange',fixViewport,{passive:true});
})();