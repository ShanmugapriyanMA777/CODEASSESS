const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanTestSubmissions() {
  console.log('Cleaning test submissions and results...');
  await prisma.submissionTestResult.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.assessmentAttempt.deleteMany({});
  await prisma.assessmentResult.deleteMany({});
  await prisma.suspiciousEvent.deleteMany({});
  await prisma.report.deleteMany({});
  console.log('✅ All test submissions, attempts, results, and reports cleared.');
}

cleanTestSubmissions().finally(() => prisma.$disconnect());
