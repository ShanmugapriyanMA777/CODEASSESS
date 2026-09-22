import { Router } from 'express';
import { getBatches, createBatch, deleteBatch } from '../controllers/batchController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, requireAdmin, getBatches);
router.post('/', requireAuth, requireAdmin, createBatch);
router.delete('/:id', requireAuth, requireAdmin, deleteBatch);

export default router;
