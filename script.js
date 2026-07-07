const SUPABASE_URL = 'https://hnpnaafxlpfrwiuiunxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucG5hYWZ4bHBmcndpdWl1bnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgzNTMsImV4cCI6MjA5ODgxNDM1M30.cQQ80l2kl18VIFupDwj9rGTj3Tr0Owr3YerYpzO_RPM';
if (!window.supabaseClient) window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
window.addEventListener('load', () => {
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

// KARAR ÇARKI
const wheelLink = document.getElementById('wheelLink'), wheelModal = document.getElementById('wheelModal'), closeWheelModal = document.querySelector('#wheelModal .close-modal'), canvas = document.getElementById('wheelCanvas'), ctx = canvas ? canvas.getContext('2d') : null, spinBtn = document.getElementById('spinWheelBtn'), resultText = document.getElementById('wheelResult');
let wheelVenues = [], isSpinning = false;

function drawWheel(angle = 0) {
  if (!ctx || !wheelVenues.length) return;
  const cx = canvas.width/2, cy = canvas.height/2, r = 130, slice = (2*Math.PI)/wheelVenues.length;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const colors = ['#FF6B35','#7C3AED','#F43F5E','#4FACFE','#43E97B','#FBBF24'];
  wheelVenues.forEach((v,i) => { const start = i*slice+angle, end = start+slice; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,end); ctx.closePath(); ctx.fillStyle = colors[i%colors.length]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.save(); ctx.translate(cx,cy); ctx.rotate(start+slice/2); ctx.textAlign = "right"; ctx.fillStyle = "#fff"; ctx.font = "bold 14px Inter"; ctx.fillText(v.name.length>10 ? v.name.substring(0,10)+'…' : v.name, r-15, 5); ctx.restore(); });
  ctx.beginPath(); ctx.arc(cx,cy,25,0,2*Math.PI); ctx.fillStyle='#fff'; ctx.fill(); ctx.fillStyle='#FF6B35'; ctx.font='bold 16px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🎯', cx, cy);
}
async function loadWheelVenues() { try { const { data } = await window.supabaseClient.from('venues').select('name').limit(6); wheelVenues = (data && data.length) ? data : YEDEK_MEKANLAR; drawWheel(); } catch { wheelVenues = YEDEK_MEKANLAR; drawWheel(); } }
wheelLink?.addEventListener('click', e => { e.preventDefault(); wheelModal.classList.add('active'); loadWheelVenues(); });
closeWheelModal?.addEventListener('click', () => { wheelModal.classList.remove('active'); resultText.textContent=''; isSpinning=false; });
window.addEventListener('click', e => { if (e.target === wheelModal) { wheelModal.classList.remove('active'); resultText.textContent=''; isSpinning=false; } });
spinBtn?.addEventListener('click', () => { if (isSpinning || !wheelVenues.length) return; isSpinning = true; resultText.textContent = ''; const spins = 5 + Math.floor(Math.random()*5), rand = Math.floor(Math.random()*wheelVenues.length), slice = (2*Math.PI)/wheelVenues.length, target = spins*2*Math.PI + rand*slice + Math.random()*slice; let angle = 0, start = performance.now(); function anim(now) { const p = Math.min((now-start)/4000, 1); angle = (1 - Math.pow(1-p,4)) * target; drawWheel(angle); if (p < 1) requestAnimationFrame(anim); else { isSpinning = false; resultText.textContent = `🎉 ${wheelVenues[rand].name} seçildi!`; } } requestAnimationFrame(anim); });

// DETAY MODAL
function openDetailModal(card) {
  const v = JSON.parse(card.getAttribute('data-venue')), modal = document.getElementById('detailModal'); if (!modal) return;
  document.getElementById('detailName').textContent = v.name; document.getElementById('detailCategory').textContent = v.category; document.getElementById('detailDistrict').textContent = v.district; document.getElementById('detailPrice').textContent = v.price_level; document.getElementById('detailRating').textContent = v.rating ? '⭐'.repeat(Math.floor(v.rating)) : ''; document.getElementById('detailDescription').textContent = v.description || ''; const img = document.getElementById('detailImage'); if (v.image_url) { img.src = v.image_url; img.style.display = 'block'; } else img.style.display = 'none'; modal.classList.add('active');
}
document.getElementById('closeDetail')?.addEventListener('click', () => document.getElementById('detailModal').classList.remove('active'));
window.addEventListener('click', e => { if (e.target === document.getElementById('detailModal')) document.getElementById('detailModal').classList.remove('active'); });

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

  if (searchSection) searchSection.style.display = 'none';
  fetchFeaturedVenues();
}

logoutBtn?.addEventListener('click', async (e) => { e.preventDefault(); await window.supabaseClient.auth.signOut(); updateUserUI(); });
window.supabaseClient.auth.onAuthStateChange(() => updateUserUI());