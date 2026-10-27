(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let role='guest',locked=false;

  function readRole(){
    role=window.JuntaRoleGate?.role||window.__JUNTA_ROLE||document.body?.dataset.juntaRole||'guest';
    return role;
  }
  function unlockScroll(){
    document.documentElement.classList.remove('junta-role-checking');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
    if(document.body){
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow-y');
      document.body.style.removeProperty('height');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('touch-action');
    }
  }
  function active(view){
    unlockScroll();
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
    $$('.bottom-nav [data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===view));
    window.scrollTo({top:0,behavior:'auto'});
  }
  function openAccount(){
    active('account');
    document.dispatchEvent(new Event('junta:v62-open-account'));
    setTimeout(()=>window.JuntaRoleGate?.avatar?.(),0);
  }
  function seller(section){
    unlockScroll();
    if(window.JuntaSellerApp?.show) window.JuntaSellerApp.show(section);
    else window.JuntaRoleGate?.openSeller?.(section);
  }
  function buyerHome(){
    active('account');
    document.dispatchEvent(new Event('junta:v62-open-account'));
  }
  function routeNav(view){
    readRole();
    if(role==='seller'){
      if(view==='account') return openAccount();
      return seller(view==='offers'?'offers':view==='seller'?'groups':'dashboard');
    }
    if(role==='buyer'){
      if(view==='account'||view==='home') return buyerHome();
      active(view);
      return;
    }
    active(view);
  }
  function routeBrand(){
    readRole();
    if(role==='seller') seller('dashboard');
    else if(role==='buyer') buyerHome();
    else active('home');
  }
  function routeSearch(){
    readRole();
    if(role==='seller') seller('offers');
    else routeNav('offers');
  }

  function capture(e){
    if(locked) return;
    const search=e.target?.closest?.('#searchTrigger');
    const account=e.target?.closest?.('.account-pill');
    const brand=e.target?.closest?.('.brand');
    const nav=e.target?.closest?.('[data-nav]');
    if(!search&&!account&&!brand&&!nav) return;
    const view=search?'__search':account?'account':brand?'__brand':nav?.dataset.nav;
    if(!view) return;
    readRole();
    if(role==='guest' && !['account','__brand','__search'].includes(view)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    locked=true;
    try{
      if(view==='__brand') routeBrand();
      else if(view==='__search') routeSearch();
      else routeNav(view);
    } finally { setTimeout(()=>locked=false,70); }
  }

  function improveTouch(){
    $$('.nav-item,.account-pill,.brand,#searchTrigger,.v70-tabs button,.v70-offer,.v70-group-card,button').forEach(el=>{el.style.touchAction='manipulation'});
  }
  function avatar(){ window.JuntaRoleGate?.avatar?.(); }
  function refreshChrome(){
    unlockScroll();
    readRole();
    avatar();
    improveTouch();
  }

  window.addEventListener('click',capture,true);
  window.addEventListener('pointerup',e=>{
    const el=e.target?.closest?.('.account-pill,.brand,.nav-item,#searchTrigger');
    if(el) el.classList.add('junta-tapped');
    setTimeout(()=>el?.classList.remove('junta-tapped'),110);
  },{passive:true});

  document.addEventListener('junta:v71-role-ready',()=>{
    refreshChrome();
    setTimeout(refreshChrome,120);
    setTimeout(refreshChrome,500);
    if(role==='seller')seller('dashboard');
  });
  document.addEventListener('DOMContentLoaded',()=>{
    refreshChrome();
    setTimeout(refreshChrome,150);
  });
  window.addEventListener('pageshow',()=>{refreshChrome();});

  // No MutationObserver here: an earlier version repainted the avatar in response
  // to its own DOM mutation, causing continuous work on mobile browsers.
  unlockScroll();

  window.JuntaRuntime={routeNav,routeBrand,routeSearch,openAccount,unlockScroll,get role(){return role}};
})();