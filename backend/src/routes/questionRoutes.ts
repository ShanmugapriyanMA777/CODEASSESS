import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  testRunQuestionProgram,
} from '../controllers/questionController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, getQuestions);
router.get('/:id', requireAuth, getQuestionById);
router.post('/', requireAuth, requireAdmin, createQuestion);
router.post('/test-run', requireAuth, requireAdmin, testRunQuestionProgram);
router.put('/:id', requireAuth, requireAdmin, updateQuestion);
router.delete('/:id', requireAuth, requireAdmin, deleteQuestion);

export default router;
