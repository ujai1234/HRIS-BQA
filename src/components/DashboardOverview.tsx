import React from 'react';
import { 
  Building2, 
  Users, 
  Calendar, 
  CreditCard, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, getLateCategoryLabel } from '../utils/formatters';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ setActiveTab }) => {
  const { 
    teachers, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod, 
    calculateAllPayroll,
    currentUser,
    currentRole 
  } = useHRIS();

  const payrollSummary = calculateAllPayroll(selectedPeriod);

  // Quick stats
  const totalTeachers = teachers.length;
  const totalSchedules = schedules.length;
  const todayAttendances = attendances.filter(
    (a) => a.date === new Date().toISOString().split('T')[0]
  );
  const completedJournalsCount = attendances.filter((a) => a.status === 'SELESAI').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sistem HRIS & Payroll Pesantren</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Selamat Datang, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Unit: <strong className="text-slate-700">{currentUser.unit}</strong> • Posisi: <strong className="text-slate-700">{currentUser.position}</strong>. Kelola presensi KBM berbasis jurnal, delegasi guru badal, dan penggajian otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('teacher_workbench')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs"
          >
            <Clock className="w-4 h-4" />
            <span>Presensi & Jadwal Guru</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Rekap Payroll ({selectedPeriod})</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('master_teachers')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Asatidz / Guru
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalTeachers} Orang</p>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
            <span>Lihat Master Guru</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab('master_schedules')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Jadwal Mengajar
            </span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalSchedules} Sesi / Pekan</p>
          <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1 mt-1">
            <span>SMP, MA & Pesantren</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab('badal')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Guru Badal (Pengganti)
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{badalAssignments.length} Sesi</p>
          <span className="text-[11px] text-purple-700 font-medium flex items-center gap-1 mt-1">
            <span>Alokasi Honor Otomatis</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        <div
          onClick={() => setActiveTab('payroll')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Payroll ({selectedPeriod})
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800 mt-2">
            {formatRupiah(payrollSummary.totalNet)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
            <span>Lihat Rincian 23 Guru</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>

      {/* Operational Rules & Role Switcher Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Engine Box */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Aturan Sistem Presensi & Formula Payroll</span>
              </h3>
              <p className="text-xs text-slate-500">
                Formula resmi Pesantren Baitul Qur'an Al-Ikhwan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Rule 1: Earning Formula */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>1. Formula Penerimaan Gaji</span>
              </div>
              <div className="font-mono text-[11px] bg-white p-2.5 rounded-md border border-slate-200 text-emerald-800 font-medium">
                Total = Gaji Pokok + (Jam × Rp 40.000) + (Hadir × Rp 10.000)
              </div>
              <p className="text-slate-600 text-[11px]">
                Guru utama maupun guru badal mendapatkan honor jam mengajar @ Rp 40.000/JP.
              </p>
            </div>

            {/* Rule 2: Tardiness Bracket */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>2. Menit Keterlambatan Clock-In</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>≤ 4 menit:</span>
                  <strong className="text-emerald-700">Tepat Waktu (Rp 0)</strong>
                </div>
                <div className="flex justify-between">
                  <span>5 - 15 menit:</span>
                  <strong className="text-amber-700">Terlambat Ringan (-Rp 10.000)</strong>
                </div>
                <div className="flex justify-between">
                  <span>16 - 30 menit:</span>
                  <strong className="text-orange-700">Terlambat Sedang (-Rp 20.000)</strong>
                </div>
                <div className="flex justify-between">
                  <span>&gt; 30 menit:</span>
                  <strong className="text-rose-700">Terlambat Berat (-Rp 35.000)</strong>
                </div>
              </div>
            </div>

            {/* Rule 3: Jurnal Mengajar Requirement */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span>3. Kewajiban Jurnal Mengajar</span>
              </div>
              <p className="text-[11px] text-slate-700">
                Setelah Clock-in, status menjadi <strong>Hadir (Jurnal Kosong)</strong>. Wajib melengkapi uraian materi & presensi santri agar berubah menjadi <strong>Selesai</strong>.
              </p>
              <div className="font-mono text-[10px] bg-white p-2 rounded-md border border-slate-200 text-rose-700 font-semibold">
                Denda Jurnal Kosong = 50% × (Jam Mengajar × Rp 40.000)
              </div>
            </div>

            {/* Rule 4: Alpha / Alpa Deduction */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>4. Potongan Alpa Tanpa Izin</span>
              </div>
              <div className="font-mono text-[10px] bg-white p-2 rounded-md border border-slate-200 text-rose-800 font-medium">
                Potongan = Transport + Jam Mengajar + (5% Gaji Pokok)
              </div>
              <p className="text-[11px] text-slate-600">
                Dikenakan bila guru tidak hadir tanpa penunjukan badal atau surat izin sah.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Persona Uji & Role Guide */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Simulasi Uji Coba Peran (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Uji coba 3 persona di bilah atas aplikasi:
            </p>

            <div className="space-y-2.5 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800">1. Admin (Ust Akmal Yaqien)</p>
                <p className="text-[11px] text-slate-500">Kelola master 23 guru, jadwal, penunjukan guru badal, dan export payroll ke Excel/PDF.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800">2. Guru (Ust Fuad Arqom / Lainnya)</p>
                <p className="text-[11px] text-slate-500">Lihat jadwal hari ini, lakukan Clock-In dengan kalkulasi menit, isi Jurnal PBM, dan cetak Slip Gaji.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800">3. Kepala Pesantren (Ust Idwan/Tofan)</p>
                <p className="text-[11px] text-slate-500">Pantau audit ketaatan jurnal guru, kedisiplinan waktu, dan ringkasan anggaran belanja gaji.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('teacher_workbench')}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg shadow-xs transition-all mt-4"
          >
            <span>Buka Presensi & Jurnal Guru</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

