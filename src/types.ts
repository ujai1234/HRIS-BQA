export type UserRole = 
  | 'ADMIN' 
  | 'GURU' 
  | 'KEPALA_SMP' 
  | 'KEPALA_MA' 
  | 'KEPALA_PESANTREN' 
  | 'SYSTEM'
  | 'STAFF';

export const isKepsekRole = (role?: UserRole): boolean => {
  return role === 'KEPALA_SMP' || role === 'KEPALA_MA' || role === 'KEPALA_PESANTREN';
};

export const getRoleUnit = (role?: UserRole, userUnit?: UnitType): UnitType | 'ALL' => {
  if (role === 'KEPALA_SMP') return 'SMP';
  if (role === 'KEPALA_MA') return 'MA';
  if (role === 'KEPALA_PESANTREN') return 'PESANTREN';
  if (role === 'ADMIN') return 'ALL';
  return userUnit || 'UMUM';
};

export const getRoleDisplayName = (role?: UserRole, position?: string): string => {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'KEPALA_SMP') return 'Kepala Sekolah SMP';
  if (role === 'KEPALA_MA') return 'Kepala Madrasah Aliyah';
  if (role === 'KEPALA_PESANTREN') return 'Mudir / Kepala Pesantren';
  if (role === 'GURU') return 'Guru / Asatidz';
  if (role === 'STAFF') return 'Staff Pesantren';
  return position || 'Pengguna';
};

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
  | 'Guru Tahfidz'
  | 'Staff Dapur'
  | 'Staff Inventaris'
  | 'Super Administrator';

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
  monthlyTransport?: number; // Transport Bulanan (Khusus Staff - misal Rp 250.000)
  monthlyMealAllowance?: number; // Uang Makan Bulanan (Khusus Staff - misal Rp 375.000)
  role: UserRole;
  phone?: string;
  avatarColor?: string;
  avatarUrl?: string;
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
  tahfidzHonorarium?: number; // total honor dari API Tahfidz
  totalPresentDays: number;
  dailyTransport: number;
  totalTransport: number; // totalPresentDays * dailyTransport
  
  // Potongan
  lateCountLight: number;
  lateCountMedium: number;
  lateCountHeavy: number;
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
  grossSalary: number; // baseSalary + teachingHonorarium + totalTransport + (monthlyMealAllowance)
  netSalary: number; // grossSalary - totalDeductions
  monthlyMealAllowance?: number; // Khusus Staff
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

export type LearningNeedStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type LearningNeedCategory = 'Buku' | 'Alat Tulis' | 'Sarana' | 'Kurikulum' | 'Lainnya';

export interface LearningNeedRequest {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  category: LearningNeedCategory;
  status: LearningNeedStatus;
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceSettings {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  strictMode: boolean;
  enableMockBypass: boolean;
  addressNotes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_GEOFENCE_SETTINGS: GeofenceSettings = {
  id: 'default_geofence',
  name: "Baitul Qur'an Al-Ikhwan Central Campus",
  latitude: -6.589250,
  longitude: 106.792880,
  radiusMeters: 150,
  strictMode: true,
  enableMockBypass: true,
  addressNotes: "Jl. KH. Al-Ikhwan No. 09, Gerbang Utama & Area Gedung KBM",
  updatedAt: new Date().toISOString(),
  updatedBy: "Administrator"
};

// ====== TAHFIDZ PAYROLL INTEGRATION ======
export type TahfidzSesi = 'Subuh' | 'Maghrib';

export interface TahfidzAbsensiRecord {
  id: number;
  tanggal: string;
  jam: string;
  username: string;
  nama: string;
  sesi: TahfidzSesi;
  halqah: string | null;
  status: 'Hadir' | 'Izin' | 'Sakit';
  jarakMeter: number | null;
  lokasiValidasi: boolean;
  keterangan: string | null;
  isAdminOverride: boolean;
}

export interface TahfidzPayrollItem {
  teacherName: string;
  teacherUsername: string;
  teacherId?: string; // Mapped HRIS teacher ID (if matched)
  halqah: string;
  period: string;
  totalSubuhHadir: number;
  totalMaghribHadir: number;
  totalSubuhIzin: number;
  totalMaghribIzin: number;
  totalSubuhSakit: number;
  totalMaghribSakit: number;
  totalJP: number; // totalSubuhHadir + totalMaghribHadir
  ratePerJP: number; // Rp 40.000
  totalHonor: number; // totalJP × ratePerJP
  presentDates: string[];
}

export interface TahfidzPayrollSummary {
  period: string;
  totalUstadz: number;
  totalJP: number;
  totalSubuhJP: number;
  totalMaghribJP: number;
  totalHonor: number;
  generatedDate: string;
  items: TahfidzPayrollItem[];
  apiStatus: 'connected' | 'disconnected' | 'loading';
}

// ====== EXPENSE REPORT INTEGRATION ======
export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  category: 'SARPRAS' | 'DAPUR';
  description: string; // e.g. "Beli Beras 50kg, Minyak 5L"
  amount: number;
  reporterId: string;
  reporterName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  receiptUrl?: string; // base64 or URL
  createdAt: string;
}

// ====== STAFF JOURNAL INTEGRATION ======
export interface StaffJournalRecord {
  id: string;
  date: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  category: 'SARPRAS' | 'DAPUR';
  taskToday: string; // Pekerjaan hari ini / Menu saat ini
  taskTomorrow: string; // Pekerjaan selanjutnya / Menu selanjutnya
  photoUrl?: string; // base64 or URL
  createdAt: string;
}
