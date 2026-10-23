import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm'

const SUPABASE_URL = 'https://rrulyvkarrwbopqeciyz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
const money = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value || 0))
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]))
const conditionLabel = { novo: 'Novo', excelente: 'Excelente', muito_bom: 'Muito bom', bom: 'Bom', regular: 'Regular' }
const screenLabel = { original: 'Original', substituida_original: 'Substituída original', substituida_paralela: 'Substituída paralela', nao_sei: 'Não informado' }

let models = []
let listings = []
let favorites = new Set()
let currentUser = null
let selectedFiles = []
let favoritesOnly = false
let activeDetailId = null

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(window.__ipertoToast)
  window.__ipertoToast = setTimeout(() => el.classList.remove('show'), 3200)
}

function openModal(id) {
  const modal = $('#' + id)
  if (!modal) return
  modal.classList.remove('hidden')
  document.body.style.overflow = 'hidden'
  setTimeout(() => modal.querySelector('button, input, select, textarea')?.focus(), 20)
}

function closeModal(id) {
  const modal = $('#' + id)
  if (!modal) return
  modal.classList.add('hidden')
  if ($$('.modal-backdrop:not(.hidden)').length === 0) document.body.style.overflow = ''
}

function normalizeWhatsApp(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits
  return /^55\d{10,11}$/.test(digits) ? digits : null
}

function storagePublicUrl(path) {
  return supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
}

function fileExtension(file) {
  const byType = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif'
  }
  return byType[file.type] || 'jpg'
}

async function init() {
  wireStaticEvents()
  renderLoadingCards()

  const { data: { session } } = await supabase.auth.getSession()
  currentUser = session?.user || null

  await loadModels()
  await Promise.all([loadListings(), loadFavorites()])
  renderAuthState()

  supabase.auth.onAuthStateChange((_event, sessionData) => {
    currentUser = sessionData?.user || null
    queueMicrotask(async () => {
      await loadFavorites()
      renderAuthState()
      renderListings()
    })
  })
}

function renderLoadingCards() {
  const grid = $('#listingGrid')
  grid.innerHTML = Array.from({ length: 3 }, () => '<article class="listing-card skeleton-card"><div class="skeleton image"></div><div class="listing-body"><div class="skeleton line short"></div><div class="skeleton line title"></div><div class="skeleton line"></div><div class="skeleton line price-line"></div></div></article>').join('')
}

async function loadModels() {
  const { data, error } = await supabase.from('iphone_models').select('id,name,generation').eq('enabled', true).order('generation', { ascending: false }).order('name')
  if (error) {
    console.error(error)
    toast('Não foi possível carregar o catálogo de iPhones')
    return
  }
  models = data || []
  const options = models.map(model => `<option value="${model.id}">${escapeHtml(model.name)}</option>`).join('')
  $('#modelFilter').insertAdjacentHTML('beforeend', options)
  $('#sellModel').innerHTML = '<option value="">Selecione o modelo</option>' + options
  $('#metricModels').textContent = String(models.length)
}

async function loadListings() {
  $('#resultsLabel').textContent = 'Carregando...'
  const { data, error } = await supabase
    .from('listings')
    .select('*,iphone_models(name),listing_photos(storage_path,sort_order)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    listings = []
    toast('Não foi possível carregar os anúncios')
  } else {
    listings = data || []
  }
  $('#metricListings').textContent = String(listings.length)
  renderListings()
}

async function loadFavorites() {
  favorites = new Set()
  if (!currentUser) return
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', currentUser.id)
  if (error) return console.error(error)
  ;(data || []).forEach(item => favorites.add(item.listing_id))
}

