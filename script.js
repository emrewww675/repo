const SUPABASE_URL = 'https://hnpnaafxlpfrwiuiunxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucG5hYWZ4bHBmcndpdWl1bnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgzNTMsImV4cCI6MjA5ODgxNDM1M30.cQQ80l2kl18VIFupDwj9rGTj3Tr0Owr3YerYpzO_RPM';
if (!window.supabaseClient) window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elemanları (kısaltıldı)
const featuredGrid = document.getElementById('featuredGrid');
const searchSection = document.getElementById('searchSection');
const searchGrid = document.getElementById('searchGrid');
const searchTitle = document.getElementById('searchTitle');
const searchBtn = document.getElementById('searchBtn');
const locationInput = document.getElementById('locationInput');
const catItems = document.querySelectorAll('.cat-item');
const refreshFeaturedBtn = document.getElementById('refreshFeaturedBtn');

const YEDEK_MEKANLAR = [
  { name: 'Midpoint', category: 'restaurant', district: 'Kadıköy', price_level: '₺₺', rating: 4.5, description: 'Geniş menüsü ve şık atmosferiyle Kadıköy\'ün vazgeçilmez buluşma noktası.' },
  { name: 'Brew Coffeeworks', category: 'cafe', district: 'Kadıköy', price_level: '₺₺', rating: 4.4, description: 'Üçüncü nesil kahve akımının öncülerinden, özenle demlenmiş kahveler.' },
  { name: 'Lucca', category: 'bar', district: 'Bebek', price_level: '₺₺₺', rating: 4.6, description: 'Şık dekoru, imza kokteylleri ve Bebek\'in en popüler gece mekanı.' },
  { name: 'Mikla', category: 'restaurant', district: 'Beyoğlu', price_level: '₺₺₺₺', rating: 4.8, description: 'Michelin yıldızlı şefin Anadolu esintili modern yorumları ve çatı manzarası.' }
];

