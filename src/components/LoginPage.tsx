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
  const [logoState, setLogoState] = useState<'jpeg' | 'jpg' | 'png' | 'fallback'>('jpeg');

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
    <div className="min-h-screen bg-radial from-stone-50 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-[#111614] dark:to-[#0a0d0c] flex flex-col items-center justify-center p-6 font-sans antialiased relative transition-colors duration-300">
      
      {/* Subtle background overlay to add depth without clutter */}
      <div className="absolute inset-0 bg-grid-stone-950/[0.02] dark:bg-grid-white/[0.01] pointer-events-none" />
      
      <div className="max-w-[400px] w-full space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-5">
          
          {/* Pristine Minimalist Circle Logo Badge */}
          <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto bg-white rounded-full shadow-md border border-stone-200/40 dark:border-stone-800/10 overflow-hidden">
            {logoState !== 'fallback' ? (
              <img 
                src={logoState === 'jpeg' ? '/logo.jpeg' : (logoState === 'jpg' ? '/logo.jpg' : '/logo.png')} 
                alt="Logo Baitul Qur'an" 
                className="w-full h-full object-contain scale-[1.35] transition-transform duration-300 hover:scale-[1.42]" 
                onError={() => {
                  if (logoState === 'jpeg') {
                    setLogoState('jpg');
                  } else if (logoState === 'jpg') {
                    setLogoState('png');
                  } else {
                    setLogoState('fallback');
                  }
                }}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-800">
                <BookOpen className="w-6 h-6 text-[#B08968] mb-0.5" strokeWidth={2} />
                <span className="text-xs font-black tracking-widest">BQA</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight leading-none">
              Baitul Qur'an
            </h1>
            <p className="text-xs text-[#B08968] dark:text-[#c49e7b] font-black uppercase tracking-[0.25em]">
              Al-Ikhwan • HRIS
            </p>
          </div>
        </div>

        {/* Minimalist Login Form Container */}
        <div className="bg-white/90 dark:bg-[#151D19]/90 backdrop-blur-xl rounded-2xl border border-stone-200/80 dark:border-stone-800/60 p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-300">
          
          {/* Accent border highlight on top of the card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-800 via-[#B08968] to-emerald-800" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-50/80 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-xs font-semibold py-3 px-4 rounded-xl border border-rose-200/60 dark:border-rose-900/20 text-center flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500 shrink-0 animate-ping" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-1">
                Username / NIP Asatidz
              </label>
              <div className="relative group">
                <User className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: T-08 atau BQA-008"
                  className="w-full text-xs pl-11 pr-4 py-3.5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-800 dark:focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-900/90 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider ml-1">
                Sandi Pengaman
              </label>
              <div className="relative group">
                <Lock className="w-4.5 h-4.5 text-stone-400 absolute left-3.5 top-3.5 group-focus-within:text-emerald-700 dark:group-focus-within:text-emerald-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-11 pr-4 py-3.5 bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-800 dark:focus:border-emerald-600 focus:bg-white dark:focus:bg-stone-900/90 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-stone-50 hover:text-white font-bold text-xs py-3.5 rounded-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-75 cursor-pointer shadow-md active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-emerald-300" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#B08968]" strokeWidth={2.5} />
                    <span>Masuk ke Layanan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Clean Islamic Info footer */}
          <div className="mt-6 pt-5 border-t border-stone-100 dark:border-stone-800/80 flex flex-col items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-500" strokeWidth={1.5} />
              <span>HRIS Terenkripsi & Aman</span>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-500 hover:text-emerald-800 dark:text-stone-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-[#B08968]" />}
              <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
          </div>
        </div>

        {/* Integrated Spiritual Verse - Clean, No Nested Box */}
        <div className="text-center px-4 space-y-1">
          <p className="text-emerald-800 dark:text-emerald-400 font-serif text-sm font-semibold tracking-wide italic">
            “رَبِّ زِدْنِي عِلْمًا”
          </p>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
            &ldquo;Ya Tuhanku, tambahkanlah kepadaku ilmu pengetahuan.&rdquo; <span className="font-semibold text-[#B08968]">(QS. Thaha: 114)</span>
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


