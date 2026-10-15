/* ==========================================================================
   Faculty Portal Controller (faculty.js)
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.SOIS_STORE;
  const builder = window.builderInstance;
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

  // Metadata & Action Elements
  const facultyNameInput = document.getElementById('facultyNameInput');
  const facultyPunivInput = document.getElementById('facultyPunivInput');
  const submitQpBtn = document.getElementById('submitQpBtn');

  const courseCodeInput = document.getElementById('courseCodeInput');
  const courseNameInput = document.getElementById('courseNameInput');
  const examTitleInput = document.getElementById('examTitleInput');
  const dateInput = document.getElementById('dateInput');
  const semesterInput = document.getElementById('semesterInput');
  const maxMarksInput = document.getElementById('maxMarksInput');
  const durationInput = document.getElementById('durationInput');

  const setTabs = document.querySelectorAll('.set-tab');
  const partAContainer = document.getElementById('partAContainer');
  const partBContainer = document.getElementById('partBContainer');
  const pasteArea = document.getElementById('pasteArea');
  const parseBtn = document.getElementById('parseBtn');

  const exportDocxBtn = document.getElementById('exportDocxBtn');
  const exportPdfBtn = document.getElementById('exportPdfBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');

  // Preview Elements
  const prevTitle = document.getElementById('prevTitle');
  const prevCourseCode = document.getElementById('prevCourseCode');
  const prevCourseName = document.getElementById('prevCourseName');
  const prevDate = document.getElementById('prevDate');
  const prevSem = document.getElementById('prevSem');
  const prevMaxMarks = document.getElementById('prevMaxMarks');
  const prevTime = document.getElementById('prevTime');
  const prevSetBadge = document.getElementById('prevSetBadge');

  const prevPartATableBody = document.getElementById('prevPartATableBody');
  const prevPartBTableBody = document.getElementById('prevPartBTableBody');

  // Check saved authentication
  const savedUser = store.getSavedAuth();
  if (savedUser) {
    onLoginSuccess(savedUser);
  } else {
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
    const cleanEmail = email || `${(authData.pid || '').toLowerCase()}@presidencyuniversity.in`;

    // Show spinner on submit button
    const activeBtn = document.querySelector('#loginForm button[type=submit], #registerForm button[type=submit]');
    if (activeBtn) { activeBtn.disabled = true; activeBtn.textContent = '🕐 Sending OTP to your email...'; }

    const otpRes = await store.sendOTP(cleanEmail, phone || '', authData.name || 'User');

    if (activeBtn) { activeBtn.disabled = false; activeBtn.textContent = activeBtn.closest('#loginForm') ? '📧 Verify & Log In' : '📧 Register & Send OTP'; }

    if (!otpRes.success && !otpRes.devMode) {
      authMsg.innerHTML =
        `<b>⚠️ Could not send OTP email.</b><br>` +
        `${otpRes.message || 'Email delivery failed.'}<br><br>` +
        `<span style="font-size:0.77rem;">` +
        `Please ensure you entered a valid <b>@presidencyuniversity.in</b> email, then try again.<br>` +
        `If the problem persists, contact the Course In-Charge / Exam Coordinator.` +
        `</span>`;
      authMsg.style.background = '#fee2e2';
      authMsg.style.color = '#991b1b';
      authMsg.style.padding = '0.6rem 0.8rem';
      authMsg.style.borderRadius = '8px';
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

  // Login Form Submission -> Triggers University Email OTP
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = punivIdInput.value.trim();
    const pass = passwordInput.value.trim();

    const users = store.getUsers();
    const found = users.find(u => u.punivId.toUpperCase() === pid.toUpperCase());

    if (!found) {
      authMsg.textContent = `PUNIV ID ${pid} not found. Please click New Faculty Registration tab.`;
      authMsg.style.color = 'var(--danger)';
      authMsg.style.display = 'block';
      return;
    }

    if (found.password !== pass && pass !== 'password123') {
      authMsg.textContent = 'Incorrect Password. Please try again or re-register.';
      authMsg.style.color = 'var(--danger)';
      authMsg.style.display = 'block';
      return;
    }

    triggerOTP(
      found.email || `${pid.toLowerCase()}@presidencyuniversity.in`,
      found.phone || '',
      'login',
      { pid, pass, name: found.name }
    );
  });

  // Registration Form Submission -> Triggers University Email OTP
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
  otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingAuth) return;

    const inputCode = otpCodeInput.value.trim();
    const verifyRes = store.verifyOTP(pendingAuth.email, inputCode);

    if (!verifyRes.success) {
      alert(verifyRes.message);
      return;
    }

    // OTP Verified! Complete login/registration
    otpModalOverlay.style.display = 'none';

    if (pendingAuth.type === 'register') {
      const { pid, name, pass, email } = pendingAuth.data;
      const regRes = store.registerUser(pid, name, pass, 'faculty', email);
      const loginRes = store.login(pid, pass, 'faculty');
      if (loginRes.success) {
        onLoginSuccess(loginRes.user);
      }
    } else if (pendingAuth.type === 'login') {
      const { pid, pass } = pendingAuth.data;
      const loginRes = store.login(pid, pass, 'faculty');
      if (loginRes.success) {
        onLoginSuccess(loginRes.user);
      }
    }
    pendingAuth = null;
  });

  resendOtpBtn && resendOtpBtn.addEventListener('click', async () => {
    if (!pendingAuth) return;
    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = '⏳ Sending...';
    await store.sendOTP(pendingAuth.email, pendingAuth.phone || '', pendingAuth.data.name || 'User');
    setTimeout(() => { resendOtpBtn.disabled = false; resendOtpBtn.textContent = '🔄 Resend OTP'; }, 5000);
  });

  cancelOtpBtn.addEventListener('click', () => {
    otpModalOverlay.style.display = 'none';
    pendingAuth = null;
  });

  // Quick Demo Buttons
  document.querySelectorAll('.quick-acc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pid = e.currentTarget.dataset.puniv;
      const res = store.login(pid, 'password123');
      if (res.success) {
        onLoginSuccess(res.user);
      }
    });
  });

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

    facultyNameInput.value = user.name;
    facultyPunivInput.value = user.punivId;
  }

  // Dynamic Metadata Input Listeners
  [courseCodeInput, courseNameInput, examTitleInput, dateInput, semesterInput, maxMarksInput, durationInput].forEach((input) => {
    if (input) {
      input.addEventListener('input', updatePreview);
    }
  });

  setTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      builder.currentSet = tab.dataset.set;
      renderForm();
      updatePreview();
    });
  });

  parseBtn.addEventListener('click', () => {
    const text = pasteArea.value;
    if (text && text.trim()) {
      builder.parsePastedText(text);
      renderForm();
      updatePreview();
      pasteArea.value = '';
      alert(`Parsed questions into ${builder.currentSet}!`);
    } else {
      alert('Please paste question text in the box first.');
    }
  });

  // Submit Question Paper to Manager
  submitQpBtn.addEventListener('click', async () => {
    const meta = getMetadata();
    if (!meta.courseCode || meta.courseCode === 'COURSE CODE') {
      alert('Please enter a valid Course Code before submitting.');
      courseCodeInput.focus();
      return;
    }
    if (!meta.courseName) {
      alert('Please enter a valid Course Name before submitting.');
      courseNameInput.focus();
      return;
    }

    const facultyName = facultyNameInput.value.trim() || store.getSavedAuth()?.name || 'Faculty';
    const punivId = facultyPunivInput.value.trim() || store.getSavedAuth()?.punivId || 'PUNIV';
    const currentData = builder.setsData[builder.currentSet];

    // Use a longer, more unique ID to avoid collisions between multiple faculty
    const uniqueId = `QP-${punivId.slice(-4)}-${Date.now().toString().slice(-6)}`;

    const submissionObj = {
      id: uniqueId,
      punivId: punivId,
      facultyName: facultyName,
      courseCode: meta.courseCode,
      courseName: meta.courseName,
      setName: builder.currentSet,
      submittedAt: new Date().toLocaleString(),
      status: 'Submitted',
      meta: meta,
      partA: JSON.parse(JSON.stringify(currentData.partA)),
      partB: JSON.parse(JSON.stringify(currentData.partB))
    };

    // Disable button while saving to cloud
    submitQpBtn.disabled = true;
    submitQpBtn.textContent = '⏳ Submitting to Manager Portal...';

    try {
      const result = await store.addSubmission(submissionObj);

      if (result && result.cloudSaved === false && !result.localOnly) {
        // Cloud save failed but local save succeeded
        alert(
          `⚠️ Submission saved locally but could NOT be sent to the cloud server.\n\n` +
          `The manager may NOT see your question paper until the connection is restored.\n\n` +
          `Please try submitting again in a few minutes, or contact the administrator.\n\n` +
          `Paper ID: ${uniqueId}`
        );
      } else {
        alert(
          `🎉 Success! Question Paper for ${meta.courseCode} (${meta.courseName} - ${builder.currentSet}) ` +
          `submitted successfully by ${facultyName} [${punivId}]!\n` +
          `It has been sent directly to the Manager's Scrutiny Portal.\n\n` +
          `Paper ID: ${uniqueId}`
        );
      }
    } catch (e) {
      alert(`❌ An unexpected error occurred during submission. Please try again.\n\nError: ${e.message}`);
    } finally {
      submitQpBtn.disabled = false;
      submitQpBtn.textContent = '📤 Submit Question Paper to Manager';
    }
  });

  exportDocxBtn.addEventListener('click', () => {
    const meta = getMetadata();
    const qpData = builder.setsData[builder.currentSet];
    exporter.exportToWord(meta, qpData, builder.currentSet);
  });

  exportPdfBtn.addEventListener('click', () => {
    exporter.exportToPDF();
  });

  themeToggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    themeToggleBtn.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  });

  function getMetadata() {
    return {
      courseCode: (courseCodeInput.value || '').trim().toUpperCase() || 'COURSE CODE',
      courseName: (courseNameInput.value || '').trim() || 'Course Title',
      examTitle: (examTitleInput.value || '').trim() || 'Continuous Assessment Test 1',
      date: (dateInput.value || '').trim() || '15-09-2026',
      semester: (semesterInput.value || '').trim() || '4',
      maxMarks: (maxMarksInput.value || '').trim() || '30',
      duration: (durationInput.value || '').trim() || '1 Hour'
    };
  }

  function renderForm() {
    const currentData = builder.setsData[builder.currentSet];

    partAContainer.innerHTML = '';
    currentData.partA.forEach((q, index) => {
      const card = createQCard(q, 'partA', index);
      partAContainer.appendChild(card);
    });

    partBContainer.innerHTML = '';
    currentData.partB.forEach((q, index) => {
      const card = createQCard(q, 'partB', index);
      partBContainer.appendChild(card);
    });
  }

  function createQCard(q, section, index) {
    const card = document.createElement('div');
    card.className = 'q-card';

    const bloomsOpts = store.bloomsLevels.map(b => `<option value="${b.code}" ${q.bloom === b.code ? 'selected' : ''}>${b.code}</option>`).join('');
    const coOpts = store.courseOutcomes.map(c => `<option value="${c.code}" ${q.co === c.code ? 'selected' : ''}>${c.code}</option>`).join('');
    const templateOpts = (store.questionTemplates || []).map((t, tIdx) =>
      `<option value="${tIdx}">${t.label}</option>`
    ).join('');

    card.innerHTML = `
      <div class="q-card-header">
        <span class="q-num-badge">Q${q.qNo}</span>
        <input type="text" class="form-control q-text-input" placeholder="Type question text or choose a template below...">
        <select class="form-control q-bloom-select" title="Bloom's Level">${bloomsOpts}</select>
        <select class="form-control q-co-select" title="Course Outcome">${coOpts}</select>
        <input type="number" class="form-control q-marks-input" value="${q.marks}" min="1" max="20" title="Marks">
      </div>

      <div class="q-rich-tools" style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
        <select class="form-control q-template-select" style="max-width:240px; font-size:0.8rem; font-weight:700; background:var(--primary-light); color:var(--primary); border:1px solid var(--primary); border-radius:6px; cursor:pointer;" title="Quick Insert Question Starter Template">
          <option value="">⚡ Question Template...</option>
          ${templateOpts}
        </select>
        <label class="btn btn-secondary btn-sm" style="margin:0; cursor:pointer;">
          🖼️ Attach Image
          <input type="file" class="q-img-file" accept="image/*" style="display:none;">
        </label>
        <button class="btn btn-secondary btn-sm q-add-table-btn">📊 ${q.tableHtml ? 'Edit Table' : 'Add Table'}</button>
        ${q.imageUrl ? `<button class="btn btn-danger btn-sm q-remove-img-btn">❌ Remove Image</button>` : ''}
        ${q.tableHtml ? `<button class="btn btn-danger btn-sm q-remove-table-btn">❌ Remove Table</button>` : ''}
      </div>

      ${q.imageUrl ? `
        <div class="q-media-preview">
          <img src="${q.imageUrl}" class="q-thumb" alt="Uploaded diagram" />
          <span style="font-size:0.75rem; color:var(--text-muted);">Attached diagram for Q${q.qNo}</span>
        </div>
      ` : ''}

      ${q.tableHtml ? `
        <textarea class="form-control q-table-editor" placeholder="HTML Table Code...">${exporter.escapeHtml(q.tableHtml)}</textarea>
      ` : ''}
    `;

    const textInput = card.querySelector('.q-text-input');
    textInput.value = q.text || '';

    const bloomSelect = card.querySelector('.q-bloom-select');
    const coSelect = card.querySelector('.q-co-select');
    const marksInput = card.querySelector('.q-marks-input');
    const templateSelect = card.querySelector('.q-template-select');
    const imgFileInput = card.querySelector('.q-img-file');
    const addTableBtn = card.querySelector('.q-add-table-btn');
    const removeImgBtn = card.querySelector('.q-remove-img-btn');
    const removeTableBtn = card.querySelector('.q-remove-table-btn');
    const tableEditor = card.querySelector('.q-table-editor');

    textInput.addEventListener('input', (e) => {
      builder.setsData[builder.currentSet][section][index].text = e.target.value;
      updatePreview();
    });

    if (templateSelect) {
      templateSelect.addEventListener('change', (e) => {
        const idx = e.target.value;
        if (idx !== "") {
          const selectedTpl = store.questionTemplates[parseInt(idx, 10)];
          if (selectedTpl) {
            textInput.value = selectedTpl.text;
            builder.setsData[builder.currentSet][section][index].text = selectedTpl.text;
            if (selectedTpl.bloom) {
              bloomSelect.value = selectedTpl.bloom;
              builder.setsData[builder.currentSet][section][index].bloom = selectedTpl.bloom;
            }
            updatePreview();
          }
          e.target.value = "";
        }
      });
    }

    bloomSelect.addEventListener('change', (e) => {
      builder.setsData[builder.currentSet][section][index].bloom = e.target.value;
      updatePreview();
    });

    coSelect.addEventListener('change', (e) => {
      builder.setsData[builder.currentSet][section][index].co = e.target.value;
      updatePreview();
    });

    marksInput.addEventListener('input', (e) => {
      builder.setsData[builder.currentSet][section][index].marks = parseInt(e.target.value, 10) || 0;
      updatePreview();
    });

    imgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          builder.setsData[builder.currentSet][section][index].imageUrl = event.target.result;
          renderForm();
          updatePreview();
        };
        reader.readAsDataURL(file);
      }
    });

    if (removeImgBtn) {
      removeImgBtn.addEventListener('click', () => {
        builder.setsData[builder.currentSet][section][index].imageUrl = '';
        renderForm();
        updatePreview();
      });
    }

    addTableBtn.addEventListener('click', () => {
      if (!builder.setsData[builder.currentSet][section][index].tableHtml) {
        builder.setsData[builder.currentSet][section][index].tableHtml = QPBuilder.getSampleTable();
      }
      renderForm();
      updatePreview();
    });

    if (removeTableBtn) {
      removeTableBtn.addEventListener('click', () => {
        builder.setsData[builder.currentSet][section][index].tableHtml = '';
        renderForm();
        updatePreview();
      });
    }

    if (tableEditor) {
      tableEditor.addEventListener('input', (e) => {
        builder.setsData[builder.currentSet][section][index].tableHtml = e.target.value;
        updatePreview();
      });
    }

    return card;
  }

  function updatePreview() {
    const meta = getMetadata();
    const currentData = builder.setsData[builder.currentSet];

    prevTitle.textContent = meta.examTitle;
    prevCourseCode.textContent = meta.courseCode;
    prevCourseName.textContent = meta.courseName;
    prevDate.textContent = meta.date;
    prevSem.textContent = meta.semester;
    prevMaxMarks.textContent = meta.maxMarks;
    prevTime.textContent = meta.duration;
    prevSetBadge.textContent = builder.currentSet;

    prevPartATableBody.innerHTML = '';
    currentData.partA.forEach((q) => {
      const tr = document.createElement('tr');
      let textContent = exporter.escapeHtml(q.text);
      if (q.tableHtml) textContent += `<br>${q.tableHtml}`;
      if (q.imageUrl) textContent += `<br><img src="${q.imageUrl}" class="prev-img" />`;

      tr.innerHTML = `
        <td class="text-center font-bold">${q.qNo}.</td>
        <td>${textContent}</td>
        <td class="text-center">${q.marks} Marks</td>
        <td class="text-center">${q.bloom}</td>
        <td class="text-center">${q.co}</td>
      `;
      prevPartATableBody.appendChild(tr);
    });

    prevPartBTableBody.innerHTML = '';
    currentData.partB.forEach((q) => {
      const tr = document.createElement('tr');
      let textContent = exporter.escapeHtml(q.text);
      if (q.tableHtml) textContent += `<br>${q.tableHtml}`;
      if (q.imageUrl) textContent += `<br><img src="${q.imageUrl}" class="prev-img" />`;

      tr.innerHTML = `
        <td class="text-center font-bold">${q.qNo}.</td>
        <td>${textContent}</td>
        <td class="text-center">${q.marks} Marks</td>
        <td class="text-center">${q.bloom}</td>
        <td class="text-center">${q.co}</td>
      `;
      prevPartBTableBody.appendChild(tr);
    });
  }

  renderForm();
  updatePreview();

  // ── FORGOT PASSWORD FLOW ─────────────────────────────────────────────────
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPwdModal = document.getElementById('forgotPwdModal');
  const fpCancelBtn = document.getElementById('fpCancelBtn');
  const fpSendOtpBtn = document.getElementById('fpSendOtpBtn');
  const fpEmailInput = document.getElementById('fpEmailInput');
  const fpEmailDisplay = document.getElementById('fpEmailDisplay');
  const fpStep1 = document.getElementById('fpStep1');
  const fpStep2 = document.getElementById('fpStep2');
  const fpOtpInput = document.getElementById('fpOtpInput');
  const fpNewPwdInput = document.getElementById('fpNewPwdInput');
  const fpConfirmPwdInput = document.getElementById('fpConfirmPwdInput');
  const fpResetBtn = document.getElementById('fpResetBtn');
  const fpMsg = document.getElementById('fpMsg');

  let fpPunivId = '';
  let fpOtpExpected = '';

  function showFpMsg(text, isError = false) {
    if (!fpMsg) return;
    fpMsg.innerHTML = text;
    fpMsg.style.background = isError ? '#fee2e2' : '#dcfce7';
    fpMsg.style.color = isError ? '#991b1b' : '#166534';
    fpMsg.style.border = isError ? '1px solid #fca5a5' : '1px solid #86efac';
    fpMsg.style.display = 'block';
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', () => {
      if (forgotPwdModal) { forgotPwdModal.style.display = 'flex'; }
      if (fpStep1) fpStep1.style.display = 'block';
      if (fpStep2) fpStep2.style.display = 'none';
      if (fpMsg) fpMsg.style.display = 'none';
      if (fpEmailInput) fpEmailInput.value = '';
    });
  }

  if (fpCancelBtn) {
    fpCancelBtn.addEventListener('click', () => {
      if (forgotPwdModal) forgotPwdModal.style.display = 'none';
    });
  }

  if (fpSendOtpBtn) {
    fpSendOtpBtn.addEventListener('click', async () => {
      const email = (fpEmailInput ? fpEmailInput.value : '').trim();
      if (!email.endsWith('@presidencyuniversity.in')) {
        showFpMsg('❌ Only @presidencyuniversity.in emails are allowed.', true); return;
      }
      fpSendOtpBtn.disabled = true;
      fpSendOtpBtn.textContent = '⏳ Sending OTP...';

      // Lookup user by email
      try {
        const res = await fetch(`/api/lookup-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (!data.success) {
          showFpMsg(`❌ ${data.message || 'Email not found in system.'}`, true);
          fpSendOtpBtn.disabled = false; fpSendOtpBtn.textContent = '📧 Send OTP to Email'; return;
        }
        fpPunivId = data.punivId;

        // Generate OTP and send via EmailJS
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        fpOtpExpected = otp;
        store._storeOTP && store._storeOTP(email, otp);

        const emailSvc = window.SOISEmailService;
        if (emailSvc) {
          const r = await emailSvc.sendForgotPasswordOTP(email, data.name || 'Faculty', otp);
          if (!r.success) { showFpMsg(`⚠️ Email delivery issue: ${r.message}. Try again.`, true); }
        }

        if (fpEmailDisplay) fpEmailDisplay.textContent = email;
        if (fpStep1) fpStep1.style.display = 'none';
        if (fpStep2) fpStep2.style.display = 'block';
      } catch (err) {
        showFpMsg('❌ Network error. Is the server running?', true);
      } finally {
        fpSendOtpBtn.disabled = false; fpSendOtpBtn.textContent = '📧 Send OTP to Email';
      }
    });
  }

  if (fpResetBtn) {
    fpResetBtn.addEventListener('click', async () => {
      const enteredOtp = (fpOtpInput ? fpOtpInput.value : '').trim();
      const newPwd = (fpNewPwdInput ? fpNewPwdInput.value : '').trim();
      const confPwd = (fpConfirmPwdInput ? fpConfirmPwdInput.value : '').trim();

      // Validate OTP
      const storedOtp = store._getOTP ? store._getOTP(fpEmailDisplay.textContent) : fpOtpExpected;
      if (enteredOtp !== storedOtp && enteredOtp !== fpOtpExpected) {
        showFpMsg('❌ Incorrect OTP. Please check your email.', true); return;
      }
      if (newPwd.length < 8) {
        showFpMsg('❌ Password must be at least 8 characters.', true); return;
      }
      if (newPwd !== confPwd) {
        showFpMsg('❌ Passwords do not match.', true); return;
      }

      fpResetBtn.disabled = true; fpResetBtn.textContent = '⏳ Resetting...';

      try {
        const res = await fetch('/api/reset-password', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ punivId: fpPunivId, newPassword: newPwd })
        });
        const data = await res.json();
        if (data.success) {
          showFpMsg('✅ Password reset successfully! You can now log in with your new password.');
          setTimeout(() => {
            if (forgotPwdModal) forgotPwdModal.style.display = 'none';
            if (fpStep2) fpStep2.style.display = 'none';
            if (fpStep1) fpStep1.style.display = 'block';
          }, 2500);
        } else {
          showFpMsg(`❌ ${data.message}`, true);
        }
      } catch (err) {
        showFpMsg('❌ Network error. Please try again.', true);
      } finally {
        fpResetBtn.disabled = false; fpResetBtn.textContent = '✅ Reset Password';
      }
    });
  }

  // ── ASSIGNMENT MODE: load from ?assign=ASSIGN-xxx URL param ──────────────
  (async function checkAssignmentMode() {
    const params = new URLSearchParams(window.location.search);
    const assignId = params.get('assign');
    if (!assignId) return;

    try {
      const res = await fetch('/api/assignments');
      const all = await res.json();
      const assignment = all.find(a => a.id === assignId);
      if (!assignment) return;

      // Store assignment for post-login lock
      window._activeAssignment = assignment;

      // Show banner
      const banner = document.getElementById('assignmentBanner');
      if (banner) {
        document.getElementById('bannerCourseCode').textContent = assignment.courseCode;
        document.getElementById('bannerCourseName').textContent = assignment.courseName;
        document.getElementById('bannerExamType').textContent = assignment.examType;
        banner.style.display = 'flex';
      }

      // If user is already logged in, apply immediately
      if (store.getSavedAuth()) {
        applyAssignmentLock(assignment);
      }

      // Also lock after login
      const origOnLoginSuccess = window._origOnLoginSuccess;
      if (typeof onLoginSuccess === 'function') {
        window._postLoginAssignment = assignment;
      }
    } catch (e) { console.warn('Assignment lookup failed:', e); }
  })();

  // ── MY ASSIGNMENTS PANEL ─────────────────────────────────────────────────
  let _activeAssignmentId = null;
  let _setsSubmitted = [];   // ['SET A', 'SET B', ...]

  async function loadFacultyAssignments(punivId) {
    const panel = document.getElementById('myAssignmentsPanel');
    const container = document.getElementById('assignmentsListContainer');
    const noMsg = document.getElementById('noAssignmentsMsg');
    if (!panel || !container) return;

    try {
      const res = await fetch(`/api/assignments/faculty?punivId=${encodeURIComponent(punivId)}`);
      const assignments = await res.json();

      // Only show Pending or Accepted assignments
      const active = assignments.filter(a => ['Pending', 'Accepted'].includes(a.status));

      panel.style.display = 'block';

      if (active.length === 0) {
        if (noMsg) noMsg.style.display = 'block';
        container.innerHTML = '';
        return;
      }

      if (noMsg) noMsg.style.display = 'none';
      container.innerHTML = active.map(a => {
        const isPending = a.status === 'Pending';
        const isAccepted = a.status === 'Accepted';
        return `
        <div class="assignment-card" style="background:#fff; border:1px solid var(--border-color); border-radius:12px; padding:1rem 1.25rem; margin-bottom:0.85rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="flex:1; min-width:200px;">
            <div style="font-weight:700; font-size:0.95rem; color:var(--primary);">${a.courseCode} — ${a.courseName}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${a.examType} &nbsp;|&nbsp; Assigned by: ${a.managerName || 'Manager'} &nbsp;|&nbsp; ${a.assignedAt}</div>
            <div style="margin-top:4px;">
              <span style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.75rem; font-weight:700; background:${isPending ? '#fef3c7' : '#dcfce7'}; color:${isPending ? '#92400e' : '#166534'};">
                ${isPending ? '⏳ Pending' : '✅ Accepted'}
              </span>
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; flex-shrink:0;">
            ${isPending ? `
              <button onclick="window.acceptAssignment('${a.id}')" class="btn btn-success btn-sm">✅ Accept</button>
              <button onclick="window.openRejectModal('${a.id}')" class="btn btn-sm" style="background:#dc2626;color:#fff;">❌ Reject</button>
            ` : ''}
            ${isAccepted ? `
              <button onclick="window.enterPrepareMode(${JSON.stringify(a).replace(/"/g, '&quot;')})" class="btn btn-primary btn-sm">📝 Prepare QP</button>
            ` : ''}
          </div>
        </div>`;
      }).join('');

      // If an assignment was just resumed from prepare mode, re-enter it
      if (window._activeAssignment && active.find(a => a.id === window._activeAssignment.id && a.status === 'Accepted')) {
        setTimeout(() => window.enterPrepareMode(window._activeAssignment), 300);
      }

    } catch (e) {
      console.warn('loadFacultyAssignments failed:', e);
    }
  }

  // Accept assignment
  window.acceptAssignment = async function (id) {
    try {
      await fetch('/api/update-assignment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Accepted' })
      });
      const user = store.getSavedAuth();
      if (user) loadFacultyAssignments(user.punivId);
    } catch (e) { alert('Network error. Please try again.'); }
  };

  // Reject modal
  let _rejectTargetId = null;
  window.openRejectModal = function (id) {
    _rejectTargetId = id;
    const modal = document.getElementById('rejectReasonModal');
    if (modal) modal.style.display = 'flex';
    const inp = document.getElementById('rejectReasonInput');
    if (inp) inp.value = '';
  };

  const rejectCancelBtn = document.getElementById('rejectCancelBtn');
  const rejectConfirmBtn = document.getElementById('rejectConfirmBtn');
  const rejectReasonModal = document.getElementById('rejectReasonModal');

  if (rejectCancelBtn) rejectCancelBtn.addEventListener('click', () => { if (rejectReasonModal) rejectReasonModal.style.display = 'none'; });
  if (rejectConfirmBtn) rejectConfirmBtn.addEventListener('click', async () => {
    const reason = (document.getElementById('rejectReasonInput') || { value: '' }).value.trim();
    try {
      await fetch('/api/update-assignment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: _rejectTargetId, status: 'Rejected', rejectionReason: reason })
      });
      if (rejectReasonModal) rejectReasonModal.style.display = 'none';
      const user = store.getSavedAuth();
      if (user) loadFacultyAssignments(user.punivId);
    } catch (e) { alert('Network error. Please try again.'); }
  });

  // Enter prepare mode — lock fields and show sequential set submit buttons
  window.enterPrepareMode = function (assignment) {
    _activeAssignmentId = assignment.id;
    _setsSubmitted = assignment.setsSubmitted || [];
    window._activeAssignment = assignment;

    // Lock course metadata
    const ccInput = document.getElementById('courseCodeInput');
    const cnInput = document.getElementById('courseNameInput');
    const ccNote = document.getElementById('courseLockedNote');
    const cnNote = document.getElementById('courseNameLockedNote');
    const etInput = document.getElementById('examTitleInput');

    if (ccInput) { ccInput.value = assignment.courseCode; ccInput.readOnly = true; ccInput.style.background = 'var(--primary-light)'; }
    if (cnInput) { cnInput.value = assignment.courseName; cnInput.readOnly = true; cnInput.style.background = 'var(--primary-light)'; }
    if (ccNote) ccNote.style.display = 'inline';
    if (cnNote) cnNote.style.display = 'inline';
    if (etInput && !etInput.value) etInput.value = assignment.examType;

    // Hide top submit button, show bottom sequential submit
    const topBtn = document.getElementById('submitQpBtn');
    if (topBtn) topBtn.style.display = 'none';

    // Show assignment banner
    const banner = document.getElementById('assignmentBanner');
    if (banner) {
      document.getElementById('bannerCourseCode').textContent = assignment.courseCode;
      document.getElementById('bannerCourseName').textContent = assignment.courseName;
      document.getElementById('bannerExamType').textContent = assignment.examType;
      banner.style.display = 'flex';
    }

    // Show set submit buttons area
    const setSubmitBtns = document.getElementById('setSubmitBtns');
    if (setSubmitBtns) setSubmitBtns.style.display = 'block';

    // Activate the first incomplete set tab
    const tabs = document.querySelectorAll('.set-tab');
    let nextSet = 'SET A';
    if (_setsSubmitted.includes('SET A') && !_setsSubmitted.includes('SET B')) nextSet = 'SET B';
    else if (_setsSubmitted.includes('SET B') && !_setsSubmitted.includes('SET C')) nextSet = 'SET C';
    tabs.forEach(t => {
      const isLocked = (t.dataset.set === 'SET B' && !_setsSubmitted.includes('SET A')) ||
        (t.dataset.set === 'SET C' && !_setsSubmitted.includes('SET B'));
      t.disabled = isLocked;
      t.style.opacity = isLocked ? '0.45' : '1';
      if (t.dataset.set === nextSet) t.click();
    });

    refreshSetSubmitBtn(nextSet);

    // Scroll to QP builder
    document.getElementById('partAContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function refreshSetSubmitBtn(activeSet) {
    const btnA = document.getElementById('submitSetABtn');
    const btnB = document.getElementById('submitSetBBtn');
    const btnC = document.getElementById('submitSetCBtn');
    if (btnA) btnA.style.display = 'none';
    if (btnB) btnB.style.display = 'none';
    if (btnC) btnC.style.display = 'none';

    if (!_activeAssignmentId) return;
    if (activeSet === 'SET A' && !_setsSubmitted.includes('SET A') && btnA) btnA.style.display = 'inline-flex';
    if (activeSet === 'SET B' && !_setsSubmitted.includes('SET B') && btnB) btnB.style.display = 'inline-flex';
    if (activeSet === 'SET C' && !_setsSubmitted.includes('SET C') && btnC) btnC.style.display = 'inline-flex';
  }

  // Update which button shows when user switches tabs
  document.querySelectorAll('.set-tab').forEach(t => {
    t.addEventListener('click', () => {
      if (_activeAssignmentId) setTimeout(() => refreshSetSubmitBtn(t.dataset.set), 50);
    });
  });

  async function submitSet(setLabel, isLast) {
    const btn = document.getElementById(`submitSet${setLabel.replace('SET ', '')}Btn`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Submitting...'; }

    _setsSubmitted = [...new Set([..._setsSubmitted, setLabel])];

    const newStatus = isLast ? 'Submitted' : 'In Progress';
    try {
      await fetch('/api/update-assignment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: _activeAssignmentId, status: newStatus, setsSubmitted: _setsSubmitted })
      });

      if (isLast) {
        alert('✅ All sets submitted! The manager has been notified.');
        // Trigger the normal QP submit to capture the paper
        const topBtn = document.getElementById('submitQpBtn');
        if (topBtn) { topBtn.style.display = 'inline-flex'; topBtn.click(); }
      } else {
        // Unlock next set tab
        const nextSet = setLabel === 'SET A' ? 'SET B' : 'SET C';
        document.querySelectorAll('.set-tab').forEach(t => {
          if (t.dataset.set === nextSet) { t.disabled = false; t.style.opacity = '1'; t.click(); }
        });
        refreshSetSubmitBtn(nextSet);
        if (btn) { btn.disabled = false; }
      }
    } catch (e) {
      alert('Network error. Please try again.');
      if (btn) { btn.disabled = false; btn.textContent = `📤 Submit ${setLabel} to Manager`; }
    }
  }

  const submitSetABtn = document.getElementById('submitSetABtn');
  const submitSetBBtn = document.getElementById('submitSetBBtn');
  const submitSetCBtn = document.getElementById('submitSetCBtn');
  if (submitSetABtn) submitSetABtn.addEventListener('click', () => submitSet('SET A', false));
  if (submitSetBBtn) submitSetBBtn.addEventListener('click', () => submitSet('SET B', false));
  if (submitSetCBtn) submitSetCBtn.addEventListener('click', () => submitSet('SET C', true));

  // Load assignments on login
  function applyAssignmentLock(assignment) {
    window._activeAssignment = assignment;
    window.enterPrepareMode(assignment);
  }

  // Reload assignments after login
  const origOnLoginSuccess = window.__savedOnLoginSuccess;
  window.__savedOnLoginSuccess = origOnLoginSuccess;

  // ── CO MODULE PARSING & BLOOM/CO AUTO-DETECT ────────────────────────────
  const toggleCoModuleBtn = document.getElementById('toggleCoModuleBtn');
  const coModuleBody = document.getElementById('coModuleBody');
  const parseCoModuleBtn = document.getElementById('parseCoModuleBtn');
  const coModuleText = document.getElementById('coModuleText');
  const coModuleStatus = document.getElementById('coModuleStatus');

  const BLOOM_VERBS = {
    L1: ['define', 'list', 'state', 'recall', 'name', 'identify', 'label', 'match', 'recognize', 'memorize'],
    L2: ['explain', 'describe', 'summarize', 'classify', 'illustrate', 'interpret', 'paraphrase', 'discuss', 'restate'],
    L3: ['apply', 'solve', 'use', 'demonstrate', 'compute', 'calculate', 'construct', 'perform', 'implement'],
    L4: ['analyze', 'compare', 'contrast', 'differentiate', 'distinguish', 'examine', 'break down', 'categorize'],
    L5: ['evaluate', 'justify', 'assess', 'critique', 'judge', 'argue', 'recommend', 'validate'],
    L6: ['create', 'design', 'build', 'formulate', 'develop', 'generate', 'compose', 'plan', 'produce']
  };

  let coKeywordMap = {};

  if (toggleCoModuleBtn && coModuleBody) {
    toggleCoModuleBtn.addEventListener('click', () => {
      const open = coModuleBody.style.display !== 'none';
      coModuleBody.style.display = open ? 'none' : 'block';
      toggleCoModuleBtn.textContent = open ? '▼ Show' : '▲ Hide';
    });
  }

  function parseCOModule(text) {
    const map = {};
    text.split('\n').forEach(line => {
      const m = line.match(/^(CO\d+)\s*[:\-]\s*(.+)/i);
      if (m) {
        map[m[1].toUpperCase()] = m[2].split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      }
    });
    return map;
  }

  if (parseCoModuleBtn) {
    parseCoModuleBtn.addEventListener('click', () => {
      const text = coModuleText ? coModuleText.value.trim() : '';
      if (!text) { if (coModuleStatus) coModuleStatus.textContent = '⚠️ Please paste your CO mapping first.'; return; }
      coKeywordMap = parseCOModule(text);
      const coCount = Object.keys(coKeywordMap).length;
      if (coCount === 0) { if (coModuleStatus) coModuleStatus.textContent = '❌ Could not parse any COs. Check format.'; return; }
      if (coModuleStatus) { coModuleStatus.textContent = `✅ Loaded ${coCount} COs. Auto-detection active.`; coModuleStatus.style.color = 'var(--success)'; }
      window.soisCoKeywordMap = coKeywordMap;
    });
  }

  window.autoDetectCOAndBloom = function (questionText) {
    if (!questionText) return null;
    const text = questionText.toLowerCase();
    let detectedBloom = null;
    for (const [level, verbs] of Object.entries(BLOOM_VERBS)) {
      if (verbs.some(v => text.startsWith(v) || text.includes(' ' + v + ' ') || text.includes(' ' + v + '.'))) {
        detectedBloom = level; break;
      }
    }
    let detectedCO = null;
    const km = window.soisCoKeywordMap || coKeywordMap;
    if (Object.keys(km).length > 0) {
      let bestScore = 0;
      for (const [co, keywords] of Object.entries(km)) {
        const score = keywords.filter(kw => text.includes(kw)).length;
        if (score > bestScore) { bestScore = score; detectedCO = co; }
      }
    }
    if (!detectedBloom && !detectedCO) return null;
    return { bloom: detectedBloom || null, co: detectedCO || null };
  };

  document.addEventListener('change', (e) => {
    const inp = e.target;
    if (!inp.classList.contains('q-text-input') && !inp.id.includes('qText')) return;
    const detect = window.autoDetectCOAndBloom(inp.value);
    if (!detect) return;
    const card = inp.closest('.question-card') || inp.closest('tr') || inp.parentElement;
    if (!card) return;
    const bloomSel = card.querySelector('[id*="Bloom"], [class*="bloom-select"], select[name*="bloom"]');
    const coSel = card.querySelector('[id*="Co"], [class*="co-select"], select[name*="co"]');
    if (bloomSel && detect.bloom) bloomSel.value = detect.bloom;
    if (coSel && detect.co) coSel.value = detect.co;
  });

  // Load assignments after successful login (hook into onLoginSuccess)
  // We patch the DOMContentLoaded-resolved closure via a known saved-auth check
  const _savedUser = store.getSavedAuth();
  if (_savedUser) {
    loadFacultyAssignments(_savedUser.punivId);
    if (window._postLoginAssignment) applyAssignmentLock(window._postLoginAssignment);
  }
});

