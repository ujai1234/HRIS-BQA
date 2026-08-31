import React, { useState } from 'react';
import { User, Mail, Lock, CheckCircle2, ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPageProps {
  onBackToLogin: () => void;
  onRegistered?: (username: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin, onRegistered }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [unit, setUnit] = useState<'SMP' | 'MA' | 'PESANTREN'>('SMP');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repeatPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok!');
      return;
    }
    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Pendaftaran akun Asatidz berhasil diajukan untuk verifikasi!');
      if (onRegistered) {
        onRegistered(username);
      } else {
        onBackToLogin();
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#ebedef] dark:bg-[#131924] flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="max-w-md w-full">
        {/* CoreUI Register Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          
          {/* Card Top Border Accent */}
          <div className="h-1 bg-emerald-500 w-full" />

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Register Akun Asatidz
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Daftarkan akun pengajar untuk mengakses KBM, Presensi & Kafa'ah.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field with Icon */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nama Lengkap / NIP"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email Field with Icon */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Resmi Asatidz (e.g. ustadz@bqa.sch.id)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Unit Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Unit Penugasan Utama
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2 px-3 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="SMP">SMP Putri Baitul Qur'an</option>
                  <option value="MA">MA Unggulan Baitul Qur'an</option>
                  <option value="PESANTREN">Pondok Pesantren / Diniyah</option>
                </select>
              </div>

              {/* Password Field */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi (minimal 6 karakter)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Repeat Password Field */}
              <div>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Ulangi Kata Sandi"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* CoreUI Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Buat Akun Asatidz</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sudah memiliki akun? Masuk di sini</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          &copy; 2026 Pondok Pesantren Baitul Qur'an Al-Ikhwan.
        </p>
      </div>
    </div>
  );
};
