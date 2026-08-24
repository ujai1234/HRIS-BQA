import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2 } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule, DayOfWeek, UnitType } from '../types';

export const MasterSchedules: React.FC = () => {
  const { schedules, teachers, addSchedule, updateSchedule, deleteSchedule } = useHRIS();

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);

  const [formData, setFormData] = useState<Omit<ClassSchedule, 'id'>>({
    teacherId: teachers[0]?.id || 'T-01',
    subject: '',
    className: 'VII-A (SMP)',
    unit: 'SMP',
    dayOfWeek: 'Senin',
    startTime: '07:30',
    endTime: '08:50',
    hours: 2,
    room: 'Kelas 7A',
  });

  const filteredSchedules = schedules.filter((s) => {
    const teacher = teachers.find((t) => t.id === s.teacherId);
    const matchesSearch =
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher && teacher.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDay = selectedDayFilter === 'ALL' || s.dayOfWeek === selectedDayFilter;
    const matchesUnit = selectedUnitFilter === 'ALL' || s.unit === selectedUnitFilter;

    return matchesSearch && matchesDay && matchesUnit;
  });

  const handleOpenEdit = (sched: ClassSchedule) => {
    setEditingSchedule(sched);
    setFormData({
      teacherId: sched.teacherId,
      subject: sched.subject,
      className: sched.className,
      unit: sched.unit,
      dayOfWeek: sched.dayOfWeek,
      startTime: sched.startTime,
      endTime: sched.endTime,
      hours: sched.hours,
      room: sched.room,
    });
  };

  const handleOpenAdd = () => {
    setIsAddingSchedule(true);
    setEditingSchedule(null);
    setFormData({
      teacherId: teachers[0]?.id || 'T-01',
      subject: '',
      className: 'VII-A (SMP)',
      unit: 'SMP',
      dayOfWeek: 'Senin',
      startTime: '07:30',
      endTime: '08:50',
      hours: 2,
      room: 'Kelas 7A',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;

    if (editingSchedule) {
      updateSchedule(editingSchedule.id, formData);
      setEditingSchedule(null);
    } else {
      addSchedule(formData);
      setIsAddingSchedule(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap flex-1 items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, guru, kelas, ruang..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
          </div>

          {/* Day Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDayFilter === day
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {day === 'ALL' ? 'Semua Hari' : day}
              </button>
            ))}
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedUnitFilter === unit
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {unit === 'ALL' ? 'Semua Unit' : unit}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-3 text-center w-16">Hari</th>
                <th className="py-2.5 px-3">Waktu & JP</th>
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-3">Kelas & Unit</th>
                <th className="py-2.5 px-4">Guru Pengampu</th>
                <th className="py-2.5 px-3">Ruang</th>
                <th className="py-2.5 px-3 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSchedules.map((s) => {
                const teacher = teachers.find((t) => t.id === s.teacherId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {s.dayOfWeek}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-mono font-medium text-slate-900">{s.startTime} - {s.endTime}</p>
                      <p className="text-[11px] text-emerald-800 font-semibold">{s.hours} JP</p>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {s.subject}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{s.className}</p>
                      <p className="text-[10px] text-slate-400">{s.unit}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-900">{teacher?.name || 'Guru'}</p>
                      <p className="text-[10px] text-slate-400">{teacher?.position || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {s.room}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus jadwal ${s.subject}?`)) {
                              deleteSchedule(s.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {(editingSchedule || isAddingSchedule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsAddingSchedule(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position} - {t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Contoh: Nahwu & Sharaf"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    required
                    placeholder="Contoh: VII-A (SMP)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
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
                  <label className="block font-medium text-slate-600 mb-1">Hari</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Mulai</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Selesai</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Jumlah JP</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Ruang</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Contoh: Kelas 7A"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setIsAddingSchedule(false);
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
