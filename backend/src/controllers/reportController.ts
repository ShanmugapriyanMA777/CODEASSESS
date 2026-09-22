import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { pdfReportService } from '../services/pdfReportService.js';
import { logAuditEvent } from '../utils/audit.js';

export async function downloadStudentPdfReport(req: AuthRequest, res: Response) {
  try {
    const { studentId } = req.params;
    const { assessmentId } = req.query;

    // Report downloads are strictly restricted to Administrators
    if (req.user?.role !== 'ADMIN') {
      return sendError(res, 'Access denied. Report downloads are restricted to administrators only.', 403);
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
      assessmentResults: assessment ? {
        where: { assessmentId: assessment.id },
      } : true,
      attempts: assessment ? {
        where: { assessmentId: assessment.id },
      } : true,
    },
    orderBy: [
      { studentProfile: { rollNumber: 'asc' } },
      { name: 'asc' },
    ],
  });

  // 4. Map into the 5 target columns:
  // S.NO | REGISTER NUMBER | NAME OF THE STUDENT | ASSIGNMENT COMPLETION | SCORE
  let records = students.map((s) => {
    const res = s.assessmentResults?.[0];
    const attempt = s.attempts?.[0];

    let assignmentCompletion = 'Not Attempted';
    let score: string | number = 'AB';
    let isCompleted = false;

    if (res) {
      assignmentCompletion = 'Completed';
      score = Math.round(res.obtainedMarks);
      isCompleted = true;
    } else if (attempt && attempt.status === 'IN_PROGRESS') {
      assignmentCompletion = 'In Progress';
      score = 'AB';
    }

    return {
      registerNumber: s.studentProfile?.rollNumber || '312824104000',
      studentName: s.name.toUpperCase(),
      assignmentCompletion,
      score,
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
    assignmentCompletion: r.assignmentCompletion,
    score: r.score,
    isCompleted: r.isCompleted,
  }));

  const totalEnrolled = students.length;
  const totalCompleted = records.filter((r) => r.isCompleted).length;
  const totalAbsent = totalEnrolled - totalCompleted;

  const metadata = {
    institutionName: (institutionName as string) || 'AGNI COLLEGE OF TECHNOLOGY',
    subHeader: (subHeader as string) || '(An Autonomous Institution, Affiliated to Anna University, Chennai.)',
    accreditation: (accreditation as string) || "Approved by AICTE, Accredited by NAAC with 'A+' Grade",
    location: (location as string) || 'OMR, Navalur, Thalambur, Chennai.-600130',
    statementTitle: (statementTitle as string) || 'IAT1 - ODD SEMESTER - 2026',
    statementSub: (statementSub as string) || 'PORTAL MARK ENTRY STATEMENT',
    programme: (programme as string) || (batch ? `PROGRAMME : B.E. ${batch.name.toUpperCase()}` : 'PROGRAMME : B.E. COMPUTER SCIENCE AND ENGINEERING'),
    batchSec: (batchSec as string) || (batch ? `BATCH : ${batch.academicYear || '2024'} - SEC. : ${batch.code}` : 'BATCH : 2024 - SEC. : C'),
    dateOfEntry: (dateOfEntry as string) || new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
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
      `"${metadata.statementTitle}"`,
      `"${metadata.statementSub}"`,
      '',
      `"${metadata.programme}","${metadata.batchSec}","Date of Entry : ${metadata.dateOfEntry}"`,
      `"Subject Name : ${metadata.subjectName}","Subject Code : ${metadata.subjectCode}","Name of the Faculty : ${metadata.facultyName}"`,
      `"Total Enrolled : ${metadata.totalEnrolled}","Completed : ${metadata.totalCompleted}","Absent / Pending : ${metadata.totalAbsent}"`,
      '',
      'S.NO,REGISTER NUMBER,NAME OF THE STUDENT,ASSIGNMENT COMPLETION,SCORE',
    ];

    records.forEach((r) => {
      lines.push(`${r.sNo},${r.registerNumber},"${r.studentName.replace(/"/g, '""')}",${r.assignmentCompletion},${r.score}`);
    });

    lines.push('');
    lines.push(`"Name of the Faculty : ${metadata.facultyName}","","","","Signature of the HoD."`);

    const csvContent = lines.join('\r\n');
    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `portal_mark_entry_statement_${safeBatch}_${Date.now()}.csv`;

    await logAuditEvent({
      userId: req.user!.id,
      action: 'REPORT_GENERATED',
      entityType: 'REPORT',
      details: `Downloaded CSV Mark Entry Statement for ${metadata.batchName} (${metadata.subjectName})`,
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
      statementTitle: metadata.statementTitle,
      statementSub: metadata.statementSub,
      programme: metadata.programme,
      batchSec: metadata.batchSec,
      dateOfEntry: metadata.dateOfEntry,
      facultyName: metadata.facultyName,
      subjectName: metadata.subjectName,
      subjectCode: metadata.subjectCode,
      records,
    });

    const safeBatch = (metadata.batchName || 'Overall').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `portal_mark_entry_statement_${safeBatch}_${Date.now()}.pdf`;

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
