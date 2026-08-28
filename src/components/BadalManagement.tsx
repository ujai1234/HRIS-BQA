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
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  
  // Kepsek default unit
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | UnitType>(
    userUnit === 'ALL' ? 'ALL' : userUnit as UnitType
  );

  // Sub tab for Kepsek: 'daftar_penugasan' | 'cari_guru'
  const [activeTab, setActiveTab] = useState<'daftar_penugasan' | 'cari_guru'>('daftar_penugasan');

  // Filter and Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'COMPLETED'>('ALL');

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
  const [badalToApprove, setBadalToApprove] = useState<BadalAssignment | null>(null);
  const [showBadalReportModal, setShowBadalReportModal] = useState(false);
 
  // Finder Filter (for Kepsek Smart Finder)
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
      // fallback to any schedule in unit
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
      // If currently selected badal teacher is the same as original teacher, pick someone else
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
    // Find matching schedule for day in unit
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

    // Open confirmation dialog before actual execution
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    createBadalAssignment({
      date: selectedDate,
      scheduleId: selectedScheduleId,
      originalTeacherId: selectedOriginalTeacherId,
      badalTeacherId: selectedBadalTeacherId,
      reason,
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
    toast.success('Penugasan guru badal berhasil dibatalkan');
    setBadalToCancel(null);
  };

  const handleConfirmApprove = () => {
    if (!badalToApprove) return;
    approveBadalAssignment(badalToApprove.id);
    setBadalToApprove(null);
  };

  // Filtered Badal Assignments strictly scoped for Kepsek
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

  // Statistics strictly scoped to active unit
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
    
    // Busy teacher IDs at selected time slot
    const busyTeacherMap = new Map<string, string>(); // teacherId -> schedule summary
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

  // Export PDF (Admin or Kepsek formal report)
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const scopeTitle = selectedUnit === 'ALL' 
        ? 'Seluruh Unit (SMP, MA, Pesantren)' 
        : `Unit ${selectedUnit}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("PESANTREN BAITUL QUR'AN AL-IKHWAN", 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("Rekapitulasi Penugasan & Kafa'ah Guru Pengganti (Badal KBM)", 14, 24);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${todayStr}`, 14, 34);
      doc.text(`Lingkup: ${scopeTitle}`, 110, 34);
      doc.text(`Otoritas: ${currentUser?.name || 'Administrator'} (${currentUser?.position || 'Pengelola'})`, 14, 39);
      doc.text(`Total Penugasan: ${filteredBadal.length} Sesi (${stats.totalJP} JP)`, 110, 39);

      const tableRows = filteredBadal.map((b, idx) => {
        const sched = schedules.find((s) => s.id === b.scheduleId);
        const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
        const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
        const jp = sched ? sched.hours : 2;
        const rate = badalTeacher ? badalTeacher.hourlyRate : 40000;

        return [
          String(idx + 1),
          formatIndonesianDate(b.date),
          sched?.unit || '-',
          `${sched?.subject || 'KBM'} (${sched?.className || '-'})`,
          origTeacher?.name || '-',
          badalTeacher?.name || '-',
          b.reason,
          `${jp} JP`,
          formatRupiah(jp * rate),
          b.status === 'COMPLETED' ? 'Selesai' : b.status === 'APPROVED' ? 'Disetujui' : 'Menunggu'
        ];
      });

      autoTable(doc, {
        startY: 44,
        head: [['No', 'Tanggal', 'Unit', 'Mapel & Kelas', 'Guru Utama', 'Guru Badal', 'Alasan', 'JP', 'Kafa’ah', 'Status']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', '-', 'Tidak ada data penugasan badal', '-', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [27, 67, 50],
          textColor: [255, 255, 255],
          fontSize: 7.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 2.5
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [30, 41, 59],
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 18 },
          2: { cellWidth: 12 },
          3: { cellWidth: 32 },
          4: { cellWidth: 28 },
          5: { cellWidth: 28 },
          6: { cellWidth: 20 },
          7: { cellWidth: 11, halign: 'center' },
          8: { cellWidth: 20, halign: 'right' },
          9: { cellWidth: 16 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = (doc as any).internal.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Halaman ${data.pageNumber} dari ${pageCount} • Baitul Qur'an HRIS`,
            14,
            doc.internal.pageSize.height - 10
          );
        }
      });

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`Rekap_Guru_Badal_BQ_${fileDate}.pdf`);
      toast.success('Laporan rekapitulasi guru badal berhasil diunduh');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and Context Banner */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-sans">
              Penugasan Guru Badal
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {isKepsek 
                ? `Manajemen penugasan guru pengganti Unit ${userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}` 
                : 'Pencatatan dan rekapitulasi guru pengganti KBM'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download / Preview PDF button */}
            <button
              id="btn-export-pdf-badal"
              onClick={() => setShowBadalReportModal(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
              <span>Pratinjau & Unduh Laporan</span>
            </button>

            {/* Action for Kepsek Only */}
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
                <span>Tunjuk Guru Badal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Total Sesi Badal</span>
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

        {isKepsek ? (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Badal Disetujui</span>
            <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
              {stats.approvedCount} <span className="text-xs font-normal text-stone-500 font-sans">Sesi</span>
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
              Telah disahkan Kepala Unit
            </span>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Alokasi Kafa'ah</span>
            <p className="text-xl sm:text-2xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1 truncate">
              {formatRupiah(stats.totalHonor)}
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block font-mono">
              Honor pengganti KBM
            </span>
          </div>
        )}

        {isKepsek ? (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Menunggu Konfirmasi</span>
            <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingCount} <span className="text-xs font-normal text-stone-500 font-sans">Sesi</span>
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
              Unit {userUnit === 'PESANTREN' ? 'Pesantren' : userUnit}
            </span>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block">Distribusi Unit</span>
            <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mt-2">
              SMP: <strong className="font-mono text-stone-900 dark:text-stone-100">{stats.smpCount}</strong> • MA: <strong className="font-mono text-stone-900 dark:text-stone-100">{stats.maCount}</strong> • Ponpes: <strong className="font-mono text-stone-900 dark:text-stone-100">{stats.ponpesCount}</strong>
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5 block">
              Rincian per jenjang
            </span>
          </div>
        )}
      </div>

      {/* 3. Navigation Subtabs (For Kepsek) */}
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
            Daftar Penugasan Badal ({filteredBadal.length})
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

      {/* 4. CONTENT VIEW: DAFTAR PENUGASAN BADAL */}
      {(!isKepsek || activeTab === 'daftar_penugasan') && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Unit Filter - Only show for Admin */}
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
                  placeholder="Cari guru / mapel..."
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
                <option value="APPROVED">Disetujui</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Menunggu</option>
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
                    <th className="py-3 px-4">Guru Utama</th>
                    <th className="py-3 px-4">Guru Badal</th>
                    <th className="py-3 px-4">Alasan</th>
                    {isKepsek ? (
                      <th className="py-3 px-4 text-center">Beban (JP)</th>
                    ) : (
                      <th className="py-3 px-4 text-right">Kafa'ah</th>
                    )}
                    <th className="py-3 px-4 text-center">Status</th>
                    {isKepsek && <th className="py-3 px-4 text-center w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
                  {filteredBadal.length === 0 ? (
                    <tr>
                      <td colSpan={isKepsek ? 9 : 8} className="py-12 text-center text-stone-400 dark:text-stone-500 font-medium">
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
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-750 dark:text-stone-350 border border-stone-200/40">
                              {sched?.unit || 'SMP'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-stone-900 dark:text-stone-100">{sched?.subject || 'KBM'}</p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                              {sched?.className} • {sched?.startTime} - {sched?.endTime} ({jp} JP)
                            </p>
                            {b.notes && (
                              <p className="text-[10px] text-stone-500 dark:text-stone-400 italic mt-1 line-clamp-1">
                                Amanah: "{b.notes}"
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="text-stone-800 dark:text-stone-200 font-medium">{origTeacher?.name || 'Guru Utama'}</p>
                            <span className="text-[10px] text-stone-400">{origTeacher?.position}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[#1B4332] dark:text-emerald-400">{badalTeacher?.name || 'Guru Badal'}</p>
                            <span className="text-[10px] text-stone-400">{badalTeacher?.position}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold text-stone-650 dark:text-stone-400 bg-stone-50 dark:bg-stone-850 border border-stone-200/50 dark:border-stone-800 px-2 py-0.5 rounded">
                              {b.reason}
                            </span>
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
                                ? 'bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/25' 
                                : isCompleted 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/40' 
                                : 'bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/25'
                            }`}>
                              {isApproved ? 'Disetujui' : isCompleted ? 'Selesai' : 'Menunggu'}
                            </span>
                          </td>
                          {isKepsek && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isPending && (
                                  <button
                                    onClick={() => setBadalToApprove(b)}
                                    title="Setujui Penugasan"
                                    className="p-1.5 rounded bg-[#1B4332]/10 hover:bg-[#1B4332]/20 text-[#1B4332] transition-colors cursor-pointer"
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
                            </td>
                          )}
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

      {/* 5. CONTENT VIEW: SMART FINDER */}
      {isKepsek && activeTab === 'cari_guru' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Smart Finder Filter Control */}
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
                    <span>Tunjuk Sebagai Badal</span>
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

      {/* 6. ADD BADAL ASSIGNMENT MODAL */}
      {showAddModal && isKepsek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-2xs">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="px-5 py-4 border-b border-stone-150 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  Penugasan Guru Badal (Pengganti KBM)
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
                  Guru Pengganti (Badal) Ditugaskan
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

      {/* 7. MODAL KONFIRMASI SUBMIT PENUGASAN BADAL */}
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
                      Konfirmasi Penugasan Badal
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
                    <span className="text-stone-500 dark:text-stone-400">Waktu & Durasi:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      {sched?.startTime} - {sched?.endTime} ({sched?.hours} JP)
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Berhalangan:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {origTeacher?.name || 'Guru Utama'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Pengganti (Badal):</span>
                    <span className="font-bold text-[#1B4332] dark:text-emerald-400">
                      {badalTeacher?.name || 'Guru Badal'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Alasan Penugasan:</span>
                    <span className="font-medium text-stone-800 dark:text-stone-200">
                      {reason}
                    </span>
                  </div>

                  {notes && (
                    <div className="pt-2 border-t border-stone-200/50 dark:border-stone-700/50">
                      <span className="text-stone-500 dark:text-stone-400 block mb-0.5">Catatan / Amanah:</span>
                      <p className="text-stone-700 dark:text-stone-300 italic font-sans bg-white dark:bg-stone-900 p-2 rounded border border-stone-200/50 dark:border-stone-700/50">
                        "{notes}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 rounded-lg p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Setelah dikonfirmasi, penugasan ini akan otomatis masuk ke jadwal KBM guru pengganti dan siap dilakukan presensi mengajar.
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

      {/* 8. MODAL KONFIRMASI PEMBATALAN PENUGASAN BADAL */}
      {badalToCancel && (() => {
        const sched = schedules.find(s => s.id === badalToCancel.scheduleId);
        const origTeacher = teachers.find(t => t.id === badalToCancel.originalTeacherId);
        const badalTeacher = teachers.find(t => t.id === badalToCancel.badalTeacherId);

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
                      Batalkan Penugasan Guru Badal?
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Konfirmasi pembatalan jadwal guru pengganti
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
                    <span className="text-stone-500 dark:text-stone-400">Mapel & Sesi:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {sched?.subject} ({sched?.className}) • {sched?.startTime}-{sched?.endTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-stone-200/50 dark:border-stone-700/50">
                    <span className="text-stone-500 dark:text-stone-400">Guru Utama:</span>
                    <span className="font-medium text-stone-700 dark:text-stone-300">
                      {origTeacher?.name || 'Guru Utama'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 dark:text-stone-400">Guru Badal:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {badalTeacher?.name || 'Guru Badal'}
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 rounded-lg p-3 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                  Peringatan: Jadwal pengganti ini akan dihapus dari antrean KBM guru badal dan perhitungan honor mengajar badal akan dibatalkan.
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
                    Ya, Batalkan Penugasan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 9. MODAL KONFIRMASI PERSETUJUAN PENUGASAN BADAL */}
      {badalToApprove && (() => {
        const sched = schedules.find(s => s.id === badalToApprove.scheduleId);
        const origTeacher = teachers.find(t => t.id === badalToApprove.originalTeacherId);
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
                      Setujui Penugasan Badal
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Konfirmasi persetujuan guru pengganti KBM
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
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  Apakah Anda yakin ingin menyetujui penugasan <strong>{badalTeacher?.name}</strong> untuk menggantikan <strong>{origTeacher?.name}</strong> pada mata pelajaran <strong>{sched?.subject} ({sched?.className})</strong>?
                </p>

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
                    onClick={handleConfirmApprove}
                    className="px-4 py-2 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white font-semibold shadow-xs cursor-pointer"
                  >
                    Ya, Setujui
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
