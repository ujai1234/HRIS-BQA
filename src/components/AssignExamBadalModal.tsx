import React, { useState } from 'react';
import { X, UserCheck, AlertTriangle } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ExamProctor, ExamSession } from '../types';

interface AssignExamBadalModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession;
  proctor: ExamProctor;
}

export const AssignExamBadalModal: React.FC<AssignExamBadalModalProps> = ({
  isOpen,
  onClose,
  session,
  proctor
}) => {
  const { teachers, assignExamBadal } = useHRIS();
  const [replacementTeacherId, setReplacementTeacherId] = useState(
    teachers.find(t => t.id !== proctor.teacherId)?.id || ''
  );
  const [reason, setReason] = useState('Ustadz berhalangan hadir / izin dinas');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const originalTeacher = teachers.find(t => t.id === proctor.teacherId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacementTeacherId) return;

    setIsSubmitting(true);
    const success = await assignExamBadal(proctor.id, replacementTeacherId, reason);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0B2B26] border border-slate-200 dark:border-[#163832] rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#163832] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tunjuk Badal Pengawas Ujian
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70">
                Alihkan tugas pengawasan kepada ustadz pengganti.
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-50 dark:bg-[#051F20]/50 border border-slate-200 dark:border-[#163832] rounded-xl text-xs space-y-1">
            <div className="text-slate-500 dark:text-emerald-400/70">Sesi & Ruang Ujian:</div>
            <div className="font-bold text-slate-800 dark:text-emerald-100">
              {session.subject} • {session.targetClass} ({session.roomName})
            </div>
            <div className="text-[11px] text-slate-500 dark:text-emerald-400/70">
              {session.date} | {session.startTime} - {session.endTime}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Pengawas Terjadwal: <strong>{originalTeacher?.name || proctor.teacherId}</strong>
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
              Pilih Asatidz Pengganti (Badal) *
            </label>
            <select
              value={replacementTeacherId}
              onChange={(e) => setReplacementTeacherId(e.target.value)}
              required
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {teachers
                .filter(t => t.id !== proctor.teacherId)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nip} - {t.name} ({t.unit})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
              Alasan Penggantian *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
              placeholder="misal: Izin sakit, dinas luar, atau tugas mendadak"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-[#163832] rounded-xl text-xs font-semibold text-slate-700 dark:text-emerald-200 hover:bg-slate-100 dark:hover:bg-[#163832]/60 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tugaskan Badal'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

