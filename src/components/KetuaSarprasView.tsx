import React, { useState } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';
import { StaffAssignedTask, AttendanceStatus } from '../types';
import { Search, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface KetuaSarprasViewProps {
  initialTab?: 'approval' | 'absensi' | 'penugasan' | 'jurnal';
}

export const KetuaSarprasView: React.FC<KetuaSarprasViewProps> = ({ initialTab = 'approval' }) => {
  const { 
    currentUser,
    expenses, 
    updateExpenseStatus, 
    staffJournals, 
    attendances, 
    teachers, 
    staffAssignments,
    addStaffAssignment,
    updateStaffAssignmentStatus,
    deleteStaffAssignment,
    markStaffAttendanceDirect
  } = useHRIS();

  const [activeTab, setActiveTab] = useState<'approval' | 'absensi' | 'penugasan' | 'jurnal'>(initialTab);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'DAPUR' | 'SARPRAS'>('ALL');
  const [filterExpenseStatus, setFilterExpenseStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchExpense, setSearchExpense] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayNames = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentDayIndex = new Date().getDay();
  const currentDayName = dayNames[currentDayIndex];
  const isTodaySunday = currentDayIndex === 0;

  // Staf yang menjadi tanggung jawab langsung Ketua Sarpras (Sarpras, Inventaris, Dapur)
  // Ustdzh Mahkamah, Ust Hariyanto, PPSU, dan Kasinah BUKAN tanggung jawab Ketua Sarpras
  const isSarprasStaff = (t: any) => {
    if (t.role === 'KETUA_SARPRAS' || t.id === currentUser?.id) return false;
    const name = (t.name || '').toLowerCase();
    const pos = (t.position || '').toLowerCase();
    
    // Eksklusi khusus sesuai arahan pimpinan:
    if (name.includes('mahkamah') || pos.includes('keuangan')) return false;
    if (name.includes('hariyanto') || pos.includes('tabligh')) return false;
    if (name.includes('ppsu') || name.includes('kasinah') || pos.includes('kebersihan')) return false;

    // Hanya divisi Dapur, Sarpras, dan Inventaris
    return pos.includes('dapur') || pos.includes('sarpras') || pos.includes('inventaris');
  };

  const staffMembers = teachers.filter(isSarprasStaff);

  // Presensi Mandiri Ketua Sarpras Hari Ini
  const myTodayAttendance = attendances.find(
    a => (a.teacherId === currentUser?.id || a.actualTeacherId === currentUser?.id) && a.date === todayStr
  );
  const isMyClockedIn = !!myTodayAttendance && (myTodayAttendance.status === 'SELESAI' || myTodayAttendance.status.includes('HADIR'));

  const handleMySelfAttendance = async () => {
    if (!currentUser?.id) return;
    const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const success = await markStaffAttendanceDirect(
      currentUser.id,
      'SELESAI',
      todayStr,
      nowTime,
      `Presensi Mandiri Ketua Sarpras (${currentDayName}, Senin–Sabtu)`
    );
    if (success) {
      toast.success(`Presensi hadir Anda (${currentUser?.name || 'Ketua Sarpras'}) tercatat jam ${nowTime}`);
    }
  };

  // ==========================================
  // TAB 1: APPROVAL AJUAN BELANJA
  // ==========================================
  const filteredExpenses = (expenses || [])
    .filter(e => {
      const matchCat = filterCategory === 'ALL' || e.category === filterCategory;
      const matchStatus = filterExpenseStatus === 'ALL' || e.status === filterExpenseStatus;
      const matchSearch = searchExpense === '' || 
        e.description.toLowerCase().includes(searchExpense.toLowerCase()) || 
        e.reporterName.toLowerCase().includes(searchExpense.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingExpensesCount = (expenses || []).filter(e => e.status === 'PENDING').length;
  const approvedExpensesTotal = (expenses || [])
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingExpensesTotal = (expenses || [])
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleApprove = (id: string, reporterName: string, desc: string) => {
    updateExpenseStatus(id, 'APPROVED');
    toast.success(`Ajuan belanja ${reporterName} ("${desc}") disetujui`);
  };

  const handleReject = (id: string, reporterName: string, desc: string) => {
    updateExpenseStatus(id, 'REJECTED');
    toast.error(`Ajuan belanja ${reporterName} ditolak`);
  };

  // ==========================================
  // TAB 2: PRESENSI STAF
  // ==========================================
  const [selectedStaffIdForAbsen, setSelectedStaffIdForAbsen] = useState<string>('');
  const [absenDate, setAbsenDate] = useState<string>(todayStr);
  const [absenTime, setAbsenTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [absenStatus, setAbsenStatus] = useState<AttendanceStatus>('SELESAI');
  const [absenNotes, setAbsenNotes] = useState<string>('');
  const [isSubmittingAbsen, setIsSubmittingAbsen] = useState(false);
  const [filterAbsenDate, setFilterAbsenDate] = useState<string>(todayStr);

  const handleQuickClockIn = async (staffId: string) => {
    const staff = teachers.find(t => t.id === staffId);
    const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    const success = await markStaffAttendanceDirect(
      staffId,
      'SELESAI',
      todayStr,
      nowTime,
      `Presensi dinas oleh Ketua Sarpras (Jadwal: Senin–Sabtu)`
    );
    if (success) {
      toast.success(`${staff?.name || 'Staf'} diabsenkan hadir`);
    }
  };

  const handleCustomAbsenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffIdForAbsen) {
      toast.error('Pilih staf terlebih dahulu');
      return;
    }

    setIsSubmittingAbsen(true);
    try {
      const staff = teachers.find(t => t.id === selectedStaffIdForAbsen);
      const success = await markStaffAttendanceDirect(
        selectedStaffIdForAbsen,
        absenStatus,
        absenDate,
        absenTime,
        absenNotes || `Presensi dinas oleh Ketua Sarpras`
      );
      if (success) {
        toast.success(`Presensi ${staff?.name} tersimpan`);
        setSelectedStaffIdForAbsen('');
        setAbsenNotes('');
      }
    } finally {
      setIsSubmittingAbsen(false);
    }
  };

  const staffAttendances = attendances
    .filter(a => staffMembers.some(sm => sm.id === a.teacherId) || a.teacherId === currentUser?.id)
    .filter(a => !filterAbsenDate || a.date === filterAbsenDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ==========================================
  // TAB 3: PENUGASAN STAF
  // ==========================================
  const [taskStaffId, setTaskStaffId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<'NORMAL' | 'URGENT' | 'HIGH'>('NORMAL');
  const [taskDueDate, setTaskDueDate] = useState<string>(todayStr);
  const [filterTaskStatus, setFilterTaskStatus] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskStaffId || !taskTitle.trim() || !taskDescription.trim()) {
      toast.error('Lengkapi form penugasan');
      return;
    }

    const assignedStaff = teachers.find(t => t.id === taskStaffId);
    const cat: 'SARPRAS' | 'DAPUR' = assignedStaff?.position?.toLowerCase().includes('dapur') ? 'DAPUR' : 'SARPRAS';

    setIsSubmittingTask(true);
    try {
      const success = await addStaffAssignment({
        staffId: taskStaffId,
        staffName: assignedStaff?.name || 'Staf',
        category: cat,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        assignedBy: currentUser?.name || 'Ketua Sarpras',
        assignedDate: todayStr,
        dueDate: taskDueDate || undefined,
        status: 'PENDING'
      });

      if (success) {
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('NORMAL');
      }
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const filteredTasks = (staffAssignments || [])
    .filter(t => {
      const matchCat = filterCategory === 'ALL' || t.category === filterCategory;
      const matchStatus = filterTaskStatus === 'ALL' || t.status === filterTaskStatus;
      return matchCat && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Minimalis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#163832]">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#DAF1DE]">Sarpras & Operasional</h1>
          <p className="text-xs text-slate-500 dark:text-[#8EB69B]">
            Pusat persetujuan belanja, kehadiran, dan penugasan staf non-akademik (Jadwal: Senin – Sabtu)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-slate-500 dark:text-[#8EB69B]">
            {currentDayName}, {todayStr}
          </span>
          {pendingExpensesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              {pendingExpensesCount} ajuan perlu tindakan
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigasi & Filter Divisi */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#163832]">
        <div className="flex gap-4 sm:gap-6">
          {[
            { id: 'approval', label: 'Ajuan Belanja', count: pendingExpensesCount },
            { id: 'absensi', label: 'Presensi Staf' },
            { id: 'penugasan', label: 'Penugasan' },
            { id: 'jurnal', label: 'Jurnal Harian' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 text-xs font-semibold relative transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#163832] dark:text-[#DAF1DE]'
                  : 'text-slate-500 dark:text-[#8EB69B] hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-mono">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#163832] dark:bg-[#8EB69B] rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Filter Divisi */}
        <div className="flex items-center gap-1 pb-2">
          {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                filterCategory === cat
                  ? 'bg-slate-200 dark:bg-[#163832] text-slate-900 dark:text-[#DAF1DE] font-semibold'
                  : 'text-slate-500 dark:text-[#8EB69B] hover:bg-slate-100 dark:hover:bg-[#163832]/40'
              }`}
            >
              {cat === 'ALL' ? 'Semua' : cat === 'DAPUR' ? 'Dapur' : 'Sarpras'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AJUAN BELANJA (APPROVAL)                           */}
      {/* ========================================================= */}
      {activeTab === 'approval' && (
        <div className="space-y-4">
          {/* Ringkasan Angka */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200/80 dark:border-[#163832]">
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Menunggu Persetujuan</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatRupiah(pendingExpensesTotal)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{pendingExpensesCount} ajuan</p>
            </div>
            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200/80 dark:border-[#163832]">
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Total Disetujui</p>
              <p className="text-lg font-bold text-slate-900 dark:text-[#DAF1DE] mt-1">{formatRupiah(approvedExpensesTotal)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Disetujui periode ini</p>
            </div>
            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200/80 dark:border-[#163832]">
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Total Ajuan Masuk</p>
              <p className="text-lg font-bold text-slate-900 dark:text-[#DAF1DE] mt-1">{(expenses || []).length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua transaksi</p>
            </div>
          </div>

          {/* Filter Status & Pencarian */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterExpenseStatus(st)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                    filterExpenseStatus === st
                      ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] font-medium'
                      : 'bg-white dark:bg-[#0B2B26] text-slate-600 dark:text-[#8EB69B] border border-slate-200 dark:border-[#163832]'
                  }`}
                >
                  {st === 'ALL' ? 'Semua' : st === 'PENDING' ? 'Menunggu' : st === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchExpense}
                onChange={(e) => setSearchExpense(e.target.value)}
                placeholder="Cari ajuan atau nama staf..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#0B2B26] border border-slate-200 dark:border-[#163832] rounded-lg text-slate-800 dark:text-[#DAF1DE] focus:outline-none"
              />
            </div>
          </div>

          {/* Tabel Ajuan */}
          <div className="bg-white dark:bg-[#0B2B26] rounded-xl border border-slate-200 dark:border-[#163832] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#163832]/60 text-slate-600 dark:text-[#8EB69B] font-semibold border-b border-slate-200 dark:border-[#163832] text-[11px]">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Pengaju</th>
                    <th className="py-2.5 px-3">Divisi</th>
                    <th className="py-2.5 px-3">Deskripsi Belanja</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Nota</th>
                    <th className="py-2.5 px-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#163832] text-slate-800 dark:text-[#DAF1DE]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada ajuan belanja.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-[#163832]/30">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-[#8EB69B]">{expense.date}</td>
                        <td className="py-2.5 px-3 font-medium">{expense.reporterName}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-[#163832] text-slate-700 dark:text-[#DAF1DE]">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate" title={expense.description}>{expense.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatRupiah(expense.amount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            expense.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            expense.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}>
                            {expense.status === 'PENDING' ? 'Menunggu' : expense.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {expense.receiptUrl ? (
                            <button
                              onClick={() => setSelectedImage(expense.receiptUrl!)}
                              className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              Lihat
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {expense.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleApprove(expense.id, expense.reporterName, expense.description)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 rounded cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleReject(expense.id, expense.reporterName, expense.description)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200 rounded cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRESENSI STAF                                      */}
      {/* ========================================================= */}
      {activeTab === 'absensi' && (
        <div className="space-y-4">
          {/* Card Presensi Mandiri Ketua Sarpras (Wajib Absen Senin - Sabtu) */}
          <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200/90 dark:border-[#163832] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-[#DAF1DE]">
                  Presensi Mandiri: {currentUser?.name || 'Ust Rusli RZ'} (Ketua Sarpras)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-[#163832] text-emerald-800 dark:text-[#8EB69B] border border-emerald-200/50">
                  Jadwal Kerja: Senin – Sabtu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">
                Hari ini: <strong className="text-slate-700 dark:text-[#DAF1DE]">{currentDayName}, {todayStr}</strong>
                {isTodaySunday && <span className="ml-2 text-amber-600 font-semibold">(Hari Ahad / Libur Operasional)</span>}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isMyClockedIn ? (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    ✓ Sudah Hadir ({myTodayAttendance?.clockInTime || '-'} WIB)
                  </span>
                  <button
                    onClick={handleMySelfAttendance}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-[#DAF1DE] underline cursor-pointer"
                    title="Perbarui jam hadir"
                  >
                    Perbarui
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMySelfAttendance}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#163832] hover:bg-[#0B2B26] text-white dark:bg-[#8EB69B] dark:text-[#051F20] transition-colors cursor-pointer"
                >
                  Absen Hadir Sekarang
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Form Presensi Manual Staf */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200 dark:border-[#163832] space-y-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Input Presensi Staf</h3>

              <form onSubmit={handleCustomAbsenSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Pilih Staf Sarpras/Dapur</label>
                  <select
                    value={selectedStaffIdForAbsen}
                    onChange={(e) => setSelectedStaffIdForAbsen(e.target.value)}
                    required
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                  >
                    <option value="">-- Pilih Staf Sarpras / Dapur --</option>
                    {staffMembers.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.position || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={absenDate}
                      onChange={(e) => setAbsenDate(e.target.value)}
                      required
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Jam</label>
                    <input
                      type="time"
                      value={absenTime}
                      onChange={(e) => setAbsenTime(e.target.value)}
                      required
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Status Kehadiran</label>
                  <select
                    value={absenStatus}
                    onChange={(e) => setAbsenStatus(e.target.value as any)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                  >
                    <option value="SELESAI">Hadir (Selesai)</option>
                    <option value="HADIR_JURNAL_KOSONG">Hadir (Masuk)</option>
                    <option value="IZIN">Izin</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="ALPA">Alpa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Keterangan (Opsional)</label>
                  <input
                    type="text"
                    value={absenNotes}
                    onChange={(e) => setAbsenNotes(e.target.value)}
                    placeholder="Catatan dinas..."
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAbsen}
                  className="w-full py-2 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAbsen ? 'Menyimpan...' : 'Simpan Presensi Staf'}
                </button>
              </form>
            </div>

            {/* Quick Presensi & Riwayat Staf */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quick Status Hari Ini */}
              <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200 dark:border-[#163832] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">
                    Kehadiran Staf Sarpras & Dapur ({currentDayName}, {todayStr})
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-[#8EB69B]">
                    Masuk: Senin – Sabtu
                  </span>
                </div>

                {staffMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Belum ada staf Sarpras/Dapur terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {staffMembers.map(staff => {
                      const todayAtt = attendances.find(a => a.teacherId === staff.id && a.date === todayStr);
                      const isClockedIn = !!todayAtt && (todayAtt.status === 'SELESAI' || todayAtt.status.includes('HADIR'));

                      return (
                        <div 
                          key={staff.id}
                          className="bg-slate-50 dark:bg-[#163832]/40 border border-slate-200/70 dark:border-[#163832] p-3 rounded-lg flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-slate-800 dark:text-[#DAF1DE] truncate">{staff.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-[#8EB69B] truncate">{staff.position || 'Staff'}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {todayAtt ? `Jam ${todayAtt.clockInTime || '-'} (${todayAtt.status})` : 'Belum hadir'}
                            </p>
                          </div>

                          <button
                            onClick={() => handleQuickClockIn(staff.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer ${
                              isClockedIn
                                ? 'bg-slate-200 dark:bg-[#163832] text-slate-700 dark:text-[#DAF1DE]'
                                : 'bg-[#163832] hover:bg-[#0B2B26] text-white dark:bg-[#8EB69B] dark:text-[#051F20]'
                            }`}
                          >
                            {isClockedIn ? 'Perbarui' : 'Hadirkan'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Riwayat Presensi Singkat */}
              <div className="bg-white dark:bg-[#0B2B26] rounded-xl border border-slate-200 dark:border-[#163832] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Riwayat Presensi Sarpras</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={filterAbsenDate}
                      onChange={(e) => setFilterAbsenDate(e.target.value)}
                      className="p-1 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded text-slate-800 dark:text-[#DAF1DE]"
                    />
                    {filterAbsenDate && (
                      <button 
                        onClick={() => setFilterAbsenDate('')} 
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Semua
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#163832]/60 text-slate-600 dark:text-[#8EB69B] font-semibold border-b border-slate-200 dark:border-[#163832] text-[11px]">
                        <th className="py-2 px-3">Tanggal</th>
                        <th className="py-2 px-3">Nama</th>
                        <th className="py-2 px-3">Jam</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#163832]">
                      {staffAttendances.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            Tidak ada catatan presensi.
                          </td>
                        </tr>
                      ) : (
                        staffAttendances.slice(0, 10).map(att => {
                          const staff = teachers.find(t => t.id === att.teacherId);
                          return (
                            <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-[#163832]/30">
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-[#8EB69B]">{att.date}</td>
                              <td className="py-2 px-3 font-medium text-slate-800 dark:text-[#DAF1DE]">{staff?.name}</td>
                              <td className="py-2 px-3 font-mono">{att.clockInTime || '-'}</td>
                              <td className="py-2 px-3">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-[#163832]">
                                  {att.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-xs">{att.notes || '-'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PENUGASAN STAF                                     */}
      {/* ========================================================= */}
      {activeTab === 'penugasan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Form Tambah Tugas */}
          <div className="lg:col-span-1 bg-white dark:bg-[#0B2B26] p-4 rounded-xl border border-slate-200 dark:border-[#163832] space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Beri Tugas Staf</h3>

            <form onSubmit={handleAssignTask} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Staf Pelaksana</label>
                <select
                  value={taskStaffId}
                  onChange={(e) => setTaskStaffId(e.target.value)}
                  required
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                >
                  <option value="">-- Pilih Staf Sarpras / Dapur --</option>
                  {staffMembers.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.position || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Judul Tugas</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  placeholder="Contoh: Perbaikan fasilitas kamar santri..."
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Prioritas</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="URGENT">Mendesak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Tenggat</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-[#8EB69B] mb-1">Instruksi Tugas</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Rincian pekerjaan yang harus dilakukan..."
                  className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTask}
                className="w-full py-2 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTask ? 'Mengirim...' : 'Kirim Tugas'}
              </button>
            </form>
          </div>

          {/* List Tugas */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-[#0B2B26] rounded-xl border border-slate-200 dark:border-[#163832] p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Daftar Penugasan Staf</h3>

                <div className="flex gap-1">
                  {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setFilterTaskStatus(st)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                        filterTaskStatus === st
                          ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] font-medium'
                          : 'bg-slate-100 dark:bg-[#163832] text-slate-600 dark:text-[#8EB69B]'
                      }`}
                    >
                      {st === 'ALL' ? 'Semua' : st === 'PENDING' ? 'Menunggu' : st === 'IN_PROGRESS' ? 'Dikerjakan' : 'Selesai'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Tidak ada data tugas.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map(task => (
                    <div 
                      key={task.id}
                      className="bg-slate-50 dark:bg-[#163832]/30 border border-slate-200/70 dark:border-[#163832] p-3 rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-[#DAF1DE]">{task.title}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                              task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {task.priority}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {task.status === 'COMPLETED' ? 'Selesai' : task.status === 'IN_PROGRESS' ? 'Dikerjakan' : 'Menunggu'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-[#DAF1DE]/90">{task.description}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => updateStaffAssignmentStatus(task.id, 'COMPLETED')}
                              className="px-2 py-1 text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 rounded cursor-pointer"
                            >
                              Selesai
                            </button>
                          )}
                          <button
                            onClick={() => deleteStaffAssignment(task.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-[#163832]">
                        <span>Staf: <strong className="text-slate-700 dark:text-[#DAF1DE]">{task.staffName}</strong></span>
                        <span>Batas: <strong className="font-mono">{task.dueDate || '-'}</strong></span>
                      </div>

                      {task.completionNotes && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded">
                          Laporan staf: {task.completionNotes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: JURNAL HARIAN STAF                                 */}
      {/* ========================================================= */}
      {activeTab === 'jurnal' && (
        <div className="bg-white dark:bg-[#0B2B26] rounded-xl border border-slate-200 dark:border-[#163832] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Jurnal Harian Staf Sarpras & Dapur</h3>
            <span className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Jadwal Kerja: Senin – Sabtu</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(staffJournals || [])
              .filter(j => filterCategory === 'ALL' || j.category === filterCategory)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(journal => (
                <div key={journal.id} className="bg-slate-50 dark:bg-[#163832]/30 border border-slate-200 dark:border-[#163832] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">{journal.staffName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{journal.date}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-[#163832] text-slate-700 dark:text-[#DAF1DE]">
                      {journal.category}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Dikerjakan:</span>
                      <p className="text-slate-800 dark:text-[#DAF1DE]">{journal.taskToday}</p>
                    </div>
                    {journal.taskTomorrow && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">Rencana:</span>
                        <p className="text-slate-800 dark:text-[#DAF1DE]">{journal.taskTomorrow}</p>
                      </div>
                    )}
                  </div>

                  {journal.photoUrl && (
                    <button
                      onClick={() => setSelectedImage(journal.photoUrl!)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer block pt-1"
                    >
                      Lihat Foto Dokumentasi
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal Foto / Nota */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-lg w-full bg-white dark:bg-[#0B2B26] rounded-xl overflow-hidden shadow-xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#163832]">
              <h4 className="font-semibold text-xs text-slate-800 dark:text-[#DAF1DE]">Bukti Dokumen / Foto</h4>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex justify-center max-h-[70vh] overflow-auto">
              <img src={selectedImage} alt="Bukti" className="max-h-full max-w-full object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
