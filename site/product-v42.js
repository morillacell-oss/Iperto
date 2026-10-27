(() => {
  const URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const db=window.supabase.createClient(URL,KEY);
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const CATS=[['celulares','Celulares'],['eletronicos','Eletrônicos'],['ferramentas','Ferramentas'],['roupas','Roupas'],['moda','Calçados'],['restaurantes','Restaurantes'],['pizzarias','Pizzarias'],['comida','Lanches'],['mercado','Mercado'],['casa','Casa'],['beleza','Beleza'],['pet','Pet'],['automotivo','Automotivo']];
  let session=null,profile=null,business=null,authMode='signup',signupRole='buyer',sellerDraft={step:1,categories:[]};
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=v=>String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const toast=m=>window.showToast?window.showToast(m):alert(m);
  const roleIsMaster=()=>['master','admin'].includes(profile?.role);
  const go=view=>{if(typeof window.navigate==='function') window.navigate(view); else {$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));}};
  const stamp=(root,html)=>{root.innerHTML=`<div class="j42-root">${html}</div>`;root.dataset.v42='1'};

  async function loadIdentity(){
    const {data:{session:s}}=await db.auth.getSession(); session=s;
    profile=null;business=null;
    if(session){
      const {data:p}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(); profile=p;
      if(profile?.role==='seller'){
        const {data:b}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(); business=b;
      }
      if(profile?.role==='buyer') await applyPendingBuyerCep();
    }
    syncHeader();
  }
  function syncHeader(){
    const label=$('.account-label'); if(label)label.textContent=session?(roleIsMaster()?'Master':profile?.role==='seller'?'Empresa':profile?.display_name||'Conta'):'Entrar';
    const av=$('.avatar-mini'); if(av)av.textContent=session?(roleIsMaster()?'M':profile?.role==='seller'?'E':(profile?.display_name||'J').slice(0,1).toUpperCase()):'J';
    const sellerNav=$('.nav-item[data-nav="seller"]');
    if(sellerNav){
      const sp=sellerNav.querySelector('span');
      if(!session||profile?.role==='buyer')sellerNav.style.display='none'; else {sellerNav.style.display='flex';if(sp)sp.textContent=roleIsMaster()?'Master':'Painel';}
    }
  }

  async function routeAccount(){await loadIdentity();go('account');renderAccount();}
  async function routeSeller(){await loadIdentity();if(!session){go('account');renderAccount();return}go('seller');if(profile?.role==='seller')renderSeller();else if(roleIsMaster())renderMaster();else{go('account');renderAccount();toast('Sua conta atual é de comprador.');}}

  function renderAccount(){
    const root=$('[data-view="account"] .shell');if(!root)return;
    if(!session){renderAuth(root);return}
    if(profile?.role==='buyer'){
      stamp(root,`<div class="j42-head"><div><span class="j42-kicker">Conta comprador</span><h1 class="j42-title">Sua conta no Junta.</h1><p class="j42-sub">Acompanhe sua região, seus grupos e volte às ofertas quando quiser.</p></div><button class="j42-btn ghost" data-j42-signout>Sair</button></div>${buyerRegionMarkup()}<div class="j42-grid"><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Atalhos</h3></div><div class="j42-role-grid"><button class="j42-role" data-j42-offers><div class="j42-role-icon">↗</div><b>Explorar grupos</b><span>Veja produtos e grupos próximos da sua região.</span></button><button class="j42-role" data-j42-cep><div class="j42-role-icon">⌖</div><b>Alterar CEP</b><span>Atualize a região usada para priorizar os anúncios.</span></button></div></section></div>`);
      bindCommon(); $('[data-j42-offers]')?.addEventListener('click',()=>go('offers'));$('[data-j42-cep]')?.addEventListener('click',()=>openCepModal());return;
    }
    if(profile?.role==='seller'){routeSeller();return}
    if(roleIsMaster()){routeSeller();return}
  }
  function buyerRegionMarkup(){const has=profile?.postal_code;return `<section class="j42-card j42-panel" style="margin-bottom:12px"><div class="j42-panel-head"><div><span class="j42-kicker">Sua região</span><h3>${has?esc([profile.neighborhood,profile.city,profile.state].filter(Boolean).join(' · ')):'CEP ainda não informado'}</h3></div><span>${has?esc(profile.postal_code):'defina sua região'}</span></div><p class="j42-sub" style="margin:0">O Junta usa o CEP para priorizar comércios da sua cidade e região. Não precisa do número da sua casa.</p></section>`}

  function renderAuth(root){
    const roleBlock=authMode==='signup'?`<div class="j42-role-grid"><button class="j42-role ${signupRole==='buyer'?'active':''}" data-j42-role="buyer"><div class="j42-role-icon">↓</div><b>Quero comprar</b><span>Entrar em grupos, acompanhar faixas de preço e comprar mais barato.</span></button><button class="j42-role ${signupRole==='seller'?'active':''}" data-j42-role="seller"><div class="j42-role-icon">↗</div><b>Quero vender</b><span>Criar ofertas coletivas e acompanhar interesse e desempenho.</span></button></div>`:'';
    const extra=authMode==='signup'?`<label>Seu nome<input name="name" required placeholder="Como devemos te chamar?"></label>${signupRole==='buyer'?'<label>CEP<input name="cep" inputmode="numeric" maxlength="9" required placeholder="00000-000"></label>':''}`:'';
    stamp(root,`<div class="j42-auth"><div class="j42-auth-intro"><span class="j42-kicker">Sua conta</span><h1 class="j42-title">Entre no Junta<br><span>do seu jeito.</span></h1><p class="j42-sub">Comprador e vendedor têm experiências diferentes. Você escolhe na criação da conta e, depois do login, o Junta abre o painel certo automaticamente.</p></div><div class="j42-card j42-auth-panel"><div class="j42-auth-tabs"><button class="${authMode==='signup'?'active':''}" data-j42-authmode="signup">Criar conta</button><button class="${authMode==='login'?'active':''}" data-j42-authmode="login">Já tenho conta</button></div>${roleBlock}<form class="j42-form" id="j42Auth">${extra}<label>E-mail<input name="email" type="email" required placeholder="voce@email.com"></label><label>Senha<input name="password" type="password" minlength="6" required placeholder="Mínimo 6 caracteres"></label><button class="j42-btn primary" type="submit">${authMode==='signup'?(signupRole==='buyer'?'Criar conta para comprar':'Criar conta de vendedor'):'Entrar'}</button></form><div class="j42-auth-note"><i></i><span>O tipo de conta fica salvo no servidor. Acesso master não pode ser escolhido aqui.</span></div></div></div>`);
    $$('[data-j42-authmode]').forEach(b=>b.onclick=()=>{authMode=b.dataset.j42Authmode;renderAuth(root)});
    $$('[data-j42-role]').forEach(b=>b.onclick=()=>{signupRole=b.dataset.j42Role;renderAuth(root)});
    $('#j42Auth').onsubmit=handleAuth;
  }
  async function handleAuth(e){
    e.preventDefault();const fd=new FormData(e.currentTarget),email=String(fd.get('email')).trim(),password=String(fd.get('password')),name=String(fd.get('name')||'').trim(),cep=String(fd.get('cep')||'').replace(/\D/g,'');
    try{
      if(authMode==='signup'){
        if(signupRole==='buyer'&&cep.length!==8)throw new Error('Digite um CEP com 8 números.');
        const {data,error}=await db.auth.signUp({email,password,options:{data:{account_type:signupRole,display_name:name}}});if(error)throw error;
        if(signupRole==='buyer'&&cep)localStorage.setItem('junta:pending-cep',cep);
        if(!data.session){toast('Conta criada. Confirme seu e-mail e depois entre no Junta.');authMode='login';renderAccount();return}
      }else{
        const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;
      }
      await loadIdentity();
      if(profile?.role==='seller'||roleIsMaster())routeSeller();else{go('home');toast('Conta pronta. Agora escolha um grupo para comprar mais barato.');}
    }catch(err){toast(err.message||'Não foi possível continuar')}
  }
  async function applyPendingBuyerCep(){const cep=localStorage.getItem('junta:pending-cep');if(!cep||!profile?.user_id)return;try{const d=await lookupCep(cep);await db.from('profiles').update({postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''}).eq('user_id',session.user.id);profile={...profile,postal_code:cep,neighborhood:d.bairro||'',city:d.localidade||'',state:d.uf||''};localStorage.removeItem('junta:pending-cep')}catch{}}
  async function lookupCep(raw){const cep=String(raw).replace(/\D/g,'');if(cep.length!==8)throw new Error('CEP inválido');const r=await fetch(`https://viacep.com.br/ws/${cep}/json/`);const d=await r.json();if(d.erro)throw new Error('CEP não encontrado');return d}
  function openCepModal(){const d=document.createElement('div');d.className='j42-modal';d.innerHTML=`<div class="j42-card j42-modalbox" style="max-width:480px"><button class="j42-close">×</button><span class="j42-kicker">Sua região</span><h2 style="font-size:32px;letter-spacing:-.04em">Informe seu CEP</h2><p class="j42-sub">Usamos cidade e bairro para priorizar comércios próximos.</p><form class="j42-form"><label>CEP<input name="cep" inputmode="numeric" maxlength="9" required placeholder="00000-000"></label><button class="j42-btn primary">Salvar região</button></form></div>`;document.body.appendChild(d);$('.j42-close',d).onclick=()=>d.remove();$('form',d).onsubmit=async e=>{e.preventDefault();try{const raw=new FormData(e.currentTarget).get('cep'),data=await lookupCep(raw),cep=String(raw).replace(/\D/g,'');await db.from('profiles').update({postal_code:cep,neighborhood:data.bairro||'',city:data.localidade||'',state:data.uf||''}).eq('user_id',session.user.id);profile={...profile,postal_code:cep,neighborhood:data.bairro||'',city:data.localidade||'',state:data.uf||''};d.remove();renderAccount();toast('Região atualizada.')}catch(err){toast(err.message)}}}

  async function renderSeller(){
    const root=$('[data-view="seller"] .shell');if(!root)return;
    if(!session||profile?.role!=='seller'){routeAccount();return}
    const {data:b}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();business=b;
    if(!business?.onboarding_complete){renderSellerOnboarding(root);return}
    await renderSellerDashboard(root);
  }
  function renderSellerOnboarding(root){
    const step=sellerDraft.step||1,p=Math.max(20,step*20),sel=k=>sellerDraft.categories.includes(k)?'active':'';
    let body='';
    if(step===1)body=`<span class="j42-kicker">Passo 1 de 5</span><h2>Como sua empresa vai aparecer?</h2><p>Comece com o nome público e o tipo do comércio.</p><div class="j42-form"><label>Nome da empresa<input id="obName" value="${esc(sellerDraft.name||'')}" placeholder="Ex.: Brasa Burger"></label><label>Tipo do comércio<input id="obType" value="${esc(sellerDraft.business_type||'')}" placeholder="Ex.: Hamburgueria, loja de celulares..."></label></div>`;
    if(step===2)body=`<span class="j42-kicker">Passo 2 de 5</span><h2>O que você vende?</h2><p>Escolha uma ou mais categorias. Isso ajuda o Junta a mostrar suas ofertas para as pessoas certas.</p><div class="j42-chipgrid">${CATS.map(([k,n])=>`<button type="button" class="${sel(k)}" data-obcat="${k}">${n}</button>`).join('')}</div>`;
    if(step===3)body=`<span class="j42-kicker">Passo 3 de 5</span><h2>Onde sua empresa atende?</h2><p>O CEP será usado para aproximar suas ofertas de compradores da região.</p><div class="j42-form"><label>CEP<input id="obCep" inputmode="numeric" maxlength="9" value="${esc(sellerDraft.postal_code||'')}" placeholder="00000-000"></label></div>${sellerDraft.city?`<div class="j42-summary"><strong>${esc(sellerDraft.neighborhood||sellerDraft.city)}</strong><span>${esc(sellerDraft.city)} · ${esc(sellerDraft.state)}</span></div>`:''}`;
    if(step===4)body=`<span class="j42-kicker">Passo 4 de 5</span><h2>Dê um rosto à sua empresa.</h2><p>Essa imagem aparece junto das suas ofertas. Use logo ou foto nítida do comércio.</p><div class="j42-upload"><img id="obPreview" src="${sellerDraft.logo_preview||''}" alt=""><input id="obLogo" type="file" accept="image/jpeg,image/png,image/webp"><span>Escolher imagem</span></div>`;
    if(step===5)body=`<span class="j42-kicker">Passo 5 de 5</span><h2>Pronto para vender em grupo.</h2><p>Revise os dados. Depois disso você entra no painel e pode criar sua primeira oferta.</p><div class="j42-summary"><strong>${esc(sellerDraft.name||'Sua empresa')}</strong><span>${esc(sellerDraft.business_type||'Comércio')} · ${esc(sellerDraft.city||'Região não definida')}</span><span style="display:block;margin-top:5px">${sellerDraft.categories.map(k=>CATS.find(x=>x[0]===k)?.[1]||k).join(' · ')}</span></div>`;
    stamp(root,`<div class="j42-onboard"><span class="j42-kicker">Junta Empresas</span><h1 class="j42-title">Configure sua empresa.</h1><p class="j42-sub">Cinco passos rápidos para deixar seu perfil pronto e começar a criar grupos de compra.</p><div class="j42-progress"><i style="--p:${p}%"></i></div><form class="j42-card j42-stepbox" id="j42Onboard">${body}<div class="j42-onboard-actions"><button type="button" class="j42-btn ghost" data-obback ${step===1?'disabled':''}>Voltar</button><button type="submit" class="j42-btn primary">${step===5?'Concluir e abrir painel':'Continuar'}</button></div></form></div>`);
    $$('[data-obcat]').forEach(b=>b.onclick=()=>{const k=b.dataset.obcat;sellerDraft.categories=sellerDraft.categories.includes(k)?sellerDraft.categories.filter(x=>x!==k):[...sellerDraft.categories,k];renderSellerOnboarding(root)});
    $('#obLogo')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f){sellerDraft.logo_file=f;sellerDraft.logo_preview=URL.createObjectURL(f);$('#obPreview').src=sellerDraft.logo_preview}});
    $('[data-obback]')?.addEventListener('click',()=>{sellerDraft.step=Math.max(1,step-1);renderSellerOnboarding(root)});
    $('#j42Onboard').onsubmit=e=>handleOnboardStep(e,root);
  }
  async function handleOnboardStep(e,root){
    e.preventDefault();const step=sellerDraft.step;
    try{
      if(step===1){sellerDraft.name=$('#obName').value.trim();sellerDraft.business_type=$('#obType').value.trim();if(!sellerDraft.name||!sellerDraft.business_type)throw new Error('Preencha nome e tipo do comércio.')}
      if(step===2&&sellerDraft.categories.length===0)throw new Error('Escolha pelo menos uma categoria.');
      if(step===3){const raw=$('#obCep').value.replace(/\D/g,''),d=await lookupCep(raw);sellerDraft={...sellerDraft,postal_code:raw,city:d.localidade||'',state:d.uf||'',neighborhood:d.bairro||'',address_line:d.logradouro||''}}
      if(step===4&&!sellerDraft.logo_file&&!business?.logo_url)throw new Error('Adicione uma imagem para sua empresa.');
      if(step<5){sellerDraft.step=step+1;renderSellerOnboarding(root);return}
      await saveBusinessOnboarding();toast('Empresa configurada. Agora crie sua primeira oferta.');await renderSeller();
    }catch(err){toast(err.message||'Não foi possível continuar')}
  }
  async function uploadPublic(bucket,file,prefix){const ext=(file.name.split('.').pop()||'jpg').toLowerCase();const path=`${session.user.id}/${prefix}-${Date.now()}.${ext}`;const {error}=await db.storage.from(bucket).upload(path,file,{upsert:false});if(error)throw error;return db.storage.from(bucket).getPublicUrl(path).data.publicUrl}
  async function saveBusinessOnboarding(){
    let logo=business?.logo_url||null;if(sellerDraft.logo_file)logo=await uploadPublic('listing-images',sellerDraft.logo_file,'business');
    const payload={owner_id:session.user.id,name:sellerDraft.name,slug:`${slugify(sellerDraft.name)}-${session.user.id.slice(0,6)}`,category:sellerDraft.categories[0]||'outros',categories:sellerDraft.categories,business_type:sellerDraft.business_type,postal_code:sellerDraft.postal_code,city:sellerDraft.city,state:sellerDraft.state,neighborhood:sellerDraft.neighborhood,address_line:sellerDraft.address_line||'',logo_url:logo,onboarding_step:5,onboarding_complete:true,onboarding_completed_at:new Date().toISOString(),status:'pending'};
    let q;if(business?.id)q=db.from('businesses').update(payload).eq('id',business.id).select().single();else q=db.from('businesses').insert(payload).select().single();const {data,error}=await q;if(error)throw error;business=data;
  }
  const slugify=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,42)||'empresa';

  async function renderSellerDashboard(root){
    const {data:offers,error}=await db.from('offers').select('id,title,image_url,status,category,regular_price,junta_price,queue_target,max_units,price_review_status,created_at,offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count)').eq('business_id',business.id).order('created_at',{ascending:false});if(error)console.warn(error);
    const list=offers||[],stats=list.map(o=>o.offer_stats||{}),views=sum(stats,'view_count'),interests=sum(stats,'waitlist_count'),clicks=sum(stats,'detail_click_count'),active=list.filter(o=>['scheduled','open'].includes(o.status)).length;
    const chart=list.slice(0,6).reverse();
    stamp(root,`<div class="j42-head"><div><span class="j42-kicker">Junta Empresas</span><h1 class="j42-title">${esc(business.name)}</h1><p class="j42-sub">Veja o interesse real nas suas ofertas e crie novos grupos sem perder o controle do preço.</p></div><div class="j42-head-actions"><button class="j42-btn primary" data-j42-create>+ Nova oferta</button><button class="j42-btn ghost" data-j42-signout>Sair</button></div></div><div class="j42-kpis"><article class="j42-card j42-kpi hot"><span>OFERTAS ATIVAS</span><strong>${active}</strong><small>${list.length} no total</small></article><article class="j42-card j42-kpi"><span>VISUALIZAÇÕES</span><strong>${views}</strong><small>dados reais</small></article><article class="j42-card j42-kpi"><span>INTERESSADOS</span><strong>${interests}</strong><small>pessoas nos grupos</small></article><article class="j42-card j42-kpi"><span>ABERTURAS</span><strong>${clicks}</strong><small>cliques em detalhes</small></article></div><div class="j42-grid"><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Suas ofertas</h3><span>${list.length?`${list.length} cadastradas`:'sem ofertas ainda'}</span></div>${sellerRows(list)}</section><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Interesse por oferta</h3><span>pessoas no grupo</span></div>${chart.length?barChart(chart.map(o=>({label:o.title.slice(0,12),value:Number(o.offer_stats?.waitlist_count||0)}))):empty('Sem dados ainda','O gráfico aparece quando suas ofertas começarem a receber interesse.')}</section></div>`);
    bindCommon();$('[data-j42-create]')?.addEventListener('click',openOfferCreate);
  }
  const sum=(arr,key)=>arr.reduce((a,x)=>a+Number(x?.[key]||0),0);
  function sellerRows(list){if(!list.length)return empty('Nenhuma oferta criada','Crie sua primeira oferta para começar a medir interesse real.');return `<div class="j42-seller-list">${list.map(o=>`<div class="j42-seller-row"><img src="${esc(o.image_url||'')}" alt=""><div><b>${esc(o.title)}</b><span>${statusLabel(o.status)} · ${esc(o.price_review_status||'sem revisão')}</span></div><div><small>NO GRUPO</small><strong>${Number(o.offer_stats?.waitlist_count||0)}</strong></div><div><small>VIEWS</small><strong>${Number(o.offer_stats?.view_count||0)}</strong></div></div>`).join('')}</div>`}
  const statusLabel=s=>({pending:'Em análise',scheduled:'Agendada',open:'Aberta',draft:'Rascunho',closed:'Encerrada',sold_out:'Esgotada',cancelled:'Cancelada'})[s]||s;
  function empty(title,text){return `<div class="j42-empty"><b>${esc(title)}</b><span>${esc(text)}</span></div>`}
  function barChart(points){const max=Math.max(1,...points.map(x=>x.value));return `<div class="j42-chart">${points.map(x=>`<div class="j42-bar" style="height:${Math.max(3,(x.value/max)*100)}%"><span>${x.value}</span><small>${esc(x.label)}</small></div>`).join('')}</div>`}

  function openOfferCreate(){
    const d=document.createElement('div');d.className='j42-modal';d.innerHTML=`<div class="j42-card j42-modalbox"><button class="j42-close">×</button><span class="j42-kicker">Nova oferta</span><h2 style="font-size:34px;letter-spacing:-.045em;margin:8px 0">Monte o preço por volume.</h2><p class="j42-sub">Informe o preço normal e o menor valor que ainda é sustentável para sua empresa. O Junta exige que o preço caia conforme o grupo cresce.</p><form class="j42-form" id="j42Offer"><div class="j42-create-grid"><label>Produto<input name="title" required placeholder="Ex.: Combo Smash Duplo"></label><label>Categoria<select name="category" required>${CATS.map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label></div><label>Descrição<textarea name="description" required placeholder="O que o comprador recebe?"></textarea></label><div class="j42-create-grid"><label>Preço normal<input name="regular" type="number" step="0.01" min="0.01" required></label><label>Menor preço sustentável<input name="floor" type="number" step="0.01" min="0.01" required></label></div><div class="j42-create-grid"><label>Quantidade disponível<input name="stock" type="number" min="25" value="25" required><small>Para usar as cinco faixas, tenha ao menos 25 unidades.</small></label><label>Foto do produto<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required></label></div><div class="j42-price-ladder"><h3>Preço conforme o grupo cresce</h3><p>5 → 10 → 15 → 20 → 25 pessoas. Cada etapa precisa ficar mais barata.</p><div class="j42-tier-grid">${[5,10,15,20,25].map(n=>`<label><span>${n} pessoas</span><input name="tier${n}" type="number" step="0.01" required></label>`).join('')}</div><div class="j42-warning" id="j42TierWarning">Preencha preço normal e piso. O Junta sugere as faixas automaticamente.</div></div><button class="j42-btn primary" type="submit">Enviar oferta para análise</button></form></div>`;document.body.appendChild(d);$('.j42-close',d).onclick=()=>d.remove();const f=$('#j42Offer');const refresh=()=>suggestTiers(f);f.regular.oninput=refresh;f.floor.oninput=refresh;f.onsubmit=e=>submitOffer(e,d);refresh();
  }
  function suggestTiers(f){const r=Number(f.regular.value),floor=Number(f.floor.value),warn=$('#j42TierWarning');if(!r||!floor){warn.textContent='Preencha preço normal e piso. O Junta sugere as faixas automaticamente.';return}if(floor>r*.90){warn.textContent='Para chegar à faixa de 25 pessoas, o menor preço sustentável precisa permitir pelo menos 10% de desconto.';return}const ds=[.02,.04,.06,.08,.10];[5,10,15,20,25].forEach((n,i)=>{const el=f[`tier${n}`];if(!el.dataset.touched)el.value=Math.max(floor,r*(1-ds[i])).toFixed(2);el.oninput=()=>el.dataset.touched='1'});warn.textContent='Você pode ajustar as faixas, mas elas precisam cair progressivamente e nunca ficar abaixo do piso.'}
  function validateTiers(r,floor,prices){const mins=[.02,.04,.06,.08,.10];if(floor>r*.90)throw new Error('O piso não permite o desconto mínimo da faixa de 25 pessoas.');for(let i=0;i<prices.length;i++){if(prices[i]<floor)throw new Error('Nenhuma faixa pode ficar abaixo do preço sustentável.');if(prices[i]>r*(1-mins[i])+0.001)throw new Error(`A faixa de ${[5,10,15,20,25][i]} pessoas precisa ter desconto maior.`);if(i&&prices[i]>=prices[i-1])throw new Error('Cada faixa maior precisa ter preço menor que a anterior.')}}
  async function submitOffer(e,modal){
    e.preventDefault();const f=e.currentTarget,fd=new FormData(f),r=Number(fd.get('regular')),floor=Number(fd.get('floor')),stock=Number(fd.get('stock')),prices=[5,10,15,20,25].map(n=>Number(fd.get(`tier${n}`)));try{validateTiers(r,floor,prices);const file=fd.get('image');if(!(file instanceof File)||!file.size)throw new Error('A foto do produto é obrigatória.');const image=await uploadPublic('offer-images',file,'offer');const now=Date.now(),opens=new Date(now+86400000).toISOString(),closes=new Date(now+8*86400000).toISOString();const payload={business_id:business.id,created_by:session.user.id,title:String(fd.get('title')).trim(),description:String(fd.get('description')).trim(),category:String(fd.get('category')),image_url:image,regular_price:r,junta_price:prices[4],min_sustainable_price:floor,min_paid:5,max_units:stock,queue_target:stock,opens_at:opens,closes_at:closes,status:'pending',featured:false,is_demo:false,demo_seed_count:0,price_review_status:'unreviewed'};const {data:o,error}=await db.from('offers').insert(payload).select().single();if(error)throw error;const tiers=[5,10,15,20,25].map((n,i)=>({offer_id:o.id,people_count:n,unit_price:prices[i]}));const {error:te}=await db.from('offer_price_tiers').insert(tiers);if(te)throw te;modal.remove();toast('Oferta enviada para análise do Junta.');renderSeller()}catch(err){toast(err.message||'Não foi possível criar a oferta')}}

  async function renderMaster(){
    const root=$('[data-view="seller"] .shell');if(!root)return;if(!roleIsMaster()){routeAccount();return}
    const since=new Date(Date.now()-30*86400000).toISOString();
    const [{data:biz},{data:offers},{data:events}]=await Promise.all([
      db.from('businesses').select('id,name,status,category,categories,city,state,created_at').order('created_at',{ascending:false}),
      db.from('offers').select('id,title,status,category,regular_price,junta_price,price_review_status,business_id,created_at,businesses(name),offer_stats(view_count,detail_click_count,join_click_count,waitlist_count,paid_count)').order('created_at',{ascending:false}),
      db.from('analytics_events').select('event_type,offer_id,business_id,created_at').gte('created_at',since).order('created_at',{ascending:true}).limit(5000)
    ]);
    const B=biz||[],O=offers||[],E=events||[];const views=E.filter(x=>['impression','view','offer_view'].includes(x.event_type)).length||sum(O.map(o=>o.offer_stats||{}),'view_count'),opens=E.filter(x=>['detail_open','offer_click'].includes(x.event_type)).length||sum(O.map(o=>o.offer_stats||{}),'detail_click_count'),joins=sum(O.map(o=>o.offer_stats||{}),'waitlist_count'),pendingO=O.filter(o=>o.status==='pending'),pendingB=B.filter(b=>b.status==='pending');
    const daily=last7().map(d=>({label:d.label,value:E.filter(x=>sameDay(new Date(x.created_at),d.date)&&['impression','view','offer_view','detail_open','offer_click'].includes(x.event_type)).length}));
    const catMap={};O.forEach(o=>{catMap[o.category]=(catMap[o.category]||0)+Number(o.offer_stats?.waitlist_count||0)});const cats=Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,3);const top=[...O].sort((a,b)=>Number(b.offer_stats?.view_count||0)-Number(a.offer_stats?.view_count||0)).slice(0,8);
    stamp(root,`<div class="j42-head"><div><span class="j42-kicker">Central master</span><h1 class="j42-title">Leitura real do Junta.</h1><p class="j42-sub">Tudo abaixo vem do banco. Quando não existe atividade, o painel mostra zero em vez de preencher com números de demonstração.</p></div><div class="j42-head-actions"><span class="j42-realbadge">Dados do Supabase</span><button class="j42-btn ghost" data-j42-signout>Sair</button></div></div><div class="j42-kpis"><article class="j42-card j42-kpi hot"><span>EMPRESAS</span><strong>${B.length}</strong><small>${pendingB.length} aguardando análise</small></article><article class="j42-card j42-kpi"><span>OFERTAS</span><strong>${O.length}</strong><small>${pendingO.length} pendentes</small></article><article class="j42-card j42-kpi"><span>VISUALIZAÇÕES</span><strong>${views}</strong><small>eventos registrados</small></article><article class="j42-card j42-kpi"><span>PESSOAS NOS GRUPOS</span><strong>${joins}</strong><small>${opens} aberturas de oferta</small></article></div><div class="j42-grid"><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Atividade nos últimos 7 dias</h3><span>eventos reais</span></div>${daily.some(x=>x.value)?barChart(daily):empty('Ainda sem atividade suficiente','Cliques e visualizações vão aparecer aqui conforme as pessoas usarem o Junta.')}</section><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Interesse por categoria</h3><span>pessoas nos grupos</span></div>${categoryDonut(cats)}</section></div><div class="j42-grid" style="margin-top:12px"><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Ofertas que mais chamam atenção</h3><span>ordenado por visualizações</span></div>${masterRows(top)}</section><section class="j42-card j42-panel"><div class="j42-panel-head"><h3>Fila de aprovação</h3><span>${pendingO.length+pendingB.length} itens</span></div>${reviewRows(pendingB,pendingO)}</section></div>`);
    bindCommon();bindMasterActions();
  }
  function last7(){const arr=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);arr.push({date:d,label:['dom','seg','ter','qua','qui','sex','sáb'][d.getDay()]})}return arr}
  const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  function categoryDonut(cats){const total=cats.reduce((a,x)=>a+x[1],0);if(!total)return empty('Ainda sem dados','Quando compradores entrarem nos grupos, as categorias mais fortes aparecerão aqui.');const vals=cats.map(x=>x[1]/total*100),p1=`${vals[0]||0}%`,p2=`${(vals[0]||0)+(vals[1]||0)}%`;return `<div class="j42-donut" style="--p1:${p1};--p2:${p2}"></div><div class="j42-legend">${cats.map((x,i)=>`<div><span><i style="background:${['#ff433b','#ff9f97','#ffd0cb'][i]}"></i>${esc(CATS.find(c=>c[0]===x[0])?.[1]||x[0])}</span><b>${x[1]}</b></div>`).join('')}</div>`}
  function masterRows(list){if(!list.length)return empty('Ainda sem ofertas','As ofertas reais aparecerão aqui.');return `<div class="j42-master-table">${list.map(o=>`<div class="j42-mrow"><div><b>${esc(o.title)}</b><span>${esc(o.businesses?.name||'')}</span></div><strong>${Number(o.offer_stats?.view_count||0)}</strong><strong>${Number(o.offer_stats?.detail_click_count||0)}</strong><strong>${Number(o.offer_stats?.waitlist_count||0)}</strong><span>${statusLabel(o.status)}</span></div>`).join('')}</div><div class="j42-mrow" style="font-weight:900"><span>Oferta</span><span>views</span><span>cliques</span><span>grupo</span><span>status</span></div>`}
  function reviewRows(biz,offers){if(!biz.length&&!offers.length)return empty('Nada pendente','Não há empresas ou ofertas aguardando aprovação.');return `<div class="j42-master-table">${biz.map(b=>`<div class="j42-mrow" style="grid-template-columns:minmax(150px,1fr) 90px"><div><b>${esc(b.name)}</b><span>Empresa · ${esc(b.city||'')}</span></div><div class="j42-actions"><button class="ok" data-approve-biz="${b.id}">Aprovar</button></div></div>`).join('')}${offers.map(o=>`<div class="j42-mrow" style="grid-template-columns:minmax(150px,1fr) 120px"><div><b>${esc(o.title)}</b><span>${esc(o.businesses?.name||'')} · normal ${money(o.regular_price)} · grupo ${money(o.junta_price)}</span></div><div class="j42-actions"><button class="ok" data-approve-offer="${o.id}">Aprovar</button><button class="no" data-reject-offer="${o.id}">Rejeitar</button></div></div>`).join('')}</div>`}
  function bindMasterActions(){
    $$('[data-approve-biz]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('businesses').update({status:'approved',verified:true}).eq('id',b.dataset.approveBiz);if(error)toast(error.message);else{toast('Empresa aprovada.');renderMaster()}});
    $$('[data-approve-offer]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('offers').update({status:'scheduled',price_review_status:'approved'}).eq('id',b.dataset.approveOffer);if(error)toast(error.message);else{toast('Oferta aprovada.');renderMaster()}});
    $$('[data-reject-offer]').forEach(b=>b.onclick=async()=>{const {error}=await db.from('offers').update({status:'cancelled',price_review_status:'flagged',price_review_reason:'Reprovada pelo master'}).eq('id',b.dataset.rejectOffer);if(error)toast(error.message);else{toast('Oferta reprovada.');renderMaster()}});
  }
  function bindCommon(){$$('[data-j42-signout]').forEach(b=>b.onclick=async()=>{await db.auth.signOut();session=null;profile=null;business=null;syncHeader();go('home');toast('Você saiu da conta.')})}

  document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(!nav)return;const view=nav.dataset.nav;if(view==='account'||view==='seller'){e.preventDefault();e.stopImmediatePropagation();view==='account'?routeAccount():routeSeller()}},true);
  db.auth.onAuthStateChange(()=>setTimeout(loadIdentity,0));
  window.addEventListener('load',async()=>{await loadIdentity();setTimeout(()=>{const active=$('.view.active')?.dataset.view;if(active==='account')renderAccount();if(active==='seller')profile?.role==='seller'?renderSeller():roleIsMaster()?renderMaster():null},80)});
})();
