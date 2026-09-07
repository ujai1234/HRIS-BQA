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

export const staffTasks = sqliteTable('staff_tasks', {
  id: text('id').primaryKey(),
  staffId: text('staff_id').references(() => teachers.id).notNull(),
  staffName: text('staff_name').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(), // 'DAPUR' | 'SARPRAS'
  taskToday: text('task_today').notNull(),
  taskTomorrow: text('task_tomorrow').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const staffExpenses = sqliteTable('staff_expenses', {
  id: text('id').primaryKey(),
  reporterId: text('reporter_id').references(() => teachers.id).notNull(),
  reporterName: text('reporter_name').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(), // 'DAPUR' | 'SARPRAS'
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ==========================================
// PORTAL SANTRI (SIS) TABLES
// ==========================================

export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  nik: text('nik'), // PII
  kkNumber: text('kk_number'), // PII
  name: text('name').notNull(),
  gender: text('gender').notNull(), // 'L' | 'P'
  className: text('class_name').notNull(),
  status: text('status').notNull().default('AKTIF'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Since user table is defined below, we must be careful with references.
// Drizzle supports forward referencing by wrapping in an arrow function if needed.
// Example: references(() => user.id)

export const parents = sqliteTable('parents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // references user.id (handled in logic/relations)
  nik: text('nik'), // PII
  kkNumber: text('kk_number'), // PII
  phone: text('phone'),
  address: text('address'),
  job: text('job'), // Pekerjaan
  income: text('income'), // Penghasilan (e.g., '< 5 Juta', '5 - 10 Juta')
  vehicle: text('vehicle'), // Kendaraan (e.g., 'Motor', 'Mobil', 'Tidak Ada')
  homeOwnership: text('home_ownership'), // Status Rumah (e.g., 'Milik Sendiri', 'Sewa/Kontrak')
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const studentParents = sqliteTable('student_parents', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  parentId: text('parent_id').references(() => parents.id).notNull(),
  relation: text('relation').notNull().default('AYAH'), // AYAH, IBU, WALI
});

export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  billingMonth: text('billing_month').notNull(), // e.g. "2026-09"
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('BELUM_LUNAS'), // BELUM_LUNAS, MENUNGGU_VERIFIKASI, LUNAS
  receiptUrl: text('receipt_url'), // base64 / URL bukti transfer
  paymentDate: text('payment_date'),
  recordedBy: text('recorded_by'), // Admin/Bendahara yang mencatat
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const studentNotes = sqliteTable('student_notes', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  teacherId: text('teacher_id').references(() => teachers.id).notNull(),
  type: text('type').notNull(), // KEDISIPLINAN, PRESTASI, AKADEMIK
  note: text('note').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const curriculums = sqliteTable('curriculums', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  weekNumber: integer('week_number').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const assignments = sqliteTable('assignments', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => schedules.id).notNull(),
  title: text('title').notNull(),
  deadline: text('deadline').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const studentGrades = sqliteTable('student_grades', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  assignmentId: text('assignment_id').references(() => assignments.id).notNull(),
  score: integer('score').notNull(),
  feedback: text('feedback'),
});

export const studentAttendances = sqliteTable('student_attendances', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  journalId: text('journal_id').references(() => journals.id).notNull(),
  status: text('status').notNull(), // HADIR, SAKIT, IZIN, ALPA
});


// Better Auth Tables
export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	image: text('image'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
    teacherId: text('teacher_id').references(() => teachers.id) // Link to original teacher record
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	issuer: text('issuer'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

// Tahfidz App Integration Tables
export const tahfidzEvaluations = sqliteTable('tahfidz_evaluations', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  date: text('date').notNull(),
  session: text('session').notNull(), // Subuh, Maghrib
  juzCompleted: integer('juz_completed').notNull().default(0),
  status: text('status').notNull(), // Tuntas, Sedang, Recovery
  notes: text('notes'),
  teacherName: text('teacher_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const tahfidzTasmi = sqliteTable('tahfidz_tasmi', {
  id: text('id').primaryKey(),
  studentId: text('student_id').references(() => students.id).notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(), // Pekanan, Per 3 Bulan, Per 6 Bulan
  score: integer('score').notNull(),
  predicate: text('predicate').notNull(),
  passed: integer('passed', { mode: 'boolean' }).notNull(),
  examinerName: text('examiner_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
