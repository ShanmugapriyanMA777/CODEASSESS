import { Router } from 'express';
import authRoutes from './authRoutes.js';
import questionRoutes from './questionRoutes.js';
import assessmentRoutes from './assessmentRoutes.js';
import submissionRoutes from './submissionRoutes.js';
import resultRoutes from './resultRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import reportRoutes from './reportRoutes.js';
import studentRoutes from './studentRoutes.js';
import batchRoutes from './batchRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questions', questionRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/submissions', submissionRoutes);
router.use('/results', resultRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/students', studentRoutes);
router.use('/batches', batchRoutes);
router.use('/audit', auditRoutes);

export default router;
