import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Loader2 
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';

export const LoginPage: React.FC = () => {
  const { login } = useHRIS();
  
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
    <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center p-4 font-sans antialiased relative overflow-hidden">
      {/* Islamic Pattern Background Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/islamic-art.png")' }} />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#00966b]/10 to-transparent" />
      
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,150,107,0.1)] p-8 sm:p-12 flex flex-col items-center relative z-10 border border-emerald-50">
        
        {/* Logo Section */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00966b] to-[#007a57] flex items-center justify-center mb-8 shadow-lg shadow-emerald-200/50 transform -rotate-3">
          <span className="text-white text-3xl font-extrabold tracking-tighter drop-shadow-sm">BQA</span>
        </div>

        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">
            Baitul Qur'an <span className="text-[#00966b]">Al-Ikhwan</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-2 tracking-wide uppercase text-[10px]">
            Sistem HRIS & Penggajian Terpadu
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 text-[11px] font-semibold py-2.5 px-4 rounded-xl border border-red-100 text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
            <div className="relative group">
              <User className="w-5 h-5 text-slate-300 absolute left-4 top-3.5 group-focus-within:text-[#00966b] transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#00966b]/5 focus:border-[#00966b] transition-all placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
            <div className="relative group">
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-3.5 group-focus-within:text-[#00966b] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-[#00966b]/5 focus:border-[#00966b] transition-all placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00966b] to-[#00b380] hover:from-[#007a57] hover:to-[#00966b] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200/50 flex items-center justify-center gap-3 disabled:opacity-70 mt-6 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Account Info */}
        <div className="w-full mt-12 pt-8 border-t border-slate-50">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-4">
              Akses Cepat Demo
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">ADMIN</span>
                <code className="text-[10px] text-emerald-600 font-mono">admin / admin123</code>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">KEPSEK</span>
                <code className="text-[10px] text-emerald-600 font-mono">kepsek / kepsek123</code>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400">GURU</span>
                <code className="text-[10px] text-emerald-600 font-mono">ustfuadaroqomm / guru123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
