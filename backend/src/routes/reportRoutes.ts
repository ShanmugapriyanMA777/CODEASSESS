import { Router } from 'express';
import {
  downloadStudentPdfReport,
  downloadAssessmentPdfReport,
  getClassStatementData,
  downloadClassStatementCsv,
  downloadClassStatementPdf,
} from '../controllers/reportController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All report generation & downloads are restricted strictly to Administrators
router.use(requireAuth);
router.use(requireAdmin);

router.get('/student/:studentId', downloadStudentPdfReport);
router.get('/assessment/:assessmentId', downloadAssessmentPdfReport);

// Official Agni College of Technology Portal Mark Entry Statement endpoints
router.get('/class-statement', getClassStatementData);
router.get('/class-statement/csv', downloadClassStatementCsv);
router.get('/class-statement/pdf', downloadClassStatementPdf);

export default router;
