import React, { useState } from 'react';
import {
  User,
  Lock,
  LogIn,
  Loader2,
  Sun,
  Moon,
  ShieldCheck,
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
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT' | 'PREVIEW_404' | 'PREVIEW_500'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-login jika session Better-Auth terdeteksi (seperti setelah Google Login)
  React.useEffect(() => {
    // @ts-ignore
    if (session?.user) {
      // @ts-ignore - check if user has a teacherId linked
      const teacherId = session.user.teacherId as string | undefined;
      let role: any = 'GURU';
      let finalTeacherId = teacherId;

      if (teacherId) {
        const targetTeacher = teachers.find((t: any) => t.id === teacherId);
        if (targetTeacher) {
          role = targetTeacher.role;
        }
      } else {
        // @ts-ignore
        const email = session.user.email;
        const targetByEmail = teachers.find((t: any) =>
          t.id.toLowerCase() === email.split('@')[0].toLowerCase() ||
          // @ts-ignore
          t.name.toLowerCase() === session.user.name.toLowerCase() ||
          t.username?.toLowerCase() === email.toLowerCase()
        );

        if (targetByEmail) {
          role = targetByEmail.role;
          finalTeacherId = targetByEmail.id;
        } else {
          authClient.signOut({ fetchOptions: {} }).then(() => {
            setError(`Akun Google dengan email ${email} belum terdaftar di Master Data HRIS.`);
          });
          return;
        }
      }

      login(role, finalTeacherId);
    }
  }, [session, teachers, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = username.includes('@') ? username : `${username}@bqa.local`;
      const { data, error: authError } = await authClient.signIn.email({ email, password });

      if (authError) {
        setError(authError.message || 'Identitas asatidz atau kata sandi salah');
      } else if (data?.user) {
        // @ts-ignore - teacherId is an additional field
        const teacherId = data.user.teacherId as string;
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

  // Loading: identik dengan Tahfidz
  if (sessionPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-[#044e3a] to-[#0f1713] flex flex-col items-center justify-center p-4 font-sans antialiased bqa-bg-pattern">
        <div className="flex flex-col items-center gap-5 relative z-10 animate-fade-up">
          <div className="relative">
            <div className="w-14 h-14 border-2 border-emerald-800/50 rounded-full"></div>
            <div className="w-14 h-14 border-t-2 border-amber-400 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="font-arabic text-amber-300 text-sm tracking-widest">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-emerald-100 font-display font-bold text-sm tracking-tight">Memverifikasi Sesi...</p>
            <p className="text-amber-300/70 text-[10px] uppercase tracking-widest font-bold">HRIS & Kafa'ah Asatidz</p>
          </div>
        </div>
      </div>
    );
  }

  if (authView === 'REGISTER') {
    return <RegisterPage onBackToLogin={() => setAuthView('LOGIN')} />;
  }

  if (authView === 'FORGOT') {
    return <ForgotPasswordPage onBackToLogin={() => setAuthView('LOGIN')} />;
  }

  if (authView === 'PREVIEW_404') {
    return (
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f1713] p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <button
            onClick={() => setAuthView('LOGIN')}
            className="text-xs font-semibold bg-white dark:bg-[#16201b] border border-[#e2e8f0] dark:border-emerald-900/40 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
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
      <div className="min-h-screen bg-[#faf9f6] dark:bg-[#0f1713] p-6 flex flex-col justify-between">
        <div className="flex justify-end">
          <button
            onClick={() => setAuthView('LOGIN')}
            className="text-xs font-semibold bg-white dark:bg-[#16201b] border border-[#e2e8f0] dark:border-emerald-900/40 px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
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

      {/* Decorative Glow Elements — identik Tahfidz */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Controls: Dark Mode */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-emerald-200" />}
          <span className="hidden sm:inline">{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
      </div>

      {/* Brand Section */}
      <div className="w-full max-w-md space-y-6 animate-fade-up z-10 relative">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 relative group">
            <BrandLogo size="xl" className="transition-transform duration-300 hover:scale-105 filter drop-shadow-2xl" />
          </div>

          {/* Bismillah — identik Tahfidz */}
          <p className="font-arabic text-amber-300 text-lg font-bold tracking-wide mb-1 drop-shadow-xs">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight drop-shadow-md">
            Sistem HRIS & Kafa'ah
          </h1>
          <p className="mt-1 text-xs font-semibold text-amber-300 uppercase tracking-widest bg-amber-500/20 inline-block px-3 py-1 rounded-full border border-amber-400/30">
            Baitul Qur'an Al-Ikhwan
          </p>
        </div>

        {/* ===================================== */}
        {/* Auth Card — identik dengan Tahfidz   */}
        {/* rounded-3xl, gold border top & left  */}
        {/* ===================================== */}
        <div className="bg-white/95 dark:bg-[#16201b]/95 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl shadow-emerald-950/40 rounded-3xl border border-slate-200/80 dark:border-emerald-800/40 border-t-4 border-t-[#d97706] border-l-4 border-l-[#d97706]">

          {/* Card Header */}
          <div className="mb-6 pb-3.5 border-b border-[#e2e8f0] dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-[#1e293b] dark:text-slate-100 tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                Gunakan Username / NIP dan Password Anda
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#d97706] dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error Alert — identik style Tahfidz */}
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold py-2.5 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1e293b] dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Username / NIP
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#94a3b8] dark:text-slate-500 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: T-08 (Ust. Muhammad Ziyad)"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-[#e2e8f0] dark:border-slate-700 text-xs text-[#1e293b] dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1e293b] dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#94a3b8] dark:text-slate-500 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-[#e2e8f0] dark:border-slate-700 text-xs text-[#1e293b] dark:text-slate-100 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#d97706]/30 focus:border-[#d97706] transition-all placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            {/* Actions — identik layout Tahfidz */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-[#065f46] to-[#047857] hover:from-[#044e3a] hover:to-[#065f46] active:scale-95 text-white font-display font-bold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
                className="text-xs text-[#065f46] dark:text-emerald-400 hover:text-[#d97706] dark:hover:text-amber-400 hover:underline font-bold transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative mt-7 mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0] dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-[#16201b] px-2 text-[#64748b] font-semibold uppercase tracking-wider">Atau</span>
            </div>
          </div>

          {/* Google OAuth Login Button */}
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: 'google' })}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-500/30 text-[#1e293b] dark:text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Lanjutkan dengan Google</span>
          </button>

          {/* Register CTA */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#64748b] dark:text-slate-400">
              Belum punya akun?{' '}
              <button
                onClick={() => setAuthView('REGISTER')}
                className="text-[#d97706] dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Daftar Sekarang
              </button>
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-emerald-100/80 dark:text-slate-400 font-medium">
          Sesi diamankan JWT · &copy; 2026 Pondok Pesantren Baitul Qur'an Al-Ikhwan
        </p>
      </div>
    </div>
  );
};
