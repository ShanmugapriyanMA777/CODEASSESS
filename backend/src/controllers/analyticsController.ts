import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getAdminStats(req: AuthRequest, res: Response) {
  try {
    const [
      totalStudents,
      totalQuestions,
      totalAssessments,
      activeAssessments,
      results,
      questions,
      submissions,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.question.count(),
      prisma.assessment.count(),
      prisma.assessment.count({ where: { isPublished: true } }),
      prisma.assessmentResult.findMany(),
      prisma.question.findMany({ select: { id: true, difficulty: true, category: true } }),
      prisma.submission.findMany({
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          student: { select: { id: true, name: true, email: true } },
          question: { select: { id: true, title: true, marks: true } },
          assessment: { select: { id: true, title: true } },
        },
      }),
    ]);

    const completedAssessments = results.length;
    const avgScore = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : 0;

    const passCount = results.filter((r) => r.isPassed).length;
    const failCount = completedAssessments - passCount;

    // Difficulty breakdown
    const difficultyDist: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    const categoryDist: Record<string, number> = {};

    questions.forEach((q) => {
      difficultyDist[q.difficulty] = (difficultyDist[q.difficulty] || 0) + 1;
      categoryDist[q.category] = (categoryDist[q.category] || 0) + 1;
    });

    return sendSuccess(res, {
      cards: {
        totalStudents,
        totalQuestions,
        totalAssessments,
        activeAssessments,
        completedAssessments,
        averageScore: avgScore,
      },
      charts: {
        passFail: [
          { name: 'Passed', value: passCount, color: '#10b981' },
          { name: 'Failed', value: failCount, color: '#ef4444' },
        ],
        difficultyDistribution: Object.entries(difficultyDist).map(([key, count]) => ({
          difficulty: key,
          count,
        })),
        categoryDistribution: Object.entries(categoryDist).map(([category, count]) => ({
          category,
          count,
        })),
      },
      recentSubmissions: submissions,
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch admin statistics', 500);
  }
}

export async function getStudentAnalytics(req: AuthRequest, res: Response) {
  try {
    const studentId = req.user?.role === 'STUDENT' ? req.user.id : (req.query.studentId as string);

    if (!studentId) {
      return sendError(res, 'Student ID is required', 400);
    }

    const [results, submissions] = await Promise.all([
      prisma.assessmentResult.findMany({
        where: { studentId },
        include: { assessment: { select: { title: true } } },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.submission.findMany({
        where: { studentId },
        include: { question: { select: { category: true, marks: true } } },
      }),
    ]);

    const totalAssessments = results.length;
    const avgScore = results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : 0;
    const highestScore = results.reduce((max, r) => Math.max(max, r.percentage), 0);
    const lowestScore = results.length > 0 ? results.reduce((min, r) => Math.min(min, r.percentage), 100) : 0;

    const totalQuestionsAttempted = results.reduce((acc, r) => acc + r.questionsAttempted, 0);
    const totalQuestionsSolved = results.reduce((acc, r) => acc + r.questionsSolved, 0);

    const totalTestCases = results.reduce((acc, r) => acc + r.totalTestCases, 0);
    const passedTestCases = results.reduce((acc, r) => acc + r.testCasesPassed, 0);
    const accuracy = totalTestCases > 0 ? Math.round((passedTestCases / totalTestCases) * 100) : 0;

    // Timeline chart data
    const scoreOverTime = results.map((r, idx) => ({
      name: `Assessment ${idx + 1}`,
      title: r.assessment.title,
      score: r.percentage,
      marks: r.obtainedMarks,
      date: new Date(r.submittedAt).toLocaleDateString(),
    }));

    // Topic performance
    const topicMap: Record<string, { total: number; passed: number }> = {};
    submissions.forEach((s) => {
      const cat = s.question.category || 'General';
      if (!topicMap[cat]) topicMap[cat] = { total: 0, passed: 0 };
      topicMap[cat].total += s.totalTestCases;
      topicMap[cat].passed += s.testCasesPassed;
    });

    const topicWise = Object.entries(topicMap).map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0,
      totalCases: data.total,
      passedCases: data.passed,
    }));

    return sendSuccess(res, {
      summary: {
        totalAssessments,
        avgScore,
        highestScore,
        lowestScore,
        totalQuestionsAttempted,
        totalQuestionsSolved,
        accuracy,
        passedTestCases,
        totalTestCases,
      },
      charts: {
        scoreOverTime,
        topicWise,
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch student analytics', 500);
  }
}

export async function getQuestionAnalysis(req: AuthRequest, res: Response) {
  try {
    const questions = await prisma.question.findMany({
      include: {
        submissions: {
          select: { status: true, marks: true, executionTime: true },
        },
      },
    });

    const analysis = questions.map((q) => {
      const attempts = q.submissions.length;
      const successfulAttempts = q.submissions.filter((s) => s.status === 'ACCEPTED').length;
      const successRate = attempts > 0 ? Math.round((successfulAttempts / attempts) * 100) : 0;
      const avgMarks = attempts > 0
        ? Math.round((q.submissions.reduce((acc, s) => acc + s.marks, 0) / attempts) * 10) / 10
        : 0;
      const avgExecutionTime = attempts > 0
        ? Math.round(q.submissions.reduce((acc, s) => acc + s.executionTime, 0) / attempts)
        : 0;

      return {
        id: q.id,
        title: q.title,
        category: q.category,
        difficulty: q.difficulty,
        marks: q.marks,
        attempts,
        successfulAttempts,
        successRate,
        avgMarks,
        avgExecutionTime,
      };
    });

    return sendSuccess(res, analysis);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch question analysis', 500);
  }
}
