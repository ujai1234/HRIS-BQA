import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Teacher, 
  ClassSchedule, 
  AttendanceRecord, 
  BadalAssignment, 
  TeachingJournal,
  TeacherPayrollItem,
  MonthlyPayrollSummary,
  UserRole
} from '../types';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SCHEDULES, 
  INITIAL_ATTENDANCES, 
  INITIAL_BADAL_ASSIGNMENTS 
} from '../data/initialData';
import { calculateLatePenalty } from '../utils/formatters';

interface HRISContextType {
  teachers: Teacher[];
  schedules: ClassSchedule[];
  attendances: AttendanceRecord[];
  badalAssignments: BadalAssignment[];
  currentUser: Teacher;
  currentRole: UserRole;
  selectedPeriod: string;
  
  // Role & User Actions
  setCurrentUserById: (teacherId: string) => void;
  setCurrentRole: (role: UserRole) => void;
  setSelectedPeriod: (period: string) => void;
  
  // Attendance & Teaching Journal
  clockIn: (scheduleId: string, timeString?: string, notes?: string) => AttendanceRecord;
  submitJournal: (
    attendanceId: string, 
    journalInput: Omit<TeachingJournal, 'id' | 'attendanceId' | 'filledAt'>
  ) => void;
  markAttendanceDirect: (scheduleId: string, teacherId: string, status: AttendanceRecord['status'], notes?: string) => void;
  
  // Guru Badal
  createBadalAssignment: (data: Omit<BadalAssignment, 'id' | 'createdAt' | 'status'>) => void;
  approveBadalAssignment: (badalId: string) => void;
  
  // Master Data
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ClassSchedule>) => void;
  deleteSchedule: (id: string) => void;
  
  // Payroll Engine
  calculateTeacherPayroll: (teacherId: string, period?: string) => TeacherPayrollItem;
  calculateAllPayroll: (period?: string) => MonthlyPayrollSummary;
  
  // Reset
  resetToDefault: () => void;
}

const HRISContext = createContext<HRISContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TEACHERS: 'hris_pbq_teachers_v1',
  SCHEDULES: 'hris_pbq_schedules_v1',
  ATTENDANCES: 'hris_pbq_attendances_v1',
  BADAL: 'hris_pbq_badal_v1',
  CURRENT_USER_ID: 'hris_pbq_current_user_id_v1',
  CURRENT_ROLE: 'hris_pbq_current_role_v1',
  PERIOD: 'hris_pbq_period_v1',
};

