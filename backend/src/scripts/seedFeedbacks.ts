import { PrismaClient } from '@prisma/client';
import { supabase } from '../config/supabase';

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
  console.log('Seeding sample assessment feedback records across local DB and Supabase Cloud...');

  // 1. Fetch assessments from local and Supabase
  let assessments: any[] = [];
  try {
    assessments = await prisma.assessment.findMany({ take: 3 });
  } catch (_) {}

  const { data: suAss } = await supabase.from('Assessment').select('id, title, totalMarks').limit(4);
  const cloudAssessments = suAss || [];

  // Combine unique assessment IDs
  const allAssessments = [...assessments];
  for (const ca of cloudAssessments) {
    if (!allAssessments.some((a) => a.id === ca.id)) {
      allAssessments.push(ca);
    }
  }

  // 2. Fetch students from local and Supabase
  let students: any[] = [];
  try {
    students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { studentProfile: true },
      take: 30,
    });
  } catch (_) {}

  const { data: suUsers } = await supabase
    .from('User')
    .select('id, name, email')
    .eq('role', 'STUDENT')
    .limit(35);

  const { data: suProfiles } = await supabase
    .from('StudentProfile')
    .select('userId, rollNumber, batchId');

  const profileMap = new Map<string, any>();
  if (suProfiles) {
    suProfiles.forEach((p: any) => profileMap.set(p.userId, p));
  }

  const cloudStudents = (suUsers || []).map((u: any) => {
    const prof = profileMap.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      studentProfile: {
        rollNumber: prof?.rollNumber || (u.id.startsWith('u-std-') ? u.id.replace('u-std-', '') : '312824104000'),
        batchId: prof?.batchId,
      },
    };
  });

  const allStudents = [...students];
  for (const cs of cloudStudents) {
    if (!allStudents.some((s) => s.id === cs.id)) {
      allStudents.push(cs);
    }
  }

  console.log(`Found ${allAssessments.length} assessment(s) and ${allStudents.length} student(s) to seed.`);

  for (const assessment of allAssessments) {
    console.log(`\nSeeding feedback for assessment: "${assessment.title}" (${assessment.id})`);

    const studentsToSeed = allStudents.slice(0, 30);
    for (let i = 0; i < studentsToSeed.length; i++) {
      const student = studentsToSeed[i];

      // Ratings between 3 and 5 (realistic high-performing distribution)
      const q1 = ((i * 7 + 3) % 3) + 3; // 3, 4, or 5
      const q2 = ((i * 5 + 4) % 2) + 4; // 4 or 5
      const q3 = ((i * 3 + 2) % 3) + 3; // 3, 4, or 5
      const q4 = ((i * 2 + 3) % 2) + 3; // 3 or 4
      const q5 = ((i * 11 + 4) % 3) + 3; // 3, 4, or 5
      const suggestion = SUGGESTIONS[i % SUGGESTIONS.length];
      const submittedAt = new Date(Date.now() - i * 3600000).toISOString();

      // 1. Seed local SQLite / Prisma
      try {
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
            submittedAt: new Date(submittedAt),
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
            submittedAt: new Date(submittedAt),
          },
        });
      } catch (_) {}

      // 2. Seed Supabase Cloud Report table (CLASS_FEEDBACK_ENTRY)
      try {
        const feedbackPayload = {
          overallCodingSkillsRating: q1,
          basicConceptsUnderstandingRating: q2,
          problemSolvingRating: q3,
          difficultyLevelRating: q4,
          debuggingAbilityRating: q5,
          suggestions: suggestion,
          studentName: student.name,
          rollNumber: student.studentProfile?.rollNumber || '312824104000',
          batchId: student.studentProfile?.batchId || '',
          submittedAt,
        };

        const { data: existingReport } = await supabase
          .from('Report')
          .select('id')
          .eq('type', 'CLASS_FEEDBACK_ENTRY')
          .eq('studentId', student.id)
          .eq('assessmentId', assessment.id)
          .maybeSingle();

        if (existingReport) {
          await supabase
            .from('Report')
            .update({
              title: `Class Feedback - ${student.name}`,
              summaryJson: JSON.stringify(feedbackPayload),
            })
            .eq('id', existingReport.id);
        } else {
          await supabase.from('Report').insert({
            title: `Class Feedback - ${student.name}`,
            type: 'CLASS_FEEDBACK_ENTRY',
            studentId: student.id,
            assessmentId: assessment.id,
            generatedById: student.id,
            summaryJson: JSON.stringify(feedbackPayload),
          });
        }
      } catch (err: any) {
        console.warn(`Supabase seed warning for student ${student.name}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Finished seeding feedback records in both local database and Supabase Cloud!');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
