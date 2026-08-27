import React, { useState } from 'react';
import { Search, Plus, Edit3, Trash2, UploadCloud, RotateCcw } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ClassSchedule } from '../types';
import { BulkScheduleUploadModal } from './BulkScheduleUploadModal';

export const MasterSchedules: React.FC = () => {
  const { schedules, teachers, addSchedule, updateSchedule, deleteSchedule, resetSchedules } = useHRIS();

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

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

  const handleReset = () => {
    if (window.confirm('PERINGATAN: Anda akan menghapus SELURUH jadwal pelajaran. Tindakan ini tidak dapat dibatalkan. Lanjutkan?')) {
      resetSchedules();
    }
  };

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
      {/* Top Actions & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap flex-1 items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, guru, kelas..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg">
            {['ALL', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedDayFilter === day
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {day === 'ALL' ? 'Semua' : day.substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-lg">
            {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnitFilter(unit)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedUnitFilter === unit
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                {unit === 'ALL' ? 'Unit' : unit}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 bg-white dark:bg-stone-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 transition-colors cursor-pointer"
            title="Hapus Semua Jadwal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Jadwal</span>
          </button>

          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
            <span>Upload CSV</span>
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1 bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium border-b border-stone-200/70 dark:border-stone-700">
                <th className="py-2.5 px-3 text-center w-14">Hari</th>
                <th className="py-2.5 px-3">Waktu & JP</th>
                <th className="py-2.5 px-4">Mata Pelajaran</th>
                <th className="py-2.5 px-3">Kelas & Unit</th>
                <th className="py-2.5 px-4">Guru Pengampu</th>
                <th className="py-2.5 px-3">Ruang</th>
                <th className="py-2.5 px-3 text-center w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-700 dark:text-stone-300">
              {filteredSchedules.map((s) => {
                const teacher = teachers.find((t) => t.id === s.teacherId);
                return (
                  <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                        {s.dayOfWeek}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-mono text-stone-900 dark:text-stone-100">{s.startTime} - {s.endTime}</p>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">{s.hours} JP</p>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-stone-900 dark:text-stone-100">
                      {s.subject}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="text-stone-800 dark:text-stone-200">{s.className}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{s.unit}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-stone-900 dark:text-stone-100">{teacher?.name || 'Guru'}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{teacher?.position || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                      {s.room}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 text-stone-400 dark:text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus jadwal ${s.subject}?`)) {
                              deleteSchedule(s.id);
                            }
                          }}
                          className="p-1 text-stone-400 dark:text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Hapus"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-stone-950/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-stone-900 rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="px-5 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                {editingSchedule ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Baru'}
              </h3>
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsAddingSchedule(false);
                }}
                className="text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position} - {t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Mata Pelajaran</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Contoh: Fiqih Ibadah"
                  className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Nama Kelas</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">Pesantren</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Hari</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as any })}
                    className="w-full px-2 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Mulai</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Selesai</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Jam Pelajaran (JP)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 2 })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none font-mono text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-stone-400 mb-1 font-medium">Ruang Kelas</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 focus:outline-none text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setIsAddingSchedule(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white font-medium shadow-2xs"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <BulkScheduleUploadModal 
          isOpen={isBulkUploadOpen} 
          onClose={() => setIsBulkUploadOpen(false)} 
        />
      )}
    </div>
  );
};
