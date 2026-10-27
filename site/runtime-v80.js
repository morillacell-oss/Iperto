(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  let role='guest',locked=false;

  function readRole(){
    role=window.JuntaRoleGate?.role||window.__JUNTA_ROLE||document.body?.dataset.juntaRole||'guest';
    return role;
  }
  function active(view){
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
    $$('.bottom-nav [data-nav]').forEach(n=>n.classList.toggle('active',n.dataset.nav===view));
    window.scrollTo({top:0,behavior:'instant'});
  }
  function openAccount(){
    active('account');
    document.dispatchEvent(new Event('junta:v62-open-account'));
    setTimeout(()=>window.JuntaRoleGate?.avatar?.(),0);
  }
  function seller(section){
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

  function capture(e){
    if(locked) return;
    const account=e.target?.closest?.('.account-pill');
    const brand=e.target?.closest?.('.brand');
    const nav=e.target?.closest?.('[data-nav]');
    if(!account&&!brand&&!nav) return;
    const view=account?'account':brand?'__brand':nav?.dataset.nav;
    if(!view) return;
    readRole();
    if(role==='guest' && view!=='account' && view!=='__brand') return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    locked=true;
    try{ view==='__brand'?routeBrand():routeNav(view); }
    finally{ setTimeout(()=>locked=false,80); }
  }

  function improveTouch(){
    document.documentElement.style.setProperty('--junta-tap','manipulation');
    $$('.nav-item,.account-pill,.brand,.v70-tabs button,.v70-offer,.v70-group-card,button').forEach(el=>{el.style.touchAction='manipulation'});
  }
  function avatar(){ window.JuntaRoleGate?.avatar?.(); }

  window.addEventListener('click',capture,true);
  window.addEventListener('pointerup',e=>{
    const el=e.target?.closest?.('.account-pill,.brand,.nav-item');
    if(el) el.classList.add('junta-tapped');
    setTimeout(()=>el?.classList.remove('junta-tapped'),120);
  },{passive:true});

  document.addEventListener('junta:v71-role-ready',()=>{readRole();avatar();improveTouch();if(role==='seller')seller('dashboard')});
  document.addEventListener('DOMContentLoaded',()=>{readRole();avatar();improveTouch()});

  const mo=new MutationObserver(()=>{avatar();});
  const startObs=()=>{const h=document.querySelector('.topbar');if(h)mo.observe(h,{subtree:true,childList:true,characterData:true})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startObs,{once:true});else startObs();

  window.JuntaRuntime={routeNav,routeBrand,openAccount,get role(){return role}};
})();