import { Teacher, ClassSchedule, AttendanceRecord, BadalAssignment, AuditLog, LearningNeedRequest, ExpenseRecord, StaffJournalRecord } from '../types';

export const INITIAL_STUDENTS: any[] = [];

export const INITIAL_TEACHERS: Teacher[] = [{
  id: 'T-ADMIN-SUPER',
  nip: 'ADMIN-SUPER-01',
  name: 'Ustadz Hudzaifah',
  position: 'Super Administrator',
  unit: 'UMUM',
  baseSalary: 1000000,
  hourlyRate: 50000,
  dailyTransport: 20000,
  role: 'ADMIN',
  phone: '08123456789',
  avatarColor: 'bg-emerald-800',
  isActive: true,
  username: 'ujai757@gmail.com',
  password: 'PasswordKuat!2026',
}];

export const INITIAL_SCHEDULES: ClassSchedule[] = [];
export const INITIAL_ATTENDANCES: any[] = [];
export const INITIAL_BADAL_ASSIGNMENTS: BadalAssignment[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_LEARNING_NEEDS: LearningNeedRequest[] = [];
export const INITIAL_STAFF_JOURNALS: StaffJournalRecord[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_JOURNALS: any[] = [];
