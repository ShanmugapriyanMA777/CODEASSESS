-- ==============================================================================
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
VALUES ('u1111111-1111-1111-1111-111111111111', 'Varsha G', 'varsha.cse@act.edu.in', '$2a$10$6.gGdT7NWCii2TDl06oyLuQc9uE8iD3PIp6Vusf95XtttzuFy.mVK', 'ADMIN', true);

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
    'First line contains integer N (size of array).
Second line contains N space-separated integers.',
    'Print the maximum integer value found in the array.',
    '1 <= N <= 1000
-10^5 <= arr[i] <= 10^5',
    'The maximum number in [10, 20, 5, 40, 15] is 40.',
    'Easy',
    'Arrays',
    10,
    '{"python":"import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    print(max(arr))

if __name__ == "__main__":
    solve()","java":"import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int maxVal = Integer.MIN_VALUE;
        for (int i = 0; i < n; i++) {
            maxVal = Math.max(maxVal, sc.nextInt());
        }
        System.out.println(maxVal);
    }
}","c":"#include <stdio.h>
#include <limits.h>

int main() {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    int max_val = INT_MIN;
    for (int i = 0; i < n; i++) {
        int val;
        scanf("%d", &val);
        if (val > max_val) max_val = val;
    }
    printf("%d\n", max_val);
    return 0;
}","cpp":"#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    int max_val = -1e9;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        max_val = max(max_val, x);
    }
    cout << max_val << endl;
    return 0;
}"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
);

INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation") VALUES
('tc111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', '5
10 20 5 40 15', '40', false, 1, 'Sample case: 40 is largest'),
('tc111111-1111-1111-1111-111111111112', 'q1111111-1111-1111-1111-111111111111', '3
-10 -50 -5', '-5', false, 2, 'Negative numbers case'),
('tc111111-1111-1111-1111-111111111113', 'q1111111-1111-1111-1111-111111111111', '1
999', '999', true, 3, 'Single element boundary case'),
('tc111111-1111-1111-1111-111111111114', 'q1111111-1111-1111-1111-111111111111', '6
100 200 50 300 120 300', '300', true, 4, 'Duplicate max values');

INSERT INTO "Question" (
    "id", "title", "description", "inputFormat", "outputFormat", "constraints", "explanation",
    "difficulty", "category", "marks", "starterCode", "timeLimit", "memoryLimit", "isPublished", "createdById"
) VALUES (
    'q2222222-2222-2222-2222-222222222222',
    'Two Sum Problem',
    'Given an array of integers and an integer target, return indices of the two numbers such that they add up to target.
Output the 0-based indices space-separated in ascending order.',
    'First line contains integer N (size) and target T.
Second line contains N space-separated integers.',
    'Print two space-separated integers representing the 0-based indices.',
    '2 <= N <= 10^4
-10^9 <= nums[i] <= 10^9
Only one valid answer exists.',
    'nums[0] + nums[1] = 2 + 7 = 9, so output is 0 1.',
    'Easy',
    'Arrays',
    15,
    '{"python":"import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines: return
    n, target = int(lines[0]), int(lines[1])
    nums = [int(x) for x in lines[2:2+n]]
    seen = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            print(f"{seen[comp]} {i}")
            return
        seen[num] = i

if __name__ == "__main__":
    solve()","java":"import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int val = sc.nextInt();
            int comp = target - val;
            if (map.containsKey(comp)) {
                System.out.println(map.get(comp) + " " + i);
                return;
            }
            map.put(val, i);
        }
    }
}","c":"#include <stdio.h>

int main() {
    int n, target;
    if (scanf("%d %d", &n, &target) != 2) return 0;
    int arr[10005];
    for (int i = 0; i < n; i++) scanf("%d", &arr[i]);
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (arr[i] + arr[j] == target) {
                printf("%d %d\n", i, j);
                return 0;
            }
        }
    }
    return 0;
}","cpp":"#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    unordered_map<int, int> seen;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        int comp = target - x;
        if (seen.count(comp)) {
            cout << seen[comp] << " " << i << endl;
            return 0;
        }
        seen[x] = i;
    }
    return 0;
}"}',
    2000,
    128,
    true,
    'u1111111-1111-1111-1111-111111111111'
);

