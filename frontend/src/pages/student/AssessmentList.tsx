import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Assessment } from '../../types';
import { FileCheck2, Clock, Play, Award, CheckCircle } from 'lucide-react';

export const AssessmentList: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    const isCompleted = a.attempts?.[0]?.status === 'COMPLETED';
    if (filter === 'ACTIVE') return !isCompleted;
    if (filter === 'COMPLETED') return isCompleted;
    return true;
  });

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
          <h1 className="text-xl font-bold text-white tracking-tight">My Assessments</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active and past coding exams assigned to your cohort
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-lg">
          {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssessments.length === 0 ? (
          <div className="col-span-full bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
            No assessments found matching the selected filter.
          </div>
        ) : (
          filteredAssessments.map((a) => {
            const attempt = a.attempts?.[0];
            const result = a.results?.[0];
            const isCompleted = attempt?.status === 'COMPLETED';

            return (
              <div
                key={a.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      isCompleted ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                    }`}>
                      {isCompleted ? 'Completed' : 'Available'}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{a.duration} mins</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-white line-clamp-1 mb-1">{a.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{a.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-y border-slate-800/60 mb-4 text-slate-300">
                    <div>Questions: {a.questions?.length || a._count?.questions || 0}</div>
                    <div>Total Marks: {a.totalMarks}</div>
                  </div>
                </div>

                <div>
                  {isCompleted ? (
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate-400">Score: </span>
                        <span className="font-bold text-emerald-400">{result?.obtainedMarks || 0} / {a.totalMarks}</span>
                      </div>
                      <Link
                        to={`/student/assessment/${a.id}/result`}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold transition"
                      >
                        Result
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/student/assessment/${a.id}`}
                      className="w-full flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{attempt ? 'Resume Assessment' : 'Start Assessment'}</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
