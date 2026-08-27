import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Loader2,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';

export const LoginPage: React.FC = () => {
  const { login, isDarkMode, toggleDarkMode } = useHRIS();
  
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

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111614] flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden transition-colors duration-200">
      {/* Background Subtle Elements */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/islamic-art.png")' }} />
      
      <div className="max-w-[420px] w-full space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1B4332] text-white shadow-none border border-white/10 mx-auto">
            <span className="text-2xl font-bold tracking-tight">BQA</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
              Pondok Pesantren <br />
              Baitul Qur'an Al-Ikhwan
            </h1>
            <p className="text-[11px] text-[#B08968] font-bold uppercase tracking-[0.2em] mt-2">
              Human Resources Information System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#1A221E] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-[11px] font-semibold py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-900/30 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider ml-1">Username / NIP</label>
              <div className="relative group">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-[#1B4332] transition-colors" strokeWidth={1.5} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan identitas Anda"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#FBFBFA] dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-[#1B4332] transition-colors" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#FBFBFA] dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2.5 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" strokeWidth={1.5} />
                    <span>Masuk ke Dashboard Asatidz</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800/60 flex flex-col items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Sistem Presensi Terenkripsi</span>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Credits */}
        <p className="text-center text-[10px] text-stone-400 font-medium tracking-wide">
          &copy; 2026 Baitul Qur'an Al-Ikhwan. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </div>
  );
};
