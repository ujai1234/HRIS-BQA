import React, { useState } from 'react';
import { useHRIS } from '../context/HRISContext';
import { formatRupiah } from '../utils/formatters';
import { StaffAssignedTask } from '../types';
import { 
  Wrench, 
  Utensils, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Image as ImageIcon, 
  X, 
  Plus, 
  UserCheck, 
  Receipt, 
  ClipboardList, 
  AlertCircle, 
  Calendar, 
  Send, 
  CheckSquare, 
  Trash2, 
  Edit3, 
  User, 
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';
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

  // Staf non akademik (Dapur & Sarpras/Inventaris)
  const staffMembers = teachers.filter(t => 
    t.role === 'STAFF' || 
    t.position?.toLowerCase().includes('dapur') || 
    t.position?.toLowerCase().includes('sarpras') || 
    t.position?.toLowerCase().includes('inventaris')
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // ==========================================
  // TAB 1: APPROVAL LOGIC
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
    toast.success(`Alhamdulillah, ajuan belanja ${reporterName} ("${desc}") telah DISETUJUI`);
  };

  const handleReject = (id: string, reporterName: string, desc: string) => {
    updateExpenseStatus(id, 'REJECTED');
    toast.error(`Ajuan belanja ${reporterName} ("${desc}") telah DITOLAK`);
  };

  // ==========================================
  // TAB 2: ABSENSI LOGIC (Zero Restrictions)
  // ==========================================
  const [selectedStaffIdForAbsen, setSelectedStaffIdForAbsen] = useState<string>('');
  const [absenDate, setAbsenDate] = useState<string>(todayStr);
  const [absenTime, setAbsenTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [absenStatus, setAbsenStatus] = useState<import('../types').AttendanceStatus>('SELESAI');
  const [absenNotes, setAbsenNotes] = useState<string>('Presensi resmi oleh Ketua Sarpras (Bypass tanpa batasan)');
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
      `Hadir Berdinas - Diabsenkan oleh Ketua Sarpras (${currentUser?.name || 'Ketua Sarpras'})`
    );
    if (success) {
      toast.success(`Bismillah, ${staff?.name || 'Staf'} berhasil diabsenkan Hadir jam ${nowTime}`);
    }
  };

  const handleCustomAbsenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffIdForAbsen) {
      toast.error('Pilih staf yang akan diabsenskan');
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
        absenNotes || `Diabsenskan oleh ${currentUser?.name || 'Ketua Sarpras'}`
      );
      if (success) {
        toast.success(`Presensi ${staff?.name} pada tanggal ${absenDate} berhasil disimpan!`);
        setSelectedStaffIdForAbsen('');
        setAbsenNotes('Presensi resmi oleh Ketua Sarpras (Bypass tanpa batasan)');
      }
    } finally {
      setIsSubmittingAbsen(false);
    }
  };

  // Daftar absensi staf
  const staffAttendances = attendances
    .filter(a => staffMembers.some(sm => sm.id === a.teacherId))
    .filter(a => !filterAbsenDate || a.date === filterAbsenDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // ==========================================
  // TAB 3: DELEGASI TUGAS (Penugasan Staf)
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
      toast.error('Lengkapi staf yang ditunjuk, judul tugas, dan instruksi pekerjaan');
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
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-[#0B2B26] via-[#163832] to-[#051F20] text-white p-6 rounded-2xl border border-[#163832] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8EB69B]/20 text-[#DAF1DE] border border-[#8EB69B]/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#DAF1DE]" /> RBAC: Ketua Sarpras &amp; Fasilitas
            </span>
            <span className="text-xs text-[#8EB69B]">•</span>
            <span className="text-xs text-[#8EB69B] font-mono">{todayStr}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#DAF1DE]">
            Pusat Kendali Sarpras &amp; Staf Non-Akademik
          </h1>
          <p className="text-xs text-[#8EB69B] max-w-2xl leading-relaxed">
            Wewenang penuh untuk verifikasi &amp; approve pengajuan belanja dapur/sarpras, absensi staf tanpa batas radius/waktu, dan pendelegasian tugas langsung.
          </p>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-3 shrink-0 bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/10">
          <div className="text-center px-2">
            <p className="text-[10px] text-[#8EB69B] font-semibold uppercase">Menunggu Approve</p>
            <p className="text-lg font-bold text-amber-400">{pendingExpensesCount} Ajuan</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center px-2">
            <p className="text-[10px] text-[#8EB69B] font-semibold uppercase">Total Staf</p>
            <p className="text-lg font-bold text-[#DAF1DE]">{staffMembers.length} Orang</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#0B2B26] p-2 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('approval')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'approval'
                ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] shadow-xs'
                : 'text-slate-600 dark:text-[#8EB69B] hover:bg-slate-100 dark:hover:bg-[#163832]/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>1. Approve &amp; Kontrol Ajuan</span>
            {pendingExpensesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-mono">
                {pendingExpensesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'absensi'
                ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] shadow-xs'
                : 'text-slate-600 dark:text-[#8EB69B] hover:bg-slate-100 dark:hover:bg-[#163832]/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. Presensi Staf (Bypass)</span>
          </button>

          <button
            onClick={() => setActiveTab('penugasan')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'penugasan'
                ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] shadow-xs'
                : 'text-slate-600 dark:text-[#8EB69B] hover:bg-slate-100 dark:hover:bg-[#163832]/60'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>3. Delegasi Tugas Staf</span>
          </button>

          <button
            onClick={() => setActiveTab('jurnal')}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'jurnal'
                ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20] shadow-xs'
                : 'text-slate-600 dark:text-[#8EB69B] hover:bg-slate-100 dark:hover:bg-[#163832]/60'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>4. Jurnal Harian Staf</span>
          </button>
        </div>

        {/* Category quick filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#163832] rounded-xl border border-slate-200/70 dark:border-[#0B2B26]">
          {(['ALL', 'DAPUR', 'SARPRAS'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-white dark:bg-[#0B2B26] text-[#163832] dark:text-[#DAF1DE] shadow-xs'
                  : 'text-slate-500 dark:text-[#8EB69B] hover:text-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'Semua Divisi' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: KONTROL DAN APPROVE AJUAN BELANJA                  */}
      {/* ========================================================= */}
      {activeTab === 'approval' && (
        <div className="space-y-5 animate-fade-in">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Menunggu Approval</p>
                <p className="text-xl font-extrabold text-amber-600 mt-1">{formatRupiah(pendingExpensesTotal)}</p>
                <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-semibold mt-0.5">{pendingExpensesCount} transaksi perlu tindakan</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center border border-amber-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700 dark:text-[#8EB69B] uppercase tracking-wider">Total Disetujui</p>
                <p className="text-xl font-extrabold text-[#163832] dark:text-[#DAF1DE] mt-1">{formatRupiah(approvedExpensesTotal)}</p>
                <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-semibold mt-0.5">Akumulasi ajuan yang lolos verifikasi</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-[#163832] text-emerald-700 dark:text-[#8EB69B] flex items-center justify-center border border-emerald-200">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0B2B26] p-4 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Total Ajuan Masuk</p>
                <p className="text-xl font-extrabold text-[#051F20] dark:text-[#DAF1DE] mt-1">{(expenses || []).length} Pengajuan</p>
                <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-semibold mt-0.5">Dapur &amp; Sarpras terdaftar</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center border border-indigo-200">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white dark:bg-[#0B2B26] rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#163832] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#0B2B26]">
              {/* Status Filters */}
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setFilterExpenseStatus(st)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      filterExpenseStatus === st
                        ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20]'
                        : 'bg-white dark:bg-[#163832] text-slate-600 dark:text-[#8EB69B] border border-slate-200 dark:border-[#0B2B26]'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua Status' : st === 'PENDING' ? 'Menunggu Approval' : st === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchExpense}
                  onChange={(e) => setSearchExpense(e.target.value)}
                  placeholder="Cari ajuan / staf..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE] focus:outline-none focus:ring-1 focus:ring-[#8EB69B]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#163832]/60 text-slate-600 dark:text-[#8EB69B] font-bold border-b border-slate-200 dark:border-[#163832] text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Pengaju</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Deskripsi Belanja</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Bukti Nota</th>
                    <th className="py-3 px-4 text-center">Aksi Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#163832] text-slate-800 dark:text-[#DAF1DE]">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-[#8EB69B] italic font-semibold">
                        Tidak ada data pengajuan belanja staf untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => (
                      <tr key={expense.id} className="hover:bg-slate-50 dark:hover:bg-[#163832]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#163832] dark:text-[#8EB69B]">
                          {expense.date}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {expense.reporterName}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            expense.category === 'DAPUR' 
                              ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200/50'
                              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50'
                          }`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium max-w-xs truncate" title={expense.description}>
                          {expense.description}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#163832] dark:text-[#DAF1DE]">
                          {formatRupiah(expense.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            expense.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200' :
                            expense.status === 'APPROVED' ? 'bg-[#DAF1DE] dark:bg-[#163832] text-[#051F20] dark:text-[#DAF1DE] border border-[#8EB69B]/40' :
                            'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200'
                          }`}>
                            {expense.status === 'PENDING' ? <Clock className="w-3 h-3" /> : expense.status === 'APPROVED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {expense.status === 'PENDING' ? 'Menunggu Approval' : expense.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {expense.receiptUrl ? (
                            <button
                              onClick={() => setSelectedImage(expense.receiptUrl!)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" /> Lihat Nota
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Tanpa Foto</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {expense.status === 'PENDING' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprove(expense.id, expense.reporterName, expense.description)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-800 dark:text-emerald-100 dark:hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Approve Ajuan Ini"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                onClick={() => handleReject(expense.id, expense.reporterName, expense.description)}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/60 dark:text-rose-200 dark:hover:bg-rose-900 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Tolak Ajuan Ini"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-[10px] font-semibold text-slate-400 italic">
                                Selesai diproses
                              </span>
                              <button
                                onClick={() => handleApprove(expense.id, expense.reporterName, expense.description)}
                                className="text-[9px] text-[#163832] dark:text-[#8EB69B] hover:underline cursor-pointer"
                                title="Ubah status"
                              >
                                (Ubah)
                              </button>
                            </div>
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
      {/* TAB 2: MENGABSENSKAN STAF TANPA BATASAN (BYPASS)          */}
      {/* ========================================================= */}
      {activeTab === 'absensi' && (
        <div className="space-y-6 animate-fade-in">
          {/* Card Penjelasan Wewenang Khusus */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
              <p className="font-bold">Fitur Khusus: Presensi Staf Non-Akademik Tanpa Batasan (Bypass)</p>
              <p className="text-amber-800/80 dark:text-amber-300/80">
                Sebagai Ketua Sarpras, Anda dapat mengabsenskan staf dapur maupun inventaris/sarpras kapan saja secara langsung tanpa batasan radius geofence GPS, tanpa batasan jam KBM, dan dapat mengatur tanggal serta jam sesuai kebutuhan lapangan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Manual Presensi Custom */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0B2B26] p-5 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#163832]">
                <UserCheck className="w-4 h-4 text-[#163832] dark:text-[#8EB69B]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Form Presensi Staf Langsung</h3>
              </div>

              <form onSubmit={handleCustomAbsenSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Pilih Staf Non-Akademik
                  </label>
                  <select
                    value={selectedStaffIdForAbsen}
                    onChange={(e) => setSelectedStaffIdForAbsen(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE] focus:ring-1 focus:ring-[#8EB69B]"
                  >
                    <option value="">-- Pilih Staf Dapur / Sarpras --</option>
                    {staffMembers.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.position || 'Staff'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={absenDate}
                      onChange={(e) => setAbsenDate(e.target.value)}
                      required
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                      Jam Masuk
                    </label>
                    <input
                      type="time"
                      value={absenTime}
                      onChange={(e) => setAbsenTime(e.target.value)}
                      required
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Status Kehadiran
                  </label>
                  <select
                    value={absenStatus}
                    onChange={(e) => setAbsenStatus(e.target.value as any)}
                    className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                  >
                    <option value="SELESAI">Hadir Penuh / Berdinas (Selesai)</option>
                    <option value="HADIR_JURNAL_KOSONG">Hadir Masuk (Aktif)</option>
                    <option value="IZIN">Izin Keperluan</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="ALPA">Alpa / Tanpa Keterangan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Catatan / Alasan
                  </label>
                  <textarea
                    value={absenNotes}
                    onChange={(e) => setAbsenNotes(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Hadir dinas pemeliharaan sarpras atau izin acara keluarga"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAbsen}
                  className="w-full py-2.5 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingAbsen ? 'Menyimpan Presensi...' : 'Simpan Presensi Staf'}</span>
                </button>
              </form>
            </div>

            {/* Quick 1-Click Absen Card & Daftar Staf */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-[#0B2B26] p-5 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#163832] mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Daftar Staf &amp; Presensi Cepat Hari Ini</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Klik 1 tombol untuk langsung mengabsenkan staf tanpa syarat lokasi</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#163832] dark:text-[#8EB69B] bg-slate-100 dark:bg-[#163832] px-2.5 py-1 rounded-lg">
                    {todayStr}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {staffMembers.map(staff => {
                    const todayAtt = attendances.find(a => a.teacherId === staff.id && a.date === todayStr);
                    const isClockedIn = !!todayAtt && (todayAtt.status === 'SELESAI' || todayAtt.status.includes('HADIR'));

                    return (
                      <div 
                        key={staff.id}
                        className="bg-slate-50/70 dark:bg-[#163832]/50 border border-slate-200/80 dark:border-[#163832] p-4 rounded-xl flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0B2B26] text-[#163832] dark:text-[#DAF1DE] font-bold flex items-center justify-center border border-slate-200 dark:border-[#163832] shadow-2xs">
                              {staff.position?.toLowerCase().includes('dapur') ? <Utensils className="w-4 h-4 text-orange-600" /> : <Wrench className="w-4 h-4 text-indigo-600" />}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-800 dark:text-[#DAF1DE]">{staff.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-medium">{staff.position || 'Staff Pesantren'}</p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            isClockedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isClockedIn ? 'Sudah Absen' : 'Belum Absen'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-[#8EB69B] font-mono bg-white dark:bg-[#0B2B26] p-2 rounded-lg border border-slate-200/60 dark:border-[#0B2B26]">
                          {todayAtt ? (
                            <div className="space-y-0.5">
                              <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                Jam Masuk: {todayAtt.clockInTime || '-'} ({todayAtt.status})
                              </p>
                              {todayAtt.notes && <p className="text-[10px] text-slate-400 truncate">{todayAtt.notes}</p>}
                            </div>
                          ) : (
                            <p className="text-slate-400 italic">Belum ada catatan presensi hari ini</p>
                          )}
                        </div>

                        <button
                          onClick={() => handleQuickClockIn(staff.id)}
                          className={`w-full py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isClockedIn
                              ? 'bg-slate-200 dark:bg-[#163832] text-slate-700 dark:text-[#DAF1DE] hover:bg-slate-300'
                              : 'bg-[#163832] hover:bg-[#0B2B26] text-white dark:bg-[#8EB69B] dark:text-[#051F20]'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isClockedIn ? 'Perbarui Absen Hadir Sekarang' : 'Absenkan Hadir Sekarang'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Riwayat Absensi Staf */}
              <div className="bg-white dark:bg-[#0B2B26] rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#163832] mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Riwayat Presensi Staf</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-[#8EB69B]">Filter Tanggal:</span>
                    <input
                      type="date"
                      value={filterAbsenDate}
                      onChange={(e) => setFilterAbsenDate(e.target.value)}
                      className="p-1.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-lg text-slate-800 dark:text-[#DAF1DE]"
                    />
                    {filterAbsenDate && (
                      <button 
                        onClick={() => setFilterAbsenDate('')} 
                        className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Semua
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#163832]/60 text-slate-600 dark:text-[#8EB69B] font-bold border-b border-slate-200 dark:border-[#163832] text-[10px] uppercase">
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Nama Staf</th>
                        <th className="py-2.5 px-3">Jam Masuk</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#163832]">
                      {staffAttendances.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic font-semibold">
                            Tidak ada riwayat presensi staf pada tanggal ini.
                          </td>
                        </tr>
                      ) : (
                        staffAttendances.slice(0, 15).map(att => {
                          const staff = teachers.find(t => t.id === att.teacherId);
                          return (
                            <tr key={att.id} className="hover:bg-slate-50 dark:hover:bg-[#163832]/40">
                              <td className="py-2.5 px-3 font-mono text-[#163832] dark:text-[#8EB69B] font-bold">{att.date}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-[#DAF1DE]">{staff?.name}</td>
                              <td className="py-2.5 px-3 font-mono">{att.clockInTime || '-'}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#DAF1DE] text-[#051F20]">
                                  {att.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-[#8EB69B] text-[11px] truncate max-w-xs">{att.notes || '-'}</td>
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
      {/* TAB 3: PENUGASAN STAF LANGSUNG (DELEGASI KERJAAN)         */}
      {/* ========================================================= */}
      {activeTab === 'penugasan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Tambah Pekerjaan Langsung */}
            <div className="lg:col-span-1 bg-white dark:bg-[#0B2B26] p-5 rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#163832]">
                <Plus className="w-4 h-4 text-[#163832] dark:text-[#8EB69B]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Tambah Kerjaan Langsung Staf</h3>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#8EB69B] leading-relaxed">
                Tugas yang ditambahkan di sini akan langsung tampil pada portal staf yang ditunjuk (Dapur maupun Sarpras).
              </p>

              <form onSubmit={handleAssignTask} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Staf yang Ditunjuk
                  </label>
                  <select
                    value={taskStaffId}
                    onChange={(e) => setTaskStaffId(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE] focus:ring-1 focus:ring-[#8EB69B]"
                  >
                    <option value="">-- Pilih Staf Penerima Tugas --</option>
                    {staffMembers.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} — {st.position || 'Staff'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Judul Pekerjaan / Instruksi
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    placeholder="Contoh: Perbaikan Pipa Asrama Putra Lantai 2"
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                      Prioritas
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">Prioritas Tinggi</option>
                      <option value="URGENT">Mendesak (Urgent)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                      Tenggat Waktu
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full p-2 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-[#8EB69B] uppercase mb-1">
                    Rincian Instruksi / Catatan
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Contoh: Tolong cek sambungan pipa dekat tandon air dan ganti kran yang bocor sebelum jam 15:00 WIB."
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-xl text-slate-800 dark:text-[#DAF1DE]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="w-full py-2.5 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingTask ? 'Mendelegasikan...' : 'Kirim Tugas ke Staf'}</span>
                </button>
              </form>
            </div>

            {/* List Tugas yang Didelegasikan */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-[#0B2B26] rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#163832] mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Daftar Tugas yang Didelegasikan</h3>
                    <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Monitoring pengerjaan tugas oleh staf non-akademik</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setFilterTaskStatus(st)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                          filterTaskStatus === st
                            ? 'bg-[#163832] text-white dark:bg-[#8EB69B] dark:text-[#051F20]'
                            : 'bg-slate-100 dark:bg-[#163832] text-slate-600 dark:text-[#8EB69B]'
                        }`}
                      >
                        {st === 'ALL' ? 'Semua' : st === 'PENDING' ? 'Tertunda' : st === 'IN_PROGRESS' ? 'Sedang Dikerjakan' : 'Selesai'}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-[#8EB69B] italic font-semibold text-xs">
                    Belum ada tugas yang didelegasikan untuk filter ini.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTasks.map(task => (
                      <div 
                        key={task.id}
                        className="bg-slate-50/70 dark:bg-[#163832]/40 border border-slate-200/80 dark:border-[#163832] p-4 rounded-xl space-y-2.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                task.category === 'DAPUR' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                              }`}>
                                {task.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 font-extrabold' :
                                task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                task.status === 'COMPLETED' ? 'bg-[#DAF1DE] text-[#051F20]' :
                                task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {task.status === 'COMPLETED' ? '✓ Selesai' : task.status === 'IN_PROGRESS' ? '⚙ Sedang Dikerjakan' : '⌛ Menunggu'}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-[#DAF1DE] pt-1">
                              {task.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {task.status !== 'COMPLETED' && (
                              <button
                                onClick={() => updateStaffAssignmentStatus(task.id, 'COMPLETED')}
                                className="px-2.5 py-1 text-[11px] font-bold bg-[#DAF1DE] text-[#051F20] hover:bg-[#8EB69B] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                title="Tandai Selesai"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Selesai
                              </button>
                            )}
                            <button
                              onClick={() => deleteStaffAssignment(task.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Hapus tugas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-[#DAF1DE] bg-white dark:bg-[#0B2B26] p-3 rounded-lg border border-slate-200/60 dark:border-[#0B2B26] leading-relaxed">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-[#8EB69B] pt-1 border-t border-slate-200/60 dark:border-[#163832]">
                          <span>Pelaksana: <strong className="text-slate-800 dark:text-[#DAF1DE]">{task.staffName}</strong></span>
                          <span>Tenggat: <strong className="font-mono">{task.dueDate || '-'}</strong></span>
                        </div>

                        {task.completionNotes && (
                          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-2.5 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                            <strong>Catatan Pengerjaan Staf:</strong> {task.completionNotes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: JURNAL PEKERJAAN STAF (KONTROL HARIAN)             */}
      {/* ========================================================= */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0B2B26] rounded-2xl border border-slate-200 dark:border-[#163832] shadow-xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#163832] mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#DAF1DE]">Jurnal Harian Staf Non-Akademik</h3>
                <p className="text-[11px] text-slate-500 dark:text-[#8EB69B]">Laporan menu dapur dan perawatan sarpras yang telah diinput staf</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(staffJournals || [])
                .filter(j => filterCategory === 'ALL' || j.category === filterCategory)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(journal => (
                  <div key={journal.id} className="bg-slate-50/70 dark:bg-[#163832]/40 border border-slate-200 dark:border-[#163832] rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs text-slate-900 dark:text-[#DAF1DE]">{journal.staffName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-mono">{journal.date}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        journal.category === 'DAPUR' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {journal.category}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-white dark:bg-[#0B2B26] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#0B2B26]">
                        <span className="text-[10px] font-bold text-[#163832] dark:text-[#8EB69B] block mb-0.5 uppercase tracking-wider">
                          Dikerjakan Hari Ini / Menu:
                        </span>
                        <p className="text-slate-800 dark:text-[#DAF1DE] leading-relaxed">{journal.taskToday}</p>
                      </div>
                      <div className="bg-white dark:bg-[#0B2B26] p-2.5 rounded-lg border border-slate-200/60 dark:border-[#0B2B26]">
                        <span className="text-[10px] font-bold text-amber-600 block mb-0.5 uppercase tracking-wider">
                          Rencana Besok:
                        </span>
                        <p className="text-slate-800 dark:text-[#DAF1DE] leading-relaxed">{journal.taskTomorrow}</p>
                      </div>
                    </div>

                    {journal.photoUrl && (
                      <button
                        onClick={() => setSelectedImage(journal.photoUrl!)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti Dokumentasi
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Image Preview */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white dark:bg-[#0B2B26] rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-[#163832]">
              <h4 className="font-bold text-sm text-slate-800 dark:text-[#DAF1DE]">Bukti Nota / Foto Pekerjaan</h4>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex justify-center bg-slate-50 dark:bg-[#051F20] max-h-[70vh] overflow-auto">
              <img src={selectedImage} alt="Bukti" className="max-h-full max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
