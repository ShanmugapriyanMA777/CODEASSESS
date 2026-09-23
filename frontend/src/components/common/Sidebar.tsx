import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Code2,
  FileCheck2,
  Users,
  Layers,
  Award,
  BarChart3,
  FileText,
  ShieldAlert,
  BookOpenCheck,
  Send,
  History,
  UserCheck,
  X,
  Star,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { isAdmin } = useAuth();

  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Question Bank', path: '/admin/questions', icon: Code2 },
    { label: 'Assessments', path: '/admin/assessments', icon: FileCheck2 },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Batches / Classes', path: '/admin/batches', icon: Layers },
    { label: 'Results & Rankings', path: '/admin/results', icon: Award },
    { label: 'Submissions Feed', path: '/admin/submissions', icon: History },
    { label: 'Reports & Mark Sheets', path: '/admin/reports', icon: FileText },
    { label: 'Training Feedback', path: '/admin/feedback', icon: Star },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const studentNav = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Assessments', path: '/student/assessments', icon: FileCheck2 },
    { label: 'Coding Practice', path: '/student/practice', icon: BookOpenCheck },
    { label: 'My Submissions', path: '/student/submissions', icon: Send },
    { label: 'Performance Analytics', path: '/student/performance', icon: BarChart3 },
    { label: 'My Profile & Security', path: '/student/profile', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  const renderNavLinks = (isMobileView = false) => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (isMobileView && onClose) onClose();
            }}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* DESKTOP STATIC SIDEBAR (Hidden on mobile screens < md) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] transition-colors duration-200">
        <div className="p-4">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 px-3 mb-2 flex items-center justify-between">
            <span>{isAdmin ? 'Administration Console' : 'Candidate Workspace'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
          </div>
          {renderNavLinks(false)}
        </div>

        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
              <span>Execution Sandbox</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Isolated compiler worker active (Python 3, Java 11, C/C++).
            </p>
          </div>
        </div>
      </aside>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY (Rendered only on < md when toggled) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl h-full overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {isAdmin ? 'Admin Console' : 'Student Portal'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="p-4 flex-1">
              {renderNavLinks(true)}
            </div>

            {/* Sandbox footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 mt-auto">
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
                  <span>Sandbox Online</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Isolated compiler worker active.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

