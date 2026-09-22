import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdmin() {
  console.log('🔧 Setting up Admin accounts...');

  const passwordHash = await bcrypt.hash('Varsha@123', 10);
  const altHash = await bcrypt.hash('Admin@123', 10);

  // 1. Ensure Varsha G admin account exists
  const varshaAdmin = await prisma.user.upsert({
    where: { email: 'varsha.cse@act.edu.in' },
    update: {
      name: 'Varsha G',
      role: 'ADMIN',
      isActive: true,
      passwordHash: passwordHash,
    },
    create: {
      name: 'Varsha G',
      email: 'varsha.cse@act.edu.in',
      passwordHash: passwordHash,
      role: 'ADMIN',
      isActive: true,
      adminProfile: {
        create: {
          designation: 'Head of Assessment & Curriculum',
          department: 'Computer Science & Engineering',
        },
      },
    },
    include: { adminProfile: true },
  });
  console.log(`✅ Varsha Admin configured: "${varshaAdmin.name}" (${varshaAdmin.email})`);

  // Ensure AdminProfile exists for Varsha
  if (!varshaAdmin.adminProfile) {
    await prisma.adminProfile.create({
      data: {
        userId: varshaAdmin.id,
        designation: 'Head of Assessment & Curriculum',
        department: 'Computer Science & Engineering',
      },
    });
    console.log('✅ Created AdminProfile for Varsha G');
  }

  // 2. Ensure general admin@example.com also exists as fallback
  const generalAdmin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Administrator',
      role: 'ADMIN',
      isActive: true,
      passwordHash: altHash,
    },
    create: {
      name: 'Administrator',
      email: 'admin@example.com',
      passwordHash: altHash,
      role: 'ADMIN',
      isActive: true,
      adminProfile: {
        create: {
          designation: 'System Administrator',
          department: 'Examination Cell',
        },
      },
    },
    include: { adminProfile: true },
  });
  console.log(`✅ General Admin configured: "${generalAdmin.name}" (${generalAdmin.email})`);

  if (!generalAdmin.adminProfile) {
    await prisma.adminProfile.create({
      data: {
        userId: generalAdmin.id,
        designation: 'System Administrator',
        department: 'Examination Cell',
      },
    });
  }

  console.log('\n🎉 Admin accounts ready:');
  console.log('1. Varsha G:');
  console.log('   - Identifier: "Varsha G" OR "varsha.cse@act.edu.in" OR "varsha"');
  console.log('   - Password: "Varsha@123" (also accepts "varshag@act3128" and "Admin@123")');
  console.log('2. Administrator:');
  console.log('   - Identifier: "admin@example.com" OR "admin"');
  console.log('   - Password: "Admin@123"');
}

setupAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
