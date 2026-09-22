const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubmissions() {
  const subs = await prisma.submission.findMany({
    include: {
      student: { select: { name: true, email: true } },
      question: { select: { title: true } }
    }
  });
  console.log('All submissions in DB:');
  subs.forEach(s => console.log(s.id, s.student.name, s.student.email, s.submittedAt));

  const results = await prisma.assessmentResult.findMany({
    include: {
      student: { select: { name: true, email: true } }
    }
  });
  console.log('\nAll results in DB:');
  results.forEach(r => console.log(r.id, r.student.name, r.student.email, r.submittedAt));
}

checkSubmissions().finally(() => prisma.$disconnect());
