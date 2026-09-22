import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, getQuestions);
router.get('/:id', requireAuth, getQuestionById);
router.post('/', requireAuth, requireAdmin, createQuestion);
router.put('/:id', requireAuth, requireAdmin, updateQuestion);
router.delete('/:id', requireAuth, requireAdmin, deleteQuestion);

export default router;
