
-- ==============================================================================
-- 6.6 Batch III CSE C and 65 Student Candidates (DOB Passwords)
-- ==============================================================================

-- Ensure Batch III CSE C exists
INSERT INTO "Batch" ("id", "name", "description", "academicYear", "code")
VALUES ('b3333333-3333-3333-3333-333333333333', 'III CSE C', 'Computer Science and Engineering - 3rd Year Section C', '2024-2028', 'CSE-III-C')
ON CONFLICT ("code") DO NOTHING;

-- Ensure dob column exists on StudentProfile
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "dob" VARCHAR(50);
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "phone" VARCHAR(50);

-- Assign default assessment to III CSE C batch
INSERT INTO "AssessmentAssignment" ("id", "assessmentId", "batchId", "status")
VALUES ('as333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'b3333333-3333-3333-3333-333333333333', 'PENDING')
ON CONFLICT ("id") DO NOTHING;

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

