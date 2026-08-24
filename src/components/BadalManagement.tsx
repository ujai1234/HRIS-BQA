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

  const selectedSchedObj = schedules.find((s) => s.id === selectedScheduleId);

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
        <div className="grid grid-cols-3 gap-2 flex-1 max-w-lg text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Total Penggantian</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{badalAssignments.length} Sesi</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Total Jam</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{totalBadalJP} JP</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] text-slate-500 block">Total Kafa'ah</span>
            <span className="text-sm font-bold text-emerald-800 mt-0.5 block">{formatRupiah(totalBadalHonor)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tunjuk Guru Pengganti</span>
        </button>
      </div>

      {/* Badal Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200/80">
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-4">Mata Pelajaran & Sesi</th>
                <th className="py-2.5 px-4">Guru Utama</th>
                <th className="py-2.5 px-4">Guru Pengganti</th>
                <th className="py-2.5 px-3">Alasan</th>
                <th className="py-2.5 px-3 text-right">Kafa'ah</th>
                <th className="py-2.5 px-3 text-center w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {badalAssignments.map((b) => {
                const sched = schedules.find((s) => s.id === b.scheduleId);
                const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
                const hours = sched ? sched.hours : 2;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {formatIndonesianDate(b.date)}
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-900">{sched?.subject || 'KBM Pesantren'}</p>
                      <p className="text-[11px] text-slate-400">{sched?.className} • {sched?.startTime} - {sched?.endTime} ({hours} JP)</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-500 line-through">
                        {origTeacher?.name || 'Guru Utama'}
                      </p>
                      <p className="text-[10px] text-slate-400">{origTeacher?.position || '-'}</p>
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-slate-900">
                        {badalTeacher?.name || 'Guru Pengganti'}
                      </p>
                      <p className="text-[10px] text-slate-400">{badalTeacher?.position || '-'}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-800">{b.reason}</p>
                      {b.notes && <p className="text-[10px] text-slate-400">{b.notes}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-800 whitespace-nowrap">
                      +{formatRupiah(hours * 40000)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
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

      {/* Add Badal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Penunjukan Guru Pengganti</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Tanggal KBM</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Pilih Sesi Jadwal</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  {schedules.map((s) => {
                    const t = teachers.find((tch) => tch.id === s.teacherId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.dayOfWeek} • {s.subject} ({s.className}) - {t?.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Guru Utama</label>
                  <select
                    value={selectedOriginalTeacherId}
                    onChange={(e) => setSelectedOriginalTeacherId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-800 mb-1">Guru Pengganti</label>
                  <select
                    value={selectedBadalTeacherId}
                    onChange={(e) => setSelectedBadalTeacherId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-semibold focus:outline-none focus:border-emerald-600"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Alasan</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-medium focus:outline-none focus:border-emerald-600"
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin Keperluan">Izin Keperluan Mendesak</option>
                  <option value="Tugas Kedinasan Pesantren">Tugas Kedinasan Pesantren</option>
                  <option value="Urusan Mendesak">Urusan Mendesak</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan disposisi..."
                  className="w-full p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-slate-700">
                <span className="text-[11px] text-slate-500">Kafa'ah terhitung: </span>
                <span className="font-semibold text-emerald-800 text-xs">
                  {selectedSchedObj?.hours || 2} JP × Rp 40.000 = {formatRupiah((selectedSchedObj?.hours || 2) * 40000)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
