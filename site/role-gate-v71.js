(() => {
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let role='guest', profile=null, business=null, session=null;
  let enforcing=false, paintingAvatar=false;

  document.documentElement.classList.add('junta-role-checking');

  function initials(name=''){
    const parts=String(name).trim().split(/\s+/).filter(Boolean);
    if(!parts.length) return 'J';
    if(parts.length===1) return parts[0][0].toUpperCase();
    return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  }

  function avatarIsCorrect(){
    const wrap=$('.avatar-mini'); if(!wrap)return true;
    if(role==='seller'&&business?.logo_url){return wrap.querySelector('img')?.src===business.logo_url}
    if(role==='buyer'){return wrap.textContent.trim()===initials(profile?.display_name||session?.user?.email?.split('@')[0]||'J')}
    if(role==='seller'){return wrap.textContent.trim()===initials(business?.name||profile?.display_name||'E')}
    return wrap.textContent.trim()==='J';
  }

  function avatar(){
    const wrap=$('.avatar-mini');
    const pill=$('.account-pill');
    const label=$('.account-label');
    if(!wrap||paintingAvatar||avatarIsCorrect()) return;
    paintingAvatar=true;
    wrap.classList.remove('has-business-logo');
    wrap.replaceChildren();
    if(role==='seller' && business?.logo_url){
      const img=document.createElement('img');
      img.src=business.logo_url;
      img.alt=business.name||'Logo da empresa';
      img.loading='eager';
      img.decoding='async';
      wrap.appendChild(img);
      wrap.classList.add('has-business-logo');
      if(label) label.textContent=business.name||'Empresa';
      if(pill) pill.setAttribute('aria-label',`Conta da empresa ${business.name||''}`.trim());
    } else if(role==='buyer'){
      wrap.textContent=initials(profile?.display_name||session?.user?.email?.split('@')[0]||'J');
      if(label) label.textContent=profile?.display_name||'Conta';
      if(pill) pill.setAttribute('aria-label','Minha conta');
    } else if(role==='seller'){
      wrap.textContent=initials(business?.name||profile?.display_name||'E');
      if(label) label.textContent=business?.name||'Empresa';
    } else {
      wrap.textContent='J';
      if(label) label.textContent='Entrar';
    }
    requestAnimationFrame(()=>{paintingAvatar=false});
  }

  function setActiveView(view){
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
    if(view==='seller'){
      const home=$('.nav-item[data-nav="home"]'), offers=$('.nav-item[data-nav="offers"]'), seller=$('.nav-item[data-nav="seller"]');
      if(home){home.style.display='flex';const s=home.querySelector('span');if(s)s.textContent='Painel'}
      if(offers){offers.style.display='flex';const s=offers.querySelector('span');if(s)s.textContent='Ofertas'}
      if(seller){seller.style.display='flex';const s=seller.querySelector('span');if(s)s.textContent='Grupos'}
      const account=$('.nav-item[data-nav="account"]');if(account){const s=account.querySelector('span');if(s)s.textContent='Conta'}
    }
  }

  function sellerSectionFromNav(view){return view==='offers'?'offers':view==='seller'?'groups':'dashboard'}

  function activateSellerSection(section='dashboard'){
    let tries=0;
    const tryActivate=()=>{
      tries++;
      if(window.JuntaSellerApp?.show){window.JuntaSellerApp.show(section);return true}
      const tab=$(`[data-v70-section="${section}"]`);
      if(tab){tab.click();return true}
      if(tries<30){setTimeout(tryActivate,100);return false}
      return false;
    };
    tryActivate();
  }

  function openSeller(section='dashboard'){
    setActiveView('seller');
    document.dispatchEvent(new CustomEvent('junta:v71-seller-nav',{detail:{section}}));
    activateSellerSection(section);
  }

  function enforceSeller(){
    if(role!=='seller'||enforcing)return;
    const active=$('.view.active')?.dataset.view;
    if(active==='home'||active==='offers'){
      enforcing=true;
      setActiveView('seller');
      requestAnimationFrame(()=>{enforcing=false});
    }
    if(!avatarIsCorrect())avatar();
  }

  function installGuard(){
    window.addEventListener('click',e=>{
      if(role!=='seller')return;
      const brand=e.target?.closest?.('.brand');
      const nav=e.target?.closest?.('[data-nav]');
      if(brand){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSeller('dashboard');return;
      }
      if(!nav)return;
      const view=nav.dataset.nav;
      if(['home','offers','seller'].includes(view)){
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openSeller(sellerSectionFromNav(view));
      }
    },true);
    const appObserver=new MutationObserver(()=>enforceSeller());
    const app=$('#app');if(app)appObserver.observe(app,{subtree:true,attributes:true,attributeFilter:['class']});
    const topbar=$('.topbar');
    if(topbar){
      const headerObserver=new MutationObserver(()=>{if(!avatarIsCorrect())setTimeout(avatar,0)});
      headerObserver.observe(topbar,{subtree:true,childList:true,characterData:true});
    }
  }

  async function boot(){
    try{
      if(!window.supabase) throw new Error('Supabase indisponível');
      const db=window.supabase.createClient(SB_URL,SB_KEY);
      const {data:{session:s}}=await db.auth.getSession();
      session=s;
      if(!session){role='guest';avatar();return}
      const {data:p,error:pErr}=await db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle();
      if(pErr)throw pErr;
      profile=p;role=p?.role||'buyer';
      if(role==='seller'){
        const {data:b,error:bErr}=await db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle();
        if(bErr)throw bErr;
        business=b;
      }
      window.__JUNTA_ROLE=role;
      window.__JUNTA_PROFILE=profile;
      window.__JUNTA_BUSINESS=business;
      document.body?.setAttribute('data-junta-role',role);
      avatar();
      if(role==='seller'&&business?.onboarding_complete){
        setActiveView('seller');
        installGuard();
        openSeller('dashboard');
      } else if(role==='buyer') {
        const topbar=$('.topbar');
        if(topbar){const headerObserver=new MutationObserver(()=>{if(!avatarIsCorrect())setTimeout(avatar,0)});headerObserver.observe(topbar,{subtree:true,childList:true,characterData:true})}
      }
      setTimeout(avatar,250);setTimeout(avatar,900);setTimeout(avatar,1800);
    }catch(err){
      console.error('Junta role gate',err);
    }finally{
      document.documentElement.classList.remove('junta-role-checking');
      document.documentElement.classList.add('junta-role-ready');
      document.dispatchEvent(new CustomEvent('junta:v71-role-ready',{detail:{role}}));
    }
  }

  window.JuntaRoleGate={get role(){return role},get profile(){return profile},get business(){return business},initials,avatar,openSeller};
  boot();
})();