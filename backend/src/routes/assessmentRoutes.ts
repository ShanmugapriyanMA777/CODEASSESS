import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from '../controllers/assessmentController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, getAssessments);
router.get('/:id', requireAuth, getAssessmentById);
router.post('/', requireAuth, requireAdmin, createAssessment);
router.put('/:id', requireAuth, requireAdmin, updateAssessment);
router.delete('/:id', requireAuth, requireAdmin, deleteAssessment);

export default router;
