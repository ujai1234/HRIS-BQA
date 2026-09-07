import React, { useState, useEffect, useMemo } from 'react';
import { useHRIS } from '../context/HRISContext';
import { BookOpen, CheckCircle2, ChevronRight, PlusCircle, Save, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const TeacherAcademics: React.FC = () => {
  const { currentRole, currentUser, schedules } = useHRIS();
  
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [studentGrades, setStudentGrades] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter schedules to only show those taught by this teacher
  const mySchedules = useMemo(() => {
    if (currentRole === 'ADMIN') return schedules; // Admin can see all
    return schedules.filter(s => s.teacherId === currentUser?.id);
  }, [schedules, currentUser, currentRole]);

  // Derived state: what is the selected schedule object
  const selectedSchedule = useMemo(() => {
    return schedules.find(s => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId]);

  // Derived state: assignments only for the selected schedule
  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => a.scheduleId === selectedScheduleId);
  }, [assignments, selectedScheduleId]);

  useEffect(() => {
    fetchAcademicsData();
  }, []);

  // When schedule changes, reset selected assignment and fetch students for that class
  useEffect(() => {
    setSelectedAssignmentId('');
    if (selectedSchedule) {
      fetchStudents(selectedSchedule.className);
    } else {
      setStudents([]);
    }
  }, [selectedScheduleId]);

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchGradesForAssignment(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const fetchAcademicsData = async () => {
    try {
      const asgRes = await fetch('/api/academics/assignments');
      const asgData = await asgRes.json();
      setAssignments(asgData.data || []);
    } catch (err) {
      console.error('Failed to fetch academics data', err);
    }
  };

  const fetchStudents = async (className: string) => {
    try {
      const stuRes = await fetch('/api/students');
      const stuData = await stuRes.json();
      const allStudents = stuData.data || [];
      const filtered = allStudents.filter((s: any) => s.className === className);
      setStudents(filtered.length > 0 ? filtered : allStudents.slice(0, 10)); // fallback if no match
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const fetchGradesForAssignment = async (asgId: string) => {
    try {
      const res = await fetch(`/api/academics/grades/${asgId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentGrades(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch grades', err);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignmentTitle.trim() || !selectedScheduleId) return;
    try {
      const res = await fetch('/api/academics/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: selectedScheduleId,
          title: newAssignmentTitle,
          deadline: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        toast.success('Tugas baru berhasil dibuat');
        setNewAssignmentTitle('');
        fetchAcademicsData();
      } else {
        toast.error('Gagal membuat tugas. Pastikan server sudah direstart.');
      }
    } catch (err) {
      toast.error('Gagal membuat tugas');
    }
  };

  const handleGradeChange = (studentId: string, field: 'score' | 'feedback', value: any) => {
    setStudentGrades(prev => {
      const idx = prev.findIndex(g => g.studentId === studentId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], [field]: value };
        return updated;
      } else {
        return [...prev, { studentId, assignmentId: selectedAssignmentId, [field]: value, score: field === 'score' ? value : 0, feedback: field === 'feedback' ? value : '' }];
      }
    });
  };

  const handleSaveGrades = async () => {
    if (!selectedAssignmentId || studentGrades.length === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academics/grades/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: studentGrades })
      });
      if (res.ok) {
        toast.success('Nilai berhasil disimpan!');
      } else {
        toast.error('Gagal menyimpan nilai. Pastikan server sudah direstart.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-emerald-50 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Penilaian Akademik Santri
          </h2>
          <p className="text-xs text-slate-500 dark:text-emerald-400/80 mt-1 font-medium">
            Pilih jadwal mengajar Anda, kelola tugas, dan berikan nilai santri.
          </p>
        </div>
      </div>

      <div className="bqa-card p-5 space-y-5 overflow-hidden">
        {/* Step 1: Select Schedule */}
        <div className="bg-slate-50 dark:bg-[#0e1713] p-4 rounded-xl border border-slate-200 dark:border-emerald-900/40">
          <label className="font-semibold text-slate-800 dark:text-emerald-100 text-xs mb-2 block flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            1. Pilih Jadwal Mengajar / Kelas
          </label>
          <select 
            value={selectedScheduleId} 
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0c1612] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          >
            <option value="">-- Pilih Jadwal & Kelas --</option>
            {mySchedules.map(s => (
              <option key={s.id} value={s.id}>{s.subject} - Kelas {s.className} ({s.dayOfWeek}, {s.startTime})</option>
            ))}
          </select>
        </div>

        {/* Step 2: Select or Create Assignment */}
        {selectedScheduleId && (
          <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-1 space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-emerald-100 text-xs">2. Pilih Tugas / Materi</label>
              <select 
                value={selectedAssignmentId} 
                onChange={(e) => setSelectedAssignmentId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0e1713] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">-- Pilih Tugas Terdaftar --</option>
                {filteredAssignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
            
            <div className="flex flex-col md:items-center justify-center pt-5 hidden md:flex text-slate-300 dark:text-emerald-900/50">
              <span className="font-bold">ATAU</span>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-emerald-100 text-xs">Buat Tugas Baru di Kelas Ini</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newAssignmentTitle} 
                  onChange={e => setNewAssignmentTitle(e.target.value)} 
                  placeholder="Misal: Hafalan Surat Al-Mulk"
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#0e1713] text-slate-900 dark:text-emerald-50 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
                <button 
                  onClick={handleCreateAssignment} 
                  disabled={!newAssignmentTitle.trim()}
                  className="bqa-btn-emerald px-4 py-2.5 disabled:opacity-50 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Buat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Input Grades */}
        {selectedAssignmentId && selectedScheduleId ? (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-emerald-900/40 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-emerald-50 text-sm">3. Input Nilai Kelas</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-400/60 mt-0.5">Berikan skor (0-100) dan catatan khusus per santri.</p>
              </div>
              <button
                onClick={handleSaveGrades}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-slate-800 dark:bg-emerald-700 hover:bg-slate-700 dark:hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
              </button>
            </div>

            <div className="border border-slate-200 dark:border-emerald-800/40 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-[#0e1713] border-b border-slate-200 dark:border-emerald-900/50">
                  <tr>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider">Nama Santri</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider text-center w-32">Nilai Akhir</th>
                    <th className="py-3 px-4 text-[10px] font-bold text-slate-500 dark:text-emerald-400 uppercase tracking-wider">Catatan / Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30">
                  {students.map((student) => {
                    const sGrade = studentGrades.find(g => g.studentId === student.id) || { score: 0, feedback: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:bg-[#0f1a15]/50 dark:hover:bg-[#13221b]/50 transition-colors group">
                        <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-emerald-100">
                          {student.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="number" 
                            min="0" max="100" 
                            value={sGrade.score || ''} 
                            onChange={(e) => handleGradeChange(student.id, 'score', parseInt(e.target.value) || 0)}
                            className="w-full text-center text-xs font-bold text-slate-800 dark:text-emerald-50 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0c1612] focus:outline-none focus:border-emerald-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="text" 
                            value={sGrade.feedback || ''} 
                            onChange={(e) => handleGradeChange(student.id, 'feedback', e.target.value)}
                            className="w-full text-xs text-slate-700 dark:text-emerald-100 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/40 bg-white dark:bg-[#0c1612] focus:outline-none focus:border-emerald-500"
                            placeholder="Tambahkan catatan untuk santri (opsional)..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center opacity-70">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-emerald-950/30 flex items-center justify-center mb-3 text-slate-400 dark:text-emerald-500/50">
              <BookOpen className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-emerald-300/80">
              {!selectedScheduleId ? 'Pilih Jadwal Mengajar Terlebih Dahulu' : 'Pilih Atau Buat Tugas Terlebih Dahulu'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

