/* ==========================================================================
   SOIS Question Paper DOCX & PDF Exporter (Native Word & Clean PDF Print)
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

class QPExporter {

  // Generate 100% Compatible Microsoft Word Document (.doc / .docx)
  static exportToWord(meta = {}, qpData = { partA: [], partB: [] }, setName = 'SET A') {
    const courseCode = meta.courseCode || 'SOIS_COURSE';
    const examTitle = (meta.examTitle || 'EXAM').replace(/[^a-zA-Z0-9]/g, '_');
    const safeSetName = (setName || 'SET_A').replace(/\s+/g, '_');
    const fileName = `${courseCode}_${examTitle}_${safeSetName}.doc`;

    const partA = qpData.partA || qpData['SET A']?.partA || [];
    const partB = qpData.partB || qpData['SET A']?.partB || [];

    let partAHtml = '';
    partA.forEach((q, idx) => {
      let content = QPExporter.escapeHtml(q.text || '');
      if (q.tableHtml) content += `<br>${q.tableHtml}`;
      if (q.imageUrl) content += `<br><img style="max-width:300px; max-height:180px;" src="${q.imageUrl}" />`;

      partAHtml += `
        <tr>
          <td style="text-align:center; font-weight:bold; border:1pt solid #000; padding:5pt;">${q.qNo || (idx + 1)}.</td>
          <td style="border:1pt solid #000; padding:5pt;">${content}</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.marks || 2} Marks</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.bloom || 'L1'}</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.co || 'CO1'}</td>
        </tr>
      `;
    });

    let partBHtml = '';
    partB.forEach((q, idx) => {
      let content = QPExporter.escapeHtml(q.text || '');
      if (q.tableHtml) content += `<br>${q.tableHtml}`;
      if (q.imageUrl) content += `<br><img style="max-width:300px; max-height:180px;" src="${q.imageUrl}" />`;

      partBHtml += `
        <tr>
          <td style="text-align:center; font-weight:bold; border:1pt solid #000; padding:5pt;">${q.qNo || (idx + 6)}.</td>
          <td style="border:1pt solid #000; padding:5pt;">${content}</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.marks || 10} Marks</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.bloom || 'L3'}</td>
          <td style="text-align:center; border:1pt solid #000; padding:5pt;">${q.co || 'CO1'}</td>
        </tr>
      `;
    });

    const docHtml = `
      <html xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForCustomXSL/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection1 {
            size: 210mm 297mm;
            margin: 1in;
            mso-header-margin: 36pt;
            mso-footer-margin: 36pt;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000000;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12pt; }
          td, th { border: 1pt solid #000000; padding: 4pt 6pt; vertical-align: top; font-size: 10.5pt; }
          .title-header { text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; }
          .sub-header { text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 12pt; }
          .part-header { font-weight: bold; font-size: 11pt; margin-top: 12pt; margin-bottom: 6pt; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
        </style>
      </head>
        <div class="WordSection1">
          <div style="float: right; font-weight: bold;">${setName}</div>
          <div style="text-align: center; margin-bottom: 6pt;">
            <img src="${(typeof window !== 'undefined' && window.PRESIDENCY_LOGO_BASE64) ? window.PRESIDENCY_LOGO_BASE64 : 'images/presidency_logo.png'}" width="70" height="70" style="width:70px; height:70px; object-fit:contain;" alt="Presidency University" />
          </div>
          <div class="title-header">PRESIDENCY UNIVERSITY BENGALURU</div>
          <div class="sub-header">SCHOOL OF INFORMATION SCIENCE</div>

          <table>
            <tr>
              <td colspan="3" style="text-align:center; font-weight:bold;">${meta.examTitle || 'Continuous Assessment Test'}</td>
            </tr>
            <tr>
              <td><b>Course Code:</b> ${meta.courseCode || ''}</td>
              <td><b>Course Name:</b> ${meta.courseName || ''}</td>
              <td><b>Date:</b> ${meta.date || ''}</td>
            </tr>
            <tr>
              <td><b>Semester:</b> ${meta.semester || ''}</td>
              <td><b>Max Marks:</b> ${meta.maxMarks || '30'} Marks</td>
              <td><b>Time:</b> ${meta.duration || '1 Hour'}</td>
            </tr>
          </table>

          <div class="part-header">
            Part A: Answer ALL the Questions. Each question carries 2 marks.
            <span style="float: right;">5Q x 2M = 10M</span>
          </div>

          <table>
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="width: 8%;">Q.No</th>
                <th style="width: 66%;">Question Text</th>
                <th style="width: 12%;">Marks</th>
                <th style="width: 7%;">L</th>
                <th style="width: 7%;">CO</th>
              </tr>
            </thead>
            <tbody>
              ${partAHtml}
            </tbody>
          </table>

          <div class="part-header">
            Part B: Answer any two of the Questions.
            <span style="float: right;">2Q x 10M = 20M</span>
          </div>

          <table>
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="width: 8%;">Q.No</th>
                <th style="width: 66%;">Question Text</th>
                <th style="width: 12%;">Marks</th>
                <th style="width: 7%;">L</th>
                <th style="width: 7%;">CO</th>
              </tr>
            </thead>
            <tbody>
              ${partBHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], {
      type: 'application/msword;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
  }

  // Export directly from a submission record object
  static exportSubmission(sub) {
    if (!sub) return;
    const meta = sub.meta || {
      courseCode: sub.courseCode,
      courseName: sub.courseName,
      examTitle: 'Continuous Assessment Test',
      date: sub.submittedAt,
      semester: '4',
      maxMarks: '30',
      duration: '1 Hour'
    };
    const qpData = {
      partA: sub.partA || [],
      partB: sub.partB || []
    };
    this.exportToWord(meta, qpData, sub.setName || 'SET A');
  }

  // Export to Clean Print PDF Window (Zero Blank Pages)
  static exportToPDF(meta = null, qpData = null, setName = 'SET A') {
    // If element preview exists in page, extract its full HTML
    let paperHtml = '';

    const previewEl = document.getElementById('paperContentPreview') || document.querySelector('.preview-paper');
    if (previewEl && previewEl.innerHTML.trim().length > 50) {
      paperHtml = previewEl.innerHTML;
    } else if (meta && qpData) {
      // Construct clean HTML string from metadata & qpData
      paperHtml = this.generatePaperHtmlString(meta, qpData, setName);
    } else {
      window.print();
      return;
    }

    // Open dedicated clean print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Question Paper Print Preview</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 10.5pt;
            line-height: 1.3;
            color: #000000;
            background: #ffffff;
            margin: 0;
            padding: 10px;
          }
          .title-header { text-align: center; font-weight: bold; font-size: 13pt; text-transform: uppercase; }
          .sub-header { text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          td, th { border: 1pt solid #000000; padding: 3pt 5pt; vertical-align: top; font-size: 9.5pt; color: #000; }
          .qp-part-title, .part-header {
            font-weight: bold; font-size: 10pt; margin-top: 10px; margin-bottom: 4px;
            display: flex; justify-content: space-between;
          }
          /* ── FRONT / BACK: Part B always starts on a new page (back of sheet) ── */
          .part-b-start, .part-b-header {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 4mm;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          img { max-width: 280px; max-height: 160px; }
        </style>
      </head>
      <body>
        <div>${paperHtml}</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  static generatePaperHtmlString(meta, qpData, setName) {
    const partA = qpData.partA || [];
    const partB = qpData.partB || [];

    let partAHtml = partA.map((q, i) => `
      <tr>
        <td class="text-center font-bold">${q.qNo || (i + 1)}.</td>
        <td>${this.escapeHtml(q.text)}${q.tableHtml ? '<br>' + q.tableHtml : ''}</td>
        <td class="text-center">${q.marks || 2} Marks</td>
        <td class="text-center">${q.bloom || 'L1'}</td>
        <td class="text-center">${q.co || 'CO1'}</td>
      </tr>
    `).join('');

    let partBHtml = partB.map((q, i) => `
      <tr>
        <td class="text-center font-bold">${q.qNo || (i + 6)}.</td>
        <td>${this.escapeHtml(q.text)}${q.tableHtml ? '<br>' + q.tableHtml : ''}</td>
        <td class="text-center">${q.marks || 10} Marks</td>
        <td class="text-center">${q.bloom || 'L3'}</td>
        <td class="text-center">${q.co || 'CO1'}</td>
      </tr>
    `).join('');

    return `
      <div style="float: right; font-weight: bold;">${setName}</div>
      <div style="text-align: center; margin-bottom: 6px;">
        <img src="${(typeof window !== 'undefined' && window.PRESIDENCY_LOGO_BASE64) ? window.PRESIDENCY_LOGO_BASE64 : 'images/presidency_logo.png'}" style="width:70px; height:70px; object-fit:contain;" alt="Presidency University" />
      </div>
      <div class="title-header">PRESIDENCY UNIVERSITY BENGALURU</div>
      <div class="sub-header">SCHOOL OF INFORMATION SCIENCE</div>
      <table>
        <tr><td colspan="3" class="text-center font-bold">${meta.examTitle}</td></tr>
        <tr><td><b>Course Code:</b> ${meta.courseCode}</td><td><b>Course Name:</b> ${meta.courseName}</td><td><b>Date:</b> ${meta.date}</td></tr>
        <tr><td><b>Semester:</b> ${meta.semester}</td><td><b>Max Marks:</b> ${meta.maxMarks} Marks</td><td><b>Time:</b> ${meta.duration}</td></tr>
      </table>
      <div class="part-header">Part A: Answer ALL the Questions. Each question carries 2 marks. <span style="float:right;">10M</span></div>
      <table><thead><tr><th style="width:8%;">Q.No</th><th style="width:66%;">Question Text</th><th style="width:12%;">Marks</th><th style="width:7%;">L</th><th style="width:7%;">CO</th></tr></thead><tbody>${partAHtml}</tbody></table>
      <div class="part-header part-b-header">Part B: Answer any two of the Questions. <span style="float:right;">20M</span></div>
      <table><thead><tr><th style="width:8%;">Q.No</th><th style="width:66%;">Question Text</th><th style="width:12%;">Marks</th><th style="width:7%;">L</th><th style="width:7%;">CO</th></tr></thead><tbody>${partBHtml}</tbody></table>
    `;
  }

  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.QPExporter = QPExporter;
