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
import { authClient } from '../lib/auth-client';
import { RegisterPage } from './auth/RegisterPage';
import { ForgotPasswordPage } from './auth/ForgotPasswordPage';
import { Page404 } from './pages/Page404';
import { Page500 } from './pages/Page500';
import { BrandLogo } from './BrandLogo';

export const LoginPage: React.FC = () => {
  const { login, isDarkMode, toggleDarkMode, teachers } = useHRIS();
  
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
      const email = `${username}@bqa.local`;
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password
      });
      
      if (authError) {
        setError(authError.message || 'Identitas asatidz atau kata sandi salah');
      } else if (data?.user) {
        // @ts-ignore - teacherId is an additional field
        const teacherId = data.user.teacherId as string;
        // Find the teacher role from the teachers list
        const targetTeacher = teachers.find((t: any) => t.id === teacherId);
        const role = targetTeacher?.role || 'GURU';
        login(role, teacherId);
      } else {
        setError('Login gagal. Terjadi kesalahan internal.');
      }
    } catch (err) {
      setError('Gangguan koneksi ke server pusat');
    } finally {
      setLoading(false);
    }
  };

  // Quick Persona Instant Login Helper
  const handleQuickLogin = (userRole: 'ADMIN' | 'GURU' | 'KEPALA_SMP' | 'KEPALA_MA' | 'KEPALA_PESANTREN' | 'STAFF_DAPUR' | 'STAFF_SARPRAS') => {
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
    } else if (userRole === 'STAFF_DAPUR') {
      login('STAFF', 'T-24'); // Mang Ujang
    } else if (userRole === 'STAFF_SARPRAS') {
      login('STAFF', 'T-25'); // Pak Kang Edi
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
    <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-[#044e3a] to-[#0f1713] dark:from-[#092e22] dark:via-[#09221a] dark:to-[#09110d] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased transition-colors duration-200 relative overflow-hidden bqa-bg-pattern">
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls: Dark Mode Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100 dark:text-emerald-300 hover:text-white bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-emerald-800/40 px-3.5 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-emerald-200" />}
          <span className="hidden sm:inline">{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
      </div>

      {/* Main Brand Section - Proportional Transparent Prominent Logo & Islamic Modern Typography */}
      <div className="flex flex-col items-center text-center mb-6 max-w-md w-full relative z-10">
        <div className="mb-3 relative group">
          <BrandLogo size="xl" className="transition-transform duration-300 hover:scale-105 filter drop-shadow-2xl" />
        </div>

        {/* Islamic Greeting / Bismillah */}
        <div className="font-arabic text-amber-300 text-sm font-bold tracking-widest mb-1.5 drop-shadow-xs">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
          Sistem HRIS &amp; Kafa'ah Asatidz
        </h2>
        <p className="mt-1 text-xs font-semibold text-amber-300 uppercase tracking-widest bg-amber-500/20 inline-block px-3 py-1 rounded-full border border-amber-400/30">
          Baitul Qur'an Al-Ikhwan
        </p>
      </div>

      {/* ========================================================= */}
      {/* Sleek BQA Glassmorphic Auth Card (With Gold Accent Border) */}
      {/* ========================================================= */}
      <div className="w-full max-w-md bg-white/95 dark:bg-[#16201b]/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-emerald-950/40 border border-slate-200/80 dark:border-emerald-800/40 border-t-4 border-t-[#d97706] border-l-4 border-l-[#d97706] overflow-hidden p-6 sm:p-8 flex flex-col justify-between relative z-10 transition-all">
        <div>
          <div className="mb-6 pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Masuk ke Akun
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gunakan Username / NIP dan Password Anda
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#d97706] dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input with BQA Styling */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Username / NIP
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: T-08 (Ust. Muhammad Ziyad)"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all"
                />
              </div>
            </div>

            {/* Password Input with BQA Styling */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all"
                />
              </div>
            </div>

            {/* Action Button Row: Login CTA Gold & Lupa Kata Sandi */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-[#d97706] hover:bg-[#b45309] active:scale-95 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk App</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthView('FORGOT')}
                className="text-xs text-[#065f46] dark:text-emerald-400 hover:text-[#d97706] dark:hover:text-amber-400 hover:underline font-semibold transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>
          </form>
        </div>

        {/* Quick Persona Demo Selector */}
        <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Akses Cepat Demo Persona</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-[#d97706] dark:text-amber-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('GURU')}
              className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-[#065f46] dark:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
            >
              Guru / Ustadz
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_SMP')}
              className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
            >
              Kepala SMP
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_MA')}
              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
            >
              Kepala MA
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('KEPALA_PESANTREN')}
              className="bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 transition-all cursor-pointer"
            >
              Mudir Pesantren
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('STAFF_DAPUR')}
              className="bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 transition-all cursor-pointer"
            >
              Staff Dapur
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('STAFF_SARPRAS')}
              className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
            >
              Staff Sarpras
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-[11px] text-emerald-100/80 dark:text-slate-400 mt-6 relative z-10">
        &copy; 2026 Pondok Pesantren Baitul Qur'an Al-Ikhwan. All rights reserved.
      </p>
    </div>
  );
};
