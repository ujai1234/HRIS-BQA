import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  UserCheck, 
  FileText, 
  Calendar,
  X,
  Check,
  AlertTriangle,
  AlertCircle,
  CalendarOff,
  User,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { BadalAssignment, DayOfWeek, UnitType, isKepsekRole, getRoleUnit } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';
import { BadalReportModal } from './BadalReportModal';

export const BadalManagement: React.FC = () => {
  const { 
    teachers, 
    schedules, 
    badalAssignments, 
    createBadalAssignment,
    approveBadalAssignment,
    deleteBadalAssignment,
    currentUser,
    currentRole
  } = useHRIS();

  const isKepsek = isKepsekRole(currentRole);
  const isAdmin = currentRole === 'ADMIN';

  const userUnit = getRoleUnit(currentRole, currentUser?.unit);
  
  // Unit filter state
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | UnitType>(
    userUnit === 'ALL' ? 'ALL' : userUnit as UnitType
  );

  // Sub tab: 'daftar_penugasan' | 'cari_guru'
  const [activeTab, setActiveTab] = useState<'daftar_penugasan' | 'cari_guru'>('daftar_penugasan');

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'COMPLETED'>('ALL');

  // Inline selection of badal teacher for pending requests: badalId -> teacherId
  const [pendingBadalTeacherSelections, setPendingBadalTeacherSelections] = useState<Record<string, string>>({});

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalUnit, setModalUnit] = useState<UnitType>(userUnit === 'ALL' ? 'SMP' : userUnit as UnitType);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedOriginalTeacherId, setSelectedOriginalTeacherId] = useState('');
  const [selectedBadalTeacherId, setSelectedBadalTeacherId] = useState('');
  const [reason, setReason] = useState<BadalAssignment['reason']>('Sakit');
  const [notes, setNotes] = useState('');

  // Confirmation Modals State
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [badalToCancel, setBadalToCancel] = useState<BadalAssignment | null>(null);
  const [badalToApprove, setBadalToApprove] = useState<{ badal: BadalAssignment; badalTeacherId: string } | null>(null);
  const [showBadalReportModal, setShowBadalReportModal] = useState(false);
 
  // Finder Filter (for Smart Finder)
  const [finderDay, setFinderDay] = useState<DayOfWeek>('Senin');
  const [finderUnit, setFinderUnit] = useState<UnitType>(userUnit === 'ALL' ? 'SMP' : userUnit as UnitType);
  const [finderTimeSlot, setFinderTimeSlot] = useState<string>('ALL');

  // Calculate day of week from selectedDate
  const selectedDayOfWeek = useMemo<DayOfWeek>(() => {
    const d = new Date(selectedDate);
    const dayMap: DayOfWeek[] = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return dayMap[d.getDay()] || 'Senin';
  }, [selectedDate]);

  // Schedules available for modal based on selected date & unit
  const filteredModalSchedules = useMemo(() => {
    const targetUnit = userUnit === 'ALL' ? modalUnit : userUnit;
    return schedules.filter(s => {
      const matchUnit = s.unit === targetUnit;
      const matchDay = s.dayOfWeek === selectedDayOfWeek;
      return matchUnit && matchDay;
    });
  }, [schedules, modalUnit, selectedDayOfWeek, userUnit]);

  // Update schedule selection when modal unit or date changes
  const handleModalUnitOrDateChange = (newUnit: UnitType, newDate?: string) => {
    const effectiveUnit = userUnit === 'ALL' ? newUnit : (userUnit as UnitType);
    if (newDate) setSelectedDate(newDate);
    setModalUnit(effectiveUnit);
    
    const d = newDate ? new Date(newDate) : new Date(selectedDate);
    const dayMap: DayOfWeek[] = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = dayMap[d.getDay()] || 'Senin';

    const validScheds = schedules.filter(s => s.unit === effectiveUnit && s.dayOfWeek === day);
    if (validScheds.length > 0) {
      setSelectedScheduleId(validScheds[0].id);
      setSelectedOriginalTeacherId(validScheds[0].teacherId);
    } else {
      const fallback = schedules.find(s => s.unit === effectiveUnit);
      if (fallback) {
        setSelectedScheduleId(fallback.id);
        setSelectedOriginalTeacherId(fallback.teacherId);
      }
    }
  };

  const handleScheduleChange = (schedId: string) => {
    setSelectedScheduleId(schedId);
    const sched = schedules.find((s) => s.id === schedId);
    if (sched) {
      setSelectedOriginalTeacherId(sched.teacherId);
      if (selectedBadalTeacherId === sched.teacherId) {
        const otherTeacher = teachers.find(t => t.id !== sched.teacherId && t.isActive);
        if (otherTeacher) setSelectedBadalTeacherId(otherTeacher.id);
      }
    }
  };

  // Open modal with pre-selected teacher from Smart Finder
  const handleQuickAssignFromFinder = (teacherId: string, day: DayOfWeek, unit: UnitType) => {
    const targetUnit = userUnit === 'ALL' ? unit : (userUnit as UnitType);
    setModalUnit(targetUnit);
    const matchingSched = schedules.find(s => s.unit === targetUnit && s.dayOfWeek === day && s.teacherId !== teacherId);
    if (matchingSched) {
      setSelectedScheduleId(matchingSched.id);
      setSelectedOriginalTeacherId(matchingSched.teacherId);
    }
    setSelectedBadalTeacherId(teacherId);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      toast.error('Silakan pilih jadwal KBM yang akan digantikan');
      return;
    }
    if (!selectedBadalTeacherId) {
      toast.error('Silakan pilih guru pengganti (badal)');
      return;
    }
    if (selectedOriginalTeacherId === selectedBadalTeacherId) {
      toast.error('Guru pengganti tidak boleh sama dengan guru utama!');
      return;
    }
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    createBadalAssignment({
      date: selectedDate,
      scheduleId: selectedScheduleId,
      originalTeacherId: selectedOriginalTeacherId,
      badalTeacherId: selectedBadalTeacherId,
      reason,
      status: 'APPROVED',
      notes: notes.trim() || undefined,
    });

    toast.success('Penugasan guru badal berhasil ditetapkan dan disinkronkan');
    setShowSubmitConfirm(false);
    setShowAddModal(false);
    setNotes('');
  };

  const handleConfirmCancel = () => {
    if (!badalToCancel) return;
    deleteBadalAssignment(badalToCancel.id);
    toast.success('Penugasan / pengajuan izin badal berhasil dibatalkan');
    setBadalToCancel(null);
  };

  const handleApprovePendingItem = (badal: BadalAssignment) => {
    const sched = schedules.find(s => s.id === badal.scheduleId);
    const unitForSchedule = sched?.unit || 'SMP';
    
    // Find candidate teacher from state, or from item, or first available teacher in unit
    const chosenTeacherId = pendingBadalTeacherSelections[badal.id] || badal.badalTeacherId;
    if (!chosenTeacherId) {
      // Find suitable peer in unit
      const candidate = teachers.find(t => t.isActive && t.id !== badal.originalTeacherId && (t.unit === unitForSchedule || t.unit === 'PESANTREN'));
      if (candidate) {
        setBadalToApprove({ badal, badalTeacherId: candidate.id });
        return;
      }
      toast.error('Harap pilih guru pengganti (badal) terlebih dahulu sebelum menyetujui');
      return;
    }

    setBadalToApprove({ badal, badalTeacherId: chosenTeacherId });
  };

  const handleExecuteApprove = () => {
    if (!badalToApprove) return;
    approveBadalAssignment(badalToApprove.badal.id, badalToApprove.badalTeacherId);
    setBadalToApprove(null);
  };

  // Filtered Badal Assignments
  const filteredBadal = useMemo(() => {
    return badalAssignments.filter((b) => {
      const sched = schedules.find((s) => s.id === b.scheduleId);
      const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
      const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);

      const matchUnit = userUnit === 'ALL' 
        ? (selectedUnit === 'ALL' || (sched && sched.unit === selectedUnit))
        : (sched && sched.unit === userUnit);
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || (
        (sched?.subject && sched.subject.toLowerCase().includes(q)) ||
        (sched?.className && sched.className.toLowerCase().includes(q)) ||
        (origTeacher?.name && origTeacher.name.toLowerCase().includes(q)) ||
        (badalTeacher?.name && badalTeacher.name.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        (b.reason && b.reason.toLowerCase().includes(q))
      );

      return matchUnit && matchStatus && matchQuery;
    });
  }, [badalAssignments, schedules, teachers, selectedUnit, statusFilter, searchQuery, userUnit]);

  // Pending Leave Requests for the current scoped unit(s)
  const pendingLeaveRequests = useMemo(() => {
    return badalAssignments.filter((b) => {
      if (b.status !== 'PENDING') return false;
      const sched = schedules.find((s) => s.id === b.scheduleId);
      if (!sched) return false;
      if (userUnit === 'ALL') {
        return selectedUnit === 'ALL' || sched.unit === selectedUnit;
      }
      return sched.unit === userUnit;
    });
  }, [badalAssignments, schedules, selectedUnit, userUnit]);

  // Statistics
  const stats = useMemo(() => {
    const relevantList = userUnit === 'ALL'
      ? (selectedUnit === 'ALL' 
        ? badalAssignments 
        : badalAssignments.filter(b => schedules.find(s => s.id === b.scheduleId)?.unit === selectedUnit))
      : badalAssignments.filter(b => schedules.find(s => s.id === b.scheduleId)?.unit === userUnit);

    const totalSessions = relevantList.length;
    const totalJP = relevantList.reduce((acc, b) => {
      const sched = schedules.find(s => s.id === b.scheduleId);
      return acc + (sched ? sched.hours : 2);
    }, 0);

    const totalHonor = relevantList.reduce((acc, b) => {
      const sched = schedules.find(s => s.id === b.scheduleId);
      const teacher = teachers.find(t => t.id === b.badalTeacherId);
      const jp = sched ? sched.hours : 2;
      const rate = teacher ? teacher.hourlyRate : 40000;
      return acc + (jp * rate);
    }, 0);

    const smpCount = badalAssignments.filter(b => schedules.find(s => s.id === b.scheduleId)?.unit === 'SMP').length;
    const maCount = badalAssignments.filter(b => schedules.find(s => s.id === b.scheduleId)?.unit === 'MA').length;
    const ponpesCount = badalAssignments.filter(b => schedules.find(s => s.id === b.scheduleId)?.unit === 'PESANTREN').length;

    const approvedCount = relevantList.filter(b => b.status === 'APPROVED').length;
    const pendingCount = relevantList.filter(b => b.status === 'PENDING').length;
    const completedCount = relevantList.filter(b => b.status === 'COMPLETED').length;

    return {
      totalSessions,
      totalJP,
      totalHonor,
      approvedCount,
      pendingCount,
      completedCount,
      smpCount,
      maCount,
      ponpesCount
    };
  }, [badalAssignments, schedules, teachers, selectedUnit, userUnit]);

  // Smart Finder: Available teachers calculation
  const availableTeachersData = useMemo(() => {
    const effectiveUnit = userUnit === 'ALL' ? finderUnit : (userUnit as UnitType);
    const daySchedules = schedules.filter(s => s.dayOfWeek === finderDay && s.unit === effectiveUnit);
    
    const busyTeacherMap = new Map<string, string>();
    daySchedules.forEach(s => {
      if (finderTimeSlot === 'ALL' || s.startTime === finderTimeSlot) {
        busyTeacherMap.set(s.teacherId, `${s.subject} (${s.className}) [${s.startTime}-${s.endTime}]`);
      }
    });

    const activeTeachers = teachers.filter(t => {
      if (!t.isActive) return false;
      if (userUnit === 'ALL') {
        return t.unit === effectiveUnit || t.unit === 'PESANTREN' || t.unit === 'UMUM';
      } else {
        return t.unit === userUnit || (userUnit === 'PESANTREN' && (t.unit === 'PESANTREN' || t.unit === 'UMUM'));
      }
    });

    const available = activeTeachers.filter(t => !busyTeacherMap.has(t.id));
    const busy = activeTeachers.filter(t => busyTeacherMap.has(t.id)).map(t => ({
      ...t,
      busyReason: busyTeacherMap.get(t.id)
    }));

    return { available, busy };
  }, [teachers, schedules, finderDay, finderUnit, finderTimeSlot, userUnit]);

  return (
    <div className="space-y-6">
      {/* 1. Header and Context Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-sans">
                Penugasan Guru Pengganti
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                {isKepsek ? `Otoritas Kepala ${userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}` : 'Monitoring Admin (View-Only)'}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isKepsek 
                ? `Persetujuan izin guru dan penunjukan Asatidz Badal pengganti KBM Unit ${userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}` 
                : 'Monitoring & rekapitulasi data penugasan Guru Badal (Hak persetujuan & penunjukan dipegang Kepala Sekolah unit masing-masing)'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-export-pdf-badal"
              onClick={() => setShowBadalReportModal(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-all cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
              <span>Pratinjau & Unduh Laporan</span>
            </button>

            {isKepsek && (
              <button
                id="btn-tunjuk-badal-modal"
                onClick={() => {
                  handleModalUnitOrDateChange(userUnit === 'ALL' ? 'SMP' : userUnit as UnitType);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-[#1B4332] hover:bg-[#1B4332]/95 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Tunjuk Guru Pengganti</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Total Sesi Pengganti</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            {stats.totalSessions} <span className="text-xs font-normal text-stone-500 font-sans">Sesi</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            Penggantian KBM aktif
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Total Jam Mengajar</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            {stats.totalJP} <span className="text-xs font-normal text-stone-500 font-sans">JP</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            Beban JP teralihkan
          </span>
        </div>

        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Izin & Pengganti</span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-1">
            {stats.pendingCount} <span className="text-xs font-normal text-stone-500 font-sans">Pengajuan</span>
          </p>
          <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
            {isKepsek ? `Unit ${userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}` : 'Seluruh Unit'}
          </span>
        </div>

        {isKepsek ? (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Sesi Pengganti Disetujui</span>
            <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
              {stats.approvedCount} <span className="text-xs font-normal text-stone-500 font-sans">Sesi</span>
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
              Telah disahkan Kepala Unit
            </span>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Alokasi Kafa'ah Pengganti</span>
            <p className="text-xl sm:text-2xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(stats.totalHonor)}
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block font-mono">
              Honor pengganti KBM
            </span>
          </div>
        )}
      </div>

      {/* Admin Monitoring Banner */}
      {isAdmin && (
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-4 flex items-center gap-3 text-xs text-blue-900 dark:text-blue-200 shadow-xs">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="font-bold">Mode Monitoring Administrator (Read-Only)</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
              Fitur persetujuan pengajuan izin guru dan penunjukan guru pengganti (badal) secara penuh dipegang oleh Kepala Sekolah masing-masing unit (SMP, MA, Pesantren). Admin hanya dapat melihat rekapitulasi data Kafa'ah.
            </p>
          </div>
        </div>
      )}

      {/* 3. DEDICATED SECTION: PENGAJUAN IZIN GURU MENUNGGU PERSETUJUAN KEPALA SEKOLAH */}
      {isKepsek && pendingLeaveRequests.length > 0 && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-900/30 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <CalendarOff className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-amber-100 flex items-center gap-2">
                  <span>Pengajuan Izin Guru Menunggu Persetujuan</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                    {pendingLeaveRequests.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-amber-300/70">
                  Periksa jenis izin & keterangan guru di bawah ini, lalu pilih Guru Badal pengganti dan klik Setujui.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {pendingLeaveRequests.map((b) => {
              const sched = schedules.find((s) => s.id === b.scheduleId);
              const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
              const unitForSchedule = sched?.unit || 'SMP';
              
              // Teachers available in this unit
              const availablePeerTeachers = teachers.filter(
                (t) => t.isActive && t.id !== b.originalTeacherId && (userUnit === 'ALL' || t.unit === unitForSchedule || t.unit === 'PESANTREN')
              );

              const currentSelectedTeacherId = pendingBadalTeacherSelections[b.id] || b.badalTeacherId || (availablePeerTeachers[0]?.id || '');

              return (
                <div 
                  key={b.id} 
                  className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Teacher & Leave Information */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/40">
                        {b.reason}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700">
                        Unit {unitForSchedule}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-stone-300 font-mono">
                        {formatIndonesianDate(b.date)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <p className="text-xs text-slate-400 dark:text-stone-500">Guru yang Mengajukan Izin:</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-stone-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{origTeacher?.name || 'Guru Utama'}</span>
                          <span className="text-[11px] font-normal text-slate-500">({origTeacher?.position})</span>
                        </p>
                      </div>

                      <div className="sm:border-l sm:border-slate-200 dark:sm:border-stone-800 sm:pl-4">
                        <p className="text-xs text-slate-400 dark:text-stone-500">Mata Pelajaran & Sesi KBM:</p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-stone-200">
                          {sched?.subject} ({sched?.className}) • {sched?.startTime}-{sched?.endTime} WIB ({sched?.hours || 2} JP)
                        </p>
                      </div>
                    </div>

                    {/* Keterangan / Alasan Izin (Prominently Highlighted) */}
                    <div className="bg-slate-50 dark:bg-stone-800/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-stone-800 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-stone-300">Keterangan / Alasan: </span>
                      <span className="text-slate-600 dark:text-stone-400 italic">
                        "{b.notes || 'Tidak ada catatan tambahan'}"
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Guru Badal Selector & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:border-l lg:border-slate-200 dark:lg:border-stone-800 lg:pl-4 shrink-0">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-stone-400 block">
                        Tugaskan Guru Badal:
                      </label>
                      <select
                        value={currentSelectedTeacherId}
                        onChange={(e) => {
                          setPendingBadalTeacherSelections(prev => ({
                            ...prev,
                            [b.id]: e.target.value
                          }));
                        }}
                        className="w-full sm:w-56 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-slate-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">-- Pilih Guru Pengganti --</option>
                        {availablePeerTeachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.position} - {t.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-4">
                      <button
                        onClick={() => handleApprovePendingItem(b)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Setujui & Tugaskan</span>
                      </button>

                      <button
                        onClick={() => setBadalToCancel(b)}
                        title="Tolak / Hapus Pengajuan"
                        className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/40"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Navigation Subtabs (For Kepsek) */}
      {isKepsek && (
        <div className="flex items-center gap-1 border-b border-stone-200 dark:border-stone-800 pb-px">
            <button
            id="tab-daftar-badal"
            onClick={() => setActiveTab('daftar_penugasan')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daftar_penugasan'
                ? 'border-[#1B4332] text-[#1B4332] dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Daftar Penugasan Pengganti ({filteredBadal.length})
          </button>
          <button
            id="tab-cari-guru"
            onClick={() => setActiveTab('cari_guru')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === 'cari_guru'
                ? 'border-[#1B4332] text-[#1B4332] dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Smart Finder (Asatidz Luang)</span>
          </button>
        </div>
      )}

      {/* 5. CONTENT VIEW: DAFTAR PENUGASAN BADAL */}
      {(!isKepsek || activeTab === 'daftar_penugasan') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Unit Filter - For Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs overflow-x-auto max-w-full">
                {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shrink-0 ${
                      selectedUnit === unit
                        ? 'bg-white dark:bg-stone-900 text-[#1B4332] dark:text-emerald-400 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {unit === 'ALL' ? 'Semua Unit' : unit === 'PESANTREN' ? 'Pesantren' : unit}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input & Status Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Cari guru / mapel / alasan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-xs text-stone-700 dark:text-stone-300 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Persetujuan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="COMPLETED">Selesai KBM</option>
              </select>
            </div>
          </div>

          {/* Badal Records Table */}
          <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-50/75 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-200/70 dark:border-stone-700 text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Mata Pelajaran & Sesi</th>
                    <th className="py-3 px-4">Guru Utama (Izin)</th>
                    <th className="py-3 px-4">Jenis Izin & Keterangan</th>
                    <th className="py-3 px-4">Guru Pengganti</th>
                    {isKepsek ? (
                      <th className="py-3 px-4 text-center">Beban (JP)</th>
                    ) : (
                      <th className="py-3 px-4 text-right">Kafa'ah</th>
                    )}
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {filteredBadal.length === 0 ? (
                    <tr>
                      <td colSpan={isKepsek ? 9 : 9} className="py-12 text-center text-stone-400 dark:text-stone-500 font-medium">
                        Tidak ada catatan penugasan guru badal yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBadal.map((b) => {
                      const sched = schedules.find((s) => s.id === b.scheduleId);
                      const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                      const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
                      const jp = sched ? sched.hours : 2;
                      const badalRate = badalTeacher ? badalTeacher.hourlyRate : 40000;
                      const isApproved = b.status === 'APPROVED';
                      const isCompleted = b.status === 'COMPLETED';
                      const isPending = b.status === 'PENDING';

                      return (
                        <tr key={b.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-semibold text-stone-900 dark:text-stone-100">{formatIndonesianDate(b.date)}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/40">
                              {sched?.unit || 'SMP'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-stone-900 dark:text-stone-100">{sched?.subject || 'KBM'}</p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                              {sched?.className} • {sched?.startTime} - {sched?.endTime} ({jp} JP)
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-stone-800 dark:text-stone-200 font-medium">{origTeacher?.name || 'Guru Utama'}</p>
                            <span className="text-[10px] text-stone-400">{origTeacher?.position}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="inline-block text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40 px-2 py-0.5 rounded mb-1">
                              {b.reason}
                            </span>
                            {b.notes && (
                              <p className="text-[11px] text-stone-600 dark:text-stone-400 italic line-clamp-2">
                                "{b.notes}"
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {badalTeacher ? (
                              <div>
                                <p className="font-bold text-[#1B4332] dark:text-emerald-400">{badalTeacher.name}</p>
                                <span className="text-[10px] text-stone-400">{badalTeacher.position}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] italic text-amber-600 dark:text-amber-400">
                                Menunggu Penugasan
                              </span>
                            )}
                          </td>
                          {isKepsek ? (
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                              {jp} JP
                            </td>
                          ) : (
                            <td className="py-3.5 px-4 text-right font-mono text-[#1B4332] dark:text-emerald-400 font-bold whitespace-nowrap">
                              {formatRupiah(jp * badalRate)}
                            </td>
                          )}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${
                              isApproved 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50' 
                                : isCompleted 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/40' 
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50'
                            }`}>
                              {isApproved ? 'Disetujui Kepsek' : isCompleted ? 'Selesai KBM' : 'Menunggu Persetujuan'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isKepsek ? (
                              <div className="inline-flex items-center gap-1.5">
                                {isPending && (
                                  <button
                                    onClick={() => handleApprovePendingItem(b)}
                                    title="Setujui & Tugaskan Badal"
                                    className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer border border-emerald-200/60"
                                  >
                                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                                  </button>
                                )}
                                <button
                                  onClick={() => setBadalToCancel(b)}
                                  title="Batalkan Penugasan"
                                  className="p-1.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-stone-400 font-semibold italic">
                                Read-Only Admin
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONTENT VIEW: SMART FINDER */}
      {isKepsek && activeTab === 'cari_guru' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" strokeWidth={1.5} />
              <span>Pencocokan Jadwal Guru Kosong (Smart Finder)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Hari KBM</label>
                <select
                  value={finderDay}
                  onChange={(e) => setFinderDay(e.target.value as DayOfWeek)}
                  className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] as DayOfWeek[]).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Unit Sekolah</label>
                <select
                  value={finderUnit}
                  disabled={userUnit !== 'ALL'}
                  onChange={(e) => setFinderUnit(e.target.value as UnitType)}
                  className={`w-full px-2.5 py-2 rounded-lg border focus:outline-none transition-all ${
                    userUnit !== 'ALL'
                      ? 'bg-stone-100 dark:bg-stone-850 border-stone-200 dark:border-stone-850 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100'
                  }`}
                >
                  <option value="SMP">Unit SMP</option>
                  <option value="MA">Unit MA</option>
                  <option value="PESANTREN">Unit Pesantren</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Sesi Jam KBM</label>
                <select
                  value={finderTimeSlot}
                  onChange={(e) => setFinderTimeSlot(e.target.value)}
                  className="w-full px-2.5 py-2 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  <option value="ALL">Semua Jam Pelajaran</option>
                  <option value="07:30">07:30 - 08:50</option>
                  <option value="09:00">09:00 - 10:20</option>
                  <option value="10:30">10:30 - 11:50</option>
                  <option value="13:00">13:00 - 14:20</option>
                  <option value="14:30">14:30 - 15:50</option>
                  <option value="16:00">16:00 - 17:20</option>
                  <option value="18:30">18:30 - 19:30</option>
                  <option value="20:00">20:00 - 21:00</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results: Available Teachers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Daftar Guru Tersedia ({availableTeachersData.available.length} Asatidz)
              </h4>
              <span className="text-[11px] text-stone-500 font-medium">
                Hari {finderDay} • Unit {finderUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {availableTeachersData.available.map((t) => (
                <div 
                  key={t.id}
                  className="bg-white dark:bg-stone-900 p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 flex flex-col justify-between hover:border-[#1B4332] dark:hover:border-emerald-800 transition-all shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight">
                        {t.name}
                      </p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#1B4332]/10 text-[#1B4332] dark:text-emerald-400">
                        Luang
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {t.position} • {t.unit}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-1 font-mono">
                      NIP: {t.nip}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickAssignFromFinder(t.id, finderDay, finderUnit)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 bg-[#1B4332] hover:bg-[#1B4332]/95 text-white text-[11px] font-semibold py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>Tunjuk Sebagai Pengganti</span>
                  </button>
                </div>
              ))}
            </div>

            {availableTeachersData.available.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 text-xs text-stone-400">
                Seluruh guru pada unit ini sedang memiliki jadwal mengajar pada jam tersebut.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. ADD MANUAL BADAL MODAL */}
      {showAddModal && isKepsek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-2xs">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="px-5 py-4 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Penugasan Guru Pengganti
                </h3>
                <p className="text-[11px] text-stone-500">
                  Otoritas Kepala Sekolah Unit {modalUnit}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 p-1 rounded-lg hover:bg-stone-50"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Tanggal KBM</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleModalUnitOrDateChange(modalUnit, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Unit Sekolah</label>
                  {userUnit === 'ALL' ? (
                    <select
                      value={modalUnit}
                      onChange={(e) => handleModalUnitOrDateChange(e.target.value as UnitType)}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                    >
                      <option value="SMP">SMP IT</option>
                      <option value="MA">MA Al-Ikhwan</option>
                      <option value="PESANTREN">Pondok Pesantren</option>
                    </select>
                  ) : (
                    <div className="w-full px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 font-semibold text-stone-900 dark:text-stone-100">
                      Unit {userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                  Sesi Jadwal KBM ({selectedDayOfWeek})
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  required
                >
                  {filteredModalSchedules.length === 0 ? (
                    <option value="">Tidak ada jadwal {selectedDayOfWeek} di unit {userUnit === 'ALL' ? modalUnit : userUnit}</option>
                  ) : (
                    filteredModalSchedules.map((s) => {
                      const t = teachers.find((tch) => tch.id === s.teacherId);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.startTime}-{s.endTime} • {s.subject} ({s.className}) — Guru Utama: {t?.name}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">
                  Guru Pengganti Ditugaskan
                </label>
                <select
                  value={selectedBadalTeacherId}
                  onChange={(e) => setSelectedBadalTeacherId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  required
                >
                  <option value="">-- Pilih Guru Pengganti --</option>
                  {teachers
                    .filter((t) => {
                      if (!t.isActive || t.id === selectedOriginalTeacherId) return false;
                      if (userUnit !== 'ALL') {
                        return t.unit === userUnit || (userUnit === 'PESANTREN' && (t.unit === 'PESANTREN' || t.unit === 'UMUM'));
                      }
                      return true;
                    })
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.position} - {t.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Alasan Penggantian</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin Keperluan">Izin Keperluan</option>
                  <option value="Tugas Kedinasan Pesantren">Tugas Kedinasan Pesantren</option>
                  <option value="Urusan Mendesak">Urusan Mendesak</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 dark:text-stone-400 mb-1.5 font-medium">Amanah Materi KBM / Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Materi yang dititipkan atau instruksi tugas santri..."
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-150 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-850 cursor-pointer font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1B4332] hover:bg-[#1B4332]/95 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Lanjut ke Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL KONFIRMASI APPROVAL DARI KEPSEK */}
      {badalToApprove && (() => {
        const sched = schedules.find(s => s.id === badalToApprove.badal.scheduleId);
        const origTeacher = teachers.find(t => t.id === badalToApprove.badal.originalTeacherId);
        const badalTeacher = teachers.find(t => t.id === badalToApprove.badalTeacherId);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
              <div className="p-5 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4332]/10 text-[#1B4332] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Persetujuan Izin & Penugasan Pengganti
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Konfirmasi pengesahan izin guru dan guru pengganti
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBadalToApprove(null)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3.5 border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Tanggal KBM:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      {formatIndonesianDate(badalToApprove.badal.date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Utama (Izin):</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {origTeacher?.name} ({origTeacher?.position})
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Jenis Izin:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {badalToApprove.badal.reason}
                    </span>
                  </div>

                  {badalToApprove.badal.notes && (
                    <div className="pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400 block mb-0.5">Keterangan / Alasan:</span>
                      <p className="text-stone-700 dark:text-stone-300 italic font-sans">
                        "{badalToApprove.badal.notes}"
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Mapel & Sesi:</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {sched?.subject} ({sched?.className}) • {sched?.startTime}-{sched?.endTime} ({sched?.hours || 2} JP)
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Guru Pengganti:</span>
                    <span className="font-bold text-[#1B4332] dark:text-emerald-400">
                      {badalTeacher?.name || 'Belum dipilih'}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-lg p-3 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Setelah disetujui, penugasan ini akan otomatis masuk ke jadwal presensi guru pengganti dan dapat dimonitor oleh Admin.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBadalToApprove(null)}
                    className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteApprove}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Ya, Setujui & Tetapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 9. MODAL KONFIRMASI SUBMIT MANUAL BADAL */}
      {showSubmitConfirm && (() => {
        const sched = schedules.find(s => s.id === selectedScheduleId);
        const origTeacher = teachers.find(t => t.id === selectedOriginalTeacherId);
        const badalTeacher = teachers.find(t => t.id === selectedBadalTeacherId);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
              <div className="p-5 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#1B4332]/10 text-[#1B4332] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Konfirmasi Penugasan Pengganti
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Periksa kembali rincian data sebelum diterbitkan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubmitConfirm(false)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3.5 border border-stone-200/70 dark:border-stone-700/60 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Tanggal KBM:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      {formatIndonesianDate(selectedDate)} ({selectedDayOfWeek})
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Mata Pelajaran & Kelas:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {sched?.subject} ({sched?.className})
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Berhalangan:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {origTeacher?.name || 'Guru Utama'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Pengganti:</span>
                    <span className="font-bold text-[#1B4332] dark:text-emerald-400">
                      {badalTeacher?.name || 'Guru Badal'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Alasan:</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {reason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirm(false)}
                    className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium"
                  >
                    Periksa Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSubmit}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Ya, Tetapkan Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 10. MODAL KONFIRMASI PEMBATALAN BADAL */}
      {badalToCancel && (() => {
        const sched = schedules.find(s => s.id === badalToCancel.scheduleId);
        const origTeacher = teachers.find(t => t.id === badalToCancel.originalTeacherId);

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
              <div className="p-5 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Batalkan Penugasan / Pengajuan Pengganti?
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Konfirmasi pembatalan catatan penugasan guru pengganti
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBadalToCancel(null)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3.5 border border-stone-200/70 dark:border-stone-700/60 space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Tanggal KBM:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      {formatIndonesianDate(badalToCancel.date)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Utama:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {origTeacher?.name || 'Guru Utama'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Mata Pelajaran:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {sched?.subject} ({sched?.className})
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-lg p-3 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  Peringatan: Catatan penugasan ini akan dihapus dari antrean dan jadwal guru pengganti.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBadalToCancel(null)}
                    className="px-4 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer font-medium"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCancel}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Ya, Batalkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Badal Report Preview & Download Modal */}
      {showBadalReportModal && (
        <BadalReportModal
          badalList={filteredBadal}
          schedules={schedules}
          teachers={teachers}
          selectedUnit={selectedUnit}
          userUnit={userUnit}
          onClose={() => setShowBadalReportModal(false)}
        />
      )}
    </div>
  );
};
