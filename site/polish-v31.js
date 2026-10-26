(() => {
  const heroTitle = document.querySelector('.hero h1');
  const heroLead = document.querySelector('.hero-lead');
  const offersTitle = document.querySelector('.offers-section .section-head h2');
  const offersKicker = document.querySelector('.offers-section .section-kicker');
  if (heroTitle) heroTitle.innerHTML = 'Sozinho é varejo.<br><span>Juntos, preço de grupo.</span>';
  if (heroLead) heroLead.textContent = 'Você entra com outras pessoas que querem o mesmo produto. O grupo cresce, bate a meta e libera um preço melhor para todo mundo — sem precisar comprar em quantidade sozinho.';
  if (offersTitle) offersTitle.textContent = 'Escolha o que quer. O grupo faz o preço cair.';
  if (offersKicker) offersKicker.textContent = 'GRUPOS ACONTECENDO AGORA';

  const quick = document.querySelector('.quick-how');
  if (quick) quick.setAttribute('data-brand-flow','entrar-juntar-destravar');

  const cards = () => [...document.querySelectorAll('.offer-card')];
  const stagger = () => cards().forEach((card,i) => card.style.animationDelay = `${Math.min(i,6)*55}ms`);
  const observer = new MutationObserver(stagger);
  const homeOffers = document.querySelector('#homeOffers');
  const allOffers = document.querySelector('#allOffers');
  if (homeOffers) observer.observe(homeOffers,{childList:true});
  if (allOffers) observer.observe(allOffers,{childList:true});
  stagger();

  document.querySelectorAll('.category-strip').forEach(strip => {
    strip.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) strip.scrollLeft += e.deltaY;
    }, {passive:true});
  });
})();
