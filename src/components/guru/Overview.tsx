import React, { useState } from 'react';
import { 
  Users, 
  CalendarDays,
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { useHRIS } from '../../context/HRISContext';
import { ClockInModal } from '../ClockInModal';

export const Overview: React.FC = () => {
  const { 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    selectedPeriod 
  } = useHRIS();

  const [activeClockInSchedule, setActiveClockInSchedule] = useState<any | null>(null);

  // Derive metrics
  const totalClasses = schedules.filter(s => s.teacherId === currentUser.id).length;
  const totalStudents = 120; // Example static
  const attendanceRate = "98%"; // Example static
  const pendingTasks = 3;

  // Simple timeline
  const todaySchedules = schedules.filter(s => s.teacherId === currentUser.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome back, {currentUser?.name || 'Guru'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {currentUser?.position} • {currentUser?.unit}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Buat Tugas
          </button>
          <button 
            onClick={() => setActiveClockInSchedule(todaySchedules[0])}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            Mulai Presensi
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Kelas Aktif', value: totalClasses, icon: CalendarDays },
          { label: 'Siswa Terdaftar', value: totalStudents, icon: Users },
          { label: 'Rata-rata Kehadiran', value: attendanceRate, icon: CheckCircle2 },
          { label: 'Tugas Menunggu Review', value: pendingTasks, icon: FileText, highlight: true }
        ].map((metric, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</span>
              <metric.icon className={`w-4 h-4 ${metric.highlight ? 'text-amber-500' : 'text-slate-400'}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{metric.value}</div>
          </div>
        ))}
      </div>

      {/* Today's Schedule Timeline */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-6">Jadwal Mengajar Harian</h2>
        <div className="space-y-6">
          {todaySchedules.map((schedule, idx) => (
            <div key={schedule.id} className="relative pl-6">
              {/* Timeline line */}
              {idx !== todaySchedules.length - 1 && (
                <div className="absolute top-6 left-[11px] bottom-[-24px] w-px bg-slate-200 dark:bg-slate-800" />
              )}
              {/* Timeline dot */}
              <div className="absolute top-1.5 left-0 w-[22px] h-[22px] rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-900 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{schedule.subject}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{schedule.className} • {schedule.room}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  <button 
                    onClick={() => setActiveClockInSchedule(schedule)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  >
                    <PlayCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {todaySchedules.length === 0 && (
            <div className="text-sm text-slate-500">Tidak ada jadwal hari ini.</div>
          )}
        </div>
      </div>

      {activeClockInSchedule && (
        <ClockInModal
          schedule={activeClockInSchedule}
          onClose={() => setActiveClockInSchedule(null)}
          onClockInSuccess={() => setActiveClockInSchedule(null)}
        />
      )}
    </div>
  );
};
