import { Router } from 'express';
import {
  downloadStudentPdfReport,
  getStudentReportPreview,
  downloadAssessmentPdfReport,
  getClassStatementData,
  downloadClassStatementCsv,
  downloadClassStatementPdf,
  getClassFeedbackData,
  downloadClassFeedbackCsv,
  downloadClassFeedbackPdf,
} from '../controllers/reportController.js';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All report generation & downloads are restricted strictly to Administrators or Faculty
router.use(requireAuth);
router.use(requireAdmin);

router.get('/student/:studentId', downloadStudentPdfReport);
router.get('/student/:studentId/preview', getStudentReportPreview);
router.get('/assessment/:assessmentId', downloadAssessmentPdfReport);

// Official Agni College of Technology Portal Mark Entry Statement endpoints
router.get('/class-statement', getClassStatementData);
router.get('/class-statement/csv', downloadClassStatementCsv);
router.get('/class-statement/pdf', downloadClassStatementPdf);

// Class Training Feedback & Skill Evaluation endpoints
router.get('/class-feedback', getClassFeedbackData);
router.get('/class-feedback/csv', downloadClassFeedbackCsv);
router.get('/class-feedback/pdf', downloadClassFeedbackPdf);

export default router;
