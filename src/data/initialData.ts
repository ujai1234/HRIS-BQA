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
  username: 'admin@bqa.local',
  password: 'PasswordKuat!2026',
},
{
  id: 'T-KEPALA-SMP',
  nip: 'KEPALA-SMP-01',
  name: 'Kepala Sekolah SMP',
  position: 'Kepsek SMP',
  unit: 'SMP',
  baseSalary: 3000000,
  hourlyRate: 50000,
  dailyTransport: 20000,
  role: 'KEPALA_SMP',
  phone: '08111111111',
  avatarColor: 'bg-blue-800',
  isActive: true,
  username: 'kepala.smp@bqa.local',
},
{
  id: 'T-KEPALA-MA',
  nip: 'KEPALA-MA-01',
  name: 'Kepala Sekolah MA',
  position: 'Kepsek MA',
  unit: 'MA',
  baseSalary: 3000000,
  hourlyRate: 50000,
  dailyTransport: 20000,
  role: 'KEPALA_MA',
  phone: '08222222222',
  avatarColor: 'bg-indigo-800',
  isActive: true,
  username: 'kepala.ma@bqa.local',
},
{
  id: 'T-KEPALA-PESANTREN',
  nip: 'KEPALA-PST-01',
  name: 'Kepala Pesantren',
  position: 'Kepsek Pesantren',
  unit: 'PESANTREN',
  baseSalary: 3500000,
  hourlyRate: 50000,
  dailyTransport: 20000,
  role: 'KEPALA_PESANTREN',
  phone: '08333333333',
  avatarColor: 'bg-green-800',
  isActive: true,
  username: 'kepala.pesantren@bqa.local',
},
{
  id: 'T-GURU-01',
  nip: 'GURU-01',
  name: 'Guru Penguji',
  position: 'Guru SMP',
  unit: 'SMP',
  baseSalary: 1000000,
  hourlyRate: 40000,
  dailyTransport: 10000,
  role: 'GURU',
  phone: '08444444444',
  avatarColor: 'bg-amber-600',
  isActive: true,
  username: 'guru@bqa.local',
},
{
  id: 'T-STAFF-01',
  nip: 'STAFF-01',
  name: 'Staff Operasional',
  position: 'Staff Dapur',
  unit: 'UMUM',
  baseSalary: 2000000,
  hourlyRate: 0,
  dailyTransport: 10000,
  role: 'STAFF',
  phone: '08555555555',
  avatarColor: 'bg-gray-600',
  isActive: true,
  username: 'staff@bqa.local',
}];

export const INITIAL_SCHEDULES: ClassSchedule[] = [];
export const INITIAL_ATTENDANCES: any[] = [];
export const INITIAL_BADAL_ASSIGNMENTS: BadalAssignment[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_LEARNING_NEEDS: LearningNeedRequest[] = [];
export const INITIAL_STAFF_JOURNALS: StaffJournalRecord[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_JOURNALS: any[] = [];
