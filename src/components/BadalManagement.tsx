import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { BadalAssignment } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';

export const BadalManagement: React.FC = () => {
  const { 
    teachers, 
    schedules, 
    badalAssignments, 
    createBadalAssignment 
  } = useHRIS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || '');
  const [selectedOriginalTeacherId, setSelectedOriginalTeacherId] = useState(teachers[7]?.id || '');
  const [selectedBadalTeacherId, setSelectedBadalTeacherId] = useState(teachers[17]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<BadalAssignment['reason']>('Sakit');
  const [notes, setNotes] = useState('');

  const handleScheduleChange = (schedId: string) => {
    setSelectedScheduleId(schedId);
    const sched = schedules.find((s) => s.id === schedId);
    if (sched) {
      setSelectedOriginalTeacherId(sched.teacherId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOriginalTeacherId === selectedBadalTeacherId) {
      alert('Guru pengganti tidak boleh sama dengan guru utama!');
      return;
    }

    createBadalAssignment({
      date: selectedDate,
      scheduleId: selectedScheduleId,
      originalTeacherId: selectedOriginalTeacherId,
      badalTeacherId: selectedBadalTeacherId,
      reason,
      notes,
    });

    setShowAddModal(false);
    setNotes('');
  };

  const totalBadalJP = badalAssignments.length * 2;
  const totalBadalHonor = totalBadalJP * 40000;

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Understated Stat Chips */}
        <div className="grid grid-cols-3 gap-2 flex-1 max-w-md text-xs">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Badal</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">{badalAssignments.length} Sesi</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Jam</span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 block font-mono">{totalBadalJP} JP</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Kafa'ah</span>
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mt-0.5 block font-mono">{formatRupiah(totalBadalHonor)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1 bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tunjuk Badal</span>
        </button>
      </div>

      {/* Badal Records Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200/70 dark:border-slate-700">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-4">Mata Pelajaran & Sesi</th>
                <th className="py-2.5 px-4">Guru Utama</th>
                <th className="py-2.5 px-4">Guru Pengganti</th>
                <th className="py-2.5 px-3">Alasan</th>
                <th className="py-2.5 px-3 text-right">Kafa'ah</th>
                <th className="py-2.5 px-3 text-center w-16">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {badalAssignments.map((b) => {
                const sched = schedules.find((s) => s.id === b.scheduleId);
                const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
                const jp = sched ? sched.hours : 2;
                const badalRate = badalTeacher ? badalTeacher.hourlyRate : 40000;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{formatIndonesianDate(b.date)}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{sched?.subject || 'KBM'}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{sched?.className} • {sched?.startTime} - {sched?.endTime} ({jp} JP)</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="text-slate-700 dark:text-slate-300">{origTeacher?.name || 'Guru Utama'}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-purple-700 dark:text-purple-400">{badalTeacher?.name || 'Guru Badal'}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {b.reason}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-800 dark:text-emerald-400 font-medium whitespace-nowrap">
                      {formatRupiah(jp * badalRate)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-200/80 dark:border-emerald-800/50">
                        Disetujui
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-2xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Penugasan Guru Badal
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Tanggal KBM</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Sesi Jadwal</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                >
                  {schedules.map((s) => {
                    const t = teachers.find((tch) => tch.id === s.teacherId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.dayOfWeek} {s.startTime} • {s.subject} ({s.className}) - {t?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Guru Pengganti (Badal)</label>
                <select
                  value={selectedBadalTeacherId}
                  onChange={(e) => setSelectedBadalTeacherId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                >
                  {teachers
                    .filter((t) => t.id !== selectedOriginalTeacherId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.position} - {t.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Alasan Penggantian</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin Tugas Luar">Izin Tugas Luar</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Mendesak">Keperluan Mendesak</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Catatan (Opsional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan materi yang disampaikan..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white font-medium shadow-2xs"
                >
                  Tetapkan Guru Badal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
