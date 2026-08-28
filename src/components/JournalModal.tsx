import React, { useState } from 'react';
import { 
  X, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, ClassSchedule, Teacher, StudentAttendance } from '../types';
import { useHRIS } from '../context/HRISContext';
import { formatIndonesianDate } from '../utils/formatters';

interface JournalModalProps {
  attendance?: AttendanceRecord | null;
  schedule: ClassSchedule;
  teacher?: Teacher | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  attendance,
  schedule,
  teacher,
  onClose,
  onSuccess,
}) => {
  const { attendances, currentUser, clockIn, submitJournal, teachers, badalAssignments } = useHRIS();

  const resolvedAttendance = attendance || attendances.find(
    (a) => a.scheduleId === schedule.id && a.date === new Date().toISOString().split('T')[0]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastShift = resolvedAttendance?.date ? resolvedAttendance.date < todayStr : false;
  const existingJournal = resolvedAttendance?.journal;
  const isExpired = isPastShift;
  const isExpiredUnfilled = isExpired && !existingJournal;
  const isExpiredFilled = isExpired && existingJournal;

  const activeBadal = badalAssignments.find(
    (b) => b.scheduleId === schedule.id && (b.date === todayStr || !b.date) && (b.status === 'APPROVED' || b.status === 'COMPLETED')
  );
  const isBadalForMe = (activeBadal && activeBadal.badalTeacherId === (teacher?.id || currentUser?.id)) || (resolvedAttendance?.isBadal && resolvedAttendance.actualTeacherId === (teacher?.id || currentUser?.id));
  const originalTeacher = activeBadal ? teachers.find((t) => t.id === activeBadal.originalTeacherId) : (schedule.teacherId !== (teacher?.id || currentUser?.id) ? teachers.find((t) => t.id === schedule.teacherId) : null);

  const [topic, setTopic] = useState(existingJournal?.topic || '');
  const [learningObjectives, setLearningObjectives] = useState(
    existingJournal?.learningObjectives || ''
  );
  const [classNotes, setClassNotes] = useState(existingJournal?.classNotes || '');
  const [assignmentGiven, setAssignmentGiven] = useState(
    existingJournal?.assignmentGiven || ''
  );

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance>(
    existingJournal?.studentAttendance || {
      totalStudents: 28,
      presentCount: 27,
      sickCount: 1,
      permittedCount: 0,
      absentCount: 0,
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStudentCountChange = (field: keyof StudentAttendance, value: number) => {
    const val = Math.max(0, value);
    setStudentAttendance((prev) => {
      const updated = { ...prev, [field]: val };
      if (field !== 'totalStudents') {
        const sumOther = updated.presentCount + updated.sickCount + updated.permittedCount + updated.absentCount;
        if (sumOther > updated.totalStudents) {
          updated.totalStudents = sumOther;
        }
      }
      return updated;
    });
  };

  const handleFillSample = () => {
    if (!schedule) return;
    const subj = schedule.subject || '';
    if (subj.toLowerCase().includes('nahwu') || subj.toLowerCase().includes('sharaf') || subj.toLowerCase().includes('kitab')) {
      setTopic('Pembahasan Bab I’rab & Pembagian I’rab (Kitab Jurumiyyah)');
      setLearningObjectives('Santri dapat menyebutkan 4 macam i’rab dan tanda-tanda aslinya secara tepat.');
      setClassNotes('Santri menyimak dengan khidmat, mampu melafalkan nadhom kaidah dengan baik.');
      setAssignmentGiven('Hafalan bait kaidah i’rab halaman 14-16 disetor pada pertemuan berikutnya.');
    } else if (subj.toLowerCase().includes('tahfidz') || subj.toLowerCase().includes('tajwid') || subj.toLowerCase().includes('qur')) {
      setTopic('Setoran Hafalan Baru Surah Al-Mulk ayat 1-15 & Kaidah Ghunnah');
      setLearningObjectives('Penyempurnaan makharijul huruf ‘Ain, Ha, dan konsistensi mad thabi’i 2 harakat.');
      setClassNotes('Alhamdulillah mayoritas mutqin, 3 santri perlu bimbingan khusus ayat 10-12.');
      setAssignmentGiven('Muraja’ah mandiri bakda Maghrib.');
    } else {
      setTopic(`Penyampaian Materi: ${subj} Bab 3`);
      setLearningObjectives('Santri mampu memahami konsep dasar dan mempraktikkannya.');
      setClassNotes('KBM berjalan tertib, santri aktif bertanya.');
      setAssignmentGiven('Mengerjakan latihan soal halaman 45.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Mohon isi pokok materi KBM terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetAttId = resolvedAttendance?.id;
      if (!targetAttId) {
        const now = new Date();
        const autoTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        clockIn(schedule.id, autoTime, 'Auto-Presensi bersamaan dengan pengisian jurnal');
        const newlyCreated = attendances.find((a) => a.scheduleId === schedule.id && a.date === todayStr);
        targetAttId = newlyCreated?.id || `ATT-${Date.now()}`;
      }

      submitJournal(targetAttId, {
        scheduleId: schedule.id,
        date: resolvedAttendance?.date || todayStr,
        teacherId: teacher?.id || currentUser?.id || schedule.teacherId,
        topic: topic.trim(),
        learningObjectives: learningObjectives.trim() || undefined,
        classNotes: classNotes.trim() || undefined,
        assignmentGiven: assignmentGiven.trim() || undefined,
        studentAttendance,
      });

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#1B4332', '#2D6A4F', '#52B788', '#B08968'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 200);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A221E] rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-200 dark:border-stone-800 my-auto">
        {/* Header */}
        <div className="bg-[#141A17] text-white px-5 py-3.5 flex items-center justify-between border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
              <h2 className="font-bold text-sm text-white">Jurnal Pembelajaran KBM</h2>
              {isBadalForMe && (
                <span className="text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded font-mono">
                  GURU BADAL
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Kelas {schedule.className} • {schedule.subject} ({schedule.hours} JP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badal Banner */}
        {isBadalForMe && originalTeacher && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-900/40 p-3 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
            <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold">Pengisian Jurnal Guru Badal (Disetujui Kepsek)</p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                Anda mengisi jurnal santri menggantikan <strong>Ustadz {originalTeacher.name}</strong>. Jurnal dan data presensi KBM akan tercatat resmi atas nama Anda.
              </p>
            </div>
          </div>
        )}

        {/* Expired Unfilled Alert */}
        {isExpiredUnfilled && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/40 p-3 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-bold">Batas Waktu Pengisian Telah Berakhir</p>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                Jurnal ini tercatat dari sesi tanggal {formatIndonesianDate(resolvedAttendance?.date || '')}. Kebijakan pesantren mengunci pengisian pada hari yang sama.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Quick Template Fill Button */}
          {!isExpiredUnfilled && (
            <div className="flex items-center justify-between bg-[#FBFBFA] dark:bg-[#141A17] p-2.5 rounded-lg border border-stone-200 dark:border-stone-800">
              <span className="text-stone-600 dark:text-stone-400 text-[11px]">
                Gunakan template cepat sesuai mata pelajaran:
              </span>
              <button
                type="button"
                onClick={handleFillSample}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                <span>Isi Contoh Materi</span>
              </button>
            </div>
          )}

          {/* Topic / Materi Pokok */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-800 dark:text-stone-200 block">
              Pokok Bahasan / Materi Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isExpiredUnfilled}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Contoh: Bab 4 I'rab Fi'il Mudhari'..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] disabled:bg-stone-100 dark:disabled:bg-stone-900"
            />
          </div>

          {/* Learning Objectives */}
          <div className="space-y-1">
            <label className="font-semibold text-stone-800 dark:text-stone-200 block">
              Target Capaian & Tujuan Pembelajaran
            </label>
            <textarea
              rows={2}
              disabled={isExpiredUnfilled}
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Contoh: Santri mampu mengidentifikasi huruf jazm dan mempraktikkannya dalam ayat..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332] disabled:bg-stone-100 dark:disabled:bg-stone-900"
            />
          </div>

          {/* Student Attendance Summary Grid */}
          <div className="space-y-2 pt-1">
            <label className="font-semibold text-stone-800 dark:text-stone-200 block">
              Rekap Kehadiran Santri di Kelas
            </label>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="bg-[#FBFBFA] dark:bg-[#141A17] p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase">Total</span>
                <input
                  type="number"
                  disabled={isExpiredUnfilled}
                  value={studentAttendance.totalStudents}
                  onChange={(e) => handleStudentCountChange('totalStudents', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs bg-transparent border-none focus:outline-none text-stone-900 dark:text-stone-100 mt-0.5"
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] text-[#1B4332] dark:text-emerald-400 font-bold block uppercase">Hadir</span>
                <input
                  type="number"
                  disabled={isExpiredUnfilled}
                  value={studentAttendance.presentCount}
                  onChange={(e) => handleStudentCountChange('presentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs bg-transparent border-none focus:outline-none text-[#1B4332] dark:text-emerald-400 mt-0.5"
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block uppercase">Sakit</span>
                <input
                  type="number"
                  disabled={isExpiredUnfilled}
                  value={studentAttendance.sickCount}
                  onChange={(e) => handleStudentCountChange('sickCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs bg-transparent border-none focus:outline-none text-amber-700 dark:text-amber-400 mt-0.5"
                />
              </div>

              <div className="bg-sky-50 dark:bg-sky-950/20 p-2 rounded-lg border border-sky-200/60 dark:border-sky-900/40">
                <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block uppercase">Izin</span>
                <input
                  type="number"
                  disabled={isExpiredUnfilled}
                  value={studentAttendance.permittedCount}
                  onChange={(e) => handleStudentCountChange('permittedCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs bg-transparent border-none focus:outline-none text-sky-700 dark:text-sky-400 mt-0.5"
                />
              </div>

              <div className="bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block uppercase">Alpa</span>
                <input
                  type="number"
                  disabled={isExpiredUnfilled}
                  value={studentAttendance.absentCount}
                  onChange={(e) => handleStudentCountChange('absentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs bg-transparent border-none focus:outline-none text-rose-700 dark:text-rose-400 mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Notes & Assignments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                Catatan Evaluasi / Kedisiplinan
              </label>
              <textarea
                rows={2}
                disabled={isExpiredUnfilled}
                value={classNotes}
                onChange={(e) => setClassNotes(e.target.value)}
                placeholder="Catatan keaktifan santri..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-800 dark:text-stone-200 block">
                Tugas / Pekerjaan Rumah (PR)
              </label>
              <textarea
                rows={2}
                disabled={isExpiredUnfilled}
                value={assignmentGiven}
                onChange={(e) => setAssignmentGiven(e.target.value)}
                placeholder="Tugas mandiri atau hafalan..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {isExpiredUnfilled ? 'Tutup' : 'Batal'}
            </button>
            {!isExpiredUnfilled && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal KBM'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
