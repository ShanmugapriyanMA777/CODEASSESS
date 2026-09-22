import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Assessment, Submission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  TrendingUp,
  FileText,
  Code2,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assessRes, subsRes, statsRes] = await Promise.all([
          api.get('/assessments'),
          api.get('/submissions?limit=5'),
          api.get('/analytics/student'),
        ]);

        if (assessRes.data.success) setAssessments(assessRes.data.data);
        if (subsRes.data.success) setSubmissions(subsRes.data.data.submissions);
        if (statsRes.data.success) setAnalytics(statsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const activeAssessments = assessments.filter((a) => {
    const attempt = a.attempts?.[0];
    return attempt?.status !== 'COMPLETED';
  });

  const completedAssessments = assessments.filter((a) => {
    const attempt = a.attempts?.[0];
    return attempt?.status === 'COMPLETED';
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Candidate Portal</span>
              <span>•</span>
              <span>{user?.studentProfile?.department || 'CSE'}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {user?.name} 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Roll No: <span className="text-slate-200 font-mono">{user?.studentProfile?.rollNumber || 'N/A'}</span> • Complete assigned exams in the proctored code environment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/student/practice"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/25"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Coding Practice</span>
            </Link>
            <Link
              to="/student/performance"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-medium transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Assigned Tests</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{assessments.length}</span>
            <span className="text-[11px] text-slate-500 ml-2">({activeAssessments.length} pending)</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Average Score</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">
              {analytics?.summary?.avgScore || 0}%
            </span>
            <span className="text-[11px] text-slate-500 ml-2">Highest: {analytics?.summary?.highestScore || 0}%</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Problems Solved</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {analytics?.summary?.totalQuestionsSolved || 0}
            </span>
            <span className="text-[11px] text-slate-500 ml-2">of {analytics?.summary?.totalQuestionsAttempted || 0} attempted</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Test Case Accuracy</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-cyan-400">
              {analytics?.summary?.accuracy || 0}%
            </span>
            <span className="text-[11px] text-slate-500 ml-2">passing rate</span>
          </div>
        </div>
      </div>

      {/* Assigned Assessments Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Assigned Assessments</h2>
          <Link to="/student/assessments" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assessments.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No coding assessments assigned to your batch yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((assessment) => {
              const attempt = assessment.attempts?.[0];
              const result = assessment.results?.[0];
              const isCompleted = attempt?.status === 'COMPLETED';

              return (
                <div
                  key={assessment.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                      }`}>
                        {isCompleted ? 'Completed' : 'Assigned / Ready'}
                      </span>
                      <div className="flex items-center space-x-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{assessment.duration} mins</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">
                      {assessment.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {assessment.description || 'Full-scale programming assessment with Monaco editor.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-y border-slate-800/60 mb-4 text-slate-300">
                      <div>
                        <span className="text-slate-500">Questions:</span> {assessment._count?.questions || assessment.questions?.length || 0}
                      </div>
                      <div>
                        <span className="text-slate-500">Total Marks:</span> {assessment.totalMarks}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-400">Scored: </span>
                          <span className="font-bold text-emerald-400">{result?.obtainedMarks || 0} / {assessment.totalMarks}</span>
                        </div>
                        <Link
                          to={`/student/assessment/${assessment.id}/result`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition"
                        >
                          View Result
                        </Link>
                      </div>
                    ) : (
                      <Link
                        to={`/student/assessment/${assessment.id}`}
                        className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{attempt ? 'Resume Assessment' : 'Start Assessment'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Submissions Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Problem Submissions</h2>
          <Link to="/student/submissions" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1">
            <span>All submissions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Question</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Pass Rate</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No code submissions logged yet. Start an assessment or coding practice!
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 font-medium text-white">{sub.question.title}</td>
                      <td className="px-4 py-3 font-mono uppercase text-slate-300">{sub.language}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sub.status === 'ACCEPTED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                            : sub.status === 'PARTIAL'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        }`}>
                          {sub.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-200">
                        {sub.marks} / {sub.question.marks}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {sub.testCasesPassed} / {sub.totalTestCases} cases
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
