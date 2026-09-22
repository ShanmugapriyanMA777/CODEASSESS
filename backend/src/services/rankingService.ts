import { prisma } from '../prisma.js';

export interface RankedResult {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  rollNumber?: string;
  assessmentId: string;
  assessmentTitle: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  questionsAttempted: number;
  questionsSolved: number;
  testCasesPassed: number;
  totalTestCases: number;
  timeTaken: number; // in seconds
  rank: number;
  isPassed: boolean;
  submittedAt: Date;
}

export class RankingService {
  /**
   * Recalculate dynamic rankings for an assessment.
   * Tie-breaker rule:
   * 1. Higher obtainedMarks ranks first
   * 2. If equal marks, lower timeTaken ranks first
   * 3. If still equal, earlier submittedAt ranks first
   * Uses standard Competition Ranking (1224) or Dense Ranking (1223) - we use Competition Ranking
   */
  async recalculateAssessmentRankings(assessmentId: string): Promise<RankedResult[]> {
    const rawResults = await prisma.assessmentResult.findMany({
      where: { assessmentId },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
        assessment: {
          select: { title: true },
        },
      },
      orderBy: [
        { obtainedMarks: 'desc' },
        { timeTaken: 'asc' },
        { submittedAt: 'asc' },
      ],
    });

    const ranked: RankedResult[] = [];
    let currentRank = 1;

    for (let i = 0; i < rawResults.length; i++) {
      const res = rawResults[i];

      // Competition ranking logic:
      if (i > 0) {
        const prev = rawResults[i - 1];
        if (
          res.obtainedMarks === prev.obtainedMarks &&
          res.timeTaken === prev.timeTaken
        ) {
          // Exactly tied
          // same rank
        } else {
          currentRank = i + 1;
        }
      } else {
        currentRank = 1;
      }

      // Update rank in database asynchronously
      await prisma.assessmentResult.update({
        where: { id: res.id },
        data: { rank: currentRank },
      });

      ranked.push({
        id: res.id,
        studentId: res.studentId,
        studentName: res.student.name,
        studentEmail: res.student.email,
        rollNumber: res.student.studentProfile?.rollNumber,
        assessmentId: res.assessmentId,
        assessmentTitle: res.assessment.title,
        totalMarks: res.totalMarks,
        obtainedMarks: res.obtainedMarks,
        percentage: res.percentage,
        questionsAttempted: res.questionsAttempted,
        questionsSolved: res.questionsSolved,
        testCasesPassed: res.testCasesPassed,
        totalTestCases: res.totalTestCases,
        timeTaken: res.timeTaken,
        rank: currentRank,
        isPassed: res.isPassed,
        submittedAt: res.submittedAt,
      });
    }

    return ranked;
  }
}

export const rankingService = new RankingService();
