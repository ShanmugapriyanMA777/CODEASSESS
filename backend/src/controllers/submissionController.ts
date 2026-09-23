import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { evaluationService } from '../services/evaluationService.js';
import { resolveStudentDetails } from './assessmentController.js';

export async function runSampleCode(req: AuthRequest, res: Response) {
  try {
    const { questionId, language, sourceCode, customInput } = req.body;

    if (!questionId || !language || !sourceCode) {
      return sendError(res, 'questionId, language, and sourceCode are required', 400);
    }

    const evaluation = await evaluationService.runSampleTestCases(
      questionId,
      language,
      sourceCode,
      customInput
    );

    return sendSuccess(res, evaluation, 'Code executed against sample test cases');
  } catch (err: any) {
    console.error('Run code error:', err);
    return sendError(res, err.message || 'Execution failed', 500);
  }
}

export async function submitQuestionCode(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user!.id;
    const { effectiveUserId, studentIdsToMatch } = await resolveStudentDetails(studentId, req.user?.email);
    const { questionId, assessmentId, language, sourceCode } = req.body;

    if (!questionId || !language || !sourceCode) {
      return sendError(res, 'questionId, language, and sourceCode are required', 400);
    }

    // If assessmentId is provided, validate that the assessment is active and not expired
    if (assessmentId) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { attempts: { where: { studentId: { in: studentIdsToMatch } } } },
      });

      if (!assessment) {
        return sendError(res, 'Assessment not found', 404);
      }

      const attempt = assessment.attempts?.[0];
      if (attempt) {
        if (attempt.status === 'COMPLETED') {
          return sendError(res, 'Assessment has already been finalized and submitted.', 400);
        }

        const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
        const totalAllowedSeconds = assessment.duration * 60;
        if (elapsedSeconds > totalAllowedSeconds + 30) { // 30s grace period for network latency
          return sendError(res, 'Assessment time has expired. Your submission cannot be accepted.', 400);
        }
      }
    }

    const summary = await evaluationService.submitCode(
      effectiveUserId,
      questionId,
      language,
      sourceCode,
      assessmentId
    );

    return sendSuccess(res, summary, 'Code submitted and evaluated successfully');
  } catch (err: any) {
    console.error('Submit question error:', err);
    return sendError(res, err.message || 'Submission failed', 500);
  }
}

export async function autoSaveDraft(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user!.id;
    const { effectiveUserId, studentIdsToMatch } = await resolveStudentDetails(studentId, req.user?.email);
    const { assessmentId, questionId, code, language } = req.body;

    if (!assessmentId) {
      return sendError(res, 'assessmentId is required', 400);
    }

    let attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        assessmentId,
        studentId: { in: studentIdsToMatch },
      },
    });

    let currentDrafts: Record<string, { code: string; language: string; updatedAt: string }> = {};
    if (attempt && attempt.currentCodeDraftsJson) {
      try {
        currentDrafts = JSON.parse(attempt.currentCodeDraftsJson);
      } catch (e) {
        currentDrafts = {};
      }
    }

    if (questionId && code !== undefined) {
      currentDrafts[questionId] = {
        code,
        language: language || 'python',
        updatedAt: new Date().toISOString(),
      };
    }

    if (attempt) {
      attempt = await prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          currentCodeDraftsJson: JSON.stringify(currentDrafts),
        },
      });
    } else {
      attempt = await prisma.assessmentAttempt.create({
        data: {
          assessmentId,
          studentId: effectiveUserId,
          status: 'IN_PROGRESS',
          currentCodeDraftsJson: JSON.stringify(currentDrafts),
        },
      });
    }

    return sendSuccess(res, { savedAt: new Date().toISOString() }, 'Draft auto-saved');
  } catch (err: any) {
    return sendError(res, err.message || 'Auto-save failed', 500);
  }
}

export async function recordSuspiciousEvent(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user!.id;
    const { effectiveUserId, studentIdsToMatch } = await resolveStudentDetails(studentId, req.user?.email);
    const { assessmentId, eventType, metadata } = req.body;

    if (!assessmentId || !eventType) {
      return sendError(res, 'assessmentId and eventType are required', 400);
    }

    const event = await prisma.suspiciousEvent.create({
      data: {
        studentId: effectiveUserId,
        assessmentId,
        eventType, // "TAB_SWITCH" | "WINDOW_BLUR" | "FULLSCREEN_EXIT" | "PASTE_ATTEMPT" | "COPY_ATTEMPT"
        metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,
      },
    });

    // Increment suspicious count on attempt
    await prisma.assessmentAttempt.updateMany({
      where: { assessmentId, studentId: { in: studentIdsToMatch } },
      data: { suspiciousEventsCount: { increment: 1 } },
    });

    return sendSuccess(res, event, 'Proctoring event logged');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to record suspicious event', 500);
  }
}

export async function getSubmissions(req: AuthRequest, res: Response) {
  try {
    const { assessmentId, studentId, questionId, page = '1', limit = '30' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const take = parseInt(limit as string, 10) || 30;
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // If student, only their own submissions
    if (req.user?.role === 'STUDENT') {
      where.studentId = req.user.id;
    } else if (studentId) {
      where.studentId = studentId as string;
    }

    if (assessmentId) where.assessmentId = assessmentId as string;
    if (questionId) where.questionId = questionId as string;

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        skip,
        take,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, email: true } },
          question: { select: { id: true, title: true, difficulty: true, category: true, marks: true } },
          assessment: { select: { id: true, title: true } },
        },
      }),
    ]);

    return sendSuccess(res, {
      submissions,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch submissions', 500);
  }
}

export async function getSubmissionById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        question: true,
        assessment: true,
        testResults: {
          include: { testCase: true },
        },
      },
    });

    if (!submission) {
      return sendError(res, 'Submission not found', 404);
    }

    // Access guard: student can only view their own submission
    if (req.user?.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return sendError(res, 'Access denied', 403);
    }

    // If student, sanitize hidden test case output details
    if (req.user?.role === 'STUDENT') {
      submission.testResults = submission.testResults.map((tr) => {
        if (tr.isHidden) {
          return {
            ...tr,
            actualOutput: 'Hidden test evaluation',
            expectedOutput: 'Hidden test evaluation',
            testCase: {
              ...tr.testCase,
              input: 'Hidden',
              expectedOutput: 'Hidden',
            },
          };
        }
        return tr;
      });
    }

    return sendSuccess(res, submission);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch submission', 500);
  }
}
