const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  nik TEXT,
  kk_number TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  class_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  nik TEXT,
  kk_number TEXT,
  phone TEXT,
  address TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_parents (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'AYAH'
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  billing_month TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
  payment_date TEXT,
  recorded_by TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculums (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  deadline TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_grades (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  feedback TEXT
);

CREATE TABLE IF NOT EXISTS student_attendances (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  journal_id TEXT NOT NULL,
  status TEXT NOT NULL
);
`);

console.log("Tables created successfully");
