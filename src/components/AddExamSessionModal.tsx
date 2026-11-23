import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, BookOpen, Users, DollarSign } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { DayOfWeek, UnitType } from '../types';

interface AddExamSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventId?: string;
  defaultUnit?: UnitType;
}

export const AddExamSessionModal: React.FC<AddExamSessionModalProps> = ({
  isOpen,
  onClose,
  defaultEventId,
  defaultUnit = 'PESANTREN'
}) => {
  const { teachers, examEvents, createExamSession } = useHRIS();

  const [eventId, setEventId] = useState(defaultEventId || examEvents[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessionName, setSessionName] = useState('Sesi 1 (Pagi)');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [subject, setSubject] = useState('');
  const [targetClass, setTargetClass] = useState('VII-A');
  const [roomName, setRoomName] = useState('Ruang Kelas 7A');
  const [proctor1Id, setProctor1Id] = useState(teachers[0]?.id || '');
  const [proctor2Id, setProctor2Id] = useState('');
  const [customRate, setCustomRate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !subject || !proctor1Id) return;

    setIsSubmitting(true);

    const parsedD = new Date(date);
    const daysMap: DayOfWeek[] = ['AHAD', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const dayOfWeek = daysMap[parsedD.getDay()] || 'SENIN';

    const proctorTeacherIds = [proctor1Id];
    if (proctor2Id) proctorTeacherIds.push(proctor2Id);

    const result = await createExamSession({
      eventId,
      date,
      dayOfWeek,
      sessionName,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes) || 90,
      subject,
      targetClass,
      roomName,
      customRate: customRate ? Number(customRate) : undefined,
      proctorTeacherIds
    });

    setIsSubmitting(false);
    if (result) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200 dark:border-[#163832] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#163832] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tambah Sesi Ujian Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70">
                Jadwalkan mata pelajaran dan penugasan pengawas ujian.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#163832]/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
              Event Ujian
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              required
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {examEvents.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.unit}) - {ev.startDate} s/d {ev.endDate}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Tanggal Ujian
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Nama Sesi
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="misal: Sesi 1 (Pagi)"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Jam Mulai
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Jam Selesai
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Durasi (Mnt)
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={30}
                max={240}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="misal: Fiqih Ibadah"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Kelas / Tingkat
              </label>
              <input
                type="text"
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                placeholder="misal: VII-A atau Kelas 7"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Ruang Ujian
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="misal: Ruang Kelas 7A"
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
                Tarif Sesi Custom (Opsional)
              </label>
              <input
                type="number"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Kosongkan jika standar"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-[#163832] pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-emerald-200 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-500" /> Penugasan Pengawas Asatidz
            </h4>
            
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-emerald-400/80 mb-1 block">
                Pengawas Utama (Pengawas 1) *
              </label>
              <select
                value={proctor1Id}
                onChange={(e) => setProctor1Id(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nip} - {t.name} ({t.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-emerald-400/80 mb-1 block">
                Pengawas Pendamping (Pengawas 2 - Opsional)
              </label>
              <select
                value={proctor2Id}
                onChange={(e) => setProctor2Id(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Tanpa Pengawas 2 --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nip} - {t.name} ({t.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Sesi Ujian'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

