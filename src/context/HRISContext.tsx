import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Teacher, 
  ClassSchedule, 
  AttendanceRecord, 
  BadalAssignment, 
  TeachingJournal,
  TeacherPayrollItem,
  MonthlyPayrollSummary,
  UserRole,
  AuditLog,
  AuditCategory,
  AuditSeverity
} from '../types';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SCHEDULES, 
  INITIAL_ATTENDANCES, 
  INITIAL_BADAL_ASSIGNMENTS,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';
import { calculateLatePenalty } from '../utils/formatters';

interface HRISContextType {
  teachers: Teacher[];
  schedules: ClassSchedule[];
  attendances: AttendanceRecord[];
  badalAssignments: BadalAssignment[];
  auditLogs: AuditLog[];
  currentUser: Teacher;
  currentRole: UserRole;
  selectedPeriod: string;
  isAuthenticated: boolean;
  currentPath: string;
  isDarkMode: boolean;
  
  // Role, Auth & User Actions
  login: (role: UserRole, teacherId?: string) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  setCurrentPath: (path: string) => void;
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
  addTeachersBulk: (teachers: Omit<Teacher, 'id'>[]) => Promise<{ success: boolean; count: number }>;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: Partial<ClassSchedule>) => void;
  deleteSchedule: (id: string) => void;
  addSchedulesBulk: (schedules: Omit<ClassSchedule, 'id'>[]) => Promise<{ success: boolean; count: number }>;
  
  // Payroll Engine
  calculateTeacherPayroll: (teacherId: string, period?: string) => TeacherPayrollItem;
  calculateAllPayroll: (period?: string) => MonthlyPayrollSummary;
  
  // Audit Logs
  logActivity: (
    action: string, 
    category: AuditCategory, 
    details: string, 
    severity?: AuditSeverity, 
    userOverride?: { id: string; name: string; role: UserRole }
  ) => Promise<void>;

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
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [badalAssignments, setBadalAssignments] = useState<BadalAssignment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Get current user from state to determine filtering
      const isGuru = currentRole === 'GURU';
      const teacherIdParam = isGuru ? `?teacherId=${currentUserId}` : '';

      const [tRes, sRes, aRes, bRes, lRes] = await Promise.all([
        fetch('/api/teachers'),
        fetch(`/api/schedules${teacherIdParam}`),
        fetch(`/api/attendances${teacherIdParam}`),
        fetch('/api/badal'),
        fetch('/api/audit-logs')
      ]);

      const [t, s, a, b, l] = await Promise.all([
        tRes.json(),
        sRes.json(),
        aRes.json(),
        bRes.json(),
        lRes.ok ? lRes.json() : []
      ]);

      if (t.length === 0) {
        await fetch('/api/seed', { method: 'POST' });
        return fetchAllData();
      }

      setTeachers(t);
      setSchedules(s);
      setAttendances(a);
      setBadalAssignments(b);
      if (Array.isArray(l) && l.length > 0) {
        setAuditLogs(l);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || '';
  });

  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ROLE);
    return (saved as UserRole) || 'GURU';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('hris_pbq_auth_v1');
    return saved === 'true';
  });

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const saved = localStorage.getItem('hris_pbq_path_v1');
    return saved || '/dashboard/guru';
  });

  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERIOD);
    return saved || 'Agustus 2026';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hris_pbq_dark_mode_v1');
      if (saved !== null) {
        return saved === 'true' || saved === '"true"';
      }
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    fetchAllData();
  }, [currentUserId, currentRole]);

  // Sync to local storage for auth/path only
  useEffect(() => {
    localStorage.setItem('hris_pbq_auth_v1', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('hris_pbq_dark_mode_v1', isDarkMode ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('hris_pbq_path_v1', currentPath);
  }, [currentPath]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIOD, selectedPeriod);
  }, [selectedPeriod]);

  // Derived current user object - with array check safety
  const currentUser = Array.isArray(teachers) 
    ? (teachers.find((t) => t.id === currentUserId) || teachers[0] || INITIAL_TEACHERS[0])
    : INITIAL_TEACHERS[0];

  const logActivity = async (
    action: string,
    category: AuditCategory,
    details: string,
    severity: AuditSeverity = 'INFO',
    userOverride?: { id: string; name: string; role: UserRole }
  ) => {
    const user = userOverride || {
      id: currentUser?.id || 'SYSTEM',
      name: currentUser?.name || 'Administrator',
      role: currentRole || 'ADMIN',
    };

    const newLog: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      category,
      details,
      severity,
      timestamp: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
    } catch (err) {
      console.error('Failed to persist audit log', err);
    }
  };

  const login = (role: UserRole, teacherId?: string) => {
    setIsAuthenticated(true);
    setCurrentRoleState(role);
    if (teacherId) setCurrentUserId(teacherId);

    const targetUser = teachers.find((t) => t.id === teacherId) || currentUser;
    logActivity(
      'LOGIN',
      'AUTH',
      `Login berhasil ke sistem sebagai ${role === 'ADMIN' ? 'Administrator' : role === 'KEPALA_PESANTREN' ? 'Kepala Pesantren' : 'Guru / Asatidz'} (${targetUser.name})`,
      'INFO',
      { id: targetUser.id, name: targetUser.name, role }
    );
    
    // Trigger path change based on role
    if (role === 'GURU') setCurrentPath('/dashboard/guru/clockin');
    else if (role === 'ADMIN') setCurrentPath('/dashboard/admin');
    else if (role === 'KEPALA_PESANTREN') setCurrentPath('/dashboard/kepsek/audit');
  };

  const logout = () => {
    logActivity(
      'LOGOUT',
      'AUTH',
      `Pengguna ${currentUser.name} (${currentRole}) telah keluar dari sistem`,
      'INFO'
    );
    setIsAuthenticated(false);
    setCurrentUserId('');
    setCurrentRoleState('GURU');
    setCurrentPath('/');
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE);
    localStorage.setItem('hris_pbq_auth_v1', 'false');
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const setCurrentUserById = (teacherId: string) => {
    const target = teachers.find((t) => t.id === teacherId);
    if (target) {
      setCurrentUserId(teacherId);
      setCurrentRoleState(target.role);
    }
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    if (role === 'GURU') setCurrentPath('/dashboard/guru');
    else if (role === 'ADMIN') setCurrentPath('/dashboard/admin');
    else if (role === 'KEPALA_PESANTREN') setCurrentPath('/dashboard/kepsek');
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

    const teacherForLate = teachers.find(t => t.id === actualTeacherId) || currentUser;
    const { lateMinutes, category, penalty } = calculateLatePenalty(
      actualClockIn, 
      schedule.startTime,
      teacherForLate.dailyTransport,
      schedule.hours,
      teacherForLate.hourlyRate
    );

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
      notes: notes || (isBadal ? `Clock-in sebagai Guru Badal menggantikan ${teachers.find(t => t.id === schedule.teacherId)?.name || 'Guru Asal'}` : undefined),
    };

    fetch('/api/attendances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).then(res => res.json()).then(() => fetchAllData());

    logActivity(
      'CLOCK_IN',
      'KBM',
      `Presensi Masuk KBM: ${schedule.subject} (${schedule.className}) jam ${actualClockIn} oleh ${teacherForLate.name}${isBadal ? ' (Guru Badal)' : ''} [${category.replace('_', ' ')}]`,
      category === 'TEPAT_WAKTU' ? 'INFO' : 'WARNING'
    );

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

    // Optimistically update attendance in state
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

    fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJournal)
    }).then(res => res.json()).then(() => fetchAllData());

    logActivity(
      'SUBMIT_JOURNAL',
      'KBM',
      `Jurnal KBM terisi: "${journalInput.topic}" (Kehadiran: ${journalInput.studentAttendance.presentCount}/${journalInput.studentAttendance.totalStudents} santri)`,
      'INFO'
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

    fetch('/api/attendances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    }).then(res => res.json()).then(() => fetchAllData());

    const tName = teachers.find(t => t.id === teacherId)?.name || teacherId;
    logActivity(
      'MARK_ATTENDANCE',
      'KBM',
      `Penetapan status kehadiran langsung: ${tName} berstatus ${status}${notes ? ` (${notes})` : ''}`,
      status === 'ALPA' ? 'CRITICAL' : 'WARNING'
    );
  };

  // Guru Badal Handlers
  const createBadalAssignment = (data: Omit<BadalAssignment, 'id' | 'createdAt' | 'status'>) => {
    const newBadal: BadalAssignment = {
      ...data,
      id: `BDL-${Date.now()}`,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };
    fetch('/api/badal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBadal)
    }).then(() => fetchAllData());

    const orig = teachers.find(t => t.id === data.originalTeacherId)?.name || data.originalTeacherId;
    const badal = teachers.find(t => t.id === data.badalTeacherId)?.name || data.badalTeacherId;
    logActivity(
      'ASSIGN_BADAL',
      'BADAL',
      `Penugasan Badal Baru: ${badal} menggantikan ${orig} (${data.reason})`,
      'WARNING'
    );
  };

  const approveBadalAssignment = (badalId: string) => {
    fetch(`/api/badal/${badalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' })
    }).then(() => fetchAllData());

    logActivity(
      'APPROVE_BADAL',
      'BADAL',
      `Persetujuan penugasan badal ID ${badalId} oleh ${currentUser.name}`,
      'INFO'
    );
  };

  // Master Data Guru CRUD
  const addTeacher = (teacherInput: Omit<Teacher, 'id'>) => {
    const newId = `T-${String(teachers.length + 1).padStart(2, '0')}`;
    const newTeacher: Teacher = {
      ...teacherInput,
      id: newId,
    };
    fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher)
    }).then(() => fetchAllData());

    logActivity(
      'CREATE_TEACHER',
      'KAFAAH',
      `Pendaftaran data guru & kafa'ah baru: ${newTeacher.name} (${newTeacher.position}, Unit ${newTeacher.unit}, Gaji Pokok: Rp ${newTeacher.baseSalary.toLocaleString('id-ID')})`,
      'WARNING'
    );
  };

  const addTeachersBulk = async (teacherInputs: Omit<Teacher, 'id'>[]) => {
    const currentCount = teachers.length;
    const colors = ['bg-emerald-700', 'bg-teal-700', 'bg-blue-700', 'bg-indigo-700', 'bg-cyan-700'];
    const newTeachers: Teacher[] = teacherInputs.map((input, idx) => {
      const nextIdx = currentCount + idx + 1;
      const cleanUsername = input.username || input.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || `guru${nextIdx}`;
      return {
        ...input,
        id: `T-${String(nextIdx).padStart(2, '0')}`,
        username: cleanUsername,
        password: input.password || 'guru123',
        avatarColor: input.avatarColor || colors[nextIdx % colors.length],
        isActive: input.isActive ?? true,
      };
    });

    try {
      const res = await fetch('/api/teachers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeachers)
      });
      if (res.ok) {
        await fetchAllData();
      } else {
        for (const t of newTeachers) {
          await fetch('/api/teachers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t)
          });
        }
        await fetchAllData();
      }

      await logActivity(
        'BULK_IMPORT_TEACHERS',
        'KAFAAH',
        `Impor massal data guru: Berhasil mengunggah ${newTeachers.length} data asatidz baru untuk tahun ajaran baru melalui template spreadsheet`,
        'WARNING'
      );

      return { success: true, count: newTeachers.length };
    } catch (err) {
      console.error('Bulk import error:', err);
      throw err;
    }
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    const origTeacher = teachers.find(t => t.id === id);
    fetch(`/api/teachers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(() => fetchAllData());

    const isFinancial = 'baseSalary' in updates || 'hourlyRate' in updates || 'dailyTransport' in updates;
    const details = isFinancial 
      ? `Perubahan data kafa'ah guru ${origTeacher?.name || id}: ${updates.baseSalary !== undefined ? `Gaji Pokok -> Rp ${updates.baseSalary.toLocaleString('id-ID')}; ` : ''}${updates.hourlyRate !== undefined ? `Tarif/JP -> Rp ${updates.hourlyRate.toLocaleString('id-ID')}; ` : ''}${updates.dailyTransport !== undefined ? `Transport -> Rp ${updates.dailyTransport.toLocaleString('id-ID')}` : ''}`
      : `Pembaruan profil guru ${origTeacher?.name || id}: ${Object.keys(updates).join(', ')}`;

    logActivity(
      isFinancial ? 'UPDATE_TEACHER_RATE' : 'UPDATE_TEACHER',
      isFinancial ? 'KAFAAH' : 'SYSTEM',
      details,
      isFinancial ? 'WARNING' : 'INFO'
    );
  };

  const deleteTeacher = (id: string) => {
    const origTeacher = teachers.find(t => t.id === id);
    fetch(`/api/teachers/${id}`, {
      method: 'DELETE'
    }).then(() => fetchAllData());

    logActivity(
      'DELETE_TEACHER',
      'SYSTEM',
      `Penghapusan data guru: ${origTeacher?.name || id} (NIP: ${origTeacher?.nip || '-'})`,
      'CRITICAL'
    );
  };

  // Master Schedule CRUD
  const addSchedule = (schedInput: Omit<ClassSchedule, 'id'>) => {
    const newId = `SCH-${String(schedules.length + 1).padStart(2, '0')}`;
    const newSched: ClassSchedule = {
      ...schedInput,
      id: newId,
    };
    fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSched)
    }).then(() => fetchAllData());

    const tName = teachers.find(t => t.id === schedInput.teacherId)?.name || schedInput.teacherId;
    logActivity(
      'CREATE_SCHEDULE',
      'KBM',
      `Penambahan jadwal KBM: ${schedInput.subject} (${schedInput.className}, ${schedInput.dayOfWeek} ${schedInput.startTime}-${schedInput.endTime}) untuk ${tName}`,
      'INFO'
    );
  };

  const addSchedulesBulk = async (newSchedules: Omit<ClassSchedule, 'id'>[]) => {
    try {
      const res = await fetch('/api/schedules/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedules)
      });
      
      if (res.ok) {
        await fetchAllData();
      } else {
        // Fallback to sequential if bulk fails
        for (const s of newSchedules) {
          await fetch('/api/schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(s)
          });
        }
        await fetchAllData();
      }

      await logActivity(
        'BULK_IMPORT_SCHEDULES',
        'KBM',
        `Impor massal jadwal KBM: Berhasil mengunggah ${newSchedules.length} entri jadwal pelajaran baru dari spreadsheet`,
        'INFO'
      );

      return { success: true, count: newSchedules.length };
    } catch (err) {
      console.error('Bulk schedules import error:', err);
      throw err;
    }
  };

  const updateSchedule = (id: string, updates: Partial<ClassSchedule>) => {
    fetch(`/api/schedules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).then(() => fetchAllData());

    logActivity(
      'UPDATE_SCHEDULE',
      'KBM',
      `Pembaruan jadwal KBM ID ${id}: ${Object.keys(updates).join(', ')}`,
      'INFO'
    );
  };

  const deleteSchedule = (id: string) => {
    fetch(`/api/schedules/${id}`, {
      method: 'DELETE'
    }).then(() => fetchAllData());

    logActivity(
      'DELETE_SCHEDULE',
      'KBM',
      `Penghapusan jadwal KBM ID ${id}`,
      'WARNING'
    );
  };

  // Payroll Calculation Engine for a specific teacher
  const calculateTeacherPayroll = (teacherId: string, _period = selectedPeriod): TeacherPayrollItem => {
    const teacher = teachers.find((t) => t.id === teacherId) || teachers[0] || INITIAL_TEACHERS[0];

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

    // 4. Izin Penalty: Transport + (Jam Mengajar x Tarif)
    const izinRecords = attendances.filter((a) => a.teacherId === teacherId && a.status === 'IZIN');
    const izinDays = izinRecords.length;
    const izinPenalty = izinRecords.reduce((sum, a) => {
      const sched = schedules.find((s) => s.id === a.scheduleId);
      const hours = sched ? sched.hours : 2;
      const izinPerDay = teacher.dailyTransport + (hours * teacher.hourlyRate);
      return sum + izinPerDay;
    }, 0);

    const otherDeductions = 0; // Kasbon/Infaq sukarela
    const totalDeductions = latePenaltyTotal + emptyJournalPenalty + alphaPenalty + izinPenalty + otherDeductions;
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
      izinDays,
      izinPenalty,
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
    logActivity(
      'RESET_DATABASE',
      'SYSTEM',
      'Inisialisasi ulang database sistem ke konfigurasi awal (Factory Reset)',
      'CRITICAL'
    );
    localStorage.clear();
    fetch('/api/reset', { method: 'POST' }).then(() => {
      logout();
      fetchAllData();
    });
  };

  return (
    <HRISContext.Provider
      value={{
        teachers,
        schedules,
        attendances,
        badalAssignments,
        auditLogs,
        currentUser,
        currentRole,
        selectedPeriod,
        isAuthenticated,
        currentPath,
        isDarkMode,
        login,
        logout,
        toggleDarkMode,
        setCurrentPath,
        setCurrentUserById,
        setCurrentRole,
        setSelectedPeriod,
        clockIn,
        submitJournal,
        markAttendanceDirect,
        createBadalAssignment,
        approveBadalAssignment,
        addTeacher,
        addTeachersBulk,
        addSchedulesBulk,
        updateTeacher,
        deleteTeacher,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        calculateTeacherPayroll,
        calculateAllPayroll,
        logActivity,
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
