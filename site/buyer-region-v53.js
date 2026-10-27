(() => {
  const URL='https://rrulyvkarrwbopqeciyz.supabase.co';
  const KEY='sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU';
  const EDGE=`${URL}/functions/v1/lookup-cep`;
  const db=window.supabase?.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  async function lookupCep(raw){
    const cep=String(raw||'').replace(/\D/g,'');
    if(cep.length!==8) throw new Error('Digite um CEP com 8 números.');
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),10000);
    try{
      const r=await fetch(`${EDGE}?cep=${encodeURIComponent(cep)}`,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||d?.error||!d?.localidade) throw new Error(d?.error||'CEP não encontrado.');
      return {...d,cep};
    } finally { clearTimeout(timer); }
  }

  async function regionalOffers(region){
    if(!db) return [];
    const {data,error}=await db.from('offers')
      .select('id,title,status,is_demo,businesses!inner(city,state,neighborhood,postal_code)')
      .eq('is_demo',false)
      .in('status',['scheduled','open']);
    if(error) throw error;
    const city=String(region.localidade||'').trim().toLowerCase();
    const uf=String(region.uf||'').trim().toUpperCase();
    const bairro=String(region.bairro||'').trim().toLowerCase();
    return (data||[]).filter(o=>
      String(o.businesses?.city||'').trim().toLowerCase()===city &&
      String(o.businesses?.state||'').trim().toUpperCase()===uf
    ).sort((a,b)=>{
      const aa=String(a.businesses?.neighborhood||'').trim().toLowerCase()===bairro?0:1;
      const bb=String(b.businesses?.neighborhood||'').trim().toLowerCase()===bairro?0:1;
      return aa-bb;
    });
  }

  async function saveBuyerRegion(region){
    try{
      const {data:{session}}=await db.auth.getSession();
      if(!session) return;
      const {data:profile}=await db.from('profiles').select('role').eq('user_id',session.user.id).maybeSingle();
      if(profile?.role!=='buyer') return;
      await db.from('profiles').update({
        postal_code:region.cep,
        neighborhood:region.bairro||'',
        city:region.localidade||'',
        state:region.uf||''
      }).eq('user_id',session.user.id);
    }catch{}
  }

  function setRegion(region){
    localStorage.setItem('junta:v51-region',JSON.stringify(region));
  }

  function enhanceCepModal(modal){
    if(!modal||modal.dataset.v53) return;
    const form=modal.querySelector('.v51-cep form');
    if(!form) return;
    modal.dataset.v53='1';
    form.onsubmit=async e=>{
      e.preventDefault();
      const btn=form.querySelector('button[type="submit"]');
      const input=form.querySelector('input[name="cep"]');
      const result=modal.querySelector('.v51-cep-result');
      const old=btn?.innerHTML||'Buscar grupos';
      if(btn){btn.disabled=true;btn.innerHTML='<span class="v51-spinner"></span>Buscando';}
      try{
        const region=await lookupCep(input?.value||'');
        const list=await regionalOffers(region);
        setRegion(region);
        await saveBuyerRegion(region);
        if(result){
          result.classList.add('show');
          if(list.length){
            result.style.background='#effaf5';
            result.innerHTML=`<b>${esc(region.bairro||region.localidade)} · ${esc(region.localidade)} / ${esc(region.uf)}</b><span>Encontramos ofertas reais na sua região.</span><em>${list.length} oferta${list.length>1?'s':''} encontrada${list.length>1?'s':''}. Abrindo agora...</em>`;
            setTimeout(()=>{location.assign(`${location.pathname}?v=53#offers`)},550);
          }else{
            result.style.background='#fff6f4';
            result.innerHTML=`<b>${esc(region.bairro||region.localidade)} · ${esc(region.localidade)} / ${esc(region.uf)}</b><span>CEP localizado com sucesso.</span><em style="color:#ea1d2c">No momento não há ofertas na sua região. Volte em breve.</em>`;
          }
        }
      }catch(err){
        if(result){result.classList.add('show');result.style.background='#fff1ef';result.innerHTML=`<b>Não conseguimos consultar esse CEP</b><span>${esc(err?.message||'Tente novamente em alguns segundos.')}</span>`;}
      }finally{
        if(btn){btn.disabled=false;btn.innerHTML=old;}
      }
    };
  }

  function updateEmptyState(){
    document.querySelectorAll('.v51-empty-local').forEach(box=>{
      const h=box.querySelector('h3');
      const p=box.querySelector('p');
      if(h) h.textContent='No momento não há ofertas na sua região.';
      if(p) p.textContent='Assim que um comércio próximo publicar uma oferta aprovada, ela aparece aqui automaticamente. Volte em breve.';
    });
  }

  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.v51-overlay').forEach(enhanceCepModal);
    updateEmptyState();
  });

  window.addEventListener('load',()=>{
    document.querySelectorAll('.v51-overlay').forEach(enhanceCepModal);
    updateEmptyState();
    observer.observe(document.body,{childList:true,subtree:true});
  });
})();
