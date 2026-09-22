import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentReports: React.FC = () => {
  return (
    <div className="max-w-md mx-auto mt-12 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center shadow-xl space-y-4">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white">Reports Managed by Administrators</h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Official mark sheets, class statements, and evaluation transcripts are maintained and exported directly by institution administrators and course faculty.
        </p>
      </div>
      <Link
        to="/student/dashboard"
        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Dashboard</span>
      </Link>
    </div>
  );
};
