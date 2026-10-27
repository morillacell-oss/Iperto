import { readFileSync, writeFileSync } from 'node:fs';

const appPath='dist/app-v100.js';
let app=readFileSync(appPath,'utf8');
const helpers=readFileSync('patches/completion-helpers-v112.jsfrag','utf8').trimEnd();
const buyerCard=readFileSync('patches/buyer-card-v112.jsfrag','utf8').trimEnd();
const buyerFlow=readFileSync('patches/buyer-order-flow-v112.jsfrag','utf8').trimEnd();
const sellerFlow=readFileSync('patches/seller-fulfillment-v112.jsfrag','utf8').trimEnd();
const whatsappFlow=readFileSync('patches/business-whatsapp-v112.jsfrag','utf8').trimEnd();

function replaceChecked(label,needle,replacement){
  const before=app;
  app=app.replace(needle,()=>replacement);
  if(app===before)throw new Error(`V112 patch failed: ${label}`);
}

replaceChecked('state completion arrays',
  "    sellerEvents: [],\n    sellerLoadedAt: 0,\n    buyerLoadedAt: 0,",
  "    sellerEvents: [],\n    sellerTierRuns: [],\n    sellerOrders: [],\n    sellerNotifications: [],\n    buyerTierRuns: [],\n    buyerOrders: [],\n    buyerNotifications: [],\n    sellerLoadedAt: 0,\n    buyerLoadedAt: 0,"
);

app=app.replaceAll(
  "id,name,logo_url,city,state,neighborhood,verified,status",
  "id,name,logo_url,whatsapp,city,state,neighborhood,verified,status"
);
app=app.replaceAll(
  "id,name,logo_url,city,state,neighborhood,status,verified",
  "id,name,logo_url,whatsapp,city,state,neighborhood,status,verified"
);
app=app.replaceAll(
  "offer_price_tiers(people_count,unit_price),businesses!inner",
  "offer_price_tiers(people_count,unit_price),offer_tier_runs(id,offer_id,target_people,unit_price,status,achieved_at),businesses!inner"
);

replaceChecked('seller completion load',
  "    state.sellerOffers=offersRes.data||[]; state.sellerEvents=eventsRes.data||[]; state.sellerLoadedAt=Date.now();",
  `    state.sellerOffers=offersRes.data||[]; state.sellerEvents=eventsRes.data||[];\n    const sellerOfferIds=state.sellerOffers.map(o=>o.id);\n    const [runsRes,ordersRes,notesRes]=await timeout(Promise.all([\n      sellerOfferIds.length?db.from('offer_tier_runs').select('*').in('offer_id',sellerOfferIds).order('achieved_at',{ascending:false}):Promise.resolve({data:[],error:null}),\n      db.from('group_orders').select('*').eq('business_id',state.business.id).order('created_at',{ascending:false}),\n      db.from('user_notifications').select('*').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(20)\n    ]),5000);\n    if(runsRes.error)throw runsRes.error;if(ordersRes.error)throw ordersRes.error;if(notesRes.error)throw notesRes.error;\n    state.sellerTierRuns=runsRes.data||[];state.sellerOrders=ordersRes.data||[];state.sellerNotifications=notesRes.data||[];state.sellerLoadedAt=Date.now();`
);

replaceChecked('buyer completion load',
  "    state.buyerOffers=[...regional,...cancelled.filter(o=>!seen.has(o.id))];\n    state.buyerLoadedAt=Date.now();",
  `    state.buyerOffers=[...regional,...cancelled.filter(o=>!seen.has(o.id))];\n    const buyerOfferIds=state.buyerOffers.map(o=>o.id);\n    const [runsRes,ordersRes,notesRes]=await timeout(Promise.all([\n      buyerOfferIds.length?db.from('offer_tier_runs').select('*').in('offer_id',buyerOfferIds).order('achieved_at',{ascending:false}):Promise.resolve({data:[],error:null}),\n      db.from('group_orders').select('*').eq('user_id',state.session.user.id).order('created_at',{ascending:false}),\n      db.from('user_notifications').select('*').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(20)\n    ]),5000);\n    if(runsRes.error)throw runsRes.error;if(ordersRes.error)throw ordersRes.error;if(notesRes.error)throw notesRes.error;\n    state.buyerTierRuns=runsRes.data||[];state.buyerOrders=ordersRes.data||[];state.buyerNotifications=notesRes.data||[];state.buyerLoadedAt=Date.now();`
);

replaceChecked('completion helpers',
  "  function tierMemberCount(o,people){",
  `${helpers}\n\n  function tierMemberCount(o,people){`
);