function filteredListings() {
  let result = [...listings]
  const query = $('#heroSearch').value.trim().toLowerCase()
  const model = $('#modelFilter').value
  const maxPrice = Number($('#priceFilter').value || 0)
  const battery = Number($('#batteryFilter').value || 0)
  const state = $('#stateFilter').value.trim().toUpperCase()
  const shipping = $('#shippingFilter').checked
  const sort = $('#sortFilter').value

  if (favoritesOnly) result = result.filter(item => favorites.has(item.id))
  if (query) result = result.filter(item => `${item.iphone_models?.name || ''} ${item.storage_gb} ${item.color} ${item.city} ${item.state}`.toLowerCase().includes(query))
  if (model) result = result.filter(item => String(item.model_id) === model)
  if (maxPrice) result = result.filter(item => Number(item.price) <= maxPrice)
  if (battery) result = result.filter(item => Number(item.battery_health) >= battery)
  if (state) result = result.filter(item => String(item.state).toUpperCase() === state)
  if (shipping) result = result.filter(item => item.shipping_enabled)

  if (sort === 'price_asc') result.sort((a, b) => Number(a.price) - Number(b.price))
  if (sort === 'price_desc') result.sort((a, b) => Number(b.price) - Number(a.price))
  if (sort === 'battery') result.sort((a, b) => Number(b.battery_health) - Number(a.battery_health))
  return result
}

function renderListings() {
  const result = filteredListings()
  const grid = $('#listingGrid')
  const empty = $('#emptyState')

  $('#marketKicker').textContent = favoritesOnly ? 'SUA LISTA' : 'ENCONTRE O SEU'
  $('#marketTitle').textContent = favoritesOnly ? 'iPhones favoritados' : 'iPhones anunciados agora'
  $('#resultsLabel').textContent = `${result.length} ${result.length === 1 ? 'anúncio' : 'anúncios'}`
  $('#favoritesBtn').classList.toggle('active', favoritesOnly)
  $('#favoritesBtn').setAttribute('aria-pressed', String(favoritesOnly))
  $('#favoritesBtn .nav-icon').textContent = favoritesOnly ? '♥' : '♡'

  if (!result.length) {
    grid.innerHTML = ''
    empty.classList.remove('hidden')
    $('#emptyTitle').textContent = favoritesOnly ? 'Você ainda não tem favoritos' : 'Ainda não há anúncios com esses filtros'
    $('#emptyCopy').textContent = favoritesOnly ? 'Toque no coração de um anúncio para guardar aqui.' : 'Seja o primeiro a anunciar um iPhone nessa busca.'
    return
  }

  empty.classList.add('hidden')
  grid.innerHTML = result.map(item => {
    const photos = [...(item.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order)
    const image = photos[0]
      ? `<img src="${escapeHtml(storagePublicUrl(photos[0].storage_path))}" alt="Foto de ${escapeHtml(item.iphone_models?.name || 'iPhone')}" loading="lazy">`
      : '<div class="no-photo">Foto indisponível</div>'
    const favorite = favorites.has(item.id)
    return `<article class="listing-card" data-open-listing="${item.id}" tabindex="0" aria-label="Abrir anúncio de ${escapeHtml(item.iphone_models?.name || 'iPhone')}">
      <button class="fav ${favorite ? 'on' : ''}" data-fav="${item.id}" aria-label="${favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${favorite ? '♥' : '♡'}</button>
      <div class="listing-image">${image}${item.shipping_enabled ? '<span class="ship-badge">ENVIO DISPONÍVEL</span>' : ''}</div>
      <div class="listing-body">
        <div class="listing-meta">${escapeHtml(conditionLabel[item.condition] || item.condition)}</div>
        <h3>${escapeHtml(item.iphone_models?.name || 'iPhone')} <span>${Number(item.storage_gb)} GB</span></h3>
        <div class="listing-specs"><span class="spec battery">🔋 ${Number(item.battery_health)}%</span><span class="spec">${escapeHtml(item.color)}</span>${item.negotiable ? '<span class="spec">Aceita proposta</span>' : ''}</div>
        <div class="price">${money(item.price)}</div>
        <div class="location">⌖ ${escapeHtml(item.city)} · ${escapeHtml(String(item.state).toUpperCase())}</div>
      </div>
    </article>`
  }).join('')

  $$('[data-open-listing]').forEach(card => {
    card.addEventListener('click', event => { if (!event.target.closest('[data-fav]')) showDetail(card.dataset.openListing) })
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showDetail(card.dataset.openListing) } })
  })
  $$('[data-fav]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); toggleFavorite(button.dataset.fav) }))
}

