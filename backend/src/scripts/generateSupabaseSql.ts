import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function generate() {
  console.log('Generating complete reboot SQL schema for Supabase...');

  const studentsPath = path.resolve('src/scripts/students_iii_c.json');
  const students = JSON.parse(fs.readFileSync(studentsPath, 'utf-8'));

  const adminHash = await bcrypt.hash('Varsha@123', 10);

  let sql = `-- ==============================================================================
-- CodeAssess Platform — Complete Supabase PostgreSQL Reboot Schema & Seed
-- Target: https://xhikrplxtwzrxujmroqd.supabase.co
-- Generated for 1-Click execution in Supabase SQL Editor
-- This script safely drops old tables and rebuilds the schema and seed cleanly.
-- ==============================================================================

-- 0. ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLEAN REBOOT: DROP ALL EXISTING TABLES IN REVERSE DEPENDENCY ORDER
DROP TABLE IF EXISTS "Report" CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "SuspiciousEvent" CASCADE;
DROP TABLE IF EXISTS "AssessmentResult" CASCADE;
DROP TABLE IF EXISTS "SubmissionTestResult" CASCADE;
DROP TABLE IF EXISTS "Submission" CASCADE;
DROP TABLE IF EXISTS "AssessmentAttempt" CASCADE;
DROP TABLE IF EXISTS "AssessmentAssignment" CASCADE;
DROP TABLE IF EXISTS "AssessmentQuestion" CASCADE;
DROP TABLE IF EXISTS "Assessment" CASCADE;
DROP TABLE IF EXISTS "TestCase" CASCADE;
DROP TABLE IF EXISTS "Question" CASCADE;
DROP TABLE IF EXISTS "AdminProfile" CASCADE;
DROP TABLE IF EXISTS "StudentProfile" CASCADE;
DROP TABLE IF EXISTS "Batch" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Helper trigger function to update "updatedAt"
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CREATE FRESH TABLES
-- ==============================================================================

-- Table: User
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Batch
CREATE TABLE "Batch" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "academicYear" VARCHAR(50) NOT NULL DEFAULT '2024-2028',
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: StudentProfile
CREATE TABLE "StudentProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "rollNumber" VARCHAR(100) NOT NULL UNIQUE,
    "batchId" TEXT REFERENCES "Batch"("id") ON DELETE SET NULL,
    "department" VARCHAR(255) NOT NULL DEFAULT 'Computer Science & Engineering',
    "semester" INTEGER NOT NULL DEFAULT 6,
    "phone" VARCHAR(50),
    "dob" VARCHAR(50),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: AdminProfile
CREATE TABLE "AdminProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "designation" VARCHAR(255) NOT NULL DEFAULT 'Assistant Professor & Head of Assessment',
    "department" VARCHAR(255) NOT NULL DEFAULT 'Computer Science & Engineering',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Question
CREATE TABLE "Question" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "inputFormat" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "constraints" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" VARCHAR(50) NOT NULL DEFAULT 'Medium',
    "category" VARCHAR(100) NOT NULL DEFAULT 'Arrays',
    "marks" INTEGER NOT NULL DEFAULT 10,
    "starterCode" TEXT NOT NULL,
    "timeLimit" INTEGER NOT NULL DEFAULT 2000,
    "memoryLimit" INTEGER NOT NULL DEFAULT 128,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: TestCase
CREATE TABLE "TestCase" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 1,
    "explanation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Assessment
CREATE TABLE "Assessment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "totalMarks" INTEGER NOT NULL DEFAULT 100,
    "passingMarks" INTEGER NOT NULL DEFAULT 40,
    "allowedLanguages" VARCHAR(255) NOT NULL DEFAULT 'python,java,c,cpp',
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeTestCases" BOOLEAN NOT NULL DEFAULT false,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "disableCopyPaste" BOOLEAN NOT NULL DEFAULT true,
    "enforceFullscreen" BOOLEAN NOT NULL DEFAULT true,
    "trackTabSwitches" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: AssessmentQuestion
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 1,
    "marks" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentQuestion_assessmentId_questionId_key" UNIQUE ("assessmentId", "questionId")
);

-- Table: AssessmentAssignment
CREATE TABLE "AssessmentAssignment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "batchId" TEXT NOT NULL REFERENCES "Batch"("id") ON DELETE CASCADE,
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "AssessmentAssignment_assessmentId_batchId_key" UNIQUE ("assessmentId", "batchId")
);

-- Table: AssessmentAttempt
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "answeredQuestions" INTEGER NOT NULL DEFAULT 0,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AssessmentAttempt_assessmentId_studentId_key" UNIQUE ("assessmentId", "studentId")
);

-- Table: Submission
CREATE TABLE "Submission" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "attemptId" TEXT REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "code" TEXT NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "memoryUsed" INTEGER NOT NULL DEFAULT 0,
    "testCasesPassed" INTEGER NOT NULL DEFAULT 0,
    "totalTestCases" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: SubmissionTestResult
CREATE TABLE "SubmissionTestResult" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "submissionId" TEXT NOT NULL REFERENCES "Submission"("id") ON DELETE CASCADE,
    "testCaseId" TEXT NOT NULL REFERENCES "TestCase"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL,
    "actualOutput" TEXT,
    "expectedOutput" TEXT,
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false
);

-- Table: AssessmentResult
CREATE TABLE "AssessmentResult" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "totalMarks" INTEGER NOT NULL,
    "obtainedMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "questionsAttempted" INTEGER NOT NULL,
    "questionsSolved" INTEGER NOT NULL,
    "testCasesPassed" INTEGER NOT NULL,
    "totalTestCases" INTEGER NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentResult_assessmentId_studentId_key" UNIQUE ("assessmentId", "studentId")
);

-- Table: SuspiciousEvent
CREATE TABLE "SuspiciousEvent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "eventType" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- Table: AuditLog
CREATE TABLE "AuditLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(255),
    "details" TEXT,
    "ipAddress" VARCHAR(100),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Report
CREATE TABLE "Report" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "studentId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "assessmentId" TEXT REFERENCES "Assessment"("id") ON DELETE SET NULL,
    "generatedById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "summaryJson" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. PERMISSIONS & ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Batch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TestCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assessment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubmissionTestResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AssessmentResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SuspiciousEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;

-- Permissive policies for full CRUD via service_role and anon (assessment engine)
CREATE POLICY "FullAccess_User" ON "User" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_Batch" ON "Batch" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_StudentProfile" ON "StudentProfile" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AdminProfile" ON "AdminProfile" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_Question" ON "Question" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_TestCase" ON "TestCase" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_Assessment" ON "Assessment" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AssessmentQuestion" ON "AssessmentQuestion" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AssessmentAssignment" ON "AssessmentAssignment" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AssessmentAttempt" ON "AssessmentAttempt" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_Submission" ON "Submission" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_SubmissionTestResult" ON "SubmissionTestResult" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AssessmentResult" ON "AssessmentResult" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_SuspiciousEvent" ON "SuspiciousEvent" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_AuditLog" ON "AuditLog" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "FullAccess_Report" ON "Report" FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges to standard roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ==============================================================================
-- 4. SEED CORE DATA
-- ==============================================================================

-- 4.1 Academic Batch (III CSE C)
INSERT INTO "Batch" ("id", "name", "description", "academicYear", "code")
VALUES ('b3333333-3333-3333-3333-333333333333', 'III CSE C', 'Computer Science and Engineering - 3rd Year Section C', '2024-2028', 'CSE-III-C');

-- 4.2 Administrator: Mrs. VARSHA / Varsha G (Password: Varsha@123 / varshag@act3128)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u1111111-1111-1111-1111-111111111111', 'Varsha G', 'varsha.cse@act.edu.in', '${adminHash}', 'ADMIN', true);

INSERT INTO "AdminProfile" ("id", "userId", "designation", "department")
VALUES ('ap111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'Assistant Professor & Head of Assessment', 'Computer Science & Engineering');

-- 4.3 Coding Questions
INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
) VALUES (
    'q1111111-1111-1111-1111-111111111111',
    'Find Largest Element in Array',
    'Given an array of N integers, find and return the maximum element in the array.',
    'First line contains integer N (size of array).\nSecond line contains N space-separated integers.',
    'Print the maximum integer value found in the array.',
    '1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5',
    'The maximum number in [10, 20, 5, 40, 15] is 40.',
    'Easy',
    'Arrays',
    '{"python":"# Write your solution here\\n","javascript":"// Write your solution here\\n","java":"import java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        // Write your solution here\\n    }\\n}\\n","c":"#include <stdio.h>\\n\\nint main() {\\n    // Write your solution here\\n    return 0;\\n}\\n","cpp":"#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // Write your solution here\\n    return 0;\\n}\\n"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
);

INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation") VALUES
('tc111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', '5\n10 20 5 40 15', '40', false, 1, 'Sample case: 40 is largest'),
('tc111111-1111-1111-1111-111111111112', 'q1111111-1111-1111-1111-111111111111', '3\n-10 -50 -5', '-5', false, 2, 'Negative numbers case'),
('tc111111-1111-1111-1111-111111111113', 'q1111111-1111-1111-1111-111111111111', '1\n999', '999', true, 3, 'Single element boundary case'),
('tc111111-1111-1111-1111-111111111114', 'q1111111-1111-1111-1111-111111111111', '6\n100 200 50 300 120 300', '300', true, 4, 'Duplicate max values');

INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
) VALUES (
    'q2222222-2222-2222-2222-222222222222',
    'Two Sum Problem',
    'Given an array of integers and an integer target, return indices of the two numbers such that they add up to target.\nOutput the 0-based indices space-separated in ascending order.',
    'First line contains integer N (size) and target T.\nSecond line contains N space-separated integers.',
    'Print two space-separated integers representing the 0-based indices.',
    '2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    'nums[0] + nums[1] = 2 + 7 = 9, so output is 0 1.',
    'Easy',
    'Arrays',
    '{"python":"# Write your solution here\\n","javascript":"// Write your solution here\\n","java":"import java.util.*;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        // Write your solution here\\n    }\\n}\\n","c":"#include <stdio.h>\\n\\nint main() {\\n    // Write your solution here\\n    return 0;\\n}\\n","cpp":"#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // Write your solution here\\n    return 0;\\n}\\n"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
);

INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation") VALUES
('tc222222-2222-2222-2222-222222222221', 'q2222222-2222-2222-2222-222222222222', '4 9\n2 7 11 15', '0 1', false, 1, '2 + 7 = 9 at index 0 and 1'),
('tc222222-2222-2222-2222-222222222222', 'q2222222-2222-2222-2222-222222222222', '3 6\n3 2 4', '1 2', false, 2, '2 + 4 = 6 at index 1 and 2'),
('tc222222-2222-2222-2222-222222222223', 'q2222222-2222-2222-2222-222222222222', '2 6\n3 3', '0 1', true, 3, 'Duplicate elements summing to target');

-- 4.4 Assessment & Assignment
INSERT INTO "Assessment" (
    "id", "title", "description", "instructions", "duration", "totalMarks", "passingMarks",
    "allowedLanguages", "randomizeQuestions", "randomizeTestCases", "maxAttempts",
    "disableCopyPaste", "enforceFullscreen", "trackTabSwitches", "isPublished", "createdById"
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Core Programming & Problem Solving Assessment',
    'Proctored evaluation measuring algorithmic capability, problem decomposition, code correctness, and time complexity.',
    '1. Ensure you remain in fullscreen during the exam.\n2. Copy/pasting external code is strictly prohibited.\n3. Verify your solution against sample test cases before submitting.',
    60,
    25,
    15,
    'python,java,c,cpp',
    false,
    false,
    1,
    true,
    true,
    true,
    true,
    'u1111111-1111-1111-1111-111111111111'
);

INSERT INTO "AssessmentQuestion" ("id", "assessmentId", "questionId", "order", "marks") VALUES
('aq111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 1, 10),
('aq222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'q2222222-2222-2222-2222-222222222222', 2, 15);

INSERT INTO "AssessmentAssignment" ("id", "assessmentId", "batchId", "status") VALUES
('as333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'PENDING');

-- ==============================================================================
-- 4.5 SEED 65 STUDENT CANDIDATES (BATCH III CSE C)
-- Initial password is Date of Birth (DD-MM-YYYY)
-- ==============================================================================
`;

  for (const s of students) {
    const regNo = s.registerNumber.trim();
    const name = s.name.trim().replace(/'/g, "''");
    const email = s.defaultEmail.trim().toLowerCase();
    const dob = s.dob.trim();
    const hash = await bcrypt.hash(dob, 10);
    const userId = `u-std-${regNo}`;
    const profileId = `sp-std-${regNo}`;

    sql += `
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('${userId}', '${name}', '${email}', '${hash}', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('${profileId}', '${userId}', '${regNo}', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '${dob}');
`;
  }

  sql += `
-- ==============================================================================
-- END OF REBOOT SCHEMA & SEED
-- ==============================================================================
`;

  const outputPath = path.resolve('prisma/supabase_schema.sql');
  fs.writeFileSync(outputPath, sql, 'utf-8');
  console.log(`✅ Successfully generated ${outputPath} with 65 students, Admin Varsha G, and full schema reboot!`);
}

generate().catch(console.error);
