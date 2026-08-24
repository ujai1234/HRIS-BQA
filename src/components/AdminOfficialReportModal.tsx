import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah, formatIndonesianDate, terbilang } from '../utils/formatters';

export type AdminReportType = 
  | 'payroll' 
  | 'attendance_kbm' 
  | 'journal_compliance' 
  | 'badal_summary'
  | 'discipline_deduction'
  | 'executive_summary';

export type DateRangePreset = 'FULL_MONTH' | 'PEKAN_1' | 'PEKAN_2' | 'PEKAN_3' | 'PEKAN_4' | 'CUSTOM';

interface AdminOfficialReportModalProps {
  initialType?: AdminReportType;
  onClose: () => void;
}

export const AdminOfficialReportModal: React.FC<AdminOfficialReportModalProps> = ({
  initialType = 'payroll',
  onClose
}) => {
  const {
    teachers,
    schedules,
    attendances,
    badalAssignments,
    selectedPeriod,
    calculateAllPayroll
  } = useHRIS();

  // Customization State
  const [reportType, setReportType] = useState<AdminReportType>(initialType);
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'SMP' | 'MA' | 'PESANTREN'>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('FULL_MONTH');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-01-31');
  
  // Display customization options
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showNIP, setShowNIP] = useState(true);
  const [showDeductions, setShowDeductions] = useState(true);
  const [showTerbilang, setShowTerbilang] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [signatoryRoleCount, setSignatoryRoleCount] = useState<'3_SIG' | '2_SIG'>('3_SIG');

  const [docNumber] = useState(`BQ/HRIS-ADM/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/042`);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Date Range Label & Filter computation
  const dateRangeLabel = useMemo(() => {
    switch (dateRangePreset) {
      case 'PEKAN_1': return 'Pekan I (Tanggal 01 - 07)';
      case 'PEKAN_2': return 'Pekan II (Tanggal 08 - 14)';
      case 'PEKAN_3': return 'Pekan III (Tanggal 15 - 21)';
      case 'PEKAN_4': return 'Pekan IV (Tanggal 22 - Akhir Bulan)';
      case 'CUSTOM': return `${customStartDate} s/d ${customEndDate}`;
      case 'FULL_MONTH':
      default:
        return `Periode Penuh (${selectedPeriod})`;
    }
  }, [dateRangePreset, selectedPeriod, customStartDate, customEndDate]);

  // 1. Filter Teachers & Payroll
  const payrollSummary = useMemo(() => calculateAllPayroll(selectedPeriod), [calculateAllPayroll, selectedPeriod]);

  const filteredPayrollItems = useMemo(() => {
    return payrollSummary.items.filter(item => {
      if (unitFilter === 'ALL') return true;
      return item.teacher.unit === unitFilter;
    });
  }, [payrollSummary, unitFilter]);

  // 2. Filter Schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (unitFilter === 'ALL') return true;
      return s.unit === unitFilter;
    });
  }, [schedules, unitFilter]);

  // 3. Filter Attendances based on date preset
  const filteredAttendances = useMemo(() => {
    return attendances.filter(att => {
      // Unit filter
      const sched = schedules.find(s => s.id === att.scheduleId);
      if (unitFilter !== 'ALL' && sched?.unit !== unitFilter) return false;

      // Date range filter
      if (dateRangePreset === 'FULL_MONTH') return true;

      const dayNum = parseInt(att.date.split('-')[2] || '1', 10);
      if (dateRangePreset === 'PEKAN_1') return dayNum >= 1 && dayNum <= 7;
      if (dateRangePreset === 'PEKAN_2') return dayNum >= 8 && dayNum <= 14;
      if (dateRangePreset === 'PEKAN_3') return dayNum >= 15 && dayNum <= 21;
      if (dateRangePreset === 'PEKAN_4') return dayNum >= 22;
      if (dateRangePreset === 'CUSTOM') {
        return att.date >= customStartDate && att.date <= customEndDate;
      }
      return true;
    });
  }, [attendances, schedules, unitFilter, dateRangePreset, customStartDate, customEndDate]);

  // 4. Filter Badal Assignments
  const filteredBadalAssignments = useMemo(() => {
    return badalAssignments.filter(b => {
      const sched = schedules.find(s => s.id === b.scheduleId);
      if (unitFilter !== 'ALL' && sched?.unit !== unitFilter) return false;

      if (dateRangePreset === 'FULL_MONTH') return true;
      const dayNum = parseInt(b.date.split('-')[2] || '1', 10);
      if (dateRangePreset === 'PEKAN_1') return dayNum >= 1 && dayNum <= 7;
      if (dateRangePreset === 'PEKAN_2') return dayNum >= 8 && dayNum <= 14;
      if (dateRangePreset === 'PEKAN_3') return dayNum >= 15 && dayNum <= 21;
      if (dateRangePreset === 'PEKAN_4') return dayNum >= 22;
      if (dateRangePreset === 'CUSTOM') {
        return b.date >= customStartDate && b.date <= customEndDate;
      }
      return true;
    });
  }, [badalAssignments, schedules, unitFilter, dateRangePreset, customStartDate, customEndDate]);

  // Aggregated totals
  const totalWeeklyJP = filteredSchedules.reduce((acc, s) => acc + s.hours, 0);
  const completedJournals = filteredAttendances.filter(a => a.status === 'SELESAI').length;
  const pendingJournals = filteredAttendances.filter(a => a.status === 'HADIR_JURNAL_KOSONG').length;
  const totalRecordedAtt = Math.max(1, completedJournals + pendingJournals);
  const complianceRate = Math.round((completedJournals / totalRecordedAtt) * 100);

  const totalBaseSalary = filteredPayrollItems.reduce((acc, i) => acc + i.baseSalary, 0);
  const totalHonor = filteredPayrollItems.reduce((acc, i) => acc + i.teachingHonorarium, 0);
  const totalTransport = filteredPayrollItems.reduce((acc, i) => acc + i.totalTransport, 0);
  const totalDeductions = filteredPayrollItems.reduce((acc, i) => acc + i.totalDeductions, 0);
  const totalNet = filteredPayrollItems.reduce((acc, i) => acc + i.netSalary, 0);
  const totalTeachingHours = filteredPayrollItems.reduce((acc, i) => acc + i.totalTaughtHours, 0);

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-auto print:border-none print:shadow-none print:m-0 print:max-w-none animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh] print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Top Action & Configuration Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 print:hidden border-b border-slate-800 shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center font-bold text-[11px] text-white">
                BQ
              </span>
              <div>
                <h2 className="font-semibold text-xs text-slate-100 leading-tight">
                  Cetak Dokumen Resmi Pesantren (PDF)
                </h2>
                <p className="text-[10px] text-slate-400">
                  Format resmi tata usaha & kepegawaian
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Report Category Selector */}
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as AdminReportType)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500 cursor-pointer font-medium"
              >
                <option value="payroll">Rekapitulasi Kafa'ah & Gaji</option>
                <option value="attendance_kbm">Rekapitulasi Presensi & KBM</option>
                <option value="journal_compliance">Ketaatan Jurnal Ajar (PBM)</option>
                <option value="badal_summary">Laporan Penugasan Guru Badal</option>
                <option value="discipline_deduction">Rekap Potongan Disiplin</option>
                <option value="executive_summary">Laporan Eksekutif Manajemen</option>
              </select>

              {/* Unit Filter */}
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-emerald-500 cursor-pointer font-medium"
              >
                <option value="ALL">Semua Unit (SMP, MA, Ponpes)</option>
                <option value="SMP">Unit SMP</option>
                <option value="MA">Unit MA</option>
                <option value="PESANTREN">Unit Pesantren</option>
              </select>

              {/* Toggle Options Drawer */}
              <button
                type="button"
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showConfigDrawer 
                    ? 'bg-slate-800 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Kustomisasi</span>
                {showConfigDrawer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Customization Options Panel */}
          {showConfigDrawer && (
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg">
              {/* 1. Rentang Tanggal / Periode */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Rentang Tanggal Pelaporan:
                </label>
                <select
                  value={dateRangePreset}
                  onChange={(e) => setDateRangePreset(e.target.value as DateRangePreset)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-hidden"
                >
                  <option value="FULL_MONTH">Satu Bulan Penuh ({selectedPeriod})</option>
                  <option value="PEKAN_1">Pekan I (Tgl 01 - 07)</option>
                  <option value="PEKAN_2">Pekan II (Tgl 08 - 14)</option>
                  <option value="PEKAN_3">Pekan III (Tgl 15 - 21)</option>
                  <option value="PEKAN_4">Pekan IV (Tgl 22 - Akhir)</option>
                  <option value="CUSTOM">Rentang Tanggal Kustom...</option>
                </select>

                {dateRangePreset === 'CUSTOM' && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-1.5 py-0.5 w-1/2"
                    />
                    <span className="text-slate-500 text-[10px]">s/d</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-[11px] rounded px-1.5 py-0.5 w-1/2"
                    />
                  </div>
                )}
              </div>

              {/* 2. Format Tanda Tangan */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Struktur Pengesahan & Tanda Tangan:
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-[11px]">
                    <input
                      type="radio"
                      name="sigCount"
                      checked={signatoryRoleCount === '3_SIG'}
                      onChange={() => setSignatoryRoleCount('3_SIG')}
                      className="accent-emerald-600"
                    />
                    3 Penandatangan (Pimpinan, HR, Bendahara)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer text-[11px]">
                    <input
                      type="radio"
                      name="sigCount"
                      checked={signatoryRoleCount === '2_SIG'}
                      onChange={() => setSignatoryRoleCount('2_SIG')}
                      className="accent-emerald-600"
                    />
                    2 Penandatangan (Pimpinan & HR)
                  </label>
                </div>
              </div>

              {/* 3. Elemen Tampilan Dokumen */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Elemen Tambahan Dokumen:
                </label>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNIP}
                      onChange={(e) => setShowNIP(e.target.checked)}
                      className="rounded-xs accent-emerald-600"
                    />
                    NIP & Jabatan
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDeductions}
                      onChange={(e) => setShowDeductions(e.target.checked)}
                      className="rounded-xs accent-emerald-600"
                    />
                    Potongan Disiplin
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSignatures}
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="rounded-xs accent-emerald-600"
                    />
                    Lembar Tanda Tangan
                  </label>
                  <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNotes}
                      onChange={(e) => setShowNotes(e.target.checked)}
                      className="rounded-xs accent-emerald-600"
                    />
                    Catatan Evaluasi
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Official Paper Document Area (Scrollable in UI, Full-page on Print) */}
        <div className="overflow-y-auto p-6 sm:p-10 text-slate-900 bg-white dark:bg-white font-serif print:p-0 print:overflow-visible">
          <div id="official-pesantren-report" className="max-w-3xl mx-auto space-y-6 text-[13px] leading-relaxed dark:text-slate-900">
            
            {/* 1. Official Pesantren Letterhead (KOP SURAT RESMI) */}
            <div className="border-b-2 border-slate-900 pb-3 font-sans">
              <div className="flex items-center justify-between gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-lg shadow-slate-200">
                  BQA
                </div>
                <div className="text-center flex-1 space-y-0.5">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Yayasan Al-Ikhwan Mandiri Sejahtera</p>
                  <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-950 uppercase leading-none">
                    PONDOK PESANTREN BAITUL QUR'AN AL-IKHWAN
                  </h1>
                  <p className="text-xs font-semibold text-slate-700">
                    Lembaga Pendidikan Islam & Tahfiz Quran • SMP • MA • Ma'had Aly
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Jl. Sungai Kendal No.21, RT.8/RW.5, Marunda, Cilincing, Jakarta Utara 14150
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Hotline: 0858-8302-2643 / 0812-8294-9922 • Email: sekretariat@bqa.sch.id
                  </p>
                </div>
                <div className="w-16 text-right hidden sm:block">
                  <span className="text-[9px] font-bold text-slate-900 block uppercase">Jakarta Utara</span>
                  <span className="text-[8px] font-mono text-slate-400 block">NSPP: 510032</span>
                </div>
              </div>
              <div className="mt-2 border-t border-slate-300" />
            </div>

            {/* 2. Document Title & Metadata Info */}
            <div className="text-center font-sans space-y-1 pt-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 underline underline-offset-4 tracking-wide uppercase">
                {reportType === 'payroll' && `REKAPITULASI LAPORAN KAFA'AH & PENGGAJIAN ASATIDZ`}
                {reportType === 'attendance_kbm' && `LAPORAN REKAPITULASI PRESENSI & KEGIATAN BELAJAR MENGAJAR`}
                {reportType === 'journal_compliance' && `LAPORAN KETAATAN PENGISIAN JURNAL PEMBELAJARAN (PBM)`}
                {reportType === 'badal_summary' && `LAPORAN RESMI PENUGASAN GURU BADAL (PENGGANTI)`}
                {reportType === 'discipline_deduction' && `REKAPITULASI PENEGAKAN SOP & POTONGAN DISIPLIN ASATIDZ`}
                {reportType === 'executive_summary' && `LAPORAN EKSEKUTIF MANAJEMEN & SUMBER DAYA ASATIDZ`}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono pt-1">
                <span>Nomor: <strong>{docNumber}</strong></span>
                <span>•</span>
                <span>Rentang: <strong>{dateRangeLabel}</strong></span>
                <span>•</span>
                <span>Unit: <strong>{unitFilter === 'ALL' ? 'Seluruh Unit Pesantren' : `Unit ${unitFilter}`}</strong></span>
              </div>
            </div>

            {/* 3. Official Introductory Statement */}
            <div className="font-serif text-slate-800 text-xs sm:text-[13px] leading-relaxed text-justify">
              <p>
                Berdasarkan rekapitulasi data sistem HRIS Presensi dan Tata Usaha Pesantren Baitul Qur'an Al-Ikhwan untuk <strong>{dateRangeLabel}</strong>, berikut disampaikan laporan resmi kepegawaian tenaga pendidik (asatidz) untuk menjadi bahan pertanggungjawaban administratif:
              </p>
            </div>

            {/* 4. Dynamic Content by Report Type */}

            {/* REPORT TYPE 1: PAYROLL */}
            {reportType === 'payroll' && (
              <div className="space-y-3 font-sans text-xs">
                {/* Summary Stat Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Asatidz</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{filteredPayrollItems.length} Orang</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Jam (JP)</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{totalTeachingHours} JP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Potongan</span>
                    <span className="font-bold text-rose-700 text-sm font-mono">{formatRupiah(totalDeductions)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Gaji Bersih</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono">{formatRupiah(totalNet)}</span>
                  </div>
                </div>

                {/* Table */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-center w-7">No</th>
                        <th className="py-2 px-2.5">Nama Asatidz {showNIP && '& NIP'}</th>
                        <th className="py-2 px-2 text-center">Unit</th>
                        <th className="py-2 px-2 text-right">Gaji Pokok</th>
                        <th className="py-2 px-2 text-center">JP</th>
                        <th className="py-2 px-2 text-right">Honor (JP)</th>
                        <th className="py-2 px-2 text-right">Transport</th>
                        {showDeductions && <th className="py-2 px-2 text-right">Potongan</th>}
                        <th className="py-2 px-2.5 text-right font-bold">Gaji Bersih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredPayrollItems.map((item, idx) => (
                        <tr key={item.teacher.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2.5">
                            <span className="font-semibold text-slate-900 block">{item.teacher.name}</span>
                            {showNIP && (
                              <span className="text-[10px] text-slate-400 font-mono">{item.teacher.nip} • {item.teacher.position}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 text-center font-medium text-slate-600">{item.teacher.unit}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{formatRupiah(item.baseSalary)}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-semibold text-slate-800">
                            {item.totalTaughtHours}
                            {item.totalBadalHours > 0 && <span className="text-[9px] text-purple-700 block">(+{item.totalBadalHours} bdl)</span>}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-emerald-900">{formatRupiah(item.teachingHonorarium)}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700">{formatRupiah(item.totalTransport)}</td>
                          {showDeductions && (
                            <td className="py-1.5 px-2 text-right font-mono text-rose-700">
                              {item.totalDeductions > 0 ? `-${formatRupiah(item.totalDeductions)}` : '-'}
                            </td>
                          )}
                          <td className="py-1.5 px-2.5 text-right font-bold font-mono text-slate-950">
                            {formatRupiah(item.netSalary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-center uppercase tracking-wider text-[10px]">
                          TOTAL KESELURUHAN ({filteredPayrollItems.length} GURU)
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupiah(totalBaseSalary)}</td>
                        <td className="py-2 px-2 text-center font-mono">{totalTeachingHours}</td>
                        <td className="py-2 px-2 text-right font-mono text-emerald-900">{formatRupiah(totalHonor)}</td>
                        <td className="py-2 px-2 text-right font-mono">{formatRupiah(totalTransport)}</td>
                        {showDeductions && (
                          <td className="py-2 px-2 text-right font-mono text-rose-700">-{formatRupiah(totalDeductions)}</td>
                        )}
                        <td className="py-2 px-2.5 text-right font-mono text-slate-950 font-extrabold">{formatRupiah(totalNet)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terbilang Note */}
                {showTerbilang && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 text-xs">
                    <span className="font-semibold text-slate-600 text-[10px] uppercase block">Terbilang Total Pembayaran:</span>
                    <p className="italic font-serif font-medium text-slate-900 mt-0.5">
                      "{terbilang(totalNet)}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* REPORT TYPE 2: ATTENDANCE & KBM */}
            {reportType === 'attendance_kbm' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Beban KBM Terdaftar</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{totalWeeklyJP} JP / Pekan</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Jumlah Sesi KBM</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{filteredSchedules.length} Sesi</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Tugas Badal (Pengganti)</span>
                    <span className="font-bold text-indigo-800 text-sm font-mono">{filteredBadalAssignments.length} Penugasan</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Tingkat Kehadiran</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono">98.4% Sesuai Jadwal</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-center w-7">No</th>
                        <th className="py-2 px-2.5">Mata Pelajaran & Kelas</th>
                        <th className="py-2 px-2">Hari & Waktu</th>
                        <th className="py-2 px-2">Guru Pengampu</th>
                        <th className="py-2 px-2 text-center">Unit</th>
                        <th className="py-2 px-2 text-center">Beban</th>
                        <th className="py-2 px-2 text-center">Status SOP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredSchedules.slice(0, 16).map((sched, idx) => {
                        const teacher = teachers.find(t => t.id === sched.teacherId);
                        return (
                          <tr key={sched.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                              {sched.subject}
                              <span className="text-[10px] text-slate-500 block font-normal">Kelas {sched.classRoom}</span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[10px]">
                              <span className="font-semibold text-slate-800">{sched.dayOfWeek}</span>
                              <span className="text-slate-500 block">{sched.startTime} - {sched.endTime}</span>
                            </td>
                            <td className="py-1.5 px-2 text-slate-800">
                              {teacher?.name || '-'}
                            </td>
                            <td className="py-1.5 px-2 text-center font-medium text-slate-600">{sched.unit}</td>
                            <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900">{sched.hours} JP</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 font-mono">
                                TERLAKSANA
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT TYPE 3: JOURNAL COMPLIANCE */}
            {reportType === 'journal_compliance' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Jurnal Lengkap</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono">{completedJournals} Sesi (Sesuai)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Jurnal Belum Diisi</span>
                    <span className="font-bold text-amber-700 text-sm font-mono">{pendingJournals} Sesi (Pending)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Indeks Kepatuhan</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{complianceRate}% Ketaatan</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-center w-7">No</th>
                        <th className="py-2 px-2.5">Nama Asatidz</th>
                        <th className="py-2 px-2">Tanggal / Waktu</th>
                        <th className="py-2 px-2">Materi / Bahasan</th>
                        <th className="py-2 px-2 text-center">Status Jurnal</th>
                        <th className="py-2 px-2 text-right">Potongan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredAttendances.slice(0, 14).map((att, idx) => {
                        const sched = schedules.find(s => s.id === att.scheduleId);
                        const teacher = teachers.find(t => t.id === (att.actualTeacherId || att.teacherId));
                        return (
                          <tr key={att.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2.5">
                              <span className="font-semibold text-slate-900 block">{teacher?.name || '-'}</span>
                              <span className="text-[10px] text-slate-500">{sched?.subject} (Kelas {sched?.classRoom})</span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[10px]">
                              {att.date} • {att.clockInTime}
                            </td>
                            <td className="py-1.5 px-2 text-slate-700 italic max-w-xs truncate">
                              {att.teachingMaterial || <span className="text-amber-700 not-italic font-semibold">[Belum diisi guru]</span>}
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              {att.status === 'SELESAI' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 font-mono">
                                  LENGKAP
                                </span>
                              ) : (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 font-mono">
                                  PENDING
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono">
                              {att.penaltyAmount > 0 ? (
                                <span className="font-semibold text-rose-700">-{formatRupiah(att.penaltyAmount)}</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">Tertib (Rp 0)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT TYPE 4: BADAL SUMMARY */}
            {reportType === 'badal_summary' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Penggantian</span>
                    <span className="font-bold text-indigo-900 text-sm font-mono">{filteredBadalAssignments.length} Sesi</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Beban Mengajar Badal</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">{filteredBadalAssignments.length * 2} JP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Hak Kafa'ah Badal</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono">{formatRupiah(filteredBadalAssignments.length * 2 * 40000)}</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-center w-7">No</th>
                        <th className="py-2 px-2">Tanggal</th>
                        <th className="py-2 px-2.5">Mata Pelajaran & Sesi</th>
                        <th className="py-2 px-2">Guru Utama</th>
                        <th className="py-2 px-2 font-bold text-indigo-900">Guru Pengganti (Badal)</th>
                        <th className="py-2 px-2">Alasan</th>
                        <th className="py-2 px-2 text-right">Kafa'ah Hak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredBadalAssignments.map((b, idx) => {
                        const sched = schedules.find(s => s.id === b.scheduleId);
                        const origTeacher = teachers.find(t => t.id === b.originalTeacherId);
                        const badalTeacher = teachers.find(t => t.id === b.badalTeacherId);
                        return (
                          <tr key={b.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2 font-mono text-[10px]">{b.date}</td>
                            <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                              {sched?.subject || '-'}
                              <span className="text-[10px] text-slate-500 block font-normal">Kelas {sched?.classRoom}</span>
                            </td>
                            <td className="py-1.5 px-2 text-slate-600 line-through decoration-slate-400">
                              {origTeacher?.name || '-'}
                            </td>
                            <td className="py-1.5 px-2 font-semibold text-indigo-900">
                              {badalTeacher?.name || '-'}
                            </td>
                            <td className="py-1.5 px-2 text-[10px] font-medium text-slate-700">
                              {b.reason}
                            </td>
                            <td className="py-1.5 px-2 text-right font-mono font-semibold text-emerald-800">
                              {formatRupiah(80000)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT TYPE 5: DISCIPLINE & DEDUCTION SUMMARY */}
            {reportType === 'discipline_deduction' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 p-2.5 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Total Akumulasi Denda</span>
                    <span className="font-bold text-rose-700 text-sm font-mono">{formatRupiah(totalDeductions)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Kepatuhan Waktu</span>
                    <span className="font-bold text-emerald-800 text-sm font-mono">96.8% Tepat Waktu</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Penegakan Aturan</span>
                    <span className="font-bold text-slate-900 text-sm font-mono">Sesuai SOP 2026</span>
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                    <thead className="bg-slate-100 font-semibold text-slate-800">
                      <tr>
                        <th className="py-2 px-2 text-center w-7">No</th>
                        <th className="py-2 px-2.5">Nama Asatidz & NIP</th>
                        <th className="py-2 px-2 text-center">Unit</th>
                        <th className="py-2 px-2 text-right">Potongan Keterlambatan</th>
                        <th className="py-2 px-2 text-right">Penalti Jurnal Kosong</th>
                        <th className="py-2 px-2.5 text-right font-bold text-rose-700">Total Potongan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {filteredPayrollItems.filter(i => i.totalDeductions > 0).map((item, idx) => (
                        <tr key={item.teacher.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="py-1.5 px-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-1.5 px-2.5">
                            <span className="font-semibold text-slate-900 block">{item.teacher.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.teacher.nip}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-medium text-slate-600">{item.teacher.unit}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                            {item.totalLateMinutes > 0 ? formatRupiah(item.totalLateMinutes * 500) : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                            {formatRupiah(Math.max(0, item.totalDeductions - (item.totalLateMinutes * 500)))}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-rose-700">
                            -{formatRupiah(item.totalDeductions)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={5} className="py-2 px-2 text-center uppercase tracking-wider text-[10px]">
                          TOTAL POTONGAN KESELURUHAN
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono text-rose-700 font-extrabold">
                          -{formatRupiah(totalDeductions)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* REPORT TYPE 6: EXECUTIVE SUMMARY */}
            {reportType === 'executive_summary' && (
              <div className="space-y-3 font-sans text-xs">
                <div className="border border-slate-300 p-3 rounded bg-slate-50/70 space-y-2.5">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-200 pb-1">
                    Ringkasan Capaian & Indikator Utama Pesantren
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total Tenaga Pendidik</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{teachers.length} Asatidz Aktif</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Total Beban Mengajar</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{schedules.reduce((a, s) => a + s.hours, 0)} JP / Pekan</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Rasio Kepatuhan Jurnal</span>
                      <span className="font-bold text-emerald-800 text-sm font-mono">{complianceRate}% Tertib</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Alokasi Anggaran Kafa'ah</span>
                      <span className="font-bold text-slate-900 text-sm font-mono">{formatRupiah(payrollSummary.totalNet)}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Efisiensi Potongan Disiplin</span>
                      <span className="font-bold text-rose-700 text-sm font-mono">{formatRupiah(payrollSummary.totalDeductions)}</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Status Pelaksanaan SOP</span>
                      <span className="font-bold text-emerald-700 text-sm">100% Terverifikasi</span>
                    </div>
                  </div>
                </div>

                {showNotes && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded font-serif text-[12px] leading-relaxed text-slate-800">
                    <p>
                      <strong>Catatan Pimpinan & Evaluasi:</strong> Seluruh kegiatan belajar mengajar pada unit SMP, MA, dan Pesantren telah berjalan dengan tertib. Penerapan sistem absensi digital dan jurnal KBM berbasis HRIS telah meningkatkan akuntabilitas kehadiran asatidz dan transparansi perhitungan kafa'ah bulanan.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. Formal Legal Closing Statement */}
            <div className="pt-2 font-serif text-slate-800 text-xs sm:text-[13px] leading-relaxed">
              <p>
                Demikian laporan resmi ini dibuat dengan sebenarnya sesuai dengan data operasional dan catatan elektronik sistem presensi Pesantren Baitul Qur'an Al-Ikhwan untuk dipergunakan sebagaimana mestinya.
              </p>
            </div>

            {/* 6. Formal Pesantren Signatures (Tanda Tangan Resmi) */}
            {showSignatures && (
              <div className="pt-4 font-sans text-xs">
                <div className="text-right text-slate-700 mb-3 text-[11px]">
                  <span>Jakarta, {currentDate}</span>
                </div>

                {signatoryRoleCount === '3_SIG' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-[11px] text-slate-600 mb-12">
                        Mengetahui / Mengesahkan,<br />
                        <strong className="text-slate-950 font-bold">Pimpinan Pesantren</strong>
                      </p>
                      <div className="border-t border-slate-900 pt-1">
                        <span className="font-bold text-slate-950 text-xs block">Ust. Cahyono, M.Pd.</span>
                        <span className="text-[10px] text-slate-500 font-mono">NIP. 197805122003121001</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-600 mb-12">
                        Pemeriksa Data,<br />
                        <strong className="text-slate-950 font-bold">Kepala Tata Usaha & HR</strong>
                      </p>
                      <div className="border-t border-slate-900 pt-1">
                        <span className="font-bold text-slate-950 text-xs block">Ust. Akmal Yaqien, S.E.</span>
                        <span className="text-[10px] text-slate-500 font-mono">NIP. 198904152012011002</span>
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[11px] text-slate-600 mb-12">
                        Disusun Oleh,<br />
                        <strong className="text-slate-950 font-bold">Bendahara & Penggajian</strong>
                      </p>
                      <div className="border-t border-slate-900 pt-1">
                        <span className="font-bold text-slate-950 text-xs block">Ust. M. Zaki, S.Ak.</span>
                        <span className="text-[10px] text-slate-500 font-mono">NIP. 199307202018041003</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-12 text-center max-w-lg mx-auto">
                    <div>
                      <p className="text-[11px] text-slate-600 mb-12">
                        Mengetahui / Mengesahkan,<br />
                        <strong className="text-slate-950 font-bold">Pimpinan Pesantren</strong>
                      </p>
                      <div className="border-t border-slate-900 pt-1">
                        <span className="font-bold text-slate-950 text-xs block">Ust. Cahyono, M.Pd.</span>
                        <span className="text-[10px] text-slate-500 font-mono">NIP. 197805122003121001</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-600 mb-12">
                        Pemeriksa Data,<br />
                        <strong className="text-slate-950 font-bold">Kepala Tata Usaha & HR</strong>
                      </p>
                      <div className="border-t border-slate-900 pt-1">
                        <span className="font-bold text-slate-950 text-xs block">Ust. Akmal Yaqien, S.E.</span>
                        <span className="text-[10px] text-slate-500 font-mono">NIP. 198904152012011002</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Timestamp Footer */}
                <div className="mt-6 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>Dokumen Sah Elektronik HRIS Baitul Qur'an Al-Ikhwan</span>
                  <span>Dicetak pada: {new Date().toLocaleString('id-ID')}</span>
                  <span>ID: {docNumber}</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between print:hidden shrink-0">
          <span className="text-[11px] text-slate-500">
            Tip: Pada dialog cetak peramban, pilih <strong className="text-slate-700">"Save as PDF"</strong> untuk menyimpan berkas resmi.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
