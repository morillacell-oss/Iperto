(() => {
  const categories = [
    ['all','Tudo'],
    ['celulares','📱 Celulares'],
    ['eletronicos','📺 Eletrônicos'],
    ['ferramentas','🛠️ Ferramentas'],
    ['roupas','👕 Roupas'],
    ['moda','👟 Calçados'],
    ['restaurantes','🍽️ Restaurantes'],
    ['pizzarias','🍕 Pizzarias'],
    ['comida','🍔 Lanches'],
    ['mercado','🛒 Mercado'],
    ['casa','🏠 Casa'],
    ['beleza','✨ Beleza'],
    ['pet','🐾 Pet'],
    ['automotivo','🚗 Automotivo']
  ];

  const markup = categories.map(([key,label], index) =>
    `<button class="category ${index === 0 ? 'active' : ''}" data-category="${key}">${label}</button>`
  ).join('');

  document.querySelectorAll('.category-strip').forEach(strip => {
    strip.innerHTML = markup;
  });

  const sellerForm = document.querySelector('#sellerForm');
  if (sellerForm && !sellerForm.querySelector('[name="category"]')) {
    const productLabel = sellerForm.querySelector('label');
    const categoryLabel = document.createElement('label');
    categoryLabel.innerHTML = `Categoria
      <select name="category" required>
        <option value="">Escolha uma categoria</option>
        <option value="celulares">Celulares</option>
        <option value="eletronicos">Eletrônicos</option>
        <option value="ferramentas">Ferramentas</option>
        <option value="roupas">Roupas</option>
        <option value="moda">Calçados</option>
        <option value="restaurantes">Restaurantes</option>
        <option value="pizzarias">Pizzarias</option>
        <option value="comida">Lanches</option>
        <option value="mercado">Mercado</option>
        <option value="casa">Casa</option>
        <option value="beleza">Beleza</option>
        <option value="pet">Pet</option>
        <option value="automotivo">Automotivo</option>
      </select>`;
    productLabel.insertAdjacentElement('afterend', categoryLabel);
  }
})();
