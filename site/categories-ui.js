(() => {
  const icon = {
    all:'<svg viewBox="0 0 24 24"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/></svg>',
    celulares:'<svg viewBox="0 0 24 24"><rect x="7" y="2.8" width="10" height="18.4" rx="2.2"/><path d="M10 6h4M11 18h2"/></svg>',
    eletronicos:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    ferramentas:'<svg viewBox="0 0 24 24"><path d="m14.5 5.2 4.3-2.2 2.2 2.2-2.2 4.3-3.4.7-6.7 6.7-2.6-2.6 6.7-6.7.7-3.4Z"/><path d="m4.5 15.5 4 4"/></svg>',
    roupas:'<svg viewBox="0 0 24 24"><path d="m8 4 4 2 4-2 4 4-3 2v10H7V10L4 8l4-4Z"/></svg>',
    moda:'<svg viewBox="0 0 24 24"><path d="M3 15c5 1 7-3 9-7l2 5c1 2 3 3 7 3v3H3v-4Z"/></svg>',
    restaurantes:'<svg viewBox="0 0 24 24"><path d="M6 3v7M3 3v5c0 2 1 3 3 3s3-1 3-3V3M6 11v10M16 3v18M16 3c3 2 4 5 4 8h-4"/></svg>',
    pizzarias:'<svg viewBox="0 0 24 24"><path d="M4 20 12 3l8 17H4Z"/><path d="M7 14h10M10 10h.01M14 14h.01"/></svg>',
    comida:'<svg viewBox="0 0 24 24"><path d="M4 12h16M6 12a6 6 0 0 1 12 0M5 16h14l-1 3H6l-1-3Z"/><path d="M9 8h.01M13 6h.01"/></svg>',
    mercado:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2 11h10l2-7H7M9 20h.01M17 20h.01"/></svg>',
    casa:'<svg viewBox="0 0 24 24"><path d="m3 11 9-7 9 7v9h-6v-6H9v6H3v-9Z"/></svg>',
    beleza:'<svg viewBox="0 0 24 24"><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/></svg>',
    pet:'<svg viewBox="0 0 24 24"><path d="M8 13c-3 1-4 4-2 6 2 2 4 0 6 0s4 2 6 0c2-2 1-5-2-6-1-4-7-4-8 0Z"/><path d="M6 9c-1.5 0-2.5-1.2-2.2-2.6C4 5 5 4.4 6 5c1 .6 1.3 4 0 4ZM18 9c1.5 0 2.5-1.2 2.2-2.6C20 5 19 4.4 18 5c-1 .6-1.3 4 0 4ZM10 7C8.8 7 8 5.8 8.3 4.6 8.6 3.5 9.5 3 10.3 3.5c.8.5.9 3.5-.3 3.5ZM14 7c1.2 0 2-1.2 1.7-2.4-.3-1.1-1.2-1.6-2-1.1-.8.5-.9 3.5.3 3.5Z"/></svg>',
    automotivo:'<svg viewBox="0 0 24 24"><path d="M5 16h14l-1.5-6h-11L5 16Z"/><path d="M4 16v3h3v-2h10v2h3v-3M8 13h.01M16 13h.01M8 10l1-3h6l1 3"/></svg>'
  };

  const categories = [
    ['all','Tudo'],['celulares','Celulares'],['eletronicos','Eletrônicos'],['ferramentas','Ferramentas'],
    ['roupas','Roupas'],['moda','Calçados'],['restaurantes','Restaurantes'],['pizzarias','Pizzarias'],
    ['comida','Lanches'],['mercado','Mercado'],['casa','Casa'],['beleza','Beleza'],['pet','Pet'],['automotivo','Automotivo']
  ];

  const markup = categories.map(([key,label], index) =>
    `<button class="category ${index === 0 ? 'active' : ''}" data-category="${key}"><span class="category-icon">${icon[key]}</span><span>${label}</span></button>`
  ).join('');

  document.querySelectorAll('.category-strip').forEach(strip => { strip.innerHTML = markup; });

  const sellerForm = document.querySelector('#sellerForm');
  if (sellerForm && !sellerForm.querySelector('[name="category"]')) {
    const productLabel = sellerForm.querySelector('label');
    const categoryLabel = document.createElement('label');
    categoryLabel.innerHTML = `Categoria
      <select name="category" required>
        <option value="">Escolha uma categoria</option>
        ${categories.filter(([key])=>key!=='all').map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}
      </select>`;
    productLabel.insertAdjacentElement('afterend', categoryLabel);
  }
})();