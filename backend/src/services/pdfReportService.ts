import PDFDocument from 'pdfkit';
import { prisma } from '../prisma.js';

export class PdfReportService {
  /**
   * Generates a comprehensive, institutional-grade Individual Student Performance Report
   */
  async generateStudentPerformanceReport(studentId: string, assessmentId?: string): Promise<Buffer> {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentProfile: {
          include: { batch: true },
        },
        assessmentResults: {
          include: {
            assessment: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
        submissions: {
          include: {
            question: true,
            testResults: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
        suspiciousEvents: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Filter results if specific assessment requested
    const filteredResults = assessmentId
      ? student.assessmentResults.filter((r) => r.assessmentId === assessmentId)
      : student.assessmentResults;

    const filteredSubmissions = assessmentId
      ? student.submissions.filter((s) => s.assessmentId === assessmentId)
      : student.submissions;

    // Calculate aggregated metrics from real stored data
    const totalAssessments = filteredResults.length;
    const completedAssessments = filteredResults.length;
    const totalMarksPossible = filteredResults.reduce((acc, r) => acc + r.totalMarks, 0);
    const totalMarksObtained = filteredResults.reduce((acc, r) => acc + r.obtainedMarks, 0);
    const avgPercentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;
    const highestPercentage = filteredResults.reduce((max, r) => Math.max(max, r.percentage), 0);
    const lowestPercentage = filteredResults.length > 0 ? filteredResults.reduce((min, r) => Math.min(min, r.percentage), 100) : 0;

    const totalQuestionsAttempted = filteredResults.reduce((acc, r) => acc + r.questionsAttempted, 0);
    const totalQuestionsSolved = filteredResults.reduce((acc, r) => acc + r.questionsSolved, 0);

    const totalTestCasesEvaluated = filteredResults.reduce((acc, r) => acc + r.totalTestCases, 0);
    const totalTestCasesPassed = filteredResults.reduce((acc, r) => acc + r.testCasesPassed, 0);
    const accuracy = totalTestCasesEvaluated > 0 ? (totalTestCasesPassed / totalTestCasesEvaluated) * 100 : 0;

    // Topic performance breakdown
    const topicStats: Record<string, { total: number; passed: number; marksObtained: number; marksTotal: number }> = {};
    for (const sub of filteredSubmissions) {
      const topic = sub.question.category || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, passed: 0, marksObtained: 0, marksTotal: 0 };
      }
      topicStats[topic].total += sub.totalTestCases;
      topicStats[topic].passed += sub.testCasesPassed;
      topicStats[topic].marksObtained += sub.marks;
      topicStats[topic].marksTotal += sub.question.marks;
    }

    // Proctoring / Suspicious events count
    const suspiciousEvents = student.suspiciousEvents.filter(
      (e) => !assessmentId || e.assessmentId === assessmentId
    );
    const tabSwitches = suspiciousEvents.filter((e) => e.eventType === 'TAB_SWITCH').length;
    const pasteAttempts = suspiciousEvents.filter((e) => e.eventType === 'PASTE_ATTEMPT').length;
    const fullscreenExits = suspiciousEvents.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        info: {
          Title: `Student Performance Report - ${student.name}`,
          Author: 'Online Coding Assessment Platform',
          Subject: 'Academic Coding Evaluation',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Colors
      const primaryColor = '#0f172a'; // slate-900
      const accentColor = '#2563eb';  // blue-600
      const lightBg = '#f8fafc';      // slate-50
      const borderColor = '#cbd5e1';  // slate-300
      const successColor = '#059669'; // emerald-600
      const grayText = '#475569';     // slate-600

      // HEADER BANNER
      doc.rect(0, 0, 595.28, 90).fill(primaryColor);

      // Title & Subtitle
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('ONLINE CODING ASSESSMENT PLATFORM', 36, 22);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text('Official Examination & Automated Evaluation Performance Report', 36, 42);

      // Report ID & Date
      doc.fillColor('#38bdf8').fontSize(8).font('Helvetica-Bold')
        .text(`REPORT REF: CAP-${Date.now().toString(36).toUpperCase()}`, 400, 24, { align: 'right' });
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
        .text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 400, 38, { align: 'right' });

      // STUDENT PROFILE CARD
      let currentY = 105;
      doc.rect(36, currentY, 523, 72).fill(lightBg).strokeColor(borderColor).lineWidth(1).stroke();

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('STUDENT PROFILE & ACADEMIC INFORMATION', 48, currentY + 10);

      const rollNumber = student.studentProfile?.rollNumber || 'N/A';
      const batchName = student.studentProfile?.batch?.name || 'CSE - 2026';
      const dept = student.studentProfile?.department || 'Computer Science & Engineering';

      doc.font('Helvetica').fontSize(9).fillColor(grayText);
      doc.text(`Candidate Name: `, 48, currentY + 28);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(student.name, 130, currentY + 28);

      doc.font('Helvetica').fillColor(grayText).text(`Roll Number: `, 48, currentY + 44);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(rollNumber, 130, currentY + 44);

      doc.font('Helvetica').fillColor(grayText).text(`Email ID: `, 300, currentY + 28);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(student.email, 360, currentY + 28);

      doc.font('Helvetica').fillColor(grayText).text(`Batch / Dept: `, 300, currentY + 44);
      doc.font('Helvetica-Bold').fillColor(primaryColor).text(`${batchName} | ${dept}`, 360, currentY + 44);

      // PERFORMANCE SCORECARDS (4 Grid Cards)
      currentY = 190;
      const cardWidth = 124;
      const cardHeight = 55;
      const metrics = [
        { label: 'OVERALL AVERAGE', val: `${avgPercentage.toFixed(1)}%`, color: accentColor },
        { label: 'TESTS COMPLETED', val: `${completedAssessments}`, color: primaryColor },
        { label: 'TEST CASE ACCURACY', val: `${accuracy.toFixed(1)}%`, color: successColor },
        { label: 'PROBLEMS SOLVED', val: `${totalQuestionsSolved} / ${totalQuestionsAttempted}`, color: '#7c3aed' },
      ];

      metrics.forEach((m, idx) => {
        const x = 36 + idx * (cardWidth + 9);
        doc.rect(x, currentY, cardWidth, cardHeight).fill('#ffffff').strokeColor(borderColor).lineWidth(1).stroke();
        doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold').text(m.label, x + 8, currentY + 10);
        doc.fillColor(m.color).fontSize(14).font('Helvetica-Bold').text(m.val, x + 8, currentY + 25);
      });

      // SECTION: ASSESSMENT RESULTS TABLE
      currentY = 260;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('ASSESSMENT EVALUATION RECORDS', 36, currentY);

      currentY += 16;
      // Table Header
      doc.rect(36, currentY, 523, 20).fill('#e2e8f0');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('ASSESSMENT NAME', 44, currentY + 6);
      doc.text('MARKS', 240, currentY + 6);
      doc.text('PERCENTAGE', 310, currentY + 6);
      doc.text('SOLVED', 385, currentY + 6);
      doc.text('RANK', 445, currentY + 6);
      doc.text('DATE', 490, currentY + 6);

      currentY += 20;

      if (filteredResults.length === 0) {
        doc.rect(36, currentY, 523, 22).fill('#ffffff').strokeColor(borderColor).stroke();
        doc.fillColor(grayText).fontSize(8).font('Helvetica')
          .text('No assessment records found for this student.', 44, currentY + 6);
        currentY += 25;
      } else {
        filteredResults.slice(0, 5).forEach((res) => {
          doc.rect(36, currentY, 523, 20).fill('#ffffff').strokeColor('#f1f5f9').stroke();
          doc.fillColor(primaryColor).fontSize(8).font('Helvetica');
          doc.text(res.assessment.title.slice(0, 32), 44, currentY + 6);
          doc.text(`${res.obtainedMarks} / ${res.totalMarks}`, 240, currentY + 6);
          doc.font('Helvetica-Bold').fillColor(res.percentage >= 50 ? successColor : '#e11d48')
            .text(`${res.percentage.toFixed(1)}%`, 310, currentY + 6);
          doc.font('Helvetica').fillColor(primaryColor);
          doc.text(`${res.questionsSolved} / ${res.questionsAttempted}`, 385, currentY + 6);
          doc.text(`#${res.rank}`, 445, currentY + 6);
          doc.text(new Date(res.submittedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }), 490, currentY + 6);
          currentY += 20;
        });
      }

      // SECTION: TOPIC-WISE PERFORMANCE BREAKDOWN
      currentY += 15;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('TOPIC MASTERY & DOMAIN BREAKDOWN', 36, currentY);

      currentY += 16;
      const topicKeys = Object.keys(topicStats);
      if (topicKeys.length === 0) {
        doc.fillColor(grayText).fontSize(8).font('Helvetica')
          .text('Topic metrics will become available after additional submissions.', 36, currentY);
        currentY += 15;
      } else {
        // Render up to 5 topics with progress bar
        topicKeys.slice(0, 5).forEach((tName) => {
          const tData = topicStats[tName];
          const pct = tData.total > 0 ? (tData.passed / tData.total) * 100 : 0;

          doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold').text(tName, 36, currentY + 2);
          doc.fillColor(grayText).fontSize(8).font('Helvetica').text(`${pct.toFixed(0)}% (${tData.passed}/${tData.total} cases)`, 150, currentY + 2);

          // Bar track
          doc.rect(260, currentY + 2, 290, 8).fill('#e2e8f0');
          // Filled bar
          const fillWidth = Math.max(4, Math.round((pct / 100) * 290));
          doc.rect(260, currentY + 2, fillWidth, 8).fill(pct >= 70 ? successColor : pct >= 40 ? '#f59e0b' : '#ef4444');

          currentY += 16;
        });
      }

      // SECTION: QUESTION BREAKDOWN TABLE
      currentY += 15;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
        .text('RECENT QUESTION EVALUATION LOG', 36, currentY);

      currentY += 16;
      doc.rect(36, currentY, 523, 18).fill('#e2e8f0');
      doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold');
      doc.text('QUESTION TITLE', 44, currentY + 5);
      doc.text('LANG', 230, currentY + 5);
      doc.text('MARKS', 275, currentY + 5);
      doc.text('TEST CASES', 330, currentY + 5);
      doc.text('AVG TIME', 410, currentY + 5);
      doc.text('STATUS', 475, currentY + 5);

      currentY += 18;
      const recentSubs = filteredSubmissions.slice(0, 5);
      if (recentSubs.length === 0) {
        doc.rect(36, currentY, 523, 20).fill('#ffffff').strokeColor(borderColor).stroke();
        doc.fillColor(grayText).fontSize(8).font('Helvetica')
          .text('No coding submissions recorded.', 44, currentY + 6);
        currentY += 22;
      } else {
        recentSubs.forEach((sub) => {
          doc.rect(36, currentY, 523, 18).fill('#ffffff').strokeColor('#f8fafc').stroke();
          doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica');
          doc.text(sub.question.title.slice(0, 30), 44, currentY + 5);
          doc.text(sub.language.toUpperCase(), 230, currentY + 5);
          doc.text(`${sub.marks} / ${sub.question.marks}`, 275, currentY + 5);
          doc.text(`${sub.testCasesPassed} / ${sub.totalTestCases}`, 330, currentY + 5);
          doc.text(`${sub.executionTime}ms`, 410, currentY + 5);

          const isAccepted = sub.status === 'ACCEPTED';
          doc.font('Helvetica-Bold').fillColor(isAccepted ? successColor : '#e11d48')
            .text(sub.status.replace(/_/g, ' '), 475, currentY + 5);

          currentY += 18;
        });
      }

      // SECTION: PROCTORING & INTEGRITY AUDIT
      currentY += 12;
      doc.rect(36, currentY, 523, 36).fill('#fffbeb').strokeColor('#fef3c7').lineWidth(1).stroke();
      doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold')
        .text('PROCTORING & ASSESSMENT INTEGRITY LOG', 44, currentY + 7);
      doc.font('Helvetica').fontSize(8).fillColor('#78350f')
        .text(`Tab Switch Events: ${tabSwitches}  |  Fullscreen Exit Events: ${fullscreenExits}  |  Paste Blocked Attempts: ${pasteAttempts}`, 44, currentY + 20);

      // SECTION: FACTUAL PERFORMANCE OBSERVATIONS (Algorithmically derived from stored data)
      currentY += 46;
      doc.rect(36, currentY, 523, 56).fill(lightBg).strokeColor(borderColor).lineWidth(1).stroke();
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold')
        .text('FACTUAL PERFORMANCE OBSERVATIONS', 44, currentY + 8);

      const obs1 = `1. The student achieved an overall average score of ${avgPercentage.toFixed(1)}% across ${completedAssessments} evaluated assessment(s).`;
      const obs2 = `2. Successfully passed ${totalTestCasesPassed} out of ${totalTestCasesEvaluated} total test cases (${accuracy.toFixed(1)}% test case pass rate).`;
      const obs3 = highestPercentage > 0
        ? `3. Highest score recorded: ${highestPercentage.toFixed(1)}%. Questions successfully solved: ${totalQuestionsSolved} of ${totalQuestionsAttempted} attempted.`
        : `3. Student has active assessments scheduled for evaluation.`;

      doc.font('Helvetica').fontSize(7.5).fillColor(grayText);
      doc.text(obs1, 44, currentY + 22);
      doc.text(obs2, 44, currentY + 33);
      doc.text(obs3, 44, currentY + 44);

      // FOOTER & AUTHENTICATION STAMP
      currentY += 66;
      doc.strokeColor(borderColor).lineWidth(0.5).moveTo(36, currentY).lineTo(559, currentY).stroke();

      currentY += 8;
      doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
        .text('This performance report is digitally generated by the Online Coding Assessment Platform evaluation engine.', 36, currentY);
      doc.text('Verification URL: http://localhost:5173/verify-report | Authorized Academic Evaluation', 36, currentY + 10);

      doc.fillColor(primaryColor).fontSize(7).font('Helvetica-Bold')
        .text('OFFICIALLY VERIFIED & SIGNED', 420, currentY, { align: 'right' });
      doc.fillColor('#64748b').fontSize(7).font('Helvetica')
        .text('System Evaluation Engine', 420, currentY + 10, { align: 'right' });

      doc.end();
    });
  }

  /**
   * Generates an Assessment Overall Class Summary Report
   */
  async generateAssessmentSummaryReport(assessmentId: string): Promise<Buffer> {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        results: {
          include: {
            student: {
              include: { studentProfile: true },
            },
          },
          orderBy: { rank: 'asc' },
        },
        questions: {
          include: { question: true },
        },
      },
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#0f172a';
      const accentColor = '#2563eb';
      const successColor = '#059669';

      // Header Banner
      doc.rect(0, 0, 595.28, 90).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
        .text('ASSESSMENT SUMMARY & LEADERBOARD REPORT', 36, 22);
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
        .text(`Assessment: ${assessment.title} | Duration: ${assessment.duration} mins | Total Marks: ${assessment.totalMarks}`, 36, 44);

      const totalSubmissions = assessment.results.length;
      const passedCount = assessment.results.filter((r) => r.isPassed).length;
      const avgScore = totalSubmissions > 0
        ? assessment.results.reduce((acc, r) => acc + r.obtainedMarks, 0) / totalSubmissions
        : 0;

      // Stats row
      let currentY = 105;
      doc.rect(36, currentY, 523, 45).fill('#f8fafc').strokeColor('#cbd5e1').stroke();
      doc.fillColor(primaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text(`Total Candidates: ${totalSubmissions}`, 50, currentY + 16);
      doc.text(`Passing Count: ${passedCount} (${totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(1) : 0}%)`, 200, currentY + 16);
      doc.text(`Average Score: ${avgScore.toFixed(1)} / ${assessment.totalMarks}`, 380, currentY + 16);

      // Ranked Leaderboard
      currentY = 165;
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('EXAM LEADERBOARD & ORDER OF MARKS', 36, currentY);

      currentY += 16;
      doc.rect(36, currentY, 523, 20).fill('#e2e8f0');
      doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('RANK', 44, currentY + 6);
      doc.text('CANDIDATE', 85, currentY + 6);
      doc.text('ROLL NO', 220, currentY + 6);
      doc.text('MARKS', 320, currentY + 6);
      doc.text('PERCENTAGE', 390, currentY + 6);
      doc.text('TIME TAKEN', 475, currentY + 6);

      currentY += 20;

      assessment.results.slice(0, 20).forEach((res) => {
        doc.rect(36, currentY, 523, 20).fill('#ffffff').strokeColor('#f1f5f9').stroke();
        doc.fillColor(primaryColor).fontSize(8).font('Helvetica');
        doc.text(`#${res.rank}`, 44, currentY + 6);
        doc.text(res.student.name, 85, currentY + 6);
        doc.text(res.student.studentProfile?.rollNumber || 'N/A', 220, currentY + 6);
        doc.text(`${res.obtainedMarks} / ${res.totalMarks}`, 320, currentY + 6);
        doc.font('Helvetica-Bold').fillColor(res.isPassed ? successColor : '#e11d48')
          .text(`${res.percentage.toFixed(1)}%`, 390, currentY + 6);
        doc.font('Helvetica').fillColor(primaryColor);
        doc.text(`${Math.round(res.timeTaken / 60)} mins`, 475, currentY + 6);
        currentY += 20;
      });

      doc.end();
    });
  }

  /**
   * Generates official Agni College of Technology "PORTAL MARK ENTRY STATEMENT"
   * with custom 5 columns: S.NO, REGISTER NUMBER, NAME OF THE STUDENT, ASSIGNMENT COMPLETION, SCORE
   */
  async generateClassStatementPdf(options: {
    institutionName?: string;
    subHeader?: string;
    accreditation?: string;
    location?: string;
    statementTitle?: string;
    statementSub?: string;
    programme?: string;
    batchSec?: string;
    dateOfEntry?: string;
    facultyName?: string;
    subjectName?: string;
    subjectCode?: string;
    records: Array<{
      sNo: number;
      registerNumber: string;
      studentName: string;
      assignmentCompletion: string;
      score: string | number;
    }>;
  }): Promise<Buffer> {
    const institutionName = options.institutionName || 'AGNI COLLEGE OF TECHNOLOGY';
    const subHeader = options.subHeader || '(An Autonomous Institution, Affiliated to Anna University, Chennai.)';
    const accreditation = options.accreditation || "Approved by AICTE, Accredited by NAAC with 'A+' Grade";
    const location = options.location || 'OMR, Navalur, Thalambur, Chennai.-600130';
    const statementTitle = options.statementTitle || 'IAT1 - ODD SEMESTER - 2026';
    const statementSub = options.statementSub || 'PORTAL MARK ENTRY STATEMENT';
    const programme = options.programme || 'PROGRAMME : B.E. COMPUTER SCIENCE AND ENGINEERING';
    const batchSec = options.batchSec || 'BATCH : 2024 - SEC. : C';
    const dateOfEntry = options.dateOfEntry || new Date().toLocaleDateString('en-GB');
    const facultyName = options.facultyName || 'Mrs. VARSHA';
    const subjectName = options.subjectName || 'COMPUTER NETWORKS';
    const subjectCode = options.subjectCode || '24CS501';
    const records = options.records || [];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        info: {
          Title: `Portal Mark Entry Statement - ${subjectName}`,
          Author: institutionName,
          Subject: statementSub,
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const drawHeader = (isFirstPage: boolean) => {
        // Institutional Crest & Header
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000')
          .text(institutionName, 36, 30, { align: 'center' });
        doc.font('Helvetica').fontSize(9).fillColor('#1e293b')
          .text(subHeader, 36, 47, { align: 'center' });
        doc.fontSize(8.5)
          .text(accreditation, 36, 59, { align: 'center' });
        doc.fontSize(8.5)
          .text(location, 36, 70, { align: 'center' });
        doc.font('Helvetica-Bold').fontSize(9.5)
          .text(statementTitle, 36, 82, { align: 'center' });
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
          .text(statementSub, 36, 96, { align: 'center' });

        // Horizontal dividing line
        doc.moveTo(36, 112).lineTo(559, 112).lineWidth(1).strokeColor('#000000').stroke();

        // Metadata grid
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#000000');
        doc.text(programme, 36, 122);
        doc.text(batchSec, 380, 122, { align: 'right', width: 179 });

        doc.font('Helvetica').fontSize(8.5);
        doc.text(`Date of Entry  : ${dateOfEntry}`, 36, 136);
        doc.text(`Name of the Faculty : ${facultyName}`, 340, 136, { align: 'right', width: 219 });

        doc.text(`Subject Name : ${subjectName}`, 36, 150);
        doc.text(`Subject Code : ${subjectCode}`, 380, 150, { align: 'right', width: 179 });

        // Table Header
        const tableY = 168;
        doc.rect(36, tableY, 523, 24).fill('#f8fafc').strokeColor('#000000').lineWidth(0.75).stroke();
        
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
        doc.text('S.NO', 42, tableY + 8, { width: 35, align: 'center' });
        doc.text('REGISTER NUMBER', 85, tableY + 8, { width: 120, align: 'left' });
        doc.text('NAME OF THE STUDENT', 215, tableY + 8, { width: 170, align: 'left' });
        doc.text('ASSIGNMENT COMPLETION', 390, tableY + 8, { width: 100, align: 'center' });
        doc.text('SCORE', 495, tableY + 8, { width: 60, align: 'center' });

        return tableY + 24;
      };

      let currentY = drawHeader(true);

      // Render table rows
      records.forEach((row, index) => {
        // Check page overflow
        if (currentY > 740) {
          doc.addPage();
          currentY = drawHeader(false);
        }

        const rowHeight = 18;
        // Draw row border
        doc.rect(36, currentY, 523, rowHeight).fill(index % 2 === 0 ? '#ffffff' : '#fcfcfd').strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        doc.font('Helvetica').fontSize(8).fillColor('#000000');
        doc.text(row.sNo.toString(), 42, currentY + 5, { width: 35, align: 'center' });
        doc.font('Helvetica-Bold').text(row.registerNumber, 85, currentY + 5, { width: 120, align: 'left' });
        doc.font('Helvetica').text(row.studentName, 215, currentY + 5, { width: 170, align: 'left' });
        
        // Completion status badge
        const isComp = row.assignmentCompletion.toLowerCase().includes('complete');
        doc.font(isComp ? 'Helvetica-Bold' : 'Helvetica')
          .fillColor(isComp ? '#15803d' : '#b45309')
          .text(row.assignmentCompletion, 390, currentY + 5, { width: 100, align: 'center' });

        // Score
        const isScoreAb = row.score === 'AB' || row.score === '-';
        doc.font('Helvetica-Bold')
          .fillColor(isScoreAb ? '#dc2626' : '#000000')
          .text(row.score.toString(), 495, currentY + 5, { width: 60, align: 'center' });

        currentY += rowHeight;
      });

      // Signature block at bottom
      if (currentY > 700) {
        doc.addPage();
        currentY = 60;
      } else {
        currentY += 40;
      }

      doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
      doc.text(facultyName, 50, currentY);
      doc.text('Signature of the HoD.', 420, currentY, { align: 'right', width: 139 });
      
      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text('Name of the Faculty', 50, currentY + 12);

      const footerCode = `${facultyName.replace(/[^a-zA-Z]/g, '').toUpperCase()}.CSE ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')} ${new Date().toLocaleTimeString('en-US', { hour12: false })}`;
      doc.fontSize(7).text(footerCode, 36, currentY + 36);

      doc.end();
    });
  }
}

export const pdfReportService = new PdfReportService();
