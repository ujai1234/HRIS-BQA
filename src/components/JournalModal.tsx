import React, { useState } from 'react';
import { 
  X, 
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, ClassSchedule, Teacher, StudentAttendance } from '../types';
import { useHRIS } from '../context/HRISContext';
import { formatIndonesianDate } from '../utils/formatters';

interface JournalModalProps {
  attendance?: AttendanceRecord | null;
  schedule: ClassSchedule;
  teacher?: Teacher;
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
  const { attendances, currentUser, clockIn, submitJournal } = useHRIS();

  const resolvedAttendance = attendance || attendances.find(
    (a) => a.scheduleId === schedule.id && a.date === new Date().toISOString().split('T')[0]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const isPastShift = resolvedAttendance?.date ? resolvedAttendance.date < todayStr : false;
  const existingJournal = resolvedAttendance?.journal;
  const isExpired = isPastShift; // Strictly block if date is before today
  const isExpiredUnfilled = isExpired && !existingJournal;
  const isExpiredFilled = isExpired && existingJournal;

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
      alert('Mohon lengkapi Materi / Uraian Pembelajaran.');
      return;
    }

    setIsSubmitting(true);

    try {
      let targetAttendance = resolvedAttendance;
      if (!targetAttendance) {
        targetAttendance = clockIn(schedule.id);
      }

      if (targetAttendance) {
        submitJournal(targetAttendance.id, {
          scheduleId: schedule.id,
          date: targetAttendance.date || new Date().toISOString().split('T')[0],
          teacherId: targetAttendance.actualTeacherId || targetAttendance.teacherId || teacher?.id || currentUser?.id || 'T-08',
          topic,
          learningObjectives,
          classNotes,
          studentAttendance,
          assignmentGiven,
        });
      }

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#059669', '#10b981', '#3b82f6', '#f59e0b'],
        });
      } catch (err) {
        console.error(err);
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess();
        onClose();
      }, 300);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 my-6">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-white">Jurnal Mengajar (PBM)</h2>
            <p className="text-xs text-slate-400">
              {schedule.className} • {schedule.subject} ({schedule.hours} JP)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Top Info Banner / Expired Warning */}
          {isExpiredUnfilled ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              <span className="font-semibold text-rose-900 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" /> Batas Pengisian Terkunci
              </span>
              Sesi {formatIndonesianDate(resolvedAttendance?.date || '')} telah melewati batas waktu pengisian (Hari H). Jurnal tidak dapat diisi lagi dan otomatis dikenakan potongan honor mengajar 50% untuk sesi ini.
            </div>
          ) : isExpiredFilled ? (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Jurnal Terkunci (Sudah Terisi)
              </span>
              Sesi ini sudah lewat batas waktu edit. Anda hanya dapat melihat isi jurnal yang telah disimpan sebelumnya.
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
              <span className="text-slate-600">
                Tanggal Sesi: <strong className="text-slate-900">{formatIndonesianDate(resolvedAttendance?.date || todayStr)}</strong>
              </span>
              <button
                type="button"
                onClick={handleFillSample}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-1 rounded border border-emerald-300 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Isi Contoh Cepat</span>
              </button>
            </div>
          )}

          {/* Student Attendance Counts */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
              <span>Presensi Santri / Siswa</span>
              <span className="text-slate-500 font-normal">
                Hadir: {studentAttendance.presentCount} dari {studentAttendance.totalStudents}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block mb-0.5">Total</span>
                <input
                  type="number"
                  min="1"
                  value={studentAttendance.totalStudents}
                  onChange={(e) => handleStudentCountChange('totalStudents', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs py-1 rounded border border-slate-200 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-medium block mb-0.5">Hadir</span>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.presentCount}
                  onChange={(e) => handleStudentCountChange('presentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs py-1 rounded border border-emerald-200 bg-emerald-50/50 text-emerald-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-amber-700 font-medium block mb-0.5">Sakit</span>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.sickCount}
                  onChange={(e) => handleStudentCountChange('sickCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs py-1 rounded border border-amber-200 bg-amber-50/50 text-amber-800 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-medium block mb-0.5">Izin</span>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.permittedCount}
                  onChange={(e) => handleStudentCountChange('permittedCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs py-1 rounded border border-blue-200 bg-blue-50/50 text-blue-800 focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-rose-700 font-medium block mb-0.5">Alpa</span>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.absentCount}
                  onChange={(e) => handleStudentCountChange('absentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs py-1 rounded border border-rose-200 bg-rose-50/50 text-rose-800 focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>
          </div>

          {/* Topic / Materi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uraian Materi Pembelajaran <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Pokok bahasan materi, ayat hafalan, atau bab yang dipelajari..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Target / Capaian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Capaian Pembelajaran (Opsional)
            </label>
            <input
              type="text"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Target hafalan / pemahaman santri..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Catatan & Tugas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Kelas (Opsional)
              </label>
              <textarea
                rows={2}
                value={classNotes}
                onChange={(e) => setClassNotes(e.target.value)}
                placeholder="Catatan keaktifan atau kendala..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tugas Lanjutan (Opsional)
              </label>
              <textarea
                rows={2}
                value={assignmentGiven}
                onChange={(e) => setAssignmentGiven(e.target.value)}
                placeholder="Muraja'ah atau tugas mandiri..."
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isExpired}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs disabled:opacity-50 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Menyimpan...' : isExpired ? 'Terkunci' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
