import { Router } from 'express';
import {
  getAdminStats,
  getStudentAnalytics,
  getQuestionAnalysis,
} from '../controllers/analyticsController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/admin', requireAuth, requireAdmin, getAdminStats);
router.get('/student', requireAuth, getStudentAnalytics);
router.get('/questions', requireAuth, requireAdmin, getQuestionAnalysis);

export default router;
