import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getBatches(req: AuthRequest, res: Response) {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        _count: {
          select: {
            students: true,
            assignments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, batches);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch batches', 500);
  }
}

export async function createBatch(req: AuthRequest, res: Response) {
  try {
    const { name, description, academicYear, code } = req.body;

    if (!name || !code) {
      return sendError(res, 'Batch name and unique code are required', 400);
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        description,
        academicYear: academicYear || '2025-2026',
        code: code.toUpperCase().trim(),
      },
    });

    return sendSuccess(res, batch, 'Batch created successfully', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to create batch', 500);
  }
}

export async function deleteBatch(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await prisma.batch.delete({ where: { id } });
    return sendSuccess(res, null, 'Batch removed successfully');
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to delete batch', 500);
  }
}
