import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher, PositionCategory, UnitType, UserRole } from '../types';
import { formatRupiah } from '../utils/formatters';

export const MasterTeachers: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useHRIS();

  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

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
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, formData);
      setEditingTeacher(null);
    } else {
      addTeacher(formData);
      setIsAddingTeacher(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru, NIP, atau jabatan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN', 'UMUM'].map((unit) => (
              <button
                key={unit}
                onClick={() => setUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  unitFilter === unit
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {unit === 'ALL' ? 'Semua' : unit}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Guru</span>
        </button>
      </div>

      {/* Clean Teachers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-3 text-center w-10">No</th>
                <th className="py-2.5 px-4">Nama & NIP</th>
                <th className="py-2.5 px-3">Jabatan</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3 text-right">Gaji Pokok</th>
                <th className="py-2.5 px-3 text-right">Kafa'ah / Jam</th>
                <th className="py-2.5 px-3 text-right">Transport / Hari</th>
                <th className="py-2.5 px-3 text-center">Akses</th>
                <th className="py-2.5 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <p className="font-semibold text-slate-900">{t.name || '-'}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{t.nip || '-'}</p>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">
                    {t.position}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {t.unit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                    {formatRupiah(t.baseSalary)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-emerald-800">
                    {formatRupiah(t.hourlyRate)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {formatRupiah(t.dailyTransport)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                      t.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-700'
                        : t.role === 'KEPALA_PESANTREN'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-slate-600'
                    }`}>
                      {t.role === 'ADMIN' ? 'Admin' : t.role === 'KEPALA_PESANTREN' ? 'Kepsek' : 'Guru'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                        title="Edit Data Guru"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data ${t.name}?`)) {
                            deleteTeacher(t.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Hapus Guru"
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

      {/* Edit / Add Modal */}
      {(editingTeacher || isAddingTeacher) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Contoh: Ust Fuad Arqom M"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Jabatan</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Kepsek SMP">Kepsek SMP</option>
                    <option value="Kepsek MA">Kepsek MA</option>
                    <option value="Kepsek Pesantren">Kepsek Pesantren</option>
                    <option value="Wakasek SMP">Wakasek SMP</option>
                    <option value="Wakasek Pesantren">Wakasek Pesantren</option>
                    <option value="Sekretaris Pesantren">Sekretaris Pesantren</option>
                    <option value="Operator Sekolah">Operator Sekolah</option>
                    <option value="Guru (Ust Muqim)">Guru (Ust Muqim)</option>
                    <option value="Guru (Ustadzah Muqim)">Guru (Ustadzah Muqim)</option>
                    <option value="Guru Mukim">Guru Mukim</option>
                    <option value="Guru SMP">Guru SMP</option>
                    <option value="Guru MA">Guru MA</option>
                    <option value="Guru Pesantren">Guru Pesantren</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">PESANTREN</option>
                    <option value="UMUM">UMUM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Kafa'ah/Jam (Rp)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-emerald-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Transport/Hari (Rp)</label>
                  <input
                    type="number"
                    value={formData.dailyTransport}
                    onChange={(e) => setFormData({ ...formData, dailyTransport: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Hak Akses</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                >
                  <option value="GURU">Guru</option>
                  <option value="ADMIN">Admin</option>
                  <option value="KEPALA_PESANTREN">Kepala Pesantren</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsAddingTeacher(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
