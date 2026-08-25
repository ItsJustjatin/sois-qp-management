/* ==========================================================================
   SOIS Question Paper Main Controller, Authentication & Manager Portal
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.SOIS_STORE;
  const builder = window.builderInstance;
  const exporter = window.QPExporter;

  // Authentication DOM Elements
  const authOverlay = document.getElementById('authOverlay');
  const loginForm = document.getElementById('loginForm');
  const punivIdInput = document.getElementById('punivIdInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginErrorMsg = document.getElementById('loginErrorMsg');

  // Header & User Profile Elements
  const userProfileBadge = document.getElementById('userProfileBadge');
  const userDisplayName = document.getElementById('userDisplayName');
  const userRoleTag = document.getElementById('userRoleTag');
  const logoutBtn = document.getElementById('logoutBtn');

  // Navigation & Role Elements
  const roleFacultyBtn = document.getElementById('roleFacultyBtn');
  const roleAdminBtn = document.getElementById('roleAdminBtn');
  const facultyView = document.getElementById('facultyView');
  const adminDashboardView = document.getElementById('adminDashboardView');
  const previewPanel = document.getElementById('previewPanel');

  const facultyNameInput = document.getElementById('facultyNameInput');
  const facultyPunivInput = document.getElementById('facultyPunivInput');
  const submitQpBtn = document.getElementById('submitQpBtn');

  // Metadata Elements
  const courseSelect = document.getElementById('courseSelect');
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

  // Dashboard Elements
  const totalSubsEl = document.getElementById('totalSubsEl');
  const pendingReviewEl = document.getElementById('pendingReviewEl');
  const approvedSubsEl = document.getElementById('approvedSubsEl');
  const submissionsTableBody = document.getElementById('submissionsTableBody');
  const statusFilterSelect = document.getElementById('statusFilterSelect');

  // Populate Course Dropdown
  store.courses.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = `${c.code} - ${c.name}`;
    courseSelect.appendChild(opt);
  });

  dateInput.value = '15-09-2026';

  // Check saved authentication
  const savedUser = store.getSavedAuth();
  if (savedUser) {
    onLoginSuccess(savedUser);
  } else {
    authOverlay.style.display = 'flex';
  }

  // Handle Form Submission Login
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pid = punivIdInput.value.trim();
    const pass = passwordInput.value.trim();

    const res = store.login(pid, pass);
    if (res.success) {
      onLoginSuccess(res.user);
    } else {
      loginErrorMsg.textContent = res.message;
      loginErrorMsg.style.display = 'block';
    }
  });

  // Quick Login Buttons Handlers
  document.querySelectorAll('.quick-acc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const pid = target.dataset.puniv;
      const res = store.login(pid, 'password123');
      if (res.success) {
        onLoginSuccess(res.user);
      }
    });
  });

  // Logout Handler
  logoutBtn.addEventListener('click', () => {
    store.logout();
    authOverlay.style.display = 'flex';
    userProfileBadge.style.display = 'none';
  });

  function onLoginSuccess(user) {
    authOverlay.style.display = 'none';
    loginErrorMsg.style.display = 'none';

    userDisplayName.textContent = `${user.name} (${user.punivId})`;
    userRoleTag.textContent = user.role.toUpperCase();
    userRoleTag.className = `user-role-tag ${user.role === 'manager' ? 'role-manager-tag' : 'role-faculty-tag'}`;
    userProfileBadge.style.display = 'flex';

    if (user.role === 'manager') {
      roleAdminBtn.click();
    } else {
      roleFacultyBtn.click();
      facultyNameInput.value = user.name;
      facultyPunivInput.value = user.punivId;
    }
  }

  // Handle Role Switcher Buttons
  roleFacultyBtn.addEventListener('click', () => {
    roleFacultyBtn.classList.add('active');
    roleAdminBtn.classList.remove('active');
    facultyView.style.display = 'block';
    adminDashboardView.style.display = 'none';
    previewPanel.style.display = 'block';
  });

  roleAdminBtn.addEventListener('click', () => {
    roleAdminBtn.classList.add('active');
    roleFacultyBtn.classList.remove('active');
    facultyView.style.display = 'none';
    adminDashboardView.style.display = 'block';
    renderDashboard();
  });

  // Course Select Listener
  courseSelect.addEventListener('change', (e) => {
    const selected = store.courses.find(c => c.code === e.target.value);
    if (selected) {
      courseNameInput.value = selected.name;
      semesterInput.value = selected.semester;
      maxMarksInput.value = selected.maxMarks;
      durationInput.value = selected.duration;

      if (store.questionBank[selected.code]) {
        const qb = store.questionBank[selected.code];
        builder.setsData['SET A'].partA = qb.partA.map((q, idx) => ({ qNo: idx + 1, text: q.text, marks: 2, bloom: q.bloom, co: q.co, imageUrl: q.imageUrl || '', tableHtml: q.tableHtml || '' }));
        builder.setsData['SET A'].partB = qb.partB.map((q, idx) => ({ qNo: idx + 6, text: q.text, marks: q.marks || 10, bloom: q.bloom, co: q.co, imageUrl: q.imageUrl || '', tableHtml: q.tableHtml || '' }));
      }
      renderForm();
      updatePreview();
    }
  });

  [examTitleInput, dateInput, semesterInput, maxMarksInput, durationInput].forEach((input) => {
    input.addEventListener('input', updatePreview);
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

  // Submit Question Paper Action
  submitQpBtn.addEventListener('click', () => {
    const meta = getMetadata();
    const facultyName = facultyNameInput.value.trim() || store.currentUser?.name || 'Faculty';
    const punivId = facultyPunivInput.value.trim() || store.currentUser?.punivId || 'PUNIV';
    const currentData = builder.setsData[builder.currentSet];

    const submissionObj = {
      id: `QP-${Date.now().toString().slice(-4)}`,
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

    store.addSubmission(submissionObj);
    alert(`🎉 Question Paper for ${meta.courseCode} (${builder.currentSet}) submitted successfully by ${facultyName} [${punivId}]!\nIt is now available on the Manager Dashboard.`);
    renderDashboard();
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
      courseCode: courseSelect.value,
      courseName: courseNameInput.value,
      examTitle: examTitleInput.value,
      date: dateInput.value,
      semester: semesterInput.value,
      maxMarks: maxMarksInput.value,
      duration: durationInput.value
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

  // Render Manager Submissions Dashboard
  function renderDashboard() {
    const submissions = store.getSubmissions();
    const filter = statusFilterSelect ? statusFilterSelect.value : 'ALL';
    const filtered = filter === 'ALL' ? submissions : submissions.filter(s => s.status === filter);

    totalSubsEl.textContent = submissions.length;
    pendingReviewEl.textContent = submissions.filter(s => s.status === 'Submitted' || s.status === 'Under Review').length;
    approvedSubsEl.textContent = submissions.filter(s => s.status === 'Approved').length;

    submissionsTableBody.innerHTML = '';
    filtered.forEach((sub) => {
      const tr = document.createElement('tr');
      const statusClass = sub.status === 'Approved' ? 'status-approved' : (sub.status === 'Under Review' ? 'status-review' : 'status-submitted');

      tr.innerHTML = `
        <td><b>${sub.id}</b></td>
        <td><b>${sub.facultyName}</b><br><span style="font-size:0.75rem; color:var(--text-muted);">${sub.punivId || 'PUNIV'}</span></td>
        <td><b>${sub.courseCode}</b> - ${sub.courseName}</td>
        <td><span class="q-num-badge">${sub.setName}</span></td>
        <td>${sub.submittedAt}</td>
        <td><span class="status-badge ${statusClass}">${sub.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm load-sub-btn" data-id="${sub.id}">👁️ Review Paper</button>
          <button class="btn btn-success btn-sm approve-sub-btn" data-id="${sub.id}">✅ Approve</button>
          <button class="btn btn-primary btn-sm docx-sub-btn" data-id="${sub.id}">📝 DOCX</button>
          <button class="btn btn-danger btn-sm del-sub-btn" data-id="${sub.id}">🗑️</button>
        </td>
      `;
      submissionsTableBody.appendChild(tr);
    });

    document.querySelectorAll('.load-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const sub = store.getSubmissions().find(s => s.id === id);
        if (sub) {
          courseSelect.value = sub.courseCode;
          courseNameInput.value = sub.courseName;
          builder.currentSet = sub.setName;
          builder.setsData[sub.setName].partA = sub.partA;
          builder.setsData[sub.setName].partB = sub.partB;

          roleFacultyBtn.click();
          renderForm();
          updatePreview();
        }
      });
    });

    document.querySelectorAll('.approve-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        store.updateStatus(id, 'Approved');
        renderDashboard();
      });
    });

    document.querySelectorAll('.docx-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const sub = store.getSubmissions().find(s => s.id === id);
        if (sub) {
          exporter.exportToWord(sub.meta, { partA: sub.partA, partB: sub.partB }, sub.setName);
        }
      });
    });

    document.querySelectorAll('.del-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm(`Delete submission ${id}?`)) {
          store.deleteSubmission(id);
          renderDashboard();
        }
      });
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', renderDashboard);
  }

  renderForm();
  updatePreview();
});
