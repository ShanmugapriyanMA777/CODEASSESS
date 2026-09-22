import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import { Plus, Trash2, Save, ArrowLeft, Eye, ShieldAlert } from 'lucide-react';

export const QuestionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [category, setCategory] = useState('Arrays');
  const [marks, setMarks] = useState(10);
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(128);

  // Multi-language starter codes
  const [activeStarterLang, setActiveStarterLang] = useState('python');
  const [starterCodes, setStarterCodes] = useState<Record<string, string>>({
    python: `import sys\n\ndef solve():\n    # Write your implementation here\n    pass\n\nif __name__ == '__main__':\n    solve()`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your implementation here\n    }\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your implementation here\n    return 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your implementation here\n    return 0;\n}`,
  });

  // Test cases: input, expectedOutput, isHidden
  const [testCases, setTestCases] = useState<any[]>([
    { input: '', expectedOutput: '', isHidden: false, explanation: 'Sample test case 1' },
    { input: '', expectedOutput: '', isHidden: true, explanation: 'Hidden evaluation test case' },
  ]);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      const fetchQuestion = async () => {
        try {
          const res = await api.get(`/questions/${id}`);
          if (res.data.success) {
            const q = res.data.data;
            setTitle(q.title);
            setDescription(q.description);
            setInputFormat(q.inputFormat);
            setOutputFormat(q.outputFormat);
            setConstraints(q.constraints);
            setExplanation(q.explanation || '');
            setDifficulty(q.difficulty);
            setCategory(q.category);
            setMarks(q.marks);
            setTimeLimit(q.timeLimit);
            setMemoryLimit(q.memoryLimit);

            try {
              const sc = JSON.parse(q.starterCode || '{}');
              setStarterCodes((prev) => ({ ...prev, ...sc }));
            } catch (e) {}

            if (q.testCases && q.testCases.length > 0) {
              setTestCases(q.testCases);
            }
          }
        } catch (err) {
          console.error('Failed to load question:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchQuestion();
    }
  }, [id, isEditing]);

  const handleAddTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: '', expectedOutput: '', isHidden: true, explanation: '' },
    ]);
  };

  const handleRemoveTestCase = (idx: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTestCaseChange = (idx: number, field: string, value: any) => {
    setTestCases((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        title,
        description,
        inputFormat,
        outputFormat,
        constraints,
        explanation,
        difficulty,
        category,
        marks,
        timeLimit,
        memoryLimit,
        starterCode: starterCodes,
        testCases,
      };

      if (isEditing) {
        await api.put(`/questions/${id}`, payload);
      } else {
        await api.post('/questions', payload);
      }

      navigate('/admin/questions');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
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
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? 'Edit Coding Problem' : 'Create New Coding Problem'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure problem statements, test cases, and multi-language starter templates
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Problem'}</span>
        </button>
      </div>

      {/* Main Details Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
          Core Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Find Largest Element in Array"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Arrays">Arrays</option>
              <option value="Strings">Strings</option>
              <option value="Sorting">Sorting</option>
              <option value="Searching">Searching</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Recursion">Recursion</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Algorithms">Algorithms</option>
              <option value="SQL">SQL</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Marks</label>
            <input
              type="number"
              min="1"
              max="100"
              value={marks}
              onChange={(e) => setMarks(parseInt(e.target.value, 10) || 10)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Time Limit (ms)</label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 2000)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Problem Statement / Description *</label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a clear statement of the problem..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Input Format</label>
            <textarea
              rows={2}
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              placeholder="e.g. First line contains N..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Output Format</label>
            <textarea
              rows={2}
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              placeholder="e.g. Print single integer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Constraints</label>
          <textarea
            rows={2}
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            placeholder="1 <= N <= 10^5..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
          />
        </div>
      </div>

      {/* Starter Code Editor for Languages */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Starter Code Templates
            </h2>
            <p className="text-[11px] text-slate-500">Provide initial boilerplate for each programming language</p>
          </div>

          <div className="flex space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['python', 'java', 'c', 'cpp'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveStarterLang(lang)}
                className={`px-3 py-1 rounded text-xs font-mono uppercase transition ${
                  activeStarterLang === lang ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 rounded-lg overflow-hidden border border-slate-800">
          <MonacoCodeEditor
            value={starterCodes[activeStarterLang] || ''}
            onChange={(val) => {
              setStarterCodes((prev) => ({ ...prev, [activeStarterLang]: val }));
            }}
            language={activeStarterLang}
          />
        </div>
      </div>

      {/* Test Cases Manager (Sample and Hidden) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Test Cases (Sample & Hidden Evaluation)
            </h2>
            <p className="text-[11px] text-slate-500">
              Sample test cases are visible to students. Hidden test cases evaluate submissions without exposing input/output.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddTestCase}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Test Case</span>
          </button>
        </div>

        <div className="space-y-4">
          {testCases.map((tc, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-white">Test Case #{idx + 1}</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={(e) => handleTestCaseChange(idx, 'isHidden', e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={tc.isHidden ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                      {tc.isHidden ? 'Hidden Evaluation Case' : 'Public Sample Case'}
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveTestCase(idx)}
                  className="p-1 rounded hover:bg-rose-950/40 text-rose-400"
                  title="Remove testcase"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1">Standard Input</label>
                  <textarea
                    rows={2}
                    value={tc.input}
                    onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                    placeholder="Input string..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-mono mb-1">Expected Output</label>
                  <textarea
                    rows={2}
                    value={tc.expectedOutput}
                    onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                    placeholder="Expected output string..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
