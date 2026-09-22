import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AssessmentResult, Assessment } from '../../types';
import { Award, Search, Download, Filter, FileText, CheckCircle, XCircle } from 'lucide-react';

export const ResultList: React.FC = () => {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'marks' | 'time'>('marks');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    fetchResults();
  }, [selectedAssessmentId, sortBy, sortOrder]);

  const loadAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      if (res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (e) {}
  };

  const fetchResults = async () => {
    try {
      let query = `?sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (selectedAssessmentId) query += `&assessmentId=${selectedAssessmentId}`;
      if (search) query += `&search=${search}`;

      const res = await api.get(`/results${query}`);
      if (res.data.success) {
        setResults(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (results.length === 0) return;
    const headers = ['Rank', 'Student Name', 'Email', 'Roll Number', 'Assessment', 'Marks Obtained', 'Total Marks', 'Percentage', 'Questions Solved', 'Time Taken (s)', 'Status'];
    const rows = results.map((r) => [
      r.rank,
      `"${r.student?.name || ''}"`,
      r.student?.email || '',
      r.student?.studentProfile?.rollNumber || '',
      `"${r.assessment?.title || ''}"`,
      r.obtainedMarks,
      r.totalMarks,
      `${r.percentage.toFixed(1)}%`,
      `${r.questionsSolved}/${r.questionsAttempted}`,
      r.timeTaken,
      r.isPassed ? 'Passed' : 'Failed',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assessment_rankings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadStudentPdf = async (studentId: string, studentName: string, assessmentId?: string) => {
    try {
      const q = assessmentId ? `?assessmentId=${assessmentId}` : '';
      const response = await api.get(`/reports/student/${studentId}${q}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${studentName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate student PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Results & Dynamic Rankings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Leaderboard calculated dynamically with competition ranking and submission tie-breaking
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/reports"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Class Mark Statement</span>
          </Link>
          <button
            onClick={exportToCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchResults()}
            placeholder="Search student by name or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedAssessmentId}
          onChange={(e) => setSelectedAssessmentId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Assessments</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>{a.title}</option>
          ))}
        </select>

        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [sb, so] = e.target.value.split('-') as ['marks' | 'time', 'asc' | 'desc'];
            setSortBy(sb);
            setSortOrder(so);
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="marks-desc">Highest Marks First</option>
          <option value="marks-asc">Lowest Marks First</option>
          <option value="time-asc">Fastest Completion Time</option>
          <option value="time-desc">Slowest Completion Time</option>
        </select>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Solved</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">PDF Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No results recorded for this selection.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-bold font-mono">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        r.rank === 1
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : r.rank === 2
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                          : r.rank === 3
                          ? 'bg-orange-700/20 text-orange-300 border border-orange-700/40'
                          : 'text-slate-400'
                      }`}>
                        #{r.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{r.student?.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {r.student?.studentProfile?.rollNumber || r.student?.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{r.assessment?.title}</td>
                    <td className="px-4 py-3 font-bold text-slate-200 font-mono">
                      {r.obtainedMarks} / {r.totalMarks}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${r.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {r.questionsSolved} / {r.questionsAttempted}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {Math.round(r.timeTaken / 60)} mins
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => downloadStudentPdf(r.studentId, r.student?.name || 'student', r.assessmentId)}
                        className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition"
                        title="Download Candidate PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
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
