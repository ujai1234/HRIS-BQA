import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, UserPlus, CreditCard, FileText, ChevronRight, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const MasterStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nis: '',
    nik: '',
    kkNumber: '',
    name: '',
    gender: 'L',
    className: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      toast.error('Gagal memuat data santri');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = !!editingId;
      const url = isEdit ? `/api/students/${editingId}` : '/api/students';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(isEdit ? 'Data santri berhasil diperbarui' : 'Santri berhasil ditambahkan');
        setShowModal(false);
        setEditingId(null);
        fetchStudents();
        setFormData({ nis: '', nik: '', kkNumber: '', name: '', gender: 'L', className: '' });
      } else {
        toast.error('Gagal menyimpan data santri');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ nis: '', nik: '', kkNumber: '', name: '', gender: 'L', className: '' });
    setShowModal(true);
  };

  const openEditModal = (student: any) => {
    setEditingId(student.id);
    setFormData({
      nis: student.nis || '',
      nik: student.nik || '',
      kkNumber: student.kkNumber || '',
      name: student.name || '',
      gender: student.gender || 'L',
      className: student.className || ''
    });
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Map Excel columns to our schema
        const mappedData = data.map((row: any) => ({
          nis: String(row.NIS || row.nis || ''),
          nisn: String(row.NISN || row.nisn || ''),
          name: String(row.Nama || row.NAMA || row.name || ''),
          gender: String(row.L_P || row.Gender || row.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
          className: String(row.Kelas || row.kelas || row.className || '')
        })).filter(s => s.name && s.nis);

        if (mappedData.length === 0) {
          toast.error('Gagal membaca data. Pastikan kolom Excel memiliki judul NIS, Nama, Kelas.');
          return;
        }

        const res = await fetch('/api/students/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedData)
        });

        if (res.ok) {
          const result = await res.json();
          toast.success(`Berhasil mengimpor ${result.count} data santri`);
          fetchStudents();
        } else {
          toast.error('Gagal menyimpan data import ke server');
        }
      } catch (error) {
        toast.error('Terjadi kesalahan saat membaca file Excel');
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nis.includes(searchTerm) ||
    s.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bqa-card p-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-emerald-50">Master Data Santri</h2>
          <p className="text-sm text-slate-500 dark:text-emerald-400/70 mt-1">Kelola data santri aktif, NIK, dan kelas.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-100 dark:bg-emerald-950/50 hover:bg-slate-200 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-emerald-100 px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm border border-slate-200 dark:border-emerald-800/40"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama, NIS, atau kelas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#121f1a] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-emerald-100 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bqa-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0f1a15] text-slate-500 dark:text-emerald-400/80 border-b border-slate-200 dark:border-emerald-900/40">
              <tr>
                <th className="px-6 py-4 font-semibold">NIS</th>
                <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
                <th className="px-6 py-4 font-semibold">Jenis Kelamin</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Tidak ada santri ditemukan.</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-[#162720]/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-emerald-300/80">{student.nis}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-emerald-50">{student.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${student.gender === 'L' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'}`}>
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-emerald-100">{student.className}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openEditModal(student)} className="text-emerald-600 hover:text-emerald-700 font-medium text-xs">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#121f1a] rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 dark:border-emerald-900/40 flex justify-between items-center bg-slate-50 dark:bg-[#0f1a15]">
              <h3 className="font-bold text-slate-800 dark:text-emerald-50">{editingId ? 'Edit Data Santri' : 'Tambah Santri Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">NIS</label>
                <input required type="text" value={formData.nis} onChange={e => setFormData({...formData, nis: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">NIK (KTP/KIA)</label>
                  <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">No. KK</label>
                  <input type="text" value={formData.kkNumber} onChange={e => setFormData({...formData, kkNumber: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Jenis Kelamin</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500">
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-emerald-300/80 mb-1">Kelas Utama</label>
                  <input required type="text" placeholder="Misal: 7A" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg text-sm dark:text-white outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-emerald-900/40 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">Simpan Data</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
