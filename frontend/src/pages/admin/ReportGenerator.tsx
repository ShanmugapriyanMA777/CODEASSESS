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
} from 'lucide-react';

export const ReportGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'statement' | 'individual'>('statement');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Selection states
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
  const [completedOnly, setCompletedOnly] = useState<boolean>(true);

  // Statement Report Data & Loading
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [downloadingCsv, setDownloadingCsv] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  // Individual student report state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [generatingStudent, setGeneratingStudent] = useState(false);

  // Template Customization Settings
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [institutionName, setInstitutionName] = useState('AGNI COLLEGE OF TECHNOLOGY');
  const [subHeader, setSubHeader] = useState('(An Autonomous Institution, Affiliated to Anna University, Chennai.)');
  const [accreditation, setAccreditation] = useState("Approved by AICTE, Accredited by NAAC with 'A+' Grade");
  const [location, setLocation] = useState('OMR, Navalur, Thalambur, Chennai.-600130');
  const [statementTitle, setStatementTitle] = useState('IAT1 - ODD SEMESTER - 2026');
  const [statementSub, setStatementSub] = useState('PORTAL MARK ENTRY STATEMENT');
  const [programme, setProgramme] = useState('B.E. COMPUTER SCIENCE AND ENGINEERING');
  const [batchSec, setBatchSec] = useState('BATCH : 2024 - SEC. : C');
  const [facultyName, setFacultyName] = useState('Mrs. VARSHA');
  const [subjectName, setSubjectName] = useState('COMPUTER NETWORKS');
  const [subjectCode, setSubjectCode] = useState('24CS501');
  const [dateOfEntry, setDateOfEntry] = useState(new Date().toLocaleDateString('en-GB').replace(/\//g, '-'));

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
            setBatchSec(`BATCH : ${batchesRes.data.data[0].academicYear || '2024'} - SEC. : ${batchesRes.data.data[0].code}`);
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
        setBatchSec(`BATCH : ${found.academicYear || '2024'} - SEC. : ${found.code}`);
        setProgramme(`B.E. ${found.name.toUpperCase()}`);
      }
    } else {
      setBatchSec('BATCH : 2024 - SEC. : C');
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
      params.append('statementSub', statementSub);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('subjectCode', subjectCode);
      params.append('dateOfEntry', dateOfEntry);

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

  // Download CSV
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
      params.append('statementSub', statementSub);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('subjectCode', subjectCode);
      params.append('dateOfEntry', dateOfEntry);

      const res = await api.get(`/reports/class-statement/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const batchNameSafe = (statementData?.metadata?.batchName || 'Overall').replace(/\s+/g, '_');
      link.setAttribute('download', `portal_mark_entry_statement_${batchNameSafe}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download CSV report');
    } finally {
      setDownloadingCsv(false);
    }
  };

  // Download PDF
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
      params.append('statementSub', statementSub);
      params.append('programme', programme);
      params.append('batchSec', batchSec);
      params.append('facultyName', facultyName);
      params.append('subjectName', subjectName);
      params.append('subjectCode', subjectCode);
      params.append('dateOfEntry', dateOfEntry);

      const res = await api.get(`/reports/class-statement/pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const batchNameSafe = (statementData?.metadata?.batchName || 'Overall').replace(/\s+/g, '_');
      link.setAttribute('download', `portal_mark_entry_statement_${batchNameSafe}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Browser print
  const handlePrint = () => {
    window.print();
  };

  // Individual student report handler
  const handleGenerateStudentReport = async () => {
    if (!selectedStudentId) return;
    setGeneratingStudent(true);
    try {
      const student = students.find((s) => s.id === selectedStudentId);
      const res = await api.get(`/reports/student/${selectedStudentId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `student_report_${student?.name.replace(/\s+/g, '_') || 'candidate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate student PDF report');
    } finally {
      setGeneratingStudent(false);
    }
  };

  const records = statementData?.records || [];
  const meta = statementData?.metadata || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Admin Reports Center
            </span>
            <span className="text-slate-500 text-xs">Official Anna University Portal Format</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            Portal Mark Entry Statement
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generate and download overall assessment completion statements and CSV mark sheets by class
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
            <span>Class Overall Statement</span>
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
            <span>Candidate Transcripts</span>
          </button>
        </div>
      </div>

      {activeTab === 'statement' ? (
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
                  <span>Student Completion Filter</span>
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
                  <span>{showSettings ? 'Hide Template Metadata' : 'Customize Template Header'}</span>
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
                  <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  title="Print Mark Statement"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
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
                    <label className="block text-[11px] text-slate-400 mb-1">Batch & Section</label>
                    <input
                      type="text"
                      value={batchSec}
                      onChange={(e) => setBatchSec(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Faculty Name</label>
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
                    <label className="block text-[11px] text-slate-400 mb-1">Subject Code</label>
                    <input
                      type="text"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date of Entry</label>
                    <input
                      type="text"
                      value={dateOfEntry}
                      onChange={(e) => setDateOfEntry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={fetchStatementData}
                      className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Update Statement
                    </button>
                  </div>
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
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Completed Assessment</span>
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

          {/* DOCUMENT PREVIEW CONTAINER (Matching the provided Agni College PDF template) */}
          <div className="bg-white text-slate-950 rounded-2xl shadow-2xl p-3.5 sm:p-8 lg:p-12 border border-slate-200 overflow-x-auto print:p-0 print:shadow-none print:border-none">
            {loadingData ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold mt-3">Compiling mark statement data...</p>
              </div>
            ) : (
              <div className="min-w-[650px]">
                {/* Institutional Heading Header */}
                <div className="text-center space-y-1 mb-6 border-b border-black pb-4">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-black font-serif">
                    {institutionName}
                  </h2>
                  <p className="text-xs text-slate-700 font-serif">
                    {subHeader}
                  </p>
                  <p className="text-[11px] text-slate-600 font-serif">
                    {accreditation}
                  </p>
                  <p className="text-[11px] text-slate-600 font-serif">
                    {location}
                  </p>
                  <p className="text-xs font-bold text-black uppercase tracking-wider font-serif pt-1">
                    {statementTitle}
                  </p>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-black underline font-serif">
                    {statementSub}
                  </h3>
                </div>

                {/* Academic Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-2 text-xs font-serif text-black mb-6 px-1">
                  <div>
                    <span className="font-bold">PROGRAMME : </span>
                    <span>{programme}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">BATCH : </span>
                    <span>{batchSec}</span>
                  </div>

                  <div>
                    <span className="font-bold">Date of Entry : </span>
                    <span>{dateOfEntry}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">Name of the Faculty : </span>
                    <span className="font-bold">{facultyName}</span>
                  </div>

                  <div>
                    <span className="font-bold">Subject Name : </span>
                    <span>{subjectName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">Subject Code : </span>
                    <span>{subjectCode}</span>
                  </div>
                </div>

                {/* Mark Entry Table with the 5 User-Specified Columns:
                    1. S.NO
                    2. REGISTER NUMBER
                    3. NAME OF THE STUDENT
                    4. ASSIGNMENT COMPLETION
                    5. SCORE
                    (Excluding CTA and HOURS ATTENDED as instructed) */}
                <div className="border border-black">
                  <table className="w-full text-xs font-serif border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black text-black">
                        <th className="py-2.5 px-3 text-center border-r border-black font-bold w-14">
                          S.NO
                        </th>
                        <th className="py-2.5 px-3 text-left border-r border-black font-bold w-36">
                          REGISTER NUMBER
                        </th>
                        <th className="py-2.5 px-4 text-left border-r border-black font-bold">
                          NAME OF THE STUDENT
                        </th>
                        <th className="py-2.5 px-4 text-center border-r border-black font-bold w-44">
                          ASSIGNMENT COMPLETION
                        </th>
                        <th className="py-2.5 px-4 text-center font-bold w-24">
                          SCORE
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                            No students match the selected class or completion filter.
                          </td>
                        </tr>
                      ) : (
                        records.map((row: any) => {
                          const isComp = row.assignmentCompletion.toLowerCase().includes('complete');
                          const isScoreAb = row.score === 'AB' || row.score === '-';
                          return (
                            <tr
                              key={row.sNo}
                              className="border-b border-slate-300 hover:bg-slate-50 transition"
                            >
                              <td className="py-2 px-3 text-center border-r border-black font-medium">
                                {row.sNo}
                              </td>
                              <td className="py-2 px-3 text-left border-r border-black font-mono font-bold tracking-tight">
                                {row.registerNumber}
                              </td>
                              <td className="py-2 px-4 text-left border-r border-black font-semibold text-black uppercase">
                                {row.studentName}
                              </td>
                              <td className="py-2 px-4 text-center border-r border-black">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                                    isComp
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {row.assignmentCompletion}
                                </span>
                              </td>
                              <td
                                className={`py-2 px-4 text-center font-bold ${
                                  isScoreAb ? 'text-red-600 font-black' : 'text-black font-mono text-sm'
                                }`}
                              >
                                {row.score}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signature Block matching template */}
                <div className="mt-14 pt-8 flex items-end justify-between font-serif text-xs text-black px-4">
                  <div className="text-left space-y-1">
                    <p className="font-bold text-sm">{facultyName}</p>
                    <p className="text-slate-600">Name of the Faculty</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-36 border-b border-black mb-1 mx-auto" />
                    <p className="font-bold">Signature of the HoD.</p>
                  </div>
                </div>

                <div className="mt-8 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-200 pt-2">
                  <span>
                    {facultyName.replace(/[^a-zA-Z]/g, '').toUpperCase()}.CSE {dateOfEntry} 09:08:00
                  </span>
                  <span>CodeAssess Certified Autonomous Institutional Engine</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Individual Student PDF Report Card Tab */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Individual Candidate Academic Transcript</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates an individual student performance report featuring detailed test-case execution outcomes, topic mastery radar stats, and proctoring logs.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.studentProfile?.rollNumber || s.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateStudentReport}
            disabled={generatingStudent}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{generatingStudent ? 'Generating PDF...' : 'Download Student Academic Transcript'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
