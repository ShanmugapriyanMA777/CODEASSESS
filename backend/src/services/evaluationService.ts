import { prisma } from '../prisma.js';
import { supabase } from '../config/supabase.js';
import { codeExecutionService, ExecutionResult } from './codeExecutionService.js';

export interface TestCaseResult {
  testCaseId: string;
  orderIndex: number;
  isHidden: boolean;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  input?: string;          // Omitted if isHidden and called by student
  expectedOutput?: string; // Omitted if isHidden and called by student
  actualOutput?: string;   // Omitted if isHidden and called by student
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

export interface EvaluationSummary {
  submissionId?: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'PARTIAL';
  marksObtained: number;
  totalMarks: number;
  testCasesPassed: number;
  totalTestCases: number;
  averageExecutionTime: number;
  testCaseResults: TestCaseResult[];
}

export class EvaluationService {
  /**
   * Helper to normalize output for consistent cross-platform comparison
   */
  normalizeOutput(output: string): string {
    return output
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }

  /**
   * Run code against sample test cases (for 'RUN CODE' button)
   */
  async runSampleTestCases(
    questionId: string,
    language: string,
    sourceCode: string,
    customInput?: string
  ): Promise<{ results: TestCaseResult[]; executionSummary: any }> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testCases: {
          where: { isHidden: false },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const testCasesToRun = [...question.testCases];

    // If custom input was provided, add it as a test case
    if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
      const execResult = await codeExecutionService.execute(language, sourceCode, customInput);
      return {
        results: [
          {
            testCaseId: 'custom',
            orderIndex: 0,
            isHidden: false,
            status: execResult.status === 'Accepted' ? 'PASSED' : 'ERROR',
            input: customInput,
            expectedOutput: 'Custom Input Execution',
            actualOutput: execResult.stdout || execResult.stderr,
            executionTime: execResult.executionTime,
            memoryUsed: execResult.memoryUsed,
            error: execResult.error,
          },
        ],
        executionSummary: {
          status: execResult.status,
          executionTime: execResult.executionTime,
        },
      };
    }

    const results: TestCaseResult[] = [];
    let totalTime = 0;

    for (let i = 0; i < testCasesToRun.length; i++) {
      const tc = testCasesToRun[i];
      const execResult = await codeExecutionService.execute(language, sourceCode, tc.input);
      totalTime += execResult.executionTime;

      let testStatus: 'PASSED' | 'FAILED' | 'ERROR' = 'FAILED';

      if (execResult.status === 'Accepted') {
        const normalizedActual = this.normalizeOutput(execResult.stdout);
        const normalizedExpected = this.normalizeOutput(tc.expectedOutput);

        if (normalizedActual === normalizedExpected) {
          testStatus = 'PASSED';
        } else {
          testStatus = 'FAILED';
        }
      } else {
        testStatus = 'ERROR';
      }

      results.push({
        testCaseId: tc.id,
        orderIndex: tc.orderIndex || i + 1,
        isHidden: false,
        status: testStatus,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: execResult.stdout || execResult.stderr,
        executionTime: execResult.executionTime,
        memoryUsed: execResult.memoryUsed,
        error: execResult.error,
      });
    }

    return {
      results,
      executionSummary: {
        totalCases: results.length,
        passedCases: results.filter((r) => r.status === 'PASSED').length,
        averageExecutionTime: results.length ? Math.round(totalTime / results.length) : 0,
      },
    };
  }

  /**
   * Submit code against ALL test cases (Sample + Hidden) and record results
   */
  async submitCode(
    studentId: string,
    questionId: string,
    language: string,
    sourceCode: string,
    assessmentId?: string
  ): Promise<EvaluationSummary> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        testCases: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const allTestCases = question.testCases;
    if (allTestCases.length === 0) {
      throw new Error('Question has no test cases defined.');
    }

    const testResults: TestCaseResult[] = [];
    let passedCount = 0;
    let totalExecutionTime = 0;
    let fatalError: string | null = null;
    let fatalStatus: any = null;

    for (let i = 0; i < allTestCases.length; i++) {
      const tc = allTestCases[i];
      const execResult = await codeExecutionService.execute(language, sourceCode, tc.input);
      totalExecutionTime += execResult.executionTime;

      let testStatus: 'PASSED' | 'FAILED' | 'ERROR' = 'FAILED';

      if (execResult.status === 'Accepted') {
        const normalizedActual = this.normalizeOutput(execResult.stdout);
        const normalizedExpected = this.normalizeOutput(tc.expectedOutput);

        if (normalizedActual === normalizedExpected) {
          testStatus = 'PASSED';
          passedCount++;
        } else {
          testStatus = 'FAILED';
        }
      } else {
        testStatus = 'ERROR';
        if (!fatalError) {
          fatalError = execResult.error || execResult.stderr;
          fatalStatus = execResult.status;
        }
      }

      testResults.push({
        testCaseId: tc.id,
        orderIndex: tc.orderIndex || i + 1,
        isHidden: tc.isHidden,
        status: testStatus,
        // STRICT SECURITY: Never expose hidden test case input or expected output to students!
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : tc.expectedOutput,
        actualOutput: tc.isHidden ? undefined : (execResult.stdout || execResult.stderr),
        executionTime: execResult.executionTime,
        memoryUsed: execResult.memoryUsed,
        error: tc.isHidden ? undefined : execResult.error,
      });
    }

