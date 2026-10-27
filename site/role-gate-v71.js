(() => {
  const SB_URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const SB_KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const CACHE_KEY='junta_role_cache_v81';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const db=window.__JUNTA_DB||(window.__JUNTA_DB=window.supabase?.createClient(SB_URL,SB_KEY));
  let role='guest',profile=null,business=null,session=null,readySent=false,guardInstalled=false,booting=false;

  function initials(name=''){
    const parts=String(name).trim().split(/\s+/).filter(Boolean);
    if(!parts.length)return 'J';
    return parts.length===1?parts[0][0].toUpperCase():(parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  }
  function timeout(p,ms){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms))]);}
  function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'null')}catch{return null}}
  function saveCache(){try{if(session?.user?.id)localStorage.setItem(CACHE_KEY,JSON.stringify({userId:session.user.id,email:session.user.email,role,profile,business,at:Date.now()}))}catch{}}
  function clearCache(){try{localStorage.removeItem(CACHE_KEY)}catch{}}
  function setBodyRole(){if(document.body)document.body.dataset.juntaRole=role;window.__JUNTA_ROLE=role;window.__JUNTA_PROFILE=profile;window.__JUNTA_BUSINESS=business;}
  function avatar(){
    const wrap=$('.avatar-mini'),label=$('.account-label'),pill=$('.account-pill');if(!wrap)return;
    wrap.classList.remove('has-business-logo');wrap.replaceChildren();
    if(role==='seller'&&business?.logo_url){const img=document.createElement('img');img.src=business.logo_url;img.alt=business.name||'Logo da empresa';wrap.appendChild(img);wrap.classList.add('has-business-logo');if(label)label.textContent=business.name||'Empresa';if(pill)pill.setAttribute('aria-label',`Conta da empresa ${business.name||''}`.trim());return;}
    if(role==='buyer'){wrap.textContent=initials(profile?.display_name||session?.user?.email?.split('@')[0]||'J');if(label)label.textContent=profile?.display_name||'Conta';return;}
    if(role==='seller'){wrap.textContent=initials(business?.name||profile?.display_name||'E');if(label)label.textContent=business?.name||'Empresa';return;}
    wrap.textContent='J';if(label)label.textContent='Entrar';
  }
  function setActiveView(view){
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
    if(view==='seller'){
      const labels={home:'Painel',offers:'Ofertas',seller:'Grupos',account:'Conta'};
      Object.entries(labels).forEach(([k,t])=>{const n=$(`.nav-item[data-nav="${k}"]`);if(n){n.style.display='flex';const s=n.querySelector('span');if(s)s.textContent=t}});
    }
  }
  function emitReady(){
    if(readySent)return;readySent=true;
    document.documentElement.classList.remove('junta-role-checking');document.documentElement.classList.add('junta-role-ready');
    document.dispatchEvent(new CustomEvent('junta:v71-role-ready',{detail:{role}}));
  }
  function openSeller(section='dashboard'){
    setActiveView('seller');
    if(window.JuntaSellerApp?.show){window.JuntaSellerApp.show(section);return;}
    document.dispatchEvent(new CustomEvent('junta:v71-seller-nav',{detail:{section}}));
    let tries=0;const t=setInterval(()=>{tries++;if(window.JuntaSellerApp?.show){clearInterval(t);window.JuntaSellerApp.show(section)}else if(tries>=12)clearInterval(t)},80);
  }
  function installGuard(){
    if(guardInstalled)return;guardInstalled=true;
    window.addEventListener('click',e=>{
      if(role!=='seller')return;
      const brand=e.target?.closest?.('.brand'),nav=e.target?.closest?.('[data-nav]');
      if(!brand&&!nav)return;
      const view=brand?'home':nav?.dataset.nav;
      if(!['home','offers','seller'].includes(view))return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      openSeller(view==='offers'?'offers':view==='seller'?'groups':'dashboard');
    },true);
  }
  function applyCached(){
    const c=readCache();if(!c||Date.now()-Number(c.at||0)>7*86400000)return;
    role=c.role||'guest';profile=c.profile||null;business=c.business||null;setBodyRole();avatar();
    if(role==='seller'&&business?.onboarding_complete){setActiveView('seller');installGuard();}
  }
  async function validate(){
    if(!db)return;
    try{
      const {data:{session:s}}=await timeout(db.auth.getSession(),1200);session=s;
      if(!session){role='guest';profile=null;business=null;clearCache();setBodyRole();avatar();return;}
      const cached=readCache();if(cached?.userId&&cached.userId!==session.user.id){clearCache();role='guest';profile=null;business=null;}
      const {data:p,error:pErr}=await timeout(db.from('profiles').select('*').eq('user_id',session.user.id).maybeSingle(),1800);if(pErr)throw pErr;
      profile=p;role=p?.role||'buyer';business=null;
      if(role==='seller'){
        const {data:b,error:bErr}=await timeout(db.from('businesses').select('*').eq('owner_id',session.user.id).order('created_at',{ascending:true}).limit(1).maybeSingle(),1800);if(bErr)throw bErr;business=b;
      }
      setBodyRole();avatar();saveCache();
      if(role==='seller'&&business?.onboarding_complete){setActiveView('seller');installGuard();openSeller('dashboard');}
    }catch(err){console.warn('Junta role validation',err?.message||err);}
  }
  async function boot(){
    if(booting)return;booting=true;applyCached();
    const watchdog=setTimeout(emitReady,650);
    try{await validate();}finally{clearTimeout(watchdog);emitReady();booting=false;}
  }
  window.JuntaRoleGate={get role(){return role},get profile(){return profile},get business(){return business},initials,avatar,openSeller};
  if(db)db.auth.onAuthStateChange((event,s)=>{session=s;if(event==='SIGNED_OUT'){role='guest';profile=null;business=null;clearCache();setBodyRole();avatar();readySent=false;emitReady();}else if(['SIGNED_IN','USER_UPDATED'].includes(event)){setTimeout(()=>{readySent=false;boot()},0);}});
  boot();
})();