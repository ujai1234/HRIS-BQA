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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Menunggu
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[9px] font-bold bg-[#DAF1DE] text-[#163832] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#163832]" />
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ditolak
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Selesai
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Clean Minimalist Header */}
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200/80 dark:border-[#163832] rounded-[16px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight font-sans">
            {isKepsek 
              ? `Persetujuan Kebutuhan (${kepsekUnit})` 
              : currentRole === 'GURU' 
                ? 'Pengajuan Kebutuhan' 
                : 'Persetujuan Kebutuhan Sarana'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8EB69B] font-semibold">
            {isKepsek 
              ? `Verifikasi dan persetujuan pengadaan kebutuhan guru unit ${kepsekUnit}.`
              : currentRole === 'GURU'
                ? 'Daftar pengajuan kebutuhan sarana pembelajaran.'
                : 'Rekapitulasi pengajuan sarana pembelajaran seluruh unit.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentRole === 'GURU' ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] px-4 py-2.5 rounded-[12px] text-xs font-bold shadow-xs transition-all cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Ajukan Kebutuhan</span>
            </button>
          ) : (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#163832] dark:hover:bg-[#0B2B26] text-slate-900 dark:text-[#DAF1DE] px-4 py-2.5 rounded-[12px] text-xs font-bold border border-slate-200 dark:border-[#0B2B26] transition-all cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <FileText className="w-3.5 h-3.5 text-slate-900 dark:text-[#DAF1DE]" strokeWidth={2} />
              <span>Ekspor PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Proportional Compact Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0B2B26] border border-slate-200/80 dark:border-[#163832] rounded-[16px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative overflow-hidden group">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#8EB69B] block">
            Total Pengajuan
          </span>
          <p className="text-4xl font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight mt-1 mb-2">
            {metrics.total}
          </p>
          <span className="text-[10px] font-medium text-[#8EB69B] block">
            Seluruh usulan sarana
          </span>
        </div>

        <div className="bg-white dark:bg-[#0B2B26] p-5 rounded-[16px] border border-slate-200 dark:border-[#163832] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#8EB69B] block">
            Menunggu Persetujuan
          </span>
          <p className="text-4xl font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight mt-1 mb-2">
            {metrics.pending}
          </p>
          <span className="text-[10px] font-medium text-slate-500 dark:text-[#8EB69B] block">
            Perlu telaah Kepala Unit
          </span>
        </div>

        <div className="bg-white dark:bg-[#0B2B26] p-5 rounded-[16px] border border-slate-200 dark:border-[#163832] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#8EB69B] block">
            Disetujui
          </span>
          <p className="text-4xl font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight mt-1 mb-2">
            {metrics.approved}
          </p>
          <span className="text-[10px] font-medium text-slate-500 dark:text-[#8EB69B] block">
            Siap direalisasikan
          </span>
        </div>

        <div className="bg-white dark:bg-[#0B2B26] p-5 rounded-[16px] border border-slate-200 dark:border-[#163832] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#8EB69B] block">
            Ditolak
          </span>
          <p className="text-4xl font-bold text-slate-900 dark:text-[#DAF1DE] tracking-tight mt-1 mb-2">
            {metrics.rejected}
          </p>
          <span className="text-[10px] font-medium text-slate-500 dark:text-[#8EB69B] block">
            Belum dapat disetujui
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200/80 dark:border-[#163832] rounded-[16px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="relative flex-1 sm:w-64 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8EB69B]" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kebutuhan atau nama guru..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-xs font-bold text-slate-900 dark:text-[#DAF1DE] focus:outline-none focus:ring-2 focus:ring-[#8EB69B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#DAF1DE] focus:outline-none focus:ring-2 focus:ring-[#8EB69B] cursor-pointer"
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
            className="px-3 py-2 bg-slate-50 dark:bg-[#163832] border border-slate-200 dark:border-[#0B2B26] rounded-[12px] text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#DAF1DE] focus:outline-none focus:ring-2 focus:ring-[#8EB69B] cursor-pointer"
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
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200/80 dark:border-[#163832] rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8EB69B]">
            Tidak ada data pengajuan yang sesuai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#163832] text-slate-500 dark:text-[#8EB69B] font-bold border-b border-slate-200 dark:border-[#0B2B26] text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kebutuhan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Pengaju</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#163832]">
                {filteredRequests.map((req) => {
                  const teacher = teacherMap.get(req.teacherId);
                  const isOwner = req.teacherId === currentUser?.id;

                  return (
                    <tr 
                      key={req.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#163832]/30 transition-colors"
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap text-slate-900 dark:text-[#DAF1DE]">
                        {formatIndonesianDate(req.createdAt)}
                      </td>

                      {/* Kebutuhan (Judul & Ringkasan) */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-[#DAF1DE]">
                          {req.title}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-semibold line-clamp-1 mt-0.5">
                          {req.description}
                        </p>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-[#DAF1DE] whitespace-nowrap">
                        {req.category}
                      </td>

                      {/* Pengaju */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900 dark:text-[#DAF1DE]">
                          {teacher?.name || 'Asatidz'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-[#8EB69B] font-semibold mt-0.5">
                          Unit {teacher?.unit || 'SMP'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {getStatusBadge(req.status)}
                        {req.decisionNote && (
                          <p className="text-[9px] text-[#8EB69B] font-semibold mt-1.5 max-w-[180px] truncate mx-auto" title={req.decisionNote}>
                            {req.decisionNote}
                          </p>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            onClick={() => setSelectedDetailRequest(req)}
                            className="px-3 py-1.5 text-[10px] font-bold text-slate-900 dark:text-[#DAF1DE] bg-slate-50 dark:bg-[#163832] hover:bg-slate-100 dark:hover:bg-[#0B2B26] rounded-[8px] border border-slate-200 dark:border-[#0B2B26] transition-colors cursor-pointer uppercase tracking-wider"
                          >
                            Detail
                          </button>

                          {/* Approval Actions for Kepsek */}
                          {isKepsek && req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleOpenDecision(req, 'APPROVED')}
                                className="px-3 py-1.5 text-[10px] font-bold text-[#DAF1DE] bg-[#163832] hover:bg-[#0B2B26] rounded-[8px] transition-colors cursor-pointer uppercase tracking-wider"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleOpenDecision(req, 'REJECTED')}
                                className="px-3 py-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-[8px] border border-rose-200 transition-colors cursor-pointer uppercase tracking-wider"
                              >
                                Tolak
                              </button>
                            </>
                          )}

                          {/* Delete Action (Owner or Admin) */}
                          {(isOwner || currentRole === 'ADMIN') && req.status === 'PENDING' && (
                            <button
                              onClick={() => setDeleteModal({ isOpen: true, requestId: req.id })}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={2} />
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
          <div className="bg-white dark:bg-[#0B2B26] rounded-[16px] shadow-lg max-w-md w-full overflow-hidden border border-slate-200 dark:border-[#163832]">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-[#163832]">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">
                Pengajuan Kebutuhan Baru
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#DAF1DE] p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-[#8EB69B] block">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-1.5 rounded-[8px] border border-slate-200 dark:border-[#0B2B26] bg-slate-50 dark:bg-[#163832] text-slate-900 dark:text-[#DAF1DE] focus:outline-none focus:border-[#8EB69B]"
                >
                  <option value="Buku">Buku & Kitab</option>
                  <option value="Alat Tulis">Alat Tulis (ATK)</option>
                  <option value="Sarana">Sarana Kelas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-[#8EB69B] block">
                  Judul Kebutuhan
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pengadaan Kitab Jurumiyyah (30 Eks)"
                  className="w-full text-xs px-2.5 py-1.5 rounded-[8px] border border-slate-200 dark:border-[#0B2B26] bg-slate-50 dark:bg-[#163832] text-slate-900 dark:text-[#DAF1DE] placeholder-slate-400 dark:placeholder-[#8EB69B] focus:outline-none focus:border-[#8EB69B]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-[#8EB69B] block">
                  Deskripsi & Jumlah
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan kebutuhan, jumlah, dan kelas..."
                  className="w-full text-xs px-2.5 py-1.5 rounded-[8px] border border-slate-200 dark:border-[#0B2B26] bg-slate-50 dark:bg-[#163832] text-slate-900 dark:text-[#DAF1DE] placeholder-slate-400 dark:placeholder-[#8EB69B] focus:outline-none focus:border-[#8EB69B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-150 dark:border-[#163832]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-[8px] text-slate-600 dark:text-[#8EB69B] hover:bg-slate-50 dark:bg-[#163832] dark:hover:bg-[#0B2B26] text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE] text-white dark:text-[#051F20] font-medium px-3.5 py-1.5 rounded-[8px] text-xs transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-[#0B2B26] rounded-[16px] shadow-lg max-w-sm w-full overflow-hidden border border-slate-200 dark:border-[#163832]">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-[#163832]">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">
                Detail Kebutuhan
              </h3>
              <button
                onClick={() => setSelectedDetailRequest(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#DAF1DE] p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-[#8EB69B] font-mono">
                  {formatIndonesianDate(selectedDetailRequest.createdAt)}
                </span>
                <div>{getStatusBadge(selectedDetailRequest.status)}</div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Kebutuhan</span>
                <p className="font-medium text-slate-900 dark:text-[#DAF1DE] text-xs mt-0.5">
                  {selectedDetailRequest.title}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Kategori</span>
                <p className="text-slate-700 dark:text-[#DAF1DE] text-xs mt-0.5">
                  {selectedDetailRequest.category}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Deskripsi / Keterangan</span>
                <p className="text-slate-700 dark:text-[#DAF1DE] text-xs mt-0.5 leading-relaxed bg-slate-50 dark:bg-[#163832] p-2.5 rounded-[8px] border border-stone-150 dark:border-[#0B2B26]">
                  {selectedDetailRequest.description}
                </p>
              </div>

              {selectedDetailRequest.decisionNote && (
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Catatan Disposisi</span>
                  <p className="text-slate-800 dark:text-[#DAF1DE] text-xs mt-0.5 bg-slate-50 dark:bg-[#163832] p-2.5 rounded-[8px] border border-stone-150 dark:border-[#0B2B26]">
                    {selectedDetailRequest.decisionNote}
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDetailRequest(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#163832] text-slate-700 dark:text-[#DAF1DE] rounded-[8px] text-xs font-medium hover:bg-slate-200 dark:hover:bg-[#0B2B26] transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-[#0B2B26] rounded-[16px] shadow-lg max-w-sm w-full overflow-hidden border border-slate-200 dark:border-[#163832]">
            <div className="px-4 py-3 flex items-center justify-between border-b border-stone-150 dark:border-[#163832]">
              <h3 className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">
                {decisionModal.action === 'APPROVED' ? 'Setujui Pengajuan' : decisionModal.action === 'REJECTED' ? 'Tolak Pengajuan' : 'Tandai Selesai'}
              </h3>
              <button
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#DAF1DE] p-1 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-[#8EB69B] block">Kebutuhan:</span>
                <p className="font-medium text-slate-900 dark:text-[#DAF1DE] text-xs mt-0.5">
                  {decisionModal.request.title}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-600 dark:text-[#8EB69B] block">
                  Catatan Disposisi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Tambahkan catatan singkat..."
                  className="w-full text-xs px-2.5 py-1.5 rounded-[8px] border border-slate-200 dark:border-[#0B2B26] bg-slate-50 dark:bg-[#163832] text-slate-900 dark:text-[#DAF1DE] placeholder-slate-400 dark:placeholder-[#8EB69B] focus:outline-none focus:border-[#8EB69B]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-150 dark:border-[#163832]">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                  className="px-3 py-1.5 text-slate-600 dark:text-[#8EB69B] hover:bg-slate-50 dark:bg-[#163832] dark:hover:bg-[#0B2B26] rounded-[8px] text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`px-3.5 py-1.5 text-white dark:text-[#051F20] font-medium rounded-[8px] text-xs transition-colors cursor-pointer ${
                    decisionModal.action === 'APPROVED' || decisionModal.action === 'COMPLETED'
                      ? 'bg-[#163832] hover:bg-[#0B2B26] dark:bg-[#8EB69B] dark:hover:bg-[#DAF1DE]'
                      : 'bg-rose-700 hover:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-700'
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
          <div className="bg-white dark:bg-[#0B2B26] rounded-[16px] shadow-lg max-w-xs w-full p-4 space-y-3 text-xs border border-slate-200 dark:border-[#163832]">
            <h3 className="font-semibold text-xs text-slate-900 dark:text-[#DAF1DE]">
              Hapus Pengajuan?
            </h3>
            <p className="text-slate-500 dark:text-[#8EB69B] text-xs">
              Data pengajuan ini akan dihapus.
            </p>
            <div className="pt-2 flex justify-end gap-2 border-t border-stone-150 dark:border-[#163832]">
              <button
                onClick={() => setDeleteModal({ isOpen: false, requestId: null })}
                className="px-3 py-1.5 text-slate-600 dark:text-[#8EB69B] hover:bg-slate-50 dark:bg-[#163832] dark:hover:bg-[#0B2B26] rounded-[8px] text-xs font-medium cursor-pointer"
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
                className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-[8px] text-xs font-medium cursor-pointer"
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
