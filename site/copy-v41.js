(() => {
  const $=s=>document.querySelector(s);
  const eyebrow=$('.hero .eyebrow');
  const h=$('.hero h1');
  const lead=$('.hero-lead');
  if(eyebrow) eyebrow.innerHTML='<span class="live-dot"></span> COMPRE COM OUTRAS PESSOAS';
  if(h) h.innerHTML='Compre junto.<br><span>Pague menos.</span>';
  if(lead) lead.textContent='Entre no grupo do produto que você quer. Quando o grupo chega a 5, 10, 15, 20 e 25 pessoas, novas faixas de preço podem ser liberadas. Quanto mais gente compra, menor pode ficar o valor para todos.';
  const cta=$('[data-scroll="offers"]'); if(cta) cta.textContent='Encontrar grupos perto de mim';
  const how=$('.how-head h2'); if(how) how.innerHTML='Mais pessoas no grupo.<br>Preço menor por unidade.';
  const howP=$('.how-head>p'); if(howP) howP.textContent='O lojista informa o preço normal e até onde consegue baixar sem prejuízo. O Junta organiza as faixas e mostra para todo mundo quanto falta para destravar o próximo preço.';
  const sellerH=$('.seller-teaser h2'); if(sellerH) sellerH.innerHTML='Pedido maior.<br><span>Preço melhor.</span>';
  const sellerP=$('.seller-teaser p'); if(sellerP) sellerP.textContent='Você informa o preço normal, o menor valor sustentável e quantas unidades consegue vender. O Junta reúne compradores e transforma interesse em volume.';
})();