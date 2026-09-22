import { Router } from 'express';
import {
  runSampleCode,
  submitQuestionCode,
  autoSaveDraft,
  recordSuspiciousEvent,
  getSubmissions,
  getSubmissionById,
} from '../controllers/submissionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/run', requireAuth, runSampleCode);
router.post('/submit', requireAuth, submitQuestionCode);
router.post('/autosave', requireAuth, autoSaveDraft);
router.post('/suspicious-event', requireAuth, recordSuspiciousEvent);
router.get('/', requireAuth, getSubmissions);
router.get('/:id', requireAuth, getSubmissionById);

export default router;
