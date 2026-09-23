import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUGGESTIONS = [
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
  'Found the session very engaging. More focus on competitive coding platforms like LeetCode and HackerRank would be great.',
  'Helped improve my logic building significantly. Would like more training on object-oriented programming problems.',
  'Well organized training. More problem sets on greedy algorithms and dynamic programming would be great.',
  'Concepts were explained from basics. Requesting additional sessions on error diagnostics and edge cases.',
];

async function main() {
  console.log('Seeding sample assessment feedback records...');

  const assessments = await prisma.assessment.findMany({ take: 2 });
  if (assessments.length === 0) {
    console.log('No assessments found to seed feedback for.');
    return;
  }

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: { studentProfile: true },
    take: 25,
  });

  if (students.length === 0) {
    console.log('No students found to seed feedback for.');
    return;
  }

  for (const assessment of assessments) {
    console.log(`Seeding feedback for assessment: "${assessment.title}" (${assessment.id})`);

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Ratings between 3 and 5 (realistic high-performing distribution)
      const q1 = ((i * 7 + 3) % 3) + 3; // 3, 4, or 5
      const q2 = ((i * 5 + 4) % 2) + 4; // 4 or 5
      const q3 = ((i * 3 + 2) % 3) + 3; // 3, 4, or 5
      const q4 = ((i * 2 + 3) % 2) + 3; // 3 or 4
      const q5 = ((i * 11 + 4) % 3) + 3; // 3, 4, or 5
      const suggestion = SUGGESTIONS[i % SUGGESTIONS.length];

      // Upsert AssessmentFeedback
      await prisma.assessmentFeedback.upsert({
        where: {
          assessmentId_studentId: {
            assessmentId: assessment.id,
            studentId: student.id,
          },
        },
        update: {
          overallCodingSkillsRating: q1,
          basicConceptsUnderstandingRating: q2,
          problemSolvingRating: q3,
          difficultyLevelRating: q4,
          debuggingAbilityRating: q5,
          suggestions: suggestion,
          submittedAt: new Date(Date.now() - i * 3600000),
        },
        create: {
          assessmentId: assessment.id,
          studentId: student.id,
          overallCodingSkillsRating: q1,
          basicConceptsUnderstandingRating: q2,
          problemSolvingRating: q3,
          difficultyLevelRating: q4,
          debuggingAbilityRating: q5,
          suggestions: suggestion,
          submittedAt: new Date(Date.now() - i * 3600000),
        },
      });

      // Also ensure completed attempt and result exist so class statements have data too
      const obtainedMarks = Math.min(assessment.totalMarks, Math.max(40, 60 + ((i * 13) % 40)));
      const percentage = (obtainedMarks / assessment.totalMarks) * 100;

      await prisma.assessmentAttempt.upsert({
        where: { id: `att-${assessment.id.slice(0, 8)}-${student.id.slice(0, 8)}` },
        update: {
          status: 'COMPLETED',
          remainingSeconds: 0,
          submitTime: new Date(Date.now() - i * 3600000),
        },
        create: {
          id: `att-${assessment.id.slice(0, 8)}-${student.id.slice(0, 8)}`,
          assessmentId: assessment.id,
          studentId: student.id,
          status: 'COMPLETED',
          remainingSeconds: 0,
          currentCodeDraftsJson: '{}',
          submitTime: new Date(Date.now() - i * 3600000),
        },
      });

      await prisma.assessmentResult.upsert({
        where: { id: `res-${assessment.id.slice(0, 8)}-${student.id.slice(0, 8)}` },
        update: {
          totalMarks: assessment.totalMarks,
          obtainedMarks,
          percentage,
          isPassed: percentage >= 50,
          submittedAt: new Date(Date.now() - i * 3600000),
        },
        create: {
          id: `res-${assessment.id.slice(0, 8)}-${student.id.slice(0, 8)}`,
          assessmentId: assessment.id,
          studentId: student.id,
          totalMarks: assessment.totalMarks,
          obtainedMarks,
          percentage,
          questionsAttempted: 3,
          questionsSolved: 3,
          testCasesPassed: 6,
          totalTestCases: 6,
          timeTaken: 1800,
          rank: i + 1,
          isPassed: percentage >= 50,
          submittedAt: new Date(Date.now() - i * 3600000),
        },
      });
    }
  }

  const count = await prisma.assessmentFeedback.count();
  console.log(`Done! Total assessment feedback records in database: ${count}`);
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