function renderVenuesToGrid(venues, gridElement) {
  if (!gridElement) return;
  if (!venues || venues.length === 0) { gridElement.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">😕 Mekan bulunamadı</div>`; return; }
  const imgClasses = ['img1','img2','img3','img4'];
  const html = venues.map(v => {
    let icon = 'fa-utensils';
    if (v.category === 'cafe') icon = 'fa-mug-saucer';
    else if (v.category === 'bar') icon = 'fa-wine-glass';
    else if (v.category === 'event') icon = 'fa-calendar-star';
    const randomImg = imgClasses[Math.floor(Math.random() * imgClasses.length)];
    const venueData = JSON.stringify(v).replace(/'/g, "&#39;");
    return `<div class="place-card" data-venue='${venueData}' onclick="openDetailModal(this)">
              <div class="place-img ${randomImg}"><i class="fas ${icon}"></i></div>
              <div class="place-info"><h4>${v.name}</h4><div class="location"><i class="fas fa-location-dot"></i> ${v.district}, İstanbul</div><div class="meta"><span class="tag">${v.category}</span><span class="price">${v.price_level}</span></div></div></div>`;
  }).join('');
  gridElement.innerHTML = html;
}

async function fetchFeaturedVenues() {
  const featuredSection = document.getElementById('featuredSection');
  if (!featuredSection || !featuredGrid) return;
  featuredSection.style.display = 'block';
  featuredGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>`;
  try {
    const { data, error } = await window.supabaseClient.from('venues').select('*').limit(4);
    if (error) throw error;
    if (data && data.length > 0) { const shuffled = data.sort(() => 0.5 - Math.random()); renderVenuesToGrid(shuffled, featuredGrid); }
    else renderVenuesToGrid(YEDEK_MEKANLAR, featuredGrid);
  } catch (err) { renderVenuesToGrid(YEDEK_MEKANLAR, featuredGrid); }
}

async function showSearchResults(district='', category='all', searchTerm='') {
  document.getElementById('featuredSection').style.display = 'none';
  searchSection.style.display = 'block'; searchTitle.textContent = '🔍 Arama Sonuçları';
  searchGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Aranıyor...</div>`;
  let query = window.supabaseClient.from('venues').select('*');
  if (district) query = query.ilike('district', `%${district}%`);
  if (category !== 'all') query = query.eq('category', category);
  if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
  query = query.order('rating', { ascending: false });
  const { data, error } = await query;
  if (error) { searchGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">Hata: ${error.message}</div>`; return; }
  if (data && data.length > 0) { searchTitle.textContent = '🔍 Sonuçlar'; renderVenuesToGrid(data, searchGrid); }
  else { let filtered = YEDEK_MEKANLAR; if (district) filtered = filtered.filter(v => v.district.toLowerCase().includes(district.toLowerCase())); if (category !== 'all') filtered = filtered.filter(v => v.category === category); if (searchTerm) filtered = filtered.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase())); searchTitle.textContent = '🔍 Sonuçlar (yedek)'; renderVenuesToGrid(filtered, searchGrid); }
}

function resetToPopular() { searchSection.style.display = 'none'; fetchFeaturedVenues(); }

// SAYFA YÜKLENİNCE
document.addEventListener('DOMContentLoaded', () => {
  fetchFeaturedVenues();
  updateUserUI();
});

refreshFeaturedBtn?.addEventListener('click', e => { e.preventDefault(); resetToPopular(); });

searchBtn?.addEventListener('click', function(e) {
  e.preventDefault();
  const loc = locationInput ? locationInput.value.trim() : '';
  const cat = document.querySelector('.cat-item.active')?.dataset.cat || 'all';
  this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aranıyor...'; this.disabled = true;
  showSearchResults(loc, cat).finally(() => { this.innerHTML = '<span>Hemen Bul</span> <i class="fas fa-arrow-right"></i>'; this.disabled = false; });
});
locationInput?.addEventListener('keypress', e => { if (e.key === 'Enter') searchBtn.click(); });
catItems.forEach(item => item.addEventListener('click', function() { catItems.forEach(i => i.classList.remove('active')); this.classList.add('active'); showSearchResults(locationInput ? locationInput.value.trim() : '', this.dataset.cat); }));

window.addEventListener('scroll', () => { const nav = document.getElementById('navbar'); if (nav) nav.classList.toggle('scrolled', window.scrollY > 20); });

// KARAR ÇARKI (öncekiyle aynı, uzun olduğu için kısaltıldı, siz tam halini kullanın)
// ... (tam karar çarkı ve detay modal kodları buraya)

// AÇILIR KULLANICI MENÜSÜ
const signupBtn = document.getElementById('signupBtn'), loginBtn = document.getElementById('loginBtn'), userMenuContainer = document.getElementById('userMenuContainer'), userMenuBtn = document.getElementById('userMenuBtn'), userDropdown = document.getElementById('userDropdown'), userDisplayName = document.getElementById('userDisplayName'), logoutBtn = document.getElementById('logoutBtn');

userMenuBtn?.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('show'); userMenuBtn.classList.toggle('active'); });
window.addEventListener('click', (e) => { if (!userMenuContainer?.contains(e.target)) { userDropdown?.classList.remove('show'); userMenuBtn?.classList.remove('active'); } });

async function loadUserProfile() {
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const { data: profile } = await window.supabaseClient.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
    if (userDisplayName) userDisplayName.textContent = profile?.full_name || 'Profilim';
  } catch { if (userDisplayName) userDisplayName.textContent = 'Profilim'; }
}

async function updateUserUI() {
  // Oturumu bekle, sonra UI'yi güncelle
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  const user = session?.user;

  if (user) {
    if (signupBtn) signupBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenuContainer) userMenuContainer.style.display = 'block';
    loadUserProfile();
  } else {
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userMenuContainer) userMenuContainer.style.display = 'none';
    if (userDisplayName) userDisplayName.textContent = 'Profilim';
  }

  // Arama modunu sıfırla, mekanları getir
  if (searchSection) searchSection.style.display = 'none';
  fetchFeaturedVenues();
}

logoutBtn?.addEventListener('click', async (e) => { e.preventDefault(); await window.supabaseClient.auth.signOut(); updateUserUI(); });

// Oturum değişikliklerini dinle ve sayfa tamamen yüklenince UI'yi güncelle
window.supabaseClient.auth.onAuthStateChange(() => updateUserUI());
window.addEventListener('load', () => {
  updateUserUI();
});