import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Loader2,
  Sun,
  Moon
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
        setError(data.message || 'Username atau password salah');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-slate-950 flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden transition-colors duration-300">
      {/* Theme Toggle Top-Right */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Islamic Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/islamic-art.png")' }} />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-pesantren-emerald/10 to-transparent" />
      
      <div className="max-w-[400px] w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 flex flex-col items-center relative z-10 border border-slate-100 dark:border-slate-800/60">
        
        {/* Logo Section */}
        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center mb-8 shadow-xl border-4 border-white dark:border-slate-800 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-30" />
          <span className="text-white text-3xl font-black tracking-tight">BQA</span>
        </div>

        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            Baitul Qur'an Al-Ikhwan
          </h1>
          <div className="h-1 w-10 bg-emerald-500 mx-auto mt-3 rounded-full" />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-3 tracking-widest uppercase">
            Human Resources Management
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold py-3 px-4 rounded-xl border border-red-100 dark:border-red-900/30 text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Username</label>
            <div className="relative group">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-4 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username Anda"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-base focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-4 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-base focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-base py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-200/50 dark:shadow-none flex items-center justify-center gap-3 disabled:opacity-70 mt-6 active:scale-[0.98] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            &copy; 2026 Baitul Qur'an Al-Ikhwan. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