INSERT INTO "TestCase" ("id", "questionId", "input", "expectedOutput", "isHidden", "orderIndex", "explanation") VALUES
('tc222222-2222-2222-2222-222222222221', 'q2222222-2222-2222-2222-222222222222', '4 9
2 7 11 15', '0 1', false, 1, '2 + 7 = 9 at index 0 and 1'),
('tc222222-2222-2222-2222-222222222222', 'q2222222-2222-2222-2222-222222222222', '3 6
3 2 4', '1 2', false, 2, '2 + 4 = 6 at index 1 and 2'),
('tc222222-2222-2222-2222-222222222223', 'q2222222-2222-2222-2222-222222222222', '2 6
3 3', '0 1', true, 3, 'Duplicate elements summing to target');

-- 4.4 Assessment & Assignment
INSERT INTO "Assessment" (
    "id", "title", "description", "instructions", "duration", "totalMarks", "passingMarks",
    "allowedLanguages", "randomizeQuestions", "randomizeTestCases", "maxAttempts",
    "disableCopyPaste", "enforceFullscreen", "trackTabSwitches", "isPublished", "createdById"
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Core Programming & Problem Solving Assessment',
    'Proctored evaluation measuring algorithmic capability, problem decomposition, code correctness, and time complexity.',
    '1. Ensure you remain in fullscreen during the exam.
2. Copy/pasting external code is strictly prohibited.
3. Verify your solution against sample test cases before submitting.',
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

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104126', 'RAKSHAA S M', '312824104126@act.edu.in', '$2a$10$FMlKzpZ/spCpyhPmz.9.oO8LhOXzczig71zkLdpC7dJCJ/21QoAoi', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104126', 'u-std-312824104126', '312824104126', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '16-06-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104127', 'RAMYA R', '312824104127@act.edu.in', '$2a$10$rMHUpYIL13JhYFUzyqGIS.4tzItxLhEKcKDD0IS3RzEx6IPijuWTC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104127', 'u-std-312824104127', '312824104127', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-11-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104128', 'RANJITH S', '312824104128@act.edu.in', '$2a$10$M1ofHeGUsF2MJTsTu7tN0ekv.lRayUQiX809vqRUd8DcEqaaAKSJG', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104128', 'u-std-312824104128', '312824104128', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-06-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104129', 'ROGITH RAADHAKRISHNAN C S', '312824104129@act.edu.in', '$2a$10$T8YmdXR/.3W4JdzZ35JAtOOKV2CSSOz9MHorJrzPGSjdtDEZZnwoK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104129', 'u-std-312824104129', '312824104129', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '05-12-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104130', 'ROHAN S', '312824104130@act.edu.in', '$2a$10$8S1IBH73JqseKvBBZeEIhOouD1RegQJUqam0Q4EcBbTThitJuWz.6', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104130', 'u-std-312824104130', '312824104130', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104131', 'ROSHAN PARVEEN S', '312824104131@act.edu.in', '$2a$10$nNIvxAKgpn6D6XpDNGFwT.GqpZV9ZdfERBZqKSjxhA73buX8aO5ka', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104131', 'u-std-312824104131', '312824104131', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104132', 'ROSHITH D R', '312824104132@act.edu.in', '$2a$10$pRcLLR/U76b.T1SptXGmCeaEISD0JRLAHOfquNpKpURhOntk16wVS', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104132', 'u-std-312824104132', '312824104132', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '30-06-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104133', 'RUBENTHAR R', '312824104133@act.edu.in', '$2a$10$N8J2h4Ssu9QNkFrtbemlWefk7G7NtSpez7orfIFRr3wqwE7q6w0.y', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104133', 'u-std-312824104133', '312824104133', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '22-11-2003');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104134', 'RUPIKA S', '312824104134@act.edu.in', '$2a$10$z/rmzEhsIsSeDKe2Hd2pfO54hgNRaCdQbUEFtgivtTM0CJ4/QlQ1G', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104134', 'u-std-312824104134', '312824104134', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-11-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104135', 'SACHIN HARI OM S', '312824104135@act.edu.in', '$2a$10$CkaGsA4ygkGUa0NVT0Mqvu3EmgVIaQanFQQlyiS90htdct244.Amq', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104135', 'u-std-312824104135', '312824104135', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '23-05-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104136', 'SAI GEETHA G', '312824104136@act.edu.in', '$2a$10$rOXR5/ue0yO8pdxupS7Yseno8JyfnT3MDjK5JHa6H.7JdVfHrhwki', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104136', 'u-std-312824104136', '312824104136', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '28-11-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104137', 'SAI LEKHA S A', '312824104137@act.edu.in', '$2a$10$k77OpIPPC9hkZU/RcbuZSulpA7URx5POsENaQc2N6EB.aGwaeoIwK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104137', 'u-std-312824104137', '312824104137', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-04-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104138', 'SAI SANJAY R', '312824104138@act.edu.in', '$2a$10$wDqwtBSjSXT.gbX4b239LOAM7k/kjgal2o8QhQSHTM6Rpc3HTYs.S', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104138', 'u-std-312824104138', '312824104138', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-02-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104139', 'SAMIKSHA SRI A', '312824104139@act.edu.in', '$2a$10$5IlkYjL921undo3GcXWvVOiXg0.3cB84y01DlBDNUE7H9aFpKeKVO', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104139', 'u-std-312824104139', '312824104139', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '13-08-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104140', 'SANDHIYA R', '312824104140@act.edu.in', '$2a$10$mnZKvoKblpjz2uUG6O9Y2.h3XZqBI7vo81AKyjVZ1csgTUKvzYI7O', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104140', 'u-std-312824104140', '312824104140', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-06-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104141', 'SANDHIYA S', '312824104141@act.edu.in', '$2a$10$3D6Btq3mfuHByDVoWVa01O6MhN9d17FbqZ8SFaddnOrq7PDmLdGku', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104141', 'u-std-312824104141', '312824104141', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-01-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104142', 'SANJAI C', '312824104142@act.edu.in', '$2a$10$M2mjB1PgsTtrLeUBch4/g.GWYiLN1x0BDXoh9dPyy8euxGQcEWsmi', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104142', 'u-std-312824104142', '312824104142', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '29-05-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104143', 'SANJAY V', '312824104143@act.edu.in', '$2a$10$8jSa8CCr7r7szVV1WvU1BO7xGJWQEz0QvGE2XoEdE9kLyi7580Hj2', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104143', 'u-std-312824104143', '312824104143', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-03-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104144', 'SANTHOSH KUMAR R', '312824104144@act.edu.in', '$2a$10$s1Li//I4inHa1DgDXpm3dOu2Lu.7VWDkp8pxpxrPn.UZ/5nWmrSza', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104144', 'u-std-312824104144', '312824104144', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-06-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104145', 'SARAN CHELLAN A', '312824104145@act.edu.in', '$2a$10$wJtvSbWRye5I82JXiCCl/eSi3KIMlwYk7xUbqXdXqgEcghoJaeh2G', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104145', 'u-std-312824104145', '312824104145', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '25-04-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104146', 'SARANRAJ S', '312824104146@act.edu.in', '$2a$10$/9gskb86lBC1ytDDGUEke.eDKwa9wj1vDoUXjJ2rIahq999MGAEyC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104146', 'u-std-312824104146', '312824104146', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '15-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104147', 'SELVI P', '312824104147@act.edu.in', '$2a$10$xdOZ7AZzI801hBA4iQHVwOcqCJYfcBcEFUMBcEYo5wLymBjfsGY36', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104147', 'u-std-312824104147', '312824104147', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '15-08-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104148', 'SHALINI S', '312824104148@act.edu.in', '$2a$10$HLxaOFxa8mjU7QZy6y8mqOv967vG.KaYQ3nmaVne/KZ.rZQFKA.lq', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104148', 'u-std-312824104148', '312824104148', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '01-10-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104149', 'SHANMUGA SUNDARAM R', '312824104149@act.edu.in', '$2a$10$KZYjIm6E9DetgfIb5FBsl.eIq9HwywrG9vyMTnFYyUrG3JEUEOB5u', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104149', 'u-std-312824104149', '312824104149', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-08-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104150', 'SHANMUGAPRIYAN M A', '312824104150@act.edu.in', '$2a$10$OXDDZ1fV3coUkvPu7h/Ni.H1.372ggo6xkEk/vP4gvArTosVwFGXq', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104150', 'u-std-312824104150', '312824104150', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '19-08-2005');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104151', 'SHARMILA R', '312824104151@act.edu.in', '$2a$10$czqCO0FqA74WO4E2DuTam.qu5oMQn/NPiDPq73R0wDwh45KDpFiKm', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104151', 'u-std-312824104151', '312824104151', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104152', 'SHAYANA SHREE Y', '312824104152@act.edu.in', '$2a$10$BAG9uXT6npUSE6J0rop/cOi35NQkJFoMWey40GwqhvdaEvb1gqwAC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104152', 'u-std-312824104152', '312824104152', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '04-02-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104153', 'SIVA DHARSHINI P', '312824104153@act.edu.in', '$2a$10$GVcpb..66YFvFOH/BTpQfOWT5fV0Np2m9Y1kIrF4do26jwrvGqsY.', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104153', 'u-std-312824104153', '312824104153', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-03-2024');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104154', 'SIVANTHI V', '312824104154@act.edu.in', '$2a$10$NmncsR1wRa6t1HVGOy13LuuDCFALHmSksF5Xs8hrebl8nsvidoDGm', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104154', 'u-std-312824104154', '312824104154', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '28-08-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104155', 'SOWMYASRI P', '312824104155@act.edu.in', '$2a$10$euUHyv1KuvYjt5AmyftXjOpMgV0Qg/v7hsn1f5jXr9ur808VFzzoO', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104155', 'u-std-312824104155', '312824104155', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104156', 'SRI DHARSHINI A', '312824104156@act.edu.in', '$2a$10$Ap3wxSZxnprpfXkkciIZdON1bzjkBWs.UeGSR3pTJEVZNsPfO0BxK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104156', 'u-std-312824104156', '312824104156', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-02-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104157', 'SRIRAGHAVAN K', '312824104157@act.edu.in', '$2a$10$gvjRRldDMh0JJAvCKMn/EeuHDPAmwpwZSI0L/YRKbYjRRxww935TO', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104157', 'u-std-312824104157', '312824104157', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104158', 'SRIVASTHAVA S P B', '312824104158@act.edu.in', '$2a$10$gAG0jFIfzFkXknrS87feQe3K4FMb0rmYLXzIshYxwlnRgQdVPWJiK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104158', 'u-std-312824104158', '312824104158', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '24-01-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104159', 'SUBA SRI R', '312824104159@act.edu.in', '$2a$10$xmvHN2IJjFng77MYBLmESeAdhQmiQH5rg3.2A3EFyQW7JGy0ZQucW', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104159', 'u-std-312824104159', '312824104159', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-05-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104160', 'SUPRAJA K L', '312824104160@act.edu.in', '$2a$10$p.sFLl4qYYT6g8TvlNjmne1DFUNkCbkv9BEd06BLGEXDxkWXl9uA.', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104160', 'u-std-312824104160', '312824104160', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-05-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104161', 'SURIYA S K', '312824104161@act.edu.in', '$2a$10$Xd.BZZnuFcSIsyR9kFNCw.VbFciq./ChBIKmcC1kbohhLab/JSf/m', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104161', 'u-std-312824104161', '312824104161', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '27-05-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104162', 'SURYA R', '312824104162@act.edu.in', '$2a$10$52jy29vbP/J8WRQC25egje9ULOA7ms3RcUv5r/A6JMdWQjFkupX.C', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104162', 'u-std-312824104162', '312824104162', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '04-12-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104163', 'SURYA S', '312824104163@act.edu.in', '$2a$10$kNRs5v0VbGjO2n9TZcl5j.cKGlVWQTuPsoKhiq0L3zhp6.hRh5fom', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104163', 'u-std-312824104163', '312824104163', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '10-09-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104164', 'SUSHMITHA P', '312824104164@act.edu.in', '$2a$10$DfEtchGLcuYlWL2WFw7NEOnrh98jo0vW8sHTQSgZugsV13GkXFNzC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104164', 'u-std-312824104164', '312824104164', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '29-09-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104165', 'SUVARSHA S', '312824104165@act.edu.in', '$2a$10$1AfN6.888xl9Ab1HbeNVzuQsmEmkvt37SHMcU.zxPyRAZhDXRcTQW', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104165', 'u-std-312824104165', '312824104165', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-08-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104166', 'TARA V', '312824104166@act.edu.in', '$2a$10$48TbZsG13uTAqvrj853wdeF8A1/3Bv6qALZ1eTFtoerLbO8lnYNpW', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104166', 'u-std-312824104166', '312824104166', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '02-09-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104167', 'TEBIN TITUS T', '312824104167@act.edu.in', '$2a$10$n6n0bcPFoWRf4F8a.LugJeSSucn3oCc1fQ1s7fLuOuAvNpVo1x7WC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104167', 'u-std-312824104167', '312824104167', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '08-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104168', 'THARUN G', '312824104168@act.edu.in', '$2a$10$M3kX7NrwAU8doYYzVIKkZ.FC06GaYgSnnXWbJ4RRmAVxRxvrnoVCe', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104168', 'u-std-312824104168', '312824104168', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '09-07-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104169', 'THIREJA S A', '312824104169@act.edu.in', '$2a$10$RlXUk.38jQSKxS2TJ1EqXeA4E9uQxck.6fhfW0n11gxSyHBIy76PG', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104169', 'u-std-312824104169', '312824104169', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '20-11-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104170', 'THIRUSELVAN P', '312824104170@act.edu.in', '$2a$10$UJwxB./3hceVlL3HOY7fn.WLivHgCeJsn.wty7FD9OqMaZ7jRxewS', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104170', 'u-std-312824104170', '312824104170', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-12-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104171', 'UDHAYA D', '312824104171@act.edu.in', '$2a$10$5LZAWGWUGLPH1V7./aBQVeWh.1Z8eQUgiCDRGmlsMe5b.ORn/c0jK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104171', 'u-std-312824104171', '312824104171', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104172', 'UMMU FAALIHA M', '312824104172@act.edu.in', '$2a$10$fhvnIsEVh6qrbYgeIkwga.2rzV5IKCtrdbkgxCoB4u5xuHYUpcPcC', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104172', 'u-std-312824104172', '312824104172', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '05-10-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104173', 'URASRI M', '312824104173@act.edu.in', '$2a$10$mY2v/St6OKfZQyNGIaTOQuttFqWopffYnUvMPr7qtKoIb6zum35P6', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104173', 'u-std-312824104173', '312824104173', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '23-03-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104174', 'VENNILA R', '312824104174@act.edu.in', '$2a$10$UjecbJTulYFxtLmrCQ7ZeuBoB2MJysLw4DhKHt55WPv2R7rGQYvr2', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104174', 'u-std-312824104174', '312824104174', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '08-03-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104175', 'VIDYASRI M', '312824104175@act.edu.in', '$2a$10$gofZg9kt2n42EHE3OUAfTutW.n2zxNbK0GpoXpWVeWXpnkwyxdTGK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104175', 'u-std-312824104175', '312824104175', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '17-08-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104176', 'VIGNESH D', '312824104176@act.edu.in', '$2a$10$IMbS8d.MDrNUTkv9Le6MverEFz.1mz2O5Ht5GEJzew./jIg4G1qoW', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104176', 'u-std-312824104176', '312824104176', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '13-01-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104177', 'VIGNESH J', '312824104177@act.edu.in', '$2a$10$Eu9XapwGNjC8NT7KQMUGV.yzM3Com48gidwv9l19T5zR3SPXZR3A2', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104177', 'u-std-312824104177', '312824104177', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104178', 'VIGNESH V', '312824104178@act.edu.in', '$2a$10$gkPZ2bcz5aIORqMJzcvVle/cvrTr.RMCYdP/WxcM079zAVNFMFa.S', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104178', 'u-std-312824104178', '312824104178', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-08-2005');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104179', 'VIJAYALAKSHMI S', '312824104179@act.edu.in', '$2a$10$53Tx.oAxf6XzDvxI1Ox27O0Jjy1Hzj2LkdB2fwMk7yuFqULKMlSZ6', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104179', 'u-std-312824104179', '312824104179', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '26-08-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104180', 'VINITHA B', '312824104180@act.edu.in', '$2a$10$6WbDQclqxyNQ7MuTIikx9ewC8/30e6p4hSMjRblEzD.E4IW6N1sCG', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104180', 'u-std-312824104180', '312824104180', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-07-2024');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104181', 'VISHAL A - (18-03-2006)', '312824104181@act.edu.in', '$2a$10$DtVesojCt8AGDwOkLI20ze/nlvlEuNPZ/bu.PF1GIq5OQ9k04iDVy', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104181', 'u-std-312824104181', '312824104181', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '18-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104182', 'VISHAL A - (03-07-2006)', '312824104182@act.edu.in', '$2a$10$z0ERrOiVMvleCa/Ag5Hu8.zpvQEVj2W/L71mvpScOgx6XbHau9fjW', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104182', 'u-std-312824104182', '312824104182', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-03-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104183', 'VISHALI P', '312824104183@act.edu.in', '$2a$10$OvP.Dd2qUf9afcHLwwg9kuI7sw4ZQIdUfMEMh.zanx6z7vLaE8XBK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104183', 'u-std-312824104183', '312824104183', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '12-05-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104184', 'VISHNU PRAKASH C', '312824104184@act.edu.in', '$2a$10$y3FHF5i1bKvHB158uWk2iud5ox/ml.nX86o.wsxEgF2anvoP/vaxS', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104184', 'u-std-312824104184', '312824104184', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '11-08-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104185', 'VITHIYA A', '312824104185@act.edu.in', '$2a$10$WFCuDCvxuZ8NU04PXT0U6ecVCYXmiMSQxCH87Jjf/8ik2XYDpSEpO', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104185', 'u-std-312824104185', '312824104185', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '20-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104186', 'WILLIAM DAVID K', '312824104186@act.edu.in', '$2a$10$nk1DOG0lakzPzOkc4/v0geXcFeItLX3SR5KWAYX4Qzk2Ywsw6oLMK', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104186', 'u-std-312824104186', '312824104186', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '30-10-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104187', 'YUGAN RAJ J', '312824104187@act.edu.in', '$2a$10$VGtWKQG2M1EULHpqLmBtuOcaI4JtcRJLhIwAH5333DXjyTv.MJmzm', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104187', 'u-std-312824104187', '312824104187', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '17-04-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104188', 'YUVARAJ V', '312824104188@act.edu.in', '$2a$10$dnj8FWy2aBfHUzRu3B8PResBfXqziYDKE1xNos4XF/qfdNzJtl1eG', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104188', 'u-std-312824104188', '312824104188', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '07-09-2006');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104189', 'YUVASHRI T', '312824104189@act.edu.in', '$2a$10$QSO09JPDHrJ0F9ptK4U5seJMmMXZpcJ728Q9LE/BbvGL8CxD800DO', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104189', 'u-std-312824104189', '312824104189', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '16-01-2007');

INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "isActive")
VALUES ('u-std-312824104301', 'LAKSHMAN ASWANTH', '312824104301@act.edu.in', '$2a$10$RDLsvijqfH3BqNYDJXv/ee4lAr23pyKuNT7fMniUupbrYfZM.n9z.', 'STUDENT', true);

INSERT INTO "StudentProfile" ("id", "userId", "rollNumber", "batchId", "department", "semester", "dob")
VALUES ('sp-std-312824104301', 'u-std-312824104301', '312824104301', 'b3333333-3333-3333-3333-333333333333', 'Computer Science & Engineering', 6, '31-03-2006');

-- ==============================================================================
-- END OF REBOOT SCHEMA & SEED
-- ==============================================================================
