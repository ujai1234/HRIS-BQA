import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, UploadCloud, RotateCcw } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher } from '../types';
import { formatRupiah, formatCurrencyInput, parseCurrencyInput, validateCurrencyRate, terbilang } from '../utils/formatters';
import { BulkTeacherUploadModal } from './BulkTeacherUploadModal';
import { KafaahManagementView } from './KafaahManagementView';
import { TeacherAvatar } from './TeacherAvatar';

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
    username: '',
    password: '',
  });

  // Currency input strings for modal validation
  const [baseSalaryInput, setBaseSalaryInput] = useState('700.000');
  const [hourlyRateInput, setHourlyRateInput] = useState('40.000');
  const [dailyTransportInput, setDailyTransportInput] = useState('10.000');
  const [monthlyTransportInput, setMonthlyTransportInput] = useState('250.000');
  const [monthlyMealInput, setMonthlyMealInput] = useState('375.000');

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
      username: teacher.username || '',
      password: teacher.password || '',
    });
    setBaseSalaryInput(formatCurrencyInput(teacher.baseSalary));
    setHourlyRateInput(formatCurrencyInput(teacher.hourlyRate));
    setDailyTransportInput(formatCurrencyInput(teacher.dailyTransport));
    setMonthlyTransportInput(formatCurrencyInput(teacher.monthlyTransport || 250000));
    setMonthlyMealInput(formatCurrencyInput(teacher.monthlyMealAllowance || 375000));
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
      username: '',
      password: '',
    });
    setBaseSalaryInput('800.000');
    setHourlyRateInput('40.000');
    setDailyTransportInput('10.000');
    setMonthlyTransportInput('250.000');
    setMonthlyMealInput('375.000');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalPayload = {
      ...formData,
      baseSalary: parseCurrencyInput(baseSalaryInput),
      hourlyRate: parseCurrencyInput(hourlyRateInput),
      dailyTransport: parseCurrencyInput(dailyTransportInput),
      monthlyTransport: parseCurrencyInput(monthlyTransportInput),
      monthlyMealAllowance: parseCurrencyInput(monthlyMealInput),
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[12px] border border-slate-200">
          <button
            id="subtab-profil-guru"
            onClick={() => setActiveSubView('profil_guru')}
            className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
              activeSubView === 'profil_guru'
                ? 'bg-[#163832] text-[#DAF1DE] shadow-xs'
                : 'text-[#8EB69B] hover:text-[#051F20]'
            }`}
          >
            Data Pokok Guru
          </button>

          <button
            id="subtab-tarif-kafaah"
            onClick={() => setActiveSubView('tarif_kafaah')}
            className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
              activeSubView === 'tarif_kafaah'
                ? 'bg-[#163832] text-[#DAF1DE] shadow-xs'
                : 'text-[#8EB69B] hover:text-[#051F20]'
            }`}
          >
            Manajemen Tarif Kafa'ah
          </button>
        </div>

        <span className="text-xs text-[#8EB69B] font-bold uppercase tracking-wider hidden sm:inline">
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
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, NIP, atau mapel..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-[12px] text-sm focus:ring-2 focus:ring-[#163832] outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1.5 rounded-[12px]">
                {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
                  <button
                    key={unit}
                    onClick={() => setUnitFilter(unit)}
                    className={`px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider ${
                      unitFilter === unit
                        ? 'bg-white text-[#051F20] shadow-xs border border-slate-200'
                        : 'text-[#8EB69B] hover:text-[#051F20]'
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
                className="inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-[10px] transition-colors cursor-pointer"
                title="Hapus Semua Data Guru"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Data</span>
              </button>

              <button
                id="bulk-upload-teacher-btn"
                onClick={() => setIsBulkUploadOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[#051F20] text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-[10px] border border-slate-200 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-1 bg-[#163832] hover:bg-[#0B2B26] text-[#DAF1DE] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-[10px] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Guru</span>
              </button>
            </div>
          </div>

          {/* Clean Teachers Table */}
          <div className="bqa-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[#8EB69B] text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-9">No</th>
                    <th className="py-3 px-4">Nama & NIP</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Gaji Pokok</th>
                    <th className="py-3 px-4 text-right">Honor / JP</th>
                    <th className="py-3 px-4 text-right">Transport</th>
                    <th className="py-3 px-4 text-center">Akses</th>
                    <th className="py-3 px-4 text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#051F20]">
                  {filteredTeachers.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center text-[#8EB69B] font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <TeacherAvatar teacher={t} size="sm" />
                          <div>
                            <p className="font-bold text-[#051F20]">{t.name || '-'}</p>
                            <p className="text-[11px] text-[#8EB69B] font-mono font-semibold">{t.nip || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {t.position}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold text-[#163832] bg-[#DAF1DE] px-2.5 py-1 rounded-[8px] uppercase tracking-wider">
                          {t.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#051F20]">
                        {formatRupiah(t.baseSalary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#163832] font-bold">
                        {formatRupiah(t.hourlyRate)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#8EB69B] font-bold">
                        {formatRupiah(t.dailyTransport)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-wider ${
                          t.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700'
                            : t.role === 'KEPALA_PESANTREN'
                            ? 'bg-amber-100 text-amber-700'
                            : 'text-[#163832] bg-[#DAF1DE]'
                        }`}>
                          {t.role === 'ADMIN' ? 'Admin' : t.role === 'KEPALA_PESANTREN' ? 'Kepsek' : 'Guru'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-[#8EB69B] hover:text-[#051F20] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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
                            className="p-1.5 text-[#8EB69B] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#0a120f]/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-[#121f1a] rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-slate-200 dark:border-emerald-900/40">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-emerald-900/40 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-emerald-50">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(false);
                }}
                className="text-slate-400 dark:text-emerald-500/60 hover:text-slate-600 dark:hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">NIP Guru</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-mono text-slate-900 dark:text-emerald-50"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-emerald-50"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">Pesantren</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Nama Lengkap</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ustadz Ahmad, Lc."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium text-slate-900 dark:text-emerald-50"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Email / Username</label>
                  <input
                    type="email"
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Email Gmail untuk Google Login"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium text-slate-900 dark:text-emerald-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Password (Opsional)</label>
                  <input
                    type="text"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Biarkan kosong jika SSO"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-emerald-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Jabatan / Tugas</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-emerald-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Nomor WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 628123456789"
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-emerald-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-emerald-400/70 font-medium block">Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-slate-900 dark:text-emerald-50"
                >
                  <option value="GURU">Guru Pengajar</option>
                  <option value="ADMIN">Administrator TU</option>
                  <option value="KEPALA_PESANTREN">Kepala Pesantren</option>
                  <option value="STAFF">Staff Pesantren</option>
                </select>
              </div>

              <div className="border-t border-slate-100 dark:border-emerald-900/40 pt-3 space-y-2.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-emerald-500/60 uppercase tracking-wider block">
                  Komponen Kafa'ah (Rupiah)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 dark:text-emerald-500/60 block">Gaji Pokok</label>
                    <input
                      type="text"
                      value={baseSalaryInput}
                      onChange={(e) => setBaseSalaryInput(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-emerald-50"
                    />
                  </div>
                  
                  {formData.role === 'STAFF' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 dark:text-emerald-500/60 block">Transport Bulanan</label>
                      <input
                        type="text"
                        value={monthlyTransportInput}
                        onChange={(e) => setMonthlyTransportInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-emerald-50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 dark:text-emerald-500/60 block">Transport / Hari</label>
                      <input
                        type="text"
                        value={dailyTransportInput}
                        onChange={(e) => setDailyTransportInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-emerald-50"
                      />
                    </div>
                  )}

                  {formData.role === 'STAFF' ? (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 dark:text-emerald-500/60 block">Uang Makan Bulanan</label>
                      <input
                        type="text"
                        value={monthlyMealInput}
                        onChange={(e) => setMonthlyMealInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none font-mono text-slate-900 dark:text-emerald-50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500 dark:text-emerald-500/60 block">Honor / JP</label>
                      <input
                        type="text"
                        value={hourlyRateInput}
                        onChange={(e) => setHourlyRateInput(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 dark:bg-[#0f1a15] border border-slate-200 dark:border-emerald-800/40 rounded-lg focus:outline-none font-mono text-emerald-800 dark:text-emerald-400 font-medium"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-emerald-900/40">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsAddingTeacher(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/40 text-slate-600 dark:text-emerald-400/70 hover:bg-slate-50 dark:bg-[#0f1a15] dark:hover:bg-[#162720]/50"
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
