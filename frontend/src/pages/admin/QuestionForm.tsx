import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Eye,
  ShieldAlert,
  Play,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Terminal,
  Code2,
  RefreshCw,
  FileCode,
} from 'lucide-react';

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
    python: `# Write your solution here\n`,
    javascript: `// Write your solution here\n`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`,
  });

  // Test cases: input, expectedOutput, isHidden
  const [testCases, setTestCases] = useState<any[]>([
    { input: '', expectedOutput: '', isHidden: false, explanation: 'Sample test case 1' },
    { input: '', expectedOutput: '', isHidden: true, explanation: 'Hidden evaluation test case' },
  ]);

  // Program Box state
  const [importerTab, setImporterTab] = useState<'smart-paste' | 'interactive'>('smart-paste');
  const [rawProblemPaste, setRawProblemPaste] = useState('');
  const [programLang, setProgramLang] = useState('python');
  const [programCode, setProgramCode] = useState<string>(`import sys

def solve():
    try:
        lines = sys.stdin.read().split()
        if not lines:
            return
        print(" ".join(lines))
    except Exception as e:
        pass

if __name__ == '__main__':
    solve()`);
  const [testInput, setTestInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    status: string;
    stdout: string;
    stderr: string;
    actualOutput: string;
    expectedOutput: string;
    isMatched: boolean | null;
    executionTime: number;
    memoryUsed: number;
    error?: string;
  } | null>(null);
  const [parseFeedback, setParseFeedback] = useState<string | null>(null);

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

  const handleDescriptionPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    
    const hasInput = /input( format)?\s*:/i.test(pastedText);
    const hasOutput = /output( format)?\s*:/i.test(pastedText);
    
    if (hasInput || hasOutput) {
      e.preventDefault();
      
      let descStr = pastedText;
      let inputStr = '';
      let outputStr = '';
      let constraintStr = '';
      
      const constraintMatch = descStr.match(/constraints?\s*:([\s\S]*)/i);
      if (constraintMatch) {
        constraintStr = constraintMatch[1].trim();
        descStr = descStr.substring(0, constraintMatch.index!).trim();
      }
      
      const outputMatch = descStr.match(/output( format)?\s*:([\s\S]*)/i);
      if (outputMatch) {
        outputStr = outputMatch[2].trim();
        descStr = descStr.substring(0, outputMatch.index!).trim();
      }
      
      const inputMatch = descStr.match(/input( format)?\s*:([\s\S]*)/i);
      if (inputMatch) {
        inputStr = inputMatch[2].trim();
        descStr = descStr.substring(0, inputMatch.index!).trim();
      }
      
      setDescription(descStr);
      if (inputStr) setInputFormat(inputStr);
      if (outputStr) setOutputFormat(outputStr);
      if (constraintStr) setConstraints(constraintStr);
    }
  };

  const handleTestCasePaste = (idx: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const outputMatch = pastedText.match(/output\s*:\s*([\s\S]*)/i) || pastedText.match(/\boutput\b\s*\n([\s\S]*)/i) || pastedText.match(/expected output\s*:\s*([\s\S]*)/i);
    
    if (outputMatch) {
      e.preventDefault();
      const fullOutput = outputMatch[1].trim();
      const fullInput = pastedText.substring(0, outputMatch.index!).replace(/input\s*:/i, '').trim();
      
      setTestCases((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], input: fullInput, expectedOutput: fullOutput };
        return copy;
      });
    }
  };

  const handleLoadExample = () => {
    const sample = `Problem: Calculate Factorial of a Number
Write a program that takes an integer N and prints its factorial (N!).

Input Format:
A single integer N

Output Format:
Print the factorial of N

Constraints:
0 <= N <= 20

Program (Python):
import math

def solve():
    try:
        import sys
        raw = sys.stdin.read().strip()
        if not raw:
            return
        n = int(raw)
        print(math.factorial(n))
    except Exception as e:
        pass

if __name__ == '__main__':
    solve()

Input:
5
Expected Output:
120

Input:
0
Expected Output:
1