    // Determine question marks
    // If inside an assessment, check AssessmentQuestion marks
    let questionMarks = question.marks;
    if (assessmentId) {
      const aq = await prisma.assessmentQuestion.findUnique({
        where: {
          assessmentId_questionId: {
            assessmentId,
            questionId,
          },
        },
      });
      if (aq) {
        questionMarks = aq.marks;
      }
    }

    const marksObtained = Math.round((passedCount / allTestCases.length) * questionMarks * 100) / 100;

    let overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'PARTIAL' = 'WRONG_ANSWER';
    if (passedCount === allTestCases.length) {
      overallStatus = 'ACCEPTED';
    } else if (passedCount > 0) {
      overallStatus = 'PARTIAL';
    } else if (fatalStatus === 'Compilation Error') {
      overallStatus = 'COMPILATION_ERROR';
    } else if (fatalStatus === 'Time Limit Exceeded') {
      overallStatus = 'TIME_LIMIT_EXCEEDED';
    } else if (fatalStatus === 'Runtime Error') {
      overallStatus = 'RUNTIME_ERROR';
    } else {
      overallStatus = 'WRONG_ANSWER';
    }

    const averageExecutionTime = Math.round(totalExecutionTime / allTestCases.length);

    // Ensure studentId references a valid User in Prisma
    let validStudentId = studentId;
    try {
      const userExists = await prisma.user.findUnique({ where: { id: studentId } });
      if (!userExists) {
        const sp = await prisma.studentProfile.findFirst({
          where: {
            OR: [
              { rollNumber: studentId.replace('u-std-', '') },
              { userId: studentId },
            ],
          },
        });
        if (sp) {
          validStudentId = sp.userId;
        } else {
          const newUser = await prisma.user.create({
            data: {
              id: studentId,
              name: 'Candidate',
              email: `${studentId}@act.edu.in`,
              passwordHash: '$2a$10$defaultHash',
              role: 'STUDENT',
            },
          });
          validStudentId = newUser.id;
        }
      }
    } catch (_) {}

    // Save Submission to Database
    let submission: any = null;
    try {
      submission = await prisma.submission.create({
        data: {
          studentId: validStudentId,
          questionId,
          assessmentId: assessmentId || null,
          sourceCode,
          language,
          status: overallStatus,
          marks: marksObtained,
          executionTime: averageExecutionTime,
          memoryUsed: 1024,
          testCasesPassed: passedCount,
          totalTestCases: allTestCases.length,
          testResults: {
            create: allTestCases.map((tc, idx) => {
              const tr = testResults[idx];
              return {
                testCaseId: tc.id,
                status: tr.status,
                actualOutput: tc.isHidden ? 'Hidden test evaluation' : tr.actualOutput,
                expectedOutput: tc.isHidden ? 'Hidden test evaluation' : tr.expectedOutput,
                executionTime: tr.executionTime,
                isHidden: tc.isHidden,
              };
            }),
          },
        },
      });
    } catch (prismaErr: any) {
      console.warn('[EvaluationService] Prisma submission creation failed, writing to Supabase Cloud directly:', prismaErr?.message);
      try {
        const subId = 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
        const { data: directSub, error: directErr } = await supabase.from('Submission').insert({
          id: subId,
          studentId: validStudentId,
          questionId,
          assessmentId: assessmentId || null,
          sourceCode,
          code: sourceCode,
          language,
          status: overallStatus,
          marks: marksObtained,
          score: marksObtained,
          executionTime: averageExecutionTime,
          memoryUsed: 1024,
          testCasesPassed: passedCount,
          totalTestCases: allTestCases.length,
          submittedAt: new Date().toISOString(),
        }).select().single();

        if (directErr) {
          console.warn('[EvaluationService] Supabase direct insert notice:', directErr.message);
        }

        const trRows = allTestCases.map((tc, idx) => {
          const tr = testResults[idx];
          return {
            id: 'tr-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
            submissionId: subId,
            testCaseId: tc.id,
            status: tr.status,
            actualOutput: tc.isHidden ? 'Hidden test evaluation' : tr.actualOutput,
            expectedOutput: tc.isHidden ? 'Hidden test evaluation' : tr.expectedOutput,
            executionTime: tr.executionTime,
            isHidden: tc.isHidden,
          };
        });

        await supabase.from('SubmissionTestResult').insert(trRows);
        submission = directSub || { id: subId };
      } catch (cloudErr: any) {
        console.warn('[EvaluationService] Cloud fallback notice:', cloudErr?.message);
        submission = { id: 'sub-sim-' + Date.now() };
      }
    }

    const submissionId = submission?.id || ('sub-' + Date.now());

    return {
      submissionId,
      status: overallStatus,
      marksObtained,
      totalMarks: questionMarks,
      testCasesPassed: passedCount,
      totalTestCases: allTestCases.length,
      averageExecutionTime,
      testCaseResults: testResults,
    };
  }
}

export const evaluationService = new EvaluationService();
