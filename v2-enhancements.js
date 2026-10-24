import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm'

const supabase = createClient('https://rrulyvkarrwbopqeciyz.supabase.co', 'sb_publishable_PGO2G81WqwkxOEeQO-CI8A_YjXtUhiU')
const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))
const initials = value => String(value || 'Vendedor iPerto').trim().split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase() || 'IP'
const relativeTime = value => {
  const diff = Math.max(0, Date.now() - new Date(value).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  return new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'short' }).format(new Date(value))
}

let listingMeta = new Map()

async function loadSocialMeta() {
  const { data } = await supabase.from('listings').select('id,seller_display_name,city,state,created_at').eq('status','active')
  listingMeta = new Map((data || []).map(item => [String(item.id), item]))
  decorateCards()
}

function decorateCards() {
  $$('#listingGrid .listing-card').forEach(card => {
    if (card.classList.contains('skeleton-card') || card.dataset.socialized === '1') return
    const id = card.dataset.openListing
    if (!id) return
    const meta = listingMeta.get(String(id)) || {}
    const body = $('.listing-body', card)
    const fav = $('.fav', card)
    const condition = $('.listing-meta', card)?.textContent?.trim() || 'iPhone'
    const seller = meta.seller_display_name || 'Vendedor iPerto'

    const head = document.createElement('div')
    head.className = 'listing-social-head'
    head.innerHTML = `<div class="seller-line"><span class="seller-avatar">${esc(initials(seller))}</span><span class="seller-copy"><strong>${esc(seller)}</strong><small>${esc(meta.city || '')}${meta.city && meta.state ? ' · ' : ''}${esc(meta.state || '')}${meta.created_at ? ' · ' + esc(relativeTime(meta.created_at)) : ''}</small></span></div><span class="post-condition">${esc(condition)}</span>`
    card.prepend(head)
    const oldMeta = $('.listing-meta', card)
    if (oldMeta) oldMeta.remove()

    if (body) {
      const title = $('h3', body)
      const price = $('.price', body)
      if (title && price && !$('.listing-title-row', body)) {
        const row = document.createElement('div')
        row.className = 'listing-title-row'
        title.before(row)
        row.append(title, price)
      }
      if (!$('.listing-actionbar', body)) {
        const action = document.createElement('div')
        action.className = 'listing-actionbar'
        action.innerHTML = '<span class="view-link">Ver ficha completa <span>→</span></span>'
        if (fav) action.append(fav)
        body.append(action)
      }
    }
    card.dataset.socialized = '1'
  })
}

async function renderModelRail() {
  const rail = $('#modelRail')
  if (!rail || rail.dataset.ready) return
  const { data } = await supabase.from('iphone_models').select('id,name,generation').eq('enabled',true).order('generation',{ascending:false}).order('name')
  const models = data || []
  const proMax = models.filter(x => /Pro Max/i.test(x.name))
  const featured = [...proMax, ...models.filter(x => !/Pro Max/i.test(x.name))].slice(0,10)
  rail.innerHTML = featured.map(model => `<button class="model-chip" data-model-chip="${model.id}"><span class="model-device"></span><span><strong>${esc(model.name)}</strong><small>Ver anúncios</small></span></button>`).join('')
  rail.dataset.ready = '1'
  $$('[data-model-chip]', rail).forEach(button => button.onclick = () => {
    const select = $('#modelFilter')
    select.value = button.dataset.modelChip
    select.dispatchEvent(new Event('input',{bubbles:true}))
    updateModelChips()
    $('#market')?.scrollIntoView({behavior:'smooth'})
  })
}

function updateModelChips() {
  const value = $('#modelFilter')?.value || ''
  $$('[data-model-chip]').forEach(x => x.classList.toggle('active', x.dataset.modelChip === value))
}

function resetQuick() {
  if ($('#batteryFilter')) $('#batteryFilter').value = ''
  if ($('#priceFilter')) $('#priceFilter').value = ''
  if ($('#shippingFilter')) $('#shippingFilter').checked = false
}

function dispatchFilter(el) { el?.dispatchEvent(new Event('input',{bubbles:true})) }

function wireQuickFilters() {
  $$('[data-quick]').forEach(button => button.onclick = () => {
    $$('[data-quick]').forEach(x => x.classList.remove('active'))
    button.classList.add('active')
    const key = button.dataset.quick
    if (key === 'favorites') return $('#favoritesBtn')?.click()
    resetQuick()
    if (key === 'battery90') $('#batteryFilter').value = '90'
    if (key === 'shipping') $('#shippingFilter').checked = true
    if (key === 'price3000') $('#priceFilter').value = '3000'
    dispatchFilter($('#batteryFilter'))
  })
}

function syncTopSearch() {
  const top = $('#topSearch'), hero = $('#heroSearch')
  if (!top || !hero) return
  top.addEventListener('input', () => { hero.value = top.value; hero.dispatchEvent(new Event('input',{bubbles:true})) })
  hero.addEventListener('input', () => { if (top.value !== hero.value) top.value = hero.value })
  top.addEventListener('keydown', e => { if (e.key === 'Enter') $('#market')?.scrollIntoView({behavior:'smooth'}) })
}

function wireMobile() {
  $('#mobileExplore')?.addEventListener('click', () => $('#market')?.scrollIntoView({behavior:'smooth'}))
  $('#mobileFavorites')?.addEventListener('click', () => $('#favoritesBtn')?.click())
  $('#mobileAccount')?.addEventListener('click', () => $('#accountBtn')?.click())
  $('#clearModelShortcut')?.addEventListener('click', () => {
    const select = $('#modelFilter'); if (!select) return
    select.value = ''; dispatchFilter(select); updateModelChips(); $('#market')?.scrollIntoView({behavior:'smooth'})
  })
  $('#modelFilter')?.addEventListener('input', updateModelChips)
}

const grid = $('#listingGrid')
if (grid) new MutationObserver(() => requestAnimationFrame(decorateCards)).observe(grid,{childList:true,subtree:true})

syncTopSearch()
wireQuickFilters()
wireMobile()
renderModelRail()
loadSocialMeta()
setInterval(loadSocialMeta, 60000)
