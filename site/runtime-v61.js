(() => {
  try {
    if(!window.supabase) return;
    const client=window.supabase.createClient('https://rrulyvkarrwbopqeciyz.supabase.co','sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU');
    const probe=client.from('analytics_events').insert({});
    let proto=Object.getPrototypeOf(probe);
    while(proto && !Object.prototype.hasOwnProperty.call(proto,'then')) proto=Object.getPrototypeOf(proto);
    if(proto && typeof proto.catch!=='function'){
      Object.defineProperty(proto,'catch',{configurable:true,value:function(onRejected){return Promise.resolve(this).catch(onRejected)}});
    }
  }catch{}
})();