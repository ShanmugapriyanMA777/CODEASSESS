import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Terminal, Moon, Sun, LogOut, Shield, GraduationCap, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-3 sm:px-4 lg:px-6 flex items-center justify-between shadow-sm transition-colors duration-200">
      {/* Brand logo, title & mobile menu toggle */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-amber-500" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        )}

        <Link to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} className="flex items-center space-x-2 sm:space-x-2.5 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition flex-shrink-0">
            <Terminal className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">CodeAssess</span>
              <span className="text-[9px] sm:text-[10px] uppercase font-mono px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-bold">
                PRO
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-slate-400 font-medium">Online Coding Assessment Platform</span>
          </div>
        </Link>
      </div>

      {/* Right side controls */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Day' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {user && (
          <div className="flex items-center space-x-2 sm:space-x-3 pl-2 border-l border-slate-200 dark:border-slate-800">
            {/* Role badge */}
            {isAdmin ? (
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 shadow-sm shadow-amber-500/10">
                <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{user.role}</span>
              </div>
            ) : (
              <Link
                to="/student/profile"
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-600/40 hover:border-amber-500 transition"
                title="Go to My Profile & Security"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{user.role}</span>
              </Link>
            )}

            {/* User name & email */}
            {isAdmin ? (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{user.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</span>
              </div>
            ) : (
              <Link
                to="/student/profile"
                className="hidden md:flex flex-col text-right group hover:opacity-80 transition"
                title="Go to My Profile & Security"
              >
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 group-hover:text-amber-500 transition">{user.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</span>
              </Link>
            )}

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2.5 sm:px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 transition cursor-pointer"
              title="Logout from platform"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

