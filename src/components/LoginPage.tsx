import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Loader2,
  Sun,
  Moon,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { RegisterPage } from './auth/RegisterPage';
import { ForgotPasswordPage } from './auth/ForgotPasswordPage';
import { Page404 } from './pages/Page404';
import { Page500 } from './pages/Page500';
import { BrandLogo } from './BrandLogo';

export const LoginPage: React.FC = () => {
  const { login, isDarkMode, toggleDarkMode } = useHRIS();
  
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'PREVIEW_404' | 'PREVIEW_500'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        login(data.user.role, data.user.id);
      } else {
        setError(data.message || 'Identitas asatidz atau kata sandi salah');
      }
    } catch (err) {
      setError('Gangguan koneksi ke server pusat');
    } finally {
      setLoading(false);
    }
  };

  // Quick Persona Instant Login Helper
  const handleQuickLogin = (userRole: 'ADMIN' | 'GURU' | 'KEPALA_SMP' | 'KEPALA_MA' | 'KEPALA_PESANTREN') => {
    if (userRole === 'ADMIN') {
      login('ADMIN', 'admin_1');
    } else if (userRole === 'GURU') {
      login('GURU', 't_8'); // Ustadz Muhammad Ziyad
    } else if (userRole === 'KEPALA_SMP') {
      login('KEPALA_SMP', 't_1');
    } else if (userRole === 'KEPALA_MA') {
      login('KEPALA_MA', 't_2');
    } else if (userRole === 'KEPALA_PESANTREN') {
      login('KEPALA_PESANTREN', 't_3');
    }
  };

  // Switch to Register or Forgot Password Views
  if (authView === 'REGISTER') {
    return <RegisterPage onBackToLogin={() => setAuthView('LOGIN')} />;
  }

  if (authView === 'FORGOT') {
    return <ForgotPasswordPage onBackToLogin={() => setAuthView('LOGIN')} />;
  }

  if (authView === 'PREVIEW_404') {
    return (
      <div className="min-h-screen bg-[#ebedef] dark:bg-[#131924] p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <button
            onClick={() => setAuthView('LOGIN')}
            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-md text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            &larr; Kembali ke Login
          </button>
        </div>
        <Page404 />
        <div />
      </div>
    );
  }

  if (authView === 'PREVIEW_500') {
    return (
      <div className="min-h-screen bg-[#ebedef] dark:bg-[#131924] p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <button
            onClick={() => setAuthView('LOGIN')}
            className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-md text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            &larr; Kembali ke Login
          </button>
        </div>
        <Page500 />
        <div />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f4] dark:bg-[#0f1713] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased transition-colors duration-200 relative">
      
      {/* Top Controls: Dark Mode Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
          <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Main Brand Section - Proportional Transparent Prominent Logo & Islamic Modern Typography */}
      <div className="flex flex-col items-center text-center mb-6 max-w-md w-full">
        <div className="mb-4 relative group">
          <BrandLogo size="xl" className="transition-transform duration-300 hover:scale-105 filter drop-shadow-xl" />
        </div>

        {/* Islamic Greeting / Bismillah */}
        <div className="text-emerald-800/90 dark:text-emerald-400 font-serif text-sm font-semibold tracking-wider mb-1">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Baitul Qur'an Al-Ikhwan
        </h2>
        <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400 font-semibold tracking-wide mt-0.5">
          Sistem HRIS & Kafa'ah Asatidz
        </p>
      </div>

      {/* ========================================================= */}
      {/* Sleek Centered Auth Card                                  */}
      {/* ========================================================= */}
      <div className="w-full max-w-md bg-white dark:bg-[#16201b] rounded-2xl shadow-xl shadow-emerald-950/5 border border-emerald-900/10 dark:border-emerald-800/30 overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
        <div>
          <div className="mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gunakan NIP / Username dan Password Anda
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold py-2.5 px-3.5 rounded-lg border border-rose-200 dark:border-rose-900/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input with Islamic Emerald Styling */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username / NIP
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: T-08 (Ust. Muhammad)"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Password Input with Islamic Emerald Styling */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-lg py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Action Button Row: Login & Forgot Password */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-semibold text-xs py-2.5 px-6 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Masuk</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthView('FORGOT')}
                className="text-xs text-emerald-800 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>
          </form>
        </div>

        {/* Quick Persona Demo Selector */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>Akses Cepat Demo Persona</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('GURU')}
              className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-900 transition-colors cursor-pointer"
            >
              Guru
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_SMP')}
              className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-900 transition-colors cursor-pointer"
            >
              Kepala SMP
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_MA')}
              className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-sky-200 dark:border-sky-900 transition-colors cursor-pointer"
            >
              Kepala MA
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_PESANTREN')}
              className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-teal-200 dark:border-teal-900 transition-colors cursor-pointer"
            >
              Mudir
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-[11px] text-slate-500 dark:text-slate-500 mt-6">
        &copy; 2026 Pondok Pesantren Baitul Qur'an Al-Ikhwan. All rights reserved.
      </p>
    </div>
  );
};
