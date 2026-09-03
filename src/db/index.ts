import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'sqlite.db');

// Ensure parent folder exists if nested
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Connecting to SQLite database at: ${dbPath}`);
export const sqliteDb = new Database(dbPath);
sqliteDb.pragma('journal_mode = WAL');

// Ensure tables exist on startup
sqliteDb.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    nip TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    unit TEXT NOT NULL,
    base_salary INTEGER NOT NULL,
    hourly_rate INTEGER NOT NULL DEFAULT 40000,
    daily_transport INTEGER NOT NULL DEFAULT 10000,
    role TEXT NOT NULL DEFAULT 'GURU',
    phone TEXT,
    avatar_color TEXT,
    avatar_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id),
    subject TEXT NOT NULL,
    class_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    hours INTEGER NOT NULL,
    room TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendances (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL REFERENCES schedules(id),
    teacher_id TEXT NOT NULL REFERENCES teachers(id),
    actual_teacher_id TEXT NOT NULL REFERENCES teachers(id),
    is_badal INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    clock_in_time TEXT,
    late_minutes INTEGER NOT NULL DEFAULT 0,
    late_category TEXT NOT NULL DEFAULT 'TEPAT_WAKTU',
    late_penalty INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'BELUM_HADIR',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS journals (
    id TEXT PRIMARY KEY,
    attendance_id TEXT NOT NULL REFERENCES attendances(id),
    schedule_id TEXT NOT NULL REFERENCES schedules(id),
    date TEXT NOT NULL,
    teacher_id TEXT NOT NULL REFERENCES teachers(id),
    topic TEXT NOT NULL,
    learning_objectives TEXT,
    class_notes TEXT,
    total_students INTEGER NOT NULL,
    present_count INTEGER NOT NULL,
    sick_count INTEGER NOT NULL,
    permitted_count INTEGER NOT NULL,
    absent_count INTEGER NOT NULL,
    assignment_given TEXT,
    filled_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS badal_assignments (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    schedule_id TEXT NOT NULL REFERENCES schedules(id),
    original_teacher_id TEXT NOT NULL REFERENCES teachers(id),
    badal_teacher_id TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    category TEXT NOT NULL,
    details TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    ip_address TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS learning_need_requests (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES teachers(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_comment TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS geofence_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT "Baitul Qur'an Al-Ikhwan",
    latitude REAL NOT NULL DEFAULT -6.589250,
    longitude REAL NOT NULL DEFAULT 106.792880,
    radius_meters INTEGER NOT NULL DEFAULT 150,
    strict_mode INTEGER NOT NULL DEFAULT 1,
    enable_mock_bypass INTEGER NOT NULL DEFAULT 1,
    address_notes TEXT DEFAULT "Jl. KH. Al-Ikhwan No. 09, Gerbang Utama Pesantren",
    updated_at INTEGER NOT NULL,
    updated_by TEXT DEFAULT "Administrator"
  );
`);

export const db = drizzle(sqliteDb, { schema });

