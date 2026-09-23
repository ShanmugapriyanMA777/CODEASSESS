import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Assessment, Batch } from '../../types';
import {
  FileText,
  Download,
  CheckCircle2,
  Printer,
  Layers,
  Filter,
  Sliders,
  Building2,
  RefreshCw,
  UserCheck,
  Award,
  Trophy,
  Target,
  Shield,
  Clock,
  CheckSquare,
} from 'lucide-react';

export const ReportGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statement' | 'individual'>('statement');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Selection states for Class Statement
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [completedOnly, setCompletedOnly] = useState<boolean>(true);

  // Statement Report Data & Loading
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  // Template Customization Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [institutionName, setInstitutionName] = useState('AGNI COLLEGE OF TECHNOLOGY');
  const [subHeader, setSubHeader] = useState('(An Autonomous Institution, Affiliated to Anna University, Chennai.)');
  const [accreditation, setAccreditation] = useState("Approved by AICTE, Accredited by NAAC with 'A+' Grade");
  const [location, setLocation] = useState('OMR, Navalur, Thalambur, Chennai.-600130');
  const [statementTitle, setStatementTitle] = useState('ASSESSMENT REPORT');
  const [programme, setProgramme] = useState('B.E. COMPUTER SCIENCE AND ENGINEERING');
  const [batchSec, setBatchSec] = useState('2024 / C');
  const [facultyName, setFacultyName] = useState('Mrs. VARSHA');
  const [subjectName, setSubjectName] = useState('COMPUTER NETWORKS');
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
  );
  const [conducted, setConducted] = useState('2 Hours');

  // Individual student report state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentAssessmentId, setSelectedStudentAssessmentId] = useState('');
  const [studentReportData, setStudentReportData] = useState<any | null>(null);
  const [loadingStudentData, setLoadingStudentData] = useState(false);
  const [downloadingStudentPdf, setDownloadingStudentPdf] = useState(false);

  // Load initial dropdown options
  useEffect(() => {
    const loadInitialOptions = async () => {
      try {
        const [batchesRes, assRes, studentsRes] = await Promise.all([
          api.get('/batches'),
          api.get('/assessments'),
          api.get('/students?limit=100'),
        ]);

        if (batchesRes.data.success) {
          setBatches(batchesRes.data.data);
          if (batchesRes.data.data.length > 0) {
            setSelectedBatchId(batchesRes.data.data[0].id);
            setBatchSec(`${batchesRes.data.data[0].academicYear || '2024'} / ${batchesRes.data.data[0].code}`);
          }
        }

        if (assRes.data.success) {
          setAssessments(assRes.data.data);
          if (assRes.data.data.length > 0) {
            setSelectedAssessmentId(assRes.data.data[0].id);
            setSubjectName(assRes.data.data[0].title.toUpperCase());
          }
        }

        if (studentsRes.data.success) {
          setStudents(studentsRes.data.data.students);
          if (studentsRes.data.data.students.length > 0) {
            setSelectedStudentId(studentsRes.data.data.students[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load batches/assessments:', err);
      }
    };

    loadInitialOptions();
  }, []);

  // Sync batch/assessment selection into template headers
  useEffect(() => {
    if (selectedBatchId && selectedBatchId !== 'ALL') {
      const found = batches.find((b) => b.id === selectedBatchId);
      if (found) {
        setBatchSec(`${found.academicYear || '2024'} / ${found.code}`);
        setProgramme(`B.E. ${found.name.toUpperCase()}`);
      }
    } else {
      setBatchSec('2024 / C');
      setProgramme('B.E. COMPUTER SCIENCE AND ENGINEERING');
    }
  }, [selectedBatchId, batches]);

  useEffect(() => {
    if (selectedAssessmentId) {
      const found = assessments.find((a) => a.id === selectedAssessmentId);
      if (found) {
        setSubjectName(found.title.toUpperCase());
      }
    }
  }, [selectedAssessmentId, assessments]);

  // Fetch statement data when filters change
  const fetchStatementData = async () => {
    setLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.append('batchId', selectedBatchId);
      if (selectedAssessmentId) params.append('assessmentId', selectedAssessmentId);
      params.append('completedOnly', completedOnly.toString());
      params.append('institutionName', institutionName);
      params.append('subHeader', subHeader);
      params.append('accreditation', accreditation);
      params.append('location', location);
      params.append('statementTitle', statementTitle);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('assessmentDate', assessmentDate);
      params.append('conducted', conducted);

      const res = await api.get(`/reports/class-statement?${params.toString()}`);
      if (res.data.success) {
        setStatementData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch class statement data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchStatementData();
  }, [selectedBatchId, selectedAssessmentId, completedOnly]);

  // Fetch individual student preview data
  const fetchStudentPreview = async (studentId: string, assessmentId?: string) => {
    if (!studentId) return;
    setLoadingStudentData(true);
    try {
      const params = new URLSearchParams();
      if (assessmentId) params.append('assessmentId', assessmentId);
      const res = await api.get(`/reports/student/${studentId}/preview?${params.toString()}`);
      if (res.data.success) {
        setStudentReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student preview:', err);
    } finally {
      setLoadingStudentData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'individual' && selectedStudentId) {
      fetchStudentPreview(selectedStudentId, selectedStudentAssessmentId);
    }
  }, [activeTab, selectedStudentId, selectedStudentAssessmentId]);

  // Download Class Statement CSV
  const handleDownloadCsv = async () => {
    setDownloadingCsv(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.append('batchId', selectedBatchId);
      if (selectedAssessmentId) params.append('assessmentId', selectedAssessmentId);
      params.append('completedOnly', completedOnly.toString());
      params.append('institutionName', institutionName);
      params.append('subHeader', subHeader);
      params.append('accreditation', accreditation);
      params.append('location', location);
      params.append('statementTitle', statementTitle);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('assessmentDate', assessmentDate);
      params.append('conducted', conducted);

      const res = await api.get(`/reports/class-statement/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const batchNameSafe = (statementData?.metadata?.batchName || 'Overall').replace(/\s+/g, '_');
      link.setAttribute('download', `assessment_report_${batchNameSafe}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download CSV report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Download Class Statement PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const params = new URLSearchParams();
      if (selectedBatchId) params.append('batchId', selectedBatchId);
      if (selectedAssessmentId) params.append('assessmentId', selectedAssessmentId);
      params.append('completedOnly', completedOnly.toString());
      params.append('institutionName', institutionName);
      params.append('subHeader', subHeader);
      params.append('accreditation', accreditation);
      params.append('location', location);
      params.append('statementTitle', statementTitle);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('assessmentDate', assessmentDate);
      params.append('conducted', conducted);

      const res = await api.get(`/reports/class-statement/pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const batchNameSafe = (statementData?.metadata?.batchName || 'Overall').replace(/\s+/g, '_');
      link.setAttribute('download', `assessment_report_${batchNameSafe}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Download Individual Student Report PDF
  const handleDownloadStudentPdf = async () => {
    if (!selectedStudentId) return;
    setDownloadingStudentPdf(true);
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const params = new URLSearchParams();
      if (selectedStudentAssessmentId) params.append('assessmentId', selectedStudentAssessmentId);
      const res = await api.get(`/reports/student/${selectedStudentId}?${params.toString()}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = student?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'student';
      link.setAttribute('download', `student_performance_report_${safeName}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate student PDF report');
    } finally {
      setDownloadingStudentPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const records = statementData?.records || [];
  const meta = statementData?.metadata || {};

  // Build rows padded up to at least 15 rows to match the official 15-row form
  const rowsOnPage1 = Math.max(15, records.length);
  const displayRows = [];
  for (let i = 0; i < rowsOnPage1; i++) {
    if (i < records.length) {
      displayRows.push(records[i]);
    } else {
      displayRows.push({
        sNo: i + 1,
        registerNumber: '',
        studentName: '',
        testMarks: '',
        passFail: '',
        attendedHours: '',
        isEmpty: true,
      });
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Official Academic Reports
            </span>
            <span className="text-slate-500 text-xs">Agni College of Technology Standard</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Institutional Assessment Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official Class Mark Statements and Individual Student Transcripts matching accredited institutional formats
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('statement')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'statement'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Class Assessment Report</span>
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'individual'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Individual Student Report</span>
          </button>
        </div>
      </div>

      {activeTab === 'statement' ? (
        /* TAB 1: CLASS STATEMENT REPORT */
        <div className="space-y-6">
          {/* Controls Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Class / Batch Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Class / Batch</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                >
                  <option value="ALL">All Enrolled Classes / Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) — {b.academicYear}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Choose Assessment</span>
                </label>
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.duration} mins - {a.totalMarks} Marks)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400" />
                  <span>Student Filter</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompletedOnly(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                      completedOnly
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompletedOnly(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                      !completedOnly
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>All Students</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Bar & Template Settings Toggle */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-amber-400 font-medium transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showSettings ? 'Hide Template Metadata' : 'Edit Report Metadata'}</span>
                </button>
                <button
                  type="button"
                  onClick={fetchStatementData}
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white font-medium transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadCsv}
                  disabled={downloadingCsv}
                  className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span>{downloadingCsv ? 'Compiling CSV...' : 'Download CSV Report'}</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Template Header Customization Dropdown */}
            {showSettings && (
              <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 text-xs text-slate-300">
                <div className="font-bold text-amber-400 mb-1 flex items-center space-x-2">
                  <span>Template Heading Attributes (Agni College of Technology Standard)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Programme</label>
                    <input
                      type="text"
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Batch / Sec.</label>
                    <input
                      type="text"
                      value={batchSec}
                      onChange={(e) => setBatchSec(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Name of the Faculty</label>
                    <input
                      type="text"
                      value={facultyName}
                      onChange={(e) => setFacultyName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Subject Name</label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Assessment Date</label>
                    <input
                      type="text"
                      value={assessmentDate}
                      onChange={(e) => setAssessmentDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Conducted Duration</label>
                    <input
                      type="text"
                      value={conducted}
                      onChange={(e) => setConducted(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={fetchStatementData}
                    className="py-1.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Apply & Update Preview
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Students</span>
                <span className="text-2xl font-black text-white">{meta.totalEnrolled || 0}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                {meta.totalEnrolled || 0}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Completed</span>
                <span className="text-2xl font-black text-emerald-400">{meta.totalCompleted || 0}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Absent / Pending</span>
                <span className="text-2xl font-black text-amber-400">{meta.totalAbsent || 0}</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                AB
              </div>
            </div>
          </div>

          {/* DOCUMENT PREVIEW CONTAINER (Matching the 2-page PDF Scan Template) */}
          <div className="bg-white text-slate-950 rounded-2xl shadow-2xl p-4 sm:p-8 lg:p-10 border border-slate-200 overflow-x-auto print:p-0 print:shadow-none print:border-none">
            {loadingData ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold mt-3">Compiling mark statement data...</p>
              </div>
            ) : (
              <div className="min-w-[650px] max-w-[800px] mx-auto">
                {/* Official Agni Logo Banner */}
                <div className="flex justify-center mb-4">
                  <img
                    src="/agni_logo.png"
                    alt="Agni College of Technology"
                    className="w-full max-h-20 object-contain mx-auto"
                  />
                </div>

                {/* Document Title */}
                <div className="text-center mb-4 font-serif">
                  <div className="h-0.5 bg-black w-full mb-3" />
                  <h3 className="text-base font-bold uppercase tracking-widest text-black">
                    ASSESSMENT REPORT
                  </h3>
                </div>

                {/* 2-Column x 3-Row Bordered Metadata Table */}
                <div className="border border-black mb-4 font-serif text-xs">
                  <div className="grid grid-cols-2 border-b border-black">
                    <div className="py-1.5 px-3 border-r border-black flex items-center">
                      <span className="font-bold w-40 text-black">PROGRAMME :</span>
                      <span className="font-normal text-black uppercase">{programme}</span>
                    </div>
                    <div className="py-1.5 px-3 flex items-center">
                      <span className="font-bold w-36 text-black">BATCH / SEC. :</span>
                      <span className="font-normal text-black uppercase">{batchSec}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-black">
                    <div className="py-1.5 px-3 border-r border-black flex items-center">
                      <span className="font-bold w-40 text-black">Name of the Faculty :</span>
                      <span className="font-normal text-black">{facultyName}</span>
                    </div>
                    <div className="py-1.5 px-3 flex items-center">
                      <span className="font-bold w-36 text-black">Subject Name :</span>
                      <span className="font-normal text-black uppercase">{subjectName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="py-1.5 px-3 border-r border-black flex items-center">
                      <span className="font-bold w-40 text-black">ASSESSMENT DATE :</span>
                      <span className="font-normal text-black">{assessmentDate}</span>
                    </div>
                    <div className="py-1.5 px-3 flex items-center">
                      <span className="font-bold w-36 text-black">Conducted :</span>
                      <span className="font-normal text-black">{conducted}</span>
                    </div>
                  </div>
                </div>

                {/* Main Student Mark Table with the 6 Exact Columns:
                    1. S.NO
                    2. REGISTER NUMBER
                    3. NAME OF THE STUDENT
                    4. TEST MARKS
                    5. PASS/FAIL
                    6. ATTENDED HOURS */}
                <div className="border border-black">
                  <table className="w-full text-xs font-serif border-collapse">
                    <thead>
                      <tr className="border-b border-black text-black">
                        <th className="py-2 px-2 text-center border-r border-black font-bold w-12">
                          S.NO
                        </th>
                        <th className="py-2 px-3 text-center border-r border-black font-bold w-36">
                          REGISTER NUMBER
                        </th>
                        <th className="py-2 px-3 text-center border-r border-black font-bold">
                          NAME OF THE STUDENT
                        </th>
                        <th className="py-2 px-3 text-center border-r border-black font-bold w-24">
                          TEST MARKS
                        </th>
                        <th className="py-2 px-3 text-center border-r border-black font-bold w-24">
                          PASS/FAIL
                        </th>
                        <th className="py-1.5 px-2 text-center font-bold w-24 leading-tight">
                          ATTENDED<br />HOURS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row: any) => {
                        const isAb = row.testMarks === 'AB' || row.testMarks === '-';
                        return (
                          <tr
                            key={row.sNo}
                            className="border-b border-black last:border-b-0 h-7"
                          >
                            <td className="py-1 px-2 text-center border-r border-black font-normal">
                              {row.sNo}
                            </td>
                            <td className="py-1 px-3 text-center border-r border-black font-mono font-medium tracking-tight">
                              {row.registerNumber}
                            </td>
                            <td className="py-1 px-3 text-left border-r border-black font-medium text-black uppercase">
                              {row.studentName}
                            </td>
                            <td
                              className={`py-1 px-3 text-center border-r border-black font-bold ${
                                isAb ? 'text-red-700' : 'text-black'
                              }`}
                            >
                              {row.testMarks}
                            </td>
                            <td className="py-1 px-3 text-center border-r border-black font-bold">
                              {row.passFail}
                            </td>
                            <td className="py-1 px-2 text-center font-normal">
                              {row.attendedHours}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Signature Block matching template */}
                <div className="mt-20 pt-8 flex items-end justify-between font-serif text-xs text-black px-6">
                  <div className="text-center space-y-1.5">
                    <div className="w-52 border-b border-black mb-1 mx-auto" />
                    <p className="font-normal">Name of the Faculty</p>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="w-52 border-b border-black mb-1 mx-auto" />
                    <p className="font-normal">Signature of the HoD.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 2: INDIVIDUAL CANDIDATE ACADEMIC TRANSCRIPT (Matching Image 2 Template) */
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Student Candidate</span>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.studentProfile?.rollNumber || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Filter by Assessment (Optional)</span>
                </label>
                <select
                  value={selectedStudentAssessmentId}
                  onChange={(e) => setSelectedStudentAssessmentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">All Evaluated Assessments</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadStudentPdf}
                  disabled={downloadingStudentPdf || !selectedStudentId}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadingStudentPdf ? 'Compiling PDF...' : 'Download Student PDF'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* DOCUMENT PREVIEW CONTAINER (Matching Image 2: Official Individual Student Template) */}
          <div className="bg-white text-slate-950 rounded-2xl shadow-2xl p-4 sm:p-8 border border-slate-200 overflow-x-auto print:p-0 print:shadow-none print:border-none">
            {loadingStudentData ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold mt-3">Loading student assessment transcript...</p>
              </div>
            ) : (
              <div className="min-w-[650px] max-w-[820px] mx-auto font-sans">
                {/* Agni College Banner Logo */}
                <div className="flex justify-center mb-3">
                  <img
                    src="/agni_logo.png"
                    alt="Agni College of Technology"
                    className="w-full max-h-20 object-contain mx-auto"
                  />
                </div>

                {/* Subtitle & Institutional Accreditations */}
                <div className="text-center space-y-0.5 mb-3 text-xs">
                  <h2 className="text-lg font-black text-[#002b66]">
                    Agni College of Technology
                  </h2>
                  <p className="text-xs text-slate-800 font-semibold">
                    (An Autonomous Institution)
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Accredited by NBA, NAAC with A+ Grade, Estd. 2001, Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai
                  </p>
                  <p className="text-[11px] text-slate-600">
                    OMR, Chennai | 044-4997 2900 | 94450 54081 | www.act.edu.in
                  </p>
                  <div className="border-b border-slate-300 pt-2" />
                </div>

                {/* Title Header Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-black text-[#1e40af] tracking-tight">
                      ASSESSMENT REPORT
                    </h3>
                    <p className="text-xs font-bold text-[#2563eb] tracking-wide">
                      ONLINE CODING ASSESSMENT PLATFORM
                    </p>
                  </div>
                  <div className="text-center sm:text-right text-[11px] text-slate-500 font-medium">
                    <p className="font-bold text-slate-700">
                      REPORT REF: {studentReportData?.reportRef || 'CAP-NUCMHR664'}
                    </p>
                    <p>Generated: {studentReportData?.generatedDate || 'Sep 22, 2026'}</p>
                  </div>
                </div>

                {/* STUDENT & ASSESSMENT DETAILS Card */}
                <div className="border border-sky-200 rounded-lg overflow-hidden mb-4 bg-sky-50/20">
                  <div className="bg-sky-100/70 px-4 py-2 border-b border-sky-200 flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                      👤
                    </div>
                    <span className="text-xs font-black tracking-wide text-sky-900 uppercase">
                      STUDENT & ASSESSMENT DETAILS
                    </span>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs">
                    <div className="flex">
                      <span className="text-slate-600 w-44 font-medium">Student Name</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.name || 'Student Name'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-40 font-medium">Assessment Date</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.assessmentDate || 'DD/MM/YYYY'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-44 font-medium">Register Number</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.rollNumber || 'Register Number'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-40 font-medium">Completion Time</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.completionTime || 'HH:MM:SS'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-44 font-medium">Class / Section</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.batchName || 'Class / Section'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-40 font-medium">Assessment Score</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.scoreDisplay || 'Score / Total'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-44 font-medium">Assessment Topic / Subject</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.topicName || 'Topic / Subject'}]</span>
                    </div>
                    <div className="flex">
                      <span className="text-slate-600 w-40 font-medium">Faculty Name</span>
                      <span className="font-bold text-slate-900">: [{studentReportData?.student?.facultyName || 'Faculty Name'}]</span>
                    </div>
                  </div>
                </div>

                {/* 4 Scorecards Matching Image 2 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <div className="border border-sky-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">OVERALL AVERAGE</div>
                      <div className="text-xl font-black text-sky-600">{studentReportData?.metrics?.avgPercentage || '25.0'}%</div>
                    </div>
                  </div>
                  <div className="border border-sky-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TESTS COMPLETED</div>
                      <div className="text-xl font-black text-slate-900">{studentReportData?.metrics?.testsCompleted || 1}</div>
                    </div>
                  </div>
                  <div className="border border-emerald-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TEST CASE ACCURACY</div>
                      <div className="text-xl font-black text-emerald-600">{studentReportData?.metrics?.accuracy || '25.0'}%</div>
                    </div>
                  </div>
                  <div className="border border-purple-200 rounded-lg p-3 bg-white shadow-sm flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PROBLEMS SOLVED</div>
                      <div className="text-xl font-black text-purple-700">{studentReportData?.metrics?.problemsSolved || '1 / 1'}</div>
                    </div>
                  </div>
                </div>

                {/* ASSESSMENT EVALUATION RECORDS Table */}
                <div className="mb-5">
                  <div className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>ASSESSMENT EVALUATION RECORDS</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-sky-50 text-slate-700 border-b border-slate-200">
                          <th className="py-2 px-3 text-left font-bold">ASSESSMENT NAME</th>
                          <th className="py-2 px-3 text-center font-bold">MARKS</th>
                          <th className="py-2 px-3 text-center font-bold">PERCENTAGE</th>
                          <th className="py-2 px-3 text-center font-bold">SOLVED</th>
                          <th className="py-2 px-3 text-center font-bold">RANK</th>
                          <th className="py-2 px-3 text-center font-bold">DATE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!studentReportData?.evaluations || studentReportData.evaluations.length === 0) ? (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 px-3 text-left font-medium text-slate-800">Advanced Data Structures & Strings</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">15 / 60</td>
                            <td className="py-2.5 px-3 text-center font-bold text-red-600">25.0%</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">1 / 1</td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">#1</td>
                            <td className="py-2.5 px-3 text-center text-slate-600">9/22/26</td>
                          </tr>
                        ) : (
                          studentReportData.evaluations.map((ev: any) => (
                            <tr key={ev.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-left font-medium text-slate-800">{ev.assessmentName}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700">{ev.marks}</td>
                              <td
                                className={`py-2.5 px-3 text-center font-bold ${
                                  parseFloat(ev.percentage) >= 50 ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {ev.percentage}%
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-700">{ev.solved}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800">{ev.rank}</td>
                              <td className="py-2.5 px-3 text-center text-slate-600">{ev.date}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TOPIC MASTERY & DOMAIN BREAKDOWN */}
                <div className="mb-5">
                  <div className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    <span className="text-sky-600 font-bold">📊</span>
                    <span>TOPIC MASTERY & DOMAIN BREAKDOWN</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2.5">
                    {(!studentReportData?.topicStats || studentReportData.topicStats.length === 0) ? (
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-semibold text-slate-800 w-36">Data Structures</span>
                        <span className="text-slate-500 text-[11px] w-28">100% (3/3 cases)</span>
                        <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full w-full" />
                        </div>
                      </div>
                    ) : (
                      studentReportData.topicStats.map((ts: any) => (
                        <div key={ts.name} className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-semibold text-slate-800 w-36">{ts.name}</span>
                          <span className="text-slate-500 text-[11px] w-28">{ts.percentage}% ({ts.passed}/{ts.total} cases)</span>
                          <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                ts.percentage >= 70 ? 'bg-emerald-600' : ts.percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.max(5, ts.percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* RECENT QUESTION EVALUATION LOG */}
                <div className="mb-5">
                  <div className="flex items-center space-x-2 text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    <span className="text-sky-600 font-bold">❓</span>
                    <span>RECENT QUESTION EVALUATION LOG</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-sky-50 text-slate-700 border-b border-slate-200">
                          <th className="py-2 px-3 text-left font-bold">QUESTION TITLE</th>
                          <th className="py-2 px-3 text-center font-bold">LANG</th>
                          <th className="py-2 px-3 text-center font-bold">MARKS</th>
                          <th className="py-2 px-3 text-center font-bold">TEST CASES</th>
                          <th className="py-2 px-3 text-center font-bold">AVG TIME</th>
                          <th className="py-2 px-3 text-center font-bold">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!studentReportData?.recentQuestions || studentReportData.recentQuestions.length === 0) ? (
                          <tr className="border-b border-slate-100">
                            <td className="py-2.5 px-3 text-left font-medium text-slate-800">Find Duplicate Elements</td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-mono">PYTHON</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">15 / 15</td>
                            <td className="py-2.5 px-3 text-center text-slate-700">3 / 3</td>
                            <td className="py-2.5 px-3 text-center text-slate-700 font-mono">86ms</td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-600">ACCEPTED</td>
                          </tr>
                        ) : (
                          studentReportData.recentQuestions.map((q: any) => (
                            <tr key={q.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                              <td className="py-2.5 px-3 text-left font-medium text-slate-800">{q.title}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{q.lang}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700">{q.marks}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700">{q.testCases}</td>
                              <td className="py-2.5 px-3 text-center text-slate-700 font-mono">{q.avgTime}</td>
                              <td
                                className={`py-2.5 px-3 text-center font-bold ${
                                  q.status === 'ACCEPTED' ? 'text-emerald-600' : 'text-amber-600'
                                }`}
                              >
                                {q.status}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PROCTORING & ASSESSMENT INTEGRITY LOG */}
                <div className="mb-5 bg-amber-50/50 border border-amber-200/70 rounded-lg p-3 text-xs text-amber-950">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>PROCTORING & ASSESSMENT INTEGRITY LOG</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-slate-700 pt-1">
                    <span>
                      Tab Switch Events:{' '}
                      <strong className="text-slate-900">
                        {studentReportData?.integrity?.tabSwitches || 0}
                      </strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Fullscreen Exit Events:{' '}
                      <strong className="text-slate-900">
                        {studentReportData?.integrity?.fullscreenExits || 0}
                      </strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span>
                      Paste Blocked Attempts:{' '}
                      <strong className="text-slate-900">
                        {studentReportData?.integrity?.pasteAttempts || 0}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* FACTUAL PERFORMANCE OBSERVATIONS */}
                <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800">
                  <div className="flex items-center space-x-2 font-bold mb-2">
                    <span className="text-sky-600 font-bold">📊</span>
                    <span>FACTUAL PERFORMANCE OBSERVATIONS</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                    {(studentReportData?.observations || [
                      'The student achieved an overall average score of 25.0% across 1 evaluated assessment(s).',
                      'Successfully passed 3 out of 12 total test cases (25.0% test case pass rate).',
                      'Highest score recorded: 25.0%. Questions successfully solved: 1 of 1 attempted.',
                    ]).map((obs: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {obs}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Official Verification Footer */}
                <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
                  <div className="space-y-0.5">
                    <p>
                      This performance report is digitally generated by the Online Coding Assessment Platform evaluation engine.
                    </p>
                    <p className="text-slate-400">
                      Verification URL: http://localhost:5173/verify-report | Authorized Academic Evaluation
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 sm:border-l sm:border-slate-200 sm:pl-4">
                    <p className="font-bold text-slate-800 uppercase tracking-wider">OFFICIALLY VERIFIED & SIGNED</p>
                    <p className="text-slate-600 font-medium">System Evaluation Engine</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
