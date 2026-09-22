import { Response } from 'express';
import { prisma } from '../prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { action, entityType, limit = '100' } = req.query;
    const take = parseInt(limit as string, 10) || 100;

    const where: any = {};
    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;

    const logs = await prisma.auditLog.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return sendSuccess(res, logs);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch audit logs', 500);
  }
}
