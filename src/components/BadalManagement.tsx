import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { BadalAssignment } from '../types';
import { formatIndonesianDate, formatRupiah } from '../utils/formatters';

export const BadalManagement: React.FC = () => {
  const { 
    teachers, 
    schedules, 
    badalAssignments, 
    createBadalAssignment, 
    currentRole 
  } = useHRIS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || '');
  const [selectedOriginalTeacherId, setSelectedOriginalTeacherId] = useState(teachers[7]?.id || ''); // Ust Fuad
  const [selectedBadalTeacherId, setSelectedBadalTeacherId] = useState(teachers[17]?.id || ''); // Ust Farhan
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<BadalAssignment['reason']>('Sakit');
  const [notes, setNotes] = useState('');

  const selectedSchedObj = schedules.find((s) => s.id === selectedScheduleId);

  // When schedule changes, update original teacher automatically
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
      alert('Guru pengganti (Badal) tidak boleh sama dengan guru utama!');
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-md border border-purple-200/80">
              Sistem Delegasi Mengajar
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Pesantren Baitul Qur'an Al-Ikhwan
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1.5 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Manajemen Guru Badal (Pengganti KBM)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Penugasan guru badal saat asatidz berhalangan hadir (Sakit/Izin/Dinas). Honor mengajar (@ Rp 40.000/JP) otomatis dialokasikan ke guru badal.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Tunjuk Guru Badal Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Penugasan Badal</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{badalAssignments.length} Sesi</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Jam Badal Tersalur</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {badalAssignments.length * 2} JP
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Akumulasi Honor Badal</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">
              {formatRupiah(badalAssignments.length * 2 * 40000)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Badal Records Table */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Daftar Penugasan Guru Badal</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Status Terhubung Otomatis dengan Presensi & Payroll
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <th className="py-3 px-4">Tanggal KBM</th>
                <th className="py-3 px-4">Jadwal & Mata Pelajaran</th>
                <th className="py-3 px-4">Guru Utama (Berhalangan)</th>
                <th className="py-3 px-4">Guru Badal (Pengganti)</th>
                <th className="py-3 px-4">Alasan</th>
                <th className="py-3 px-4">Honor Dialokasikan</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {badalAssignments.map((b) => {
                const sched = schedules.find((s) => s.id === b.scheduleId);
                const origTeacher = teachers.find((t) => t.id === b.originalTeacherId);
                const badalTeacher = teachers.find((t) => t.id === b.badalTeacherId);
                const hours = sched ? sched.hours : 2;

                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {formatIndonesianDate(b.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{sched?.subject || 'KBM Pesantren'}</p>
                      <p className="text-[11px] text-slate-500">{sched?.className} • {sched?.startTime} - {sched?.endTime} ({hours} JP)</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 line-through decoration-rose-400">
                        {origTeacher?.name}
                      </span>
                      <p className="text-[10px] text-slate-400">{origTeacher?.position}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/80">
                        {badalTeacher?.name}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{badalTeacher?.position}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 block">{b.reason}</span>
                      {b.notes && <p className="text-[10px] text-slate-400 italic">{b.notes}</p>}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">
                      +{formatRupiah(hours * 40000)}
                      <span className="block text-[10px] text-slate-400">Masuk ke slip {badalTeacher?.name.split(' ')[1] || 'Badal'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-300" />
                <h3 className="font-bold text-sm text-white">Form Penunjukan Guru Badal</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal KBM</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Sesi Jadwal</label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleScheduleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
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
                  <label className="block font-semibold text-slate-700 mb-1">Guru Utama</label>
                  <select
                    value={selectedOriginalTeacherId}
                    onChange={(e) => setSelectedOriginalTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-purple-900 mb-1">Guru Badal (Pengganti)</label>
                  <select
                    value={selectedBadalTeacherId}
                    onChange={(e) => setSelectedBadalTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-purple-50/40 font-semibold text-purple-900"
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
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penggantian</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-medium"
                >
                  <option value="Sakit">Sakit</option>
                  <option value="Izin Keperluan">Izin Keperluan Mendesak</option>
                  <option value="Tugas Kedinasan Pesantren">Tugas Kedinasan Pesantren</option>
                  <option value="Urusan Mendesak">Urusan Mendesak</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Disposisi)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan surat izin atau delegasi materi..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="bg-purple-50/70 p-3 rounded-lg border border-purple-200/80 text-purple-900">
                <p className="font-semibold">Kalkulasi Otomatis:</p>
                <p className="text-[11px] text-purple-800">
                  Guru Badal akan menerima honor <strong>{selectedSchedObj?.hours || 2} JP × Rp 40.000 = {formatRupiah((selectedSchedObj?.hours || 2) * 40000)}</strong> pada slip gaji bulan ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-xs"
                >
                  Simpan & Tugaskan Badal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
