import { Response } from 'express';
import { prisma } from '../prisma.js';
import { supabase } from '../config/supabase.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/audit.js';
import { isCannedSolution, cleanStarterTemplates } from '../utils/starterCodeUtils.js';

export async function resolveStudentDetails(studentId: string, email?: string) {
  let profile = await prisma.studentProfile.findFirst({
    where: {
      OR: [
        { userId: studentId },
        ...(studentId.startsWith('u-std-') ? [{ rollNumber: studentId.replace('u-std-', '') }] : []),
        ...(email ? [{ user: { email: email.toLowerCase() } }] : []),
      ],
    },
    include: { batch: true, user: true },
  });

  // Ensure default batch if student has no batch assigned
  if (!profile?.batchId) {
    const defaultBatch = await prisma.batch.findFirst({
      where: { OR: [{ code: 'CSE-III-C' }, { name: 'III CSE C' }] },
    });
    if (defaultBatch && profile) {
      try {
        await prisma.studentProfile.update({
          where: { id: profile.id },
          data: { batchId: defaultBatch.id },
        });
        profile.batchId = defaultBatch.id;
      } catch (_) {}
    }
  }

  const batchIdsToMatch = new Set<string>();
  if (profile?.batchId) batchIdsToMatch.add(profile.batchId);
  batchIdsToMatch.add('652cb70f-6122-4711-85ab-0a40db7086b4'); // Local main batch
  batchIdsToMatch.add('b3333333-3333-3333-3333-333333333333'); // Cloud batch

  try {
    const relatedBatches = await prisma.batch.findMany({
      where: {
        OR: [
          { code: profile?.batch?.code || 'CSE-III-C' },
          { name: 'III CSE C' },
        ],
      },
    });
    for (const b of relatedBatches) batchIdsToMatch.add(b.id);
  } catch (_) {}

  const studentIdsToMatch = Array.from(
    new Set([studentId, profile?.userId, profile?.id].filter(Boolean))
  ) as string[];

  const effectiveUserId = profile?.userId || studentId;

  return {
    profile,
    effectiveUserId,
    studentIdsToMatch,
    batchIdsToMatch: Array.from(batchIdsToMatch),
  };
}

