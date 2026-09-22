import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function generate() {
  const jsonPath = path.resolve(__dirname, 'students_iii_c.json');
  const students = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  let sql = `\n-- ==============================================================================\n`;
  sql += `-- 6.6 Batch III CSE C and 65 Student Candidates (DOB Passwords)\n`;
  sql += `-- ==============================================================================\n\n`;

  sql += `-- Ensure Batch III CSE C exists\n`;
  sql += `INSERT INTO "Batch" ("id", "name", "description", "academicYear", "code")\n`;
  sql += `VALUES ('b3333333-3333-3333-3333-333333333333', 'III CSE C', 'Computer Science and Engineering - 3rd Year Section C', '2024-2028', 'CSE-III-C')\n`;
  sql += `ON CONFLICT ("code") DO NOTHING;\n\n`;

  sql += `-- Assign default assessment to III CSE C batch\n`;
  sql += `INSERT INTO "AssessmentAssignment" ("id", "assessmentId", "batchId", "status")\n`;
  sql += `VALUES ('as333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'PENDING')\n`;
  sql += `ON CONFLICT ("assessmentId", "batchId") DO NOTHING;\n\n`;

  sql += `-- Insert 65 Student Candidate Accounts\n`;

  for (const s of students) {
    const regNo = s.registerNumber.trim();
    const dob = s.dob.trim();
    const name = s.name.trim().replace(/'/g, "''");
    const email = s.defaultEmail.trim().toLowerCase();
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(dob, salt);

    const userId = `u-std-${regNo}`;
    const profileId = `sp-std-${regNo}`;

    sql += `INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")\n`;
    sql += `VALUES ('${userId}', '${name}', '${email}', '${hash}', 'STUDENT', true)\n`;
    sql += `ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";\n\n`;

    sql += `INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")\n`;
    sql += `VALUES ('${profileId}', '${userId}', '${regNo}', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '${dob}')\n`;
    sql += `ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";\n\n`;
  }

  const outPath = path.resolve(__dirname, '../../prisma/supabase_students_iii_c.sql');
  fs.writeFileSync(outPath, sql, 'utf-8');
  console.log(`Generated ${outPath} successfully with ${students.length} students.`);

  // Also append to supabase_schema.sql
  const schemaPath = path.resolve(__dirname, '../../prisma/supabase_schema.sql');
  let currentSchema = fs.readFileSync(schemaPath, 'utf-8');
  if (!currentSchema.includes('Batch III CSE C and 65 Student Candidates')) {
    fs.appendFileSync(schemaPath, sql, 'utf-8');
    console.log(`Appended to ${schemaPath}.`);
  }
}

generate().catch(console.error);