async function toggleFavorite(id) {
  if (!currentUser) return requireLogin('Entre para salvar seus iPhones favoritos')
  if (favorites.has(id)) {
    const { error } = await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('listing_id', id)
    if (error) return toast('Não foi possível remover o favorito')
    favorites.delete(id)
  } else {
    const { error } = await supabase.from('favorites').insert({ user_id: currentUser.id, listing_id: id })
    if (error) return toast('Não foi possível favoritar')
    favorites.add(id)
  }
  renderListings()
}

function detailGalleryHtml(item) {
  const photos = [...(item.listing_photos || [])].sort((a, b) => a.sort_order - b.sort_order)
  if (!photos.length) return '<div class="detail-gallery"><div class="no-photo">Foto indisponível</div></div>'
  const first = storagePublicUrl(photos[0].storage_path)
  const thumbs = photos.map((photo, index) => `<button class="detail-thumb ${index === 0 ? 'active' : ''}" data-photo="${escapeHtml(storagePublicUrl(photo.storage_path))}" aria-label="Ver foto ${index + 1}"><img src="${escapeHtml(storagePublicUrl(photo.storage_path))}" alt="Miniatura ${index + 1}"></button>`).join('')
  return `<div class="detail-gallery"><div class="detail-main"><img id="detailMainImage" src="${escapeHtml(first)}" alt="Foto do aparelho"></div><div class="detail-thumbs">${thumbs}</div></div>`
}

function showDetail(id) {
  const item = listings.find(listing => listing.id === id)
  if (!item) return
  activeDetailId = id

  const phone = item.contact_whatsapp ? normalizeWhatsApp(item.contact_whatsapp) : null
  const whatsapp = phone
    ? `<a class="whatsapp" target="_blank" rel="noopener noreferrer" href="https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Vi seu ${item.iphone_models?.name || 'iPhone'} no iPerto e gostaria de saber mais.`)}">Falar com vendedor no WhatsApp</a>`
    : '<div class="contact-private">O vendedor optou por não publicar WhatsApp neste anúncio.</div>'

  $('#detailContent').innerHTML = `<button class="modal-close" data-detail-close aria-label="Fechar">×</button>
    <div class="detail-layout">
      ${detailGalleryHtml(item)}
      <div class="detail-info">
        <span class="kicker">${escapeHtml(conditionLabel[item.condition] || item.condition)}</span>
        <h2>${escapeHtml(item.iphone_models?.name || 'iPhone')} <span>${Number(item.storage_gb)} GB</span></h2>
        <div class="detail-price">${money(item.price)}</div>
        <div class="detail-chips">
          <span class="spec battery">🔋 ${Number(item.battery_health)}% bateria</span><span class="spec">${escapeHtml(item.color)}</span><span class="spec">Tela: ${escapeHtml(screenLabel[item.screen_status] || item.screen_status)}</span>
          <span class="spec ${item.face_id_ok ? 'ok' : 'warn'}">Face ID ${item.face_id_ok ? '✓' : '✕'}</span><span class="spec ${item.cameras_ok ? 'ok' : 'warn'}">Câmeras ${item.cameras_ok ? '✓' : '✕'}</span>
          ${item.has_box ? '<span class="spec">Com caixa</span>' : ''}${item.has_invoice ? '<span class="spec">Com nota fiscal</span>' : ''}${item.shipping_enabled ? '<span class="spec">Faz envio</span>' : ''}${item.pickup_enabled ? '<span class="spec">Retirada</span>' : ''}
        </div>
        <div class="detail-section"><h4>Sobre o aparelho</h4><p class="detail-copy">${escapeHtml(item.description || 'O vendedor não adicionou uma descrição.')}</p></div>
        ${item.repair_history ? `<div class="detail-section"><h4>Manutenção</h4><p class="detail-copy">${escapeHtml(item.repair_history)}</p></div>` : ''}
        ${item.accessories ? `<div class="detail-section"><h4>Acessórios</h4><p class="detail-copy">${escapeHtml(item.accessories)}</p></div>` : ''}
        <div class="seller-box"><div class="seller-label">VENDEDOR</div><div class="seller-name">${escapeHtml(item.seller_display_name || 'Vendedor iPerto')}</div><div class="location">⌖ ${escapeHtml(item.city)} · ${escapeHtml(String(item.state).toUpperCase())}</div>${whatsapp}<button class="report-link" data-report="${item.id}">⚑ Denunciar este anúncio</button></div>
      </div>
    </div>`

  openModal('detailModal')
  $('[data-detail-close]').onclick = () => closeModal('detailModal')
  $$('[data-photo]').forEach(button => button.onclick = () => {
    $('#detailMainImage').src = button.dataset.photo
    $$('[data-photo]').forEach(thumb => thumb.classList.toggle('active', thumb === button))
  })
  $('[data-report]').onclick = () => openReport(item.id)
}

