import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  User, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter 
} from 'lucide-react';
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
    teacherId: teachers[7]?.id || 'T-08',
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
      teacherId: teachers[7]?.id || 'T-08',
      subject: '',
      className: 'VII-A (SMP)',
      unit: 'SMP',
      dayOfWeek: 'Senin',
      startTime: '07:30',
      endTime: '08:50',
      hours: 2,
      room: 'Kelas 7A - Gedung Abu Bakar',
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>Jadwal Mengajar Guru</span>
        </h2>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal Sesi</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mapel, nama guru, kelas, atau ruang..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Day Filter */}
          <div className="flex items-center gap-1 overflow-x-auto bg-slate-100/80 p-1 rounded-lg">
            {['ALL', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDayFilter === day
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {day === 'ALL' ? 'Semua Hari' : day}
              </button>
            ))}
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedUnitFilter === unit
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {unit === 'ALL' ? 'Semua Unit' : unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedules Grid / Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 text-center w-12">Hari</th>
                <th className="py-3 px-3">Waktu & JP</th>
                <th className="py-3 px-4">Mata Pelajaran / Kitab</th>
                <th className="py-3 px-3">Kelas & Unit</th>
                <th className="py-3 px-4">Guru Pengampu</th>
                <th className="py-3 px-3">Ruang / Lokasi</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSchedules.map((s) => {
                const teacher = teachers.find((t) => t.id === s.teacherId);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200/80">
                        {s.dayOfWeek}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.startTime} - {s.endTime}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        {s.hours} JP
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{s.subject}</span>
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 block">{s.className}</span>
                      <span className="text-[10px] text-slate-500">{s.unit}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${teacher?.avatarColor || 'bg-emerald-600'} flex items-center justify-center font-bold text-[10px] text-white shrink-0 shadow-xs`}>
                          {teacher?.name ? teacher.name.split(' ')[0]?.[0] : 'U'}
                          {teacher?.name ? (teacher.name.split(' ')[1]?.[0] || 'A') : 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{teacher?.name || 'Guru'}</p>
                          <p className="text-[10px] text-slate-400">{teacher?.position || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{s.room}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Edit Jadwal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus jadwal ${s.subject}?`)) {
                              deleteSchedule(s.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Sesi Jadwal Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsAddingSchedule(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position} - {t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran / Kitab</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  placeholder="Contoh: Nahwu & Sharaf (Matan Al-Jurumiyyah)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    required
                    placeholder="Contoh: VII-A (SMP) / Tahfidz Ula"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-slate-700 mb-1">Hari</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as DayOfWeek })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <label className="block font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jumlah Jam (JP)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ruang / Tempat</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Contoh: Kelas 7A - Gd Abu Bakar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
