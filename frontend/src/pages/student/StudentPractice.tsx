import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import { Code2, Play, CheckCircle, XCircle, AlertTriangle, Search, Filter, ArrowLeft } from 'lucide-react';

const CANNED_SIGNATURES = [
  'def solve():',
  'sys.stdin.readline()',
  'sys.stdin.read().split()',
  'print("Not Prime")',
  'print("Prime")',
  'print(max(arr))',
  'print(s[::-1])',
  'print("Palindrome")',
  'seen[num] = i',
  'max_val = INT_MIN',
  'int max = -2147483648',
  'maxVal = Integer.MIN_VALUE',
  'Scanner sc = new Scanner(System.in)',
  'unordered_map<int, int> seen',
];

const isCannedSolution = (code?: string | null) => {
  if (!code) return false;
  return CANNED_SIGNATURES.some((sig) => code.includes(sig));
};

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

  const getDefaultStarter = (lang: string) => {
    const l = (lang || '').toLowerCase();
    if (l === 'python' || l === 'py') return '# Write your solution here\n';
    if (l === 'javascript' || l === 'js') return '// Write your solution here\n';
    if (l === 'java') return 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n';
    if (l === 'c') return '#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n';
    if (l === 'cpp' || l === 'c++') return '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n';
    return '// Write your solution here\n';
  };

  const selectQuestion = (q: Question) => {
    setSelectedQuestion(q);
    setShowMobileList(false);
    setTestResults([]);
    try {
      const starter = JSON.parse(q.starterCode || '{}');
      const candidate = starter[language] || starter.python;
      if (candidate && !isCannedSolution(candidate)) {
        setCode(candidate);
      } else {
        setCode(getDefaultStarter(language));
      }
    } catch (e) {
      setCode(getDefaultStarter(language));
    }
  };

  const handleResetCode = () => {
    if (!selectedQuestion) return;
    if (window.confirm('Reset code to starter template? Your unsaved edits will be discarded.')) {
      setCode(getDefaultStarter(language));
    }
  };

  const handleClearCode = () => {
    if (window.confirm('Clear all code in the editor?')) {
      setCode('');
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
                onReset={handleResetCode}
                onClear={handleClearCode}
                onLanguageChange={(l) => {
                  setLanguage(l);
                  if (!selectedQuestion) return;
                  try {
                    const starter = JSON.parse(selectedQuestion.starterCode || '{}');
                    const candidate = starter[l];
                    if (candidate && !isCannedSolution(candidate)) {
                      setCode(candidate);
                    } else {
                      setCode(getDefaultStarter(l));
                    }
                  } catch (e) {
                    setCode(getDefaultStarter(l));
                  }
                }}
              />
            </div>

            {/* Test Results Console */}
            {testResults.length > 0 && (
              <div className="h-60 border-t border-slate-800 bg-slate-950 p-3 overflow-y-auto text-xs space-y-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Sample Test Results:</span>
                {testResults.map((tr, idx) => {
                  const isPassed = tr.status === 'PASSED';
                  const isError = tr.status === 'ERROR';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        isPassed
                          ? 'bg-slate-900/90 border-emerald-900/40'
                          : isError
                          ? 'bg-slate-900/90 border-amber-900/40'
                          : 'bg-slate-900/90 border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
                        <div className="flex items-center space-x-2">
                          {isPassed ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : isError ? (
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className="text-white font-medium">Case {idx + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isPassed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isError
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </div>
                        <span className="text-slate-500 font-mono text-[10px]">{tr.executionTime}ms</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Input</span>
                          <pre className="p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto min-h-[38px]">
                            {tr.input || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Expected Output</span>
                          <pre className="p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto min-h-[38px]">
                            {tr.expectedOutput || '(empty)'}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-0.5">Actual Output</span>
                          <pre
                            className={`p-2 bg-slate-950 border rounded font-mono whitespace-pre-wrap overflow-x-auto min-h-[38px] ${
                              isPassed
                                ? 'text-emerald-400 border-emerald-900/50'
                                : isError
                                ? 'text-amber-400 border-amber-900/50'
                                : 'text-rose-400 border-rose-900/50'
                            }`}
                          >
                            {tr.actualOutput || (isError ? '(errored before output)' : '(no output)')}
                          </pre>
                        </div>
                      </div>

                      {tr.error && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-1">
                            Error Output / Traceback:
                          </span>
                          <pre className="p-2 bg-rose-950/30 border border-rose-900/50 rounded text-rose-300 text-[11px] font-mono whitespace-pre-wrap overflow-x-auto max-h-36">
                            {tr.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