function requireLogin(message = 'Entre na sua conta para continuar') {
  openModal('authModal')
  toast(message)
}

function renderAuthState() {
  $('#accountBtn').textContent = currentUser ? 'Minha conta' : 'Entrar'
  if (!currentUser && favoritesOnly) {
    favoritesOnly = false
    renderListings()
  }
}

function authTab(tab) {
  $$('[data-auth-tab]').forEach(button => button.classList.toggle('active', button.dataset.authTab === tab))
  $('#loginForm').classList.toggle('hidden', tab !== 'login')
  $('#signupForm').classList.toggle('hidden', tab !== 'signup')
}

async function handleLogin(event) {
  event.preventDefault()
  const button = event.currentTarget.querySelector('[type=submit]')
  const form = new FormData(event.currentTarget)
  button.disabled = true
  button.textContent = 'Entrando...'
  const { error } = await supabase.auth.signInWithPassword({ email: String(form.get('email')).trim(), password: form.get('password') })
  button.disabled = false
  button.textContent = 'Entrar no iPerto'
  if (error) return toast(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos' : 'Não foi possível entrar agora')
  closeModal('authModal')
  event.currentTarget.reset()
  toast('Bem-vindo ao iPerto')
}

async function handleSignup(event) {
  event.preventDefault()
  const button = event.currentTarget.querySelector('[type=submit]')
  const form = new FormData(event.currentTarget)
  button.disabled = true
  button.textContent = 'Criando conta...'
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get('email')).trim(),
    password: form.get('password'),
    options: { data: { display_name: String(form.get('display_name')).trim().slice(0, 60) } }
  })
  button.disabled = false
  button.textContent = 'Criar minha conta'
  if (error) return toast('Não foi possível criar a conta: ' + error.message)
  event.currentTarget.reset()
  if (data.session) {
    closeModal('authModal')
    toast('Conta criada com sucesso')
  } else {
    authTab('login')
    toast('Conta criada. Confira seu e-mail para confirmar o cadastro.')
  }
}

async function openSell() {
  if (!currentUser) return requireLogin('Entre ou crie uma conta para anunciar')
  selectedFiles = []
  $('#sellForm').reset()
  $('#photoPreview').innerHTML = ''
  $('#sellForm [name=face_id_ok]').checked = true
  $('#sellForm [name=cameras_ok]').checked = true
  $('#sellForm [name=pickup_enabled]').checked = true

  const { data: profile } = await supabase.from('profiles').select('whatsapp,city,state').eq('id', currentUser.id).single()
  if (profile) {
    $('#sellForm [name=whatsapp]').value = profile.whatsapp || ''
    $('#sellForm [name=city]').value = profile.city || ''
    $('#sellForm [name=state]').value = profile.state || ''
  }
  openModal('sellModal')
}

function previewPhotos() {
  const all = [...$('#photoInput').files]
  selectedFiles = all.slice(0, 8)
  if (all.length > 8) toast('Use no máximo 8 fotos')
  $('#photoPreview').innerHTML = selectedFiles.map((file, index) => `<div class="preview-item"><img src="${URL.createObjectURL(file)}" alt="Prévia ${index + 1}"><span>${index + 1}</span></div>`).join('')
}

