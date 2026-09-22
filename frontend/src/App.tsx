import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Student pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { AssessmentList } from './pages/student/AssessmentList';
import { AssessmentTake } from './pages/student/AssessmentTake';
import { AssessmentResultView } from './pages/student/AssessmentResultView';
import { StudentPractice } from './pages/student/StudentPractice';
import { StudentSubmissions } from './pages/student/StudentSubmissions';
import { StudentPerformance } from './pages/student/StudentPerformance';
import { StudentProfile } from './pages/student/StudentProfile';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionList } from './pages/admin/QuestionList';
import { QuestionForm } from './pages/admin/QuestionForm';
import { AssessmentList as AdminAssessmentList } from './pages/admin/AssessmentList';
import { AssessmentForm } from './pages/admin/AssessmentForm';
import { StudentList } from './pages/admin/StudentList';
import { BatchList } from './pages/admin/BatchList';
import { ResultList } from './pages/admin/ResultList';
import { SubmissionList } from './pages/admin/SubmissionList';
import { ReportGenerator } from './pages/admin/ReportGenerator';
import { AuditLogView } from './pages/admin/AuditLogView';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRole?: 'ADMIN' | 'STUDENT';
}> = ({ children, allowedRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Prevent students from accessing admin pages & vice versa
  if (allowedRole && user?.role !== allowedRole) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/student/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Standalone Proctored Assessment Taking Workspace (No Dashboard Chrome) */}
      <Route
        path="/student/assessment/:id"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <AssessmentTake />
          </ProtectedRoute>
        }
      />

      {/* Student Protected Portal */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="STUDENT">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="assessments" element={<AssessmentList />} />
        <Route path="assessment/:id/result" element={<AssessmentResultView />} />
        <Route path="practice" element={<StudentPractice />} />
        <Route path="submissions" element={<StudentSubmissions />} />
        <Route path="performance" element={<StudentPerformance />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="reports" element={<Navigate to="/student/dashboard" replace />} />
      </Route>

      {/* Admin Protected Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="questions" element={<QuestionList />} />
        <Route path="questions/create" element={<QuestionForm />} />
        <Route path="questions/:id/edit" element={<QuestionForm />} />
        <Route path="assessments" element={<AdminAssessmentList />} />
        <Route path="assessments/create" element={<AssessmentForm />} />
        <Route path="assessments/:id/edit" element={<AssessmentForm />} />
        <Route path="students" element={<StudentList />} />
        <Route path="batches" element={<BatchList />} />
        <Route path="results" element={<ResultList />} />
        <Route path="submissions" element={<SubmissionList />} />
        <Route path="reports" element={<ReportGenerator />} />
        <Route path="audit-logs" element={<AuditLogView />} />
      </Route>

      {/* Default Catch-all */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
