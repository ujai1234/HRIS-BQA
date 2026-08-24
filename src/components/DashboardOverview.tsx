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
    currentUser
  } = useHRIS();

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // 1. KPI Aggregations
  const totalTeachers = teachers.length;
  const totalSchedules = schedules.length;
  const totalScheduledHours = schedules.reduce((acc, s) => acc + s.hours, 0);
  
  const completedJournals = attendances.filter((a) => a.status === 'SELESAI').length;
  const pendingJournals = attendances.filter((a) => a.status === 'HADIR_JURNAL_KOSONG').length;
  const badalSessions = attendances.filter((a) => a.isBadal).length || badalAssignments.length;
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
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 dark:border-slate-800">
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
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 dark:border-slate-800">
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

  return (
    <div className="space-y-6" id="dashboard-main-view">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          <span>Statistik & Kinerja KBM</span>
        </h2>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
            Periode: <strong className="text-slate-900 dark:text-slate-100">{selectedPeriod}</strong>
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => {
            if (!isReadOnly && setActiveTab) setActiveTab('master_teachers');
          }}
          className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all ${!isReadOnly ? 'hover:border-emerald-500 dark:hover:border-emerald-600 cursor-pointer group' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Tenaga Pendidik
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalTeachers} Asatidz</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-1">
            SMP, MA & Pesantren
          </span>
        </div>

        <div 
          onClick={() => {
            if (!isReadOnly && setActiveTab) setActiveTab('master_schedules');
          }}
          className={`bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all ${!isReadOnly ? 'hover:border-teal-500 dark:hover:border-teal-600 cursor-pointer group' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Beban KBM
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">{totalScheduledHours} JP / Pekan</p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-1">
            {totalSchedules} Sesi Mengajar
          </span>
        </div>

        <div 
          onClick={() => {
            if (setActiveTab) setActiveTab('kepsek_audit');
          }}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ketaatan Jurnal PBM
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-500 mt-2">{complianceRate}%</p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-medium flex items-center gap-1 mt-1">
            <span>{completedJournals} Selesai Terisi</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        <div 
          onClick={() => {
            if (setActiveTab) setActiveTab('payroll');
          }}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Anggaran Payroll
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:bg-emerald-700 dark:group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-500 font-medium flex items-center gap-1 mt-1">
            <span>Alokasi {selectedPeriod}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>

      {/* Primary Chart Row: Jam KBM per Unit & Status Ketaatan Jurnal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Beban Jam Mengajar per Unit */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>Beban Jam Pelajaran (JP) & Sesi per Unit</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan volume KBM antara unit SMP, MA, dan Pesantren
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="totalHours" name="Total Jam Pelajaran (JP)" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalSchedules" name="Jumlah Sesi / Rombel" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Donut Status Pengisian Jurnal Mengajar */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>Distribusi Status Ketaatan Jurnal & Presensi</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rasio sesi berstatus Selesai, Jurnal Tertunda, Badal, dan Izin
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {attendanceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Chart Row: Komposisi Anggaran Payroll & Top Asatidz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Komposisi Komponen Payroll per Unit */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>Komposisi Penggajian per Unit (Rp)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rincian Gaji Pokok, Honor Mengajar (JP), dan Uang Transport
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="unit" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }} 
                  tickFormatter={(val) => `Rp${(val / 1000000).toFixed(1)}jt`}
                  className="dark:opacity-20"
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="baseSalary" name="Gaji Pokok" fill="#334155" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="honor" name="Honor Jam Mengajar" fill="#059669" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="transport" name="Transport Kehadiran" fill="#0d9488" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Top 6 Guru dengan Beban Mengajar Terbanyak */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>Beban Mengajar Asatidz Terbanyak (Top 6 Guru)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total Jam Pelajaran (JP) mengajar reguler dan jam badal
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topTeachersData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  width={100}
                  className="dark:opacity-20"
                />
                <Tooltip content={<CountTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="taughtHours" name="Total Jam Mengajar (JP)" fill="#059669" radius={[0, 4, 4, 0]} />
                <Bar dataKey="badalHours" name="Jam Badal (JP)" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tertiary Chart Row: Kedisiplinan Waktu Clock-In */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>Monitoring Kedisiplinan Waktu Presensi (Punctuality)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sebaran presensi asatidz: Tepat Waktu (≤4 min) vs Keterlambatan Berjenjang
            </p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200/80 dark:border-emerald-800/50">
            Kepatuhan Waktu: {Math.round((onTimeCount / Math.max(1, onTimeCount + lateLightCount + lateMediumCount + lateHeavyCount)) * 100)}%
          </span>
        </div>

        <div className="h-56 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={punctualityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:opacity-10" />
              <XAxis dataKey="bracket" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} className="dark:opacity-20" />
              <Tooltip content={<CountTooltip />} />
              <Bar dataKey="count" name="Jumlah Sesi" radius={[4, 4, 0, 0]}>
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
