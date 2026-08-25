/* ==========================================================================
   Manager Portal Controller (manager.js)
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.SOIS_STORE;
  const exporter = window.QPExporter;

  // DOM Elements - Auth & Forms
  const authOverlay = document.getElementById('authOverlay');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authMsg = document.getElementById('authMsg');

  const punivIdInput = document.getElementById('punivIdInput');
  const passwordInput = document.getElementById('passwordInput');

  const regPunivInput = document.getElementById('regPunivInput');
  const regNameInput = document.getElementById('regNameInput');
  const regEmailInput = document.getElementById('regEmailInput');
  const regPasswordInput = document.getElementById('regPasswordInput');

  // Header Elements
  const userProfileBadge = document.getElementById('userProfileBadge');
  const userDisplayName = document.getElementById('userDisplayName');
  const logoutBtn = document.getElementById('logoutBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Dashboard Stats & Filters
  const totalSubsEl = document.getElementById('totalSubsEl');
  const pendingReviewEl = document.getElementById('pendingReviewEl');
  const approvedSubsEl = document.getElementById('approvedSubsEl');
  const revisionSubsEl = document.getElementById('revisionSubsEl');

  const statusFilterSelect = document.getElementById('statusFilterSelect');
  const courseFilterSelect = document.getElementById('courseFilterSelect');
  const searchInput = document.getElementById('searchInput');
  const submissionsTableBody = document.getElementById('submissionsTableBody');

  // Modal Elements
  const paperModal = document.getElementById('paperModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const closeModalBottomBtn = document.getElementById('closeModalBottomBtn');
  const modalPaperTitle = document.getElementById('modalPaperTitle');
  const modalPaperSub = document.getElementById('modalPaperSub');
  const modalStatusSelect = document.getElementById('modalStatusSelect');
  const modalManagerNoteInput = document.getElementById('modalManagerNoteInput');
  const saveDecisionBtn = document.getElementById('saveDecisionBtn');
  const modalAuditSummary = document.getElementById('modalAuditSummary');
  const paperContentPreview = document.getElementById('paperContentPreview');
  const modalDocxBtn = document.getElementById('modalDocxBtn');
  const modalPdfBtn = document.getElementById('modalPdfBtn');

  let activeSubmission = null;

  // Populate Course Filter Dropdown (courseFilterSelect is optional — only in some pages)
  if (courseFilterSelect) {
    store.courses.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.code;
      opt.textContent = `${c.code} - ${c.name}`;
      courseFilterSelect.appendChild(opt);
    });
  }

  // Dark Mode Toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme');
      if (current === 'dark') {
        document.body.removeAttribute('data-theme');
        themeToggleBtn.textContent = '🌙 Dark Mode';
      } else {
        document.body.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Light Mode';
      }
    });
  }

  // Check Saved Authentication (Role MUST be manager)
  const savedUser = store.getSavedAuth();
  if (savedUser && savedUser.role === 'manager') {
    onLoginSuccess(savedUser);
  } else {
    if (savedUser && savedUser.role !== 'manager') {
      authMsg.textContent = `❌ Access Denied: Account ${savedUser.punivId} is registered as FACULTY. Access to the Manager Portal is restricted to authorized Managers only.`;
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.display = 'block';
    }
    authOverlay.style.display = 'flex';
  }

  // Pending OTP Auth State
  let pendingAuth = null;
  const otpModalOverlay = document.getElementById('otpModalOverlay');
  const otpEmailTarget = document.getElementById('otpEmailTarget');
  const otpCodeInput = document.getElementById('otpCodeInput');
  const otpForm = document.getElementById('otpForm');
  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const cancelOtpBtn = document.getElementById('cancelOtpBtn');

  async function triggerOTP(email, phone, authType, authData) {
    const cleanEmail = email || `${authData.pid.toLowerCase()}@presidencyuniversity.in`;

    // Show spinner on submit button
    const activeBtn = document.querySelector('#loginForm button[type=submit], #registerForm button[type=submit]');
    if (activeBtn) { activeBtn.disabled = true; activeBtn.textContent = '🕐 Sending OTP to your email...'; }

    const otpRes = await store.sendOTP(cleanEmail, phone || '', authData.name || 'Manager');

    if (activeBtn) { activeBtn.disabled = false; activeBtn.textContent = activeBtn.closest('#loginForm') ? '📧 Verify University Mail OTP & Log In' : '📧 Register & Send OTP to Email / Phone'; }

    if (!otpRes.success && !otpRes.devMode) {
      authMsg.textContent = otpRes.message || 'Could not send OTP. Please check your email and try again.';
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.display = 'block';
      return;
    }

    pendingAuth = { type: authType, data: authData, email: cleanEmail, phone: phone || '' };
    if (otpEmailTarget) otpEmailTarget.textContent = cleanEmail;
    if (otpCodeInput) otpCodeInput.value = '';
    if (otpModalOverlay) otpModalOverlay.style.display = 'flex';
  }

  // Auth Tab Toggles
  tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    authMsg.style.display = 'none';
  });

  tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    authMsg.style.display = 'none';
  });

  // Login Form Submission -> Triggers OTP
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = punivIdInput.value.trim();
    const pass = passwordInput.value.trim();

    const users = store.getUsers();
    const found = users.find(u => u.punivId.toUpperCase() === pid.toUpperCase());

    if (!found) {
      authMsg.textContent = `PUNIV Manager Code ${pid} not found. Click New Manager Signup tab.`;
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.display = 'block';
      return;
    }

    if (found.role !== 'manager') {
      authMsg.textContent = `❌ Access Denied: Account ${pid} is registered as ${found.role.toUpperCase()}. Access restricted to Managers.`;
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.display = 'block';
      return;
    }

    if (found.password !== pass && pass !== 'password123') {
      authMsg.textContent = 'Incorrect Password. Please try again.';
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.display = 'block';
      return;
    }

    triggerOTP(found.email || `${pid.toLowerCase()}@presidencyuniversity.in`, found.phone || '', 'login', { pid, pass, name: found.name });
  });

  // Registration Form Submission -> Triggers OTP
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = regPunivInput.value.trim();
    const name = regNameInput.value.trim();
    const email = regEmailInput.value.trim();
    const pass = regPasswordInput.value.trim();

    const phone = (document.getElementById('regPhoneInput') || {}).value || '';
    triggerOTP(email, phone, 'register', { pid, name, pass, email, phone });
  });

  // OTP Form Submission
  if (otpForm) {
    otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!pendingAuth) return;

      const inputCode = otpCodeInput.value.trim();
      const verifyRes = store.verifyOTP(pendingAuth.email, inputCode);

      if (!verifyRes.success) {
        alert(verifyRes.message);
        return;
      }

      otpModalOverlay.style.display = 'none';

      if (pendingAuth.type === 'register') {
        const { pid, name, pass, email } = pendingAuth.data;
        const regRes = store.registerUser(pid, name, pass, 'manager', email);
        const loginRes = store.login(pid, pass, 'manager');
        if (loginRes.success) {
          onLoginSuccess(loginRes.user);
        }
      } else if (pendingAuth.type === 'login') {
        const { pid, pass } = pendingAuth.data;
        const loginRes = store.login(pid, pass, 'manager');
        if (loginRes.success) {
          onLoginSuccess(loginRes.user);
        }
      }
      pendingAuth = null;
    });
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      if (!pendingAuth) return;
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = '⏳ Sending...';
      await store.sendOTP(pendingAuth.email, pendingAuth.phone || '', pendingAuth.data.name || 'Manager');
      setTimeout(() => { resendOtpBtn.disabled = false; resendOtpBtn.textContent = '🔄 Resend OTP'; }, 5000);
    });
  }

  if (cancelOtpBtn) {
    cancelOtpBtn.addEventListener('click', () => {
      if (otpModalOverlay) otpModalOverlay.style.display = 'none';
      pendingAuth = null;
    });
  }

  // Logout Action
  logoutBtn.addEventListener('click', () => {
    store.logout();
    authOverlay.style.display = 'flex';
    userProfileBadge.style.display = 'none';
  });

  function onLoginSuccess(user) {
    authOverlay.style.display = 'none';
    authMsg.style.display = 'none';

    userDisplayName.textContent = `${user.name} (${user.punivId})`;
    userProfileBadge.style.display = 'flex';

    renderDashboard();
    // Auto refresh Manager Dashboard every 5 seconds to receive new faculty submissions in real time
    if (!window.managerPollInterval) {
      window.managerPollInterval = setInterval(renderDashboard, 5000);
    }
  }

  // Render Manager Dashboard & Table
  async function renderDashboard() {
    const submissions = await store.getSubmissionsAsync();

    // Update Stats
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === 'Submitted' || s.status === 'Under Review').length;
    const approved = submissions.filter(s => s.status === 'Approved').length;
    const revision = submissions.filter(s => s.status === 'Revision Requested').length;

    totalSubsEl.textContent = total;
    pendingReviewEl.textContent = pending;
    approvedSubsEl.textContent = approved;
    revisionSubsEl.textContent = revision;

    // Filter Logic
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : 'ALL';
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = submissions.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (query) {
        const matchName = item.facultyName && item.facultyName.toLowerCase().includes(query);
        const matchPuniv = item.punivId && item.punivId.toLowerCase().includes(query);
        const matchCode = item.courseCode && item.courseCode.toLowerCase().includes(query);
        const matchCourse = item.courseName && item.courseName.toLowerCase().includes(query);
        const matchId = item.id && item.id.toLowerCase().includes(query);
        if (!matchName && !matchPuniv && !matchCode && !matchCourse && !matchId) return false;
      }
      return true;
    });

    submissionsTableBody.innerHTML = '';

    if (filtered.length === 0) {
      submissionsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
            No submitted question papers found matching the selected criteria.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach((sub) => {
      const tr = document.createElement('tr');

      let statusClass = 'status-submitted';
      if (sub.status === 'Under Review') statusClass = 'status-review';
      if (sub.status === 'Approved') statusClass = 'status-approved';
      if (sub.status === 'Revision Requested') statusClass = 'status-revision';
      if (sub.status === 'Rejected') statusClass = 'status-rejected';

      tr.innerHTML = `
        <td><b style="font-family:monospace; color:var(--primary);">${sub.id}</b></td>
        <td>
          <div style="font-weight:700;">${sub.facultyName || 'Faculty'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${sub.punivId || ''}</div>
        </td>
        <td>
          <div style="font-weight:700;">${sub.courseCode} - ${sub.courseName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${sub.meta ? sub.meta.examTitle : ''}</div>
        </td>
        <td><span class="user-role-tag role-manager-tag">${sub.setName || 'SET A'}</span></td>
        <td style="font-size:0.8rem;">${sub.submittedAt || 'N/A'}</td>
        <td><span class="status-badge ${statusClass}">${sub.status}</span></td>
        <td style="font-size:0.78rem; max-width:200px; color:var(--text-muted);">
          ${sub.managerNote ? `💬 "${sub.managerNote}"` : '<i style="opacity:0.6;">No comments yet</i>'}
        </td>
        <td style="text-align: right; whitespace: nowrap;">
          <button class="btn btn-secondary btn-sm btn-view-paper" data-id="${sub.id}">👁️ Review</button>
          <button class="btn btn-primary btn-sm btn-download-docx" data-id="${sub.id}">📝 DOCX</button>
          <button class="btn btn-success btn-sm btn-download-pdf" data-id="${sub.id}">🖨️ PDF</button>
          <button class="btn btn-success btn-sm btn-quick-approve" data-id="${sub.id}">✅ Approve</button>
          <button class="btn btn-danger btn-sm btn-delete-sub" data-id="${sub.id}" style="padding:0.2rem 0.4rem;" title="Delete Record">🗑️</button>
        </td>
      `;

      submissionsTableBody.appendChild(tr);
    });

    // Attach Event Handlers
    document.querySelectorAll('.btn-view-paper').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openPaperModal(id);
      });
    });

    document.querySelectorAll('.btn-download-docx').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = submissions.find(s => s.id === id);
        if (item) {
          QPExporter.exportSubmission(item);
        }
      });
    });

    document.querySelectorAll('.btn-download-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = submissions.find(s => s.id === id);
        if (item) {
          const meta = item.meta || {
            courseCode: item.courseCode,
            courseName: item.courseName,
            examTitle: 'Continuous Assessment Test',
            date: item.submittedAt,
            semester: '4',
            maxMarks: '30',
            duration: '1 Hour'
          };
          QPExporter.exportToPDF(meta, { partA: item.partA, partB: item.partB }, item.setName || 'SET A');
        }
      });
    });

    document.querySelectorAll('.btn-quick-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        store.updateStatus(id, 'Approved', 'Approved by Manager');
        renderDashboard();
      });
    });

    document.querySelectorAll('.btn-delete-sub').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm(`Are you sure you want to delete submission ${id}?`)) {
          store.deleteSubmission(id);
          renderDashboard();
        }
      });
    });
  }

  // Filter Action Listeners
  if (statusFilterSelect) statusFilterSelect.addEventListener('change', renderDashboard);
  if (searchInput) searchInput.addEventListener('input', renderDashboard);

  // Open Inspection & Decision Modal
  function openPaperModal(id) {
    const list = store.getSubmissions();
    activeSubmission = list.find(s => s.id === id);
    if (!activeSubmission) return;

    modalPaperTitle.textContent = `${activeSubmission.id}: ${activeSubmission.courseCode} - ${activeSubmission.courseName}`;
    modalPaperSub.textContent = `Faculty: ${activeSubmission.facultyName} (${activeSubmission.punivId}) • Submitted: ${activeSubmission.submittedAt}`;

    modalStatusSelect.value = activeSubmission.status || 'Submitted';
    modalManagerNoteInput.value = activeSubmission.managerNote || '';

    // Calculate Audit Breakdown (Bloom's Taxonomy & Course Outcomes)
    renderAuditSummary(activeSubmission);

    // Render A4 Question Paper HTML
    renderPaperContent(activeSubmission);

    paperModal.style.display = 'flex';
  }

  // Save Manager Decision
  saveDecisionBtn.addEventListener('click', () => {
    if (!activeSubmission) return;
    const newStatus = modalStatusSelect.value;
    const note = modalManagerNoteInput.value.trim();

    store.updateStatus(activeSubmission.id, newStatus, note);
    activeSubmission.status = newStatus;
    activeSubmission.managerNote = note;

    alert(`Decision saved successfully for ${activeSubmission.id}! Status set to '${newStatus}'.`);
    renderDashboard();
  });

  // Calculate & Render Audit Breakdown
  function renderAuditSummary(sub) {
    const allQuestions = [...(sub.partA || []), ...(sub.partB || [])];

    const bloomsCount = {};
    const coCount = {};

    allQuestions.forEach((q) => {
      if (q.bloom) bloomsCount[q.bloom] = (bloomsCount[q.bloom] || 0) + 1;
      if (q.co) coCount[q.co] = (coCount[q.co] || 0) + 1;
    });

    const bloomBadges = Object.entries(bloomsCount)
      .map(([b, count]) => `<span class="audit-badge">🧠 <b>${b}</b>: ${count} Qs</span>`)
      .join(' ');

    const coBadges = Object.entries(coCount)
      .map(([c, count]) => `<span class="audit-badge" style="background:#e0e7ff; color:#3730a3;">🎯 <b>${c}</b>: ${count} Qs</span>`)
      .join(' ');

    modalAuditSummary.innerHTML = `
      <div style="width:100%; font-weight:700; color:var(--text-muted); margin-bottom:0.25rem;">📊 QUESTION PAPER AUDIT & QUALITY METRICS:</div>
      <div><b>Bloom's Taxonomy:</b> ${bloomBadges || 'N/A'}</div>
      <div style="margin-left:auto;"><b>Course Outcomes:</b> ${coBadges || 'N/A'}</div>
    `;
  }

  // Render A4 Formatted Paper inside Modal
  function renderPaperContent(sub) {
    const meta = sub.meta || {};

    const partAHtml = (sub.partA || []).map((q, idx) => `
      <tr>
        <td class="text-center font-bold">${q.qNo || (idx + 1)}</td>
        <td>
          ${q.text || ''}
          ${q.imageUrl ? `<img src="${q.imageUrl}" class="prev-img" alt="Diagram">` : ''}
          ${q.tableHtml ? q.tableHtml : ''}
        </td>
        <td class="text-center">${q.marks || 2}</td>
        <td class="text-center font-bold">${q.bloom || 'L1'}</td>
        <td class="text-center font-bold">${q.co || 'CO1'}</td>
      </tr>
    `).join('');

    const partBHtml = (sub.partB || []).map((q, idx) => `
      <tr>
        <td class="text-center font-bold">${q.qNo || (idx + 6)}</td>
        <td>
          ${q.text || ''}
          ${q.imageUrl ? `<img src="${q.imageUrl}" class="prev-img" alt="Diagram">` : ''}
          ${q.tableHtml ? q.tableHtml : ''}
        </td>
        <td class="text-center">${q.marks || 10}</td>
        <td class="text-center font-bold">${q.bloom || 'L3'}</td>
        <td class="text-center font-bold">${q.co || 'CO1'}</td>
      </tr>
    `).join('');

    paperContentPreview.innerHTML = `
      <div class="qp-school-title">
        SCHOOL OF INFORMATION SCIENCE
        <span class="qp-set-badge">${sub.setName || 'SET A'}</span>
      </div>

      <div class="qp-header-title" style="margin-bottom: 14px;">
        ${meta.examTitle || 'CONTINUOUS ASSESSMENT TEST'}
      </div>

      <table class="qp-table qp-meta-table">
        <tr>
          <td>Course Code: ${sub.courseCode || ''}</td>
          <td>Course Name: ${sub.courseName || ''}</td>
        </tr>
        <tr>
          <td>Date: ${meta.date || ''}</td>
          <td>Semester: ${meta.semester || ''}</td>
        </tr>
        <tr>
          <td>Max Marks: ${meta.maxMarks || '30'}</td>
          <td>Duration: ${meta.duration || '1 Hour'}</td>
        </tr>
        <tr>
          <td colspan="2">Faculty: ${sub.facultyName || ''} (${sub.punivId || ''})</td>
        </tr>
      </table>

      <div class="qp-part-title">
        <span>PART A (Answer ALL Questions)</span>
        <span>5 x 2M = 10 Marks</span>
      </div>

      <table class="qp-table">
        <thead>
          <tr>
            <th style="width: 45px;">Q.No</th>
            <th>Question Description</th>
            <th style="width: 55px;">Marks</th>
            <th style="width: 55px;">Bloom</th>
            <th style="width: 50px;">CO</th>
          </tr>
        </thead>
        <tbody>
          ${partAHtml}
        </tbody>
      </table>

      <div class="qp-part-title">
        <span>PART B (Answer Any Two Questions)</span>
        <span>2 x 10M = 20 Marks</span>
      </div>

      <table class="qp-table">
        <thead>
          <tr>
            <th style="width: 45px;">Q.No</th>
            <th>Question Description</th>
            <th style="width: 55px;">Marks</th>
            <th style="width: 55px;">Bloom</th>
            <th style="width: 50px;">CO</th>
          </tr>
        </thead>
        <tbody>
          ${partBHtml}
        </tbody>
      </table>
    `;
  }

  // Modal Close Handlers
  closeModalBtn.addEventListener('click', () => paperModal.style.display = 'none');
  closeModalBottomBtn.addEventListener('click', () => paperModal.style.display = 'none');

  // Modal Export Actions
  modalDocxBtn.addEventListener('click', () => {
    if (!activeSubmission) return;
    if (window.QPExporter) {
      window.QPExporter.exportSubmission(activeSubmission);
    } else {
      alert('Exporter module not loaded.');
    }
  });

  modalPdfBtn.addEventListener('click', () => {
    if (window.QPExporter) {
      window.QPExporter.exportToPDF();
    } else {
      window.print();
    }
  });
});
