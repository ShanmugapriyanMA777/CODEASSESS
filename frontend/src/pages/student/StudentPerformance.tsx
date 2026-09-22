import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { TrendingUp, Award, CheckCircle2, Target } from 'lucide-react';

export const StudentPerformance: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/student');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load performance data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || { scoreOverTime: [], topicWise: [] };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Performance Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical learning curves, score trends, and topic-wise mastery
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Overall Average</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.avgScore || 0}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all completed exams</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Peak Score</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{summary.highestScore || 0}%</div>
          <div className="text-[10px] text-slate-500 mt-1">Best assessment performance</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white">{summary.totalQuestionsSolved || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">of {summary.totalQuestionsAttempted || 0} attempted</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Test Case Accuracy</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{summary.accuracy || 0}%</div>
          <div className="text-[10px] text-slate-500 mt-1">{summary.passedTestCases || 0} passed cases</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progression Over Time */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Score Progression Over Assessments (%)
          </h3>
          <div className="h-64 w-full">
            {charts.scoreOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.scoreOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162a4f" />
                  <XAxis dataKey="name" stroke="#8aaedc" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#8aaedc" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b162c', borderColor: '#1f3a6e', color: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score %"
                    stroke="#eab308"
                    strokeWidth={3}
                    dot={{ fill: '#fbbf24', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Complete more assessments to view progress curves.
              </div>
            )}
          </div>
        </div>

        {/* Topic-wise Performance Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
            Domain & Topic Mastery (%)
          </h3>
          <div className="h-64 w-full">
            {charts.topicWise.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topicWise}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#162a4f" />
                  <XAxis dataKey="topic" stroke="#8aaedc" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#8aaedc" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0b162c', borderColor: '#1f3a6e', color: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="accuracy" name="Pass Rate %" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Submit code across topics (Arrays, Strings, Sorting) to generate domain charts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
