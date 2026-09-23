import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/audit.js';
import { codeExecutionService } from '../services/codeExecutionService.js';
import { evaluationService } from '../services/evaluationService.js';

export async function getQuestions(req: AuthRequest, res: Response) {
  try {
    const { category, difficulty, search, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const take = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * take;

    const where: any = {};

    // Students only see published questions
    if (req.user?.role !== 'ADMIN') {
      where.isPublished = true;
    }

    if (category && category !== 'All') {
      where.category = category as string;
    }

    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty as string;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          testCases: {
            where: req.user?.role === 'ADMIN' ? undefined : { isHidden: false },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isHidden: true,
              orderIndex: true,
              explanation: true,
            },
            orderBy: { orderIndex: 'asc' },
          },
          _count: {
            select: {
              submissions: true,
              testCases: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess(res, {
      questions,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch questions', 500);
  }
}

export async function getQuestionById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: {
          // If student, ONLY return sample (non-hidden) test cases
          where: req.user?.role === 'ADMIN' ? undefined : { isHidden: false },
          orderBy: { orderIndex: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!question) {
      return sendError(res, 'Question not found', 404);
    }

    return sendSuccess(res, question);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch question', 500);
  }
}

export async function createQuestion(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      explanation,
      difficulty = 'Medium',
      category = 'Arrays',
      marks = 10,
      starterCode,
      timeLimit = 2000,
      memoryLimit = 128,
      isPublished = true,
      testCases = [],
    } = req.body;

    if (!title || !description) {
      return sendError(res, 'Title and description are required', 400);
    }

    const starterCodeString = typeof starterCode === 'object' ? JSON.stringify(starterCode) : starterCode;

    const question = await prisma.question.create({
      data: {
        title,
        description,
        inputFormat: inputFormat || 'Standard Input',
        outputFormat: outputFormat || 'Standard Output',
        constraints: constraints || 'None',
        explanation,
        difficulty,
        category,
        marks: parseInt(marks, 10) || 10,
        starterCode: starterCodeString || '{}',
        timeLimit: parseInt(timeLimit, 10) || 2000,
        memoryLimit: parseInt(memoryLimit, 10) || 128,
        isPublished: Boolean(isPublished),
        createdById: req.user!.id,
        testCases: {
          create: testCases.map((tc: any, idx: number) => ({
            input: tc.input || '',
            expectedOutput: tc.expectedOutput || '',
            isHidden: Boolean(tc.isHidden),
            orderIndex: tc.orderIndex || idx + 1,
            explanation: tc.explanation,
          })),
        },
      },
      include: {
        testCases: true,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'QUESTION_CREATED',
      entityType: 'QUESTION',
      entityId: question.id,
      details: `Created question: ${question.title} (${question.difficulty}, ${question.category})`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, question, 'Question created successfully', 201);
  } catch (err: any) {
    console.error('Create question error:', err);
    return sendError(res, err.message || 'Failed to create question', 500);
  }
}

export async function updateQuestion(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      inputFormat,
      outputFormat,
      constraints,
      explanation,
      difficulty,
      category,
      marks,
      starterCode,
      timeLimit,
      memoryLimit,
      isPublished,
      testCases,
    } = req.body;

    const starterCodeString = typeof starterCode === 'object' ? JSON.stringify(starterCode) : starterCode;

    // Delete existing test cases if new test cases provided
    if (Array.isArray(testCases)) {
      await prisma.testCase.deleteMany({ where: { questionId: id } });
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(inputFormat && { inputFormat }),
        ...(outputFormat && { outputFormat }),
        ...(constraints && { constraints }),
        explanation,
        ...(difficulty && { difficulty }),
        ...(category && { category }),
        ...(marks !== undefined && { marks: parseInt(marks, 10) }),
        ...(starterCodeString && { starterCode: starterCodeString }),
        ...(timeLimit !== undefined && { timeLimit: parseInt(timeLimit, 10) }),
        ...(memoryLimit !== undefined && { memoryLimit: parseInt(memoryLimit, 10) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
        ...(Array.isArray(testCases) && {
          testCases: {
            create: testCases.map((tc: any, idx: number) => ({
              input: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              isHidden: Boolean(tc.isHidden),
              orderIndex: tc.orderIndex || idx + 1,
              explanation: tc.explanation,
            })),
          },
        }),
      },
      include: {
        testCases: true,
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'QUESTION_UPDATED',
      entityType: 'QUESTION',
      entityId: question.id,
      details: `Updated question: ${question.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, question, 'Question updated successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update question', 500);
  }
}

export async function deleteQuestion(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const question = await prisma.question.delete({
      where: { id },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'QUESTION_DELETED',
      entityType: 'QUESTION',
      entityId: id,
      details: `Deleted question: ${question.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Question deleted successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete question', 500);
  }
}

export async function testRunQuestionProgram(req: AuthRequest, res: Response) {
  try {
    const { language, sourceCode, input = '', expectedOutput } = req.body;

    if (!language || !sourceCode) {
      return sendError(res, 'Language and sourceCode are required', 400);
    }

    const execResult = await codeExecutionService.execute(language, sourceCode, input);

    const normalizedActual = evaluationService.normalizeOutput(execResult.stdout || '');
    const normalizedExpected =
      expectedOutput !== undefined && expectedOutput !== null && expectedOutput.trim() !== ''
        ? evaluationService.normalizeOutput(expectedOutput)
        : null;

    const isMatched =
      normalizedExpected !== null
        ? normalizedActual === normalizedExpected && execResult.status === 'Accepted'
        : null;

    return sendSuccess(
      res,
      {
        status: execResult.status,
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        actualOutput: execResult.stdout || execResult.stderr,
        expectedOutput: expectedOutput || '',
        isMatched,
        executionTime: execResult.executionTime,
        memoryUsed: execResult.memoryUsed,
        error: execResult.error,
      },
      'Program executed successfully'
    );
  } catch (err: any) {
    console.error('Test run question program error:', err);
    return sendError(res, err.message || 'Execution failed', 500);
  }
}
