import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectData() {
  console.log('=== USERS ===');
  const users = await prisma.user.findMany({
    include: {
      studentProfile: true,
      adminProfile: true,
      _count: { select: { submissions: true, assessmentResults: true } }
    }
  });
  console.log(`Total users: ${users.length}`);
  users.forEach(u => {
    if (u.role === 'ADMIN' || !u.email.endsWith('@act.edu.in')) {
      console.log(`User: id=${u.id}, email=${u.email}, name=${u.name}, role=${u.role}, reg=${u.studentProfile?.rollNumber}`);
    }
  });

  console.log('\n=== BATCHES ===');
  const batches = await prisma.batch.findMany({
    include: {
      _count: { select: { students: true, assignments: true } }
    }
  });
  batches.forEach(b => {
    console.log(`Batch: id=${b.id}, name="${b.name}", code="${b.code}", students=${b._count.students}, assignments=${b._count.assignments}`);
  });

  console.log('\n=== ASSESSMENTS ===');
  const assessments = await prisma.assessment.findMany({
    select: { id: true, title: true, isPublished: true }
  });
  assessments.forEach(a => {
    console.log(`Assessment: id=${a.id}, title="${a.title}", published=${a.isPublished}`);
  });
}

inspectData().finally(() => prisma.$disconnect());
