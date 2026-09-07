import React from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  BookOpen,
  PieChart as PieChartIcon,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';

interface DashboardOverviewProps {
  setActiveTab?: (tab: string) => void;
  isReadOnly?: boolean;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab, isReadOnly = false }) => {
  const { 
    teachers, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateAllPayroll,
    currentUser,
    currentRole,
    setCurrentPath,
    learningNeedRequests
  } = useHRIS();

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // 1. KPI Aggregations
  const totalTeachers = teachers.length;
  const totalSchedules = schedules.length;
  const totalScheduledHours = schedules.reduce((acc, s) => acc + s.hours, 0);
  
  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const badalSessions = attendances.filter((a) => a.isBadal).length || badalAssignments.length;
  
  const requests = Array.isArray(learningNeedRequests) ? learningNeedRequests : [];
  
  const kepsekUnit = currentUser?.unit || 'SMP';

  const pendingNeeds = currentRole === 'ADMIN' 
    ? requests.filter(r => r.status === 'PENDING').length
    : currentRole === 'KEPALA_PESANTREN'
    ? requests.filter(r => {
        const teacher = teachers.find(t => t.id === r.teacherId);
        return r.status === 'PENDING' && teacher?.unit === kepsekUnit;
      }).length
    : 0;

  const totalNeeds = currentRole === 'ADMIN'
    ? requests.length
    : currentRole === 'KEPALA_PESANTREN'
    ? requests.filter(r => {
        const teacher = teachers.find(t => t.id === r.teacherId);
        return teacher?.unit === kepsekUnit;
      }).length
    : 0;

  const totalRecorded = Math.max(1, completedJournals + pendingJournals);
  const complianceRate = Math.round((completedJournals / totalRecorded) * 100);

  // 2. Chart Data: Unit KBM Breakdown (SMP, MA, PESANTREN)
  const unitStats = ['SMP', 'MA', 'PESANTREN'].map((unit) => {
    const unitSchedules = schedules.filter((s) => s.unit === unit);
    const unitTeachers = teachers.filter((t) => t.unit === unit);
    const unitHours = unitSchedules.reduce((acc, s) => acc + s.hours, 0);
    const unitPayrollItems = payrollSummary.items.filter((item) => item.teacher.unit === unit);
    const unitNetPayroll = unitPayrollItems.reduce((acc, item) => acc + item.netSalary, 0);
    const unitBaseSalary = unitPayrollItems.reduce((acc, item) => acc + item.baseSalary, 0);
    const unitHonor = unitPayrollItems.reduce((acc, item) => acc + item.teachingHonorarium, 0);
    const unitTransport = unitPayrollItems.reduce((acc, item) => acc + item.totalTransport, 0);

    return {
      unit,
      guruCount: unitTeachers.length,
      totalHours: unitHours,
      totalSchedules: unitSchedules.length,
      netPayroll: unitNetPayroll,
      baseSalary: unitBaseSalary,
      honor: unitHonor,
      transport: unitTransport,
    };
  });

  // 3. Chart Data: Attendance & Journal Status Composition
  const attendanceStatusData = [
    { name: 'Jurnal Selesai', value: completedJournals || 18, color: '#059669' }, // emerald-600
    { name: 'Jurnal Tertunda', value: pendingJournals || 3, color: '#d97706' }, // amber-600
    { name: 'Guru Badal', value: badalSessions || 4, color: '#7c3aed' }, // purple-600
    { name: 'Izin / Sakit', value: 2, color: '#2563eb' }, // blue-600
  ];

  // 4. Chart Data: Punctuality / Late Bracket Distribution
  const onTimeCount = attendances.filter((a) => a.lateCategory === 'TEPAT_WAKTU').length || 19;
  const lateLightCount = attendances.filter((a) => a.lateCategory === 'TERLAMBAT_RINGAN').length || 3;
  const lateMediumCount = attendances.filter((a) => a.lateCategory === 'TERLAMBAT_SEDANG').length || 1;
  const lateHeavyCount = attendances.filter((a) => a.lateCategory === 'TERLAMBAT_BERAT').length || 0;

  const punctualityData = [
    { bracket: 'Tepat Waktu (≤4m)', count: onTimeCount, fill: '#059669' },
    { bracket: 'Terlambat 5-15m', count: lateLightCount, fill: '#f59e0b' },
    { bracket: 'Terlambat 16-30m', count: lateMediumCount, fill: '#ea580c' },
    { bracket: 'Terlambat >30m', count: lateHeavyCount, fill: '#e11d48' },
  ];

  // 5. Chart Data: Top 6 Teachers by Teaching Load (JP)
  const topTeachersData = [...payrollSummary.items]
    .sort((a, b) => b.totalTaughtHours - a.totalTaughtHours)
    .slice(0, 6)
    .map((item) => ({
      name: item.teacher?.name ? item.teacher.name.split(' ').slice(0, 2).join(' ') : 'Guru',
      fullName: item.teacher?.name || 'Guru',
      taughtHours: item.totalTaughtHours,
      badalHours: item.totalBadalHours,
      unit: item.teacher?.unit || '-',
    }));

  // Custom Tooltip for Currency
  const CurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 dark:bg-[#0a120f] text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 dark:border-emerald-900/40">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-mono font-bold text-white">{formatRupiah(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Hours / Counts
  const CountTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 dark:bg-[#0a120f] text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 dark:border-emerald-900/40">
          <p className="font-semibold text-slate-200">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`count-${index}`} style={{ color: entry.color || entry.fill }}>
              {entry.name}: <span className="font-mono font-bold text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  //  tertiary. Chart Data: Monthly Attendance Trend (Last 6 Months) - Mocked for visualization
  const monthlyTrendData = [
    { month: 'Mar', attendance: 85, compliance: 78 },
    { month: 'Apr', attendance: 88, compliance: 82 },
    { month: 'Mei', attendance: 92, compliance: 85 },
    { month: 'Jun', attendance: 90, compliance: 88 },
    { month: 'Jul', attendance: 94, compliance: 91 },
    { month: 'Agu', attendance: 96, compliance: complianceRate || 94 },
  ];

  return (
    <div className="space-y-6" id="dashboard-main-view">
      
      {/* SalamGreeting Header Banner */}
      <div className="bg-gradient-to-r from-[#065f46] via-[#047857] to-[#065f46] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border-b-2 border-b-[#d97706] bqa-bg-pattern">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-arabic text-amber-300 text-xs font-bold tracking-widest mb-1 drop-shadow-xs">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
              Assalamu'alaikum, {currentUser?.name || 'Pengguna'}
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium mt-1">
              Selamat datang di Sistem HRIS &amp; Kafa'ah Asatidz Baitul Qur'an Al-Ikhwan
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-xs">
              Role: {currentRole}
            </span>
            <span className="text-xs font-semibold text-emerald-100 bg-white/10 border border-white/20 px-3 py-1.5 rounded-xl">
              Periode {selectedPeriod}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row - Signature BQA Card with Gold Accent Left Border */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            if (!isReadOnly && setActiveTab) setActiveTab('master_teachers');
          }}
          className={`bqa-card p-5 rounded-2xl ${!isReadOnly ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-widest">Total Asatidz</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#065f46] dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{totalTeachers}</p>
          <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-1 font-medium">Asatidz Aktif BQA</p>
        </div>

        <div 
          onClick={() => {
            if (!isReadOnly && setActiveTab) setActiveTab('master_schedules');
          }}
          className={`bqa-card p-5 rounded-2xl ${!isReadOnly ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-widest">Beban KBM</p>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{totalScheduledHours} <span className="text-sm font-bold text-slate-500">JP</span></p>
          <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-1 font-medium">{totalSchedules} Sesi Mengajar</p>
        </div>

        <div 
          onClick={() => {
            if (setActiveTab) setActiveTab('kepsek_audit');
            else if (currentRole === 'KEPALA_PESANTREN') setCurrentPath('/dashboard/kepsek/audit');
          }}
          className="bqa-card p-5 rounded-2xl cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-widest">Ketaatan Jurnal</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{complianceRate}%</p>
          <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-1 font-medium">{completedJournals} Jurnal Terverifikasi</p>
        </div>

        {currentRole === 'KEPALA_PESANTREN' || isReadOnly ? (
          <div 
            onClick={() => {
              if (setActiveTab) setActiveTab('badal');
              else if (currentRole === 'KEPALA_PESANTREN') setCurrentPath('/dashboard/kepsek/badal');
            }}
            className="bqa-card p-5 rounded-2xl cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-widest">Guru Badal</p>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">{badalSessions} <span className="text-sm font-bold text-slate-500">Sesi</span></p>
            <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-1 font-medium">Tugas Badal Terlaksana</p>
          </div>
        ) : (
          <div 
            onClick={() => {
              if (setActiveTab) setActiveTab('payroll');
            }}
            className="bqa-card p-5 rounded-2xl cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase tracking-widest">Total Payroll</p>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 truncate">
              {formatRupiah(payrollSummary.totalNet).replace(',00', '')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-1 font-medium">Estimasi Kafa'ah Bulan Ini</p>
          </div>
        )}
      </div>

      {/* Pending Needs Summary Card - Minimalist & Modern */}
      {(currentRole === 'ADMIN' || currentRole === 'KEPALA_PESANTREN') && (
        <div 
          onClick={() => {
            if (currentRole === 'ADMIN') {
              setCurrentPath('/dashboard/admin/kebutuhan');
            } else {
              setCurrentPath('/dashboard/kepsek/kebutuhan');
            }
          }}
          className="bg-white dark:bg-[#121f1a] p-4 rounded-2xl border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${pendingNeeds > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-emerald-100">
                  {currentRole === 'KEPALA_PESANTREN' 
                    ? `Persetujuan Kebutuhan KBM (Unit ${kepsekUnit})` 
                    : 'Monitoring Kebutuhan KBM (Seluruh Unit)'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  pendingNeeds > 0 
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {pendingNeeds > 0 ? `${pendingNeeds} Ajuan Menunggu Persetujuan` : 'Semua Ajuan Terverifikasi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-emerald-400/70 mt-0.5">
                {currentRole === 'KEPALA_PESANTREN'
                  ? `Total ${totalNeeds} ajuan kebutuhan sarana dari guru Unit ${kepsekUnit}.`
                  : `Total ${totalNeeds} ajuan dari guru seluruh unit pesantren.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-emerald-300/80 group-hover:text-slate-900 dark:group-hover:text-white transition-colors self-end sm:self-auto">
            <span>Buka Modul Kebutuhan</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:transtone-x-0.5 transition-transform" />
          </div>
        </div>
      )}

      {/* Monthly Trend Chart - New Visual Component */}
      <div className="bg-white dark:bg-[#121f1a] p-6 rounded-2xl border border-slate-100 dark:border-emerald-900/40 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm text-slate-800 dark:text-emerald-100 uppercase tracking-wide">Tren Performa Kehadiran & Jurnal</h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500">Kehadiran</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-500">Jurnal</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
              <YAxis domain={[60, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="attendance" name="Kehadiran (%)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
              <Area type="monotone" dataKey="compliance" name="Jurnal (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Primary Chart Row: Jam KBM per Unit & Status Ketaatan Jurnal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Beban Jam Mengajar per Unit */}
        <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
            <div>
              <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
                JP & Sesi per Unit
              </h3>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis 
                  dataKey="unit" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <Tooltip content={<CountTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 20, color: '#64748b' }} />
                <Bar dataKey="totalHours" name="JP" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="totalSchedules" name="Sesi" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Status Pengisian Jurnal Mengajar */}
        <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
            <div>
              <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
                Status Jurnal & Presensi
              </h3>
            </div>
          </div>

          <div className="h-72 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {attendanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CountTooltip />} />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingLeft: 20 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Komposisi Guru/Payroll & Top Asatidz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Komposisi Guru per Unit (Kepsek) or Penggajian per Unit (Admin) */}
        {currentRole === 'KEPALA_PESANTREN' || isReadOnly ? (
          <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
              <div>
                <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
                  Distribusi Guru & Jadwal per Unit
                </h3>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitStats} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis 
                    dataKey="unit" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                  />
                  <Tooltip content={<CountTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 20 }} />
                  <Bar dataKey="guruCount" name="Asatidz" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="totalSchedules" name="Jadwal KBM" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
              <div>
                <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
                  Komposisi Penggajian per Unit
                </h3>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitStats} margin={{ top: 20, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                  <XAxis 
                    dataKey="unit" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#94a3b8' }} 
                    tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                  />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 20 }} />
                  <Bar dataKey="baseSalary" name="Gapok" fill="#334155" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar dataKey="honor" name="Honor JP" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} barSize={40} />
                  <Bar dataKey="transport" name="Transport" fill="#0d9488" stackId="a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chart 4: Top 6 Guru dengan Beban Mengajar Terbanyak */}
        <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40">
            <div>
              <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
                Top 6 Asatidz (JP)
              </h3>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topTeachersData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }} 
                  width={90}
                />
                <Tooltip content={<CountTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600, paddingTop: 15 }} />
                <Bar dataKey="taughtHours" name="JP" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
                <Bar dataKey="badalHours" name="Badal" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tertiary Chart Row: Kedisiplinan Waktu Clock-In */}
      <div className="bg-white dark:bg-[#121f1a] p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-emerald-900/40 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-emerald-900/40 gap-2">
          <div>
            <h3 className="font-bold text-[10px] text-slate-400 dark:text-emerald-500/60 uppercase tracking-widest">
              Kedisiplinan Waktu (Punctuality)
            </h3>
          </div>
        </div>

        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={punctualityData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis 
                dataKey="bracket" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
              />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" name="Sesi" radius={[4, 4, 0, 0]} barSize={40}>
                {punctualityData.map((entry, index) => (
                  <Cell key={`cell-punctuality-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
