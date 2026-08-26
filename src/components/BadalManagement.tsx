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
  Check
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { BadalAssignment, DayOfWeek, UnitType, isKepsekRole, getRoleUnit } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';

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
    return schedules.filter(s => {
      const matchUnit = s.unit === modalUnit;
      const matchDay = s.dayOfWeek === selectedDayOfWeek;
      return matchUnit && matchDay;
    });
  }, [schedules, modalUnit, selectedDayOfWeek]);

  // Update schedule selection when modal unit or date changes
  const handleModalUnitOrDateChange = (newUnit: UnitType, newDate?: string) => {
    if (newDate) setSelectedDate(newDate);
    setModalUnit(newUnit);
    
    const d = newDate ? new Date(newDate) : new Date(selectedDate);
    const dayMap: DayOfWeek[] = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const day = dayMap[d.getDay()] || 'Senin';

    const validScheds = schedules.filter(s => s.unit === newUnit && s.dayOfWeek === day);
    if (validScheds.length > 0) {
      setSelectedScheduleId(validScheds[0].id);
      setSelectedOriginalTeacherId(validScheds[0].teacherId);
    } else {
      // fallback to any schedule in unit
      const fallback = schedules.find(s => s.unit === newUnit);
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
    setModalUnit(unit);
    // Find today's or matching date for day
    const matchingSched = schedules.find(s => s.unit === unit && s.dayOfWeek === day && s.teacherId !== teacherId);
    if (matchingSched) {
      setSelectedScheduleId(matchingSched.id);
      setSelectedOriginalTeacherId(matchingSched.teacherId);
    }
    setSelectedBadalTeacherId(teacherId);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheduleId) {
      toast.error('Silakan pilih jadwal KBM yang akan digantikan');
      return;
    }
    if (selectedOriginalTeacherId === selectedBadalTeacherId) {
      toast.error('Guru pengganti tidak boleh sama dengan guru utama!');
      return;
    }

    createBadalAssignment({
      date: selectedDate,
      scheduleId: selectedScheduleId,
      originalTeacherId: selectedOriginalTeacherId,
      badalTeacherId: selectedBadalTeacherId,
      reason,
      notes: notes.trim() || undefined,
    });

    toast.success('Penugasan guru badal berhasil disimpan ke database');
    setShowAddModal(false);
    setNotes('');
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

    return {
      totalSessions,
      totalJP,
      totalHonor,
      approvedCount,
      smpCount,
      maCount,
      ponpesCount
    };
  }, [badalAssignments, schedules, teachers, selectedUnit]);

  // Smart Finder: Available teachers calculation
  const availableTeachersData = useMemo(() => {
    const daySchedules = schedules.filter(s => s.dayOfWeek === finderDay && s.unit === finderUnit);
    
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
        return t.unit === finderUnit || t.unit === 'PESANTREN' || t.unit === 'UMUM';
      } else {
        return t.unit === finderUnit;
      }
    });

    const available = activeTeachers.filter(t => !busyTeacherMap.has(t.id));
    const busy = activeTeachers.filter(t => busyTeacherMap.has(t.id)).map(t => ({
      ...t,
      busyReason: busyTeacherMap.get(t.id)
    }));

    return { available, busy };
  }, [teachers, schedules, finderDay, finderUnit, finderTimeSlot]);

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
          fillColor: [15, 23, 42],
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
            `Halaman ${data.pageNumber} dari ${pageCount} • Baitul Qur'an HRIS System`,
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
    <div className="space-y-4">
      {/* 1. Header and Context Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {isKepsek ? 'Penugasan & Pencarian Guru Pengganti (Badal)' : 'Monitoring Guru Pengganti (Badal KBM)'}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download PDF button */}
            <button
              id="btn-export-pdf-badal"
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Unduh Rekap</span>
            </button>

            {/* Action for Kepsek Only */}
            {isKepsek && (
              <button
                id="btn-tunjuk-badal-modal"
                onClick={() => {
                  handleModalUnitOrDateChange(userUnit === 'ALL' ? 'SMP' : userUnit as UnitType);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tunjuk Guru Badal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Stat Metric Cards (Minimalist & Islami) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Sesi Badal</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">
            {stats.totalSessions} <span className="text-xs font-normal text-slate-400">Sesi</span>
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Total Jam KBM</span>
          <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">
            {stats.totalJP} <span className="text-xs font-normal text-slate-400">JP</span>
          </span>
        </div>

        {isKepsek ? (
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Badal Disetujui</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
              {stats.approvedCount} <span className="text-xs font-normal text-slate-400">Sesi</span>
            </span>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Alokasi Kafa'ah Badal</span>
            <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 block font-mono">
              {formatRupiah(stats.totalHonor)}
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Distribusi Unit</span>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 block">
            SMP: {stats.smpCount} | MA: {stats.maCount} | Ponpes: {stats.ponpesCount}
          </span>
        </div>
      </div>

      {/* 3. Navigation Subtabs (For Kepsek) */}
      {isKepsek && (
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            id="tab-daftar-badal"
            onClick={() => setActiveTab('daftar_penugasan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'daftar_penugasan'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Daftar Penugasan Badal ({filteredBadal.length})
          </button>
          <button
            id="tab-cari-guru"
            onClick={() => setActiveTab('cari_guru')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              activeTab === 'cari_guru'
                ? 'bg-emerald-700 dark:bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pencarian Guru Tersedia (Smart Finder)</span>
          </button>
        </div>
      )}

      {/* 4. CONTENT VIEW: DAFTAR PENUGASAN BADAL */}
      {(!isKepsek || activeTab === 'daftar_penugasan') && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Unit Filter - Only show for Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
                {(['ALL', 'SMP', 'MA', 'PESANTREN'] as const).map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      selectedUnit === unit
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {unit === 'ALL' ? 'Semua Unit' : unit === 'PESANTREN' ? 'Pesantren' : unit}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input & Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari guru / mapel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="ALL">Semua Status</option>
                <option value="APPROVED">Disetujui</option>
                <option value="COMPLETED">Selesai</option>
                <option value="PENDING">Menunggu</option>
              </select>
            </div>
          </div>

          {/* Badal Records Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/70 dark:border-slate-700">
                    <th className="py-2.5 px-3.5">Tanggal</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3.5">Mata Pelajaran & Sesi</th>
                    <th className="py-2.5 px-3.5">Guru Utama</th>
                    <th className="py-2.5 px-3.5">Guru Badal</th>
                    <th className="py-2.5 px-3">Alasan</th>
                    {isKepsek ? (
                      <th className="py-2.5 px-3 text-center">Beban (JP)</th>
                    ) : (
                      <th className="py-2.5 px-3 text-right">Kafa'ah</th>
                    )}
                    <th className="py-2.5 px-3 text-center">Status</th>
                    {isKepsek && <th className="py-2.5 px-3 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredBadal.length === 0 ? (
                    <tr>
                      <td colSpan={isKepsek ? 9 : 8} className="py-8 text-center text-slate-400">
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
                        <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{formatIndonesianDate(b.date)}</p>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {sched?.unit || 'SMP'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{sched?.subject || 'KBM'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {sched?.className} • {sched?.startTime} - {sched?.endTime} ({jp} JP)
                            </p>
                            {b.notes && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 line-clamp-1">
                                Amanah: "{b.notes}"
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <p className="text-slate-700 dark:text-slate-300">{origTeacher?.name || 'Guru Utama'}</p>
                            <span className="text-[10px] text-slate-400">{origTeacher?.position}</span>
                          </td>
                          <td className="py-2.5 px-3.5">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-400">{badalTeacher?.name || 'Guru Badal'}</p>
                            <span className="text-[10px] text-slate-400">{badalTeacher?.position}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {b.reason}
                            </span>
                          </td>
                          {isKepsek ? (
                            <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-800 dark:text-slate-200">
                              {jp} JP
                            </td>
                          ) : (
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400 font-semibold whitespace-nowrap">
                              {formatRupiah(jp * badalRate)}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isApproved 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50' 
                                : isCompleted 
                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/50' 
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/50'
                            }`}>
                              {isApproved ? 'Disetujui' : isCompleted ? 'Selesai' : 'Menunggu'}
                            </span>
                          </td>
                          {isKepsek && (
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                {isPending && (
                                  <button
                                    onClick={() => approveBadalAssignment(b.id)}
                                    title="Setujui Penugasan"
                                    className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (confirm('Batalkan penugasan guru badal ini?')) {
                                      deleteBadalAssignment(b.id);
                                    }
                                  }}
                                  title="Batalkan Penugasan"
                                  className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

      {/* 5. CONTENT VIEW: SMART FINDER (PENCARIAN GURU TERSEDIA KHUSUS KEPSEK) */}
      {isKepsek && activeTab === 'cari_guru' && (
        <div className="space-y-4">
          {/* Smart Finder Filter Control */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Pencocokan Jadwal Guru Kosong (Tidak Sedang Mengajar)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Pilih Hari KBM</label>
                <select
                  value={finderDay}
                  onChange={(e) => setFinderDay(e.target.value as DayOfWeek)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  {(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'] as DayOfWeek[]).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Unit Sekolah</label>
                <select
                  value={finderUnit}
                  disabled={userUnit !== 'ALL'}
                  onChange={(e) => setFinderUnit(e.target.value as UnitType)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border focus:outline-none transition-all ${
                    userUnit !== 'ALL'
                      ? 'bg-slate-100 dark:bg-slate-850 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <option value="SMP">Unit SMP</option>
                  <option value="MA">Unit MA</option>
                  <option value="PESANTREN">Unit Pesantren</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">Sesi Jam KBM</label>
                <select
                  value={finderTimeSlot}
                  onChange={(e) => setFinderTimeSlot(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none"
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
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Daftar Guru Tersedia ({availableTeachersData.available.length} Asatidz)
              </h4>
              <span className="text-[11px] text-slate-500">
                Hari {finderDay} • Unit {finderUnit}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availableTeachersData.available.map((t) => (
                <div 
                  key={t.id}
                  className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {t.name}
                      </p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Tersedia
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.position} • {t.unit}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      NIP: {t.nip}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickAssignFromFinder(t.id, finderDay, finderUnit)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tunjuk Sebagai Badal</span>
                  </button>
                </div>
              ))}
            </div>

            {availableTeachersData.available.length === 0 && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                Seluruh guru pada unit ini sedang memiliki jadwal mengajar pada jam tersebut.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. ADD BADAL ASSIGNMENT MODAL (KHUSUS KEPSEK) */}
      {showAddModal && isKepsek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Penugasan Guru Badal (Pengganti KBM)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kepala Sekolah Unit {modalUnit}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tanggal KBM</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleModalUnitOrDateChange(modalUnit, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Unit Sekolah</label>
                  <select
                    value={modalUnit}
                    onChange={(e) => handleModalUnitOrDateChange(e.target.value as UnitType)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">Pesantren</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Sesi Jadwal KBM ({selectedDayOfWeek})
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                  required
                >
                  {filteredModalSchedules.length === 0 ? (
                    <option value="">Tidak ada jadwal {selectedDayOfWeek} di unit {modalUnit}</option>
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
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Guru Pengganti (Badal) Ditugaskan
                </label>
                <select
                  value={selectedBadalTeacherId}
                  onChange={(e) => setSelectedBadalTeacherId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                  required
                >
                  <option value="">-- Pilih Guru Pengganti --</option>
                  {teachers
                    .filter((t) => t.id !== selectedOriginalTeacherId && t.isActive)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.position} - {t.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Alasan Penggantian</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin Keperluan">Izin Keperluan</option>
                  <option value="Tugas Kedinasan Pesantren">Tugas Kedinasan Pesantren</option>
                  <option value="Urusan Mendesak">Urusan Mendesak</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Amanah Materi KBM / Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Materi yang dititipkan atau instruksi tugas santri..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  Tetapkan & Simpan Badal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
