import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Assessment } from '../../types';
import {
  FileCheck2,
  Plus,
  Clock,
  Award,
  Users,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

export const AssessmentList: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      if (res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.put(`/assessments/${id}`, { isPublished: !currentStatus });
      if (res.data.success) {
        setAssessments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isPublished: !currentStatus } : a))
        );
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete assessment "${title}"?`)) {
      try {
        await api.delete(`/assessments/${id}`);
        setAssessments((prev) => prev.filter((a) => a.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
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
          <h1 className="text-xl font-bold text-white tracking-tight">Assessments & Exams</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure examination schedules, anti-cheating rules, and student assignments
          </p>
        </div>

        <Link
          to="/admin/assessments/create"
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Assessment</span>
        </Link>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No assessments created yet.
                  </td>
                </tr>
              ) : (
                assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{a.title}</div>
                      <span className="text-[11px] text-slate-400 font-normal line-clamp-1">{a.description}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{a.duration} mins</td>
                    <td className="px-4 py-3 font-bold text-slate-200">{a.totalMarks} pts</td>
                    <td className="px-4 py-3 text-slate-300">
                      {a._count?.questions || a.questions?.length || 0}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {a._count?.assignments || a.assignments?.length || 0} batches/students
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {a._count?.results || 0} completed
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublish(a.id, a.isPublished)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          a.isPublished
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {a.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        to={`/admin/assessments/${a.id}/edit`}
                        className="inline-block p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit assessment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        className="p-1.5 rounded hover:bg-rose-950/40 text-rose-400"
                        title="Delete assessment"
                      >
                        <Trash2 className="w-4 h-4" />
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
