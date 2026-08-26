import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search,
  BookOpen,
  PenTool,
  Home,
  MessageSquare,
  Trash2,
  AlertCircle,
  Filter,
  Check,
  User,
  School,
  Sparkles,
  Send,
  ShieldAlert,
  Info,
  Eye,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { useHRIS } from '../context/HRISContext';
import { LearningNeedCategory, LearningNeedRequest, LearningNeedStatus, UnitType, isKepsekRole, getRoleUnit } from '../types';
import { formatIndonesianDate } from '../utils/formatters';

export const LearningNeedManagement: React.FC = () => {
  const { 
    learningNeedRequests, 
    currentUser, 
    currentRole, 
    addLearningNeedRequest, 
    updateLearningNeedRequestStatus,
    deleteLearningNeedRequest,
    teachers
  } = useHRIS();

  const requests = Array.isArray(learningNeedRequests) ? learningNeedRequests : [];

  // Dialog & Modal States
  const [showAddForm, setShowAddForm] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    request: LearningNeedRequest | null;
    action: LearningNeedStatus;
    note: string;
  }>({
    isOpen: false,
    request: null,
    action: 'APPROVED',
    note: ''
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
  }>({
    isOpen: false,
    requestId: null
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LearningNeedStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<LearningNeedCategory | 'ALL'>('ALL');
  const [teacherFilter, setTeacherFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<UnitType | 'ALL'>('ALL');

  // New Request Form State (For Guru)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Buku' as LearningNeedCategory
  });

  // Helper to map teacher data
  const teacherMap = useMemo(() => {
    const map = new Map<string, typeof teachers[0]>();
    teachers.forEach(t => map.set(t.id, t));
    return map;
  }, [teachers]);

  // Determine Kepsek unit
  const kepsekUnit: UnitType = useMemo(() => {
    const roleUnit = getRoleUnit(currentRole, currentUser?.unit);
    return roleUnit === 'ALL' ? 'SMP' : roleUnit as UnitType;
  }, [currentRole, currentUser?.unit]);

  const isKepsek = isKepsekRole(currentRole);

  // Role-based filtered baseline requests
  const baseRequests = useMemo(() => {
    if (currentRole === 'GURU') {
      // 1. GURU: ONLY sees their own requests according to login account
      return requests.filter(r => r.teacherId === currentUser?.id);
    } 
    
    if (isKepsek) {
      // 2. KEPSEK: ONLY sees requests from teachers belonging to their respective unit/jobdesk (Pesantren, SMP, or MA)
      return requests.filter(r => {
        const teacher = teacherMap.get(r.teacherId);
        return teacher && teacher.unit === kepsekUnit;
      });
    }

    // 3. ADMIN: Sees all requests from teachers and kepsek status across all units
    return requests;
  }, [requests, currentRole, currentUser?.id, teacherMap, isKepsek, kepsekUnit]);

  // KPI Metrics Calculation based on accessible scope
  const metrics = useMemo(() => {
    return {
      total: baseRequests.length,
      pending: baseRequests.filter(r => r.status === 'PENDING').length,
      approved: baseRequests.filter(r => r.status === 'APPROVED').length,
      completed: baseRequests.filter(r => r.status === 'COMPLETED').length,
      rejected: baseRequests.filter(r => r.status === 'REJECTED').length,
    };
  }, [baseRequests]);

  // List of teachers eligible for filtering (for Kepsek: teachers in their unit; for Admin: all teachers)
  const filterableTeachers = useMemo(() => {
    if (isKepsek) {
      return teachers.filter(t => t.unit === kepsekUnit);
    }
    return teachers;
  }, [teachers, isKepsek, kepsekUnit]);

  // Filtered requests after applying search & dropdowns
  const filteredRequests = useMemo(() => {
    return baseRequests.filter(req => {
      const teacher = teacherMap.get(req.teacherId);
      const matchesSearch = 
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || req.category === categoryFilter;
      const matchesTeacher = teacherFilter === 'ALL' || req.teacherId === teacherFilter;
      const matchesUnit = unitFilter === 'ALL' || (teacher && teacher.unit === unitFilter);
      
      return matchesSearch && matchesStatus && matchesCategory && matchesTeacher && matchesUnit;
    });
  }, [baseRequests, searchTerm, statusFilter, categoryFilter, teacherFilter, unitFilter, teacherMap]);

  // Handle PDF Export (Admin/Kepsek - Formal & Minimalist)
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

      const scopeTitle = currentRole === 'KEPALA_PESANTREN' 
        ? `Unit ${kepsekUnit}` 
        : 'Seluruh Unit (SMP, MA, Pesantren)';

      // 1. Formal Institutional Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("PESANTREN BAITUL QUR'AN AL-IKHWAN", 14, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Laporan Rekapitulasi Pengajuan Kebutuhan Sarana Pembelajaran", 14, 24);

      // Line divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(14, 28, 196, 28);

      // Meta attributes
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Tanggal Cetak: ${todayStr}`, 14, 34);
      doc.text(`Lingkup: ${scopeTitle}`, 110, 34);
      doc.text(`Dicetak Oleh: ${currentUser?.name || 'Administrator'} (${currentUser?.position || 'Admin'})`, 14, 39);
      doc.text(`Total Data: ${filteredRequests.length} Ajuan`, 110, 39);

      // Table rows
      const tableRows = filteredRequests.map((req, idx) => {
        const teacher = teacherMap.get(req.teacherId);
        const statusLabel = 
          req.status === 'PENDING' ? 'Menunggu' :
          req.status === 'APPROVED' ? 'Disetujui' :
          req.status === 'COMPLETED' ? 'Selesai' : 'Ditolak';

        return [
          String(idx + 1),
          formatIndonesianDate(req.createdAt),
          teacher?.name || '-',
          teacher?.unit || '-',
          req.category,
          req.title,
          statusLabel,
          req.decisionNote || '-'
        ];
      });

      autoTable(doc, {
        startY: 44,
        head: [['No', 'Tanggal', 'Guru / Asatidz', 'Unit', 'Kategori', 'Kebutuhan', 'Status', 'Catatan Disposisi']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', 'Tidak ada data yang sesuai filter', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42], // slate-900
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 3
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 2.5
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 20 },
          2: { cellWidth: 32 },
          3: { cellWidth: 15 },
          4: { cellWidth: 18 },
          5: { cellWidth: 42 },
          6: { cellWidth: 18 },
          7: { cellWidth: 29 }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer page number
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
      doc.save(`Laporan_Kebutuhan_BQ_${fileDate}.pdf`);
      toast.success('Laporan PDF pengajuan kebutuhan berhasil diunduh');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  // Handle Form Submit (GURU)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    
    await addLearningNeedRequest({
      teacherId: currentUser?.id || 'T-04',
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category
    });
    
    setFormData({ 
      title: '', 
      description: '', 
      category: 'Buku' 
    });
    setShowAddForm(false);
  };

  // Open Decision Modal for Kepsek
  const handleOpenDecision = (req: LearningNeedRequest, action: LearningNeedStatus) => {
    let defaultNote = '';
    if (action === 'APPROVED') defaultNote = 'Disetujui untuk pengadaan fasilitas KBM.';
    else if (action === 'REJECTED') defaultNote = 'Belum dapat disetujui, stok masih memadai.';
    else if (action === 'COMPLETED') defaultNote = 'Fasilitas telah diserahkan kepada guru.';

    setDecisionModal({
      isOpen: true,
      request: req,
      action,
      note: defaultNote
    });
  };

  // Submit Decision (Kepsek)
  const handleConfirmDecision = async () => {
    if (!decisionModal.request) return;
    await updateLearningNeedRequestStatus(
      decisionModal.request.id, 
      decisionModal.action, 
      decisionModal.note.trim() || undefined
    );
    setDecisionModal({ isOpen: false, request: null, action: 'APPROVED', note: '' });
  };

  const getStatusBadge = (status: LearningNeedStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
            <Clock className="w-3 h-3 animate-pulse" /> Menunggu Persetujuan
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Disetujui Kepsek
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold">
            <XCircle className="w-3 h-3" /> Ditolak
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
            <Sparkles className="w-3 h-3" /> Selesai / Terpenuhi
          </span>
        );
    }
  };

  const getCategoryIcon = (category: LearningNeedCategory) => {
    switch (category) {
      case 'Buku': return <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Alat Tulis': return <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'Sarana': return <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'Lainnya': return <AlertCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      default: return <ClipboardList className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with role-specific banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-2 rounded-xl ${
              currentRole === 'GURU' 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-pesantren-emerald' 
                : isKepsek
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600'
            }`}>
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {currentRole === 'GURU' && 'Pengajuan Kebutuhan Pembelajaran Saya'}
                {isKepsek && `Persetujuan Kebutuhan KBM — Unit ${kepsekUnit}`}
                {currentRole === 'ADMIN' && 'Monitoring Pengajuan Kebutuhan & Persetujuan Kepsek'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentRole === 'GURU' && `Portal pengajuan sarana, ATK & kitab pendukung KBM (${currentUser?.name})`}
                {isKepsek && `Pusat verifikasi dan persetujuan pengadaan sarana KBM untuk Guru Unit ${kepsekUnit}`}
                {currentRole === 'ADMIN' && 'Data monitoring & rekapitulasi ajuan guru serta status pengesahan dari masing-masing Kepala Unit'}
              </p>
            </div>
          </div>
        </div>

        {/* Export Action (Admin & Kepsek Only - Minimalist, Modern, Formal) */}
        {(currentRole === 'ADMIN' || isKepsek) && (
          <button
            id="btn-export-pdf-kebutuhan"
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide shadow-xs border border-slate-700/50 dark:border-slate-700 transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-300" />
            <span>Unduh Laporan PDF</span>
          </button>
        )}

      </div>


      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Pengajuan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{metrics.total}</p>
        </div>
        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Menunggu Persetujuan</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{metrics.pending}</p>
        </div>
        <div className="bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
          <p className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Disetujui Kepsek</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{metrics.approved}</p>
        </div>
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
          <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Selesai / Terpenuhi</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{metrics.completed}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${
          currentRole === 'ADMIN' 
            ? 'lg:grid-cols-5' 
            : isKepsek 
            ? 'lg:grid-cols-4' 
            : 'lg:grid-cols-3'
        } gap-3`}>
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={currentRole === 'GURU' ? "Cari judul atau rincian..." : "Cari judul, rincian, nama guru..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Unit Filter (Admin only) */}
          {currentRole === 'ADMIN' && (
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Unit (SMP, MA, Ponpes)</option>
              <option value="SMP">Unit SMP</option>
              <option value="MA">Unit MA</option>
              <option value="PESANTREN">Unit Pesantren</option>
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui Kepsek</option>
            <option value="REJECTED">Ditolak</option>
            <option value="COMPLETED">Selesai / Terpenuhi</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Buku">Buku & Kitab</option>
            <option value="Alat Tulis">Alat Tulis (ATK)</option>
            <option value="Sarana">Sarana & Prasarana</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          {/* Teacher Filter (Kepsek & Admin) */}
          {currentRole !== 'GURU' && (
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Semua Guru ({filterableTeachers.length})</option>
              {filterableTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid of Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRequests.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {currentRole === 'GURU' 
                ? 'Belum ada pengajuan kebutuhan dari akun Anda'
                : isKepsek
                ? `Belum ada pengajuan kebutuhan dari guru Unit ${kepsekUnit}`
                : 'Belum ada data pengajuan kebutuhan'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {currentRole === 'GURU' 
                ? 'Klik tombol "Ajukan Kebutuhan Baru" untuk mengirim permohonan sarana atau alat belajar kepada Kepala Unit Anda.'
                : 'Data pengajuan fasilitas yang diajukan oleh guru akan muncul di sini.'}
            </p>
            {currentRole === 'GURU' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-pesantren-emerald text-white text-xs font-bold rounded-xl hover:bg-pesantren-emerald/90 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajukan Sekarang
              </button>
            )}
          </div>
        ) : (
          filteredRequests.map((req) => {
            const teacher = teacherMap.get(req.teacherId);
            const isOwner = req.teacherId === currentUser?.id;
            const isKepsekUser = isKepsek;

            return (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300">
                      {getCategoryIcon(req.category)}
                      <span className="text-[10px] font-bold uppercase tracking-wider">{req.category}</span>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>

                  {/* Request Title */}
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5 leading-snug">
                    {req.title}
                  </h3>
                  
                  {/* Request Description */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {req.description}
                    </p>
                  </div>

                  {/* Minimalist Progress Bar (Tahapan: Diajukan -> Ditinjau -> Selesai) */}
                  <div className="mb-4 py-2 px-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/70">
                    {req.status === 'REJECTED' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400">Diajukan</span>
                        <div className="flex-1 mx-3 h-1 bg-rose-200 dark:bg-rose-950/60 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 w-full" />
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">Ditolak</span>
                      </div>
                    ) : (
                      <div>
                        {/* 3 Step Segment Bar */}
                        <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                          <div className="h-1 rounded-full bg-emerald-500" />
                          <div className={`h-1 rounded-full transition-colors ${
                            req.status === 'APPROVED' || req.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`} />
                          <div className={`h-1 rounded-full transition-colors ${
                            req.status === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`} />
                        </div>

                        {/* Step Labels */}
                        <div className="flex justify-between text-[9px] tracking-tight">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            1. Diajukan
                          </span>
                          <span className={`font-semibold ${
                            req.status === 'APPROVED' || req.status === 'COMPLETED'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            2. Ditinjau
                          </span>
                          <span className={`font-semibold ${
                            req.status === 'COMPLETED'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            3. Selesai
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  {/* Submitting Teacher Info (Shows teacher name and unit clearly) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl ${teacher?.avatarColor || 'bg-emerald-700'} flex items-center justify-center text-xs font-bold text-white shadow-xs`}>
                        {teacher?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {teacher?.name || 'Asatidz'}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                            {teacher?.unit || 'Umum'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {teacher?.position || 'Guru'} • {formatIndonesianDate(req.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Kepsek Verification Comment / Disposition Notes */}
                  {req.adminComment ? (
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                        <MessageSquare className="w-3 h-3" />
                        Disposisi / Catatan Kepsek ({teacher?.unit})
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        "{req.adminComment}"
                      </p>
                    </div>
                  ) : (
                    currentRole === 'ADMIN' && (
                      <div className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-[10px] text-slate-400 italic">
                        Belum ada catatan dari Kepala Unit
                      </div>
                    )
                  )}

                  {/* Role-Specific Actions */}
                  <div className="pt-1 space-y-2">
                    {/* 1. Kepsek Action Buttons (Approve, Reject, Complete) - Admin is strictly View-Only */}
                    {isKepsek && (
                      <>
                        {req.status === 'PENDING' && (
                          <div className="w-full flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDecision(req, 'APPROVED')}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button
                              onClick={() => handleOpenDecision(req, 'REJECTED')}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tolak
                            </button>
                          </div>
                        )}

                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleOpenDecision(req, 'COMPLETED')}
                            className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Tandai Selesai / Terpenuhi
                          </button>
                        )}
                      </>
                    )}

                    {/* 2. Guru Actions (Delete) - Admin is strictly View-Only */}
                    {(currentRole === 'GURU' && isOwner) && (req.status === 'PENDING' || req.status === 'REJECTED') && (
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, requestId: req.id })}
                          className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Hapus Pengajuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Ajuan</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action for Guru (When list is not empty) */}
      {currentRole === 'GURU' && filteredRequests.length > 0 && (
        <div className="flex justify-center pt-6 pb-4">
          <button
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                category: 'Buku'
              });
              setShowAddForm(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-pesantren-emerald hover:bg-pesantren-emerald/90 text-white px-10 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Ajukan Kebutuhan Baru
          </button>
        </div>
      )}

      {/* Modal: Guru Add Request Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="bg-pesantren-emerald p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-2xl">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Pengajuan Kebutuhan Baru</h2>
                  <p className="text-xs text-white/80">Kebutuhan sarana & buku pendukung KBM</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Locked Submitting Teacher Info */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${currentUser?.avatarColor || 'bg-emerald-700'} flex items-center justify-center text-xs font-bold text-white`}>
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentUser?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Diajukan ke: <strong>Kepala Sekolah Unit {currentUser?.unit}</strong>
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Kategori Kebutuhan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Buku', 'Alat Tulis', 'Sarana', 'Lainnya'] as LearningNeedCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.category === cat 
                        ? 'bg-pesantren-emerald border-pesantren-emerald text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {getCategoryIcon(cat)}
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Judul Pengajuan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengadaan Kitab Jurumiyyah, Spidol Whiteboard & Penghapus"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Rincian Kebutuhan & Alasan *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Sebutkan kuantitas yang dibutuhkan, spesifikasi, target kelas/santri, dan tujuan pengadaan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-pesantren-emerald hover:bg-pesantren-emerald/90 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kepsek Decision Modal (Approval / Rejection / Completion) */}
      {decisionModal.isOpen && decisionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className={`p-5 flex items-center justify-between text-white ${
              decisionModal.action === 'APPROVED' 
                ? 'bg-blue-600' 
                : decisionModal.action === 'REJECTED'
                ? 'bg-rose-600'
                : 'bg-emerald-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  {decisionModal.action === 'APPROVED' && <CheckCircle2 className="w-5 h-5" />}
                  {decisionModal.action === 'REJECTED' && <XCircle className="w-5 h-5" />}
                  {decisionModal.action === 'COMPLETED' && <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {decisionModal.action === 'APPROVED' && 'Setujui Pengajuan'}
                    {decisionModal.action === 'REJECTED' && 'Tolak Pengajuan'}
                    {decisionModal.action === 'COMPLETED' && 'Penyelesaian Pengadaan'}
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Disposisi Kepala Sekolah Unit {kepsekUnit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDecisionModal({ isOpen: false, request: null, action: 'APPROVED', note: '' })}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pengajuan Guru</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                  {decisionModal.request.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pemohon: {teacherMap.get(decisionModal.request.teacherId)?.name} ({teacherMap.get(decisionModal.request.teacherId)?.unit})
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Catatan / Tanggapan Kepala Sekolah:
                </label>
                <textarea
                  rows={3}
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Tuliskan catatan disposisi, instruksi pengadaan, atau alasan penolakan..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-pesantren-emerald text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ isOpen: false, request: null, action: 'APPROVED', note: '' })}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`flex-[2] py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer ${
                    decisionModal.action === 'APPROVED'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : decisionModal.action === 'REJECTED'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  Konfirmasi Disposisi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Deletion Confirmation Modal - Minimalist & Modern */}
      {deleteModal.isOpen && deleteModal.requestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Hapus Pengajuan?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Tindakan ini tidak dapat dibatalkan. Seluruh data terkait pengajuan ini akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center gap-3 p-6 pt-0">
              <button
                onClick={() => setDeleteModal({ isOpen: false, requestId: null })}
                className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (deleteModal.requestId) {
                    await deleteLearningNeedRequest(deleteModal.requestId);
                    setDeleteModal({ isOpen: false, requestId: null });
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
