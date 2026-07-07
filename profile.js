(function() {
const SUPABASE_URL = 'https://hnpnaafxlpfrwiuiunxo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucG5hYWZ4bHBmcndpdWl1bnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgzNTMsImV4cCI6MjA5ODgxNDM1M30.cQQ80l2kl18VIFupDwj9rGTj3Tr0Owr3YerYpzO_RPM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) { document.getElementById('profileMsg').textContent = 'Profil yüklenirken hata oluştu.'; return; }

  document.getElementById('fullName').value = profile?.full_name || '';
  document.getElementById('profileEmail').value = user.email;
  document.getElementById('avatarUrl').value = profile?.avatar_url || '';
  document.getElementById('avatarPreview').src = profile?.avatar_url || 'https://placehold.co/120x120/ff6b35/white?text=Avatar';

  document.getElementById('avatarUrl').addEventListener('input', e => {
    document.getElementById('avatarPreview').src = e.target.value || 'https://placehold.co/120x120/ff6b35/white?text=Avatar';
  });

  document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const avatarUrl = document.getElementById('avatarUrl').value.trim();
    const { error: updateError } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', user.id);
    const msg = document.getElementById('profileMsg');
    if (updateError) { msg.style.color = 'red'; msg.textContent = 'Güncelleme başarısız: ' + updateError.message; }
    else msg.textContent = 'Profil başarıyla güncellendi!';
  });
});
})();