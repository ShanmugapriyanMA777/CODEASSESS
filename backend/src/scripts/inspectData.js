const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectData() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany({
    include: {
      studentProfile: true,
      adminProfile: true,
    }
  });
  console.log(`Total users: ${users.length}`);
  for (const u of users) {
    if (u.role === 'ADMIN' || !u.email.endsWith('@act.edu.in')) {
      console.log(`User: id=${u.id}, email=${u.email}, name="${u.name}", role=${u.role}, reg=${u.studentProfile?.rollNumber}`);
    }
  }

  console.log('\n=== BATCHES ===');
  const batches = await prisma.batch.findMany({
    include: {
      students: true,
    }
  });
  for (const b of batches) {
    console.log(`Batch: id=${b.id}, name="${b.name}", code="${b.code}", studentsCount=${b.students.length}`);
  }

  console.log('\n=== ASSESSMENTS ===');
  const assessments = await prisma.assessment.findMany({
    select: { id: true, title: true, isPublished: true }
  });
  for (const a of assessments) {
    console.log(`Assessment: id=${a.id}, title="${a.title}", published=${a.isPublished}`);
  }

  console.log('\n=== SUBMISSIONS ===');
  const submissions = await prisma.submission.findMany({
    include: {
      student: { select: { name: true, email: true } },
    }
  });
  console.log(`Total submissions: ${submissions.length}`);
  for (const sub of submissions) {
    console.log(`Submission: id=${sub.id}, student=${sub.student.name} (${sub.student.email}), status=${sub.status}, score=${sub.score}`);
  }

  console.log('\n=== ASSESSMENT RESULTS ===');
  const results = await prisma.assessmentResult.findMany({
    include: {
      student: { select: { name: true, email: true } },
      assessment: { select: { title: true } }
    }
  });
  console.log(`Total results: ${results.length}`);
  for (const res of results) {
    console.log(`Result: id=${res.id}, student=${res.student.name} (${res.student.email}), assessment="${res.assessment.title}", score=${res.score}/${res.totalMarks}`);
  }
}

inspectData().finally(() => prisma.$disconnect());
