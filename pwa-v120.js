(() => {
  const VERSION='120';
  const DISMISS_KEY='junta_install_dismissed_at_v120';
  const INSTALLED_KEY='junta_installed_v120';
  const WEEK=7*24*60*60*1000;
  let deferredPrompt=null;
  let showing=false;

  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafariIOS=()=>isIOS()&&/safari/i.test(navigator.userAgent)&&!/crios|fxios|edgios/i.test(navigator.userAgent);

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register(`/sw.js?v=${VERSION}`,{updateViaCache:'none'}).catch(()=>{}),{once:true});
  }

  function recentlyDismissed(){
    try{const t=Number(localStorage.getItem(DISMISS_KEY)||0);return t&&Date.now()-t<WEEK}catch(_e){return false}
  }
  function rememberDismiss(){try{localStorage.setItem(DISMISS_KEY,String(Date.now()))}catch(_e){}}
  function rememberInstalled(){try{localStorage.setItem(INSTALLED_KEY,'1')}catch(_e){}}
  function removeCard(){document.querySelector('.j-install-card')?.remove();showing=false}

  function buyerHome(){
    const shell=document.querySelector('.j-buyer-shell');
    if(!shell)return null;
    const region=shell.querySelector('.j-buyer-region-card');
    return {shell,region};
  }

  function maybeShowInstall(){
    if(showing||isStandalone()||recentlyDismissed()||document.querySelector('.j-install-card'))return;
    const home=buyerHome();
    if(!home)return;
    const iosHint=isSafariIOS()&&!deferredPrompt;
    if(!deferredPrompt&&!iosHint)return;
    const card=document.createElement('section');
    card.className='j-install-card';
    card.setAttribute('aria-label','Instalar aplicativo JUNTA');
    card.innerHTML=`
      <span class="j-install-icon"><img src="/icons/icon-192.png" alt=""></span>
      <div class="j-install-copy"><small>JUNTA NO SEU CELULAR</small><strong>Abra mais rápido, como um aplicativo</strong><span>Instale na tela inicial e acompanhe seus grupos em um toque.</span></div>
      <div class="j-install-actions"><button class="j-install-btn" type="button">${iosHint?'Ver como instalar':'Instalar app'}</button><button class="j-install-close" type="button" aria-label="Agora não">×</button></div>
      ${iosHint?'<div class="j-install-ios" hidden>No iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</div>':''}`;
    const anchor=home.region||home.shell.querySelector('.j-buyer-header-v118');
    if(anchor?.parentNode)anchor.insertAdjacentElement('afterend',card); else home.shell.prepend(card);
    showing=true;
    card.querySelector('.j-install-close')?.addEventListener('click',()=>{rememberDismiss();removeCard()});
    card.querySelector('.j-install-btn')?.addEventListener('click',async()=>{
      if(iosHint){const hint=card.querySelector('.j-install-ios');if(hint)hint.hidden=!hint.hidden;return}
      if(!deferredPrompt)return;
      const btn=card.querySelector('.j-install-btn');if(btn){btn.disabled=true;btn.textContent='Abrindo...'}
      try{
        deferredPrompt.prompt();
        const choice=await deferredPrompt.userChoice;
        if(choice?.outcome==='accepted'){rememberInstalled();removeCard()}else{rememberDismiss();removeCard()}
      }catch(_e){if(btn){btn.disabled=false;btn.textContent='Instalar app'}}
      deferredPrompt=null;
    });
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    setTimeout(maybeShowInstall,350);
  });
  window.addEventListener('appinstalled',()=>{rememberInstalled();deferredPrompt=null;removeCard()});

  const observer=new MutationObserver(()=>{if(!showing)setTimeout(maybeShowInstall,80)});
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  else window.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
  setTimeout(maybeShowInstall,1100);
})();
