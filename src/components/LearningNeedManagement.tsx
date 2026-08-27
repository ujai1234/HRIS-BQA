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

  // KPI Metrics
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
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("PESANTREN BAITUL QUR'AN AL-IKHWAN", 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("REKAPITULASI PENGAJUAN KEBUTUHAN SARANA PEMBELAJARAN", 14, 21);
      doc.text(`Unit: ${isKepsek ? kepsekUnit : 'Semua Unit'} | Dicetak: ${todayStr}`, 14, 26);

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
      doc.save(`Laporan_Kebutuhan_BQ_${fileDate}.pdf`);
      toast.success('Laporan PDF pengajuan kebutuhan berhasil diunduh');
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
    toast.success('Pengajuan kebutuhan sarana berhasil dikirim ke Kepala Unit');
  };

  const handleOpenDecision = (req: LearningNeedRequest, action: LearningNeedStatus) => {
    let defaultNote = '';
    if (action === 'APPROVED') defaultNote = 'Disetujui untuk pengadaan sarana KBM.';
    else if (action === 'REJECTED') defaultNote = 'Belum dapat disetujui, stok masih mencukupi.';
    else if (action === 'COMPLETED') defaultNote = 'Fasilitas telah diserahkan kepada guru.';

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
    toast.success('Status permohonan berhasil diperbarui');
  };

  const getStatusBadge = (status: LearningNeedStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Menunggu
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Disetujui
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Ditolak
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Terpenuhi
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {isKepsek 
                ? `Persetujuan Kebutuhan Sarana (${kepsekUnit})` 
                : currentRole === 'GURU' 
                  ? 'Pengajuan Kebutuhan Sarana Pembelajaran' 
                  : 'Monitoring Kebutuhan Sarana KBM'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
              {isKepsek 
                ? 'Verifikasi, disposisi, dan persetujuan pengadaan buku, ATK, dan sarana kelas untuk asatidz.' 
                : currentRole === 'GURU' 
                  ? 'Ajukan permohonan sarana pendukung KBM untuk ditinjau oleh Kepala Unit.' 
                  : 'Rekapitulasi seluruh pengajuan sarana pembelajaran di lingkungan Pesantren Baitul Qur\'an.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {currentRole === 'GURU' ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>Ajukan Kebutuhan</span>
              </button>
            ) : (
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center gap-2 bg-stone-50 hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700 transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Ekspor PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Sleek Minimalist Metric Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-100 dark:border-stone-800">
          <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/30 border border-stone-100 dark:border-stone-800/60">
            <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Total Pengajuan
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{metrics.total}</span>
              <span className="text-xs text-stone-500 dark:text-stone-400">Berkas</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100/80 dark:border-amber-900/30">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] font-semibold text-amber-800/80 dark:text-amber-300/80 uppercase tracking-wider block">
                Menunggu Review
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-amber-700 dark:text-amber-300">{metrics.pending}</span>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80">Antrean</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-800/80 dark:text-emerald-300/80 uppercase tracking-wider block">
                Disetujui
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{metrics.approved}</span>
              <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Pengadaan</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/80 dark:border-rose-900/30">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="text-[10px] font-semibold text-rose-800/80 dark:text-rose-300/80 uppercase tracking-wider block">
                Ditolak
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-bold text-rose-700 dark:text-rose-400">{metrics.rejected}</span>
              <span className="text-xs text-rose-600/80 dark:text-rose-400/80">Ditolak</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-2.5" strokeWidth={1.5} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kebutuhan, nama guru, atau kata kunci..."
            className="w-full text-xs pl-9 pr-3.5 py-2 bg-stone-50/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#1B4332] dark:focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 bg-stone-50/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-200 focus:outline-none focus:border-[#1B4332] cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Review</option>
            <option value="APPROVED">Disetujui</option>
            <option value="COMPLETED">Terpenuhi</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs px-3 py-2 bg-stone-50/70 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-200 focus:outline-none focus:border-[#1B4332] cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Buku">Buku & Kitab</option>
            <option value="Alat Tulis">Alat Tulis (ATK)</option>
            <option value="Sarana">Sarana Kelas</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* 4. Requests List / Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              Tidak Ada Data Pengajuan
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {currentRole === 'GURU'
                ? 'Belum ada pengajuan sarana yang dibuat. Klik tombol di atas untuk mengajukan kebutuhan baru.'
                : 'Tidak ada pengajuan yang sesuai dengan kriteria filter saat ini.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {/* Header Columns (Desktop) */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50/50 dark:bg-stone-800/30 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              <div className="col-span-2">Tanggal & Kategori</div>
              <div className="col-span-4">Kebutuhan & Urgensi</div>
              <div className="col-span-2">Pengaju</div>
              <div className="col-span-2">Status & Disposisi</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>

            {/* Request Rows */}
            {filteredRequests.map((req) => {
              const teacher = teacherMap.get(req.teacherId);
              const isOwner = req.teacherId === currentUser?.id;

              return (
                <div 
                  key={req.id}
                  className="p-4 sm:px-6 sm:py-4 hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center text-xs">
                    {/* Col 1: Date & Category */}
                    <div className="lg:col-span-2 space-y-1">
                      <span className="font-mono text-stone-500 dark:text-stone-400 text-xs block">
                        {formatIndonesianDate(req.createdAt)}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium">
                        {req.category}
                      </span>
                    </div>

                    {/* Col 2: Title & Description */}
                    <div className="lg:col-span-4 space-y-1">
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                        {req.title}
                      </h4>
                      <p className="text-stone-500 dark:text-stone-400 text-xs line-clamp-1">
                        {req.description}
                      </p>
                    </div>

                    {/* Col 3: Teacher */}
                    <div className="lg:col-span-2 space-y-0.5">
                      <p className="font-semibold text-stone-800 dark:text-stone-200">
                        {teacher?.name || 'Asatidz'}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        Unit {teacher?.unit || 'SMP'}
                      </p>
                    </div>

                    {/* Col 4: Status */}
                    <div className="lg:col-span-2 space-y-1">
                      <div>{getStatusBadge(req.status)}</div>
                      {req.decisionNote && (
                        <p className="text-[11px] text-stone-500 italic line-clamp-1">
                          "{req.decisionNote}"
                        </p>
                      )}
                    </div>

                    {/* Col 5: Actions */}
                    <div className="lg:col-span-2 flex items-center justify-end gap-1.5 pt-2 lg:pt-0">
                      <button
                        onClick={() => setSelectedDetailRequest(req)}
                        className="px-2.5 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        Detail
                      </button>

                      {/* Kepsek Approval Actions */}
                      {isKepsek && req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleOpenDecision(req, 'APPROVED')}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#143326] rounded-lg transition-colors cursor-pointer"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleOpenDecision(req, 'REJECTED')}
                            className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                          >
                            Tolak
                          </button>
                        </>
                      )}

                      {/* Delete Action (Owner or Admin) */}
                      {(isOwner || currentRole === 'ADMIN') && req.status === 'PENDING' && (
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, requestId: req.id })}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pengajuan"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADD NEW LEARNING NEED (GURU) */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-stone-200/80 dark:border-stone-800">
            <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Pengajuan Kebutuhan Sarana
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Kategori Kebutuhan
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="Buku">Buku / Kitab Pembelajaran</option>
                  <option value="Alat Tulis">Alat Tulis Kantor & Kelas (ATK)</option>
                  <option value="Sarana">Sarana & Fasilitas Kelas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Nama / Judul Kebutuhan
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pengadaan Kitab Jurumiyyah (30 Eks)"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Deskripsi & Urgensi Penggunaan
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan spesifikasi jumlah, kelas yang membutuhkan, dan tujuan penggunaannya..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Kirim Permohonan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PERMOHONAN */}
      {selectedDetailRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-stone-200/80 dark:border-stone-800">
            <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                Rincian Kebutuhan
              </h3>
              <button
                onClick={() => setSelectedDetailRequest(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-[11px] font-mono text-stone-400 block">
                    {formatIndonesianDate(selectedDetailRequest.createdAt)}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                    Kategori: {selectedDetailRequest.category}
                  </span>
                </div>
                <div>{getStatusBadge(selectedDetailRequest.status)}</div>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {selectedDetailRequest.title}
                </h4>
              </div>

              <div className="bg-stone-50/70 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800/60">
                <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1">
                  Deskripsi / Urgensi:
                </span>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">
                  {selectedDetailRequest.description}
                </p>
              </div>

              {selectedDetailRequest.decisionNote && (
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
                  <span className="text-[10px] uppercase font-semibold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                    Catatan Disposisi:
                  </span>
                  <p className="text-stone-800 dark:text-stone-200 font-medium">
                    "{selectedDetailRequest.decisionNote}"
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedDetailRequest(null)}
                  className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-200/80 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-stone-200/80 dark:border-stone-800">
            <div className="px-6 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                {decisionModal.action === 'APPROVED' ? 'Setujui Pengajuan' : decisionModal.action === 'REJECTED' ? 'Tolak Pengajuan' : 'Tandai Selesai'}
              </h3>
              <button
                onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                Konfirmasi status permohonan untuk: <br />
                <strong className="text-stone-900 dark:text-stone-100 text-sm">{decisionModal.request.title}</strong>
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                  Catatan Disposisi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={decisionModal.note}
                  onChange={(e) => setDecisionModal({ ...decisionModal, note: e.target.value })}
                  placeholder="Tambahkan catatan atau petunjuk pengadaan..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ ...decisionModal, isOpen: false })}
                  className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecision}
                  className={`px-5 py-2 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs ${
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 text-xs border border-stone-200/80 dark:border-stone-800">
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              Hapus Pengajuan Kebutuhan?
            </h3>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Berkas permohonan akan dihapus secara permanen.
            </p>
            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteModal({ isOpen: false, requestId: null })}
                className="px-4 py-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-xs font-semibold cursor-pointer"
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
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
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
