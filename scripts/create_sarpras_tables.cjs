const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('Ensuring staff_assignments table in', dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS staff_assignments (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL REFERENCES teachers(id),
    staff_name TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    assigned_by TEXT NOT NULL DEFAULT 'Ketua Sarpras',
    assigned_date TEXT NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    completion_notes TEXT,
    completed_at TEXT,
    created_at INTEGER NOT NULL
  );
`);

// Check if Ketua Sarpras teacher exists
const existing = db.prepare("SELECT * FROM teachers WHERE role = 'KETUA_SARPRAS' OR username = 'sarpras'").get();
if (!existing) {
  console.log('Inserting default Ketua Sarpras account...');
  db.prepare(`
    INSERT INTO teachers (
      id, nip, name, position, unit, base_salary, hourly_rate, daily_transport, role, phone, avatar_color, is_active, username, password, monthly_transport, monthly_meal_allowance
    ) VALUES (
      'T-SARPRAS-01', 'SARPRAS-01', 'Ketua Sarpras & Fasilitas', 'Ketua Sarpras', 'UMUM', 2500000, 40000, 10000, 'KETUA_SARPRAS', '081234567890', 'bg-emerald-700', 1, 'sarpras', 'sarpras123', 250000, 375000
    )
  `).run();
  console.log('Ketua Sarpras inserted into teachers.');
} else {
  console.log('Ketua Sarpras account already exists:', existing.id, existing.username, existing.role);
  // Ensure role is KETUA_SARPRAS
  db.prepare("UPDATE teachers SET role = 'KETUA_SARPRAS', position = 'Ketua Sarpras' WHERE id = ?").run(existing.id);
}

// Check dummy operational schedule for staff so foreign keys for attendances always pass
const staffMembers = db.prepare("SELECT id, name, position FROM teachers WHERE role = 'STAFF'").all();
console.log('Found staff members:', staffMembers.length);
for (const s of staffMembers) {
  const schedId = `SCHED-STAFF-${s.id}`;
  const sched = db.prepare("SELECT id FROM schedules WHERE id = ?").get(schedId);
  if (!sched) {
    db.prepare(`
      INSERT INTO schedules (id, teacher_id, subject, class_name, unit, day_of_week, start_time, end_time, hours, room, custom_rate)
      VALUES (?, ?, ?, ?, 'UMUM', 'Senin', '07:00', '16:00', 8, 'Area Pesantren', 0)
    `).run(schedId, s.id, `Tugas ${s.position || 'Staff'}`, 'Staff Operasional');
    console.log('Created operational schedule for staff:', s.name, schedId);
  }
}

console.log('Done.');
