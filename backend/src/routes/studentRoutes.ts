import { Router } from 'express';
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, getStudents);
router.post('/', requireAuth, requireAdmin, createStudent);
router.put('/:id', requireAuth, requireAdmin, updateStudent);
router.delete('/:id', requireAuth, requireAdmin, deleteStudent);

export default router;
