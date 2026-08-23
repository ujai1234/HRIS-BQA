import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Save,
  PenTool
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

  const existingJournal = resolvedAttendance?.journal;

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

  // Recalculate present count or total
  const handleStudentCountChange = (field: keyof StudentAttendance, value: number) => {
    const val = Math.max(0, value);
    setStudentAttendance((prev) => {
      const updated = { ...prev, [field]: val };
      // Ensure sum makes sense
      if (field !== 'totalStudents') {
        const sumOther = updated.presentCount + updated.sickCount + updated.permittedCount + updated.absentCount;
        if (sumOther > updated.totalStudents) {
          updated.totalStudents = sumOther;
        }
      }
      return updated;
    });
  };

  const attendancePercentage = studentAttendance.totalStudents > 0
    ? Math.round((studentAttendance.presentCount / studentAttendance.totalStudents) * 100)
    : 100;

  const handleFillSample = () => {
    if (!schedule) return;
    const subj = schedule.subject || '';
    if (subj.toLowerCase().includes('nahwu') || subj.toLowerCase().includes('sharaf') || subj.toLowerCase().includes('kitab')) {
      setTopic('Pembahasan Bab I’rab & Pembagian I’rab (Rafa’, Nashab, Khafadh, Jazm) Kitab Jurumiyyah');
      setLearningObjectives('Santri dapat menyebutkan 4 macam i’rab dan tanda-tanda aslinya secara tepat.');
      setClassNotes('Santri menyimak dengan khidmat, seluruh santri mampu melafalkan nadhom kaidah dengan baik.');
      setAssignmentGiven('Hafalan bait kaidah i’rab halaman 14-16 disetor pada pertemuan berikutnya.');
    } else if (subj.toLowerCase().includes('tahfidz') || subj.toLowerCase().includes('tajwid') || subj.toLowerCase().includes('qur')) {
      setTopic('Setoran Hafalan Baru Surah Al-Mulk ayat 1-15 & Kaidah Ghunnah Musyaddadah');
      setLearningObjectives('Penyempurnaan makharijul huruf ‘Ain, Ha, dan konsistensi panjang mad thabi’i 2 harakat.');
      setClassNotes('Alhamdulillah 90% santri mutqin, 3 santri perlu bimbingan khusus pada kelancaran ayat 10-12.');
      setAssignmentGiven('Muraja’ah mandiri bakda Maghrib bersama pembimbing kamar masing-masing.');
    } else {
      setTopic(`Penyampaian Materi Pokok: ${subj} Bab 3 Semester Ganjil`);
      setLearningObjectives('Santri mampu memahami konsep dasar dan mempraktikkannya dalam latihan mandiri.');
      setClassNotes('KBM berjalan tertib, santri aktif bertanya selama sesi diskusi.');
      setAssignmentGiven('Mengerjakan latihan soal halaman 45 buku panduan.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Mohon lengkapi Uraian PBM / Materi Pembelajaran.');
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

      // Confetti celebration
      try {
        confetti({
          particleCount: 90,
          spread: 70,
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
      }, 400);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Pengisian Jurnal Mengajar (PBM)</h2>
              <p className="text-xs text-slate-400">
                {schedule.className} • {schedule.subject}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status & Quick Template Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200/80 text-xs">
            <div className="space-y-0.5 text-emerald-900">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Guru: <strong>{teacher?.name || 'Guru'}</strong> ({schedule?.hours || 2} JP • {schedule?.startTime}-{schedule?.endTime})
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium pl-6">
                Tanggal Sesi: <strong>{formatIndonesianDate(resolvedAttendance?.date || new Date().toISOString().split('T')[0])}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillSample}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Gunakan Contoh Jurnal Cepat</span>
            </button>
          </div>

          {/* Student Attendance Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Presensi Santri / Siswa di Kelas</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Tingkat Kehadiran: {attendancePercentage}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Total Santri
                </label>
                <input
                  type="number"
                  min="1"
                  value={studentAttendance.totalStudents}
                  onChange={(e) => handleStudentCountChange('totalStudents', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-emerald-700 mb-1">
                  Hadir
                </label>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.presentCount}
                  onChange={(e) => handleStudentCountChange('presentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-amber-700 mb-1">
                  Sakit
                </label>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.sickCount}
                  onChange={(e) => handleStudentCountChange('sickCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-blue-700 mb-1">
                  Izin
                </label>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.permittedCount}
                  onChange={(e) => handleStudentCountChange('permittedCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-rose-700 mb-1">
                  Alpa
                </label>
                <input
                  type="number"
                  min="0"
                  value={studentAttendance.absentCount}
                  onChange={(e) => handleStudentCountChange('absentCount', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-bold text-xs px-2 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Topic & Lesson Description (Wajib) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Uraian PBM & Materi Pembelajaran <span className="text-rose-600">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
            </label>
            <textarea
              required
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Jelaskan pokok bahasan, ayat/surah yang disetorkan, atau bab kitab yang dipelajari..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Learning Objectives / Capaian Pembelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Capaian Pembelajaran / Target Hafalan (Opsional)
            </label>
            <input
              type="text"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Contoh: Santri mampu menghafal 1 halaman dengan tajwid fasih..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Class Notes & Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Dinamika / Kendala Kelas
              </label>
              <textarea
                rows={2}
                value={classNotes}
                onChange={(e) => setClassNotes(e.target.value)}
                placeholder="Catatan keaktifan siswa atau santri yang perlu perhatian..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tugas Rumah / Setoran Lanjutan
              </label>
              <textarea
                rows={2}
                value={assignmentGiven}
                onChange={(e) => setAssignmentGiven(e.target.value)}
                placeholder="Tugas latihan mandiri atau murajaah..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Policy Info */}
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              Jurnal ini memvalidasi kehadiran KBM agar honor mengajar dihitung penuh 100%.
            </p>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
