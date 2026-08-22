import React, { useState } from 'react';
import { 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Lock, 
  User, 
  LogIn, 
  Eye, 
  EyeOff, 
  UserPlus 
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useHRIS();
  
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>('GURU');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('T-08'); // Default Ust Fuad Arqom
  const [emailOrUsername, setEmailOrUsername] = useState('fuad.arqom@pesantren-bq.sch.id');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Handle Role selection
  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'GURU') {
      setSelectedTeacherId('T-08');
      setEmailOrUsername('fuad.arqom@pesantren-bq.sch.id');
    } else if (role === 'ADMIN') {
      setSelectedTeacherId('T-07');
      setEmailOrUsername('admin.akmal@pesantren-bq.sch.id');
    } else if (role === 'KEPALA_PESANTREN') {
      setSelectedTeacherId('T-01');
      setEmailOrUsername('kepsek.cahyono@pesantren-bq.sch.id');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, selectedTeacherId);
  };

  // Google OAuth Simulation
  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      setIsGoogleLoading(false);
      login(selectedRole, selectedTeacherId);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans antialiased text-slate-100 relative selection:bg-emerald-500 selection:text-white">
      {/* Background Subtle Gradient & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 p-5 sm:p-6 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-600/30">
            <span className="text-base tracking-tighter">BQ</span>
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight">
              Pesantren Baitul Qur'an Al-Ikhwan
            </h1>
            <p className="text-xs text-emerald-400">Sistem HRIS & Penggajian Guru</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>T.A. 2026/2027</span>
        </div>
      </header>

      {/* Main Minimalist Modern Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-7 shadow-2xl shadow-black/60">
          
          {/* Card Header & Tabs (Sign In / Sign Up) */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {authMode === 'signin' ? 'Selamat Datang Kembali' : 'Pendaftaran Akun Baru'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'signin' 
                ? 'Masuk ke portal HRIS terpadu pesantren' 
                : 'Daftarkan akun pendidik atau pengurus pesantren'}
            </p>

            {/* Toggle Sign In / Sign Up */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 border border-slate-200 hover:border-slate-300 disabled:opacity-75"
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {authMode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider">
                atau pilih 3 peran user
              </span>
            </div>
          </div>

          {/* 3 User Role Selector Pills */}
          <div className="space-y-1.5 mb-4">
            <label className="block text-[11px] font-medium text-slate-300">
              Pilihan Peran Pengguna (3 User):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: Guru */}
              <button
                type="button"
                onClick={() => handleSelectRole('GURU')}
                className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'GURU'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold">1. Guru</span>
              </button>

              {/* Option 2: Admin */}
              <button
                type="button"
                onClick={() => handleSelectRole('ADMIN')}
                className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[11px] font-bold">2. Admin</span>
              </button>

              {/* Option 3: Kepsek */}
              <button
                type="button"
                onClick={() => handleSelectRole('KEPALA_PESANTREN')}
                className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                  selectedRole === 'KEPALA_PESANTREN'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="text-[11px] font-bold">3. Kepsek</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* If Sign Up mode, show Full Name */}
            {authMode === 'signup' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Nama Lengkap:
                </label>
                <div className="relative">
                  <UserPlus className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama Lengkap & Gelar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email / Username */}
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Email atau Username:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="email@pesantren.sch.id / username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-[11px]"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-slate-300">
                  Kata Sandi:
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => alert('Fitur reset password telah dikirim ke email terdaftar.')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300"
                  >
                    Lupa sandi?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-[11px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-300 absolute right-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full text-white font-semibold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2 ${
                selectedRole === 'GURU'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : selectedRole === 'ADMIN'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {authMode === 'signin' 
                  ? `Masuk Sekarang (${selectedRole === 'KEPALA_PESANTREN' ? 'Kepsek' : selectedRole})` 
                  : `Daftar Akun Baru (${selectedRole === 'KEPALA_PESANTREN' ? 'Kepsek' : selectedRole})`}
              </span>
            </button>
          </form>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 p-4 text-center text-[11px] text-slate-500">
        <p>© 2026 Pesantren Baitul Qur'an Al-Ikhwan • Sistem HRIS & Penggajian Guru</p>
      </footer>
    </div>
  );
};
