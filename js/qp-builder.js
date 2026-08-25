/* ==========================================================================
   SOIS Question Paper Builder, Rich Content & Submissions Engine
   Presidency University Bengaluru - School of Information Science
   ========================================================================== */

class QPBuilder {
  constructor() {
    this.currentSet = 'SET A';
    this.currentRole = 'faculty'; // 'faculty' or 'admin'
    this.setsData = {
      'SET A': { partA: [], partB: [] },
      'SET B': { partA: [], partB: [] },
      'SET C': { partA: [], partB: [] }
    };

    this.initDefaultData();
  }

  initDefaultData() {
    ['SET A', 'SET B', 'SET C'].forEach((setName) => {
      this.setsData[setName].partA = [
        { qNo: 1, text: 'Define [concept/term] and state its primary functions.', marks: 2, bloom: 'L1', co: 'CO1', imageUrl: '', tableHtml: '' },
        { qNo: 2, text: 'Explain the working mechanism of [topic] with a neat diagram.', marks: 2, bloom: 'L2', co: 'CO1', imageUrl: '', tableHtml: '' },
        { qNo: 3, text: 'Differentiate between [Concept A] and [Concept B] with suitable examples.', marks: 2, bloom: 'L2', co: 'CO2', imageUrl: '', tableHtml: '' },
        { qNo: 4, text: 'List five major components/features of [system/concept].', marks: 1, bloom: 'L1', co: 'CO2', imageUrl: '', tableHtml: '' },
        { qNo: 5, text: 'Demonstrate the step-by-step execution of [algorithm/method] using sample inputs.', marks: 3, bloom: 'L3', co: 'CO3', imageUrl: '', tableHtml: '' }
      ];

      this.setsData[setName].partB = [
        { qNo: 6, text: 'Construct/Draw the architectural diagram for [system/database schema] and explain its working.', marks: 10, bloom: 'L3', co: 'CO1', imageUrl: '', tableHtml: '' },
        { qNo: 7, text: 'Analyze the structural design and efficiency of [architecture/system].', marks: 10, bloom: 'L4', co: 'CO2', imageUrl: '', tableHtml: '' },
        { qNo: 8, text: 'Evaluate the trade-offs of using [technology/algorithm] and justify your selection.', marks: 10, bloom: 'L5', co: 'CO3', imageUrl: '', tableHtml: '' }
      ];
    });
  }

