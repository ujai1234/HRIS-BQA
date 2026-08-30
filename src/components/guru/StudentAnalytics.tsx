import React from 'react';
import { 
  Users, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export const StudentAnalytics: React.FC = () => {
  const chartData = [
    { name: 'Pekan 1', hadir: 98, tugas: 85 },
    { name: 'Pekan 2', hadir: 96, tugas: 88 },
    { name: 'Pekan 3', hadir: 99, tugas: 90 },
    { name: 'Pekan 4', hadir: 95, tugas: 86 },
  ];

  const students = [
    { id: '1', name: 'Ahmad Faris', class: 'VII-A', attendance: 98, score: 85, status: 'Baik' },
    { id: '2', name: 'Zahra Aulia', class: 'VII-A', attendance: 100, score: 95, status: 'Sangat Baik' },
    { id: '3', name: 'Budi Santoso', class: 'VII-B', attendance: 85, score: 75, status: 'Perlu Perhatian' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Analitik & Performa Siswa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau kehadiran dan tren nilai akademik
          </p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option>Semua Kelas</option>
            <option>VII-A (SMP)</option>
            <option>VII-B (SMP)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Tren Performa Kelas</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200" /> Kehadiran
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" /> Nilai Rata-rata
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="hadir" stroke="#1e293b" strokeWidth={2} fill="#1e293b" fillOpacity={0.05} />
                <Line type="monotone" dataKey="tugas" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Kehadiran Bulan Ini</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-slate-900 dark:text-slate-100">97.5%</span>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 mb-1"><TrendingUp className="w-3 h-3" /> +2.1%</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rata-rata Nilai Tugas</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-slate-900 dark:text-slate-100">86.4</span>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5 mb-1"><TrendingUp className="w-3 h-3" /> +1.2</span>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col items-center justify-center text-center gap-2 h-[120px]">
            <button className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors w-full">
              Export Laporan (.csv)
            </button>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Rapor Siswa</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari siswa..."
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Siswa</th>
                <th className="px-4 py-3 font-medium">Kelas</th>
                <th className="px-4 py-3 font-medium">Kehadiran (%)</th>
                <th className="px-4 py-3 font-medium">Nilai Rata-rata</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{student.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{student.class}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{student.attendance}%</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">{student.score}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-medium rounded-full ${
                      student.status === 'Perlu Perhatian' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-xs">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