async function publishListing(event) {
  event.preventDefault()
  if (!currentUser) return requireLogin()
  if (!selectedFiles.length) return toast('Adicione pelo menos uma foto real')
  if (selectedFiles.some(file => file.size > 10 * 1024 * 1024)) return toast('Cada foto pode ter no máximo 10 MB')

  const form = new FormData(event.currentTarget)
  const publishWhatsapp = form.has('publish_whatsapp')
  const normalizedPhone = normalizeWhatsApp(form.get('whatsapp'))
  if (publishWhatsapp && !normalizedPhone) return toast('Informe um WhatsApp válido com DDD')

  const button = event.currentTarget.querySelector('[type=submit]')
  button.disabled = true
  button.textContent = 'Publicando com segurança...'

  let createdListingId = null
  const uploadedPaths = []
  try {
    const { data: profile, error: profileReadError } = await supabase.from('profiles').select('display_name').eq('id', currentUser.id).single()
    if (profileReadError) throw profileReadError

    const displayName = String(profile?.display_name || currentUser.email?.split('@')[0] || 'Vendedor iPerto').trim().slice(0, 60)
    const city = String(form.get('city')).trim().slice(0, 80)
    const state = String(form.get('state')).trim().toUpperCase()

    const { error: profileUpdateError } = await supabase.from('profiles').update({
      whatsapp: normalizedPhone,
      city,
      state
    }).eq('id', currentUser.id)
    if (profileUpdateError) throw profileUpdateError

    const payload = {
      seller_id: currentUser.id,
      seller_display_name: displayName,
      contact_whatsapp: publishWhatsapp ? normalizedPhone : null,
      model_id: Number(form.get('model_id')),
      storage_gb: Number(form.get('storage_gb')),
      color: String(form.get('color')).trim().slice(0, 40),
      battery_health: Number(form.get('battery_health')),
      condition: form.get('condition'),
      screen_status: form.get('screen_status'),
      face_id_ok: form.has('face_id_ok'),
      cameras_ok: form.has('cameras_ok'),
      repair_history: String(form.get('repair_history') || '').trim().slice(0, 500) || null,
      has_box: form.has('has_box'),
      has_invoice: form.has('has_invoice'),
      accessories: String(form.get('accessories') || '').trim().slice(0, 300) || null,
      description: String(form.get('description') || '').trim().slice(0, 1000) || null,
      city,
      state,
      price: Number(form.get('price')),
      negotiable: form.has('negotiable'),
      shipping_enabled: form.has('shipping_enabled'),
      pickup_enabled: form.has('pickup_enabled'),
      status: 'draft'
    }

    const { data: listing, error: listingError } = await supabase.from('listings').insert(payload).select('id').single()
    if (listingError) throw listingError
    createdListingId = listing.id

    const photoRows = []
    for (let index = 0; index < selectedFiles.length; index++) {
      const file = selectedFiles[index]
      const path = `${currentUser.id}/${createdListingId}/${crypto.randomUUID()}.${fileExtension(file)}`
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
      if (uploadError) throw uploadError
      uploadedPaths.push(path)
      photoRows.push({ listing_id: createdListingId, storage_path: path, sort_order: index })
    }

    const { error: photoError } = await supabase.from('listing_photos').insert(photoRows)
    if (photoError) throw photoError

    const { error: activateError } = await supabase.from('listings').update({ status: 'active' }).eq('id', createdListingId)
    if (activateError) throw activateError

    closeModal('sellModal')
    event.currentTarget.reset()
    selectedFiles = []
    $('#photoPreview').innerHTML = ''
    toast('Anúncio publicado no iPerto')
    await loadListings()
    $('#market').scrollIntoView({ behavior: 'smooth' })
  } catch (error) {
    console.error(error)
    if (uploadedPaths.length) await supabase.storage.from('listing-images').remove(uploadedPaths)
    if (createdListingId) await supabase.from('listings').delete().eq('id', createdListingId)
    toast('Não foi possível publicar. Revise os dados e tente novamente.')
  } finally {
    button.disabled = false
    button.textContent = 'Publicar anúncio'
  }
}

