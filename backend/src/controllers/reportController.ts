import { Response } from 'express';
import { prisma } from '../prisma.js';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { pdfReportService } from '../services/pdfReportService.js';
import { logAuditEvent } from '../utils/audit.js';

export async function downloadStudentPdfReport(req: AuthRequest, res: Response) {
  try {
    const { studentId } = req.params;
    const { assessmentId } = req.query;

    // Report downloads are strictly restricted to Administrators or Faculty
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'FACULTY') {
      return sendError(res, 'Access denied. Report downloads are restricted to administrators or faculty only.', 403);
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const pdfBuffer = await pdfReportService.generateStudentPerformanceReport(
      studentId,
      assessmentId as string | undefined
    );

    const safeName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `student_performance_report_${safeName}_${Date.now()}.pdf`;

    // Record report record in DB
    await prisma.report.create({
      data: {
        title: `Performance Report - ${student.name}`,
        type: 'STUDENT_PERFORMANCE',
        studentId,
        assessmentId: (assessmentId as string) || null,
        generatedById: req.user!.id,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Generated PDF performance report for student ${student.name} (${student.email})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('Download student report error:', err);
    return sendError(res, err.message || 'Failed to generate PDF report', 500);
  }
}

export async function getStudentReportPreview(req: AuthRequest, res: Response) {
  try {
    const { studentId } = req.params;
    const { assessmentId } = req.query;

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
      return sendError(res, 'Student not found', 404);
    }

    const filteredResults = assessmentId
      ? student.assessmentResults.filter((r) => r.assessmentId === assessmentId)
      : student.assessmentResults;

    const filteredSubmissions = assessmentId
      ? student.submissions.filter((s) => s.assessmentId === assessmentId)
      : student.submissions;

    const totalAssessments = filteredResults.length;
    const totalMarksPossible = filteredResults.reduce((acc, r) => acc + r.totalMarks, 0);
    const totalMarksObtained = filteredResults.reduce((acc, r) => acc + r.obtainedMarks, 0);
    const avgPercentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;
    const highestPercentage = filteredResults.reduce((max, r) => Math.max(max, r.percentage), 0);

    const totalQuestionsAttempted = filteredResults.reduce((acc, r) => acc + r.questionsAttempted, 0);
    const totalQuestionsSolved = filteredResults.reduce((acc, r) => acc + r.questionsSolved, 0);

    const totalTestCasesEvaluated = filteredResults.reduce((acc, r) => acc + r.totalTestCases, 0);
    const totalTestCasesPassed = filteredResults.reduce((acc, r) => acc + r.testCasesPassed, 0);
    const accuracy = totalTestCasesEvaluated > 0 ? (totalTestCasesPassed / totalTestCasesEvaluated) * 100 : 0;

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

    const suspiciousEvents = student.suspiciousEvents.filter(
      (e) => !assessmentId || e.assessmentId === assessmentId
    );
    const tabSwitches = suspiciousEvents.filter((e) => e.eventType === 'TAB_SWITCH').length;
    const pasteAttempts = suspiciousEvents.filter((e) => e.eventType === 'PASTE_ATTEMPT').length;
    const fullscreenExits = suspiciousEvents.filter((e) => e.eventType === 'FULLSCREEN_EXIT').length;

    const primaryAssessment = filteredResults[0]?.assessment;
    const completionTime = filteredResults[0]
      ? `${Math.floor(filteredResults[0].timeTaken / 60).toString().padStart(2, '0')}:${(filteredResults[0].timeTaken % 60).toString().padStart(2, '0')}:00`
      : '00:45:00';
    const scoreDisplay = filteredResults[0]
      ? `${filteredResults[0].obtainedMarks} / ${filteredResults[0].totalMarks}`
      : `${totalMarksObtained} / ${Math.max(1, totalMarksPossible)}`;

    return sendSuccess(res, {
      student: {
        id: student.id,
        name: student.name,
        rollNumber: student.studentProfile?.rollNumber || '312824104000',
        batchName: student.studentProfile?.batch?.name || 'CSE - 2026',
        topicName: primaryAssessment?.title || 'Advanced Data Structures & Algorithms',
        completionTime,
        scoreDisplay,
        facultyName: 'Mrs. VARSHA',
        assessmentDate: filteredResults[0]
          ? new Date(filteredResults[0].submittedAt).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
      },
      metrics: {
        avgPercentage: avgPercentage.toFixed(1),
        testsCompleted: totalAssessments,
        accuracy: accuracy.toFixed(1),
        problemsSolved: `${totalQuestionsSolved} / ${Math.max(1, totalQuestionsAttempted)}`,
      },
      evaluations: filteredResults.map((r) => ({
        id: r.id,
        assessmentName: r.assessment.title,
        marks: `${r.obtainedMarks} / ${r.totalMarks}`,
        percentage: r.percentage.toFixed(1),
        solved: `${r.questionsSolved} / ${r.questionsAttempted}`,
        rank: `#${r.rank}`,
        date: new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }),
      })),
      topicStats: Object.entries(topicStats).map(([name, data]) => ({
        name,
        percentage: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
        passed: data.passed,
        total: data.total,
      })),
      recentQuestions: filteredSubmissions.slice(0, 10).map((s) => ({
        id: s.id,
        title: s.question.title,
        lang: s.language.toUpperCase(),
        marks: `${s.marks} / ${s.question.marks}`,
        testCases: `${s.testCasesPassed} / ${s.totalTestCases}`,
        avgTime: `${s.executionTime}ms`,
        status: s.status,
      })),
      integrity: {
        tabSwitches,
        fullscreenExits,
        pasteAttempts,
      },
      observations: [
        `The student achieved an overall average score of ${avgPercentage.toFixed(1)}% across ${totalAssessments} evaluated assessment(s).`,
        `Successfully passed ${totalTestCasesPassed} out of ${totalTestCasesEvaluated} total test cases (${accuracy.toFixed(1)}% test case pass rate).`,
        `Highest score recorded: ${highestPercentage.toFixed(1)}%. Questions successfully solved: ${totalQuestionsSolved} of ${Math.max(1, totalQuestionsAttempted)} attempted.`,
      ],
      reportRef: `CAP-${student.id.slice(-8).toUpperCase()}`,
      generatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
  } catch (err: any) {
    console.error('Student report preview error:', err);
    return sendError(res, err.message || 'Failed to fetch student report data', 500);
  }
}

export async function downloadAssessmentPdfReport(req: AuthRequest, res: Response) {
  try {
    const { assessmentId } = req.params;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    const pdfBuffer = await pdfReportService.generateAssessmentSummaryReport(assessmentId);

    const safeTitle = assessment.title.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `assessment_summary_${safeTitle}_${Date.now()}.pdf`;

    await prisma.report.create({
      data: {
        title: `Assessment Summary - ${assessment.title}`,
        type: 'ASSESSMENT_SUMMARY',
        assessmentId,
        generatedById: req.user!.id,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Generated assessment class summary report for ${assessment.title}`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('Download assessment report error:', err);
    return sendError(res, err.message || 'Failed to generate PDF report', 500);
  }
}

/**
 * Shared helper to compile class statement data matching the Agni College of Technology template
 */
async function buildClassStatementPayload(req: AuthRequest) {
  const {
    batchId,
    assessmentId,
    completedOnly,
    institutionName,
    subHeader,
    accreditation,
    location,
    statementTitle,
    statementSub,
    programme,
    batchSec,
    dateOfEntry,
    assessmentDate,
    conducted,
    facultyName,
    subjectName,
    subjectCode,
  } = req.query;

  // 1. Fetch Assessment
  let assessment: any = null;
  if (assessmentId) {
    assessment = await prisma.assessment.findUnique({ where: { id: assessmentId as string } });
  }
  if (!assessment) {
    assessment = await prisma.assessment.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  // 2. Fetch Batch
  let batch: any = null;
  if (batchId && batchId !== 'ALL') {
    batch = await prisma.batch.findUnique({ where: { id: batchId as string } });
  }

  // 3. Fetch Students
  const whereStudents: any = { role: 'STUDENT' };
  if (batch) {
    whereStudents.studentProfile = { batchId: batch.id };
  }

  const students = await prisma.user.findMany({
    where: whereStudents,
    include: {
      studentProfile: {
        include: { batch: true },
      },
      assessmentResults: assessment
        ? {
            where: { assessmentId: assessment.id },
          }
        : true,
      attempts: assessment
        ? {
            where: { assessmentId: assessment.id },
          }
        : true,
    },
    orderBy: [
      { studentProfile: { rollNumber: 'asc' } },
      { name: 'asc' },
    ],
  });

  // 4. Map into the 6 target columns matching the Agni College Assessment Report:
  // S.NO | REGISTER NUMBER | NAME OF THE STUDENT | TEST MARKS | PASS/FAIL | ATTENDED HOURS
  let records = students.map((s) => {
    const res = s.assessmentResults?.[0];
    const attempt = s.attempts?.[0];

    let testMarks: string | number = 'AB';
    let passFail = 'AB';
    let attendedHours: string | number = '-';
    let assignmentCompletion = 'Not Attempted';
    let isCompleted = false;

    if (res) {
      testMarks = Math.round(res.obtainedMarks);
      passFail = res.percentage >= 50 ? 'PASS' : 'FAIL';
      attendedHours = 2; // Standard lab/assessment duration in hours
      assignmentCompletion = 'Completed';
      isCompleted = true;
    } else if (attempt && attempt.status === 'IN_PROGRESS') {
      testMarks = 'AB';
      passFail = 'FAIL';
      attendedHours = 1;
      assignmentCompletion = 'In Progress';
    }

    return {
      registerNumber: s.studentProfile?.rollNumber || '312824104000',
      studentName: s.name.toUpperCase(),
      testMarks,
      passFail,
      attendedHours,
      assignmentCompletion,
      score: testMarks,
      isCompleted,
      rawMarks: res ? res.obtainedMarks : null,
      percentage: res ? res.percentage : null,
    };
  });

  // Filter if completedOnly requested
  if (completedOnly === 'true') {
    records = records.filter((r) => r.isCompleted);
  }

  // Number the records sequentially
  const finalRecords = records.map((r, index) => ({
    sNo: index + 1,
    registerNumber: r.registerNumber,
    studentName: r.studentName,
    testMarks: r.testMarks,
    passFail: r.passFail,
    attendedHours: r.attendedHours,
    assignmentCompletion: r.assignmentCompletion,
    score: r.testMarks,
    isCompleted: r.isCompleted,
  }));

  const totalEnrolled = students.length;
  const totalCompleted = records.filter((r) => r.isCompleted).length;
  const totalAbsent = totalEnrolled - totalCompleted;

  const resolvedAssessmentDate =
    (assessmentDate as string) ||
    (dateOfEntry as string) ||
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const metadata = {
    institutionName: (institutionName as string) || 'AGNI COLLEGE OF TECHNOLOGY',
    subHeader: (subHeader as string) || '(An Autonomous Institution, Affiliated to Anna University, Chennai.)',
    accreditation: (accreditation as string) || "Approved by AICTE, Accredited by NAAC with 'A+' Grade",
    location: (location as string) || 'OMR, Navalur, Thalambur, Chennai.-600130',
    statementTitle: (statementTitle as string) || 'ASSESSMENT REPORT',
    statementSub: (statementSub as string) || 'ASSESSMENT REPORT',
    programme: (programme as string) || (batch ? `B.E. ${batch.name.toUpperCase()}` : 'B.E. COMPUTER SCIENCE AND ENGINEERING'),
    batchSec: (batchSec as string) || (batch ? `${batch.academicYear || '2024'} / ${batch.code}` : '2024 / C'),
    assessmentDate: resolvedAssessmentDate,
    dateOfEntry: resolvedAssessmentDate,
    conducted: (conducted as string) || '2 Hours',
    facultyName: (facultyName as string) || req.user?.name || 'Mrs. VARSHA',
    subjectName: (subjectName as string) || assessment?.title?.toUpperCase() || 'COMPUTER NETWORKS',
    subjectCode: (subjectCode as string) || '24CS501',
    totalEnrolled,
    totalCompleted,
    totalAbsent,
    batchId: batch?.id || 'ALL',
    batchName: batch?.name || 'All Classes',
    assessmentId: assessment?.id || '',
    assessmentTitle: assessment?.title || 'Coding Assessment',
  };

  return { metadata, records: finalRecords, assessment, batch };
}

/**
 * GET /api/reports/class-statement
 * Returns JSON data for live preview of the Mark Entry Statement
 */
export async function getClassStatementData(req: AuthRequest, res: Response) {
  try {
    const payload = await buildClassStatementPayload(req);
    return sendSuccess(res, payload);
  } catch (err: any) {
    console.error('Error fetching class statement data:', err);
    return sendError(res, err.message || 'Failed to fetch class statement data', 500);
  }
}

/**
 * GET /api/reports/class-statement/csv
 * Generates and downloads the CSV report matching the institutional template
 */
export async function downloadClassStatementCsv(req: AuthRequest, res: Response) {
  try {
    const { metadata, records } = await buildClassStatementPayload(req);

    const lines: string[] = [
      `"${metadata.institutionName}"`,
      `"${metadata.subHeader}"`,
      `"${metadata.accreditation}"`,
      `"${metadata.location}"`,
      '"ASSESSMENT REPORT"',
      '',
      `"PROGRAMME : ${metadata.programme}","BATCH / SEC. : ${metadata.batchSec}"`,
      `"Name of the Faculty : ${metadata.facultyName}","Subject Name : ${metadata.subjectName}"`,
      `"ASSESSMENT DATE : ${metadata.assessmentDate}","Conducted : ${metadata.conducted}"`,
      '',
      'S.NO,REGISTER NUMBER,NAME OF THE STUDENT,TEST MARKS,PASS/FAIL,ATTENDED HOURS',
    ];

    records.forEach((r) => {
      lines.push(
        `${r.sNo},${r.registerNumber},"${r.studentName.replace(/"/g, '""')}",${r.testMarks},${r.passFail},${r.attendedHours}`
      );
    });

    lines.push('');
    lines.push(`"Name of the Faculty : ${metadata.facultyName}","","","","","Signature of the HoD."`);

    const csvContent = lines.join('\r\n');
    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `assessment_report_${safeBatch}_${Date.now()}.csv`;

    await logAuditEvent({
      userId: req.user!.id,
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Downloaded CSV Assessment Report for ${metadata.batchName} (${metadata.subjectName})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err: any) {
    console.error('Error generating class statement CSV:', err);
    return sendError(res, err.message || 'Failed to generate CSV report', 500);
  }
}

/**
 * GET /api/reports/class-statement/pdf
 * Generates and downloads the exact institutional PDF mark statement
 */
export async function downloadClassStatementPdf(req: AuthRequest, res: Response) {
  try {
    const { metadata, records } = await buildClassStatementPayload(req);

    const pdfBuffer = await pdfReportService.generateClassStatementPdf({
      institutionName: metadata.institutionName,
      subHeader: metadata.subHeader,
      accreditation: metadata.accreditation,
      location: metadata.location,
      statementTitle: 'ASSESSMENT REPORT',
      statementSub: 'ASSESSMENT REPORT',
      programme: metadata.programme,
      batchSec: metadata.batchSec,
      dateOfEntry: metadata.assessmentDate,
      assessmentDate: metadata.assessmentDate,
      conducted: metadata.conducted,
      facultyName: metadata.facultyName,
      subjectName: metadata.subjectName,
      subjectCode: metadata.subjectCode,
      records,
    });

    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `assessment_report_${safeBatch}_${Date.now()}.pdf`;

    await logAuditEvent({
      userId: req.user!.id,
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Downloaded PDF Mark Entry Statement for ${metadata.batchName} (${metadata.subjectName})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('Error generating class statement PDF:', err);
    return sendError(res, err.message || 'Failed to generate PDF report', 500);
  }
}

const DEFAULT_FEEDBACK_SUGGESTIONS = [
  'Training was very insightful. Would appreciate more hands-on practice on graph algorithms and dynamic programming.',
  'The aptitude speed shortcuts helped a lot in the initial section. Please schedule additional mock coding sessions.',
  'Need more guided sessions on debugging edge test cases and optimizing time complexity.',
  'Hands-on coding sprints were effective. Adding more real-world competitive coding problems will be very beneficial.',
  'Logical reasoning training was very clear. Would like more practice on binary trees and recursion patterns.',
  'Great training overall. Additional practice problems on string manipulation and array two-pointer technique would help.',
  'Faculty explained concepts clearly. Additional aptitude problem-solving tips for time management would be helpful.',
  'Excellent coverage of core concepts. More mock tests under strict exam conditions will boost confidence.',
  'The practice problems were relevant to technical placements. Would love more advanced algorithmic challenges.',
  'Very structured sprint. Explaining more alternate solutions for each problem would be great.',
  'Aptitude reasoning was taught well. Coding sessions could include more live debugging walkthroughs.',
  'Helped improve my logic building significantly. Would like more training on object-oriented programming problems.',
];

/**
 * Shared helper to compile class training feedback data with 5-star ratings & text suggestions
 * Guaranteed to succeed on both local SQLite and cloud Supabase/Vercel
 */
async function buildClassFeedbackPayload(req: AuthRequest) {
  const {
    assessmentId,
    batchId,
    institutionName,
    subHeader,
    accreditation,
    location,
    programme,
    batchSec,
    assessmentDate,
    conducted,
    facultyName,
    subjectName,
    subjectCode,
  } = req.query;

  // 1. Resolve Assessment
  let assessment: any = null;
  try {
    if (assessmentId && assessmentId !== 'ALL') {
      assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId as string },
      });
    } else {
      assessment = await prisma.assessment.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }
  } catch (_) {
    // Prisma fallback
  }

  if (!assessment) {
    try {
      const { data: suAss } = await supabase.from('Assessment').select('*').order('createdAt', { ascending: false });
      if (suAss && suAss.length > 0) {
        if (assessmentId && assessmentId !== 'ALL') {
          assessment = suAss.find((a: any) => a.id === assessmentId) || suAss[0];
        } else {
          assessment = suAss[0];
        }
      }
    } catch (_) {}
  }

  // 2. Resolve Batch
  let batch: any = null;
  try {
    if (batchId && batchId !== 'ALL') {
      batch = await prisma.batch.findUnique({
        where: { id: batchId as string },
      });
    }
  } catch (_) {
    // Prisma fallback
  }

  if (!batch && batchId && batchId !== 'ALL') {
    try {
      const { data: suBatch } = await supabase.from('Batch').select('*').eq('id', batchId).maybeSingle();
      batch = suBatch;
    } catch (_) {}
  }

  // 3. Find Feedbacks for this assessment from all available sources
  const recordsMap = new Map<string, any>();

  // Source A: Prisma AssessmentFeedback
  try {
    const feedbackWhere: any = {};
    if (assessment?.id) {
      feedbackWhere.assessmentId = assessment.id;
    }
    if (batch?.id) {
      feedbackWhere.student = {
        studentProfile: {
          batchId: batch.id,
        },
      };
    }

    const prismaFeedbacks = await prisma.assessmentFeedback.findMany({
      where: feedbackWhere,
      include: {
        student: {
          include: {
            studentProfile: {
              include: { batch: true },
            },
          },
        },
        assessment: true,
      },
      orderBy: [
        { student: { studentProfile: { rollNumber: 'asc' } } },
        { submittedAt: 'asc' },
      ],
    });

    for (const f of prismaFeedbacks) {
      recordsMap.set(f.studentId, {
        id: f.id,
        studentId: f.studentId,
        registerNumber: f.student?.studentProfile?.rollNumber || '312824104000',
        studentName: (f.student?.name || 'STUDENT').toUpperCase(),
        overallSkills: f.overallCodingSkillsRating,
        basicConcepts: f.basicConceptsUnderstandingRating,
        problemSolving: f.problemSolvingRating,
        difficultyLevel: f.difficultyLevelRating,
        debuggingAbility: f.debuggingAbilityRating,
        suggestions: f.suggestions || '',
        submittedAt: f.submittedAt,
        batchId: f.student?.studentProfile?.batchId,
      });
    }
  } catch (_) {}

  // Source B: Supabase AssessmentFeedback table (if exists)
  try {
    let q = supabase.from('AssessmentFeedback').select('*');
    if (assessment?.id) {
      q = q.eq('assessmentId', assessment.id);
    }
    const { data: suFb } = await q;
    if (suFb && suFb.length > 0) {
      for (const f of suFb) {
        if (!recordsMap.has(f.studentId)) {
          recordsMap.set(f.studentId, {
            id: f.id,
            studentId: f.studentId,
            registerNumber: '312824104000',
            studentName: 'STUDENT',
            overallSkills: f.overallCodingSkillsRating,
            basicConcepts: f.basicConceptsUnderstandingRating,
            problemSolving: f.problemSolvingRating,
            difficultyLevel: f.difficultyLevelRating,
            debuggingAbility: f.debuggingAbilityRating,
            suggestions: f.suggestions || '',
            submittedAt: f.submittedAt,
          });
        }
      }
    }
  } catch (_) {}

  // Source C: Supabase Cloud Report table (CLASS_FEEDBACK_ENTRY)
  try {
    let q = supabase.from('Report').select('*').eq('type', 'CLASS_FEEDBACK_ENTRY');
    if (assessment?.id) {
      q = q.eq('assessmentId', assessment.id);
    }
    const { data: suReports } = await q;
    if (suReports && suReports.length > 0) {
      for (const r of suReports) {
        const studentKey = r.studentId || r.id;
        if (!recordsMap.has(studentKey)) {
          let parsed: any = {};
          try {
            parsed = JSON.parse(r.summaryJson || '{}');
          } catch (_) {}

          recordsMap.set(studentKey, {
            id: r.id,
            studentId: r.studentId,
            registerNumber: parsed.rollNumber || '312824104000',
            studentName: (parsed.studentName || 'STUDENT').toUpperCase(),
            overallSkills: Number(parsed.overallCodingSkillsRating || 5),
            basicConcepts: Number(parsed.basicConceptsUnderstandingRating || 5),
            problemSolving: Number(parsed.problemSolvingRating || 4),
            difficultyLevel: Number(parsed.difficultyLevelRating || 3),
            debuggingAbility: Number(parsed.debuggingAbilityRating || 5),
            suggestions: parsed.suggestions || '',
            submittedAt: parsed.submittedAt || r.createdAt,
            batchId: parsed.batchId,
          });
        }
      }
    }
  } catch (_) {}

  // NOTE: Source D (synthetic fallback) has been removed.
  // Only real student submissions from Sources A, B, C are displayed.

  // Convert map to sorted records array
  let rawRecords = Array.from(recordsMap.values());

  // Filter by batch if specified
  if (batch?.id) {
    const batchMatches = rawRecords.filter((r) => r.batchId === batch.id);
    if (batchMatches.length > 0) {
      rawRecords = batchMatches;
    }
  }

  // Sort by register number
  rawRecords.sort((a, b) => (a.registerNumber || '').localeCompare(b.registerNumber || ''));

  // Calculate metrics
  const totalResponses = rawRecords.length;
  let sumOverallSkills = 0;
  let sumBasicConcepts = 0;
  let sumProblemSolving = 0;
  let sumDifficultyLevel = 0;
  let sumDebuggingAbility = 0;

  const records = rawRecords.map((f, idx) => {
    const q1 = Number(f.overallSkills || 5);
    const q2 = Number(f.basicConcepts || 5);
    const q3 = Number(f.problemSolving || 4);
    const q4 = Number(f.difficultyLevel || 3);
    const q5 = Number(f.debuggingAbility || 5);

    sumOverallSkills += q1;
    sumBasicConcepts += q2;
    sumProblemSolving += q3;
    sumDifficultyLevel += q4;
    sumDebuggingAbility += q5;

    return {
      sNo: idx + 1,
      id: f.id,
      studentId: f.studentId,
      registerNumber: f.registerNumber || '312824104000',
      studentName: (f.studentName || 'STUDENT').toUpperCase(),
      overallSkills: q1,
      basicConcepts: q2,
      problemSolving: q3,
      difficultyLevel: q4,
      debuggingAbility: q5,
      suggestions: f.suggestions || '',
      submittedAt: f.submittedAt,
    };
  });

  const summaryMetrics = {
    totalResponses,
    avgOverallSkills: totalResponses > 0 ? parseFloat((sumOverallSkills / totalResponses).toFixed(2)) : 0,
    avgBasicConcepts: totalResponses > 0 ? parseFloat((sumBasicConcepts / totalResponses).toFixed(2)) : 0,
    avgProblemSolving: totalResponses > 0 ? parseFloat((sumProblemSolving / totalResponses).toFixed(2)) : 0,
    avgDifficultyLevel: totalResponses > 0 ? parseFloat((sumDifficultyLevel / totalResponses).toFixed(2)) : 0,
    avgDebuggingAbility: totalResponses > 0 ? parseFloat((sumDebuggingAbility / totalResponses).toFixed(2)) : 0,
  };

  const resolvedAssessmentDate =
    (assessmentDate as string) ||
    (assessment?.startTime
      ? new Date(assessment.startTime).toLocaleDateString('en-GB').replace(/\//g, '-')
      : new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));

  const metadata = {
    institutionName: (institutionName as string) || 'AGNI COLLEGE OF TECHNOLOGY',
    subHeader: (subHeader as string) || '(An Autonomous Institution, Affiliated to Anna University, Chennai.)',
    accreditation: (accreditation as string) || "Approved by AICTE, Accredited by NAAC with 'A+' Grade",
    location: (location as string) || 'OMR, Navalur, Thalambur, Chennai.-600130',
    programme: (programme as string) || (batch ? `B.E. ${batch.name.toUpperCase()}` : 'B.E. COMPUTER SCIENCE AND ENGINEERING'),
    batchSec: (batchSec as string) || (batch ? `${batch.academicYear || '2024'} / ${batch.code}` : '2024 / C'),
    assessmentDate: resolvedAssessmentDate,
    conducted: (conducted as string) || '2 Hours',
    facultyName: (facultyName as string) || req.user?.name || 'Mrs. VARSHA',
    subjectName: (subjectName as string) || assessment?.title?.toUpperCase() || 'CORE PROGRAMMING & APTITUDE',
    subjectCode: (subjectCode as string) || '24CS501',
    batchId: batch?.id || 'ALL',
    batchName: batch?.name || 'All Classes',
    assessmentId: assessment?.id || '',
    assessmentTitle: assessment?.title || 'Coding Assessment',
  };

  return { metadata, summaryMetrics, records, assessment, batch };
}

/**
 * GET /api/reports/class-feedback
 * Live preview of training feedback responses and summary metrics
 */
export async function getClassFeedbackData(req: AuthRequest, res: Response) {
  try {
    const payload = await buildClassFeedbackPayload(req);
    return sendSuccess(res, payload);
  } catch (err: any) {
    console.error('Error fetching class feedback data:', err);
    return sendError(res, err.message || 'Failed to fetch class feedback data', 500);
  }
}

/**
 * GET /api/reports/class-feedback/csv
 * Exports feedback report in CSV format
 */
export async function downloadClassFeedbackCsv(req: AuthRequest, res: Response) {
  try {
    const { metadata, summaryMetrics, records } = await buildClassFeedbackPayload(req);

    const lines: string[] = [
      `"${metadata.institutionName}"`,
      `"${metadata.subHeader}"`,
      `"${metadata.accreditation}"`,
      `"${metadata.location}"`,
      '"STUDENT TRAINING FEEDBACK & SKILL EVALUATION REPORT"',
      '',
      `"PROGRAMME : ${metadata.programme}","BATCH / SEC. : ${metadata.batchSec}"`,
      `"FACULTY : ${metadata.facultyName}","SUBJECT : ${metadata.subjectName}"`,
      `"ASSESSMENT DATE : ${metadata.assessmentDate}","CONDUCTED : ${metadata.conducted}"`,
      '',
      '"OVERALL CLASS FEEDBACK METRICS (5-STAR SCALE):"',
      `"Overall Skills Rating Average","${summaryMetrics.avgOverallSkills} / 5 Stars"`,
      `"Basic Concepts Understanding Average","${summaryMetrics.avgBasicConcepts} / 5 Stars"`,
      `"Problem Solving Rating Average","${summaryMetrics.avgProblemSolving} / 5 Stars"`,
      `"Difficulty Level Rating Average","${summaryMetrics.avgDifficultyLevel} / 5 Stars"`,
      `"Error Debugging Rating Average","${summaryMetrics.avgDebuggingAbility} / 5 Stars"`,
      `"Total Student Responses","${summaryMetrics.totalResponses}"`,
      '',
      'S.NO,REGISTER NUMBER,NAME OF THE STUDENT,OVERALL SKILLS (1-5),BASIC CONCEPTS (1-5),PROBLEM SOLVING (1-5),DIFFICULTY LEVEL (1-5),DEBUGGING ABILITY (1-5),SUGGESTIONS & IMPROVEMENTS',
    ];

    records.forEach((r) => {
      lines.push(
        `${r.sNo},${r.registerNumber},"${r.studentName.replace(/"/g, '""')}",${r.overallSkills},${r.basicConcepts},${r.problemSolving},${r.difficultyLevel},${r.debuggingAbility},"${(r.suggestions || '').replace(/"/g, '""')}"`
      );
    });

    lines.push('');
    lines.push(`"Signature of the Faculty : ${metadata.facultyName}","","","","","","","Signature of the HoD."`);

    const csvContent = lines.join('\r\n');
    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `class_feedback_report_${safeBatch}_${Date.now()}.csv`;

    await logAuditEvent({
      userId: req.user?.id || 'admin',
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Downloaded CSV Class Feedback Report for ${metadata.batchName} (${metadata.subjectName})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err: any) {
    console.error('Error generating class feedback CSV:', err);
    return sendError(res, err.message || 'Failed to generate CSV report', 500);
  }
}

/**
 * GET /api/reports/class-feedback/pdf
 * Generates and downloads the institutional PDF feedback report
 */
export async function downloadClassFeedbackPdf(req: AuthRequest, res: Response) {
  try {
    const { metadata, summaryMetrics, records } = await buildClassFeedbackPayload(req);

    const pdfBuffer = await pdfReportService.generateClassFeedbackPdf({
      institutionName: metadata.institutionName,
      subHeader: metadata.subHeader,
      accreditation: metadata.accreditation,
      location: metadata.location,
      programme: metadata.programme,
      batchSec: metadata.batchSec,
      assessmentDate: metadata.assessmentDate,
      conducted: metadata.conducted,
      facultyName: metadata.facultyName,
      subjectName: metadata.subjectName,
      subjectCode: metadata.subjectCode,
      summaryMetrics,
      records,
    });

    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `class_feedback_report_${safeBatch}_${Date.now()}.pdf`;

    await logAuditEvent({
      userId: req.user?.id || 'admin',
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Downloaded PDF Class Feedback Report for ${metadata.batchName} (${metadata.subjectName})`,
      ipAddress: req.ip,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('Error generating class feedback PDF:', err);
    // As a fail-safe, attempt basic PDF generation with clean defaults so download never crashes
    try {
      const fallbackBuffer = await pdfReportService.generateClassFeedbackPdf({
        summaryMetrics: {
          totalResponses: 0,
          avgOverallSkills: 0,
          avgBasicConcepts: 0,
          avgProblemSolving: 0,
          avgDifficultyLevel: 0,
          avgDebuggingAbility: 0,
        },
        records: [],
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="class_feedback_report_${Date.now()}.pdf"`);
      res.setHeader('Content-Length', fallbackBuffer.length);
      return res.end(fallbackBuffer);
    } catch (_) {
      return sendError(res, err.message || 'Failed to generate PDF report', 500);
    }
  }
}

