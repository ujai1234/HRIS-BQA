import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search,
  Trash2,
  FileText,
  X
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
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<LearningNeedRequest | null>(null);
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
      return requests.filter(r => r.teacherId === currentUser?.id);
    } 
    
    if (isKepsek) {
      return requests.filter(r => {
        const teacher = teacherMap.get(r.teacherId);
        return teacher && teacher.unit === kepsekUnit;
      });
    }

    return requests;
  }, [requests, currentRole, currentUser?.id, teacherMap, isKepsek, kepsekUnit]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: baseRequests.length,
      pending: baseRequests.filter(r => r.status === 'PENDING').length,
      approved: baseRequests.filter(r => r.status === 'APPROVED' || r.status === 'COMPLETED').length,
      rejected: baseRequests.filter(r => r.status === 'REJECTED').length,
    };
  }, [baseRequests]);

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

  // Handle PDF Export
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

      // Header Document
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text("PESANTREN BAITUL QUR'AN AL-IKHWAN", 14, 15);
      
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text("Rekapitulasi Pengajuan Kebutuhan Sarana Pembelajaran", 14, 21);
      doc.text(`Unit: ${isKepsek ? kepsekUnit : 'Semua Unit'} | Tanggal: ${todayStr}`, 14, 26);

      const tableRows = filteredRequests.map((req, idx) => {
        const teacher = teacherMap.get(req.teacherId);
        const statusLabel = 
          req.status === 'APPROVED' ? 'Disetujui' :
          req.status === 'COMPLETED' ? 'Selesai' :
          req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu';
        
        return [
          (idx + 1).toString(),
          formatIndonesianDate(req.createdAt),
          teacher?.name || 'Asatidz',
          teacher?.unit || '-',
          req.category,
          `${req.title}\n(${req.description})`,
          statusLabel,
          req.decisionNote || '-'
        ];
      });

      autoTable(doc, {
        startY: 32,
        head: [['No', 'Tanggal', 'Guru', 'Unit', 'Kategori', 'Kebutuhan', 'Status', 'Catatan Disposisi']],
        body: tableRows.length > 0 ? tableRows : [['-', '-', 'Tidak ada data', '-', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: {
          fillColor: [27, 67, 50],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 2.5
        },
        margin: { left: 14, right: 14 }
      });

      const fileDate = new Date().toISOString().slice(0, 10);
      doc.save(`Rekap_Kebutuhan_${fileDate}.pdf`);
      toast.success('Laporan PDF berhasil diunduh');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Gagal mengunduh laporan PDF');
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    
    await addLearningNeedRequest({
      teacherId: currentUser?.id || 'T-08',
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
    toast.success('Pengajuan kebutuhan berhasil dikirim');
  };

  const handleOpenDecision = (req: LearningNeedRequest, action: LearningNeedStatus) => {
    let defaultNote = '';
    if (action === 'APPROVED') defaultNote = 'Disetujui untuk pengadaan sarana.';
    else if (action === 'REJECTED') defaultNote = 'Belum disetujui.';
    else if (action === 'COMPLETED') defaultNote = 'Telah diserahkan.';

    setDecisionModal({
      isOpen: true,
      request: req,
      action,
      note: defaultNote
    });
  };

  const handleConfirmDecision = async () => {
    if (!decisionModal.request) return;
    await updateLearningNeedRequestStatus(
      decisionModal.request.id, 
      decisionModal.action, 
      decisionModal.note.trim() || undefined
    );
    setDecisionModal({ isOpen: false, request: null, action: 'APPROVED', note: '' });
    toast.success('Status berhasil diperbarui');
  };

  const getStatusBadge = (status: LearningNeedStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Menunggu
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ditolak
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Selesai
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Clean Minimalist Header */}
      <div className="bg-white dark:bg-[#121f1a] rounded-lg border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-emerald-50">
            {isKepsek 
              ? `Persetujuan Kebutuhan (${kepsekUnit})` 
              : currentRole === 'GURU' 
                ? 'Pengajuan Kebutuhan' 
                : 'Persetujuan Kebutuhan Sarana'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-emerald-400/70 mt-0.5">
            {isKepsek 
              ? `Verifikasi dan persetujuan pengadaan kebutuhan guru unit ${kepsekUnit}.`
              : currentRole === 'GURU'
                ? 'Daftar pengajuan kebutuhan sarana pembelajaran.'
                : 'Rekapitulasi pengajuan sarana pembelajaran seluruh unit.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === 'GURU' ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-medium px-3.5 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajukan Kebutuhan</span>
            </button>
          ) : (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-[#0f1a15] hover:bg-slate-100 dark:bg-[#0f1a15] dark:hover:bg-stone-750 text-slate-700 dark:text-emerald-100 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Proportional Compact Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-emerald-400/70 block">
            Total Pengajuan
          </span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-slate-900 dark:text-emerald-50 mt-1">
            {metrics.total}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-emerald-500/60 mt-1.5 block">
            Seluruh usulan sarana
          </span>
        </div>

        <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-emerald-400/70 block">
            Menunggu Persetujuan
          </span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-amber-600 dark:text-amber-400 mt-1">
            {metrics.pending}
          </p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 block">
            Perlu telaah Kepala Unit
          </span>
        </div>

        <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-emerald-400/70 block">
            Disetujui
          </span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-emerald-700 dark:text-emerald-400 mt-1">
            {metrics.approved}
          </p>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1.5 block">
            Siap direalisasikan
          </span>
        </div>

        <div className="bg-white dark:bg-[#121f1a] rounded-xl border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-emerald-400/70 block">
            Ditolak
          </span>
          <p className="text-2xl sm:text-3xl font-semibold font-mono tracking-tight text-slate-600 dark:text-emerald-300/80 mt-1">
            {metrics.rejected}
          </p>
          <span className="text-[11px] text-slate-400 dark:text-emerald-500/60 mt-1.5 block">
            Belum dapat disetujui
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121f1a] rounded-lg border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kebutuhan atau nama guru..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-md text-slate-900 dark:text-emerald-50 placeholder-slate-400 focus:outline-none focus:border-[#1B4332]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-md text-slate-700 dark:text-emerald-100 focus:outline-none focus:border-[#1B4332] cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu</option>
            <option value="APPROVED">Disetujui</option>
            <option value="COMPLETED">Selesai</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-md text-slate-700 dark:text-emerald-100 focus:outline-none focus:border-[#1B4332] cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Buku">Buku & Kitab</option>
            <option value="Alat Tulis">Alat Tulis (ATK)</option>
            <option value="Sarana">Sarana Kelas</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* 4. Table / List of Requests */}
      <div className="bg-white dark:bg-[#121f1a] rounded-lg border border-slate-200 dark:border-emerald-900/40 dark:border-emerald-900/40 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada data pengajuan yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-emerald-900/40 bg-slate-50 dark:bg-[#0f1a15]/70 dark:bg-[#0f1a15]/70 text-slate-500 dark:text-emerald-400/70 font-medium">
                  <th className="py-2.5 px-3.5">Tanggal</th>
                  <th className="py-2.5 px-3.5">Kebutuhan</th>
                  <th className="py-2.5 px-3.5">Kategori</th>
                  <th className="py-2.5 px-3.5">Pengaju</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-slate-800">
                {filteredRequests.map((req) => {
                  const teacher = teacherMap.get(req.teacherId);
                  const isOwner = req.teacherId === currentUser?.id;

                  return (
                    <tr 
                      key={req.id}
                      className="hover:bg-slate-50 dark:bg-[#0f1a15]/60 dark:hover:bg-[#162720]/50/40 transition-colors"
                    >
                      {/* Tanggal */}
                      <td className="py-3 px-3.5 text-slate-500 dark:text-emerald-400/70 font-mono whitespace-nowrap">
                        {formatIndonesianDate(req.createdAt)}
                      </td>

                      {/* Kebutuhan (Judul & Ringkasan) */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <p className="font-medium text-slate-900 dark:text-emerald-50">
                          {req.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {req.description}
                        </p>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-emerald-300/80 whitespace-nowrap">
                        {req.category}
                      </td>

                      {/* Pengaju */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <p className="text-slate-800 dark:text-emerald-100 font-medium">
                          {teacher?.name || 'Asatidz'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Unit {teacher?.unit || 'SMP'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                        {req.decisionNote && (
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] truncate" title={req.decisionNote}>
                            {req.decisionNote}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => setSelectedDetailRequest(req)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-emerald-300/80 bg-slate-50 dark:bg-[#0f1a15] hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>

                          {/* Approval Actions for Kepsek */}
                          {isKepsek && req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleOpenDecision(req, 'APPROVED')}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-[#1B4332] hover:bg-[#143326] rounded transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleOpenDecision(req, 'REJECTED')}
                                className="px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 rounded border border-rose-200/60 dark:border-rose-800/40 transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {/* Delete Action (Owner or Admin) */}
                          {(isOwner || currentRole === 'ADMIN') && req.status === 'PENDING' && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, requestId: req.id })}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW LEARNING NEED (GURU) */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121f1a] rounded-lg shadow-lg max-w-md w-full overflow-hidden border border-slate-200 dark:border-emerald-900/40">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-emerald-900/40">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-emerald-50">
                Pengajuan Kebutuhan Baru
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-emerald-300/80 block">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0f1a15] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="Buku">Buku & Kitab</option>
                  <option value="Alat Tulis">Alat Tulis (ATK)</option>
                  <option value="Sarana">Sarana Kelas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-emerald-300/80 block">
                  Judul Kebutuhan
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pengadaan Kitab Jurumiyyah (30 Eks)"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0f1a15] text-slate-900 dark:text-emerald-50 placeholder-slate-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-emerald-300/80 block">
                  Deskripsi & Jumlah
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan kebutuhan, jumlah, dan kelas..."
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0f1a15] text-slate-900 dark:text-emerald-50 placeholder-slate-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-150 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded text-slate-600 dark:text-emerald-300/80 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#1B4332] hover:bg-[#143326] text-white font-medium px-3.5 py-1.5 rounded text-xs transition-colors cursor-pointer"
                >
                  Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PERMOHONAN */}
      {selectedDetailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121f1a] rounded-lg shadow-lg max-w-sm w-full overflow-hidden border border-slate-200 dark:border-emerald-900/40">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-emerald-900/40">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-emerald-50">
                Detail Kebutuhan
              </h3>
              <button
                onClick={() => setSelectedDetailRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {formatIndonesianDate(selectedDetailRequest.createdAt)}
                </span>
                <div>{getStatusBadge(selectedDetailRequest.status)}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Kebutuhan</span>
                <p className="font-medium text-slate-900 dark:text-emerald-50 text-xs mt-0.5">
                  {selectedDetailRequest.title}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Kategori</span>
                <p className="text-slate-700 dark:text-emerald-300/80 text-xs mt-0.5">
                  {selectedDetailRequest.category}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Deskripsi / Keterangan</span>
                <p className="text-slate-700 dark:text-emerald-300/80 text-xs mt-0.5 leading-relaxed bg-slate-50 dark:bg-[#0f1a15] p-2.5 rounded border border-stone-150 dark:border-stone-750">
                  {selectedDetailRequest.description}
                </p>
              </div>

              {selectedDetailRequest.decisionNote && (
                <div>
                  <span className="text-[10px] text-slate-400 block">Catatan Disposisi</span>
                  <p className="text-slate-800 dark:text-emerald-100 text-xs mt-0.5 bg-slate-50 dark:bg-[#0f1a15] p-2.5 rounded border border-stone-150 dark:border-stone-750">
                    {selectedDetailRequest.decisionNote}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDetailRequest(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#0f1a15] text-slate-700 dark:text-emerald-300/80 rounded text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KEPSEK DECISION */}
      {decisionModal.isOpen && decisionModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121f1a] rounded-lg shadow-lg max-w-sm w-full overflow-hidden border border-slate-200 dark:border-emerald-900/40">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-emerald-900/40">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-emerald-50">
                {decisionModal.action === 'APPROVED' ? 'Setujui Pengajuan' : decisionModal.action === 'REJECTED' ? 'Tolak Pengajuan' : 'Tandai Selesai'}
              </h3>
              <button
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Kebutuhan:</span>
                <p className="font-medium text-slate-900 dark:text-emerald-50 text-xs mt-0.5">
                  {decisionModal.request.title}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-emerald-300/80 block">
                  Catatan Disposisi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Tambahkan catatan singkat..."
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0f1a15] text-slate-900 dark:text-emerald-50 placeholder-slate-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-150 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                  className="px-3 py-1.5 text-slate-600 dark:text-emerald-300/80 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50 rounded text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`px-3.5 py-1.5 text-white font-medium rounded text-xs transition-colors cursor-pointer ${
                    decisionModal.action === 'APPROVED' || decisionModal.action === 'COMPLETED'
                      ? 'bg-[#1B4332] hover:bg-[#143326]'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#121f1a] rounded-lg shadow-lg max-w-xs w-full p-4 space-y-3 text-xs border border-slate-200 dark:border-emerald-900/40">
            <h3 className="font-semibold text-xs text-slate-900 dark:text-emerald-50">
              Hapus Pengajuan?
            </h3>
            <p className="text-slate-500 dark:text-emerald-400/70 text-xs">
              Data pengajuan ini akan dihapus.
            </p>
            <div className="pt-2 flex justify-end gap-2 border-t border-stone-150 dark:border-emerald-900/40">
              <button
                onClick={() => setDeleteModal({ isOpen: false, requestId: null })}
                className="px-3 py-1.5 text-slate-600 dark:text-emerald-300/80 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50 rounded text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (deleteModal.requestId) {
                    await deleteLearningNeedRequest(deleteModal.requestId);
                    setDeleteModal({ isOpen: false, requestId: null });
                    toast.success('Pengajuan berhasil dihapus');
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-medium cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
