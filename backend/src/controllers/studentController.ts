import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/audit.js';

export async function getStudents(req: AuthRequest, res: Response) {
  try {
    const { search, batchId, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const take = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * take;

    const where: any = { role: 'STUDENT' };

    if (batchId) {
      where.studentProfile = { batchId: batchId as string };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { studentProfile: { rollNumber: { contains: search as string } } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true,
          studentProfile: {
            include: { batch: true },
          },
          _count: {
            select: {
              submissions: true,
              assessmentResults: true,
            },
          },
        },
      }),
    ]);

    return sendSuccess(res, {
      students,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / take),
        limit: take,
      },
    });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch students', 500);
  }
}

export async function createStudent(req: AuthRequest, res: Response) {
  try {
    const { name, email, password, rollNumber, batchId, department, semester, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Name, email, and password are required', 400);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return sendError(res, 'Email already exists', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const student = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'STUDENT',
        studentProfile: {
          create: {
            rollNumber: rollNumber || `STD-${Date.now().toString().slice(-6)}`,
            batchId: batchId || null,
            department: department || 'Computer Science & Engineering',
            semester: semester ? parseInt(semester, 10) : 6,
            phone,
          },
        },
      },
      include: {
        studentProfile: { include: { batch: true } },
      },
    });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'STUDENT_CREATED',
      entityType: 'STUDENT',
      entityId: student.id,
      details: `Created student ${student.name} (${student.email})`,
      ipAddress: req.ip,
    });

    const { passwordHash: _, ...safeUser } = student;
    return sendSuccess(res, safeUser, 'Student created successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create student', 500);
  }
}

export async function updateStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, isActive, password, rollNumber, batchId, department, semester, phone } = req.body;

    let passwordHash: string | undefined;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase().trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(passwordHash && { passwordHash }),
        studentProfile: {
          upsert: {
            create: {
              rollNumber: rollNumber || `STD-${Date.now().toString().slice(-6)}`,
              batchId: batchId || null,
              department: department || 'Computer Science & Engineering',
              semester: semester ? parseInt(semester, 10) : 6,
              phone,
            },
            update: {
              ...(rollNumber && { rollNumber }),
              ...(batchId !== undefined && { batchId: batchId || null }),
              ...(department && { department }),
              ...(semester !== undefined && { semester: parseInt(semester, 10) }),
              ...(phone !== undefined && { phone }),
            },
          },
        },
      },
      include: {
        studentProfile: { include: { batch: true } },
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return sendSuccess(res, safeUser, 'Student updated successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to update student', 500);
  }
}

export async function deleteStudent(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user!.id,
      action: 'STUDENT_DELETED',
      entityType: 'STUDENT',
      entityId: id,
      details: `Deleted student user ${id}`,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Student removed successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete student', 500);
  }
}
