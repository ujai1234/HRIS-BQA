import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  RotateCcw, 
  MapPin, 
  Clock, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';
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
    if (window.confirm('PERINGATAN RESMI: Anda akan menghapus SELURUH database jadwal pelajaran. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin ingin melakukan pengaturan ulang?')) {
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

  const daysList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Helper function to get unit badge color
  const getUnitStyles = (unit: string) => {
    switch (unit) {
      case 'SMP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'MA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'PESANTREN':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-100 dark:bg-stone-850 dark:text-stone-350 dark:border-stone-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Manajemen Jadwal KBM Asatidz
        </h2>
        <span className="text-xs text-stone-400 dark:text-stone-500 font-mono">
          {schedules.length} Jam Pelajaran
        </span>
      </div>

      {/* 2. Advanced Search & Modern Filter Suite */}
      <div className="bg-white dark:bg-[#121815] border border-stone-200/60 dark:border-stone-800/60 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Top Row Left: Clear, prominent search input */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari asatidz, mata pelajaran, kelas..."
              className="w-full pl-10 pr-4 py-3 text-xs bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 text-stone-900 dark:text-stone-100 focus:bg-white transition-all font-sans"
            />
          </div>

          {/* Top Row Right: Unit filter & Main operation buttons */}
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <div className="flex items-center bg-stone-50 dark:bg-stone-900 p-1 rounded-xl border border-stone-200/60 dark:border-stone-800/40">
              {['ALL', 'SMP', 'MA', 'PESANTREN'].map((unit) => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnitFilter(unit)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedUnitFilter === unit
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-3xs border border-stone-200/40 dark:border-stone-700/40'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  {unit === 'ALL' ? 'Semua Unit' : unit}
                </button>
              ))}
            </div>

            <div className="h-6 w-[1px] bg-stone-200 dark:bg-stone-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl border border-stone-200/60 dark:border-stone-800/60 transition-colors cursor-pointer"
                title="Atur Ulang Semua Jadwal"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsBulkUploadOpen(true)}
                className="inline-flex items-center gap-1.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-850 transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#B08968]" />
                <span>Unggah CSV</span>
              </button>
              
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] dark:bg-emerald-800 dark:hover:bg-emerald-700 text-[#F5EBE0] hover:text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Jadwal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Elongated Day Selection Badges stretching beautifully below */}
        <div className="space-y-2 pt-3 border-t border-stone-100/60 dark:border-stone-850/60">
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3 text-[#B08968]" />
            <label className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Pilih Hari Pembelajaran
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-1 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-800/40 w-full">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                selectedDayFilter === 'ALL'
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/40 dark:hover:bg-stone-800/30'
              }`}
            >
              Semua Hari
            </button>
            {daysList.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDayFilter(day)}
                className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                  selectedDayFilter === day
                    ? 'bg-[#1B4332] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/40 dark:hover:bg-stone-800/30'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle dynamic summary of loaded data */}
        <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500 font-semibold uppercase tracking-wider pl-1 border-t border-stone-100 dark:border-stone-850 pt-2.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Ditemukan {filteredSchedules.length} Jadwal Aktif dari total {schedules.length} jam pelajaran pekanan</span>
        </div>
      </div>

      {/* 3. Clean Spacious List Table View */}
      <div className="bg-white dark:bg-[#121815] border border-stone-200/60 dark:border-stone-800/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900 text-stone-500 dark:text-stone-400 font-bold border-b border-stone-200/60 dark:border-stone-850 uppercase tracking-wider text-[9px]">
                <th className="py-3 px-4 text-center w-24">Hari</th>
                <th className="py-3 px-4">Waktu Pelajaran</th>
                <th className="py-3 px-4">Beban KBM</th>
                <th className="py-3 px-4">Mata Pelajaran</th>
                <th className="py-3 px-4">Unit & Kelas</th>
                <th className="py-3 px-4">Asatidz Pengampu</th>
                <th className="py-3 px-4">Ruang Kelas</th>
                <th className="py-3 px-4 text-center w-24">Aksi Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-850 text-stone-700 dark:text-stone-300">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-400 dark:text-stone-500">
                    <BookOpen className="w-8 h-8 mx-auto opacity-30 text-stone-400 mb-2" />
                    <p className="text-xs font-semibold">Tidak ada jadwal KBM yang cocok dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((s) => {
                  const teacher = teachers.find((t) => t.id === s.teacherId);
                  return (
                    <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1B4332]/5 dark:bg-emerald-950/20 text-[#1B4332] dark:text-emerald-400 border border-[#1B4332]/10 dark:border-emerald-900/30">
                          {s.dayOfWeek}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                          <Clock className="w-3.5 h-3.5 text-[#B08968]" />
                          <span>{s.startTime} - {s.endTime}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                          {s.hours} JP
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-950 dark:text-stone-100">
                        {s.subject}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getUnitStyles(s.unit)}`}>
                          {s.unit} • {s.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-stone-850 text-stone-800 dark:text-stone-200 flex items-center justify-center font-bold text-[10px]">
                            {teacher?.name ? teacher.name[0] : 'G'}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100">{teacher?.name || 'Guru'}</p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500">{teacher?.position || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400 font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{s.room}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-stone-400 hover:text-stone-950 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                            title="Sunting Jadwal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus jadwal ${s.subject}?`)) {
                                deleteSchedule(s.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Refined Minimalist Dialog / Form Modal */}
      {(editingSchedule || isAddingSchedule) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-stone-950/70 backdrop-blur-xs transition-opacity">
          <div className="bg-white dark:bg-[#121815] rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-stone-200/80 dark:border-stone-800 relative animate-in fade-in zoom-in-95 duration-150">
            
            {/* Top decorative gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#1B4332] via-[#B08968] to-[#1B4332]" />

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#B08968]" />
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  {editingSchedule ? 'Sunting Detail Jadwal' : 'Tambah Jadwal KBM Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditingSchedule(null);
                  setIsAddingSchedule(false);
                }}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Asatidz Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.position} - {t.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Mata Pelajaran</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Contoh: Fiqih Ibadah, Tahfidzul Qur'an"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Nama Kelas</label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Unit Pendidikan</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                  >
                    <option value="SMP">SMP</option>
                    <option value="MA">MA</option>
                    <option value="PESANTREN">Pesantren</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Hari KBM</label>
                  <select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value as any })}
                    className="w-full px-2 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-2 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none font-mono text-stone-900 dark:text-stone-100 font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-2 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none font-mono text-stone-900 dark:text-stone-100 font-bold focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Beban Jam (JP)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 2 })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none font-mono text-stone-900 dark:text-stone-100 font-bold focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Ruang Belajar</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-[#1B4332] text-stone-900 dark:text-stone-100 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100 dark:border-stone-850">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null);
                    setIsAddingSchedule(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-bold hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143326] dark:bg-emerald-800 dark:hover:bg-emerald-700 text-[#F5EBE0] hover:text-white font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Bulk Upload Modal Connection */}
      {isBulkUploadOpen && (
        <BulkScheduleUploadModal 
          isOpen={isBulkUploadOpen} 
          onClose={() => setIsBulkUploadOpen(false)} 
        />
      )}
    </div>
  );
};