Input:
7
Expected Output:
5040`;
    setRawProblemPaste(sample);
  };

  const handleExtractFromRawPaste = (textToParse?: string) => {
    const raw = textToParse !== undefined ? textToParse : rawProblemPaste;
    if (!raw.trim()) {
      alert('Please paste the problem text, program, and expected output first.');
      return;
    }

    let parsedQuestion = '';
    let parsedTitle = '';
    let parsedInputFormat = '';
    let parsedOutputFormat = '';
    let parsedConstraints = '';
    let parsedCode = '';
    let detectedLang = programLang;
    const extractedTestCases: Array<{ input: string; expectedOutput: string; isHidden: boolean; explanation: string }> = [];

    // 1. Detect code block (Markdown fenced ```lang ... ``` or Program/Code: ...)
    const fencedCodeMatch = raw.match(/```([a-zA-Z0-9+#]*)\n([\s\S]*?)```/);
    if (fencedCodeMatch) {
      const langHint = fencedCodeMatch[1].toLowerCase();
      parsedCode = fencedCodeMatch[2].trim();
      if (['python', 'py'].includes(langHint)) detectedLang = 'python';
      else if (['java'].includes(langHint)) detectedLang = 'java';
      else if (['cpp', 'c++'].includes(langHint)) detectedLang = 'cpp';
      else if (['c'].includes(langHint)) detectedLang = 'c';
    } else {
      const codeHeaderMatch = raw.match(
        /(?:program|solution|code|source\s*code|reference\s*program)\s*(?:\(([a-zA-Z0-9+# ]+)\))?\s*:\s*([\s\S]*?)(?=(?:\n\s*(?:(?:sample\s+)?inputs?(?:\s*\d+)?|test\s*cases?|input\s*format|expected\s*output)\b|$))/i
      );
      if (codeHeaderMatch) {
        parsedCode = codeHeaderMatch[2].trim();
        const langInParen = (codeHeaderMatch[1] || '').toLowerCase();
        if (langInParen.includes('python')) detectedLang = 'python';
        else if (langInParen.includes('java')) detectedLang = 'java';
        else if (langInParen.includes('cpp') || langInParen.includes('c++')) detectedLang = 'cpp';
        else if (langInParen.includes('c')) detectedLang = 'c';
      }
    }

    // Auto-detect language from code content if not explicitly stated
    if (parsedCode) {
      if (/#include\s*<iostream>|std::|cout\s*<<|cin\s*>>/i.test(parsedCode)) {
        detectedLang = 'cpp';
      } else if (/#include\s*<stdio\.h>|printf\s*\(|scanf\s*\(/i.test(parsedCode)) {
        detectedLang = 'c';
      } else if (/public\s+class\s+|System\.out\.println|Scanner\s+/i.test(parsedCode)) {
        detectedLang = 'java';
      } else if (/def\s+[a-zA-Z_]\w*\(|import\s+sys|input\s*\(|print\s*\(/i.test(parsedCode)) {
        detectedLang = 'python';
      }
    }

    // 2. Extract Test Cases (Inputs and Expected Outputs)
    const testCaseRegex =
      /(?:(?:sample\s+)?inputs?(?:\s*\d+)?\s*:)([\s\S]*?)(?:(?:sample\s+)?(?:expected\s+)?outputs?(?:\s*\d+)?\s*:)([\s\S]*?)(?=(?:\n\s*(?:sample\s+)?inputs?(?:\s*\d+)?\s*:|$))/gi;
    let match;
    while ((match = testCaseRegex.exec(raw)) !== null) {
      const inVal = match[1].trim();
      const outVal = match[2].trim();
      if (inVal || outVal) {
        extractedTestCases.push({
          input: inVal,
          expectedOutput: outVal,
          isHidden: extractedTestCases.length > 0,
          explanation: `Test case ${extractedTestCases.length + 1}`,
        });
      }
    }

    // 3. Extract Question / Problem Description & Formats
    let descText = raw;
    if (fencedCodeMatch) {
      descText = descText.replace(fencedCodeMatch[0], '');
    }
    descText = descText.replace(
      /(?:program|solution|code|source\s*code|reference\s*program)\s*(?:\([a-zA-Z0-9+# ]+\))?\s*:[\s\S]*?(?=(?:\n\s*(?:(?:sample\s+)?inputs?(?:\s*\d+)?|test\s*cases?)\b|$))/gi,
      ''
    );
    descText = descText.replace(
      /(?:sample\s+)?inputs?(?:\s*\d+)?\s*:[\s\S]*?(?:(?:sample\s+)?(?:expected\s+)?outputs?(?:\s*\d+)?\s*:)[\s\S]*?(?=(?:\n\s*(?:sample\s+)?inputs?(?:\s*\d+)?\s*:|$))/gi,
      ''
    );

    // Title match
    const titleMatch = descText.match(/(?:title|problem\s+name|problem\s+title)\s*:\s*([^\n]+)/i);
    if (titleMatch) {
      parsedTitle = titleMatch[1].trim();
      descText = descText.replace(titleMatch[0], '');
    } else {
      const problemLineMatch = descText.match(/^(?:problem|question)\s*:\s*([^\n]+)/im);
      if (problemLineMatch && problemLineMatch[1].trim().length < 80) {
        parsedTitle = problemLineMatch[1].trim();
        descText = descText.replace(problemLineMatch[0], '');
      }
    }

    // Constraints match
    const constraintMatch = descText.match(/constraints?\s*:([\s\S]*?)(?=(?:\n\s*(?:input|output|format|notes?)\b|$))/i);
    if (constraintMatch) {
      parsedConstraints = constraintMatch[1].trim();
      descText = descText.replace(constraintMatch[0], '');
    }

    // Output Format match
    const outputFormatMatch = descText.match(/output\s*(?:format)?\s*:([\s\S]*?)(?=(?:\n\s*(?:input|constraints?|notes?)\b|$))/i);
    if (outputFormatMatch) {
      parsedOutputFormat = outputFormatMatch[1].trim();
      descText = descText.replace(outputFormatMatch[0], '');
    }

    // Input Format match
    const inputFormatMatch = descText.match(/input\s*(?:format)?\s*:([\s\S]*?)(?=(?:\n\s*(?:output|constraints?|notes?)\b|$))/i);
    if (inputFormatMatch) {
      parsedInputFormat = inputFormatMatch[1].trim();
      descText = descText.replace(inputFormatMatch[0], '');
    }

    parsedQuestion = descText
      .replace(/^(?:problem|question|description)\s*:\s*/i, '')
      .trim();

    if (!title && !parsedTitle && parsedQuestion) {
      const firstLine = parsedQuestion.split('\n')[0].replace(/^[#\s*-]+/, '').trim();
      if (firstLine.length > 5 && firstLine.length < 80) {
        parsedTitle = firstLine;
      }
    }

    // Apply parsed values to state
    if (parsedTitle) setTitle(parsedTitle);
    if (parsedQuestion) setDescription(parsedQuestion);
    if (parsedInputFormat) setInputFormat(parsedInputFormat);
    if (parsedOutputFormat) setOutputFormat(parsedOutputFormat);
    if (parsedConstraints) setConstraints(parsedConstraints);

    if (parsedCode) {
      setProgramCode(parsedCode);
      setProgramLang(detectedLang);
      setActiveStarterLang(detectedLang);
      setStarterCodes((prev) => ({
        ...prev,
        [detectedLang]: parsedCode,
      }));
    }

    if (extractedTestCases.length > 0) {
      setTestCases(extractedTestCases);
      setTestInput(extractedTestCases[0].input);
      setExpectedOutput(extractedTestCases[0].expectedOutput);
    }

    setParseFeedback(
      `Extracted: ${parsedQuestion ? 'Question, ' : ''}${parsedCode ? `${detectedLang.toUpperCase()} Program, ` : ''}${extractedTestCases.length} Test Case(s) with Expected Outputs.`
    );
    setTimeout(() => setParseFeedback(null), 6000);
  };

  const handleRunProgram = async () => {
    if (!programCode.trim()) {
      alert('Please enter or paste the program code first.');
      return;
    }

    setIsRunning(true);
    setRunResult(null);

    try {
      const res = await api.post('/questions/test-run', {
        language: programLang,
        sourceCode: programCode,
        input: testInput,
        expectedOutput: expectedOutput,
      });

      if (res.data.success) {
        setRunResult(res.data.data);
      } else {
        alert(res.data.message || 'Execution failed');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing program');
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerateExpectedOutput = async () => {
    if (!programCode.trim()) {
      alert('Please enter or paste the program code first.');
      return;
    }

    setIsRunning(true);
    try {
      const res = await api.post('/questions/test-run', {
        language: programLang,
        sourceCode: programCode,
        input: testInput,
      });

      if (res.data.success) {
        const out = res.data.data.stdout || '';
        setExpectedOutput(out);
        setRunResult(res.data.data);
        setParseFeedback('Expected output generated successfully from program execution!');
        setTimeout(() => setParseFeedback(null), 4000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddAsTestCase = () => {
    if (!testInput && !expectedOutput) {
      alert('Please enter test input and expected output first.');
      return;
    }

    const newCase = {
      input: testInput,
      expectedOutput: expectedOutput || runResult?.actualOutput || '',
      isHidden: testCases.length > 0,
      explanation: `Test case ${testCases.length + 1}`,
    };

    setTestCases((prev) => [...prev, newCase]);
    setParseFeedback(`Added to Test Cases as Test Case #${testCases.length + 1}`);
    setTimeout(() => setParseFeedback(null), 4000);
  };

  const handleSyncToStarterCode = () => {
    setStarterCodes((prev) => ({
      ...prev,
      [programLang]: programCode,
    }));
    setActiveStarterLang(programLang);
    setParseFeedback(`Program synced to ${programLang.toUpperCase()} Starter Code Template!`);
    setTimeout(() => setParseFeedback(null), 4000);
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
            onPaste={handleDescriptionPaste}
            placeholder="Write a clear statement of the problem... (Pro-tip: Paste a full problem here to auto-extract Input/Output/Constraints)"
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

      {/* PROGRAM BOX (Directly Below Input Details) */}
      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-xl p-5 space-y-4 shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                  Program Box & Execution Sandbox
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Quick Paste & Live Runner
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Paste question, program code & expected output here to auto-fill details and verify live execution
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setImporterTab('smart-paste')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition ${
                importerTab === 'smart-paste'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Paste & Auto-Extract</span>
            </button>
            <button
              type="button"
              onClick={() => setImporterTab('interactive')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition ${
                importerTab === 'interactive'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Interactive Program Sandbox</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {parseFeedback && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{parseFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setParseFeedback(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: SMART PASTE & AUTO-EXTRACT */}
        {importerTab === 'smart-paste' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <span>Paste Full Problem, Program & Expected Output</span>
              </label>
              <button
                type="button"
                onClick={handleLoadExample}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition underline"
              >
                <span>Load Sample Problem</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={rawProblemPaste}
              onChange={(e) => setRawProblemPaste(e.target.value)}
              placeholder={`Paste the entire problem text here containing Question, Program, and Expected Output...\n\nExample:\nProblem: Find factorial of a number\n\nProgram (Python):\nimport math\nprint(math.factorial(int(input())))\n\nInput:\n5\nExpected Output:\n120`}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-400">
                ⚡ Intelligently auto-extracts Question, Title, Formats, Program Code, and Test Cases into this form.
              </p>
              <div className="flex items-center space-x-2">
                {rawProblemPaste && (
                  <button
                    type="button"
                    onClick={() => setRawProblemPaste('')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExtractFromRawPaste()}
                  disabled={!rawProblemPaste.trim()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Extract & Fill All Details</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE PROGRAM SANDBOX */}
        {importerTab === 'interactive' && (
          <div className="space-y-4">
            {/* Language Selector Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Program Lang:</span>
                {['python', 'java', 'c', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setProgramLang(lang);
                      if (starterCodes[lang]) setProgramCode(starterCodes[lang]);
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase transition ${
                      programLang === lang
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSyncToStarterCode}
                  title="Copy this program to the Starter Code Template for students"
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sync to Starter Template</span>
                </button>
              </div>
            </div>

            {/* Program Code Monaco Editor */}
            <div className="h-60 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
              <MonacoCodeEditor
                value={programCode}
                onChange={(val) => setProgramCode(val)}
                language={programLang}
                disableCopyPaste={false}
              />
            </div>

            {/* Test Input & Expected Output Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                    Test Input (Standard Input / stdin)
                  </label>
                </div>
                <textarea
                  rows={3}
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter or paste input data for the program..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                    Expected Output
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateExpectedOutput}
                    disabled={isRunning || !programCode.trim()}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Compute from Code</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={expectedOutput}
                  onChange={(e) => setExpectedOutput(e.target.value)}
                  placeholder="Enter or paste expected output string..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Runner Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRunProgram}
                  disabled={isRunning || !programCode.trim()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/25 disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing Program...' : 'Run & Verify Program'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateExpectedOutput}
                  disabled={isRunning || !programCode.trim()}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auto-Generate Output</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddAsTestCase}
                disabled={!testInput && !expectedOutput}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add as Test Case</span>
              </button>
            </div>

            {/* Live Execution Results Console */}
            {runResult && (
              <div className="rounded-lg bg-slate-950 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono uppercase text-slate-400">Execution Result:</span>
                    {runResult.isMatched === true && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>MATCHED EXPECTED OUTPUT (PASSED)</span>
                      </span>
                    )}
                    {runResult.isMatched === false && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3 h-3" />
                        <span>OUTPUT MISMATCH (WRONG ANSWER)</span>
                      </span>
                    )}
                    {runResult.status !== 'Accepted' && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <AlertCircle className="w-3 h-3" />
                        <span>{runResult.status.toUpperCase()}</span>
                      </span>
                    )}
                    {runResult.isMatched === null && runResult.status === 'Accepted' && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>EXECUTED SUCCESSFULLY</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
                    <span>⏱ {runResult.executionTime} ms</span>
                    {runResult.memoryUsed > 0 && <span>💾 {runResult.memoryUsed} KB</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1">Actual Program Output:</span>
                    <pre className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-slate-200 overflow-x-auto max-h-32 text-xs whitespace-pre-wrap">
                      {runResult.actualOutput || '<No output printed>'}
                    </pre>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1">Expected Output:</span>
                    <pre className="p-2.5 rounded bg-slate-900 border border-slate-800/80 text-slate-200 overflow-x-auto max-h-32 text-xs whitespace-pre-wrap">
                      {expectedOutput || runResult.expectedOutput || '<No expected output provided>'}
                    </pre>
                  </div>
                </div>

                {runResult.error && (
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs font-mono">
                    <span className="font-bold block mb-1">Error Details:</span>
                    {runResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
                    onPaste={(e) => handleTestCasePaste(idx, e)}
                    placeholder="Input string... (Tip: paste 'Input: X Output: Y' here)"
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
