import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/audit.js';

export async function getAssessments(req: AuthRequest, res: Response) {
  try {
    const isStudent = req.user?.role === 'STUDENT';
    const studentId = req.user?.id;

    if (isStudent && studentId) {
      // Find student's batch
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: studentId },
      });

      // Find assessments assigned to this student or their batch
      const assigned = await prisma.assessmentAssignment.findMany({
        where: {
          OR: [
            { studentId },
            ...(profile?.batchId ? [{ batchId: profile.batchId }] : []),
          ],
        },
        select: { assessmentId: true, status: true },
      });

      const assignedIds = Array.from(new Set(assigned.map((a) => a.assessmentId)));

      const assessments = await prisma.assessment.findMany({
        where: {
          id: { in: assignedIds },
          isPublished: true,
        },
        include: {
          questions: {
            include: {
              question: {
                select: { id: true, title: true, difficulty: true, category: true, marks: true },
              },
            },
            orderBy: { order: 'asc' },
          },
          attempts: {
            where: { studentId },
          },
          results: {
            where: { studentId },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, assessments);
    }

    // Admin view
    const assessments = await prisma.assessment.findMany({
      include: {
        questions: {
          include: {
            question: {
              select: { id: true, title: true, difficulty: true, category: true, marks: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            batch: { select: { id: true, name: true, code: true } },
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            results: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, assessments);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch assessments', 500);
  }
}

export async function getAssessmentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const isStudent = req.user?.role === 'STUDENT';
    const studentId = req.user?.id;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                testCases: {
                  where: isStudent ? { isHidden: false } : undefined,
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        assignments: {
          include: {
            batch: true,
            student: { select: { id: true, name: true, email: true } },
          },
        },
        attempts: studentId
          ? {
              where: { studentId },
            }
          : false,
        results: studentId
          ? {
              where: { studentId },
            }
          : false,
        _count: {
          select: { questions: true, assignments: true, results: true },
        },
      },
    });

    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    // If student, check if expired or validate attempt
    if (isStudent && studentId) {
      let attempt = assessment.attempts?.[0];

      // If no attempt yet and assessment is open, create or initialize attempt
      if (!attempt) {
        attempt = await prisma.assessmentAttempt.create({
          data: {
            assessmentId: assessment.id,
            studentId,
            status: 'IN_PROGRESS',
            remainingSeconds: assessment.duration * 60,
          },
        });
      }

      // Check backend timer expiration
      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
      const totalAllowedSeconds = assessment.duration * 60;
      const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      return sendSuccess(res, {
        ...assessment,
        currentAttempt: {
          ...attempt,
          remainingSeconds,
          isExpired: remainingSeconds <= 0,
        },
      });
    }

    return sendSuccess(res, assessment);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch assessment', 500);
  }
}

export async function createAssessment(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      instructions,
      duration = 60,
      startDate,
      endDate,
      totalMarks = 100,
      passingMarks = 40,
      allowedLanguages = 'python,java,c,cpp',
      randomizeQuestions = false,
      randomizeTestCases = false,
      maxAttempts = 1,
      disableCopyPaste = true,
      enforceFullscreen = true,
      trackTabSwitches = true,
      isPublished = false,
      questions = [], // array of { questionId, order, marks }
      batchIds = [],  // array of batch IDs to assign
      studentIds = [],// array of individual student IDs to assign
    } = req.body;

    if (!title) {
      return sendError(res, 'Assessment title is required', 400);
    }

    const calculatedTotalMarks = questions.reduce(
      (sum: number, q: any) => sum + (parseInt(q.marks, 10) || 10),
      0
    ) || parseInt(totalMarks, 10) || 100;

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description: description || '',
        instructions: instructions || 'Complete all coding challenges within the allotted time limit.',
        duration: parseInt(duration, 10) || 60,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalMarks: calculatedTotalMarks,
        passingMarks: parseInt(passingMarks, 10) || 40,
        allowedLanguages,
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeTestCases: Boolean(randomizeTestCases),
        maxAttempts: parseInt(maxAttempts, 10) || 1,
        disableCopyPaste: Boolean(disableCopyPaste),
        enforceFullscreen: Boolean(enforceFullscreen),
        trackTabSwitches: Boolean(trackTabSwitches),
        isPublished: Boolean(isPublished),
        createdById: req.user!.id,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            questionId: q.questionId,
            order: q.order !== undefined ? q.order : idx,
            marks: parseInt(q.marks, 10) || 10,
          })),
        },
      },
      include: {
        questions: { include: { question: true } },
      },
    });

    // Assign to batches and individual students
    const assignments: any[] = [];
    if (Array.isArray(batchIds)) {
      for (const bId of batchIds) {
        assignments.push({ assessmentId: assessment.id, batchId: bId });
      }
    }
    if (Array.isArray(studentIds)) {
      for (const sId of studentIds) {
        assignments.push({ assessmentId: assessment.id, studentId: sId });
      }
    }

    if (assignments.length > 0) {
      await prisma.assessmentAssignment.createMany({
        data: assignments,
      });
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_CREATED',
      entityType: 'ASSESSMENT',
      entityId: assessment.id,
      details: `Created assessment: ${assessment.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, assessment, 'Assessment created successfully', 201);
  } catch (err: any) {
    console.error('Create assessment error:', err);
    return sendError(res, err.message || 'Failed to create assessment', 500);
  }
}

export async function updateAssessment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      duration,
      startDate,
      endDate,
      totalMarks,
      passingMarks,
      allowedLanguages,
      randomizeQuestions,
      randomizeTestCases,
      maxAttempts,
      disableCopyPaste,
      enforceFullscreen,
      trackTabSwitches,
      isPublished,
      questions,
      batchIds,
      studentIds,
    } = req.body;

    // Update questions relation if provided
    if (Array.isArray(questions)) {
      await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: id } });
      await prisma.assessmentQuestion.createMany({
        data: questions.map((q: any, idx: number) => ({
          assessmentId: id,
          questionId: q.questionId,
          order: q.order !== undefined ? q.order : idx,
          marks: parseInt(q.marks, 10) || 10,
        })),
      });
    }

    // Update assignments if provided
    if (Array.isArray(batchIds) || Array.isArray(studentIds)) {
      await prisma.assessmentAssignment.deleteMany({ where: { assessmentId: id } });
      const newAssignments: any[] = [];
      if (batchIds) {
        for (const bId of batchIds) newAssignments.push({ assessmentId: id, batchId: bId });
      }
      if (studentIds) {
        for (const sId of studentIds) newAssignments.push({ assessmentId: id, studentId: sId });
      }
      if (newAssignments.length > 0) {
        await prisma.assessmentAssignment.createMany({ data: newAssignments });
      }
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(duration !== undefined && { duration: parseInt(duration, 10) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(totalMarks !== undefined && { totalMarks: parseInt(totalMarks, 10) }),
        ...(passingMarks !== undefined && { passingMarks: parseInt(passingMarks, 10) }),
        ...(allowedLanguages !== undefined && { allowedLanguages }),
        ...(randomizeQuestions !== undefined && { randomizeQuestions: Boolean(randomizeQuestions) }),
        ...(randomizeTestCases !== undefined && { randomizeTestCases: Boolean(randomizeTestCases) }),
        ...(maxAttempts !== undefined && { maxAttempts: parseInt(maxAttempts, 10) }),
        ...(disableCopyPaste !== undefined && { disableCopyPaste: Boolean(disableCopyPaste) }),
        ...(enforceFullscreen !== undefined && { enforceFullscreen: Boolean(enforceFullscreen) }),
        ...(trackTabSwitches !== undefined && { trackTabSwitches: Boolean(trackTabSwitches) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
      include: {
        questions: { include: { question: true } },
        assignments: true,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_UPDATED',
      entityType: 'ASSESSMENT',
      entityId: id,
      details: `Updated assessment: ${updated.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Assessment updated successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update assessment', 500);
  }
}

export async function deleteAssessment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const assessment = await prisma.assessment.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_DELETED',
      entityType: 'ASSESSMENT',
      entityId: id,
      details: `Deleted assessment: ${assessment.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Assessment deleted successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete assessment', 500);
  }
}
