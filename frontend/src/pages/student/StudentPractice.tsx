import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import { Code2, Play, CheckCircle, XCircle, Search, Filter, ArrowLeft } from 'lucide-react';

export const StudentPractice: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [search, setSearch] = useState('');

  // Practice IDE state
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showMobileList, setShowMobileList] = useState(!selectedQuestion);

  useEffect(() => {
    fetchQuestions();
  }, [category, difficulty]);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/questions?category=${category}&difficulty=${difficulty}&search=${search}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        if (res.data.data.questions.length > 0 && !selectedQuestion) {
          selectQuestion(res.data.data.questions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load practice questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setShowMobileList(false);
    setTestResults([]);
    try {
      const starter = JSON.parse(q.starterCode || '{}');
      setCode(starter[language] || starter.python || '// Write code here');
    } catch (e) {
      setCode('// Write code here');
    }
  };

  const handleRunCode = async () => {
    if (!selectedQuestion) return;
    setIsRunning(true);
    try {
      const res = await api.post('/submissions/run', {
        questionId: selectedQuestion.id,
        language,
        sourceCode: code,
      });
      if (res.data.success) {
        setTestResults(res.data.data.results);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Execution error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* Left List of Questions */}
      <div className={`w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-xl flex-col flex-shrink-0 overflow-hidden ${
        showMobileList ? 'flex h-full' : 'hidden lg:flex'
      }`}>
        <div className="p-3 border-b border-slate-800 bg-slate-950 space-y-2">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
              placeholder="Search problem..."
              className="bg-transparent text-slate-200 outline-none w-full text-xs"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300"
            >
              <option value="All">All Topics</option>
              <option value="Arrays">Arrays</option>
              <option value="Strings">Strings</option>
              <option value="Sorting">Sorting</option>
              <option value="Searching">Searching</option>
              <option value="Mathematics">Math</option>
              <option value="Recursion">Recursion</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-24 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-300"
            >
              <option value="All">All Diff</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => selectQuestion(q)}
              className={`w-full text-left p-3 text-xs transition ${
                selectedQuestion?.id === q.id ? 'bg-indigo-600/15 border-l-2 border-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800/40'
              }`}
            >
              <div className="font-semibold mb-1 truncate">{q.title}</div>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                <span className={`px-1.5 py-0.2 rounded font-medium ${
                  q.difficulty === 'Easy' ? 'text-emerald-400' : q.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                }`}>{q.difficulty}</span>
                <span>•</span>
                <span>{q.category}</span>
                <span>•</span>
                <span>{q.marks}m</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Practice Editor */}
      {selectedQuestion && (
        <div className={`flex-1 bg-slate-900 border border-slate-800 rounded-xl flex-col overflow-hidden ${
          !showMobileList ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Question Details Header */}
          <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 truncate">
              <button
                type="button"
                onClick={() => setShowMobileList(true)}
                className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex-shrink-0 cursor-pointer"
                title="Back to Questions"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="truncate">
                <h2 className="text-sm font-bold text-white truncate">{selectedQuestion.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{selectedQuestion.description}</p>
              </div>
            </div>
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Compiling...' : 'Run Test'}</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <MonacoCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={(l) => {
                  setLanguage(l);
                  try {
                    const starter = JSON.parse(selectedQuestion.starterCode || '{}');
                    setCode(starter[l] || '');
                  } catch (e) {}
                }}
              />
            </div>

            {/* Test Results Console */}
            {testResults.length > 0 && (
              <div className="h-44 border-t border-slate-800 bg-slate-950 p-3 overflow-y-auto font-mono text-xs space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Sample Test Results:</span>
                {testResults.map((tr, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {tr.status === 'PASSED' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>Case {idx + 1}: {tr.status}</span>
                    </div>
                    <span className="text-slate-500">{tr.executionTime}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
