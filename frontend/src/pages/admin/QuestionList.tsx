import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Question } from '../../types';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import {
  Code2,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  X,
  Play,
  CheckCircle,
  XCircle,
  FileCode,
} from 'lucide-react';

export const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  // Preview Modal State
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [previewLang, setPreviewLang] = useState('python');
  const [previewCode, setPreviewCode] = useState('');
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewResults, setPreviewResults] = useState<any[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, [category, difficulty]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/questions?category=${category}&difficulty=${difficulty}&search=${search}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete question "${title}"?`)) {
      try {
        await api.delete(`/questions/${id}`);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete question');
      }
    }
  };

  const openPreview = (q: Question) => {
    setPreviewQuestion(q);
    setPreviewLang('python');
    setPreviewResults([]);
    try {
      const starter = JSON.parse(q.starterCode || '{}');
      setPreviewCode(starter.python || starter.java || '// Implementation');
    } catch (e) {
      setPreviewCode('// Implementation');
    }
  };

  const handlePreviewRun = async () => {
    if (!previewQuestion) return;
    setPreviewRunning(true);
    try {
      const res = await api.post('/submissions/run', {
        questionId: previewQuestion.id,
        language: previewLang,
        sourceCode: previewCode,
      });
      if (res.data.success) {
        setPreviewResults(res.data.data.results);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Run error');
    } finally {
      setPreviewRunning(false);
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Question Bank</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create and maintain problem statements, starter codes, and test cases
          </p>
        </div>

        <Link
          to="/admin/questions/create"
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Problem</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
            placeholder="Search problems by title or content..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            <option value="Arrays">Arrays</option>
            <option value="Strings">Strings</option>
            <option value="Sorting">Sorting</option>
            <option value="Searching">Searching</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Recursion">Recursion</option>
            <option value="Data Structures">Data Structures</option>
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Test Cases</th>
                <th className="px-4 py-3">Submissions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No coding questions match your search query.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{q.title}</div>
                      <span className="text-[11px] text-slate-400 font-normal line-clamp-1">{q.description}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{q.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        q.difficulty === 'Easy'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">{q.marks} pts</td>
                    <td className="px-4 py-3 text-slate-300">
                      {q._count?.testCases || q.testCases?.length || 0} cases
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {q._count?.submissions || 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openPreview(q)}
                        className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300"
                        title="Student View Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/admin/questions/${q.id}/edit`}
                        className="inline-block p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(q.id, q.title)}
                        className="p-1.5 rounded hover:bg-rose-950/40 text-rose-400 hover:text-rose-300"
                        title="Delete question"
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

      {/* STUDENT-VIEW PREVIEW MODAL (Section 39) */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Student Experience Preview
                </span>
                <span className="text-sm font-bold text-white">{previewQuestion.title}</span>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left problem statement */}
              <div className="w-1/2 p-5 border-r border-slate-800 overflow-y-auto space-y-4 text-xs text-slate-300">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-800 text-slate-300">
                      {previewQuestion.category}
                    </span>
                    <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-950 text-emerald-400">
                      {previewQuestion.difficulty}
                    </span>
                    <span className="font-bold text-slate-200">{previewQuestion.marks} Marks</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{previewQuestion.title}</h3>
                  <p className="whitespace-pre-line text-slate-300 leading-relaxed">{previewQuestion.description}</p>
                </div>

                {previewQuestion.inputFormat && (
                  <div>
                    <h4 className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Input Format</h4>
                    <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-slate-300 whitespace-pre-line">{previewQuestion.inputFormat}</pre>
                  </div>
                )}

                {previewQuestion.outputFormat && (
                  <div>
                    <h4 className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Output Format</h4>
                    <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-slate-300 whitespace-pre-line">{previewQuestion.outputFormat}</pre>
                  </div>
                )}

                {previewQuestion.constraints && (
                  <div>
                    <h4 className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Constraints</h4>
                    <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-slate-300 whitespace-pre-line">{previewQuestion.constraints}</pre>
                  </div>
                )}
              </div>

              {/* Right code editor preview */}
              <div className="w-1/2 flex flex-col h-full bg-slate-950">
                <div className="flex-1 relative">
                  <MonacoCodeEditor
                    value={previewCode}
                    onChange={setPreviewCode}
                    language={previewLang}
                    onLanguageChange={(l) => {
                      setPreviewLang(l);
                      try {
                        const s = JSON.parse(previewQuestion.starterCode || '{}');
                        setPreviewCode(s[l] || '');
                      } catch (e) {}
                    }}
                  />
                </div>

                {/* Bottom run bar */}
                <div className="h-44 border-t border-slate-800 bg-slate-900 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-slate-300">Live Test Run Execution</span>
                    <button
                      onClick={handlePreviewRun}
                      disabled={previewRunning}
                      className="flex items-center space-x-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{previewRunning ? 'Running...' : 'Run Test'}</span>
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-xs py-2">
                    {previewResults.length > 0 ? (
                      <div className="space-y-2">
                        {previewResults.map((r, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
                            <span className="flex items-center space-x-1.5">
                              {r.status === 'PASSED' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                              <span>Case {idx + 1}: {r.status}</span>
                            </span>
                            <span className="text-slate-500">{r.executionTime}ms</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500">Run code to test student experience against sample inputs.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
