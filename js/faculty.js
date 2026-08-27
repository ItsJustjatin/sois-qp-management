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
        `If the problem persists, contact the manager: <b>Mr. Jatin</b> ` +
        `(<a href="mailto:jatin@presidencyuniversity.in" style="color:inherit;">jatin@presidencyuniversity.in</a>).` +
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
});
