-- ==============================================================================
-- CodeAssess Platform — Complete Supabase PostgreSQL Schema & Seed
-- Target: https://xhikrplxtwzrxujmroqd.supabase.co
-- Generated for 1-Click execution in Supabase SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function to automatically update "updatedAt"
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Table: User
CREATE TABLE IF NOT EXISTS "User" (
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
CREATE TABLE IF NOT EXISTS "Batch" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" VARCHAR(255) NOT NULL UNIQUE,
    "description" TEXT,
    "academicYear" VARCHAR(50) NOT NULL DEFAULT '2025-2026',
    "code" VARCHAR(50) NOT NULL UNIQUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: StudentProfile
CREATE TABLE IF NOT EXISTS "StudentProfile" (
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
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "dob" VARCHAR(50);

-- Table: AdminProfile
CREATE TABLE IF NOT EXISTS "AdminProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
    "designation" VARCHAR(255) NOT NULL DEFAULT 'Faculty / Assessment Coordinator',
    "department" VARCHAR(255) NOT NULL DEFAULT 'Computer Science & Engineering',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Question
CREATE TABLE IF NOT EXISTS "Question" (
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
CREATE TABLE IF NOT EXISTS "TestCase" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "explanation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: Assessment
CREATE TABLE IF NOT EXISTS "Assessment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "startDate" TIMESTAMPTZ,
    "endDate" TIMESTAMPTZ,
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
CREATE TABLE IF NOT EXISTS "AssessmentQuestion" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "marks" INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT "AssessmentQuestion_assessmentId_questionId_key" UNIQUE ("assessmentId", "questionId")
);

-- Table: AssessmentAssignment
CREATE TABLE IF NOT EXISTS "AssessmentAssignment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "studentId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
    "batchId" TEXT REFERENCES "Batch"("id") ON DELETE CASCADE,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentAssignment_assessmentId_studentId_key" UNIQUE ("assessmentId", "studentId")
);

-- Table: AssessmentAttempt
CREATE TABLE IF NOT EXISTS "AssessmentAttempt" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "startTime" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitTime" TIMESTAMPTZ,
    "status" VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    "remainingSeconds" INTEGER NOT NULL DEFAULT 3600,
    "currentCodeDraftsJson" TEXT NOT NULL DEFAULT '{}',
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "suspiciousEventsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssessmentAttempt_assessmentId_studentId_key" UNIQUE ("assessmentId", "studentId")
);

-- Table: Submission
CREATE TABLE IF NOT EXISTS "Submission" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "assessmentId" TEXT REFERENCES "Assessment"("id") ON DELETE SET NULL,
    "questionId" TEXT NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "sourceCode" TEXT NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "executionTime" INTEGER NOT NULL DEFAULT 0,
    "memoryUsed" INTEGER NOT NULL DEFAULT 0,
    "testCasesPassed" INTEGER NOT NULL DEFAULT 0,
    "totalTestCases" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: SubmissionTestResult
