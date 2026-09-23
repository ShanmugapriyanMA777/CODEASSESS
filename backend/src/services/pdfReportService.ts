import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
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

      // TOP INSTITUTIONAL LOGO (Agni College of Technology)
      let logoPath = path.resolve(process.cwd(), 'assets', 'agni_logo.png');
      if (!fs.existsSync(logoPath)) {
        logoPath = path.resolve(process.cwd(), 'backend', 'assets', 'agni_logo.png');
      }
      try {
        doc.image(logoPath, 36, 16, { width: 523 });
      } catch (e: any) {
        console.warn('Logo image not found or failed to load:', e.message);
      }

      // Institutional Header Details (Centered below logo)
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#002b66')
        .text('Agni College of Technology', 36, 62, { align: 'center', width: 523 });
      doc.font('Helvetica').fontSize(8).fillColor('#334155')
        .text('(An Autonomous Institution)', 36, 75, { align: 'center', width: 523 });
      doc.fontSize(6.5).fillColor('#475569')
        .text('Accredited by NBA, NAAC with A+ Grade, Estd. 2001, Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai', 36, 85, { align: 'center', width: 523 });
      doc.text('OMR, Chennai | 044-4997 2900 | 94450 54081 | www.act.edu.in', 36, 94, { align: 'center', width: 523 });

      // Dividing Line
      doc.moveTo(36, 105).lineTo(559, 105).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // Title Bar (Centered Title + Subtitle, Right-aligned Ref/Date)
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e40af')
        .text('ASSESSMENT REPORT', 36, 110, { align: 'center', width: 523 });
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563eb')
        .text('ONLINE CODING ASSESSMENT PLATFORM', 36, 125, { align: 'center', width: 523 });

      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569')
        .text(`REPORT REF: CAP-${Date.now().toString(36).toUpperCase()}`, 400, 112, { align: 'right' });
      doc.font('Helvetica').fontSize(7).fillColor('#64748b')
        .text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 400, 122, { align: 'right' });

      // STUDENT & ASSESSMENT DETAILS Card
      let currentY = 138;
      doc.rect(36, currentY, 523, 76).fill('#f8fafc').strokeColor('#bae6fd').lineWidth(0.75).stroke();

      // Card Header Banner
      doc.rect(36, currentY, 523, 18).fill('#eff6ff');
      doc.fillColor('#0369a1').fontSize(8).font('Helvetica-Bold')
        .text('STUDENT & ASSESSMENT DETAILS', 46, currentY + 5);

      const rollNumber = student.studentProfile?.rollNumber || '312824104000';
      const batchName = student.studentProfile?.batch?.name || 'CSE - 2026';
      const primaryAssessment = filteredResults[0]?.assessment;
      const topicName = primaryAssessment?.title || 'Advanced Data Structures & Algorithms';
      const completionTime = filteredResults[0]
        ? `${Math.floor(filteredResults[0].timeTaken / 60)}m ${filteredResults[0].timeTaken % 60}s`
        : '00:45:00';
      const scoreDisplay = filteredResults[0]
        ? `${filteredResults[0].obtainedMarks} / ${filteredResults[0].totalMarks}`
        : `${totalMarksObtained} / ${totalMarksPossible}`;
      const facultyName = 'Mrs. VARSHA';
      const assessmentDate = filteredResults[0]
        ? new Date(filteredResults[0].submittedAt).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

      // Left Column
      doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
      doc.text('Student Name', 46, currentY + 24);
      doc.text(':', 155, currentY + 24);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(student.name, 165, currentY + 24);

      doc.font('Helvetica').fillColor('#475569').text('Register Number', 46, currentY + 36);
      doc.text(':', 155, currentY + 36);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(rollNumber, 165, currentY + 36);

      doc.font('Helvetica').fillColor('#475569').text('Class / Section', 46, currentY + 48);
      doc.text(':', 155, currentY + 48);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(batchName, 165, currentY + 48);

      doc.font('Helvetica').fillColor('#475569').text('Assessment Topic / Subject', 46, currentY + 60);
      doc.text(':', 155, currentY + 60);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(topicName.slice(0, 24), 165, currentY + 60);

      // Right Column
      doc.font('Helvetica').fillColor('#475569').text('Assessment Date', 310, currentY + 24);
      doc.text(':', 395, currentY + 24);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(assessmentDate, 405, currentY + 24);

      doc.font('Helvetica').fillColor('#475569').text('Completion Time', 310, currentY + 36);
      doc.text(':', 395, currentY + 36);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(completionTime, 405, currentY + 36);

      doc.font('Helvetica').fillColor('#475569').text('Assessment Score', 310, currentY + 48);
      doc.text(':', 395, currentY + 48);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(scoreDisplay, 405, currentY + 48);

      doc.font('Helvetica').fillColor('#475569').text('Faculty Name', 310, currentY + 60);
      doc.text(':', 395, currentY + 60);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(facultyName, 405, currentY + 60);

      // PERFORMANCE SCORECARDS (4 Grid Cards)
      currentY = 222;
      const cardWidth = 124;
      const cardHeight = 46;
      const metrics = [
        { label: 'OVERALL AVERAGE', val: `${avgPercentage.toFixed(1)}%`, color: accentColor },
        { label: 'TESTS COMPLETED', val: `${completedAssessments}`, color: primaryColor },
        { label: 'TEST CASE ACCURACY', val: `${accuracy.toFixed(1)}%`, color: successColor },
        { label: 'PROBLEMS SOLVED', val: `${totalQuestionsSolved} / ${Math.max(1, totalQuestionsAttempted)}`, color: '#7c3aed' },
      ];

      metrics.forEach((m, idx) => {
        const x = 36 + idx * (cardWidth + 9);
        doc.rect(x, currentY, cardWidth, cardHeight).fill('#ffffff').strokeColor('#e2e8f0').lineWidth(1).stroke();
        doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text(m.label, x + 8, currentY + 8);
        doc.fillColor(m.color).fontSize(13).font('Helvetica-Bold').text(m.val, x + 8, currentY + 22);
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
   * Generates official Agni College of Technology "ASSESSMENT REPORT"
   * with exact 6 columns: S.NO, REGISTER NUMBER, NAME OF THE STUDENT, TEST MARKS, PASS/FAIL, ATTENDED HOURS
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
    assessmentDate?: string;
    conducted?: string;
    facultyName?: string;
    subjectName?: string;
    subjectCode?: string;
    records: Array<{
      sNo: number;
      registerNumber: string;
      studentName: string;
      testMarks: string | number;
      passFail: string;
      attendedHours: string | number;
      assignmentCompletion?: string;
      score?: string | number;
    }>;
  }): Promise<Buffer> {
    const institutionName = options.institutionName || 'AGNI COLLEGE OF TECHNOLOGY';
    const subHeader = options.subHeader || '(An Autonomous Institution, Affiliated to Anna University, Chennai.)';
    const accreditation = options.accreditation || "Approved by AICTE, Accredited by NAAC with 'A+' Grade";
    const location = options.location || 'OMR, Navalur, Thalambur, Chennai.-600130';
    const programme = options.programme || 'B.E. COMPUTER SCIENCE AND ENGINEERING';
    const batchSec = options.batchSec || '2024 / C';
    const assessmentDate =
      options.assessmentDate || options.dateOfEntry || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const conducted = options.conducted || '2 Hours';
    const facultyName = options.facultyName || 'Mrs. VARSHA';
    const subjectName = options.subjectName || 'PROBLEM SOLVING AND PYTHON PROGRAMMING';
    const records = options.records || [];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 36,
        size: 'A4',
        info: {
          Title: `Assessment Report - ${subjectName}`,
          Author: institutionName,
          Subject: 'ASSESSMENT REPORT',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const drawHeader = () => {
        // Logo Image
        let logoPath = path.resolve(process.cwd(), 'assets', 'agni_logo.png');
        if (!fs.existsSync(logoPath)) {
          logoPath = path.resolve(process.cwd(), 'backend', 'assets', 'agni_logo.png');
        }
        try {
          doc.image(logoPath, 36, 20, { width: 523 });
        } catch (e: any) {
          console.warn('Logo image not found or failed to load:', e.message);
        }

        // Institutional details below logo
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
          .text(institutionName, 36, 68, { align: 'center', width: 523 });
        doc.font('Helvetica').fontSize(8.5).fillColor('#000000')
          .text(subHeader, 36, 82, { align: 'center', width: 523 });
        doc.text(accreditation, 36, 94, { align: 'center', width: 523 });
        doc.text(location, 36, 106, { align: 'center', width: 523 });

        // Document Title
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000')
          .text('ASSESSMENT REPORT', 36, 126, { align: 'center', width: 523 });

        // Metadata 2-column, 3-row boxed grid (X: 36, Y: 144, width: 523, height: 48)
        const boxY = 144;
        doc.rect(36, boxY, 523, 48).strokeColor('#000000').lineWidth(0.75).stroke();
        // Vertical divider in the middle
        doc.moveTo(36 + 261.5, boxY).lineTo(36 + 261.5, boxY + 48).strokeColor('#000000').lineWidth(0.75).stroke();
        // Horizontal dividers
        doc.moveTo(36, boxY + 16).lineTo(559, boxY + 16).strokeColor('#000000').lineWidth(0.75).stroke();
        doc.moveTo(36, boxY + 32).lineTo(559, boxY + 32).strokeColor('#000000').lineWidth(0.75).stroke();

        doc.fontSize(8);
        // Row 1
        doc.font('Helvetica-Bold').text('PROGRAMME : ', 42, boxY + 4, { continued: true }).font('Helvetica').text(programme);
        doc.font('Helvetica-Bold').text('BATCH / SEC. : ', 305, boxY + 4, { continued: true }).font('Helvetica').text(batchSec);

        // Row 2
        doc.font('Helvetica-Bold').text('Name of the Faculty : ', 42, boxY + 20, { continued: true }).font('Helvetica').text(facultyName);
        doc.font('Helvetica-Bold').text('Subject Name : ', 305, boxY + 20, { continued: true }).font('Helvetica').text(subjectName);

        // Row 3
        doc.font('Helvetica-Bold').text('ASSESSMENT DATE : ', 42, boxY + 36, { continued: true }).font('Helvetica').text(assessmentDate);
        doc.font('Helvetica-Bold').text('Conducted : ', 305, boxY + 36, { continued: true }).font('Helvetica').text(conducted);

        // Main Table Header (Y: 198, height: 26)
        const tableY = 198;
        doc.rect(36, tableY, 523, 26).strokeColor('#000000').lineWidth(0.75).stroke();

        const colLines = [72, 177, 369, 429, 494];
        colLines.forEach((x) => {
          doc.moveTo(x, tableY).lineTo(x, tableY + 26).strokeColor('#000000').lineWidth(0.75).stroke();
        });

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
        doc.text('S.NO', 36, tableY + 9, { width: 36, align: 'center' });
        doc.text('REGISTER NUMBER', 72, tableY + 9, { width: 105, align: 'center' });
        doc.text('NAME OF THE STUDENT', 177, tableY + 9, { width: 192, align: 'center' });
        doc.text('TEST MARKS', 369, tableY + 9, { width: 60, align: 'center' });
        doc.text('PASS/FAIL', 429, tableY + 9, { width: 65, align: 'center' });
        doc.text('ATTENDED\nHOURS', 494, tableY + 4, { width: 65, align: 'center' });

        return tableY + 26;
      };

      let currentY = drawHeader();
      const rowHeight = 24;
      const colLines = [72, 177, 369, 429, 494];

      // Draw rows (15 rows per page, matching template)
      for (let i = 0; i < records.length; i++) {
        if (i > 0 && i % 15 === 0) {
          doc.addPage();
          currentY = drawHeader();
        }

        const row = records[i];
        doc.rect(36, currentY, 523, rowHeight).strokeColor('#000000').lineWidth(0.75).stroke();

        colLines.forEach((x) => {
          doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).strokeColor('#000000').lineWidth(0.75).stroke();
        });

        doc.font('Helvetica').fontSize(8).fillColor('#000000');
        doc.text(row.sNo.toString(), 36, currentY + 7, { width: 36, align: 'center' });
        doc.font('Helvetica-Bold').text(row.registerNumber, 72, currentY + 7, { width: 105, align: 'center' });
        doc.font('Helvetica').text(row.studentName, 185, currentY + 7, { width: 176, align: 'left' });

        const isAb = row.testMarks === 'AB' || row.testMarks === '-';
        doc.font(isAb ? 'Helvetica' : 'Helvetica-Bold')
          .text(row.testMarks.toString(), 369, currentY + 7, { width: 60, align: 'center' });

        doc.font('Helvetica-Bold')
          .text(row.passFail, 429, currentY + 7, { width: 65, align: 'center' });

        doc.font('Helvetica')
          .text(row.attendedHours.toString(), 494, currentY + 7, { width: 65, align: 'center' });

        currentY += rowHeight;
      }

      // Pad remaining empty rows up to 15 on current page to match template
      const rowsOnCurrentPage = records.length % 15 === 0 && records.length > 0 ? 15 : records.length % 15;
      const emptyRowsNeeded = Math.max(0, 15 - rowsOnCurrentPage);
      for (let j = 0; j < emptyRowsNeeded; j++) {
        const nextSNo = records.length + j + 1;
        doc.rect(36, currentY, 523, rowHeight).strokeColor('#000000').lineWidth(0.75).stroke();
        colLines.forEach((x) => {
          doc.moveTo(x, currentY).lineTo(x, currentY + rowHeight).strokeColor('#000000').lineWidth(0.75).stroke();
        });
        doc.font('Helvetica').fontSize(8).fillColor('#000000');
        doc.text(nextSNo.toString(), 36, currentY + 7, { width: 36, align: 'center' });
        currentY += rowHeight;
      }

      // Signature block at bottom
      const sigY = 675;
      doc.moveTo(48, sigY).lineTo(210, sigY).lineWidth(0.75).strokeColor('#000000').stroke();
      doc.moveTo(380, sigY).lineTo(540, sigY).lineWidth(0.75).strokeColor('#000000').stroke();

      doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
      doc.text('Name of the Faculty', 48, sigY + 6);
      doc.text('Signature of the HoD.', 380, sigY + 6);

      doc.end();
    });
  }
}

export const pdfReportService = new PdfReportService();
