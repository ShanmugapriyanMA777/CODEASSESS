import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  FileText,
  ArrowRight,
  Check,
  X,
  AlertCircle,
  Play,
} from 'lucide-react';

export const AssessmentResultView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // If Admin views the result with ?studentId=..., use that student's ID, otherwise logged-in user
  const studentId = (isAdmin && searchParams.get('studentId')) || user?.id;

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/assessment/${id}/student/${studentId}`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchResult();
    }
  }, [id, studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!data?.result) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto mt-14 shadow-2xl space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Result Not Available</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            This assessment has not been submitted yet, or the candidate has not completed it.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-3">
          <Link
            to={`/student/assessment/${id}`}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start / Resume Test</span>
          </Link>
          <Link
            to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { result, submissions } = data;
  const isPassed = result.isPassed;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Scorecard Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
          isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }`}>
          <Award className="w-8 h-8" />
        </div>

        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
          isPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
        }`}>
          {isPassed ? 'Assessment Passed' : 'Needs Improvement'}
        </span>

        <h1 className="text-2xl font-bold text-white tracking-tight">{result.assessment?.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluated for <span className="text-slate-200 font-semibold">{user?.name}</span> • Roll No: {user?.studentProfile?.rollNumber || 'N/A'}
        </p>

        {/* Big Marks Display */}
        <div className="my-6">
          <div className="text-5xl font-extrabold text-white tracking-tight">
            {result.obtainedMarks} <span className="text-2xl font-medium text-slate-500">/ {result.totalMarks}</span>
          </div>
          <div className="text-sm font-semibold text-emerald-400 mt-1">
            {result.percentage.toFixed(1)}% Overall Score
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-center space-x-3">
          <Link
            to="/student/dashboard"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25"
          >
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Rank / Position</span>
          <span className="text-2xl font-bold text-amber-400">#{result.rank}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Dynamic Ranking</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Questions Solved</span>
          <span className="text-2xl font-bold text-white">{result.questionsSolved} <span className="text-sm font-normal text-slate-500">/ {result.questionsAttempted}</span></span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Accepted Solutions</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Test Cases Passed</span>
          <span className="text-2xl font-bold text-emerald-400">{result.testCasesPassed} <span className="text-sm font-normal text-slate-500">/ {result.totalTestCases}</span></span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Hidden + Sample</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
          <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">Time Taken</span>
          <span className="text-2xl font-bold text-white">{Math.round(result.timeTaken / 60)} <span className="text-sm font-normal text-slate-500">mins</span></span>
          <span className="text-[10px] text-slate-500 block mt-0.5">of {result.assessment?.duration}m allocated</span>
        </div>
      </div>

      {/* Submissions Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Question Evaluation Breakdown</h2>
          <span className="text-xs text-slate-400">{submissions.length} Submissions Logged</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {submissions.map((sub: any) => (
            <div key={sub.id} className="p-4 hover:bg-slate-800/20 transition flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  sub.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {sub.status === 'ACCEPTED' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{sub.question?.title}</h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                    <span className="uppercase">{sub.language}</span>
                    <span>•</span>
                    <span>{sub.testCasesPassed}/{sub.totalTestCases} Test Cases</span>
                    <span>•</span>
                    <span>{sub.executionTime}ms avg</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-200">
                  {sub.marks} / {sub.question?.marks} Marks
                </span>
                <span className={`block text-[10px] font-semibold ${
                  sub.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {sub.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