async function openAccount() {
  if (!currentUser) return requireLogin()
  const [{ data: profile, error: profileError }, { data: mine, error: listingsError }] = await Promise.all([
    supabase.from('profiles').select('display_name,whatsapp,city,state,created_at').eq('id', currentUser.id).single(),
    supabase.from('listings').select('id,storage_gb,price,status,created_at,iphone_models(name)').eq('seller_id', currentUser.id).order('created_at', { ascending: false })
  ])
  if (profileError || listingsError) return toast('Não foi possível abrir sua conta agora')

  $('#accountContent').innerHTML = `<button class="modal-close" data-account-close aria-label="Fechar">×</button>
    <div class="account-head"><div><span class="kicker">MINHA CONTA</span><h2>${escapeHtml(profile?.display_name || 'Conta iPerto')}</h2><p>${escapeHtml(currentUser.email || '')}</p></div><button class="ghost" id="logoutBtn">Sair</button></div>
    <div class="account-note">🔒 Seu WhatsApp salvo aqui é privado. Ele só aparece em um anúncio quando você marca explicitamente a opção de publicação.</div>
    <form class="profile-form" id="profileForm">
      <label>Nome<input name="display_name" maxlength="60" minlength="2" required value="${escapeHtml(profile?.display_name || '')}"></label>
      <label>WhatsApp privado<input name="whatsapp" inputmode="tel" maxlength="20" value="${escapeHtml(profile?.whatsapp || '')}"></label>
      <label>Cidade<input name="city" maxlength="80" value="${escapeHtml(profile?.city || '')}"></label>
      <label>UF<input name="state" maxlength="2" value="${escapeHtml(profile?.state || '')}"></label>
      <button class="primary" type="submit">Salvar perfil</button>
    </form>
    <div class="account-list-head"><h3>Meus anúncios</h3><span>${(mine || []).length}</span></div>
    <div class="my-listings">${(mine || []).length ? (mine || []).map(item => `<div class="mine"><div><strong>${escapeHtml(item.iphone_models?.name || 'iPhone')} ${Number(item.storage_gb)} GB</strong><small>${money(item.price)} • ${escapeHtml(item.status)}</small></div><div class="mine-actions">${item.status === 'active' ? `<button data-status="paused" data-id="${item.id}">Pausar</button>` : `<button data-status="active" data-id="${item.id}">Ativar</button>`}<button data-status="sold" data-id="${item.id}">Vendido</button><button class="danger" data-delete="${item.id}">Excluir</button></div></div>`).join('') : '<p class="detail-copy">Você ainda não publicou anúncios.</p>'}</div>`

  openModal('accountModal')
  $('[data-account-close]').onclick = () => closeModal('accountModal')
  $('#logoutBtn').onclick = async () => { await supabase.auth.signOut(); closeModal('accountModal'); toast('Você saiu da conta') }
  $('#profileForm').onsubmit = saveProfile
  $$('[data-status]').forEach(button => button.onclick = () => setListingStatus(button.dataset.id, button.dataset.status))
  $$('[data-delete]').forEach(button => button.onclick = () => deleteListing(button.dataset.delete))
}

async function saveProfile(event) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const phoneRaw = form.get('whatsapp')
  const phone = String(phoneRaw || '').trim() ? normalizeWhatsApp(phoneRaw) : null
  if (phoneRaw && !phone) return toast('Informe um WhatsApp válido com DDD')
  const state = String(form.get('state') || '').trim().toUpperCase()
  if (state && !/^[A-Z]{2}$/.test(state)) return toast('Use a UF com 2 letras')
  const { error } = await supabase.from('profiles').update({
    display_name: String(form.get('display_name')).trim().slice(0, 60),
    whatsapp: phone,
    city: String(form.get('city') || '').trim().slice(0, 80) || null,
    state: state || null
  }).eq('id', currentUser.id)
  if (error) return toast('Erro ao salvar perfil')
  toast('Perfil atualizado')
  await openAccount()
}

async function setListingStatus(id, status) {
  const { error } = await supabase.from('listings').update({ status }).eq('id', id)
  if (error) return toast('Não foi possível atualizar o anúncio')
  toast(status === 'sold' ? 'Anúncio marcado como vendido' : 'Anúncio atualizado')
  await loadListings()
  await openAccount()
}

