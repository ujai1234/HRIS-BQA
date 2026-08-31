import React, { useState } from 'react';
import { Search, Home, ArrowLeft, HelpCircle } from 'lucide-react';
import { useHRIS } from '../../context/HRISContext';

export const Page404: React.FC = () => {
  const { setCurrentPath, currentRole } = useHRIS();
  const [searchQuery, setSearchQuery] = useState('');

  const handleReturn = () => {
    if (currentRole === 'ADMIN') setCurrentPath('/dashboard/admin');
    else if (currentRole === 'GURU') setCurrentPath('/dashboard/guru');
    else setCurrentPath('/dashboard/kepsek');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleReturn();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          {/* CoreUI Style Big Status Code */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-7xl sm:text-9xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
              404
            </h1>
            <span className="text-3xl sm:text-4xl font-light text-slate-400">|</span>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
                Oops! You're lost.
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Bar (CoreUI Standard Form) */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto relative flex items-center shadow-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul, jadwal, atau berkas kafa'ah..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-l-lg py-2.5 pl-4 pr-10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-r-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleReturn}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </button>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Halaman Sebelumnya</span>
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          CoreUI Admin Error Page Template • Baitul Qur'an Al-Ikhwan
        </p>
      </div>
    </div>
  );
};
