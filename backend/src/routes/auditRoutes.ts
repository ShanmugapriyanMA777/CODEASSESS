import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, getAuditLogs);

export default router;
