const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const FAKE_EMAILS = [
  'alex.johnson@example.com',
  'priya.sharma@example.com',
  'david.chen@example.com',
  'sarah.miller@example.com',
  'kevin.patel@example.com',
  'ananya.iyer@example.com',
  'michael.brown@example.com',
  'emily.davis@example.com',
  'rahul.verma@example.com',
  'jessica.taylor@example.com'
];

const FAKE_BATCH_CODES = [
  'CSE-2026',
  'IT-2026'
];

async function removeFakeData() {
  console.log('🧹 Starting cleanup of fake data...');

  // 1. Identify fake users
  const fakeUsers = await prisma.user.findMany({
    where: { email: { in: FAKE_EMAILS } },
    select: { id: true, email: true, name: true }
  });
  const fakeUserIds = fakeUsers.map(u => u.id);
  console.log(`Found ${fakeUsers.length} fake users:`, fakeUsers.map(u => u.name));

  // Also find admin user to clean any admin test submissions
  const adminUser = await prisma.user.findUnique({
    where: { email: 'varsha.cse@act.edu.in' }
  });
  const submissionUserIds = [...fakeUserIds];
  if (adminUser) {
    submissionUserIds.push(adminUser.id);
  }

  // 2. Identify fake batches
  const fakeBatches = await prisma.batch.findMany({
    where: { code: { in: FAKE_BATCH_CODES } },
    select: { id: true, name: true, code: true }
  });
  const fakeBatchIds = fakeBatches.map(b => b.id);
  console.log(`Found ${fakeBatches.length} fake batches:`, fakeBatches.map(b => b.name));

  // 3. Delete Reports referencing fake users
  const delReports = await prisma.report.deleteMany({
    where: {
      OR: [
        { studentId: { in: fakeUserIds } },
        { generatedById: { in: fakeUserIds } }
      ]
    }
  });
  console.log(`✅ Deleted ${delReports.count} reports.`);

  // 4. Delete AuditLogs referencing fake users
  const delAudit = await prisma.auditLog.deleteMany({
    where: { userId: { in: fakeUserIds } }
  });
  console.log(`✅ Deleted ${delAudit.count} audit logs.`);

  // 5. Delete AssessmentAssignments referencing fake users OR fake batches
  const delAssignments = await prisma.assessmentAssignment.deleteMany({
    where: {
      OR: [
        { studentId: { in: fakeUserIds } },
        { batchId: { in: fakeBatchIds } }
      ]
    }
  });
  console.log(`✅ Deleted ${delAssignments.count} assessment assignments.`);

  // 6. Delete AssessmentAttempts
  const delAttempts = await prisma.assessmentAttempt.deleteMany({
    where: { studentId: { in: submissionUserIds } }
  });
  console.log(`✅ Deleted ${delAttempts.count} assessment attempts.`);

  // 7. Delete AssessmentResults
  const delResults = await prisma.assessmentResult.deleteMany({
    where: { studentId: { in: submissionUserIds } }
  });
  console.log(`✅ Deleted ${delResults.count} assessment results.`);

  // 8. Delete SuspiciousEvents
  const delSuspicious = await prisma.suspiciousEvent.deleteMany({
    where: { studentId: { in: submissionUserIds } }
  });
  console.log(`✅ Deleted ${delSuspicious.count} suspicious events.`);

  // 9. Delete Submissions & TestResults
  const subs = await prisma.submission.findMany({
    where: { studentId: { in: submissionUserIds } },
    select: { id: true }
  });
  const subIds = subs.map(s => s.id);
  if (subIds.length > 0) {
    const delTestResults = await prisma.submissionTestResult.deleteMany({
      where: { submissionId: { in: subIds } }
    });
    console.log(`✅ Deleted ${delTestResults.count} submission test results.`);

    const delSubs = await prisma.submission.deleteMany({
      where: { id: { in: subIds } }
    });
    console.log(`✅ Deleted ${delSubs.count} submissions.`);
  }

  // 10. Delete StudentProfiles
  const delProfiles = await prisma.studentProfile.deleteMany({
    where: { userId: { in: fakeUserIds } }
  });
  console.log(`✅ Deleted ${delProfiles.count} student profiles.`);

  // 11. Delete Fake Users
  const delUsers = await prisma.user.deleteMany({
    where: { id: { in: fakeUserIds } }
  });
  console.log(`✅ Deleted ${delUsers.count} fake users.`);

  // 12. Delete Fake Batches
  if (fakeBatchIds.length > 0) {
    const delBatches = await prisma.batch.deleteMany({
      where: { id: { in: fakeBatchIds } }
    });
    console.log(`✅ Deleted ${delBatches.count} fake batches.`);
  }

  console.log('\n✨ Database is now completely cleansed of all fake injected data!');
}

removeFakeData().finally(() => prisma.$disconnect());
