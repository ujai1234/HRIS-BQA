import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  unit: text('unit').notNull(),
  baseSalary: integer('base_salary').notNull(),
  hourlyRate: integer('hourly_rate').notNull().default(40000),
  dailyTransport: integer('daily_transport').notNull().default(10000),
  role: text('role').notNull().default('GURU'),
  phone: text('phone'),
  avatarColor: text('avatar_color'),
  avatarUrl: text('avatar_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true as any),
  username: text('username').unique(),
  password: text('password'),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  subject: text('subject').notNull(),
  className: text('class_name').notNull(),
  unit: text('unit').notNull(),
  dayOfWeek: text('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  hours: integer('hours').notNull(),
  room: text('room').notNull(),
});

export const attendances = sqliteTable('attendances', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  actualTeacherId: text('actual_teacher_id').references(() => teachers.id).notNull(),
  isBadal: integer('is_badal', { mode: 'boolean' }).notNull().default(false as any),
  date: text('date').notNull(), // YYYY-MM-DD
  clockInTime: text('clock_in_time'),
  lateMinutes: integer('late_minutes').notNull().default(0),
  lateCategory: text('late_category').notNull().default('TEPAT_WAKTU'),
  latePenalty: integer('late_penalty').notNull().default(0),
  status: text('status').notNull().default('BELUM_HADIR'),
  notes: text('notes'),
});

export const journals = sqliteTable('journals', {
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
  filledAt: integer('filled_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const badalAssignments = sqliteTable('badal_assignments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  originalTeacherId: text('original_teacher_id').references(() => teachers.id).notNull(),
  badalTeacherId: text('badal_teacher_id'),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('PENDING'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  category: text('category').notNull(),
  details: text('details').notNull(),
  severity: text('severity').notNull().default('INFO'),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp').notNull(),
});

export const learningNeedRequests = sqliteTable('learning_need_requests', {
  id: text('id').primaryKey(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // Buku, Alat Tulis, Sarana, Kurikulum, Lainnya
  status: text('status').notNull().default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED
  adminComment: text('admin_comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const geofenceSettings = sqliteTable('geofence_settings', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default("Baitul Qur'an Al-Ikhwan"),
  latitude: real('latitude').notNull().default(-6.589250),
  longitude: real('longitude').notNull().default(106.792880),
  radiusMeters: integer('radius_meters').notNull().default(150),
  strictMode: integer('strict_mode', { mode: 'boolean' }).notNull().default(true as any),
  enableMockBypass: integer('enable_mock_bypass', { mode: 'boolean' }).notNull().default(true as any),
  addressNotes: text('address_notes').default("Jl. KH. Al-Ikhwan No. 09, Gerbang Utama Pesantren"),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedBy: text('updated_by').default("Administrator"),
});


