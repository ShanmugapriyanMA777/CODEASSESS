import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Batch } from '../../types';
import { Users, Plus, Search, Edit2, Trash2, Key, FileText, CheckCircle, XCircle, X } from 'lucide-react';

export const StudentList: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  // Create/Edit Student Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [batchId, setBatchId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  useEffect(() => {
    loadPrerequisites();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedBatch]);

  const loadPrerequisites = async () => {
    try {
      const bRes = await api.get('/batches');
      if (bRes.data.success) setBatches(bRes.data.data);
    } catch (e) {}
  };

  const fetchStudents = async () => {
    try {
      let query = '';
      if (selectedBatch) query += `?batchId=${selectedBatch}`;
      if (search) query += `${query ? '&' : '?'}search=${search}`;

      const res = await api.get(`/students${query}`);
      if (res.data.success) {
        setStudents(res.data.data.students);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setName('');
    setEmail('');
    setPassword('');
    setRollNumber('');
    setBatchId(batches[0]?.id || '');
    setDepartment('Computer Science & Engineering');
    setModalOpen(true);
  };

  const openEditModal = (s: User) => {
    setEditingStudent(s);
    setName(s.name);
    setEmail(s.email);
    setPassword('');
    setRollNumber(s.studentProfile?.rollNumber || '');
    setBatchId(s.studentProfile?.batchId || '');
    setDepartment(s.studentProfile?.department || 'Computer Science & Engineering');
    setModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, {
          name,
          email,
          rollNumber,
          batchId,
          department,
          ...(password && { password }),
        });
      } else {
        await api.post('/students', {
          name,
          email,
          password,
          rollNumber,
          batchId,
          department,
        });
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save student');
    }
  };

  const toggleStudentActive = async (s: User) => {
    try {
      await api.put(`/students/${s.id}`, { isActive: !s.isActive });
      setStudents((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, isActive: !s.isActive } : item))
      );
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const downloadPdf = async (studentId: string, studentName: string) => {
    try {
      const response = await api.get(`/reports/student/${studentId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${studentName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to generate PDF');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage candidates, passwords, cohort assignments, and performance files
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            placeholder="Search by student name, roll number, or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Cohorts / Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Roll No</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Batch / Class</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Exams Attempted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-300">
                      {s.studentProfile?.rollNumber || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{s.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{s.email}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {s.studentProfile?.batch?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.studentProfile?.department || 'CSE'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {s._count?.assessmentResults || 0} completed
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStudentActive(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                          s.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {s.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => downloadPdf(s.id, s.name)}
                        className="p-1.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300"
                        title="Download Performance PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Edit Candidate"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingStudent ? 'Edit Candidate Profile' : 'Add Candidate'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {editingStudent ? 'Reset Password (optional)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStudent ? 'Leave blank to keep unchanged' : 'Student@123'}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Batch / Cohort</label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-2 text-xs text-slate-100"
                  >
                    <option value="">None</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
