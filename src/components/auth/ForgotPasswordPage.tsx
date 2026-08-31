import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Petunjuk pemulihan kata sandi telah dikirim ke email!');
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#ebedef] dark:bg-[#131924] flex items-center justify-center p-4 font-sans transition-colors duration-200">
      <div className="max-w-md w-full">
        {/* CoreUI Password Recovery Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          
          <div className="h-1 bg-indigo-600 w-full" />

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Reset Kata Sandi
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Masukkan email asatidz yang terdaftar untuk menerima tautan pemulihan.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Email Terdaftar
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ustadz@bqa.sch.id"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-md shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Kirim Tautan Reset Sandi</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Email Terkirim
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Silakan periksa kotak masuk atau spam email <strong>{email}</strong> untuk mengatur ulang kata sandi Anda.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Masuk</span>
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