  // Supercharged Bulk Paste Parser: Auto-Detects Text, Marks, Bloom (L1-L6), and CO (CO1-CO5)
  parsePastedText(rawText) {
    if (!rawText || !rawText.trim()) return;

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedPartA = [];
    const parsedPartB = [];

    let currentSection = 'partA';

    lines.forEach((line) => {
      // 1. Detect Explicit Section Headers
      if (/part\s*b/i.test(line)) {
        currentSection = 'partB';
        return;
      }
      if (/part\s*a/i.test(line)) {
        currentSection = 'partA';
        return;
      }

      // 2. Auto-Detect Question Number prefix e.g. Q6, Q.6, 6., 6), Question 6
      const qNoMatch = line.match(/^(?:Q(?:uestion)?\.?\s*(\d+)|(\d+)[\.\)])\s*/i);
      let detectedQNo = null;
      if (qNoMatch) {
        detectedQNo = parseInt(qNoMatch[1] || qNoMatch[2], 10);
        if (detectedQNo >= 6) {
          currentSection = 'partB';
        } else if (detectedQNo >= 1 && detectedQNo <= 5) {
          currentSection = 'partA';
        }
      }

      // 3. Auto-Detect Bloom's Taxonomy Level (L1 to L6)
      const bloomMatch = line.match(/\b(L[1-6])\b/i) || line.match(/\b(Remember|Understand|Apply|Analyze|Evaluate|Create)\b/i);
      let bloom = 'L2';
      if (bloomMatch) {
        const val = bloomMatch[1].toUpperCase();
        if (val.startsWith('L')) {
          bloom = val;
        } else if (val === 'REMEMBER') bloom = 'L1';
        else if (val === 'UNDERSTAND') bloom = 'L2';
        else if (val === 'APPLY') bloom = 'L3';
        else if (val === 'ANALYZE') bloom = 'L4';
        else if (val === 'EVALUATE') bloom = 'L5';
        else if (val === 'CREATE') bloom = 'L6';
      }

      // 4. Auto-Detect Course Outcome (CO1 to CO5)
      const coMatch = line.match(/\b(CO[1-5])\b/i);
      const co = coMatch ? coMatch[1].toUpperCase() : (currentSection === 'partA' ? 'CO1' : 'CO2');

      // 5. Auto-Detect Marks (e.g. [2 Marks], 10M, 10 marks, [Marks: 5])
      const markMatch = line.match(/\[?\s*(?:marks?:?\s*)?(\d+)\s*(?:m|marks?)?\s*\]?/i) || line.match(/\b(\d+)\s*(?:m|marks?)\b/i);
      let marks = currentSection === 'partA' ? 2 : 10;
      if (markMatch) {
        const parsedMarks = parseInt(markMatch[1], 10);
        if (parsedMarks > 0 && parsedMarks <= 30) {
          marks = parsedMarks;
          if (marks >= 8 && currentSection === 'partA' && parsedPartA.length >= 5) {
            currentSection = 'partB';
          }
        }
      }

      // 6. Clean Text: Remove question numbers, metadata brackets, L1-L6, CO1-CO5, Marks
      let cleanText = line
        .replace(/^(?:Q(?:uestion)?\.?\s*\d+|\d+[\.\)])\s*/i, '')
        .replace(/\b(L[1-6])\b/gi, '')
        .replace(/\b(CO[1-5])\b/gi, '')
        .replace(/\[?\s*(?:marks?:?\s*)?\d+\s*(?:m|marks?)?\s*\]?/gi, '')
        .replace(/\b\d+\s*(?:marks?|m)\b/gi, '')
        .replace(/\b(Remember|Understand|Apply|Analyze|Evaluate|Create)\b/gi, '')
        .replace(/[\[\(\{\]\}\)]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Filter out junk or metadata-only lines
      if (cleanText.length > 2) {
        if (currentSection === 'partA' && parsedPartA.length < 5) {
          parsedPartA.push({
            qNo: parsedPartA.length + 1,
            text: cleanText,
            marks: marks,
            bloom: bloom,
            co: co,
            imageUrl: '',
            tableHtml: ''
          });
        } else if (parsedPartB.length < 3) {
          parsedPartB.push({
            qNo: parsedPartB.length + 6,
            text: cleanText,
            marks: marks,
            bloom: bloom,
            co: co,
            imageUrl: '',
            tableHtml: ''
          });
        }
      }
    });

    // Populate current set data with parsed questions
    if (parsedPartA.length > 0) {
      parsedPartA.forEach((q, i) => {
        if (this.setsData[this.currentSet].partA[i]) {
          this.setsData[this.currentSet].partA[i].text = q.text;
          this.setsData[this.currentSet].partA[i].marks = q.marks;
          this.setsData[this.currentSet].partA[i].bloom = q.bloom;
          this.setsData[this.currentSet].partA[i].co = q.co;
        } else {
          this.setsData[this.currentSet].partA.push(q);
        }
      });
    }

    if (parsedPartB.length > 0) {
      parsedPartB.forEach((q, i) => {
        if (this.setsData[this.currentSet].partB[i]) {
          this.setsData[this.currentSet].partB[i].text = q.text;
          this.setsData[this.currentSet].partB[i].marks = q.marks;
          this.setsData[this.currentSet].partB[i].bloom = q.bloom;
          this.setsData[this.currentSet].partB[i].co = q.co;
        } else {
          this.setsData[this.currentSet].partB.push(q);
        }
      });
    }
  }

  exportCurrentSet(meta) {
    const data = this.setsData[this.currentSet];
    return {
      meta: meta,
      setName: this.currentSet,
      partA: data.partA,
      partB: data.partB
    };
  }

  // Returns a starter HTML table that faculty can customise inside the question card
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
