import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  Building2, 
  Phone,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { Teacher, PositionCategory, UnitType, UserRole } from '../types';
import { formatRupiah } from '../utils/formatters';

export const MasterTeachers: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, currentRole } = useHRIS();

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
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.position.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200/80">
              Master Data Tenaga Pendidik
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Total {teachers.length} Guru / Asatidz Terdaftar
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Master Data Guru & Skema Honorarium</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi Gaji Pokok, Tarif Jam Mengajar (Rp 40.000), Uang Transport Harian (Rp 10.000), dan Hak Akses Pengguna.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Guru Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP, atau jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">Unit:</span>
          {['ALL', 'SMP', 'MA', 'PESANTREN', 'UMUM'].map((unit) => (
            <button
              key={unit}
              onClick={() => setUnitFilter(unit)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                unitFilter === unit
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {unit === 'ALL' ? 'Semua Unit' : unit}
            </button>
          ))}
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-3">Jabatan / Amanah</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3 text-right">Tarif / Jam</th>
                <th className="py-3 px-3 text-right">Transport / Hari</th>
                <th className="py-3 px-3 text-center">Hak Akses (Role)</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTeachers.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-center text-slate-400 font-mono">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg ${t.avatarColor || 'bg-emerald-600'} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs`}>
                        {t.name.split(' ')[0]?.[0]}
                        {t.name.split(' ')[1]?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{t.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{t.nip}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {t.position}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                      {t.unit}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-900">
                    {formatRupiah(t.baseSalary)}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                    {formatRupiah(t.hourlyRate)}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-teal-700">
                    {formatRupiah(t.dailyTransport)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      t.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : t.role === 'KEPALA_PESANTREN'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.role === 'ADMIN' ? 'Admin' : t.role === 'KEPALA_PESANTREN' ? 'Kepala Pesantren' : 'Guru'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        title="Edit Data Guru"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus data ${t.name}?`)) {
                            deleteTeacher(t.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingTeacher ? 'Edit Data Asatidz / Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingTeacher(null);
                  setIsAddingTeacher(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap (Gelar)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Contoh: Ust Fuad Arqom M"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jabatan / Amanah</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value as PositionCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-slate-700 mb-1">Unit Penugasan</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-slate-700 mb-1">Gaji Pokok (Rp)</label>
                  <input
                    type="number"
                    step="50000"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tarif / Jam (Rp)</label>
                  <input
                    type="number"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transport / Hari (Rp)</label>
                  <input
                    type="number"
                    value={formData.dailyTransport}
                    onChange={(e) => setFormData({ ...formData, dailyTransport: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold text-teal-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran Akses (RBAC)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="GURU">Guru (Melihat jadwal, clock-in, isi jurnal, cetak slip)</option>
                  <option value="ADMIN">Admin (Mengelola master data, jadwal, badal, payroll)</option>
                  <option value="KEPALA_PESANTREN">Kepala Pesantren (View-only ringkasan ketaatan & payroll)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeacher(null);
                    setIsAddingTeacher(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
