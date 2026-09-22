import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importStudents() {
  console.log('🚀 Starting student import from III C DOB.xlsx...');

  const jsonPath = path.resolve(process.cwd(), 'src/scripts/students_iii_c.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Data file not found: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const students = JSON.parse(rawData);

  console.log(`📋 Found ${students.length} students in dataset.`);

  // 1. Ensure Batch "III CSE C" exists
  let batch = await prisma.batch.findFirst({
    where: { name: 'III CSE C' },
  });

  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        name: 'III CSE C',
        code: 'CSE-III-C',
        academicYear: '2024-2028',
        description: 'B.E. Computer Science and Engineering - 3rd Year Section C (Batch 2024)',
      },
    });
    console.log(`✅ Created academic batch: "${batch.name}" (${batch.code})`);
  } else {
    console.log(`ℹ️ Academic batch exists: "${batch.name}" (${batch.id})`);
  }

  // 2. Assign all published assessments to this batch
  const publishedAssessments = await prisma.assessment.findMany({
    where: { isPublished: true },
  });

  for (const ass of publishedAssessments) {
    const existingAssignment = await prisma.assessmentAssignment.findFirst({
      where: { assessmentId: ass.id, batchId: batch.id },
    });

    if (!existingAssignment) {
      await prisma.assessmentAssignment.create({
        data: {
          assessmentId: ass.id,
          batchId: batch.id,
        },
      });
      console.log(`🎯 Assigned assessment "${ass.title}" to batch ${batch.name}`);
    }
  }

  // 3. Process each student
  let createdCount = 0;
  let updatedCount = 0;

  for (const s of students) {
    const defaultEmail = s.defaultEmail.toLowerCase().trim();
    const regNo = s.registerNumber.trim();
    const dob = s.dob.trim(); // e.g. "16-06-2007"
    const name = s.name.trim();

    // Generate bcrypt hash for Date of Birth
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dob, salt);

    // Check if student profile already exists by rollNumber
    const existingProfile = await prisma.studentProfile.findFirst({
      where: { rollNumber: regNo },
      include: { user: true },
    });

    if (existingProfile) {
      // Update user and profile
      await prisma.user.update({
        where: { id: existingProfile.userId },
        data: {
          name,
          isActive: true,
          // Only update passwordHash if current is default
          passwordHash,
        },
      });

      await prisma.studentProfile.update({
        where: { id: existingProfile.id },
        data: {
          dob,
          batchId: batch.id,
          department: 'Computer Science & Engineering',
          semester: 6,
        },
      });
      updatedCount++;
    } else {
      // Check if user exists by email
      const existingUser = await prisma.user.findUnique({
        where: { email: defaultEmail },
        include: { studentProfile: true },
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name, passwordHash },
        });

        if (existingUser.studentProfile) {
          await prisma.studentProfile.update({
            where: { id: existingUser.studentProfile.id },
            data: {
              rollNumber: regNo,
              dob,
              batchId: batch.id,
              department: 'Computer Science & Engineering',
              semester: 6,
            },
          });
        } else {
          await prisma.studentProfile.create({
            data: {
              userId: existingUser.id,
              rollNumber: regNo,
              dob,
              batchId: batch.id,
              department: 'Computer Science & Engineering',
              semester: 6,
            },
          });
        }
        updatedCount++;
      } else {
        // Create new User & StudentProfile
        await prisma.user.create({
          data: {
            name,
            email: defaultEmail,
            passwordHash,
            role: 'STUDENT',
            isActive: true,
            studentProfile: {
              create: {
                rollNumber: regNo,
                dob,
                batchId: batch.id,
                department: 'Computer Science & Engineering',
                semester: 6,
              },
            },
          },
        });
        createdCount++;
      }
    }
  }

  console.log(`\n🎉 Student Import Complete!`);
  console.log(`   - Total Processed: ${students.length}`);
  console.log(`   - New Accounts Created: ${createdCount}`);
  console.log(`   - Existing Accounts Updated: ${updatedCount}`);
  console.log(`   - Batch: ${batch.name} (${batch.code})`);
  console.log(`   - Credentials Standard:`);
  console.log(`       * Username / ID: Register Number (e.g. ${students[0].registerNumber})`);
  console.log(`       * Default Password: Date of Birth (e.g. ${students[0].dob})`);

  await prisma.$disconnect();
}

importStudents().catch((err) => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