async function deleteListing(id) {
  if (!confirm('Excluir este anúncio definitivamente? Esta ação não pode ser desfeita.')) return
  const { data: photos } = await supabase.from('listing_photos').select('storage_path').eq('listing_id', id)
  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return toast('Não foi possível excluir o anúncio')
  if (photos?.length) await supabase.storage.from('listing-images').remove(photos.map(photo => photo.storage_path))
  toast('Anúncio excluído')
  await loadListings()
  await openAccount()
}

function openReport(listingId) {
  if (!currentUser) {
    closeModal('detailModal')
    return requireLogin('Entre na sua conta para enviar uma denúncia')
  }
  $('#reportForm').reset()
  $('#reportForm [name=listing_id]').value = listingId
  openModal('reportModal')
}

async function submitReport(event) {
  event.preventDefault()
  if (!currentUser) return requireLogin()
  const form = new FormData(event.currentTarget)
  const { error } = await supabase.from('reports').insert({
    reporter_id: currentUser.id,
    listing_id: form.get('listing_id'),
    reason: form.get('reason'),
    details: String(form.get('details') || '').trim().slice(0, 500) || null
  })
  if (error) {
    if (error.code === '23505') return toast('Você já denunciou este anúncio')
    return toast('Não foi possível enviar a denúncia')
  }
  closeModal('reportModal')
  toast('Denúncia enviada. Obrigado por ajudar a manter o iPerto seguro.')
}

function clearFilters() {
  $('#modelFilter').value = ''
  $('#priceFilter').value = ''
  $('#batteryFilter').value = ''
  $('#stateFilter').value = ''
  $('#shippingFilter').checked = false
  $('#sortFilter').value = 'recent'
  $('#heroSearch').value = ''
  favoritesOnly = false
  renderListings()
}

function wireStaticEvents() {
  $$('[data-close]').forEach(button => button.onclick = () => closeModal(button.dataset.close))
  $$('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal.id) }))
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { const open = $$('.modal-backdrop:not(.hidden)').at(-1); if (open) closeModal(open.id) } })

  $('#loginForm').onsubmit = handleLogin
  $('#signupForm').onsubmit = handleSignup
  $$('[data-auth-tab]').forEach(button => button.onclick = () => authTab(button.dataset.authTab))
  $('#sellBtn').onclick = openSell
  $$('[data-sell]').forEach(button => button.onclick = openSell)
  $('#accountBtn').onclick = openAccount
  $('#favoritesBtn').onclick = () => {
    if (!currentUser) return requireLogin('Entre para ver seus favoritos')
    favoritesOnly = !favoritesOnly
    renderListings()
    $('#market').scrollIntoView({ behavior: 'smooth' })
  }
  $('#photoInput').onchange = previewPhotos
  $('#sellForm').onsubmit = publishListing
  $('#reportForm').onsubmit = submitReport
  ;['modelFilter', 'priceFilter', 'batteryFilter', 'stateFilter', 'shippingFilter', 'sortFilter'].forEach(id => $('#' + id).addEventListener('input', renderListings))
  $('#stateFilter').addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) })
  $('#heroSearch').addEventListener('input', renderListings)
  $('#heroSearchBtn').onclick = () => $('#market').scrollIntoView({ behavior: 'smooth' })
  $('#heroSearch').addEventListener('keydown', event => { if (event.key === 'Enter') $('#market').scrollIntoView({ behavior: 'smooth' }) })
  $('#clearFilters').onclick = clearFilters
  $$('[data-home]').forEach(button => button.onclick = () => scrollTo({ top: 0, behavior: 'smooth' }))
  $$('.upper').forEach(input => input.addEventListener('input', event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }))
}

init().catch(error => {
  console.error(error)
  $('#listingGrid').innerHTML = ''
  $('#emptyState').classList.remove('hidden')
  $('#emptyTitle').textContent = 'Não foi possível carregar o iPerto agora'
  $('#emptyCopy').textContent = 'Atualize a página e tente novamente.'
})
