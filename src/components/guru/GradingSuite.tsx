import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  MessageSquare
} from 'lucide-react';

export const GradingSuite: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'SUBMITTED' | 'GRADED' | 'LATE'>('ALL');
  
  // Dummy student submissions
  const submissions = [
    { id: '1', name: 'Ahmad Faris', task: 'Tugas Hafalan 1', status: 'SUBMITTED', date: 'Hari ini, 08:30', score: null },
    { id: '2', name: 'Zahra Aulia', task: 'Tugas Hafalan 1', status: 'GRADED', date: 'Kemarin, 14:15', score: 95 },
    { id: '3', name: 'Budi Santoso', task: 'Tugas Hafalan 1', status: 'LATE', date: 'Terlambat 2 hari', score: null },
    { id: '4', name: 'Siti Aminah', task: 'Tugas Hafalan 1', status: 'SUBMITTED', date: 'Hari ini, 09:10', score: null },
  ];

  const filtered = submissions.filter(s => filter === 'ALL' || s.status === filter);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Grading Suite
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Periksa tugas dan berikan penilaian siswa
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm flex flex-col h-full max-h-[700px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari siswa atau tugas..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === 'ALL' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilter('SUBMITTED')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === 'SUBMITTED' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <Clock className="w-3.5 h-3.5" /> Diserahkan
              </button>
              <button 
                onClick={() => setFilter('GRADED')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === 'GRADED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Dinilai
              </button>
              <button 
                onClick={() => setFilter('LATE')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === 'LATE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <AlertCircle className="w-3.5 h-3.5" /> Terlambat
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filtered.map(sub => (
              <div key={sub.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100">{sub.name}</div>
                  {sub.score ? (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{sub.score}</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5" />
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{sub.task}</span>
                  <span className={`
                    ${sub.status === 'LATE' ? 'text-rose-500' : 'text-slate-400'}
                  `}>{sub.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grading Panel (Split View) */}
        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm h-full max-h-[700px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Ahmad Faris</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tugas Hafalan 1 • Diserahkan Hari ini, 08:30</p>
            </div>
            <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
              <FileText className="w-4 h-4" /> Buka Lampiran
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Answer Viewer */}
            <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-lg shadow-sm">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  "Bismillah, berikut setoran hafalan Surah Al-Mulk ayat 1-10 sesuai dengan tugas yang diberikan.
                  
                  Mohon bimbingannya ustadz apabila ada makhraj yang kurang pas."
                  
                  [Audio Lampiran: setoran_ahmad.mp3]
                </p>
              </div>
            </div>

            {/* Rubric & Score Input */}
            <div className="w-full md:w-80 p-5 overflow-y-auto bg-white dark:bg-slate-900 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Rubrik Penilaian</label>
                <div className="space-y-3">
                  {['Kelancaran', 'Makharijul Huruf', 'Tajwid'].map((crit) => (
                    <div key={crit} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{crit}</span>
                      <select className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-sm p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option>A (Sangat Baik)</option>
                        <option>B (Baik)</option>
                        <option>C (Cukup)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nilai Akhir (0-100)</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="w-full text-2xl font-mono px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Umpan Balik
                </label>
                <textarea 
                  rows={3}
                  placeholder="Berikan masukan untuk siswa..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                  Simpan & Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
