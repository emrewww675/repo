(function() {
    const SUPABASE_URL = 'https://hnpnaafxlpfrwiuiunxo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucG5hYWZ4bHBmcndpdWl1bnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzgzNTMsImV4cCI6MjA5ODgxNDM1M30.cQQ80l2kl18VIFupDwj9rGTj3Tr0Owr3YerYpzO_RPM';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const HOME_PAGE = 'anasayfa.html';

    window.addEventListener('DOMContentLoaded', async () => {
        const form = document.getElementById('authForm'),
            formTitle = document.getElementById('formTitle'),
            submitBtn = document.getElementById('submitBtn'),
            toggleLink = document.getElementById('toggleLink'),
            errorMsg = document.getElementById('errorMsg'),
            emailInput = document.getElementById('email'),
            passwordInput = document.getElementById('password'),
            passwordRules = document.getElementById('passwordRules'),
            ruleLength = document.getElementById('ruleLength'),
            ruleUpper = document.getElementById('ruleUpper'),
            ruleLower = document.getElementById('ruleLower'),
            ruleDigit = document.getElementById('ruleDigit'),
            ruleSpecial = document.getElementById('ruleSpecial');

        let isLogin = true;

        // Zaten giriş yapmışsa formu gizle, uyarı göster
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            document.querySelector('.auth-card').innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <i class="fas fa-check-circle" style="font-size:50px; color:#10b981;"></i>
                    <h2 style="margin-top:15px;">Zaten Giriş Yaptınız</h2>
                    <p style="color:#666;">${user.email} hesabıyla oturum açık.</p>
                    <a href="${HOME_PAGE}" class="btn-solid-nav" style="display:inline-block; margin-top:20px;">Ana Sayfaya Git</a>
                </div>`;
            return; // Kodun devamını durdur
        }

        function updateFormMode() {
            if (isLogin) {
                formTitle.textContent = 'Giriş Yap';
                submitBtn.innerHTML = '<span>Giriş Yap</span> <i class="fas fa-arrow-right"></i>';
                toggleLink.innerHTML = 'Hesabınız yok mu? <strong>Kaydolun</strong>';
                passwordRules.style.display = 'none';
            } else {
                formTitle.textContent = 'Kaydol';
                submitBtn.innerHTML = '<span>Kaydol</span> <i class="fas fa-arrow-right"></i>';
                toggleLink.innerHTML = 'Zaten hesabınız var mı? <strong>Giriş yapın</strong>';
                passwordRules.style.display = 'block';
                checkPasswordRules(passwordInput.value);
            }
            errorMsg.textContent = '';
        }

        function checkPasswordRules(pw) {
            const l = pw.length >= 8,
                u = /[A-Z]/.test(pw),
                lo = /[a-z]/.test(pw),
                d = /[0-9]/.test(pw),
                s = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
            toggleRule(ruleLength, l);
            toggleRule(ruleUpper, u);
            toggleRule(ruleLower, lo);
            toggleRule(ruleDigit, d);
            toggleRule(ruleSpecial, s);
            return l && u && lo && d && s;
        }

        function toggleRule(el, ok) {
            if (ok) {
                el.classList.add('passed');
                const i = el.querySelector('i');
                i.classList.remove('fa-circle');
                i.classList.add('fa-check-circle');
            } else {
                el.classList.remove('passed');
                const i = el.querySelector('i');
                i.classList.remove('fa-check-circle');
                i.classList.add('fa-circle');
            }
        }

        passwordInput.addEventListener('input', () => {
            if (!isLogin) checkPasswordRules(passwordInput.value);
        });
        toggleLink.addEventListener('click', e => {
            e.preventDefault();
            isLogin = !isLogin;
            updateFormMode();
        });

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const email = emailInput.value.trim(),
                password = passwordInput.value.trim();
            errorMsg.textContent = '';

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) errorMsg.textContent = error.message;
                else window.location.href = HOME_PAGE;
            } else {
                if (!checkPasswordRules(password)) {
                    errorMsg.textContent = 'Lütfen tüm şifre kriterlerini karşılayın.';
                    return;
                }
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) errorMsg.textContent = error.message;
                else {
                    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
                    if (loginErr) {
                        errorMsg.textContent = 'Kayıt başarılı ama otomatik giriş başarısız. Lütfen giriş yapın.';
                        isLogin = true;
                        updateFormMode();
                    } else window.location.href = HOME_PAGE;
                }
            }
        });
    });
})();