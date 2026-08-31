import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Activity, 
  TrendingUp, 
  Download, 
  Calendar,
  Layers
} from 'lucide-react';

export const CoreUIChartsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'KBM' | 'KEUANGAN' | 'EVALUASI'>('ALL');

  // CoreUI Color Palette Tokens
  const colors = {
    primary: '#321fdb',
    secondary: '#9da5b1',
    success: '#2eb85c',
    info: '#3399ff',
    warning: '#f9b115',
    danger: '#e55353',
    dark: '#2c384a',
    light: '#ebedef',
    teal: '#20c997',
    purple: '#6f42c1'
  };

  // Sample Datasets for CoreUI Charts showcase
  const monthlyKBMData = [
    { month: 'Jan', kehadiran: 94, target: 90, santri: 120 },
    { month: 'Feb', kehadiran: 96, target: 90, santri: 122 },
    { month: 'Mar', kehadiran: 91, target: 90, santri: 125 },
    { month: 'Apr', kehadiran: 98, target: 90, santri: 125 },
    { month: 'Mei', kehadiran: 95, target: 90, santri: 128 },
    { month: 'Jun', kehadiran: 97, target: 90, santri: 130 },
    { month: 'Jul', kehadiran: 99, target: 90, santri: 135 },
    { month: 'Agu', kehadiran: 98, target: 90, santri: 138 },
  ];

  const unitWorkloadData = [
    { unit: 'SMP Putri', jpMengajar: 142, kafaah: 85, badal: 12 },
    { unit: 'MA Unggulan', jpMengajar: 168, kafaah: 92, badal: 8 },
    { unit: 'Pesantren Tahfidz', jpMengajar: 195, kafaah: 98, badal: 15 },
    { unit: 'Diniyah Sore', jpMengajar: 84, kafaah: 64, badal: 4 },
  ];

  const statusDistributionData = [
    { name: 'KBM Tuntas', value: 580, color: colors.success },
    { name: 'Guru Badal', value: 45, color: colors.warning },
    { name: 'Izin / Sakit', value: 25, color: colors.info },
    { name: 'Koreksi Jurnal', value: 12, color: colors.danger },
  ];

  const competencyRadarData = [
    { subject: 'Fasahah & Kelancaran', A: 92, B: 85, fullMark: 100 },
    { subject: 'Makharijul Huruf', A: 88, B: 78, fullMark: 100 },
    { subject: 'Ahkamut Tajwid', A: 95, B: 90, fullMark: 100 },
    { subject: 'Adab & Disiplin', A: 98, B: 92, fullMark: 100 },
    { subject: 'Keaktifan Murajaah', A: 86, B: 80, fullMark: 100 },
    { subject: 'Ujian Bulanan', A: 90, B: 84, fullMark: 100 },
  ];

  const weeklyTrafficData = [
    { day: 'Senin', jam: 48, santriAktif: 135 },
    { day: 'Selasa', jam: 52, santriAktif: 138 },
    { day: 'Rabu', jam: 50, santriAktif: 136 },
    { day: 'Kamis', jam: 46, santriAktif: 134 },
    { day: 'Jumat', jam: 32, santriAktif: 130 },
    { day: 'Sabtu', jam: 40, santriAktif: 132 },
    { day: 'Ahad', jam: 28, santriAktif: 128 },
  ];

  return (
    <div className="space-y-6">
      {/* CoreUI Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              CoreUI Charts & Analytics Showcase
            </h1>
            <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded">
              v5.0 React
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Demonstrasi visualisasi data analitik KBM, Kafa'ah, dan performa santri bergaya CoreUI Free React Admin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'ALL' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('KBM')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'KBM' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              KBM
            </button>
            <button
              onClick={() => setActiveTab('KEUANGAN')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                activeTab === 'KEUANGAN' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Kafa'ah
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Grid of CoreUI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. CoreUI Line Chart Card */}
        {(activeTab === 'ALL' || activeTab === 'KBM') && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Line Chart - Tren Kehadiran KBM vs Target (%)
                </h3>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                +4.2% MoM
              </span>
            </div>
            <div className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyKBMData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="kehadiran" name="Realisasi (%)" stroke={colors.primary} strokeWidth={2.5} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="target" name="Target Pesantren (%)" stroke={colors.danger} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 2. CoreUI Bar Chart Card */}
        {(activeTab === 'ALL' || activeTab === 'KBM' || activeTab === 'KEUANGAN') && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Bar Chart - Jam Pelajaran (JP) & Pengganti per Unit
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Bulan Berjalan</span>
            </div>
            <div className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="unit" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="jpMengajar" name="Total JP KBM" fill={colors.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="badal" name="Sesi Badal" fill={colors.warning} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 3. CoreUI Doughnut / Pie Chart Card */}
        {(activeTab === 'ALL' || activeTab === 'KBM') && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Doughnut Chart - Status Pelaksanaan Sesi KBM
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Total 662 Sesi</span>
            </div>
            <div className="p-4 flex flex-col sm:flex-row items-center justify-around gap-4">
              <div className="h-60 w-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {statusDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.value} sesi</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. CoreUI Radar Chart Card */}
        {(activeTab === 'ALL' || activeTab === 'KBM') && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Radar Chart - Rubrik Evaluasi Tahfidz & Akademik
                </h3>
              </div>
              <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded">
                Semester Ganjil
              </span>
            </div>
            <div className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={competencyRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                    <Radar name="Rata-rata Kelas A" dataKey="A" stroke={colors.primary} fill={colors.primary} fillOpacity={0.4} />
                    <Radar name="Rata-rata Kelas B" dataKey="B" stroke={colors.teal} fill={colors.teal} fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* 5. CoreUI Area Chart Card */}
        {(activeTab === 'ALL' || activeTab === 'KEUANGAN') && (
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Area Chart - Distribusi Beban Mengajar Harian (JP)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <Calendar className="w-3 h-3 text-indigo-500" /> Pekan Ini
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorJam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.primary} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSantri" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.success} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={colors.success} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="jam" name="Total Jam Pelajaran (JP)" stroke={colors.primary} fillOpacity={1} fill="url(#colorJam)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
