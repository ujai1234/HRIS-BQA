export type UserRole = 'ADMIN' | 'GURU' | 'KEPALA_PESANTREN' | 'SYSTEM';

export type PositionCategory = 
  | 'Kepsek SMP'
  | 'Kepsek MA'
  | 'Kepsek Pesantren'
  | 'Wakasek SMP'
  | 'Wakasek Pesantren'
  | 'Sekretaris Pesantren'
  | 'Operator Sekolah'
  | 'Guru (Ust Muqim)'
  | 'Guru (Ustadzah Muqim)'
  | 'Guru Mukim'
  | 'Guru SMP'
  | 'Guru MA'
  | 'Guru Pesantren'
  | 'Guru Tahfidz';

export type UnitType = 'SMP' | 'MA' | 'PESANTREN' | 'UMUM';

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  position: PositionCategory;
  unit: UnitType;
  baseSalary: number; // Gaji Pokok
  hourlyRate: number; // Tarif/Jam (Default Rp 40.000)
  dailyTransport: number; // Transport/Hari (Default Rp 10.000)
  role: UserRole;
  phone?: string;
  avatarColor?: string;
  isActive: boolean;
  username?: string;
  password?: string;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Ahad';

export interface ClassSchedule {
  id: string;
  teacherId: string;
  subject: string;
  className: string; // e.g. "VII-A (SMP)", "X-IPA (MA)", "Tahfidz Ula"
  unit: UnitType;
  dayOfWeek: DayOfWeek;
  startTime: string; // "07:30"
  endTime: string; // "08:50"
  hours: number; // JP (Jam Pelajaran, e.g. 2 JP)
  room: string;
}

export type AttendanceStatus = 
  | 'BELUM_HADIR'
  | 'HADIR_JURNAL_KOSONG'
  | 'SELESAI'
  | 'GURU_BADAL'
  | 'IZIN'
  | 'SAKIT'
  | 'ALPA';

export type LateCategory = 
  | 'TEPAT_WAKTU' // <= 4 min
  | 'TERLAMBAT_RINGAN' // 5 - 15 min (Potongan Rp 10.000)
  | 'TERLAMBAT_SEDANG' // 16 - 30 min (Potongan Rp 20.000)
  | 'TERLAMBAT_BERAT'; // > 30 min (Potongan Rp 35.000)

export interface StudentAttendance {
  totalStudents: number;
  presentCount: number;
  sickCount: number;
  permittedCount: number;
  absentCount: number;
}

export interface TeachingJournal {
  id: string;
  attendanceId: string;
  scheduleId: string;
  date: string;
  teacherId: string; // actual teacher who filled it (could be Badal)
  topic: string; // Uraian PBM / Materi Pembelajaran
  learningObjectives?: string; // Capaian Pembelajaran
  classNotes?: string; // Catatan Kendala / Keaktifan Kelas
  studentAttendance: StudentAttendance;
  assignmentGiven?: string; // Tugas Rumah / Hafalan
  learningNeeds?: string; // Kebutuhan Pembelajaran (Pengajuan ke Admin)
  filledAt: string; // ISO Timestamp
}

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  teacherId: string; // Scheduled teacher
  actualTeacherId: string; // Could be Badal if substituted
  isBadal: boolean;
  date: string; // "YYYY-MM-DD"
  clockInTime?: string; // "07:32"
  lateMinutes: number;
  lateCategory: LateCategory;
  latePenalty: number;
  status: AttendanceStatus;
  journal?: TeachingJournal;
  notes?: string;
}

export interface BadalAssignment {
  id: string;
  date: string;
  scheduleId: string;
  originalTeacherId: string;
  badalTeacherId: string;
  reason: 'Sakit' | 'Izin Keperluan' | 'Tugas Kedinasan Pesantren' | 'Urusan Mendesak';
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}

export interface TeacherPayrollItem {
  teacher: Teacher;
  period: string; // "Agustus 2026"
  baseSalary: number;
  totalScheduledHours: number;
  totalTaughtHours: number; // Actual hours taught including badal
  totalBadalHours: number; // Hours taught as substitute
  hourlyRate: number;
  teachingHonorarium: number; // totalTaughtHours * hourlyRate
  totalPresentDays: number;
  dailyTransport: number;
  totalTransport: number; // totalPresentDays * dailyTransport
  
  // Potongan
  latePenaltyTotal: number;
  emptyJournalCount: number;
  emptyJournalPenalty: number; // 50% x (hours x rate)
  izinDays?: number;
  izinPenalty?: number; // transport + (hours x rate)
  alphaDays: number;
  alphaPenalty: number; // transport + (hours x rate) + 5% baseSalary
  otherDeductions: number;
  totalDeductions: number;
  
  // Total
  grossSalary: number; // baseSalary + teachingHonorarium + totalTransport
  netSalary: number; // grossSalary - totalDeductions
}

export interface MonthlyPayrollSummary {
  period: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalTeachingHours: number;
  totalTeachers: number;
  generatedDate: string;
  items: TeacherPayrollItem[];
}

export type AuditCategory = 'AUTH' | 'KAFAAH' | 'KBM' | 'BADAL' | 'SYSTEM';
export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  category: AuditCategory;
  details: string;
  severity: AuditSeverity;
  ipAddress?: string;
  timestamp: string; // ISO String
}
