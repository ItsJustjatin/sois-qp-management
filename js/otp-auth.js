/* ==========================================================================
   SOIS OTP Auth Controller — wires registration/login forms to SOIS_STORE
   Works for both faculty.html and manager.html
   ========================================================================== */

(function () {
    'use strict';

    // ── Internal state ────────────────────────────────────────────────────────
    let _pendingUser = null;   // temp storage while OTP is pending
    let _otpEmail = '';

    // ── DOM Helpers ───────────────────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const showMsg = (msg, type = 'error') => {
        const el = $('authMsg');
        if (!el) return;
        el.textContent = msg;
        el.style.display = 'block';
        el.style.background = type === 'error' ? '#fee2e2'
            : type === 'success' ? '#dcfce7'
                : '#dbeafe';
        el.style.color = type === 'error' ? '#991b1b'
            : type === 'success' ? '#166534'
                : '#1e40af';
        el.style.padding = '0.5rem 0.75rem';
        el.style.borderRadius = '6px';
    };

    function openOtpModal(email) {
        _otpEmail = email;
        const target = $('otpEmailTarget');
        if (target) target.textContent = email;
        const overlay = $('otpModalOverlay');
        if (overlay) overlay.style.display = 'flex';
        const codeInput = $('otpCodeInput');
        if (codeInput) { codeInput.value = ''; codeInput.focus(); }
    }
    function closeOtpModal() {
        const overlay = $('otpModalOverlay');
        if (overlay) overlay.style.display = 'none';
        _pendingUser = null;
        _otpEmail = '';
    }

    // ── Tab Switching (Login / Register) ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const tabLogin = $('tabLoginBtn');
        const tabRegister = $('tabRegisterBtn');
        const loginForm = $('loginForm');
        const regForm = $('registerForm');

        if (tabLogin) {
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                if (tabRegister) tabRegister.classList.remove('active');
                if (loginForm) loginForm.style.display = '';
                if (regForm) regForm.style.display = 'none';
                showMsg('', 'info');
            });
        }
        if (tabRegister) {
            tabRegister.addEventListener('click', () => {
                tabRegister.classList.add('active');
                if (tabLogin) tabLogin.classList.remove('active');
                if (loginForm) loginForm.style.display = 'none';
                if (regForm) regForm.style.display = '';
                showMsg('', 'info');
            });
        }

        // ── REGISTRATION FORM SUBMIT ────────────────────────────────────────────
        if (regForm) {
            regForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = regForm.querySelector('button[type=submit]');
                btn.disabled = true;
                btn.textContent = '🕐 Sending OTP...';

                const punivId = ($('regPunivInput') || {}).value || '';
                const name = ($('regNameInput') || {}).value || '';
                const email = ($('regEmailInput') || {}).value || '';
                const phone = ($('regPhoneInput') || {}).value || '';
                const password = ($('regPasswordInput') || {}).value || '';
                const role = regForm.dataset.role || 'faculty';

                if (!punivId || !name || !email || !password) {
                    showMsg('Please fill all required fields.', 'error');
                    btn.disabled = false; btn.textContent = '📧 Register & Send OTP';
                    return;
                }

                // Pre-register user (save to store)
                const regResult = window.SOIS_STORE.registerUser(punivId, name, password, role, email, phone);
                if (!regResult.success) {
                    showMsg(regResult.message, 'error');
                    btn.disabled = false; btn.textContent = '📧 Register & Send OTP';
                    return;
                }
                _pendingUser = regResult.user;

                showMsg('Sending OTP...', 'info');

                const otpResult = await window.SOIS_STORE.sendOTP(email, phone, name);

                btn.disabled = false;
                btn.textContent = '📧 Register & Send OTP to Email / Phone';

                if (!otpResult.success) {
                    if (otpResult.devMode) {
                        // Dev fallback: still open modal but show console hint
                        showMsg('⚠️ OTP services not configured. Check browser console for dev code.', 'info');
                        openOtpModal(email);
                        return;
                    }
                    showMsg(otpResult.message, 'error');
                    return;
                }

                showMsg(otpResult.message, 'success');
                openOtpModal(email);
            });
        }

        // ── LOGIN FORM SUBMIT ───────────────────────────────────────────────────
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = loginForm.querySelector('button[type=submit]');
                btn.disabled = true;
                btn.textContent = '🕐 Sending OTP...';

                const punivId = ($('punivIdInput') || {}).value || '';
                const password = ($('passwordInput') || {}).value || '';
                const requiredRole = loginForm.dataset.role || null;

                // Verify credentials first
                const loginResult = window.SOIS_STORE.login(punivId, password, requiredRole);
                if (!loginResult.success) {
                    showMsg(loginResult.message, 'error');
                    btn.disabled = false; btn.textContent = '📧 Verify Mail OTP & Log In';
                    return;
                }

                _pendingUser = loginResult.user;
                const email = loginResult.user.email || `${punivId.toLowerCase()}@presidencyuniversity.in`;
                const phone = loginResult.user.phone || '';

                const otpResult = await window.SOIS_STORE.sendOTP(email, phone, loginResult.user.name);

                btn.disabled = false;
                btn.textContent = '📧 Verify Mail OTP & Log In';

                if (!otpResult.success) {
                    if (otpResult.devMode) {
                        showMsg('⚠️ OTP services not configured. Check browser console for dev OTP.', 'info');
                        openOtpModal(email);
                        return;
                    }
                    showMsg(otpResult.message, 'error');
                    return;
                }

                showMsg(otpResult.message, 'success');
                openOtpModal(email);
            });
        }

        // ── OTP FORM SUBMIT ─────────────────────────────────────────────────────
        const otpForm = $('otpForm');
        if (otpForm) {
            otpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const code = ($('otpCodeInput') || {}).value || '';
                const result = window.SOIS_STORE.verifyOTP(_otpEmail, code);

                if (!result.success) {
                    const codeInput = $('otpCodeInput');
                    if (codeInput) { codeInput.style.border = '2px solid red'; }
                    const alertBox = $('otpAlertBox');
                    if (alertBox) {
                        alertBox.style.background = '#fee2e2';
                        alertBox.style.color = '#991b1b';
                        alertBox.innerHTML = `❌ ${result.message}`;
                    }
                    return;
                }

                // OTP verified — finalize auth
                if (_pendingUser) {
                    localStorage.setItem('SOIS_AUTH_USER', JSON.stringify(_pendingUser));
                }
                closeOtpModal();
                // Hide auth overlay — each page's own JS will detect the stored user
                const authOverlay = $('authOverlay');
                if (authOverlay) authOverlay.style.display = 'none';
                window.dispatchEvent(new CustomEvent('SOIS_AUTH_SUCCESS', { detail: _pendingUser }));
            });
        }

        // ── RESEND / CANCEL OTP ─────────────────────────────────────────────────
        const resendBtn = $('resendOtpBtn');
        if (resendBtn) {
            resendBtn.addEventListener('click', async () => {
                resendBtn.disabled = true;
                resendBtn.textContent = '⏳ Sending...';
                if (_pendingUser) {
                    await window.SOIS_STORE.sendOTP(
                        _pendingUser.email, _pendingUser.phone, _pendingUser.name
                    );
                }
                setTimeout(() => {
                    resendBtn.disabled = false;
                    resendBtn.textContent = '🔄 Resend OTP';
                }, 5000);
            });
        }

        const cancelBtn = $('cancelOtpBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeOtpModal);
        }

        // ── LOGOUT ──────────────────────────────────────────────────────────────
        const logoutBtn = $('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.SOIS_STORE.logout();
                window.location.reload();
            });
        }

    }); // end DOMContentLoaded

})();
