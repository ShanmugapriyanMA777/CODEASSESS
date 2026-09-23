import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { rankingService } from '../services/rankingService.js';
import { resolveStudentDetails } from './assessmentController.js';

export async function finishAssessment(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user!.id;
    const { effectiveUserId, studentIdsToMatch } = await resolveStudentDetails(studentId, req.user?.email);
    const { assessmentId } = req.body;

    if (!assessmentId) {
      return sendError(res, 'assessmentId is required', 400);
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          include: {
            question: {
              include: { testCases: true },
            },
          },
        },
        attempts: {
          where: { studentId: { in: studentIdsToMatch } },
        },
      },
    });

    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    const attempt = assessment.attempts?.[0];
    const startTime = attempt ? new Date(attempt.startTime).getTime() : Date.now();
    const timeTaken = Math.max(10, Math.floor((Date.now() - startTime) / 1000));

    // Fetch all submissions by this student for this assessment
    const submissions = await prisma.submission.findMany({
      where: { assessmentId, studentId: { in: studentIdsToMatch } },
      orderBy: { submittedAt: 'desc' },
    });

    // Group by questionId, taking the best (highest marks) submission for each question
    const bestSubmissionsByQuestion: Record<string, typeof submissions[0]> = {};
    for (const sub of submissions) {
      if (!bestSubmissionsByQuestion[sub.questionId] || sub.marks > bestSubmissionsByQuestion[sub.questionId].marks) {
        bestSubmissionsByQuestion[sub.questionId] = sub;
      }
    }

    let totalMarks = assessment.totalMarks;
    let obtainedMarks = 0;
    let questionsAttempted = Object.keys(bestSubmissionsByQuestion).length;
    let questionsSolved = 0;
    let totalTestCases = 0;
    let testCasesPassed = 0;

    for (const aq of assessment.questions) {
      totalTestCases += aq.question.testCases.length;
      const bestSub = bestSubmissionsByQuestion[aq.questionId];

      if (bestSub) {
        obtainedMarks += bestSub.marks;
        testCasesPassed += bestSub.testCasesPassed;
        if (bestSub.status === 'ACCEPTED') {
          questionsSolved++;
        }
      }
    }

    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 1000) / 10 : 0;
    const isPassed = obtainedMarks >= assessment.passingMarks;

    // Upsert AssessmentResult
    const result = await prisma.assessmentResult.upsert({
      where: {
        assessmentId_studentId: { assessmentId, studentId: effectiveUserId },
      },
      update: {
        totalMarks,
        obtainedMarks,
        percentage,
        questionsAttempted,
        questionsSolved,
        testCasesPassed,
        totalTestCases,
        timeTaken,
        isPassed,
        submittedAt: new Date(),
      },
      create: {
        assessmentId,
        studentId: effectiveUserId,
        totalMarks,
        obtainedMarks,
        percentage,
        questionsAttempted,
        questionsSolved,
        testCasesPassed,
        totalTestCases,
        timeTaken,
        isPassed,
        submittedAt: new Date(),
      },
    });

    // Update Attempt status
    if (attempt) {
      await prisma.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'COMPLETED',
          submitTime: new Date(),
          remainingSeconds: 0,
        },
      });
    }

    // Update Assignment status
    await prisma.assessmentAssignment.updateMany({
      where: { assessmentId, studentId: { in: studentIdsToMatch } },
      data: { status: 'COMPLETED' },
    });

    // Recalculate rankings dynamically
    await rankingService.recalculateAssessmentRankings(assessmentId);

    const updatedResult = await prisma.assessmentResult.findUnique({
      where: { id: result.id },
      include: {
        assessment: { select: { title: true, totalMarks: true, passingMarks: true } },
      },
    });

    return sendSuccess(res, updatedResult, 'Assessment completed and graded successfully');
  } catch (err: any) {
    console.error('Finish assessment error:', err);
    return sendError(res, err.message || 'Failed to complete assessment', 500);
  }
}

export async function getResults(req: AuthRequest, res: Response) {
  try {
    const { assessmentId, batchId, search, sortBy = 'marks', sortOrder = 'desc' } = req.query;

    const where: any = {};
    if (assessmentId) where.assessmentId = assessmentId as string;

    if (batchId) {
      where.student = {
        studentProfile: { batchId: batchId as string },
      };
    }

    if (search) {
      where.student = {
        ...where.student,
        OR: [
          { name: { contains: search as string } },
          { email: { contains: search as string } },
        ],
      };
    }

    const results = await prisma.assessmentResult.findMany({
      where,
      include: {
        student: {
          include: {
            studentProfile: { include: { batch: true } },
          },
        },
        assessment: {
          select: { id: true, title: true, totalMarks: true, passingMarks: true, duration: true },
        },
      },
      orderBy: sortBy === 'time'
        ? { timeTaken: sortOrder === 'asc' ? 'asc' : 'desc' }
        : [
            { obtainedMarks: sortOrder === 'asc' ? 'asc' : 'desc' },
            { timeTaken: 'asc' },
          ],
    });

    return sendSuccess(res, results);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch results', 500);
  }
}

export async function getStudentResult(req: AuthRequest, res: Response) {
  try {
    const { assessmentId, studentId: requestedStudentId } = req.params;
    const rawStudentId = req.user?.role === 'STUDENT' ? req.user.id : requestedStudentId;
    const { effectiveUserId, studentIdsToMatch } = await resolveStudentDetails(rawStudentId, req.user?.email);

    const result = await prisma.assessmentResult.findFirst({
      where: {
        assessmentId,
        studentId: { in: studentIdsToMatch },
      },
      include: {
        assessment: {
          include: {
            questions: {
              include: {
                question: {
                  select: { id: true, title: true, category: true, difficulty: true, marks: true },
                },
              },
            },
          },
        },
        student: {
          include: { studentProfile: { include: { batch: true } } },
        },
      },
    });

    if (!result) {
      return sendError(res, 'Result not found for this candidate.', 404);
    }

    // Also fetch the candidate's submissions for this assessment
    const submissions = await prisma.submission.findMany({
      where: { assessmentId, studentId: { in: studentIdsToMatch } },
      include: {
        question: { select: { id: true, title: true, category: true, marks: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return sendSuccess(res, { result, submissions });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch student result', 500);
  }
}
