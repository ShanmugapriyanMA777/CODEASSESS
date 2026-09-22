import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Assessment, Question } from '../../types';
import { MonacoCodeEditor } from '../../components/editor/MonacoCodeEditor';
import {
  Clock,
  Play,
  Send,
  ShieldAlert,
  Maximize2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCode,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
} from 'lucide-react';

export const AssessmentTake: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Code state per question { [questionId]: { code: string, language: string } }
  const [codeDrafts, setCodeDrafts] = useState<Record<string, { code: string; language: string }>>({});
  const [currentLanguage, setCurrentLanguage] = useState<string>('python');
  const [currentCode, setCurrentCode] = useState<string>('');

  // Execution & Test State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sampleResults, setSampleResults] = useState<any[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'sample' | 'custom'>('sample');
  const [customInput, setCustomInput] = useState<string>('');
  const [submissionFeedback, setSubmissionFeedback] = useState<any | null>(null);

  // Solved status per questionId: 'UNATTEMPTED' | 'ACCEPTED' | 'PARTIAL' | 'FAILED'
  const [questionStatuses, setQuestionStatuses] = useState<Record<string, string>>({});

  // Timer & Anti-Cheating
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  const [suspiciousCount, setSuspiciousCount] = useState<number>(0);
  const [fullscreenAlert, setFullscreenAlert] = useState<boolean>(false);
  const [finishModalOpen, setFinishModalOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'problem' | 'code'>('problem');

  const timerRef = useRef<any>(null);
  const autoSaveRef = useRef<any>(null);

  // Load Assessment & Attempt Details
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/${id}`);
        if (res.data.success) {
          const ass: Assessment = res.data.data;
          setAssessment(ass);

          // Setup timer from backend validation
          if (ass.currentAttempt) {
            setSecondsRemaining(ass.currentAttempt.remainingSeconds);
            setSuspiciousCount(ass.currentAttempt.suspiciousEventsCount || 0);

            // Restore drafts
            try {
              const parsed = JSON.parse(ass.currentAttempt.currentCodeDraftsJson || '{}');
              setCodeDrafts(parsed);
            } catch (e) {
              // ignore
            }
          } else {
            setSecondsRemaining(ass.duration * 60);
          }
        }
      } catch (err) {
        console.error('Failed to load assessment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id]);

  // Current Question
  const questions = assessment?.questions || [];
  const currentAq = questions[currentQuestionIndex];
  const currentQuestion = currentAq?.question;

  // Sync editor with current question's code draft or starter code
  useEffect(() => {
    if (!currentQuestion) return;

    const existingDraft = codeDrafts[currentQuestion.id];
    if (existingDraft && existingDraft.code) {
      setCurrentCode(existingDraft.code);
      setCurrentLanguage(existingDraft.language || 'python');
    } else {
      // Load starter code
      try {
        const starter = JSON.parse(currentQuestion.starterCode || '{}');
        const lang = currentLanguage || 'python';
        setCurrentCode(starter[lang] || starter.python || '// Write your implementation here');
      } catch (e) {
        setCurrentCode('// Write your implementation here');
      }
    }
    // Reset test case execution view when changing questions
    setSampleResults([]);
    setSubmissionFeedback(null);
  }, [currentQuestionIndex, currentQuestion?.id]);

  // Handle timer countdown
  useEffect(() => {
    if (loading || !assessment) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinishAssessment(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, assessment]);

  // Periodic Auto-Save Draft
  useEffect(() => {
    if (!assessment || !currentQuestion) return;

    autoSaveRef.current = setInterval(async () => {
      if (!currentCode) return;
      try {
        await api.post('/submissions/autosave', {
          assessmentId: assessment.id,
          questionId: currentQuestion.id,
          code: currentCode,
          language: currentLanguage,
        });
        setLastSaved('Just now');
      } catch (err) {
        // quiet fail on draft auto-save
      }
    }, 8000);

    return () => clearInterval(autoSaveRef.current);
  }, [assessment?.id, currentQuestion?.id, currentCode, currentLanguage]);

  // Anti-Cheating: Fullscreen, Tab Switch & Window Blur Listeners
  useEffect(() => {
    if (!assessment) return;

    const handleVisibilityChange = () => {
      if (document.hidden && assessment.trackTabSwitches) {
        recordSuspiciousActivity('TAB_SWITCH', { timestamp: new Date().toISOString() });
      }
    };

    const handleWindowBlur = () => {
      if (assessment.trackTabSwitches) {
        recordSuspiciousActivity('WINDOW_BLUR', { timestamp: new Date().toISOString() });
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && assessment.enforceFullscreen) {
        setFullscreenAlert(true);
        recordSuspiciousActivity('FULLSCREEN_EXIT', { timestamp: new Date().toISOString() });
      } else {
        setFullscreenAlert(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [assessment]);

  const recordSuspiciousActivity = async (eventType: string, metadata: any) => {
    if (!assessment) return;
    setSuspiciousCount((prev) => prev + 1);
    try {
      await api.post('/submissions/suspicious-event', {
        assessmentId: assessment.id,
        eventType,
        metadata,
      });
    } catch (e) {
      // ignore
    }
  };

  const handlePasteBlocked = () => {
    recordSuspiciousActivity('PASTE_ATTEMPT', {
      questionId: currentQuestion?.id,
      timestamp: new Date().toISOString(),
    });
  };

  const requestFullscreenMode = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    if (!currentQuestion) return;
    try {
      const starter = JSON.parse(currentQuestion.starterCode || '{}');
      if (starter[lang]) {
        setCurrentCode(starter[lang]);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleResetCode = () => {
    if (!currentQuestion) return;
    if (window.confirm('Reset code to starter template? Your unsaved edits will be discarded.')) {
      try {
        const starter = JSON.parse(currentQuestion.starterCode || '{}');
        setCurrentCode(starter[currentLanguage] || '');
      } catch (e) {
        setCurrentCode('');
      }
    }
  };

  // Run Code against Sample Test Cases
  const handleRunCode = async () => {
    if (!currentQuestion) return;
    setIsRunning(true);
    setSubmissionFeedback(null);

    try {
      const payload: any = {
        questionId: currentQuestion.id,
        language: currentLanguage,
        sourceCode: currentCode,
      };

      if (activeConsoleTab === 'custom' && customInput.trim()) {
        payload.customInput = customInput;
      }

      const res = await api.post('/submissions/run', payload);
      if (res.data.success) {
        setSampleResults(res.data.data.results);
      }
    } catch (err: any) {
      setSampleResults([
        {
          testCaseId: 'err',
          status: 'ERROR',
          actualOutput: err.response?.data?.message || 'Execution error',
          executionTime: 0,
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against Hidden Test Cases
  const handleSubmitCode = async () => {
    if (!currentQuestion || !assessment) return;
    setIsSubmitting(true);

    try {
      const res = await api.post('/submissions/submit', {
        assessmentId: assessment.id,
        questionId: currentQuestion.id,
        language: currentLanguage,
        sourceCode: currentCode,
      });

      if (res.data.success) {
        const result = res.data.data;
        setSubmissionFeedback(result);
        setQuestionStatuses((prev) => ({
          ...prev,
          [currentQuestion.id]: result.status,
        }));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finish Assessment
  const handleFinishAssessment = async (autoSubmitted = false) => {
    if (!assessment) return;
    try {
      const res = await api.post('/results/finish', {
        assessmentId: assessment.id,
        autoSubmitted,
      });

      if (res.data.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        navigate(`/student/assessment/${assessment.id}/result`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete assessment');
    }
  };

  // Format countdown string HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm">
        Assessment not found or not published.
      </div>
    );
  }

  const solvedCount = Object.values(questionStatuses).filter((s) => s === 'ACCEPTED').length;

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* FULLSCREEN PROMPTER OVERLAY IF EXITED */}
      {fullscreenAlert && assessment.enforceFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400 mb-4 animate-bounce">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Fullscreen Mode Required</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            This coding assessment is strictly proctored. Exiting fullscreen or navigating to other windows is logged as a potential anti-cheating violation.
          </p>
          <button
            onClick={requestFullscreenMode}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/30 transition"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Re-enter Fullscreen Mode</span>
          </button>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs md:max-w-md">
              {assessment.title}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 pl-3 border-l border-slate-800">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">{solvedCount} Solved</span>
          </div>
        </div>

        {/* Center: Live Synchronized Countdown Timer */}
        <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border font-mono text-[11px] sm:text-xs font-bold ${
          secondsRemaining < 300
            ? 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
            : secondsRemaining < 600
            ? 'bg-amber-950/80 text-amber-300 border-amber-800'
            : 'bg-slate-950 text-amber-400 border-amber-500/30'
        }`}>
          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Right side: Suspicious count, Auto-save indicator, Finish exam */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {suspiciousCount > 0 && (
            <div className="hidden md:flex items-center space-x-1 px-2 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[10px] font-semibold" title="Anti-cheating flags">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>{suspiciousCount} Violation{suspiciousCount > 1 ? 's' : ''}</span>
            </div>
          )}

          <span className="hidden lg:inline text-[11px] text-slate-500">
            Auto-saved: {lastSaved}
          </span>

          <button
            onClick={() => setFinishModalOpen(true)}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20 whitespace-nowrap cursor-pointer"
          >
            <span className="hidden sm:inline">Finish Assessment</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>
      </header>

      {/* MOBILE WORKSPACE TAB SELECTOR (< lg only) */}
      <div className="lg:hidden flex border-b border-slate-800 bg-slate-900 px-3 py-1.5 gap-2 flex-shrink-0 z-10">
        <button
          type="button"
          onClick={() => setMobileTab('problem')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'problem'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Problem Q{currentQuestionIndex + 1}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('code')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            mobileTab === 'code'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-300 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Code & Console</span>
        </button>
      </div>

      {/* MAIN WORKSPACE BODY (Split Panel) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Problem Details, Specifications, Sample Test Cases */}
        <div className={`w-full lg:w-5/12 bg-slate-900 border-r border-slate-800 flex-col h-full overflow-y-auto ${
          mobileTab === 'problem' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Question Meta Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {currentQuestion?.category || 'General'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  currentQuestion?.difficulty === 'Easy'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : currentQuestion?.difficulty === 'Medium'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                    : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                }`}>
                  {currentQuestion?.difficulty}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-300">
                {currentAq?.marks || currentQuestion?.marks} Marks
              </span>
            </div>

            <h2 className="text-base font-bold text-white tracking-tight">
              {currentQuestionIndex + 1}. {currentQuestion?.title}
            </h2>
          </div>

          {/* Problem Statement Details */}
          <div className="p-5 space-y-5 text-xs text-slate-300 leading-relaxed overflow-y-auto">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </h3>
              <p className="whitespace-pre-line text-slate-200">
                {currentQuestion?.description}
              </p>
            </div>

            {currentQuestion?.inputFormat && (
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-slate-400 mb-1.5">
                  Input Format
                </h3>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 whitespace-pre-line">
                  {currentQuestion.inputFormat}
                </div>
              </div>
            )}

            {currentQuestion?.outputFormat && (
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-slate-400 mb-1.5">
                  Output Format
                </h3>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 whitespace-pre-line">
                  {currentQuestion.outputFormat}
                </div>
              </div>
            )}

            {currentQuestion?.constraints && (
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-slate-400 mb-1.5">
                  Constraints
                </h3>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-slate-300 whitespace-pre-line">
                  {currentQuestion.constraints}
                </div>
              </div>
            )}

            {/* Sample Test Cases */}
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider text-slate-400 mb-2">
                Sample Test Cases
              </h3>
              <div className="space-y-3">
                {currentQuestion?.testCases?.map((tc, idx) => (
                  <div key={tc.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-slate-400 font-semibold mb-2">
                      <span>Sample Case {idx + 1}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Input</span>
                        <pre className="bg-slate-900 p-2 rounded border border-slate-800/80 overflow-x-auto text-slate-200">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Expected Output</span>
                        <pre className="bg-slate-900 p-2 rounded border border-slate-800/80 overflow-x-auto text-emerald-400">
                          {tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Question Palette Footer in Left Panel */}
          <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 overflow-x-auto py-1">
              {questions.map((q, idx) => {
                const status = questionStatuses[q.questionId];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-7 h-7 rounded-md text-xs font-bold transition flex items-center justify-center ${
                      idx === currentQuestionIndex
                        ? 'ring-2 ring-amber-400 bg-amber-500 text-slate-950 font-extrabold shadow-sm shadow-amber-500/30'
                        : status === 'ACCEPTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : status === 'PARTIAL'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-1 pl-2">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentQuestionIndex === questions.length - 1}
                onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Monaco Editor + Test Execution Output Console */}
        <div className={`w-full lg:w-7/12 flex-col h-full bg-slate-950 ${
          mobileTab === 'code' ? 'flex' : 'hidden lg:flex'
        }`}>
          {/* Code Editor Region */}
          <div className="flex-1 min-h-[300px] relative">
            <MonacoCodeEditor
              value={currentCode}
              onChange={setCurrentCode}
              language={currentLanguage}
              onLanguageChange={handleLanguageChange}
              onReset={handleResetCode}
              disableCopyPaste={assessment.disableCopyPaste}
              onPasteBlocked={handlePasteBlocked}
            />
          </div>

          {/* Test Runner & Evaluation Console Region */}
          <div className="h-64 border-t border-slate-800 bg-slate-900/95 flex flex-col flex-shrink-0">
            {/* Console Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-800 bg-slate-950 text-xs">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('sample')}
                  className={`px-2.5 sm:px-3 py-1 rounded text-xs font-semibold transition ${
                    activeConsoleTab === 'sample'
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Test Results
                </button>
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('custom')}
                  className={`px-2.5 sm:px-3 py-1 rounded text-xs font-semibold transition ${
                    activeConsoleTab === 'custom'
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="hidden sm:inline">Custom Test Input</span>
                  <span className="sm:hidden">Custom</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <button
                  type="button"
                  disabled={isRunning || isSubmitting}
                  onClick={handleRunCode}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>{isRunning ? 'Compiling...' : 'Run Code'}</span>
                </button>

                <button
                  type="button"
                  disabled={isRunning || isSubmitting}
                  onClick={handleSubmitCode}
                  className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/25 transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit Code'}</span>
                </button>
              </div>
            </div>

            {/* Console Output Viewer */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
              {activeConsoleTab === 'custom' ? (
                <div className="h-full flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase mb-1">Enter custom standard input data:</span>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Provide sample input here and click 'Run Code'..."
                    className="w-full flex-1 bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-mono"
                  />
                </div>
              ) : submissionFeedback ? (
                // Evaluation Feedback against hidden test cases
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      {submissionFeedback.status === 'ACCEPTED' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      )}
                      <div>
                        <span className="text-sm font-bold text-white">
                          {submissionFeedback.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Passed {submissionFeedback.testCasesPassed} of {submissionFeedback.totalTestCases} test cases
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold text-emerald-400">
                        {submissionFeedback.marksObtained} / {submissionFeedback.totalMarks}
                      </span>
                      <span className="text-[11px] text-slate-400 block">Marks Earned</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {submissionFeedback.testCaseResults?.map((tcr: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border text-[11px] flex items-center justify-between ${
                          tcr.status === 'PASSED'
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                        }`}
                      >
                        <span>Test Case {idx + 1} {tcr.isHidden && '(Hidden)'}</span>
                        {tcr.status === 'PASSED' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      </div>
                    ))}
                  </div>
                </div>
              ) : sampleResults.length > 0 ? (
                // Sample Test Case Results
                <div className="space-y-3">
                  {sampleResults.map((res, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
                        <span className="flex items-center space-x-1.5">
                          {res.status === 'PASSED' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span>Case {idx + 1}: {res.status}</span>
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">{res.executionTime}ms</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Input</span>
                          <pre className="p-1.5 bg-slate-900 rounded text-slate-300 overflow-x-auto">{res.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Actual Output</span>
                          <pre className={`p-1.5 bg-slate-900 rounded overflow-x-auto ${res.status === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {res.actualOutput || '(no output)'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Click 'Run Code' to test against sample test cases or 'Submit Code' for evaluation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINISH ASSESSMENT CONFIRMATION MODAL */}
      {finishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Finalize & Submit Assessment?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have currently solved <span className="text-emerald-400 font-bold">{solvedCount}</span> of <span className="text-white font-bold">{questions.length}</span> questions.
              Once submitted, you will receive your final evaluation marks, ranking, and performance scorecard.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setFinishModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Continue Assessment
              </button>
              <button
                type="button"
                onClick={() => handleFinishAssessment(false)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/25"
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