CREATE TABLE IF NOT EXISTS "SubmissionTestResult" (
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
CREATE TABLE IF NOT EXISTS "AssessmentResult" (
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
CREATE TABLE IF NOT EXISTS "SuspiciousEvent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "assessmentId" TEXT NOT NULL REFERENCES "Assessment"("id") ON DELETE CASCADE,
    "eventType" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT
);

-- Table: AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
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
CREATE TABLE IF NOT EXISTS "Report" (
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
-- 3. TRIGGERS FOR AUTO UPDATED_AT
-- ==============================================================================
DROP TRIGGER IF EXISTS set_updated_at_user ON "User";
CREATE TRIGGER set_updated_at_user BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_batch ON "Batch";
CREATE TRIGGER set_updated_at_batch BEFORE UPDATE ON "Batch" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_student_profile ON "StudentProfile";
CREATE TRIGGER set_updated_at_student_profile BEFORE UPDATE ON "StudentProfile" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_admin_profile ON "AdminProfile";
CREATE TRIGGER set_updated_at_admin_profile BEFORE UPDATE ON "AdminProfile" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_question ON "Question";
CREATE TRIGGER set_updated_at_question BEFORE UPDATE ON "Question" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_assessment ON "Assessment";
CREATE TRIGGER set_updated_at_assessment BEFORE UPDATE ON "Assessment" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_attempt ON "AssessmentAttempt";
CREATE TRIGGER set_updated_at_attempt BEFORE UPDATE ON "AssessmentAttempt" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 4. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_student_profile_user" ON "StudentProfile"("userId");
CREATE INDEX IF NOT EXISTS "idx_student_profile_batch" ON "StudentProfile"("batchId");
CREATE INDEX IF NOT EXISTS "idx_student_profile_roll" ON "StudentProfile"("rollNumber");
CREATE INDEX IF NOT EXISTS "idx_question_category" ON "Question"("category");
CREATE INDEX IF NOT EXISTS "idx_question_difficulty" ON "Question"("difficulty");
CREATE INDEX IF NOT EXISTS "idx_testcase_question" ON "TestCase"("questionId");
CREATE INDEX IF NOT EXISTS "idx_assessment_createdby" ON "Assessment"("createdById");
CREATE INDEX IF NOT EXISTS "idx_assessment_question_assessment" ON "AssessmentQuestion"("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_assessment_question_question" ON "AssessmentQuestion"("questionId");
CREATE INDEX IF NOT EXISTS "idx_assignment_student" ON "AssessmentAssignment"("studentId");
CREATE INDEX IF NOT EXISTS "idx_assignment_batch" ON "AssessmentAssignment"("batchId");
CREATE INDEX IF NOT EXISTS "idx_attempt_student" ON "AssessmentAttempt"("studentId");
CREATE INDEX IF NOT EXISTS "idx_attempt_assessment" ON "AssessmentAttempt"("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_submission_student" ON "Submission"("studentId");
CREATE INDEX IF NOT EXISTS "idx_submission_assessment" ON "Submission"("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_submission_question" ON "Submission"("questionId");
CREATE INDEX IF NOT EXISTS "idx_submission_status" ON "Submission"("status");
CREATE INDEX IF NOT EXISTS "idx_submission_time" ON "Submission"("submittedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_sub_test_result_sub" ON "SubmissionTestResult"("submissionId");
CREATE INDEX IF NOT EXISTS "idx_result_assessment" ON "AssessmentResult"("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_result_student" ON "AssessmentResult"("studentId");
CREATE INDEX IF NOT EXISTS "idx_result_rank" ON "AssessmentResult"("rank");
CREATE INDEX IF NOT EXISTS "idx_suspicious_assessment" ON "SuspiciousEvent"("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_suspicious_student" ON "SuspiciousEvent"("studentId");
CREATE INDEX IF NOT EXISTS "idx_audit_user" ON "AuditLog"("userId");

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
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

-- Service role & backend API key bypass for seamless Prisma & Express operation
DROP POLICY IF EXISTS "Service role full access on User" ON "User";
CREATE POLICY "Service role full access on User" ON "User" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on Batch" ON "Batch";
CREATE POLICY "Service role full access on Batch" ON "Batch" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on StudentProfile" ON "StudentProfile";
CREATE POLICY "Service role full access on StudentProfile" ON "StudentProfile" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AdminProfile" ON "AdminProfile";
CREATE POLICY "Service role full access on AdminProfile" ON "AdminProfile" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on Question" ON "Question";
CREATE POLICY "Service role full access on Question" ON "Question" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on TestCase" ON "TestCase";
CREATE POLICY "Service role full access on TestCase" ON "TestCase" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on Assessment" ON "Assessment";
CREATE POLICY "Service role full access on Assessment" ON "Assessment" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AssessmentQuestion" ON "AssessmentQuestion";
CREATE POLICY "Service role full access on AssessmentQuestion" ON "AssessmentQuestion" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AssessmentAssignment" ON "AssessmentAssignment";
CREATE POLICY "Service role full access on AssessmentAssignment" ON "AssessmentAssignment" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AssessmentAttempt" ON "AssessmentAttempt";
CREATE POLICY "Service role full access on AssessmentAttempt" ON "AssessmentAttempt" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on Submission" ON "Submission";
CREATE POLICY "Service role full access on Submission" ON "Submission" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on SubmissionTestResult" ON "SubmissionTestResult";
CREATE POLICY "Service role full access on SubmissionTestResult" ON "SubmissionTestResult" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AssessmentResult" ON "AssessmentResult";
CREATE POLICY "Service role full access on AssessmentResult" ON "AssessmentResult" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on SuspiciousEvent" ON "SuspiciousEvent";
CREATE POLICY "Service role full access on SuspiciousEvent" ON "SuspiciousEvent" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on AuditLog" ON "AuditLog";
CREATE POLICY "Service role full access on AuditLog" ON "AuditLog" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on Report" ON "Report";
CREATE POLICY "Service role full access on Report" ON "Report" FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. SEED INITIAL CORE DATA
-- ==============================================================================

-- 6.1 Academic Batch
INSERT INTO "Batch" ("id", "name", "description", "academicYear", "code")
VALUES 
    ('b3333333-3333-3333-3333-333333333333', 'III CSE C', 'Computer Science and Engineering - 3rd Year Section C', '2024-2028', 'CSE-III-C')
ON CONFLICT ("code") DO NOTHING;

-- 6.2 Administrator Account (Password: Varsha@123 / varshag@act3128)
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES 
    ('u1111111-1111-1111-1111-111111111111', 'Mrs. VARSHA', 'varsha.cse@act.edu.in', '$2a$10$J8Un2.cMQELmMiMZ2nU9FePLJt9xi4R0VP.GcCV0zR.SNWmxgLV8e', 'ADMIN', true)
ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "email" = EXCLUDED."email", "passwordHash" = EXCLUDED."passwordHash";

INSERT INTO "AdminProfile" ("id", "userId", "designation", "department")
VALUES 
    ('ap111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'Assistant Professor & Head of Assessment', 'Computer Science & Engineering')
ON CONFLICT ("userId") DO UPDATE SET "designation" = EXCLUDED."designation";

-- 6.4 Core Coding Assessment Questions with Starter Codes & Test Cases
-- Question 1: Find Largest Element
INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
)
VALUES (
    'q1111111-1111-1111-1111-111111111111',
    'Find Largest Element in Array',
    'Given an array of N integers, find and return the maximum element in the array.',
    'First line contains integer N (size of array).\nSecond line contains N space-separated integers.',
    'Print the maximum integer value found in the array.',
    '1 <= N <= 1000\n-10^5 <= arr[i] <= 10^5',
    'The maximum number in [10, 20, 5, 40, 15] is 40.',
    'Easy',
    'Arrays',
    10,
    '{"python":"import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    arr = [int(x) for x in lines[1:n+1]]\n    print(max(arr))\n\nif __name__ == \"__main__\":\n    solve()","java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int maxVal = Integer.MIN_VALUE;\n        for (int i = 0; i < n; i++) {\n            maxVal = Math.max(maxVal, sc.nextInt());\n        }\n        System.out.println(maxVal);\n    }\n}","c":"#include <stdio.h>\n#include <limits.h>\n\nint main() {\n    int n;\n    if (scanf(\"%d\", &n) != 1) return 0;\n    int max_val = INT_MIN;\n    for (int i = 0; i < n; i++) {\n        int val;\n        scanf(\"%d\", &val);\n        if (val > max_val) max_val = val;\n    }\n    printf(\"%d\\n\", max_val);\n    return 0;\n}","cpp":"#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n;\n    if (!(cin >> n)) return 0;\n    int max_val = -1e9;\n    for (int i = 0; i < n; ++i) {\n        int x; cin >> x;\n        max_val = max(max_val, x);\n    }\n    cout << max_val << endl;\n    return 0;\n}"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
)
ON CONFLICT ("id") DO NOTHING;

-- Test Cases for Question 1
INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation")
VALUES
    ('tc111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', '5\n10 20 5 40 15', '40', false, 1, 'Sample case: 40 is largest'),
    ('tc111111-1111-1111-1111-111111111112', 'q1111111-1111-1111-1111-111111111111', '3\n-10 -50 -5', '-5', false, 2, 'Negative numbers case'),
    ('tc111111-1111-1111-1111-111111111113', 'q1111111-1111-1111-1111-111111111111', '1\n999', '999', true, 3, 'Single element boundary case'),
    ('tc111111-1111-1111-1111-111111111114', 'q1111111-1111-1111-1111-111111111111', '6\n100 200 50 300 120 300', '300', true, 4, 'Duplicate max values')
ON CONFLICT ("id") DO NOTHING;

-- Question 2: Two Sum Problem
INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
)
VALUES (
    'q2222222-2222-2222-2222-222222222222',
    'Two Sum Problem',
    'Given an array of integers and an integer target, return indices of the two numbers such that they add up to target.\nOutput the 0-based indices space-separated in ascending order.',
    'First line contains integer N (size) and target T.\nSecond line contains N space-separated integers.',
    'Print two space-separated integers representing the 0-based indices.',
    '2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
    'nums[0] + nums[1] = 2 + 7 = 9, so output is 0 1.',
    'Easy',
    'Arrays',
    15,
    '{"python":"import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n, target = int(lines[0]), int(lines[1])\n    nums = [int(x) for x in lines[2:2+n]]\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            print(f\"{seen[comp]} {i}\")\n            return\n        seen[num] = i\n\nif __name__ == \"__main__\":\n    solve()","java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int val = sc.nextInt();\n            int comp = target - val;\n            if (map.containsKey(comp)) {\n                System.out.println(map.get(comp) + \" \" + i);\n                return;\n            }\n            map.put(val, i);\n        }\n    }\n}","c":"#include <stdio.h>\n\nint main() {\n    int n, target;\n    if (scanf(\"%d %d\", &n, &target) != 2) return 0;\n    int arr[10005];\n    for (int i = 0; i < n; i++) scanf(\"%d\", &arr[i]);\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (arr[i] + arr[j] == target) {\n                printf(\"%d %d\\n\", i, j);\n                return 0;\n            }\n        }\n    }\n    return 0;\n}","cpp":"#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    unordered_map<int, int> seen;\n    for (int i = 0; i < n; ++i) {\n        int x; cin >> x;\n        int comp = target - x;\n        if (seen.count(comp)) {\n            cout << seen[comp] << \" \" << i << endl;\n            return 0;\n        }\n        seen[x] = i;\n    }\n    return 0;\n}"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
)
ON CONFLICT ("id") DO NOTHING;

-- Test Cases for Question 2
INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation")
VALUES
    ('tc222222-2222-2222-2222-222222222221', 'q2222222-2222-2222-2222-222222222222', '4 9\n2 7 11 15', '0 1', false, 1, '2 + 7 = 9 at index 0 and 1'),
    ('tc222222-2222-2222-2222-222222222222', 'q2222222-2222-2222-2222-222222222222', '3 6\n3 2 4', '1 2', false, 2, '2 + 4 = 6 at index 1 and 2'),
    ('tc222222-2222-2222-2222-222222222223', 'q2222222-2222-2222-2222-222222222222', '2 6\n3 3', '0 1', true, 3, 'Duplicate elements summing to target')
ON CONFLICT ("id") DO NOTHING;

-- Question 3: Valid Parentheses
INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
)
VALUES (
    'q3333333-3333-3333-3333-333333333333',
    'Valid Parentheses String',
    'Given a string containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.\nAn input string is valid if open brackets are closed by the same type and in correct order.',
    'A single line containing the string S.',
    'Print "true" if valid, otherwise print "false".',
    '1 <= len(S) <= 10^4\nString consists of parentheses only.',
    '"()[]{}" is valid. "(]" is not valid.',
    'Medium',
    'Data Structures',
    15,
    '{"python":"import sys\n\ndef is_valid(s):\n    stack = []\n    mapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else \"#\"\n            if mapping[char] != top: return \"false\"\n        else:\n            stack.append(char)\n    return \"true\" if not stack else \"false\"\n\nif __name__ == \"__main__\":\n    s = sys.stdin.read().strip()\n    print(is_valid(s))","java":"import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        Stack<Character> stack = new Stack<>();\n        boolean valid = true;\n        for (char c : s.toCharArray()) {\n            if (c == ''('' || c == ''{'' || c == ''['') stack.push(c);\n            else {\n                if (stack.isEmpty()) { valid = false; break; }\n                char top = stack.pop();\n                if (c == '')'' && top != ''('') { valid = false; break; }\n                if (c == ''}'' && top != ''{'') { valid = false; break; }\n                if (c == '']'' && top != ''['') { valid = false; break; }\n            }\n        }\n        if (!stack.isEmpty()) valid = false;\n        System.out.println(valid ? \"true\" : \"false\");\n    }\n}","c":"#include <stdio.h>\n#include <string.h>\n#include <stdbool.h>\n\nint main() {\n    char s[10005];\n    if (scanf(\"%s\", s) != 1) return 0;\n    char stack[10005];\n    int top = -1;\n    bool valid = true;\n    for (int i = 0; s[i]; i++) {\n        char c = s[i];\n        if (c == ''('' || c == ''{'' || c == ''['') stack[++top] = c;\n        else {\n            if (top == -1) { valid = false; break; }\n            char open = stack[top--];\n            if (c == '')'' && open != ''('') { valid = false; break; }\n            if (c == ''}'' && open != ''{'') { valid = false; break; }\n            if (c == '']'' && open != ''['') { valid = false; break; }\n        }\n    }\n    if (top != -1) valid = false;\n    printf(\"%s\\n\", valid ? \"true\" : \"false\");\n    return 0;\n}","cpp":"#include <iostream>\n#include <string>\n#include <stack>\nusing namespace std;\n\nint main() {\n    string s;\n    if (!(cin >> s)) return 0;\n    stack<char> st;\n    bool ok = true;\n    for (char c : s) {\n        if (c == ''('' || c == ''{'' || c == ''['') st.push(c);\n        else {\n            if (st.empty()) { ok = false; break; }\n            char top = st.top(); st.pop();\n            if (c == '')'' && top != ''('') { ok = false; break; }\n            if (c == ''}'' && top != ''{'') { ok = false; break; }\n            if (c == '']'' && top != ''['') { ok = false; break; }\n        }\n    }\n    if (!st.empty()) ok = false;\n    cout << (ok ? \"true\" : \"false\") << endl;\n    return 0;\n}"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
)
ON CONFLICT ("id") DO NOTHING;

-- Test Cases for Question 3
INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation")
VALUES
    ('tc333333-3333-3333-3333-333333333331', 'q3333333-3333-3333-3333-333333333333', '()', 'true', false, 1, 'Simple matched pair'),
    ('tc333333-3333-3333-3333-333333333332', 'q3333333-3333-3333-3333-333333333333', '()[]{}', 'true', false, 2, 'Multiple sequential pairs'),
    ('tc333333-3333-3333-3333-333333333333', 'q3333333-3333-3333-3333-333333333333', '(]', 'false', false, 3, 'Mismatched brackets'),
    ('tc333333-3333-3333-3333-333333333334', 'q3333333-3333-3333-3333-333333333333', '([{}])', 'true', true, 4, 'Nested valid parentheses')
ON CONFLICT ("id") DO NOTHING;

-- 6.5 Sample Published Assessment
INSERT INTO "Assessment" (
    "id", "title", "description", "instructions", "duration", "totalMarks", "passingMarks",
    "allowedLanguages", "randomizeQuestions", "randomizeTestCases", "maxAttempts",
    "disableCopyPaste", "enforceFullscreen", "trackTabSwitches", "isPublished", "createdById"
)
VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Core Programming & Problem Solving Assessment',
    'Proctored evaluation measuring algorithmic capability, problem decomposition, code correctness, and time complexity.',
    '1. Ensure you remain in fullscreen during the exam.\n2. Copy/pasting external code is strictly prohibited and logged.\n3. Verify your solution against sample test cases before submitting.',
    60,
    40,
    20,
    'python,java,c,cpp',
    false,
    false,
    1,
    true,
    true,
    true,
    true,
    'u1111111-1111-1111-1111-111111111111'
)
ON CONFLICT ("id") DO NOTHING;

-- Link Questions to Assessment
INSERT INTO "AssessmentQuestion" ("id", "assessmentId", "questionId", "order", "marks")
VALUES
    ('aq111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', 1, 10),
    ('aq222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'q2222222-2222-2222-2222-222222222222', 2, 15),
    ('aq333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'q3333333-3333-3333-3333-333333333333', 3, 15)
ON CONFLICT ("assessmentId", "questionId") DO NOTHING;

-- Assign Assessment to Batch III CSE C
INSERT INTO "AssessmentAssignment" ("id", "assessmentId", "batchId", "status")
VALUES 
    ('as333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'PENDING')
ON CONFLICT ("assessmentId", "batchId") DO NOTHING;

-- ==============================================================================
-- 6.5 65 Student Candidates from III C DOB.xlsx (DOB Initial Passwords)
-- ==============================================================================

-- Insert 65 Student Candidate Accounts
INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104126', 'RAKSHAA S M', '312824104126@act.edu.in', '$2a$10$y3DbV3YYU.fMIJR4j933AOMhooXrbVxlkteNRM2kfhImCd4zOVI5e', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104126', 'u-std-312824104126', '312824104126', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '16-06-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104127', 'RAMYA R', '312824104127@act.edu.in', '$2a$10$PaN7Kz0SbZ29KLskYIJglO6VymxKxG.SLztTmBch5FTJwjJmjfVLi', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104127', 'u-std-312824104127', '312824104127', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-11-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104128', 'RANJITH S', '312824104128@act.edu.in', '$2a$10$jUIZsF0L6zKnn/TyTIgCk.c/zWWSqwA0C7G/Q.3HQoVZTPeYwixnS', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104128', 'u-std-312824104128', '312824104128', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-06-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104129', 'ROGITH RAADHAKRISHNAN C S', '312824104129@act.edu.in', '$2a$10$aLqfekOLPv5SzBcZcyQ.2etf/i1nxdBV8eWBdIfuZnzvWdajLkIcm', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104129', 'u-std-312824104129', '312824104129', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '05-12-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104130', 'ROHAN S', '312824104130@act.edu.in', '$2a$10$j/lqn039C8LCwdb9yGJMe.cEQrseJq3KK/SG8TQcDRhZVcyHc7Buq', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104130', 'u-std-312824104130', '312824104130', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104131', 'ROSHAN PARVEEN S', '312824104131@act.edu.in', '$2a$10$RqOD3WCuExAeDqBZ1VqcquIMj4OGVEP15v0oOtMbBcy7GxkwQjjIO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104131', 'u-std-312824104131', '312824104131', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104132', 'ROSHITH D R', '312824104132@act.edu.in', '$2a$10$gYGd83WzcYBlS1D9zLm0UuLxwWqtrLu1.CJicot66egsbU09kZvtG', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104132', 'u-std-312824104132', '312824104132', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '30-06-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104133', 'RUBENTHAR R', '312824104133@act.edu.in', '$2a$10$aMPsiMaYluAp7oFjc3zg4u59Q5LB8M7HSM.FyHvTk.1ShCiiIoQta', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104133', 'u-std-312824104133', '312824104133', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '22-11-2003')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104134', 'RUPIKA S', '312824104134@act.edu.in', '$2a$10$HRXRKw1gjPiIDWcRJh1Ymu9vWRnCbnJ7CCOcFuBRMFmWqAssP1dSy', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104134', 'u-std-312824104134', '312824104134', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-11-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104135', 'SACHIN HARI OM S', '312824104135@act.edu.in', '$2a$10$KDc6ZIFtPO.r3mwSPpKEUuRaOsv/WkLF7kY96VA/v7.VFaLqaLTsW', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104135', 'u-std-312824104135', '312824104135', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '23-05-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104136', 'SAI GEETHA G', '312824104136@act.edu.in', '$2a$10$JvQN/uL0VC5QBqT8yYulTux89RNL2REP.xq.1F8uANyUsfbiYz.EW', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104136', 'u-std-312824104136', '312824104136', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '28-11-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104137', 'SAI LEKHA S A', '312824104137@act.edu.in', '$2a$10$CC2IunoSbDWPSnkIVYI8.uHMKZp4Wt34WahXbdR7QvjrKAXLF89hy', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104137', 'u-std-312824104137', '312824104137', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-04-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104138', 'SAI SANJAY R', '312824104138@act.edu.in', '$2a$10$kDM7GhUHDRbQZyDCq4UN3Olln6UK43rj88.uaN60AOclZG0k6fitm', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104138', 'u-std-312824104138', '312824104138', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-02-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104139', 'SAMIKSHA SRI A', '312824104139@act.edu.in', '$2a$10$Ygx1LIqkxlyJritNiOGBqeiAcqZUGjqIUOjDCPWvtkT9WIFISxL0O', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104139', 'u-std-312824104139', '312824104139', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '13-08-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104140', 'SANDHIYA R', '312824104140@act.edu.in', '$2a$10$p4EWgszODkRMJTEkCgooDOyEt0.xm3xxAK5QCKthAZkqC21xabtk.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104140', 'u-std-312824104140', '312824104140', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-06-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104141', 'SANDHIYA S', '312824104141@act.edu.in', '$2a$10$aWjrqPHXnoVsWtYCgtBC3OkxTX20R7ga856AwfVYN/s/pV5eB/zmK', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104141', 'u-std-312824104141', '312824104141', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-01-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104142', 'SANJAI C', '312824104142@act.edu.in', '$2a$10$AZ8MrfASeq3y8oHVTBoWP.d3EREqFQ2CT3mOBK8bpQzUcsgUYDT/u', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104142', 'u-std-312824104142', '312824104142', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '29-05-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104143', 'SANJAY V', '312824104143@act.edu.in', '$2a$10$u2jP09WEiavakLlo7lWN2edqE..rTzzkhRumMCN64KPHwsITEdKTu', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104143', 'u-std-312824104143', '312824104143', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-03-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104144', 'SANTHOSH KUMAR R', '312824104144@act.edu.in', '$2a$10$VDU9QNEZs268n5EYSD/DfuhiJBPG/mjQKuAEdIi0fF4P4B9aV9.wy', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104144', 'u-std-312824104144', '312824104144', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-06-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104145', 'SARAN CHELLAN A', '312824104145@act.edu.in', '$2a$10$W/k1gcQxl5xAEHo7MUIjpu1ZWDttkJnUxnHc1BLu7CQj4TUajcnBC', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104145', 'u-std-312824104145', '312824104145', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-04-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104146', 'SARANRAJ S', '312824104146@act.edu.in', '$2a$10$jpTv6VGkm4e8.oZslrSWxeUHfLz92H9YmQxHgJZtBo7zwjpWovtDO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104146', 'u-std-312824104146', '312824104146', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '15-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104147', 'SELVI P', '312824104147@act.edu.in', '$2a$10$jVLlbHgyjR989e2RdOzyVu0GzoGNy.fWj7848QRTG.4/SlNBpYVca', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104147', 'u-std-312824104147', '312824104147', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '15-08-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104148', 'SHALINI S', '312824104148@act.edu.in', '$2a$10$otF0ZGZXbDimflHXYnTQZuTRrvr6E7gie.tLsRnjaGpyrqJz.3lc6', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104148', 'u-std-312824104148', '312824104148', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '01-10-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104149', 'SHANMUGA SUNDARAM R', '312824104149@act.edu.in', '$2a$10$uxO1Qla7qdKcWv00aroJpO2FyTGtbrWu3Hw3LQfBiI4x.XrJzCdR6', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104149', 'u-std-312824104149', '312824104149', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-08-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104150', 'SHANMUGAPRIYAN M A', '312824104150@act.edu.in', '$2a$10$QuWrVSrXb0t1uAAzCHs1veTpUz9.z0V8o91VFj5lZ1qpy6.RjpAja', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104150', 'u-std-312824104150', '312824104150', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '19-08-2005')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104151', 'SHARMILA R', '312824104151@act.edu.in', '$2a$10$R9Pd/Dp.H3y8gmcH/DU4s.rsjNIZ1Gr2pbF8UFVfDSFm9RVRlCZhq', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104151', 'u-std-312824104151', '312824104151', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104152', 'SHAYANA SHREE Y', '312824104152@act.edu.in', '$2a$10$sHOEtBHEOSGV1QoPtbJqEeWPbDg3/Gs/AIWS22mB6wdsOafbGX7qe', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104152', 'u-std-312824104152', '312824104152', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '04-02-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104153', 'SIVA DHARSHINI P', '312824104153@act.edu.in', '$2a$10$jyjnStfbXhjDYt/zT4M4cOh.puHTjGeaklh7x9kCTWnDK0p.R3TvO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104153', 'u-std-312824104153', '312824104153', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-03-2024')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104154', 'SIVANTHI V', '312824104154@act.edu.in', '$2a$10$NZw1kUuDMVbe816w5OP5xOFjqLd1nu5Fcrvr4pco/fGpPluS/EKqe', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104154', 'u-std-312824104154', '312824104154', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '28-08-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104155', 'SOWMYASRI P', '312824104155@act.edu.in', '$2a$10$lQ4nxTupGRP14E9SiqLSqOsKnBVvL9i7we0S47rROy0pyPGmvEHG.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104155', 'u-std-312824104155', '312824104155', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104156', 'SRI DHARSHINI A', '312824104156@act.edu.in', '$2a$10$mXxgtQ4uSfXoIsFDNtXVEOXLeTi35Ruk6TJHw.KkNire6HL2hKO/.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104156', 'u-std-312824104156', '312824104156', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-02-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104157', 'SRIRAGHAVAN K', '312824104157@act.edu.in', '$2a$10$Y6fYjHZJ2a.SMZVh7WBUNOZGMAraolP5iXb4MynuEQy0JhEWbCfOO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104157', 'u-std-312824104157', '312824104157', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104158', 'SRIVASTHAVA S P B', '312824104158@act.edu.in', '$2a$10$0/UnUTiqhdP6dEMFgwpidutvHy91.0YNTJKIEAoJPt1sxwo.jmXDK', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104158', 'u-std-312824104158', '312824104158', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '24-01-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104159', 'SUBA SRI R', '312824104159@act.edu.in', '$2a$10$fu3wHXVy5rFzkDL0O67HheCKnceOMe3e1tKD7EuF4B/O1itV9ev02', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104159', 'u-std-312824104159', '312824104159', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-05-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104160', 'SUPRAJA K L', '312824104160@act.edu.in', '$2a$10$MTrcQhM6pl6fFLrdCVBplul72uIA4fzZVQg8u13v47QPBKsqdyw/y', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104160', 'u-std-312824104160', '312824104160', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-05-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104161', 'SURIYA S K', '312824104161@act.edu.in', '$2a$10$NtN4HQfu7MXv9rCXZkrep.xacDumRCO/SYnLfE7qcOGbmXXIXl79e', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104161', 'u-std-312824104161', '312824104161', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '27-05-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104162', 'SURYA R', '312824104162@act.edu.in', '$2a$10$SL1hd.0EgY5Hew0fCw6NlOKscJZ/P2b6lSvq.3JPaknknhLpV9hr.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104162', 'u-std-312824104162', '312824104162', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '04-12-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104163', 'SURYA S', '312824104163@act.edu.in', '$2a$10$gYu8BUzfg9.3inJf.xk96uRUMM/2H0T3mACJtARdhFKHH4.3tHwti', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104163', 'u-std-312824104163', '312824104163', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-09-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104164', 'SUSHMITHA P', '312824104164@act.edu.in', '$2a$10$a/ra122DRnIYuwq20sXvc.0k17y7niHi8aXnqaz1zIHv9LFSnD1re', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104164', 'u-std-312824104164', '312824104164', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '29-09-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104165', 'SUVARSHA S', '312824104165@act.edu.in', '$2a$10$boUL0nePWKfTTKiTU5ZmgOyx.OO/b3jNKunvTpPtbU6YvCYQrxuiC', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104165', 'u-std-312824104165', '312824104165', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-08-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104166', 'TARA V', '312824104166@act.edu.in', '$2a$10$R7WjyleoTnO49gZFAOzUiegO7LAI.d8xHd0l2iGHcnSTM92hCXrwG', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104166', 'u-std-312824104166', '312824104166', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '02-09-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104167', 'TEBIN TITUS T', '312824104167@act.edu.in', '$2a$10$29a9oaQ3L03H9RM/zKVC.umW8VgQC6l.Wz.QIHxjNQO4A.Eo874DO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104167', 'u-std-312824104167', '312824104167', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '08-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104168', 'THARUN G', '312824104168@act.edu.in', '$2a$10$lpRHKQuu3CowDtT6SG8I5O4uM8oZ28pxcoMD8OvcCme04grctYgnq', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104168', 'u-std-312824104168', '312824104168', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-07-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104169', 'THIREJA S A', '312824104169@act.edu.in', '$2a$10$co0eKMQXqcbLUxGEyjn0ie5dDp/g3MoDJFu7DzLDn2bvFl4PwerMO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104169', 'u-std-312824104169', '312824104169', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '20-11-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104170', 'THIRUSELVAN P', '312824104170@act.edu.in', '$2a$10$TeNtxXX6cf7vBvkImVk/ge0Qlnt8L3BTejTiWUdzdBITgkyx9Rh1q', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104170', 'u-std-312824104170', '312824104170', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-12-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104171', 'UDHAYA D', '312824104171@act.edu.in', '$2a$10$M1Ma/4NIXePKOHn3JbIuXuKiyKybG/1mBAvqRbZyfmModNIVKosTG', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104171', 'u-std-312824104171', '312824104171', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104172', 'UMMU FAALIHA M', '312824104172@act.edu.in', '$2a$10$dTbbVq9Z.EkFQqw7/nMs..y08PgSNu/ThrANCKV8XyXniND8q5pBW', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104172', 'u-std-312824104172', '312824104172', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '05-10-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104173', 'URASRI M', '312824104173@act.edu.in', '$2a$10$yNNCTS7RInTeZh1Z8x3G3e65YutrLGZbb80Dz0Nx3QEzcWzReYPJO', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104173', 'u-std-312824104173', '312824104173', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '23-03-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104174', 'VENNILA R', '312824104174@act.edu.in', '$2a$10$.QK3D5yQsxzpkZJ8AL79eOsqGvnWDuYPkn8WGngb2sG2Ei19Kpd7q', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104174', 'u-std-312824104174', '312824104174', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '08-03-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104175', 'VIDYASRI M', '312824104175@act.edu.in', '$2a$10$GqFyQildJLSJ4bx9H5CHfO7gz2LRbFpyPOElf9zyfpx/8wFn6d99.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104175', 'u-std-312824104175', '312824104175', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '17-08-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104176', 'VIGNESH D', '312824104176@act.edu.in', '$2a$10$BCBVWzvF7BAbDUO0S09q1OGGUBszb7jsLrYEKaXCqhc4HGNZ5iUUa', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104176', 'u-std-312824104176', '312824104176', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '13-01-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104177', 'VIGNESH J', '312824104177@act.edu.in', '$2a$10$WQynY3EGVr5OEdqmxaL6/em1R4EIUYhrg089JjN.FJPdNIviYOBsm', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104177', 'u-std-312824104177', '312824104177', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104178', 'VIGNESH V', '312824104178@act.edu.in', '$2a$10$AQ1p5C1R1xEf0mzqewwGjO5yTBPXLqF/aE9mOq33d.S1wfIJwLDNa', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104178', 'u-std-312824104178', '312824104178', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-08-2005')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104179', 'VIJAYALAKSHMI S', '312824104179@act.edu.in', '$2a$10$.D9z6L78JUcS6TqHY7eIVuE38.vbCzzs0J46l.Knm21Nd6h9ir4GG', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104179', 'u-std-312824104179', '312824104179', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-08-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104180', 'VINITHA B', '312824104180@act.edu.in', '$2a$10$ybfktGjyEeRsFS4HNpL92uzMX//BgCJDkPhmZdzdU9TopVB7GGWg6', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104180', 'u-std-312824104180', '312824104180', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-07-2024')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104181', 'VISHAL A - (18-03-2006)', '312824104181@act.edu.in', '$2a$10$eBAXEc7Ci7IrsSbGpeUyyepOYg2UPk3x9Dv5.CYDjFkYWVY6ltX2W', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104181', 'u-std-312824104181', '312824104181', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104182', 'VISHAL A - (03-07-2006)', '312824104182@act.edu.in', '$2a$10$wp7w7RE8aED/.7AV47qqPeD0qN5WLJeFSTyLlCVBHn6QH5npdJc7S', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104182', 'u-std-312824104182', '312824104182', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104183', 'VISHALI P', '312824104183@act.edu.in', '$2a$10$yEwSF4wOQE2g81TWhR9WIeuMy8.C2LG/iVdGKVowzWEESbsblIw4i', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104183', 'u-std-312824104183', '312824104183', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-05-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104184', 'VISHNU PRAKASH C', '312824104184@act.edu.in', '$2a$10$QhPshGH6sKzW4e/C4i.PDeBOZoIa0K5AJVoNDbV/JPkzils2eCeMq', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104184', 'u-std-312824104184', '312824104184', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-08-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104185', 'VITHIYA A', '312824104185@act.edu.in', '$2a$10$mKTRPkYGWFb6S.L0etW.u.okuIqIfNO741bqJPOxazab/BBAYNaO6', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104185', 'u-std-312824104185', '312824104185', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '20-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104186', 'WILLIAM DAVID K', '312824104186@act.edu.in', '$2a$10$3FfaHhCmI.LrIHmJKnnVBeMR2ZMo1e/4K2FZ2/2TfXPC/broIAw8S', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104186', 'u-std-312824104186', '312824104186', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '30-10-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104187', 'YUGAN RAJ J', '312824104187@act.edu.in', '$2a$10$8zx9oWAhrfDsGixYQma.AuisUF.B8wwImuHgh6OJ1bhn7c0GI.Cnu', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104187', 'u-std-312824104187', '312824104187', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '17-04-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104188', 'YUVARAJ V', '312824104188@act.edu.in', '$2a$10$Gwv4TsC.EBthSLhFGdvVB.jJ8ajfYJ0qnkMwDf51iKirv5dEcRugu', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104188', 'u-std-312824104188', '312824104188', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-09-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104189', 'YUVASHRI T', '312824104189@act.edu.in', '$2a$10$G9Ln2Y2.e/Aa8y/NeFjBJufWP2vvB2MKgWm1nUM6y88D9L9F9TgL.', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104189', 'u-std-312824104189', '312824104189', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '16-01-2007')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104301', 'LAKSHMAN ASWANTH', '312824104301@act.edu.in', '$2a$10$pYGTPuJnisNsMe7kWWwx1uAgzlGSuHU4Jwht1aQGfc4Ct2rxM1HtG', 'STUDENT', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104301', 'u-std-312824104301', '312824104301', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '31-03-2006')
ON CONFLICT ("userId") DO UPDATE SET "dob" = EXCLUDED."dob", "rollNumber" = EXCLUDED."rollNumber", "batchId" = EXCLUDED."batchId";

