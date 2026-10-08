const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log('=== Updating Teachers in sqlite.db ===');

// 1. Adjust teacher names
const updates = [
  { id: 'T-02', nip: 'PBQ-2018-002', name: 'Ust. Tofan', position: 'Kepsek MA', unit: 'MA' },
  { id: 'T-07', nip: 'PBQ-2020-007', name: 'Ust. Akmal', position: 'Operator Sekolah & Guru', unit: 'UMUM' },
  { id: 'T-08', nip: 'PBQ-2020-008', name: 'Ust. Fuad', position: 'Guru (Ust Muqim)', unit: 'PESANTREN' },
  { id: 'T-19', nip: 'PBQ-2022-019', name: 'Ust. Masyitah', position: 'Guru MA & SMK', unit: 'MA' },
  { id: 'T-10', nip: 'PBQ-2021-010', name: 'Ust. Saif', position: 'Guru (Ust Muqim)', unit: 'PESANTREN' },
  { id: 'T-14', nip: 'PBQ-2021-014', name: "Ustz. Mu'minah", position: 'Guru (Ustadzah Muqim)', unit: 'PESANTREN' },
];

for (const u of updates) {
  db.prepare(`
    UPDATE teachers 
    SET name = ?, position = ?, unit = ?
    WHERE id = ?
  `).run(u.name, u.position, u.unit, u.id);

  // Also update user table if existing
  db.prepare(`
    UPDATE user 
    SET name = ?
    WHERE teacher_id = ?
  `).run(u.name, u.id);

  console.log(`Updated teacher ${u.id}: ${u.name} (${u.nip})`);
}

// 2. Add Ustz. Ayu if not exists
const existingAyu = db.prepare("SELECT * FROM teachers WHERE nip = 'PBQ-2026-026' OR name LIKE '%Ayu%'").get();
if (!existingAyu) {
  const ayuTeacher = {
    id: 'T-26',
    nip: 'PBQ-2026-026',
    name: 'Ustz. Ayu',
    position: 'Guru SMK (Perbankan)',
    unit: 'SMK',
    base_salary: 700000,
    hourly_rate: 40000,
    daily_transport: 10000,
    role: 'GURU',
    phone: null,
    avatar_color: 'bg-teal-700',
    avatar_url: null,
    is_active: 1,
    username: 'ustz.ayu',
    password: 'guru123',
    monthly_transport: 250000,
    monthly_meal_allowance: 375000
  };

  db.prepare(`
    INSERT INTO teachers (
      id, nip, name, position, unit, base_salary, hourly_rate, 
      daily_transport, role, phone, avatar_color, avatar_url, 
      is_active, username, password, monthly_transport, monthly_meal_allowance
    ) VALUES (
      @id, @nip, @name, @position, @unit, @base_salary, @hourly_rate,
      @daily_transport, @role, @phone, @avatar_color, @avatar_url,
      @is_active, @username, @password, @monthly_transport, @monthly_meal_allowance
    )
  `).run(ayuTeacher);

  console.log('Inserted teacher Ustz. Ayu (T-26, PBQ-2026-026)');
} else {
  console.log('Ustz. Ayu already exists:', existingAyu.name, existingAyu.nip);
}

// List all relevant teachers
console.log('\n=== Verified SMA Teachers in DB ===');
const smaTeachers = db.prepare(`
  SELECT id, nip, name, unit, position, role 
  FROM teachers 
  WHERE id IN ('T-02', 'T-07', 'T-08', 'T-19', 'T-10', 'T-14', 'T-26')
`).all();
console.table(smaTeachers);
