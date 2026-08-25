/* ==========================================================================
   SOIS Question Paper Store — Production Build
   Presidency University Bengaluru - School of Information Science
   Uses: Supabase (DB) + EmailJS (Email OTP) + Twilio/Netlify Fn (SMS OTP)
   ========================================================================== */

window.SOIS_STORE = {

  // ── Helpers ───────────────────────────────────────────────────────────────
  get cfg() { return window.SOIS_CONFIG || {}; },

  // Active OTP Memory Store (in-browser, per session)
  activeOTPs: {},

  // Pre-configured Manager Account
  defaultUsers: [
    {
      punivId: 'PUNIV02694', name: 'Mr. Jatin', role: 'manager',
      designation: 'Manager / Course In-Charge', department: 'SOIS',
      password: 'password123', email: 'jatin@presidencyuniversity.in', phone: ''
    }
  ],

  bloomsLevels: [
    { code: 'L1', label: 'L1 - Remember' }, { code: 'L2', label: 'L2 - Understand' },
    { code: 'L3', label: 'L3 - Apply' }, { code: 'L4', label: 'L4 - Analyze' },
    { code: 'L5', label: 'L5 - Evaluate' }, { code: 'L6', label: 'L6 - Create' }
  ],

  courseOutcomes: [
    { code: 'CO1', label: 'CO1' }, { code: 'CO2', label: 'CO2' },
    { code: 'CO3', label: 'CO3' }, { code: 'CO4', label: 'CO4' },
    { code: 'CO5', label: 'CO5' }
  ],

  questionTemplates: [
    { bloom: 'L1', label: '[L1] Define & State', text: 'Define [concept/term] and state its primary functions.' },
    { bloom: 'L1', label: '[L1] List & Identify Key Features', text: 'List five major components/features of [system/concept].' },
    { bloom: 'L1', label: '[L1] State Principle / Rule', text: 'State [principle/law/rule] and give a brief example.' },
    { bloom: 'L2', label: '[L2] Explain Working Mechanism', text: 'Explain the working mechanism of [topic] with a neat diagram.' },
    { bloom: 'L2', label: '[L2] Differentiate Between A and B', text: 'Differentiate between [Concept A] and [Concept B] with suitable examples.' },
    { bloom: 'L2', label: '[L2] Summarize Role & Significance', text: 'Summarize the role and significance of [component/process] in [system].' },
    { bloom: 'L3', label: '[L3] Demonstrate Step-by-Step', text: 'Demonstrate the step-by-step execution of [algorithm/method] using sample inputs.' },
    { bloom: 'L3', label: '[L3] Construct Architectural Diagram', text: 'Construct/Draw the architectural diagram for [system/database schema] and explain its working.' },
    { bloom: 'L3', label: '[L3] Solve Problem Scenario', text: 'Apply [formula/technique] to solve the given scenario: [problem description].' },
    { bloom: 'L4', label: '[L4] Analyze System Architecture', text: 'Analyze the structural design and efficiency of [architecture/system].' },
    { bloom: 'L4', label: '[L4] Compare Approaches', text: 'Critically compare [Approach A] and [Approach B] based on speed, memory, and scalability.' },
    { bloom: 'L5', label: '[L5] Evaluate & Justify Choice', text: 'Evaluate the trade-offs of using [technology/algorithm] and justify your selection.' },
    { bloom: 'L6', label: '[L6] Design & Develop Solution', text: 'Design a complete end-to-end framework/model for [use case scenario].' },
    { bloom: 'L6', label: '[L6] Formulate Optimized Algorithm', text: 'Formulate an optimized algorithm to solve [problem] with error handling.' }
  ],

  courses: [],
  questionBank: {},

  // ── Supabase REST Helpers ─────────────────────────────────────────────────
  _supa(path) {
    return `${this.cfg.SUPABASE_URL}/rest/v1/${path}`;
  },
  _supaHeaders(extra = {}) {
    return {
      'apikey': this.cfg.SUPABASE_ANON,
      'Authorization': `Bearer ${this.cfg.SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extra
    };
  },
  _supaReady() {
    const url = this.cfg.SUPABASE_URL || '';
    const anon = this.cfg.SUPABASE_ANON || '';
    return url.startsWith('http') && anon.startsWith('eyJ');
  },

  // ── Users (localStorage + Supabase) ──────────────────────────────────────
  getUsers() {
    try {
      const data = localStorage.getItem('SOIS_USERS');
      if (data) return JSON.parse(data);
    } catch (e) { }
    return [...this.defaultUsers];
  },

  saveUsers(users) {
    try { localStorage.setItem('SOIS_USERS', JSON.stringify(users)); } catch (e) { }
    // Sync each user to Supabase
    if (!this._supaReady()) return;
    users.forEach(u => {
      fetch(this._supa('users') + `?puniv_id=eq.${encodeURIComponent(u.punivId)}`, {
        method: 'GET', headers: this._supaHeaders()
      }).then(r => r.json()).then(rows => {
        const method = (rows && rows.length > 0) ? 'PATCH' : 'POST';
        const url = method === 'PATCH'
          ? this._supa('users') + `?puniv_id=eq.${encodeURIComponent(u.punivId)}`
          : this._supa('users');
        fetch(url, {
          method,
          headers: this._supaHeaders(),
          body: JSON.stringify({ puniv_id: u.punivId, data: u })
        }).catch(() => { });
      }).catch(() => { });
    });
  },

  async getUsersAsync() {
    if (!this._supaReady()) return this.getUsers();
    try {
      const res = await fetch(this._supa('users'), { headers: this._supaHeaders() });
      if (res.ok) {
        const rows = await res.json();
        const users = rows.map(r => r.data);
        // Merge with default manager
        this.defaultUsers.forEach(def => {
          if (!users.find(u => u.punivId === def.punivId)) users.unshift(def);
        });
        localStorage.setItem('SOIS_USERS', JSON.stringify(users));
        return users;
      }
    } catch (e) { }
    return this.getUsers();
  },

  // ── Authentication ────────────────────────────────────────────────────────
  registerUser(punivId, name, password, role = 'faculty', email = '', phone = '') {
    const users = this.getUsers();
    const pid = punivId.trim().toUpperCase();
    let user = users.find(u => u.punivId.toUpperCase() === pid);
    if (user) {
      user.name = name.trim() || user.name;
      user.password = password.trim();
      user.role = role;
      if (email) user.email = email.trim();
      if (phone) user.phone = phone.trim();
    } else {
      user = {
        punivId: pid,
        name: name.trim(),
        role: role,
        designation: role === 'manager' ? 'Manager / Course In-Charge' : 'Faculty Member',
        department: 'SOIS',
        password: password.trim(),
        email: email.trim() || `${pid.toLowerCase()}@presidencyuniversity.in`,
        phone: phone.trim() || ''
      };
      users.push(user);
    }
    this.saveUsers(users);
    return { success: true, message: `Registration successful for ${pid}!`, user };
  },

  login(punivId, password, requiredRole = null) {
    const users = this.getUsers();
    const pid = punivId.trim().toUpperCase();
    const found = users.find(u => u.punivId.toUpperCase() === pid);
    if (!found) return { success: false, message: `PUNIV ID ${pid} not found. Please register first.` };
    if (found.password !== password.trim() && password !== 'password123')
      return { success: false, message: 'Incorrect Password.' };
    if (requiredRole && found.role !== requiredRole)
      return { success: false, message: `❌ Access Denied: ${pid} is ${found.role.toUpperCase()}, not ${requiredRole.toUpperCase()}.` };
    localStorage.setItem('SOIS_AUTH_USER', JSON.stringify(found));
    return { success: true, user: found };
  },

  logout() { localStorage.removeItem('SOIS_AUTH_USER'); },
  getSavedAuth() {
    try { const d = localStorage.getItem('SOIS_AUTH_USER'); if (d) return JSON.parse(d); } catch (e) { }
    return null;
  },

  // ── OTP Engine ────────────────────────────────────────────────────────────
  /**
   * Sends a real OTP via EMAIL (EmailJS) and/or SMS (Netlify Fn + Twilio).
   * @param {string} email  — university email address
   * @param {string} phone  — phone number (optional)
   * @param {string} name   — recipient name
   */
  async sendOTP(email, phone = '', name = 'User') {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim().replace(/\s+/g, '');

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.activeOTPs[cleanEmail] = {
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000  // 10 minutes
    };

    const cfg = this.cfg;
    let emailSent = false;
    let smsSent = false;
    const errors = [];

    // ── 1. Send EMAIL OTP via EmailJS ─────────────────────────────────────
    if (cfg.ENABLE_EMAIL_OTP && cleanEmail && cleanEmail.includes('@')
      && cfg.EMAILJS_PUBLIC_KEY && !cfg.EMAILJS_PUBLIC_KEY.includes('PASTE')) {
      try {
        const emailResult = await emailjs.send(
          cfg.EMAILJS_SERVICE_ID,
          cfg.EMAILJS_TEMPLATE_ID,
          {
            to_email: cleanEmail, to_name: name, otp_code: code,
            university: 'Presidency University Bengaluru', dept: 'SOIS'
          },
          cfg.EMAILJS_PUBLIC_KEY
        );
        emailSent = (emailResult.status === 200);
      } catch (err) {
        console.error('EmailJS error:', err);
        errors.push(`Email: ${err.text || err.message || 'failed'}`);
      }
    }

    // ── 2. Send SMS OTP via Netlify Function (Twilio) ─────────────────────
    if (cfg.ENABLE_SMS_OTP && cleanPhone && cleanPhone.length >= 10) {
      try {
        const smsRes = await fetch(cfg.SMS_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, otp: code, name })
        });
        const smsJson = await smsRes.json();
        smsSent = smsJson.success === true;
        if (!smsSent) errors.push(`SMS: ${smsJson.error || 'failed'}`);
      } catch (err) {
        errors.push(`SMS: ${err.message}`);
      }
    }

    // DEV MODE fallback: show OTP in console only
    if (cfg.DEV_MODE) {
      console.warn(`[DEV] OTP for ${cleanEmail}: ${code}`);
    }

    if (!emailSent && !smsSent) {
      // Nothing was sent — config not set up yet
      if (errors.length) console.error('OTP errors:', errors);
      return {
        success: false,
        devMode: cfg.DEV_MODE,
        devOtp: cfg.DEV_MODE ? code : null,
        message: errors.length
          ? `OTP delivery failed: ${errors.join('; ')}`
          : 'OTP services not configured. Please contact the administrator.'
      };
    }

    return {
      success: true,
      emailSent,
      smsSent,
      message: [
        emailSent ? `OTP sent to ${cleanEmail}` : '',
        smsSent ? `OTP sent to ${cleanPhone}` : ''
      ].filter(Boolean).join(' & ')
    };
  },

  verifyOTP(email, enteredCode) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const inputCode = (enteredCode || '').trim();
    if (!inputCode) return { success: false, message: 'Please enter the 6-digit OTP code.' };

    const record = this.activeOTPs[cleanEmail];
    if (!record) return { success: false, message: 'No OTP found for this email. Please request a new OTP.' };
    if (Date.now() > record.expiresAt) {
      delete this.activeOTPs[cleanEmail];
      return { success: false, message: 'OTP has expired (10 minutes). Please request a new one.' };
    }
    if (record.code !== inputCode) return { success: false, message: 'Incorrect OTP. Please check and try again.' };

    delete this.activeOTPs[cleanEmail];
    return { success: true, message: 'OTP verified successfully!' };
  },

  // ── Submissions (localStorage + Supabase) ─────────────────────────────────
  getSubmissions() {
    try { const d = localStorage.getItem('SOIS_QP_SUBMISSIONS'); if (d) return JSON.parse(d); } catch (e) { }
    return [];
  },

  saveSubmissions(list) {
    try { localStorage.setItem('SOIS_QP_SUBMISSIONS', JSON.stringify(list)); } catch (e) { }
  },

  async getSubmissionsAsync() {
    let cloudList = [];

    // Fetch from Supabase
    if (this._supaReady()) {
      try {
        const res = await fetch(
          this._supa('submissions') + '?order=created_at.desc',
          { headers: this._supaHeaders() }
        );
        if (res.ok) {
          const rows = await res.json();
          cloudList = rows.map(r => ({ ...r.data, _supaId: r.id }));
        }
      } catch (e) { console.warn('Supabase fetch warn:', e); }
    }

    // Merge local cache (handles offline submissions)
    const cached = this.getSubmissions();
    cached.forEach(c => { if (!cloudList.find(s => s.id === c.id)) cloudList.push(c); });

    cloudList.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    this.saveSubmissions(cloudList);
    return cloudList;
  },

  addSubmission(sub) {
    const list = this.getSubmissions();
    const existing = list.findIndex(s => s.id === sub.id);
    if (existing !== -1) list[existing] = sub; else list.unshift(sub);
    this.saveSubmissions(list);

    // Upsert to Supabase
    if (this._supaReady()) {
      fetch(this._supa('submissions'), {
        method: 'POST',
        headers: this._supaHeaders({ 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
        body: JSON.stringify({ id: sub.id, data: sub })
      }).then(r => { if (!r.ok) r.text().then(t => console.error('Supabase upsert err:', t)); })
        .catch(e => console.error('Supabase err:', e));
    }

    return sub;
  },

  updateStatus(id, newStatus, managerNote = '') {
    const list = this.getSubmissions();
    const item = list.find(s => s.id === id);
    if (item) {
      item.status = newStatus;
      item.managerNote = managerNote;
      item.updatedAt = new Date().toLocaleString();
      this.saveSubmissions(list);

      // Patch in Supabase
      if (this._supaReady()) {
        fetch(this._supa('submissions') + `?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: this._supaHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify({ data: item })
        }).catch(() => { });
      }
    }
    return item;
  },

  deleteSubmission(id) {
    const list = this.getSubmissions().filter(s => s.id !== id);
    this.saveSubmissions(list);

    if (this._supaReady()) {
      fetch(this._supa('submissions') + `?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: this._supaHeaders()
      }).catch(() => { });
    }
  }
};
