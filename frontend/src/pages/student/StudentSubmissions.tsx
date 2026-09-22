import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Submission } from '../../types';
import { FileCode, Eye, CheckCircle, XCircle, Clock, X } from 'lucide-react';

export const StudentSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get('/submissions');
        if (res.data.success) {
          setSubmissions(res.data.data.submissions);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const openSubmissionDetails = async (id: string) => {
    try {
      const res = await api.get(`/submissions/${id}`);
      if (res.data.success) {
        setSelectedSub(res.data.data);
      }
    } catch (err) {
      alert('Failed to load submission details');
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
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">My Submissions</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          History of all code submissions, compiler outputs, and evaluations
        </p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Question</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Pass Rate</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No submissions recorded yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-white">{sub.question.title}</td>
                    <td className="px-4 py-3 text-slate-400">{sub.assessment?.title || 'Practice Mode'}</td>
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
                      {sub.marks} / {sub.question.marks}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {sub.testCasesPassed} / {sub.totalTestCases}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {sub.executionTime}ms
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openSubmissionDetails(sub.id)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="View source code"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedSub.question?.title}</h3>
                <span className="text-[11px] text-slate-400 font-mono uppercase">
                  {selectedSub.language} • {selectedSub.status} ({selectedSub.marks} marks)
                </span>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
                  Submitted Implementation Source Code
                </span>
                <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  {selectedSub.sourceCode}
                </pre>
              </div>

              {selectedSub.testResults && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
                    Test Evaluation Breakdown
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSub.testResults.map((tr: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                          tr.status === 'PASSED'
                            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        <span>Test Case {idx + 1} {tr.isHidden && '(Hidden)'}</span>
                        <span className="font-mono text-[10px]">{tr.executionTime}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
