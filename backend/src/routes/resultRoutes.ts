import { Router } from 'express';
import { finishAssessment, getResults, getStudentResult } from '../controllers/resultController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/finish', requireAuth, finishAssessment);
router.get('/', requireAuth, requireAdmin, getResults);
router.get('/assessment/:assessmentId/student/:studentId', requireAuth, getStudentResult);

export default router;
