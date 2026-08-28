import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  LogIn, 
  Loader2,
  Sun,
  Moon,
  ShieldCheck,
  BookOpen
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
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#0F1412] flex items-center justify-center p-4 sm:p-6 font-sans antialiased relative overflow-hidden transition-colors duration-300">
      
      {/* Elegantly Crafted Islamic Geometric Subtle Background Grid & Star Accents */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/islamic-art.png")' }} />
      
      {/* Decorative Minimalist Modern Islamic Arches (Pure Tailwind Arts) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none overflow-hidden select-none">
        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full border border-[#B08968]/15 dark:border-[#B08968]/5 opacity-60" />
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full border border-dashed border-[#1B4332]/10 dark:border-emerald-950/20" />
      </div>

      <div className="max-w-[440px] w-full space-y-7 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-4">
          
          {/* Custom Islamic Minimalist Badge Logo */}
          <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto">
            {/* Outer Rotating Delicate Square Frame */}
            <div className="absolute inset-0 border border-[#B08968]/40 dark:border-[#B08968]/20 rounded-xl rotate-45 transition-transform duration-1000 hover:rotate-90" />
            <div className="absolute inset-1 border border-dashed border-[#1B4332]/30 dark:border-emerald-800/30 rounded-xl -rotate-45" />
            {/* Inner Circular Solid Branding with Book Icon */}
            <div className="absolute inset-2 rounded-lg bg-[#1B4332] dark:bg-emerald-950 text-[#F5EBE0] flex flex-col items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4 text-[#B08968] mb-0.5" strokeWidth={2} />
              <span className="text-[10px] font-bold tracking-widest font-sans">BQA</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] text-[#B08968] font-bold uppercase tracking-[0.25em] inline-block px-2.5 py-0.5 bg-[#B08968]/5 dark:bg-[#B08968]/10 rounded-full border border-[#B08968]/20">
              Sistem Informasi Asatidz • HRIS
            </p>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-stone-900 dark:text-stone-100 tracking-tight leading-snug mt-2">
              Pondok Pesantren <br />
              <span className="text-[#1B4332] dark:text-emerald-400">Baitul Qur'an</span> Al-Ikhwan
            </h1>
          </div>
        </div>

        {/* Custom Spiritual Welcoming Ribbon (The Islamic Touch) */}
        <div className="bg-white/80 dark:bg-[#151D19]/80 backdrop-blur-md rounded-2xl border border-stone-200/60 dark:border-stone-800/60 p-4 text-center space-y-1 shadow-sm">
          {/* Calligraphic Elegant Text */}
          <p className="text-[#1B4332] dark:text-emerald-400 font-serif text-sm font-semibold tracking-wide italic">
            “رَبِّ زِدْنِي عِلْمًا”
          </p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
            &ldquo;Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan.&rdquo; <span className="font-semibold text-[#B08968]">(QS. Thaha: 114)</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#151D19] rounded-2xl border border-stone-200/80 dark:border-stone-850 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          
          {/* Solid Top Highlight line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1B4332] via-[#B08968] to-[#1B4332]" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-[11px] font-semibold py-3 px-4 rounded-xl border border-rose-200/60 dark:border-rose-900/20 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500 shrink-0 animate-ping" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-1">
                Username / NIP Asatidz
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-[#1B4332] dark:group-focus-within:text-emerald-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: T-08 atau BQA-008"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#FBFBFA] dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-700 focus:bg-white dark:focus:bg-stone-900 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-1">
                Sandi Pengaman
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-[#1B4332] dark:group-focus-within:text-emerald-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 py-3 bg-[#FBFBFA] dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-700 focus:bg-white dark:focus:bg-stone-900 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B4332] hover:bg-[#143326] dark:bg-emerald-800 dark:hover:bg-emerald-700 text-[#F5EBE0] hover:text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#B08968]" strokeWidth={2} />
                    <span>Masuk ke Gerbang Layanan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean Islamic Info footer */}
          <div className="mt-6 pt-5 border-t border-stone-150 dark:border-stone-800/80 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" strokeWidth={2} />
              <span>Sistem HRIS Terenkripsi & Aman</span>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-500 hover:text-[#1B4332] dark:text-stone-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#B08968]" />}
              <span>{isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}</span>
            </button>
          </div>
        </div>

        {/* Beautiful bottom info & credentials tips */}
        <div className="bg-stone-100/50 dark:bg-stone-900/30 rounded-xl p-3 border border-stone-200/50 dark:border-stone-800/40 text-center">
          <p className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
            NIP Default Pengujian: <span className="font-semibold text-stone-600 dark:text-stone-300">T-08</span> (Guru) atau <span className="font-semibold text-stone-600 dark:text-stone-300">ADMIN</span> / <span className="font-semibold text-stone-600 dark:text-stone-300">KEPSEK</span>
          </p>
        </div>

        {/* Bottom Credits */}
        <p className="text-center text-[10px] text-stone-400 dark:text-stone-500 font-semibold tracking-wide">
          &copy; 2026 Pondok Pesantren Baitul Qur'an Al-Ikhwan.
        </p>
      </div>
    </div>
  );
};

