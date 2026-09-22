import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Code2,
  FileCheck2,
  Award,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/admin');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const cards = stats?.cards || {};
  const charts = stats?.charts || {};
  const recentSubmissions = stats?.recentSubmissions || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Admin Overview & Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor assessments, real-time code executions, and student submissions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/admin/questions/create"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Question</span>
          </Link>
          <Link
            to="/admin/assessments/create"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/25"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Assessment</span>
          </Link>
        </div>
      </div>

      {/* 6 Key Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Students</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{cards.totalStudents || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active candidates</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Question Bank</span>
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">{cards.totalQuestions || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All topics & diffs</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Assessments</span>
            <FileCheck2 className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-xl font-bold text-white">{cards.totalAssessments || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Configured exams</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Active Exams</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{cards.activeAssessments || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Published & live</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Completed</span>
            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white">{cards.completedAssessments || 0}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Exam sessions finished</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Avg Score</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400">{cards.averageScore || 0}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cohort overall avg</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass / Fail Pie Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Assessment Pass / Fail Ratio
          </h3>
          <div className="h-52 w-full flex items-center justify-center">
            {charts.passFail && charts.passFail.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.passFail}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.passFail.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b162c', borderColor: '#1f3a6e', color: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-500">No submissions yet</span>
            )}
          </div>
          <div className="flex items-center justify-center space-x-6 text-xs mt-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Passed ({charts.passFail?.[0]?.value || 0})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Failed ({charts.passFail?.[1]?.value || 0})</span>
            </div>
          </div>
        </div>

        {/* Question Difficulty Distribution */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Question Bank Difficulty Distribution
          </h3>
          <div className="h-56 w-full">
            {charts.difficultyDistribution ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.difficultyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162a4f" />
                  <XAxis dataKey="difficulty" stroke="#8aaedc" fontSize={11} />
                  <YAxis stroke="#8aaedc" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b162c', borderColor: '#1f3a6e', color: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Live Recent Submissions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Submission Activity
            </h2>
            <p className="text-[11px] text-slate-400">Incoming student code executions and compiler evaluations</p>
          </div>
          <Link
            to="/admin/submissions"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Assessment / Problem</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No submissions logged.
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{sub.student?.name}</div>
                      <span className="text-[10px] text-slate-500 font-normal">{sub.student?.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <div>{sub.question?.title}</div>
                      <span className="text-[10px] text-slate-500">{sub.assessment?.title || 'Practice'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono uppercase text-slate-300">{sub.language}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        sub.status === 'ACCEPTED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : sub.status === 'PARTIAL'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">
                      {sub.marks} / {sub.question?.marks}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(sub.submittedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
