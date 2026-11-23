import React, { useState } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, Users, CheckSquare } from 'lucide-react';
import { useHRIS } from '../context/HRISContext';
import { ExamSession, ExamProctor, AttendanceRecord } from '../types';

interface ExamReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ExamSession;
  proctor: ExamProctor;
  attendance: AttendanceRecord;
}

export const ExamReportModal: React.FC<ExamReportModalProps> = ({
  isOpen,
  onClose,
  session,
  proctor,
  attendance
}) => {
  const { submitExamReport } = useHRIS();

  const [totalSantri, setTotalSantri] = useState(28);
  const [presentCount, setPresentCount] = useState(27);
  const [sickCount, setSickCount] = useState(1);
  const [permitCount, setPermitCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [violationNotes, setViolationNotes] = useState('');
  const [handoverConfirmed, setHandoverConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTotalChange = (val: number) => {
    setTotalSantri(val);
    setPresentCount(Math.max(0, val - sickCount - permitCount - absentCount));
  };

  const handleSickChange = (val: number) => {
    setSickCount(val);
    setPresentCount(Math.max(0, totalSantri - val - permitCount - absentCount));
  };

  const handlePermitChange = (val: number) => {
    setPermitCount(val);
    setPresentCount(Math.max(0, totalSantri - sickCount - val - absentCount));
  };

  const handleAbsentChange = (val: number) => {
    setAbsentCount(val);
    setPresentCount(Math.max(0, totalSantri - sickCount - permitCount - val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverConfirmed) return;

    setIsSubmitting(true);
    const success = await submitExamReport({
      sessionId: session.id,
      attendanceId: attendance.id,
      proctorId: proctor.id,
      totalSantri: Number(totalSantri),
      presentCount: Number(presentCount),
      absentCount: Number(absentCount),
      sickCount: Number(sickCount),
      permitCount: Number(permitCount),
      violationNotes: violationNotes || undefined,
      handoverConfirmed
    });
    setIsSubmitting(false);

    if (success) {
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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Berita Acara Pengawasan Ujian (BAP)
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-400/70">
                {session.subject} • {session.targetClass} ({session.roomName})
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          
          <div className="p-3 bg-slate-50 dark:bg-[#051F20]/50 border border-slate-200 dark:border-[#163832] rounded-xl text-xs flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Waktu Pengawasan</div>
              <div className="font-bold text-slate-800 dark:text-emerald-100 mt-0.5">
                {session.startTime} - {session.endTime} ({session.durationMinutes} Menit)
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Jam Masuk Presensi</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {attendance.clockInTime || '-'} WIB
              </div>
            </div>
          </div>

          {/* Student Counts */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-500" /> Kehadiran Santri / Peserta Ujian
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-emerald-400/80 mb-1 block">
                  Total Santri Terdaftar
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalSantri}
                  onChange={(e) => handleTotalChange(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mb-1 block">
                  Santri Hadir
                </label>
                <input
                  type="number"
                  min={0}
                  max={totalSantri}
                  value={presentCount}
                  onChange={(e) => setPresentCount(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-emerald-400/70 mb-1 block">
                  Sakit
                </label>
                <input
                  type="number"
                  min={0}
                  value={sickCount}
                  onChange={(e) => handleSickChange(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-emerald-400/70 mb-1 block">
                  Izin
                </label>
                <input
                  type="number"
                  min={0}
                  value={permitCount}
                  onChange={(e) => handlePermitChange(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-emerald-400/70 mb-1 block">
                  Alpa / Tanpa Ket.
                </label>
                <input
                  type="number"
                  min={0}
                  value={absentCount}
                  onChange={(e) => handleAbsentChange(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes / Incidents */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-emerald-300 mb-1 block">
              Catatan Pelaksanaan Ujian & Kejadian Khusus (Opsional)
            </label>
            <textarea
              value={violationNotes}
              onChange={(e) => setViolationNotes(e.target.value)}
              rows={2}
              placeholder="misal: Ujian berlangsung tertib, seluruh naskah soal lengkap..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#163832] bg-white dark:bg-[#0B2B26] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Handover Checkbox */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={handoverConfirmed}
                onChange={(e) => setHandoverConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                Saya menyatakan telah mengawasi ujian dengan tertib dan menyerahkan berkas lembar jawaban (LJK) serta sisa soal ke panitia ujian.
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !handoverConfirmed}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                handoverConfirmed && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  : 'bg-slate-200 dark:bg-[#163832] text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Kirim Berita Acara & Selesaikan Pengawasan'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

