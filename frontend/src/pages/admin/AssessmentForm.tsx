import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Question, Batch } from '../../types';
import { Plus, Trash2, Save, ArrowLeft, ShieldAlert, CheckSquare } from 'lucide-react';

export const AssessmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('1. Monaco editor provided for Python, Java, C, C++.\n2. Do NOT switch tabs or exit fullscreen.\n3. External copy-pasting is strictly prohibited.');
  const [duration, setDuration] = useState(60);
  const [passingMarks, setPassingMarks] = useState(40);
  const [allowedLanguages, setAllowedLanguages] = useState('python,java,c,cpp');
  const [isPublished, setIsPublished] = useState(true);

  // Anti-cheating proctoring flags
  const [disableCopyPaste, setDisableCopyPaste] = useState(true);
  const [enforceFullscreen, setEnforceFullscreen] = useState(true);
  const [trackTabSwitches, setTrackTabSwitches] = useState(true);

  // Available pools
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);

  // Selected questions: array of { questionId, order, marks }
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  // Selected batch IDs
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [qRes, bRes] = await Promise.all([
          api.get('/questions?limit=100'),
          api.get('/batches'),
        ]);

        if (qRes.data.success) setAvailableQuestions(qRes.data.data.questions);
        if (bRes.data.success) setAvailableBatches(bRes.data.data);

        if (isEditing) {
          const assRes = await api.get(`/assessments/${id}`);
          if (assRes.data.success) {
            const ass = assRes.data.data;
            setTitle(ass.title);
            setDescription(ass.description);
            setInstructions(ass.instructions || '');
            setDuration(ass.duration);
            setPassingMarks(ass.passingMarks);
            setAllowedLanguages(ass.allowedLanguages || 'python,java,c,cpp');
            setIsPublished(ass.isPublished);
            setDisableCopyPaste(ass.disableCopyPaste);
            setEnforceFullscreen(ass.enforceFullscreen);
            setTrackTabSwitches(ass.trackTabSwitches);

            if (ass.questions) {
              setSelectedQuestions(
                ass.questions.map((aq: any) => ({
                  questionId: aq.questionId,
                  order: aq.order,
                  marks: aq.marks,
                }))
              );
            }

            if (ass.assignments) {
              const bIds = ass.assignments
                .map((a: any) => a.batchId)
                .filter(Boolean);
              setSelectedBatchIds(bIds);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load assessment data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrerequisites();
  }, [id, isEditing]);

  const addQuestionToAssessment = (questionId: string) => {
    if (selectedQuestions.some((q) => q.questionId === questionId)) return;
    const q = availableQuestions.find((item) => item.id === questionId);
    setSelectedQuestions((prev) => [
      ...prev,
      {
        questionId,
        order: prev.length,
        marks: q?.marks || 10,
      },
    ]);
  };

  const removeQuestionFromAssessment = (questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.questionId !== questionId));
  };

  const toggleBatchAssignment = (batchId: string) => {
    setSelectedBatchIds((prev) =>
      prev.includes(batchId) ? prev.filter((b) => b !== batchId) : [...prev, batchId]
    );
  };

  const totalCalculatedMarks = selectedQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestions.length === 0) {
      alert('Please add at least one question to the assessment.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        instructions,
        duration,
        totalMarks: totalCalculatedMarks,
        passingMarks,
        allowedLanguages,
        disableCopyPaste,
        enforceFullscreen,
        trackTabSwitches,
        isPublished,
        questions: selectedQuestions,
        batchIds: selectedBatchIds,
      };

      if (isEditing) {
        await api.put(`/assessments/${id}`, payload);
      } else {
        await api.post('/assessments', payload);
      }

      navigate('/admin/assessments');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save assessment');
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
            onClick={() => navigate('/admin/assessments')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? 'Edit Assessment' : 'Create New Assessment'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Set exam parameters, attach coding questions, and configure anti-cheating controls
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Assessment'}</span>
        </button>
      </div>

      {/* Main Parameters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
          General Exam Configuration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assessment Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Structures Mid-Term Exam"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min="5"
              max="360"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of assessment topics..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions for Candidate</label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Rules, disallowed behaviors..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Total Marks (Calculated)</label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold">
              {totalCalculatedMarks} Marks
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Passing Marks</label>
            <input
              type="number"
              min="1"
              value={passingMarks}
              onChange={(e) => setPassingMarks(parseInt(e.target.value, 10) || 40)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-slate-200">Publish Immediately</span>
            </label>
          </div>
        </div>
      </div>

      {/* Anti-Cheating Controls (Section 14 & User Prompt Requirement) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-amber-400">
          <ShieldAlert className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Proctoring & Anti-Cheating Controls
          </h2>
        </div>
        <p className="text-[11px] text-slate-400">
          Enforce browser restrictions, clipboard blocking, and log integrity violations to proctoring records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={disableCopyPaste}
              onChange={(e) => setDisableCopyPaste(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-white block">Disable Code Copy-Paste</span>
              <span className="text-[10px] text-slate-400">Blocks clipboard pasting into Monaco Editor and records violations</span>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={enforceFullscreen}
              onChange={(e) => setEnforceFullscreen(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-white block">Enforce Fullscreen Mode</span>
              <span className="text-[10px] text-slate-400">Mandates full window size and prompts candidate if exited</span>
            </div>
          </label>

          <label className="flex items-start space-x-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={trackTabSwitches}
              onChange={(e) => setTrackTabSwitches(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-white block">Track Tab Switching & Blur</span>
              <span className="text-[10px] text-slate-400">Logs window blur, tab switching, and developer tool attempts</span>
            </div>
          </label>
        </div>
      </div>

      {/* Attach Questions to Assessment */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Assigned Coding Questions ({selectedQuestions.length})
            </h2>
            <p className="text-[11px] text-slate-500">Pick from your Question Bank and set customized marks</p>
          </div>

          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                addQuestionToAssessment(e.target.value);
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white border-none rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <option value="" disabled>+ Add Question from Bank</option>
            {availableQuestions.map((q) => (
              <option key={q.id} value={q.id} className="text-slate-900 bg-white">
                {q.title} ({q.difficulty}, {q.marks}m)
              </option>
            ))}
          </select>
        </div>

        {selectedQuestions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
            No questions attached. Use the dropdown above to add problems.
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedQuestions.map((sq, idx) => {
              const qDetails = availableQuestions.find((q) => q.id === sq.questionId);
              return (
                <div
                  key={sq.questionId}
                  className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white">{qDetails?.title || 'Question'}</span>
                      <span className="text-slate-500 text-[11px] ml-2">({qDetails?.category}, {qDetails?.difficulty})</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Marks:</span>
                      <input
                        type="number"
                        value={sq.marks}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setSelectedQuestions((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, marks: val } : item))
                          );
                        }}
                        className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 text-center font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuestionFromAssessment(sq.questionId)}
                      className="p-1 rounded hover:bg-rose-950/40 text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cohort & Batch Assignment */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
          Assign to Academic Batches
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableBatches.map((b) => (
            <label
              key={b.id}
              className={`p-3 rounded-lg border text-xs flex items-center space-x-2.5 cursor-pointer transition ${
                selectedBatchIds.includes(b.id)
                  ? 'bg-indigo-950/40 border-indigo-600 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedBatchIds.includes(b.id)}
                onChange={() => toggleBatchAssignment(b.id)}
                className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-bold block text-slate-200">{b.name}</span>
                <span className="text-[10px] text-slate-500">{b.code}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
};
