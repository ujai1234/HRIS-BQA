import React, { useState } from 'react';
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

interface Student {
  id: string;
  name: string;
  class: string;
  attendance: number;
  score: number;
  status: 'Baik' | 'Sangat Baik' | 'Perlu Perhatian';
  lastSessionAttendance: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
}

export const StudentAnalytics: React.FC = () => {
  const chartData = [
    { name: 'Pekan 1', hadir: 98, tugas: 85 },
    { name: 'Pekan 2', hadir: 96, tugas: 88 },
    { name: 'Pekan 3', hadir: 99, tugas: 90 },
    { name: 'Pekan 4', hadir: 95, text: 86, tugas: 89 },
  ];

  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'Ahmad Faris', class: 'VII-A', attendance: 98, score: 85, status: 'Baik', lastSessionAttendance: 'HADIR' },
    { id: '2', name: 'Zahra Aulia', class: 'VII-A', attendance: 100, score: 95, status: 'Sangat Baik', lastSessionAttendance: 'HADIR' },
    { id: '3', name: 'Budi Santoso', class: 'VII-B', attendance: 85, score: 75, status: 'Perlu Perhatian', lastSessionAttendance: 'IZIN' },
    { id: '4', name: 'Siti Aminah', class: 'VII-A', attendance: 94, score: 88, status: 'Baik', lastSessionAttendance: 'HADIR' },
    { id: '5', name: 'Fakhri Hanif', class: 'VII-B', attendance: 92, score: 80, status: 'Baik', lastSessionAttendance: 'SAKIT' },
  ]);

  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStudentAttendance = (studentId: string, status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA') => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        // Recalculate attendance rate dynamically for realism
        let newAtt = s.attendance;
        if (status === 'HADIR' && s.lastSessionAttendance !== 'HADIR') {
          newAtt = Math.min(100, s.attendance + 2);
        } else if (status === 'ALPA' && s.lastSessionAttendance === 'HADIR') {
          newAtt = Math.max(0, s.attendance - 5);
        }
        return {
          ...s,
          lastSessionAttendance: status,
          attendance: Math.round(newAtt)
        };
      }
      return s;
    }));
  };

  const filteredStudents = students.filter(s => {
    const classMatch = selectedClass === 'Semua Kelas' || s.class === selectedClass;
    const searchMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return classMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg text-center">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
          🚧 Fitur Analitik Santri ini masih dalam visualisasi pratinjau (Coming Soon) dan belum mengambil data presensi dari database siswa.
        </p>
      </div>

      {/* 1. Header with minimalist controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Analitik & Presensi Santri
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola kehadiran harian dan tinjau performa akademik secara berkala.
          </p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg px-3 py-1.5 outline-none focus:border-slate-900 dark:focus:border-slate-100"
          >
            <option value="Semua Kelas">Semua Kelas</option>
            <option value="VII-A">Kelas VII-A</option>
            <option value="VII-B">Kelas VII-B</option>
          </select>
        </div>
      </div>

      {/* 2. Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Monochromatic Clean Line Chart (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50 dark:border-slate-850">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tren Tingkat Kehadiran & Nilai</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Rata-rata kumulatif per pekan</p>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <span className="w-2.5 h-2.5 rounded bg-slate-900 dark:bg-slate-100" /> Kehadiran
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700" /> Nilai Rata-rata
              </span>
            </div>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="hadir" stroke="#0f172a" strokeWidth={1.5} fill="#0f172a" fillOpacity={0.03} />
                <Line type="monotone" dataKey="tugas" stroke="#94a3b8" strokeWidth={1.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dynamic Target Metrics (1 Column) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rasio Kehadiran Unit</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100">97.6%</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">Tinggi</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rerata Indeks Nilai</span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100">87.5 / 100</span>
              <span className="text-[10px] text-slate-600 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Sesuai KKM</span>
            </div>
          </div>

          <button className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs rounded-lg shadow-sm transition-colors duration-150 cursor-pointer">
            Export Rapor Kumulatif (.CSV)
          </button>
        </div>
      </div>

      {/* 3. Interactive Student Register & Rapid Attendance Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Presensi Cepat & Daftar Santri</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Klik opsi presensi di baris siswa untuk memperbarui absensi sesi terakhir langsung.</p>
          </div>
          <input 
            type="text" 
            placeholder="Cari nama santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Nama Santri</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Rerata Presensi (%)</th>
                <th className="px-4 py-3">Rerata Nilai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Presensi Sesi Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors duration-150">
                  <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                    {student.name}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                    {student.class}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {student.attendance}%
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {student.score}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded ${
                      student.status === 'Perlu Perhatian' 
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                        : student.status === 'Sangat Baik'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {/* Dynamic Rapid Attendance Switcher */}
                    <div className="flex justify-center items-center gap-1">
                      {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as const).map((status) => {
                        const isActive = student.lastSessionAttendance === status;
                        const colors = {
                          HADIR: isActive ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-slate-400',
                          IZIN: isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-400',
                          SAKIT: isActive ? 'bg-amber-600 text-white' : 'hover:bg-amber-50 dark:hover:bg-amber-950/20 text-slate-400',
                          ALPA: isActive ? 'bg-rose-600 text-white' : 'hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400'
                        };

                        return (
                          <button
                            key={status}
                            onClick={() => toggleStudentAttendance(student.id, status)}
                            className={`px-2 py-1 rounded text-[9px] font-bold tracking-wider transition-all duration-150 cursor-pointer ${colors[status]}`}
                          >
                            {status[0]}
                          </button>
                        );
                      })}
                    </div>
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
