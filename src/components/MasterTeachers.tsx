import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, UploadCloud, RotateCcw } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher } from '../types';
import { formatRupiah, formatCurrencyInput, parseCurrencyInput, validateCurrencyRate, terbilang } from '../utils/formatters';
import { BulkTeacherUploadModal } from './BulkTeacherUploadModal';
import { KafaahManagementView } from './KafaahManagementView';

export const MasterTeachers: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, resetTeachers } = useHRIS();

  const [activeSubView, setActiveSubView] = useState<'profil_guru' | 'tarif_kafaah'>('profil_guru');
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({
    nip: '',
    name: '',
    position: 'Guru Pesantren',
    unit: 'PESANTREN',
    baseSalary: 700000,
    hourlyRate: 40000,
    dailyTransport: 10000,
    role: 'GURU',
    phone: '',
    avatarColor: 'bg-emerald-700',
    isActive: true,
  });

  // Currency input strings for modal validation
  const [baseSalaryInput, setBaseSalaryInput] = useState('700.000');
  const [hourlyRateInput, setHourlyRateInput] = useState('40.000');
  const [dailyTransportInput, setDailyTransportInput] = useState('10.000');

  const handleReset = () => {
    if (window.confirm('PERINGATAN: Anda akan menghapus SELURUH data guru. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      resetTeachers();
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const tName = t.name || '';
    const tNip = t.nip || '';
    const tPos = t.position || '';
    const matchesSearch =
      tName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tNip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tPos.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = unitFilter === 'ALL' || t.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      nip: teacher.nip,
      name: teacher.name,
      position: teacher.position,
      unit: teacher.unit,
      baseSalary: teacher.baseSalary,
      hourlyRate: teacher.hourlyRate,
      dailyTransport: teacher.dailyTransport,
      role: teacher.role,
      phone: teacher.phone || '',
      avatarColor: teacher.avatarColor || 'bg-emerald-700',
      isActive: teacher.isActive,
    });
    setBaseSalaryInput(formatCurrencyInput(teacher.baseSalary));
    setHourlyRateInput(formatCurrencyInput(teacher.hourlyRate));
    setDailyTransportInput(formatCurrencyInput(teacher.dailyTransport));
  };

  const handleOpenAdd = () => {
    setIsAddingTeacher(true);
    setEditingTeacher(null);
    setFormData({
      nip: `PBQ-2026-${String(teachers.length + 1).padStart(3, '0')}`,
      name: '',
      position: 'Guru Pesantren',
      unit: 'PESANTREN',
      baseSalary: 700000,
      hourlyRate: 40000,
      dailyTransport: 10000,
      role: 'GURU',
      phone: '',
      avatarColor: 'bg-teal-700',
      isActive: true,
    });
    setBaseSalaryInput('700.000');
    setHourlyRateInput('40.000');
    setDailyTransportInput('10.000');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalPayload = {
      ...formData,
      baseSalary: parseCurrencyInput(baseSalaryInput),
      hourlyRate: parseCurrencyInput(hourlyRateInput),
      dailyTransport: parseCurrencyInput(dailyTransportInput),
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, finalPayload);
      setEditingTeacher(null);
    } else {
      addTeacher(finalPayload);
      setIsAddingTeacher(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Minimalist Sub-View Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            id="subtab-profil-guru"
            onClick={() => setActiveSubView('profil_guru')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeSubView === 'profil_guru'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Data Pokok Guru
          </button>

          <button
            id="subtab-tarif-kafaah"
            onClick={() => setActiveSubView('tarif_kafaah')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeSubView === 'tarif_kafaah'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Manajemen Tarif Kafa'ah
          </button>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
          {teachers.length} Guru
        </span>
      </div>

      {/* Render Active Sub-View */}
      {activeSubView === 'tarif_kafaah' ? (
        <KafaahManagementView />
      ) : (
        <div className="space-y-3.5">
          {/* Action and Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2.5">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIP, atau mapel..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setUnitFilter(unit)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      unitFilter === unit
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {unit === 'ALL' ? 'Semua' : unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="Hapus Semua Data Guru"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Data</span>
              </button>

              <button
                id="bulk-upload-teacher-btn"
                onClick={() => setIsBulkUploadOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Upload CSV</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-1 bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Guru</span>
              </button>
            </div>
          </div>

          {/* Clean Teachers Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/70 dark:border-slate-700">
                    <th className="py-2.5 px-3 text-center w-9">No</th>
                    <th className="py-2.5 px-4">Nama & NIP</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                    <th className="py-2.5 px-3 text-right">Honor / JP</th>
                    <th className="py-2.5 px-3 text-right">Transport</th>
                    <th className="py-2.5 px-3 text-center">Akses</th>
                    <th className="py-2.5 px-3 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredTeachers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 dark:text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{t.name || '-'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{t.nip || '-'}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {t.position}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {t.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800 dark:text-slate-200">
                        {formatRupiah(t.baseSalary)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400 font-medium">
                        {formatRupiah(t.hourlyRate)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatRupiah(t.dailyTransport)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          t.role === 'ADMIN'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                            : t.role === 'KEPALA_PESANTREN'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {t.role === 'ADMIN' ? 'Admin' : t.role === 'KEPALA_PESANTREN' ? 'Kepsek' : 'Guru'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data ${t.name}?`)) {
                                deleteTeacher(t.id);
                              }
                            }}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {(editingTeacher || isAddingTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(false);
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-medium block">NIP Guru</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-mono text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-medium block">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">Pesantren</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium block">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ustadz Ahmad, Lc."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-medium block">Jabatan / Tugas</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400 font-medium block">Hak Akses</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-slate-100"
                  >
                    <option value="GURU">Guru Pengajar</option>
                    <option value="ADMIN">Administrator TU</option>
                    <option value="KEPALA_PESANTREN">Kepala Pesantren</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider block">
                  Komponen Kafa'ah (Rupiah)
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-500 block">Gaji Pokok</label>
                    <input
                      type="text"
                      value={baseSalaryInput}
                      onChange={(e) => setBaseSalaryInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-500 block">Honor / JP</label>
                    <input
                      type="text"
                      value={hourlyRateInput}
                      onChange={(e) => setHourlyRateInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-mono text-emerald-800 dark:text-emerald-400 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-slate-500 block">Transport / Hari</label>
                    <input
                      type="text"
                      value={dailyTransportInput}
                      onChange={(e) => setDailyTransportInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsAddingTeacher(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white font-medium shadow-2xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkTeacherUploadModal 
          isOpen={isBulkUploadOpen} 
          onClose={() => setIsBulkUploadOpen(false)} 
        />
      )}
    </div>
  );
};
