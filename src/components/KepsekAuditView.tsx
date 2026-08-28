import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  GraduationCap,
  Search,
  Filter,
  Eye,
  BookOpen,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  Printer,
  ChevronRight,
  X,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { UnitType, getRoleUnit } from '../types';

export const KepsekAuditView: React.FC = () => {
  const { 
    teachers,
    schedules,
    attendances, 
    selectedPeriod, 
    calculateAllPayroll,
    currentRole,
    currentUser
  } = useHRIS();

  const userUnit = getRoleUnit(currentRole, currentUser?.unit);
  const isAdmin = currentRole === 'ADMIN';

  // Unit filter state: locked if Kepsek, selectable if Admin
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | UnitType>(
    userUnit === 'ALL' ? 'ALL' : (userUnit as UnitType)
  );

  useEffect(() => {
    if (userUnit !== 'ALL') {
      setSelectedUnit(userUnit as UnitType);
    }
  }, [userUnit, currentRole]);

  const effectiveUnit = userUnit !== 'ALL' ? (userUnit as UnitType) : selectedUnit;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEED_SUPERVISION' | 'COMPLETED'>('ALL');
  
  // Detail Modal State
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<string | null>(null);

  // Unit-filtered master data
  const unitTeachers = useMemo(() => {
    if (effectiveUnit === 'ALL') return teachers;
    return teachers.filter(t => t.unit === effectiveUnit);
  }, [teachers, effectiveUnit]);

  const unitTeacherIds = useMemo(() => new Set(unitTeachers.map(t => t.id)), [unitTeachers]);

  const unitSchedules = useMemo(() => {
    if (effectiveUnit === 'ALL') return schedules;
    return schedules.filter(s => s.unit === effectiveUnit);
  }, [schedules, effectiveUnit]);

  const unitAttendances = useMemo(() => {
    if (effectiveUnit === 'ALL') return attendances;
    return attendances.filter(a => unitTeacherIds.has(a.teacherId) || unitTeacherIds.has(a.actualTeacherId));
  }, [attendances, unitTeacherIds, effectiveUnit]);

  // Scoped Payroll & Performance calculations
  const payrollSummary = useMemo(() => {
    return calculateAllPayroll(selectedPeriod, effectiveUnit);
  }, [calculateAllPayroll, selectedPeriod, effectiveUnit]);

  // Analytics for the selected unit
  const totalRecorded = unitAttendances.length;
  const completedJournals = unitAttendances.filter((a) => a.status === 'SELESAI' || !!a.journal).length;
  const pendingJournals = unitAttendances.filter((a) => 
    !a.journal && 
    a.status !== 'SELESAI' && 
    (a.status === 'HADIR_JURNAL_KOSONG' || (!!a.clockInTime && a.status !== 'IZIN' && a.status !== 'SAKIT' && a.status !== 'ALPA'))
  ).length;

  const totalEffectiveSessions = Math.max(1, completedJournals + pendingJournals);
  const journalComplianceRate = Math.min(100, Math.round((completedJournals / totalEffectiveSessions) * 100));

  const onTimeAttendance = unitAttendances.filter((a) => a.lateCategory === 'TEPAT_WAKTU').length;
  const punctualityRate = totalEffectiveSessions > 0 ? Math.round((onTimeAttendance / totalEffectiveSessions) * 100) : 94;
  const totalScheduledHours = unitSchedules.reduce((acc, s) => acc + s.hours, 0);

  // Filtered rows for the audit table
  const filteredItems = useMemo(() => {
    return payrollSummary.items.filter((item) => {
      if (!item.teacher) return false;
      
      // Search matching
      const matchesSearch = 
        item.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teacher.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.teacher.position.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Status filter
      const hasPendingJournal = item.emptyJournalCount > 0;
      if (statusFilter === 'NEED_SUPERVISION' && !hasPendingJournal) return false;
      if (statusFilter === 'COMPLETED' && hasPendingJournal) return false;

      return true;
    });
  }, [payrollSummary.items, searchQuery, statusFilter]);

  // Get selected teacher details for modal
  const selectedTeacherData = useMemo(() => {
    if (!selectedTeacherForDetail) return null;
    const teacher = teachers.find(t => t.id === selectedTeacherForDetail);
    const teacherRecords = unitAttendances.filter(a => a.teacherId === selectedTeacherForDetail || a.actualTeacherId === selectedTeacherForDetail);
    const teacherSchedules = unitSchedules.filter(s => s.teacherId === selectedTeacherForDetail);
    const payrollItem = payrollSummary.items.find(i => i.teacher?.id === selectedTeacherForDetail);

    return {
      teacher,
      records: teacherRecords,
      schedules: teacherSchedules,
      payroll: payrollItem
    };
  }, [selectedTeacherForDetail, teachers, unitAttendances, unitSchedules, payrollSummary]);

  const getUnitBadgeName = (unit: UnitType | 'ALL') => {
    switch (unit) {
      case 'MA': return 'MA Al-Ikhwan';
      case 'SMP': return 'SMP IT';
      case 'PESANTREN': return 'Pondok Pesantren';
      default: return 'Semua Unit';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Scoped Unit Banner */}
      <div className="bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200/80 dark:border-stone-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 dark:bg-stone-800 text-[#1B4332] dark:text-emerald-400 border border-stone-200 dark:border-stone-700">
                Unit: {getUnitBadgeName(effectiveUnit)}
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">• Periode: {selectedPeriod}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-sans">
              Monitoring Jurnal & Kedisiplinan KBM
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-2xl leading-relaxed">
              Audit kepatuhan pengisian jurnal mengajar harian, kehadiran santri, dan beban mengajar asatidz unit {getUnitBadgeName(effectiveUnit)}.
            </p>
          </div>

          {/* Unit Filter (Only if Admin) */}
          {isAdmin && (
            <div className="flex items-center bg-stone-50 dark:bg-stone-800/60 p-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs">
              <button
                onClick={() => setSelectedUnit('ALL')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedUnit === 'ALL'
                    ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedUnit('SMP')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedUnit === 'SMP'
                    ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                SMP IT
              </button>
              <button
                onClick={() => setSelectedUnit('MA')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedUnit === 'MA'
                    ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                MA
              </button>
              <button
                onClick={() => setSelectedUnit('PESANTREN')}
                className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedUnit === 'PESANTREN'
                    ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                }`}
              >
                Ponpes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Unit-Scoped KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Ketaatan Jurnal</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
            {journalComplianceRate}%
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            {completedJournals} terisi ({totalEffectiveSessions} sesi)
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Kedisiplinan Waktu</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            {punctualityRate}%
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            {onTimeAttendance} sesi tepat waktu
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Jurnal Tertunda</span>
          <p className={`text-2xl sm:text-3xl font-semibold font-mono tracking-tight mt-1 ${pendingJournals > 0 ? 'text-[#D97706]' : 'text-stone-900 dark:text-stone-100'}`}>
            {pendingJournals} <span className="text-xs font-normal text-stone-500 font-sans">Sesi</span>
          </p>
          <span className={`text-[11px] mt-1.5 block ${pendingJournals > 0 ? 'text-[#D97706]' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {pendingJournals > 0 ? 'Perlu supervisi harian' : 'Semua jurnal tuntas'}
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Pendidik Unit</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            {unitTeachers.length} <span className="text-xs font-normal text-stone-500 font-sans">Guru</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            {totalScheduledHours} JP Terjadwal / Pekan
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari nama / NIP guru ${effectiveUnit !== 'ALL' ? effectiveUnit : ''}...`}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:border-[#1B4332] dark:text-stone-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Semua ({payrollSummary.items.length})
            </button>
            <button
              onClick={() => setStatusFilter('NEED_SUPERVISION')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'NEED_SUPERVISION'
                  ? 'bg-white dark:bg-stone-900 text-[#D97706] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              Perlu Supervisi ({payrollSummary.items.filter(i => i.emptyJournalCount > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white dark:bg-stone-900 text-[#1B4332] shadow-xs'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]"></span>
              KBM Tuntas
            </button>
          </div>
        </div>
      </div>

      {/* 4. Leadership Audit Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/75 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-200/80 dark:border-stone-700 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Asatidz & NIP</th>
                <th className="py-3 px-4">Jabatan & Unit</th>
                <th className="py-3 px-4 text-center">Beban (JP)</th>
                <th className="py-3 px-4 text-center">Kehadiran</th>
                <th className="py-3 px-4 text-center">Kepatuhan Jurnal</th>
                <th className="py-3 px-4 text-center">Kedisiplinan Waktu</th>
                <th className="py-3 px-4 text-center">Status Supervisi</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400 dark:text-stone-500 font-medium">
                    Tidak ada data asatidz yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const hasPendingJournal = item.emptyJournalCount > 0;
                  const hasLate = item.lateCountLight > 0 || item.lateCountMedium > 0 || item.lateCountHeavy > 0;
                  const totalLateCount = item.lateCountLight + item.lateCountMedium + item.lateCountHeavy;

                  return (
                    <tr key={item.teacher?.id || index} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                      <td className="py-3.5 px-4 text-center text-stone-400 dark:text-stone-500 font-mono font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-stone-900 dark:text-stone-100">{item.teacher?.name || 'Guru'}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">NIP: {item.teacher?.nip || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-stone-800 dark:text-stone-200">{item.teacher?.position || '-'}</p>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-55 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/40 dark:border-stone-700/40">
                          {item.teacher?.unit || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                        {item.totalTaughtHours} JP
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-stone-700 dark:text-stone-300">
                        {item.totalPresentDays} Hari
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasPendingJournal ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/25">
                            {item.emptyJournalCount} Tertunda
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/25">
                            Lengkap
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasLate ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200/40 dark:border-rose-800/40">
                            {totalLateCount}x Terlambat
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
                            Disiplin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasPendingJournal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                            <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                            Perlu Supervisi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
                            <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                            KBM Tuntas
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedTeacherForDetail(item.teacher.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                          Rincian
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Detail Modal for Journal Audit */}
      {selectedTeacherData && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B4332]/10 text-[#1B4332] dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  {selectedTeacherData.teacher?.name.charAt(0) || 'G'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {selectedTeacherData.teacher?.name}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    NIP: {selectedTeacherData.teacher?.nip} • {selectedTeacherData.teacher?.position} ({selectedTeacherData.teacher?.unit})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacherForDetail(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-850 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-3 bg-stone-50 dark:bg-stone-850/50 p-4 rounded-lg border border-stone-250/60 dark:border-stone-800 text-xs">
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wide">Total Jam KBM</span>
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {selectedTeacherData.payroll?.totalTaughtHours || 0} JP
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wide">Kehadiran Mengajar</span>
                  <span className="text-base font-bold text-[#1B4332] dark:text-emerald-400 font-mono">
                    {selectedTeacherData.payroll?.totalPresentDays || 0} Hari
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 dark:text-stone-500 block text-[10px] uppercase font-bold tracking-wide">Jurnal Belum Terisi</span>
                  <span className={`text-base font-bold font-mono ${selectedTeacherData.payroll?.emptyJournalCount ? 'text-[#D97706]' : 'text-stone-650 dark:text-stone-300'}`}>
                    {selectedTeacherData.payroll?.emptyJournalCount || 0} Sesi
                  </span>
                </div>
              </div>

              {/* Journal Entries List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#52796F]" strokeWidth={1.5} />
                  Riwayat & Jurnal Pembelajaran KBM
                </h3>

                {selectedTeacherData.records.length === 0 ? (
                  <p className="text-xs text-stone-400 dark:text-stone-500 py-4 text-center font-medium">
                    Belum ada rekaman sesi tatap muka pada periode ini.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTeacherData.records.map((rec) => {
                      const sched = schedules.find(s => s.id === rec.scheduleId);
                      const hasJournal = !!rec.journal || rec.status === 'SELESAI';

                      return (
                        <div 
                          key={rec.id}
                          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 text-xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-stone-900 dark:text-stone-100">
                                {sched?.subject || 'Mata Pelajaran'} ({sched?.className || 'Kelas'})
                              </span>
                              <span className="text-stone-400 text-[10px] font-mono">
                                • {rec.date} {rec.clockInTime ? `(Hadir ${rec.clockInTime})` : ''}
                              </span>
                            </div>
                            <div>
                              {hasJournal ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/25">
                                  <CheckCircle2 className="w-3 h-3" strokeWidth={1.5} />
                                  Terisi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/25">
                                  <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                                  Tertunda
                                </span>
                              )}
                            </div>
                          </div>

                          {rec.journal ? (
                            <div className="bg-stone-50 dark:bg-stone-850 p-3 rounded border border-stone-200/50 dark:border-stone-850 space-y-1.5 text-stone-600 dark:text-stone-300">
                              <p><strong className="text-stone-900 dark:text-stone-100 font-semibold">Materi/Topik:</strong> {rec.journal.topic}</p>
                              {rec.journal.learningObjectives && (
                                <p><strong className="text-stone-900 dark:text-stone-100 font-semibold">Tujuan:</strong> {rec.journal.learningObjectives}</p>
                              )}
                              {rec.journal.classNotes && (
                                <p><strong className="text-stone-900 dark:text-stone-100 font-semibold">Catatan Kelas:</strong> {rec.journal.classNotes}</p>
                              )}
                              {rec.journal.studentAttendance && (
                                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-stone-500 dark:text-stone-400 font-mono border-t border-stone-200/40 dark:border-stone-700/40">
                                  <span>Total Santri: {rec.journal.studentAttendance.totalStudents}</span>
                                  <span className="text-[#1B4332] font-semibold">Hadir: {rec.journal.studentAttendance.presentCount}</span>
                                  <span>Sakit: {rec.journal.studentAttendance.sickCount}</span>
                                  <span>Izin: {rec.journal.studentAttendance.permittedCount}</span>
                                  <span className="text-rose-600 font-semibold">Alpa: {rec.journal.studentAttendance.absentCount}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded text-[11px] text-[#D97706] border border-[#D97706]/15 leading-relaxed">
                              Guru telah merekam kehadiran tatap muka tetapi belum melengkapi deskripsi topik materi serta presensi santri.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-150 dark:border-stone-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedTeacherForDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