export async function getAssessments(req: AuthRequest, res: Response) {
  try {
    const isStudent = req.user?.role === 'STUDENT';
    const studentId = req.user?.id;

    if (isStudent && studentId) {
      const { profile, studentIdsToMatch, batchIdsToMatch } = await resolveStudentDetails(
        studentId,
        req.user?.email
      );

      // Find assessments assigned to this student or their batch
      const assigned = await prisma.assessmentAssignment.findMany({
        where: {
          OR: [
            { studentId: { in: studentIdsToMatch } },
            { batchId: { in: batchIdsToMatch } },
          ],
        },
        select: { assessmentId: true, status: true },
      });

      const assignedIds = Array.from(new Set(assigned.map((a) => a.assessmentId)));

      let assessments = await prisma.assessment.findMany({
        where: {
          isPublished: true,
          OR: [
            { id: { in: assignedIds } },
            { assignments: { none: {} } }, // Open to all batches/students
          ],
        },
        include: {
          questions: {
            include: {
              question: {
                select: { id: true, title: true, difficulty: true, category: true, marks: true },
              },
            },
            orderBy: { order: 'asc' },
          },
          attempts: {
            where: { studentId: { in: studentIdsToMatch } },
          },
          results: {
            where: { studentId: { in: studentIdsToMatch } },
          },
          _count: {
            select: { questions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If Prisma returned 0 or if running in serverless cloud, fallback to Supabase
      if (assessments.length === 0) {
        try {
          const { data: suAss } = await supabase
            .from('Assessment')
            .select(`
              *,
              questions:AssessmentQuestion(
                order,
                marks,
                question:Question(id, title, difficulty, category, marks)
              ),
              assignments:AssessmentAssignment(batchId, studentId)
            `)
            .eq('isPublished', true)
            .order('createdAt', { ascending: false });

          if (suAss && suAss.length > 0) {
            const studentRegNo = profile?.rollNumber || (studentId.startsWith('u-std-') ? studentId.replace('u-std-', '') : '');
            const suFiltered = suAss.filter((a: any) => {
              if (!a.assignments || a.assignments.length === 0) return true;
              return a.assignments.some((asgn: any) =>
                (asgn.batchId && (batchIdsToMatch.includes(asgn.batchId) || asgn.batchId === 'b3333333-3333-3333-3333-333333333333')) ||
                (asgn.studentId && (studentIdsToMatch.includes(asgn.studentId) || asgn.studentId === `u-std-${studentRegNo}`))
              );
            });

            if (suFiltered.length > 0) {
              return sendSuccess(res, suFiltered);
            }
          }
        } catch (suErr: any) {
          console.warn('Supabase assessment fallback error:', suErr.message);
        }
      }

      return sendSuccess(res, assessments);
    }

    // Admin view
    const assessments = await prisma.assessment.findMany({
      include: {
        questions: {
          include: {
            question: {
              select: { id: true, title: true, difficulty: true, category: true, marks: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            batch: { select: { id: true, name: true, code: true } },
          },
        },
        _count: {
          select: {
            questions: true,
            assignments: true,
            results: true,
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, assessments);
  } catch (err: any) {
    // If Prisma is unavailable (e.g. Vercel deployment), fallback to Supabase
    try {
      const { data: suAss } = await supabase
        .from('Assessment')
        .select(`
          *,
          questions:AssessmentQuestion(
            order,
            marks,
            question:Question(id, title, difficulty, category, marks)
          ),
          assignments:AssessmentAssignment(batchId, studentId)
        `)
        .eq('isPublished', true)
        .order('createdAt', { ascending: false });

      if (suAss) {
        return sendSuccess(res, suAss);
      }
    } catch (_) {}

    return sendError(res, err.message || 'Failed to fetch assessments', 500);
  }
}

export async function getAssessmentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const isStudent = req.user?.role === 'STUDENT';
    const studentId = req.user?.id;

    let { profile, effectiveUserId, studentIdsToMatch } = studentId
      ? await resolveStudentDetails(studentId, req.user?.email)
      : { profile: null, effectiveUserId: studentId || '', studentIdsToMatch: studentId ? [studentId] : [] };

    let assessment: any = null;

    try {
      assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          questions: {
            include: {
              question: {
                include: {
                  testCases: {
                    where: isStudent ? { isHidden: false } : undefined,
                    orderBy: { orderIndex: 'asc' },
                  },
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          assignments: {
            include: {
              batch: true,
              student: { select: { id: true, name: true, email: true } },
            },
          },
          attempts: studentId
            ? {
                where: { studentId: { in: studentIdsToMatch } },
              }
            : false,
          results: studentId
            ? {
                where: { studentId: { in: studentIdsToMatch } },
              }
            : false,
          _count: {
            select: { questions: true, assignments: true, results: true },
          },
        },
      });
    } catch (prismaErr: any) {
      console.warn('Prisma getAssessmentById error:', prismaErr.message);
    }

    // Supabase fallback if not found in Prisma or Prisma threw
    if (!assessment) {
      try {
        const { data: suAss } = await supabase
          .from('Assessment')
          .select(`
            *,
            questions:AssessmentQuestion(
              order,
              marks,
              question:Question(
                *,
                testCases:TestCase(*)
              )
            ),
            assignments:AssessmentAssignment(
              *,
              batch:Batch(*)
            )
          `)
          .eq('id', id)
          .maybeSingle();

        if (suAss) {
          assessment = suAss as any;
        }
      } catch (suErr: any) {
        console.warn('Supabase getAssessmentById fallback error:', suErr.message);
      }
    }

    if (!assessment) {
      return sendError(res, 'Assessment not found', 404);
    }

    // Sanitize question starter codes so predefined solutions never reach the client
    if (assessment.questions && Array.isArray(assessment.questions)) {
      for (const aq of assessment.questions) {
        if (aq.question && aq.question.starterCode) {
          try {
            const parsed = JSON.parse(aq.question.starterCode);
            let hasCanned = false;
            for (const lang of Object.keys(parsed)) {
              if (isCannedSolution(parsed[lang])) {
                hasCanned = true;
                break;
              }
            }
            if (hasCanned) {
              aq.question.starterCode = JSON.stringify(cleanStarterTemplates);
            }
          } catch (_) {
            aq.question.starterCode = JSON.stringify(cleanStarterTemplates);
          }
        }
      }
    }

    // If student, check if expired or validate attempt
    if (isStudent && studentId) {
      let attempt = assessment.attempts?.[0];

      // Sanitize attempt drafts so old canned solutions are never served
      if (attempt && attempt.currentCodeDraftsJson) {
        try {
          const drafts = JSON.parse(attempt.currentCodeDraftsJson);
          let modified = false;
          for (const qId of Object.keys(drafts)) {
            if (isCannedSolution(drafts[qId]?.code)) {
              delete drafts[qId];
              modified = true;
            }
          }
          if (modified) {
            attempt.currentCodeDraftsJson = JSON.stringify(drafts);
          }
        } catch (_) {
          attempt.currentCodeDraftsJson = '{}';
        }
      }

      // If no attempt yet and assessment is open, create or initialize attempt
      if (!attempt) {
        // Ensure user exists in Prisma User table to satisfy foreign key
        try {
          const userExists = await prisma.user.findUnique({ where: { id: effectiveUserId } });
          if (!userExists) {
            await prisma.user.create({
              data: {
                id: effectiveUserId,
                name: req.user?.name || 'Student',
                email: req.user?.email || `${effectiveUserId}@act.edu.in`,
                passwordHash: '$2a$10$defaultHash',
                role: 'STUDENT',
              },
            });
          }
        } catch (_) {}

        try {
          attempt = await prisma.assessmentAttempt.create({
            data: {
              assessmentId: assessment.id,
              studentId: effectiveUserId,
              status: 'IN_PROGRESS',
              remainingSeconds: assessment.duration * 60,
            },
          });
        } catch (attErr: any) {
          console.warn('Prisma attempt creation notice:', attErr.message);
          attempt = {
            id: `att-${Date.now()}`,
            assessmentId: assessment.id,
            studentId: effectiveUserId,
            status: 'IN_PROGRESS',
            startTime: new Date().toISOString(),
            remainingSeconds: assessment.duration * 60,
          };
        }
      }

      // Check backend timer expiration
      const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.startTime).getTime()) / 1000);
      const totalAllowedSeconds = assessment.duration * 60;
      const remainingSeconds = Math.max(0, totalAllowedSeconds - elapsedSeconds);

      return sendSuccess(res, {
        ...assessment,
        currentAttempt: {
          ...attempt,
          remainingSeconds,
          isExpired: remainingSeconds <= 0,
        },
      });
    }

    return sendSuccess(res, assessment);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch assessment', 500);
  }
}

export async function createAssessment(req: AuthRequest, res: Response) {
  try {
    const {
      title,
      description,
      instructions,
      duration = 60,
      startDate,
      endDate,
      totalMarks = 100,
      passingMarks = 40,
      allowedLanguages = 'python,java,c,cpp',
      randomizeQuestions = false,
      randomizeTestCases = false,
      maxAttempts = 1,
      disableCopyPaste = true,
      enforceFullscreen = true,
      trackTabSwitches = true,
      isPublished = false,
      questions = [], // array of { questionId, order, marks }
      batchIds = [],  // array of batch IDs to assign
      studentIds = [],// array of individual student IDs to assign
    } = req.body;

    if (!title) {
      return sendError(res, 'Assessment title is required', 400);
    }

    const calculatedTotalMarks = questions.reduce(
      (sum: number, q: any) => sum + (parseInt(q.marks, 10) || 10),
      0
    ) || parseInt(totalMarks, 10) || 100;

    const assessment = await prisma.assessment.create({
      data: {
        title,
        description: description || '',
        instructions: instructions || 'Complete all coding challenges within the allotted time limit.',
        duration: parseInt(duration, 10) || 60,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalMarks: calculatedTotalMarks,
        passingMarks: parseInt(passingMarks, 10) || 40,
        allowedLanguages,
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeTestCases: Boolean(randomizeTestCases),
        maxAttempts: parseInt(maxAttempts, 10) || 1,
        disableCopyPaste: Boolean(disableCopyPaste),
        enforceFullscreen: Boolean(enforceFullscreen),
        trackTabSwitches: Boolean(trackTabSwitches),
        isPublished: Boolean(isPublished),
        createdById: req.user!.id,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            questionId: q.questionId,
            order: q.order !== undefined ? q.order : idx,
            marks: parseInt(q.marks, 10) || 10,
          })),
        },
      },
      include: {
        questions: { include: { question: true } },
      },
    });

    // Assign to batches and individual students (include both local and cloud counterpart batch IDs)
    const assignments: any[] = [];
    if (Array.isArray(batchIds)) {
      const allBatchIds = new Set<string>(batchIds);
      if (batchIds.includes('652cb70f-6122-4711-85ab-0a40db7086b4') || batchIds.includes('b3333333-3333-3333-3333-333333333333')) {
        allBatchIds.add('652cb70f-6122-4711-85ab-0a40db7086b4');
        allBatchIds.add('b3333333-3333-3333-3333-333333333333');
      }
      for (const bId of allBatchIds) {
        assignments.push({ assessmentId: assessment.id, batchId: bId });
      }
    }
    if (Array.isArray(studentIds)) {
      for (const sId of studentIds) {
        assignments.push({ assessmentId: assessment.id, studentId: sId });
      }
    }

    if (assignments.length > 0) {
      await prisma.assessmentAssignment.createMany({
        data: assignments,
      });
    }

    // Mirror to Supabase Cloud
    try {
      await supabase.from('Assessment').upsert({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description || '',
        instructions: assessment.instructions || '',
        duration: assessment.duration,
        totalMarks: assessment.totalMarks,
        passingMarks: assessment.passingMarks,
        allowedLanguages: assessment.allowedLanguages,
        randomizeQuestions: assessment.randomizeQuestions,
        randomizeTestCases: assessment.randomizeTestCases,
        maxAttempts: assessment.maxAttempts,
        disableCopyPaste: assessment.disableCopyPaste,
        enforceFullscreen: assessment.enforceFullscreen,
        trackTabSwitches: assessment.trackTabSwitches,
        isPublished: assessment.isPublished,
        createdById: 'u1111111-1111-1111-1111-111111111111',
      }, { onConflict: 'id' });

      for (const q of questions) {
        await supabase.from('AssessmentQuestion').upsert({
          id: `aq-${assessment.id.slice(0, 8)}-${q.questionId.slice(0, 8)}`,
          assessmentId: assessment.id,
          questionId: q.questionId,
          order: q.order || 0,
          marks: q.marks || 10,
        }, { onConflict: 'id' });
      }

      for (const asgn of assignments) {
        await supabase.from('AssessmentAssignment').upsert({
          id: `asgn-${assessment.id.slice(0, 8)}-${(asgn.batchId || asgn.studentId).slice(0, 8)}`,
          assessmentId: assessment.id,
          batchId: asgn.batchId || null,
          studentId: asgn.studentId || null,
          status: 'PENDING',
        }, { onConflict: 'id' });
      }
    } catch (suErr: any) {
      console.warn('Supabase mirror notice:', suErr.message);
    }

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_CREATED',
      entityType: 'ASSESSMENT',
      entityId: assessment.id,
      details: `Created assessment: ${assessment.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, assessment, 'Assessment created successfully', 201);
  } catch (err: any) {
    console.error('Create assessment error:', err);
    return sendError(res, err.message || 'Failed to create assessment', 500);
  }
}

export async function updateAssessment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      duration,
      startDate,
      endDate,
      totalMarks,
      passingMarks,
      allowedLanguages,
      randomizeQuestions,
      randomizeTestCases,
      maxAttempts,
      disableCopyPaste,
      enforceFullscreen,
      trackTabSwitches,
      isPublished,
      questions,
      batchIds,
      studentIds,
    } = req.body;

    // Update questions relation if provided
    if (Array.isArray(questions)) {
      await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: id } });
      await prisma.assessmentQuestion.createMany({
        data: questions.map((q: any, idx: number) => ({
          assessmentId: id,
          questionId: q.questionId,
          order: q.order !== undefined ? q.order : idx,
          marks: parseInt(q.marks, 10) || 10,
        })),
      });
    }

    // Update assignments if provided
    let newAssignments: any[] = [];
    if (Array.isArray(batchIds) || Array.isArray(studentIds)) {
      await prisma.assessmentAssignment.deleteMany({ where: { assessmentId: id } });
      const allBatchIds = new Set<string>(batchIds || []);
      if (allBatchIds.has('652cb70f-6122-4711-85ab-0a40db7086b4') || allBatchIds.has('b3333333-3333-3333-3333-333333333333')) {
        allBatchIds.add('652cb70f-6122-4711-85ab-0a40db7086b4');
        allBatchIds.add('b3333333-3333-3333-3333-333333333333');
      }
      for (const bId of allBatchIds) newAssignments.push({ assessmentId: id, batchId: bId });
      if (studentIds) {
        for (const sId of studentIds) newAssignments.push({ assessmentId: id, studentId: sId });
      }
      if (newAssignments.length > 0) {
        await prisma.assessmentAssignment.createMany({ data: newAssignments });
      }
    }

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(duration !== undefined && { duration: parseInt(duration, 10) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(totalMarks !== undefined && { totalMarks: parseInt(totalMarks, 10) }),
        ...(passingMarks !== undefined && { passingMarks: parseInt(passingMarks, 10) }),
        ...(allowedLanguages !== undefined && { allowedLanguages }),
        ...(randomizeQuestions !== undefined && { randomizeQuestions: Boolean(randomizeQuestions) }),
        ...(randomizeTestCases !== undefined && { randomizeTestCases: Boolean(randomizeTestCases) }),
        ...(maxAttempts !== undefined && { maxAttempts: parseInt(maxAttempts, 10) }),
        ...(disableCopyPaste !== undefined && { disableCopyPaste: Boolean(disableCopyPaste) }),
        ...(enforceFullscreen !== undefined && { enforceFullscreen: Boolean(enforceFullscreen) }),
        ...(trackTabSwitches !== undefined && { trackTabSwitches: Boolean(trackTabSwitches) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
      include: {
        questions: { include: { question: true } },
        assignments: true,
      },
    });

    // Mirror update to Supabase
    try {
      await supabase.from('Assessment').upsert({
        id: updated.id,
        title: updated.title,
        description: updated.description || '',
        instructions: updated.instructions || '',
        duration: updated.duration,
        totalMarks: updated.totalMarks,
        passingMarks: updated.passingMarks,
        allowedLanguages: updated.allowedLanguages,
        randomizeQuestions: updated.randomizeQuestions,
        randomizeTestCases: updated.randomizeTestCases,
        maxAttempts: updated.maxAttempts,
        disableCopyPaste: updated.disableCopyPaste,
        enforceFullscreen: updated.enforceFullscreen,
        trackTabSwitches: updated.trackTabSwitches,
        isPublished: updated.isPublished,
      }, { onConflict: 'id' });

      if (newAssignments.length > 0) {
        for (const asgn of newAssignments) {
          await supabase.from('AssessmentAssignment').upsert({
            id: `asgn-${updated.id.slice(0, 8)}-${(asgn.batchId || asgn.studentId).slice(0, 8)}`,
            assessmentId: updated.id,
            batchId: asgn.batchId || null,
            studentId: asgn.studentId || null,
            status: 'PENDING',
          }, { onConflict: 'id' });
        }
      }
    } catch (_) {}

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_UPDATED',
      entityType: 'ASSESSMENT',
      entityId: id,
      details: `Updated assessment: ${updated.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, updated, 'Assessment updated successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update assessment', 500);
  }
}

export async function deleteAssessment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const assessment = await prisma.assessment.delete({ where: { id } });

    try {
      await supabase.from('Assessment').delete().eq('id', id);
    } catch (_) {}

    await logAuditEvent({
      userId: req.user!.id,
      action: 'ASSESSMENT_DELETED',
      entityType: 'ASSESSMENT',
      entityId: id,
      details: `Deleted assessment: ${assessment.title}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Assessment deleted successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete assessment', 500);
  }
}
