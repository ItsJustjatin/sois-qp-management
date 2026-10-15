/* ==========================================================================
   SOIS Email Service — Centralized EmailJS Wrapper
   Presidency University Bengaluru - School of Information Science
   All email notifications go through this module.
   ========================================================================== */

window.SOISEmailService = {

    _ejs() { return window.emailjs; },
    _cfg() { return window.SOIS_CONFIG || {}; },

    _send(templateId, params) {
        const ejs = this._ejs();
        const cfg = this._cfg();
        if (!ejs || !cfg.EMAILJS_SERVICE_ID) {
            return Promise.resolve({ success: false, message: 'EmailJS not initialised.' });
        }
        return ejs.send(cfg.EMAILJS_SERVICE_ID, templateId, params)
            .then(() => ({ success: true }))
            .catch(err => ({ success: false, message: String(err?.text || err) }));
    },

    /* ── 1. OTP for Login / Registration ─────────────────────────────────── */
    sendOTP(email, name, otp) {
        const cfg = this._cfg();
        return this._send(cfg.EMAILJS_TEMPLATE_ID, {
            to_email: email, email: email, to_name: name, otp_code: otp
        });
    },

    /* ── 2. Forgot Password OTP ───────────────────────────────────────────── */
    sendForgotPasswordOTP(email, name, otp) {
        const cfg = this._cfg();
        const templateId = cfg.EMAILJS_FORGOT_TEMPLATE_ID || cfg.EMAILJS_TEMPLATE_ID;
        return this._send(templateId, {
            to_email: email, email: email, to_name: name, otp_code: otp,
            subject: 'SOIS QP System – Password Reset OTP'
        });
    },

    /* ── 3. QP Assignment Notification to Faculty ─────────────────────────── */
    sendAssignmentEmail(email, name, courseCode, courseName, examType, portalLink, managerName) {
        const cfg = this._cfg();
        const templateId = cfg.EMAILJS_ASSIGNMENT_TEMPLATE_ID || cfg.EMAILJS_TEMPLATE_ID;
        return this._send(templateId, {
            to_email: email,
            email: email,
            to_name: name,
            course_code: courseCode,
            course_name: courseName,
            exam_type: examType,
            portal_link: portalLink,
            manager_name: managerName || 'Course Coordinator',
            subject: `QP Assignment: ${courseCode} – ${courseName}`
        });
    },

    /* ── 4. Rejection Notification to Faculty ─────────────────────────────── */
    sendRejectionEmail(email, name, courseCode, courseName, managerNote) {
        const cfg = this._cfg();
        const templateId = cfg.EMAILJS_REJECTION_TEMPLATE_ID || cfg.EMAILJS_TEMPLATE_ID;
        return this._send(templateId, {
            to_email: email,
            email: email,
            to_name: name,
            course_code: courseCode,
            course_name: courseName,
            manager_note: managerNote || 'Please review and resubmit.',
            subject: `QP Rejected: ${courseCode} – ${courseName}`
        });
    }
};