export const HRISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
  });

  const [schedules, setSchedules] = useState<ClassSchedule[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCES);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCES;
  });

  const [badalAssignments, setBadalAssignments] = useState<BadalAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BADAL);
    return saved ? JSON.parse(saved) : INITIAL_BADAL_ASSIGNMENTS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'T-07'; // Default to Ust Akmal Yaqien (Admin)
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    return (saved as UserRole) || 'ADMIN';
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERIOD);
    return saved || 'Agustus 2026';
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCES, JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BADAL, JSON.stringify(badalAssignments));
  }, [badalAssignments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIOD, selectedPeriod);
  }, [selectedPeriod]);

  // Derived current user object
  const currentUser = teachers.find((t) => t.id === currentUserId) || teachers[6] || teachers[0];

  const setCurrentUserById = (teacherId: string) => {
    const target = teachers.find((t) => t.id === teacherId);
    if (target) {
      setCurrentUserId(teacherId);
      setCurrentRoleState(target.role);
    }
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
  };

  // Clock In Action
  const clockIn = (scheduleId: string, timeString?: string, notes?: string): AttendanceRecord => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) throw new Error('Jadwal tidak ditemukan');

    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const actualClockIn = timeString || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if there is an approved badal assignment for this schedule today
    const activeBadal = badalAssignments.find(
      (b) => b.scheduleId === scheduleId && b.date === todayStr && b.status !== 'PENDING'
    );

    const actualTeacherId = activeBadal ? activeBadal.badalTeacherId : currentUser.id;
    const isBadal = !!activeBadal && activeBadal.badalTeacherId === currentUser.id;

    const { lateMinutes, category, penalty } = calculateLatePenalty(actualClockIn, schedule.startTime);

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      scheduleId,
      teacherId: schedule.teacherId,
      actualTeacherId,
      isBadal,
      date: todayStr,
      clockInTime: actualClockIn,
      lateMinutes,
      lateCategory: category,
      latePenalty: penalty,
      status: 'HADIR_JURNAL_KOSONG',
      notes: notes || (isBadal ? `Clock-in sebagai Guru Badal menggantikan ${teachers.find(t => t.id === schedule.teacherId)?.name}` : undefined),
    };

    setAttendances((prev) => {
      // Remove any existing placeholder for this schedule today
      const filtered = prev.filter((a) => !(a.scheduleId === scheduleId && a.date === todayStr));
      return [newRecord, ...filtered];
    });

    return newRecord;
  };

  // Submit Jurnal Mengajar
  const submitJournal = (
    attendanceId: string,
    journalInput: Omit<TeachingJournal, 'id' | 'attendanceId' | 'filledAt'>
  ) => {
    const journalId = `JRN-${Date.now()}`;
    const newJournal: TeachingJournal = {
      ...journalInput,
      id: journalId,
      attendanceId,
      filledAt: new Date().toISOString(),
    };

    setAttendances((prev) =>
      prev.map((att) => {
        if (att.id === attendanceId) {
          return {
            ...att,
            status: 'SELESAI',
            journal: newJournal,
          };
        }
        return att;
      })
    );
  };

  // Direct status mark (e.g. Alpa, Izin, Sakit)
  const markAttendanceDirect = (
    scheduleId: string,
    teacherId: string,
    status: AttendanceRecord['status'],
    notes?: string
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      scheduleId,
      teacherId,
      actualTeacherId: teacherId,
      isBadal: false,
      date: todayStr,
      lateMinutes: 0,
      lateCategory: 'TEPAT_WAKTU',
      latePenalty: 0,
      status,
      notes,
    };

    setAttendances((prev) => {
      const filtered = prev.filter((a) => !(a.scheduleId === scheduleId && a.date === todayStr));
      return [newRecord, ...filtered];
    });
  };

  // Guru Badal Handlers
  const createBadalAssignment = (data: Omit<BadalAssignment, 'id' | 'createdAt' | 'status'>) => {
    const newBadal: BadalAssignment = {
      ...data,
      id: `BDL-${Date.now()}`,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    setBadalAssignments((prev) => [newBadal, ...prev]);
  };

  const approveBadalAssignment = (badalId: string) => {
    setBadalAssignments((prev) =>
      prev.map((b) => (b.id === badalId ? { ...b, status: 'APPROVED' } : b))
    );
  };

  // Master Data Guru CRUD
  const addTeacher = (teacherInput: Omit<Teacher, 'id'>) => {
    const newId = `T-${String(teachers.length + 1).padStart(2, '0')}`;
    const newTeacher: Teacher = {
      ...teacherInput,
      id: newId,
    };
    setTeachers((prev) => [...prev, newTeacher]);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
  };

  // Master Schedule CRUD
  const addSchedule = (schedInput: Omit<ClassSchedule, 'id'>) => {
    const newId = `SCH-${String(schedules.length + 1).padStart(2, '0')}`;
    const newSched: ClassSchedule = {
      ...schedInput,
      id: newId,
    };
    setSchedules((prev) => [...prev, newSched]);
  };

  const updateSchedule = (id: string, updates: Partial<ClassSchedule>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  // Payroll Calculation Engine for a specific teacher
  const calculateTeacherPayroll = (teacherId: string, _period = selectedPeriod): TeacherPayrollItem => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) {
      throw new Error(`Guru tidak ditemukan (ID: ${teacherId})`);
    }

    const teacherSchedules = schedules.filter((s) => s.teacherId === teacherId);
    const weeklyHours = teacherSchedules.reduce((sum, s) => sum + s.hours, 0);
    // Standard monthly scheduled load estimate (4 weeks in a month)
    const baseMonthlyScheduledHours = weeklyHours * 4 || 16; 

    // Find all attendance records where this teacher actually taught (including as badal)
    const actualTeachingRecords = attendances.filter(
      (a) => a.actualTeacherId === teacherId && (a.status === 'SELESAI' || a.status === 'HADIR_JURNAL_KOSONG')
    );

    // Badal sessions conducted by this teacher
    const badalSessions = actualTeachingRecords.filter((a) => a.isBadal);

    // Calculate actual taught hours based on records + estimated base monthly weight for simulation
    const actualTaughtHoursCount = actualTeachingRecords.reduce((sum, a) => {
      const sched = schedules.find((s) => s.id === a.scheduleId);
      return sum + (sched ? sched.hours : 2);
    }, 0);

    const badalHoursCount = badalSessions.reduce((sum, a) => {
      const sched = schedules.find((s) => s.id === a.scheduleId);
      return sum + (sched ? sched.hours : 2);
    }, 0);

    // Ensure baseline simulation is realistic based on weekly hours
    const totalTaughtHours = Math.max(actualTaughtHoursCount, baseMonthlyScheduledHours);

    // Distinct present days
    const presentDates = new Set(actualTeachingRecords.map((a) => a.date));
    const defaultMonthlyDays = Math.min(22, Math.max(16, weeklyHours > 0 ? weeklyHours * 2 : 18));
    const totalPresentDays = Math.max(presentDates.size, defaultMonthlyDays);

    // Hourly teaching honorarium
    const teachingHonorarium = totalTaughtHours * teacher.hourlyRate;
    const totalTransport = totalPresentDays * teacher.dailyTransport;

    // Deductions Calculation
    // 1. Late penalty
    const lateRecords = attendances.filter((a) => a.actualTeacherId === teacherId && a.latePenalty > 0);
    const recordedLatePenalty = lateRecords.reduce((sum, a) => sum + a.latePenalty, 0);
    const latePenaltyTotal = recordedLatePenalty;

    // 2. Empty Journal Penalty: 50% x (Jam Mengajar x Rp 40.000)
    const emptyJournalRecords = attendances.filter(
      (a) => a.actualTeacherId === teacherId && a.status === 'HADIR_JURNAL_KOSONG'
    );
    const emptyJournalCount = emptyJournalRecords.length;
    const emptyJournalPenalty = emptyJournalRecords.reduce((sum, a) => {
      const sched = schedules.find((s) => s.id === a.scheduleId);
      const hours = sched ? sched.hours : 2;
      return sum + 0.5 * (hours * teacher.hourlyRate);
    }, 0);

    // 3. Alpha Penalty: Transport + (Jam Mengajar x Tarif) + (5% Gaji Pokok)
    const alphaRecords = attendances.filter((a) => a.teacherId === teacherId && a.status === 'ALPA');
    const alphaDays = alphaRecords.length;
    const alphaPenalty = alphaRecords.reduce((sum, a) => {
      const sched = schedules.find((s) => s.id === a.scheduleId);
      const hours = sched ? sched.hours : 2;
      const alphaPerDay = teacher.dailyTransport + (hours * teacher.hourlyRate) + (0.05 * teacher.baseSalary);
      return sum + alphaPerDay;
    }, 0);

    const otherDeductions = 0; // Kasbon/Infaq sukarela
    const totalDeductions = latePenaltyTotal + emptyJournalPenalty + alphaPenalty + otherDeductions;
    const grossSalary = teacher.baseSalary + teachingHonorarium + totalTransport;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      teacher,
      period: _period,
      baseSalary: teacher.baseSalary,
      totalScheduledHours: baseMonthlyScheduledHours,
      totalTaughtHours,
      totalBadalHours: badalHoursCount,
      hourlyRate: teacher.hourlyRate,
      teachingHonorarium,
      totalPresentDays,
      dailyTransport: teacher.dailyTransport,
      totalTransport,
      latePenaltyTotal,
      emptyJournalCount,
      emptyJournalPenalty,
      alphaDays,
      alphaPenalty,
      otherDeductions,
      totalDeductions,
      grossSalary,
      netSalary,
    };
  };

  // Calculate full payroll table for all teachers
  const calculateAllPayroll = (period = selectedPeriod): MonthlyPayrollSummary => {
    const items = teachers.map((t) => calculateTeacherPayroll(t.id, period));
    const totalGross = items.reduce((sum, item) => sum + item.grossSalary, 0);
    const totalDeductions = items.reduce((sum, item) => sum + item.totalDeductions, 0);
    const totalNet = items.reduce((sum, item) => sum + item.netSalary, 0);
    const totalTeachingHours = items.reduce((sum, item) => sum + item.totalTaughtHours, 0);

    return {
      period,
      totalGross,
      totalDeductions,
      totalNet,
      totalTeachingHours,
      totalTeachers: teachers.length,
      generatedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      items,
    };
  };

  const resetToDefault = () => {
    localStorage.clear();
    setTeachers(INITIAL_TEACHERS);
    setSchedules(INITIAL_SCHEDULES);
    setAttendances(INITIAL_ATTENDANCES);
    setBadalAssignments(INITIAL_BADAL_ASSIGNMENTS);
    setCurrentUserId('T-07');
    setCurrentRoleState('ADMIN');
    setSelectedPeriod('Agustus 2026');
  };

  return (
    <HRISContext.Provider
      value={{
        teachers,
        schedules,
        attendances,
        badalAssignments,
        currentUser,
        currentRole,
        selectedPeriod,
        setCurrentUserById,
        setCurrentRole,
        setSelectedPeriod,
        clockIn,
        submitJournal,
        markAttendanceDirect,
        createBadalAssignment,
        approveBadalAssignment,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        calculateTeacherPayroll,
        calculateAllPayroll,
        resetToDefault,
      }}
    >
      {children}
    </HRISContext.Provider>
  );
};

export const useHRIS = () => {
  const context = useContext(HRISContext);
  if (!context) {
    throw new Error('useHRIS must be used within a HRISProvider');
  }
  return context;
};