replaceChecked('buyer card achieved UI',
  /  function buyerOfferCard\(o,joined,membership\)\{[\s\S]*?\n  function flashCard/,
  `${buyerCard}\n  function flashCard`
);

replaceChecked('buyer achieved checkout flow',
  /  function openOfferModal\(o,allowJoin\)\{[\s\S]*?\n  function openCepModal/,
  `${buyerFlow}\n\n  function openCepModal`
);

replaceChecked('seller achieved fulfillment view',
  /  function sellerGroupsView\(rows\)\{[\s\S]*?\n\n  function sellerOfferRow/,
  `${sellerFlow}\n  function sellerOfferRow`
);

replaceChecked('seller paint bindings',
  "    $$('[data-seller-offer]',root).forEach(b=>b.onclick=()=>openSellerOffer(rows.find(o=>o.id===b.dataset.sellerOffer)));\n    $$('[data-new-offer]',root).forEach(b=>b.onclick=openCreateOffer);",
  `    const sellerAlert=completionNotificationStrip('seller');if(sellerAlert)root.insertAdjacentHTML('afterbegin',sellerAlert);\n    $$('[data-completion-notification]',root).forEach(b=>b.onclick=()=>openCompletionNotification(b.dataset.completionNotification,b.dataset.notificationOffer,'seller'));\n    $$('[data-seller-offer]',root).forEach(b=>b.onclick=()=>openSellerOffer(rows.find(o=>o.id===b.dataset.sellerOffer)));\n    $$('[data-new-offer]',root).forEach(b=>b.onclick=openCreateOffer);\n    $$('[data-edit-whatsapp]',root).forEach(b=>b.onclick=openBusinessWhatsapp);\n    $$('[data-order-next]',root).forEach(b=>b.onclick=()=>updateSellerOrderStatus(b.dataset.orderNext,b.dataset.orderStatus));`
);

replaceChecked('buyer paint notification',
  "    $$('[data-buyer-offer]',root).forEach(b=>b.onclick=()=>openBuyerOffer(offers.find(o=>o.id===b.dataset.buyerOffer)));",
  `    const buyerAlert=completionNotificationStrip('buyer');if(buyerAlert)root.insertAdjacentHTML('afterbegin',buyerAlert);\n    $$('[data-completion-notification]',root).forEach(b=>b.onclick=()=>openCompletionNotification(b.dataset.completionNotification,b.dataset.notificationOffer,'buyer'));\n    $$('[data-buyer-offer]',root).forEach(b=>b.onclick=()=>openBuyerOffer(offers.find(o=>o.id===b.dataset.buyerOffer)));`
);

replaceChecked('whatsapp helper insert',
  "  function renderAccount(){",
  `${whatsappFlow}\n\n  function renderAccount(){`
);

replaceChecked('account whatsapp button',
  '<button class="j-btn secondary" id="goSellerOffers">Minhas ofertas</button>',
  '<button class="j-btn secondary" id="editWhatsapp">WhatsApp de pedidos</button><button class="j-btn secondary" id="goSellerOffers">Minhas ofertas</button>'
);

replaceChecked('account whatsapp binding',
  "if($('#goSellerOffers'))$('#goSellerOffers').onclick=()=>navigate('seller-offers');$('#editName').onclick=openEditName;",
  "if($('#editWhatsapp'))$('#editWhatsapp').onclick=openBusinessWhatsapp;if($('#goSellerOffers'))$('#goSellerOffers').onclick=()=>navigate('seller-offers');$('#editName').onclick=openEditName;"
);

replaceChecked('start realtime after profile',
  "      await loadProfileAndBusiness();\n      setAvatar();",
  "      await loadProfileAndBusiness();\n      setAvatar();\n      startNotificationRealtime();"
);

app=app.replaceAll("await db.auth.signOut();","stopNotificationRealtime();await db.auth.signOut();");
app=app.replace("if(event==='SIGNED_OUT'){state.session=null;","if(event==='SIGNED_OUT'){stopNotificationRealtime();state.session=null;");

if(!app.includes("buyer_submit_group_order"))throw new Error('V112 validation failed: buyer checkout RPC missing');
if(!app.includes("buyer_choose_offer_tier"))throw new Error('V112 validation failed: atomic tier RPC missing');
if(!app.includes("data-order-next"))throw new Error('V112 validation failed: seller order controls missing');
if(!app.includes("WhatsApp de pedidos"))throw new Error('V112 validation failed: seller WhatsApp setup missing');
if(!app.includes("startNotificationRealtime"))throw new Error('V112 validation failed: realtime notifications missing');
if(!app.includes("$$('[data-buyer-offer]',root).forEach"))throw new Error('V112 validation failed: buyer selector regressed');
new Function(app);
writeFileSync(appPath,app);

const cssPath='dist/app-v100.css';
let css=readFileSync(cssPath,'utf8');
css+='\n'+readFileSync('patches/order-flow-v112.cssfrag','utf8')+'\n';
writeFileSync(cssPath,css);

const indexPath='dist/index.html';
let index=readFileSync(indexPath,'utf8')
  .replace(/app-v100\.css\?v=\d+/g,'app-v100.css?v=112')
  .replace(/app-v100\.js\?v=\d+/g,'app-v100.js?v=112');
writeFileSync(indexPath,index);

console.log('Junta V112 completed-group checkout + WhatsApp flow ready');
