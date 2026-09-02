import { pgTable, text, integer, boolean, timestamp, uuid, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'GURU', 'KEPALA_SMP', 'KEPALA_MA', 'KEPALA_PESANTREN', 'SYSTEM']);
export const unitTypeEnum = pgEnum('unit_type', ['SMP', 'MA', 'PESANTREN', 'UMUM']);
export const dayOfWeekEnum = pgEnum('day_of_week', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']);
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'BELUM_HADIR',
  'HADIR_JURNAL_KOSONG',
  'SELESAI',
  'GURU_BADAL',
  'IZIN',
  'SAKIT',
  'ALPA'
]);
export const lateCategoryEnum = pgEnum('late_category', [
  'TEPAT_WAKTU',
  'TERLAMBAT_RINGAN',
  'TERLAMBAT_SEDANG',
  'TERLAMBAT_BERAT'
]);

export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  unit: unitTypeEnum('unit').notNull(),
  baseSalary: integer('base_salary').notNull(),
  hourlyRate: integer('hourly_rate').notNull().default(40000),
  dailyTransport: integer('daily_transport').notNull().default(10000),
  role: userRoleEnum('role').notNull().default('GURU'),
  phone: text('phone'),
  avatarColor: text('avatar_color'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  username: text('username').unique(),
  password: text('password'),
});

export const schedules = pgTable('schedules', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  subject: text('subject').notNull(),
  className: text('class_name').notNull(),
  unit: unitTypeEnum('unit').notNull(),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  hours: integer('hours').notNull(),
  room: text('room').notNull(),
});

export const attendances = pgTable('attendances', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  actualTeacherId: text('actual_teacher_id').references(() => teachers.id).notNull(),
  isBadal: boolean('is_badal').notNull().default(false),
  date: text('date').notNull(), // YYYY-MM-DD
  clockInTime: text('clock_in_time'),
  lateMinutes: integer('late_minutes').notNull().default(0),
  lateCategory: lateCategoryEnum('late_category').notNull().default('TEPAT_WAKTU'),
  latePenalty: integer('late_penalty').notNull().default(0),
  status: attendanceStatusEnum('status').notNull().default('BELUM_HADIR'),
  notes: text('notes'),
});

export const journals = pgTable('journals', {
  id: text('id').primaryKey(),
  attendanceId: text('attendance_id').references(() => attendances.id).notNull(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  date: text('date').notNull(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  topic: text('topic').notNull(),
  learningObjectives: text('learning_objectives'),
  classNotes: text('class_notes'),
  totalStudents: integer('total_students').notNull(),
  presentCount: integer('present_count').notNull(),
  sickCount: integer('sick_count').notNull(),
  permittedCount: integer('permitted_count').notNull(),
  absentCount: integer('absent_count').notNull(),
  assignmentGiven: text('assignment_given'),
  filledAt: timestamp('filled_at').notNull().defaultNow(),
});

export const badalAssignments = pgTable('badal_assignments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  originalTeacherId: text('original_teacher_id').references(() => teachers.id).notNull(),
  badalTeacherId: text('badal_teacher_id'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('PENDING'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: userRoleEnum('user_role').notNull(),
  action: text('action').notNull(),
  category: text('category').notNull(),
  details: text('details').notNull(),
  severity: text('severity').notNull().default('INFO'),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp').notNull(),
});

export const learningNeedRequests = pgTable('learning_need_requests', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // Buku, Alat Tulis, Sarana, Kurikulum, Lainnya
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED
  adminComment: text('admin_comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const geofenceSettings = pgTable('geofence_settings', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default("Baitul Qur'an Al-Ikhwan"),
  latitude: doublePrecision('latitude').notNull().default(-6.589250),
  longitude: doublePrecision('longitude').notNull().default(106.792880),
  radiusMeters: integer('radius_meters').notNull().default(150),
  strictMode: boolean('strict_mode').notNull().default(true),
  enableMockBypass: boolean('enable_mock_bypass').notNull().default(true),
  addressNotes: text('address_notes').default("Jl. KH. Al-Ikhwan No. 09, Gerbang Utama Pesantren"),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by').default("Administrator"),
});

