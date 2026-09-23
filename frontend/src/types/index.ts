export type Role = 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  isActive: boolean;
  studentProfile?: StudentProfile;
  adminProfile?: AdminProfile;
  _count?: {
    submissions?: number;
    assessmentResults?: number;
  };
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  rollNumber: string;
  batchId?: string;
  batch?: Batch;
  department: string;
  semester: number;
  phone?: string;
  dob?: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  designation: string;
  department: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  academicYear: string;
  code: string;
  createdAt: string;
  _count?: {
    students: number;
    assignments: number;
  };
}

export interface TestCase {
  id: string;
  questionId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
  explanation?: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  explanation?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  marks: number;
  starterCode: string; // JSON string
  timeLimit: number;
  memoryLimit: number;
  isPublished: boolean;
  createdById: string;
  testCases?: TestCase[];
  _count?: {
    submissions: number;
    testCases: number;
  };
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  questionId: string;
  order: number;
  marks: number;
  question: Question;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  duration: number; // in minutes
  startDate?: string;
  endDate?: string;
  totalMarks: number;
  passingMarks: number;
  allowedLanguages: string;
  randomizeQuestions: boolean;
  randomizeTestCases: boolean;
  maxAttempts: number;
  disableCopyPaste: boolean;
  enforceFullscreen: boolean;
  trackTabSwitches: boolean;
  isPublished: boolean;
  questions?: AssessmentQuestion[];
  assignments?: any[];
  attempts?: AssessmentAttempt[];
  results?: AssessmentResult[];
  currentAttempt?: AssessmentAttempt & { remainingSeconds: number; isExpired: boolean };
  _count?: {
    questions: number;
    assignments: number;
    results: number;
    submissions: number;
  };
  createdAt: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  startTime: string;
  submitTime?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED';
  remainingSeconds: number;
  currentCodeDraftsJson: string;
  autoSubmitted: boolean;
  suspiciousEventsCount: number;
}

export interface Submission {
  id: string;
  studentId: string;
  student?: { id: string; name: string; email: string };
  assessmentId?: string;
  assessment?: { id: string; title: string };
  questionId: string;
  question: { id: string; title: string; difficulty: string; category: string; marks: number };
  sourceCode: string;
  language: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'PARTIAL';
  marks: number;
  executionTime: number;
  testCasesPassed: number;
  totalTestCases: number;
  submittedAt: string;
  testResults?: any[];
}

export interface AssessmentResult {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    studentProfile?: { rollNumber: string; batch?: { name: string } };
  };
  assessmentId: string;
  assessment?: { id: string; title: string; totalMarks: number; passingMarks: number; duration: number };
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  questionsAttempted: number;
  questionsSolved: number;
  testCasesPassed: number;
  totalTestCases: number;
  timeTaken: number;
  rank: number;
  isPassed: boolean;
  submittedAt: string;
}

export interface TestCaseResult {
  testCaseId: string;
  orderIndex: number;
  isHidden: boolean;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

export interface AssessmentFeedback {
  id?: string;
  assessmentId: string;
  studentId?: string;
  overallCodingSkillsRating: number;
  basicConceptsUnderstandingRating: number;
  problemSolvingRating: number;
  difficultyLevelRating: number;
  debuggingAbilityRating: number;
  suggestions?: string;
  submittedAt?: string;
}

export interface ClassFeedbackRecord {
  sNo: number;
  id: string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  overallSkills: number;
  basicConcepts: number;
  problemSolving: number;
  difficultyLevel: number;
  debuggingAbility: number;
  suggestions: string;
  submittedAt: string;
}

export interface ClassFeedbackSummary {
  metadata: {
    institutionName: string;
    subHeader: string;
    accreditation: string;
    location: string;
    programme: string;
    batchSec: string;
    assessmentDate: string;
    conducted: string;
    facultyName: string;
    subjectName: string;
    subjectCode: string;
    batchId: string;
    batchName: string;
    assessmentId: string;
    assessmentTitle: string;
  };
  summaryMetrics: {
    totalResponses: number;
    avgOverallSkills: number;
    avgBasicConcepts: number;
    avgProblemSolving: number;
    avgDifficultyLevel: number;
    avgDebuggingAbility: number;
  };
  records: ClassFeedbackRecord[];
}

