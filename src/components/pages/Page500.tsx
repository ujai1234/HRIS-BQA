import React, { useState } from 'react';
import { Search, RefreshCw, Home, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useHRIS } from '../../context/HRISContext';

export const Page500: React.FC = () => {
  const { setCurrentPath, currentRole, handleRefresh, isRefreshing } = useHRIS();
  const [searchQuery, setSearchQuery] = useState('');

  const handleReturn = () => {
    if (currentRole === 'ADMIN') setCurrentPath('/dashboard/admin');
    else if (currentRole === 'GURU') setCurrentPath('/dashboard/guru');
    else setCurrentPath('/dashboard/kepsek');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full text-center space-y-6">
        <div className="flex flex-col items-center justify-center">
          {/* CoreUI Style Big Status Code */}
          <div className="flex items-baseline gap-4">
            <h1 className="text-7xl sm:text-9xl font-black text-rose-600 dark:text-rose-500 tracking-tighter">
              500
            </h1>
            <span className="text-3xl sm:text-4xl font-light text-slate-400">|</span>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200">
                Houston, we have a problem!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Server pusat sedang mengalami pemeliharaan berkala atau beban tinggi.
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Bar (CoreUI Standard Form) */}
        <form onSubmit={(e) => { e.preventDefault(); handleReturn(); }} className="max-w-md mx-auto relative flex items-center shadow-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokumentasi atau bantuan teknis..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-l-lg py-2.5 pl-4 pr-10 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-r-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Muat Ulang Koneksi Server</span>
          </button>
          <button
            onClick={handleReturn}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Status Layanan Database: Operasional Normal (PostgreSQL / Memory Cache)</span>
        </div>
      </div>
    </div>
  );
};
