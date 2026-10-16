/* ==========================================================================
   SOIS Question Paper Builder, Rich Content & Submissions Engine
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

class QPBuilder {
  constructor() {
    this.currentSet = 'SET A';
    this.currentRole = 'faculty';

    // Default QP structure config — faculty can change this
    this.config = {
      partA: { count: 5, marks: 2, attemptAll: true, attemptN: 5 },
      partB: { count: 3, marks: 10, attemptAll: false, attemptN: 2 }
    };

    this.setsData = {
      'SET A': { partA: [], partB: [] },
      'SET B': { partA: [], partB: [] },
      'SET C': { partA: [], partB: [] }
    };

    this.initDefaultData();
  }

  /* Set a new config and rebuild default data for all sets */
  setConfig(partACount, partAMarks, partAAttemptAll, partAAttemptN,
    partBCount, partBMarks, partBAttemptN) {
    this.config = {
      partA: {
        count: Math.max(1, parseInt(partACount, 10) || 5),
        marks: Math.max(1, parseInt(partAMarks, 10) || 2),
        attemptAll: !!partAAttemptAll,
        attemptN: Math.max(1, parseInt(partAAttemptN, 10) || 5)
      },
      partB: {
        count: Math.max(1, parseInt(partBCount, 10) || 3),
        marks: Math.max(1, parseInt(partBMarks, 10) || 10),
        attemptAll: false,
        attemptN: Math.max(1, parseInt(partBAttemptN, 10) || 2)
      }
    };

    // Rebuild all sets to match new config counts
    ['SET A', 'SET B', 'SET C'].forEach(setName => {
      const existing = this.setsData[setName];

      // Resize Part A
      const newPartA = Array.from({ length: this.config.partA.count }, (_, i) => {
        return existing.partA[i] || {
          qNo: i + 1,
          text: `Question ${i + 1} — Part A`,
          marks: this.config.partA.marks,
          bloom: 'L1', co: 'CO1', imageUrl: '', tableHtml: ''
        };
      });
      newPartA.forEach((q, i) => { q.qNo = i + 1; q.marks = this.config.partA.marks; });

      // Resize Part B (qNos continue from Part A)
      const offset = this.config.partA.count;
      const newPartB = Array.from({ length: this.config.partB.count }, (_, i) => {
        return existing.partB[i] || {
          qNo: offset + i + 1,
          text: `Question ${offset + i + 1} — Part B`,
          marks: this.config.partB.marks,
          bloom: 'L3', co: 'CO1', imageUrl: '', tableHtml: ''
        };
      });
      newPartB.forEach((q, i) => { q.qNo = offset + i + 1; q.marks = this.config.partB.marks; });

      this.setsData[setName].partA = newPartA;
      this.setsData[setName].partB = newPartB;
    });
  }

  initDefaultData() {
    ['SET A', 'SET B', 'SET C'].forEach(setName => {
      const pACount = this.config.partA.count;
      const pBCount = this.config.partB.count;
      const offset = pACount;

      const defaultsA = [
        { text: 'Define [concept/term] and state its primary functions.', bloom: 'L1', co: 'CO1' },
        { text: 'Explain the working mechanism of [topic] with a neat diagram.', bloom: 'L2', co: 'CO1' },
        { text: 'Differentiate between [Concept A] and [Concept B] with suitable examples.', bloom: 'L2', co: 'CO2' },
        { text: 'List five major components or features of [system/concept].', bloom: 'L1', co: 'CO2' },
        { text: 'Demonstrate the step-by-step execution of [algorithm/method] using sample inputs.', bloom: 'L3', co: 'CO3' },
        { text: 'State the significance of [topic] in the context of [subject].', bloom: 'L1', co: 'CO1' },
        { text: 'Identify and describe the key properties of [concept].', bloom: 'L1', co: 'CO2' },
        { text: 'Illustrate the relationship between [A] and [B] with an example.', bloom: 'L2', co: 'CO3' },
      ];

      const defaultsB = [
        { text: 'Construct/Draw the architectural diagram for [system] and explain its working.', bloom: 'L3', co: 'CO1' },
        { text: 'Analyze the structural design and efficiency of [architecture/system].', bloom: 'L4', co: 'CO2' },
        { text: 'Evaluate the trade-offs of using [technology/algorithm] and justify your selection.', bloom: 'L5', co: 'CO3' },
        { text: 'Design a solution for [problem] using appropriate data structures and algorithms.', bloom: 'L6', co: 'CO4' },
        { text: 'Critically compare [Method A] and [Method B] in terms of performance and suitability.', bloom: 'L4', co: 'CO3' },
        { text: 'Propose and justify an improvement for [existing system] addressing its limitations.', bloom: 'L5', co: 'CO5' },
      ];

      this.setsData[setName].partA = Array.from({ length: pACount }, (_, i) => ({
        qNo: i + 1,
        text: (defaultsA[i] || defaultsA[defaultsA.length - 1]).text,
        marks: this.config.partA.marks,
        bloom: (defaultsA[i] || defaultsA[0]).bloom,
        co: (defaultsA[i] || defaultsA[0]).co,
        imageUrl: '', tableHtml: ''
      }));

      this.setsData[setName].partB = Array.from({ length: pBCount }, (_, i) => ({
        qNo: offset + i + 1,
        text: (defaultsB[i] || defaultsB[defaultsB.length - 1]).text,
        marks: this.config.partB.marks,
        bloom: (defaultsB[i] || defaultsB[0]).bloom,
        co: (defaultsB[i] || defaultsB[0]).co,
        imageUrl: '', tableHtml: ''
      }));
    });
  }

  /* Auto-generate Part A/B instruction line */
  getPartALabel() {
    const cfg = this.config.partA;
    const total = cfg.count * cfg.marks;
    if (cfg.attemptAll) {
      return `Answer ALL ${cfg.count} Questions. Each question carries ${cfg.marks} Mark${cfg.marks > 1 ? 's' : ''}. (${cfg.count} × ${cfg.marks}M = ${total}M)`;
    }
    const attemptTotal = cfg.attemptN * cfg.marks;
    return `Answer ANY ${cfg.attemptN} out of ${cfg.count} Questions. Each question carries ${cfg.marks} Mark${cfg.marks > 1 ? 's' : ''}. (${cfg.attemptN} × ${cfg.marks}M = ${attemptTotal}M)`;
  }

  getPartBLabel() {
    const cfg = this.config.partB;
    const attemptTotal = cfg.attemptN * cfg.marks;
    return `Answer ANY ${cfg.attemptN} out of ${cfg.count} Questions. Each question carries ${cfg.marks} Mark${cfg.marks > 1 ? 's' : ''}. (${cfg.attemptN} × ${cfg.marks}M = ${attemptTotal}M)`;
  }

  /* Supercharged Bulk Paste Parser */
  parsePastedText(rawText) {
    if (!rawText || !rawText.trim()) return;

    const maxA = this.config.partA.count;
    const maxB = this.config.partB.count;
    const offset = maxA;

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedPartA = [];
    const parsedPartB = [];

    let currentSection = 'partA';

    lines.forEach(line => {
      if (/part\s*b/i.test(line)) { currentSection = 'partB'; return; }
      if (/part\s*a/i.test(line)) { currentSection = 'partA'; return; }

      const qNoMatch = line.match(/^(?:Q(?:uestion)?\.?\s*(\d+)|(\d+)[\.]\))\s*/i);
      let detectedQNo = null;
      if (qNoMatch) {
        detectedQNo = parseInt(qNoMatch[1] || qNoMatch[2], 10);
        if (detectedQNo > maxA) currentSection = 'partB';
        else if (detectedQNo >= 1) currentSection = 'partA';
      }

      const bloomMatch = line.match(/\b(L[1-6])\b/i) || line.match(/\b(Remember|Understand|Apply|Analyze|Evaluate|Create)\b/i);
      let bloom = 'L2';
      if (bloomMatch) {
        const val = bloomMatch[1].toUpperCase();
        if (val.startsWith('L')) bloom = val;
        else if (val === 'REMEMBER') bloom = 'L1';
        else if (val === 'UNDERSTAND') bloom = 'L2';
        else if (val === 'APPLY') bloom = 'L3';
        else if (val === 'ANALYZE') bloom = 'L4';
        else if (val === 'EVALUATE') bloom = 'L5';
        else if (val === 'CREATE') bloom = 'L6';
      }

      const coMatch = line.match(/\b(CO[1-9])\b/i);
      const co = coMatch ? coMatch[1].toUpperCase() : (currentSection === 'partA' ? 'CO1' : 'CO2');

      const markMatch = line.match(/\[?\s*(?:marks?:?\s*)?(\d+)\s*(?:m|marks?)?\s*\]?/i);
      let marks = currentSection === 'partA' ? this.config.partA.marks : this.config.partB.marks;
      if (markMatch) {
        const pm = parseInt(markMatch[1], 10);
        if (pm > 0 && pm <= 30) marks = pm;
      }

      let cleanText = line
        .replace(/^(?:Q(?:uestion)?\.?\s*\d+|\d+[\.)])\s*/i, '')
        .replace(/\b(L[1-6])\b/gi, '')
        .replace(/\b(CO[1-9])\b/gi, '')
        .replace(/\[?\s*(?:marks?:?\s*)?\d+\s*(?:m|marks?)?\s*\]?/gi, '')
        .replace(/\b\d+\s*(?:marks?|m)\b/gi, '')
        .replace(/\b(Remember|Understand|Apply|Analyze|Evaluate|Create)\b/gi, '')
        .replace(/[\[\(\{\]\}\)]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText.length > 2) {
        if (currentSection === 'partA' && parsedPartA.length < maxA) {
          parsedPartA.push({ qNo: parsedPartA.length + 1, text: cleanText, marks, bloom, co, imageUrl: '', tableHtml: '' });
        } else if (currentSection === 'partB' && parsedPartB.length < maxB) {
          parsedPartB.push({ qNo: offset + parsedPartB.length + 1, text: cleanText, marks, bloom, co, imageUrl: '', tableHtml: '' });
        }
      }
    });

    if (parsedPartA.length > 0) {
      parsedPartA.forEach((q, i) => {
        if (this.setsData[this.currentSet].partA[i]) {
          Object.assign(this.setsData[this.currentSet].partA[i], q);
        } else {
          this.setsData[this.currentSet].partA.push(q);
        }
      });
    }

    if (parsedPartB.length > 0) {
      parsedPartB.forEach((q, i) => {
        if (this.setsData[this.currentSet].partB[i]) {
          Object.assign(this.setsData[this.currentSet].partB[i], q);
        } else {
          this.setsData[this.currentSet].partB.push(q);
        }
      });
    }
  }

  exportCurrentSet(meta) {
    const data = this.setsData[this.currentSet];
    return { meta, setName: this.currentSet, partA: data.partA, partB: data.partB };
  }

  static getSampleTable() {
    return `<table border="1" style="border-collapse:collapse; width:100%; font-size:10pt;">
  <thead>
    <tr style="background:#f0f0f0;">
      <th style="padding:4pt 6pt;">Column A</th>
      <th style="padding:4pt 6pt;">Column B</th>
      <th style="padding:4pt 6pt;">Column C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:4pt 6pt;">Data 1</td>
      <td style="padding:4pt 6pt;">Data 2</td>
      <td style="padding:4pt 6pt;">Data 3</td>
    </tr>
    <tr>
      <td style="padding:4pt 6pt;">Data 4</td>
      <td style="padding:4pt 6pt;">Data 5</td>
      <td style="padding:4pt 6pt;">Data 6</td>
    </tr>
  </tbody>
</table>`;
  }
}

window.QPBuilder = QPBuilder;

// Shared singleton instance — consumed by faculty.js, app.js, and manager.js
window.builderInstance = new QPBuilder();
