const Database = require('better-sqlite3');
const xlsx = require('xlsx');
const path = require('path');

const db = new Database('sqlite.db');
const dbBak = new Database('sqlite.db.bak');

const teachers = db.prepare('SELECT * FROM teachers ORDER BY id').all();
const bakTeachers = dbBak.prepare('SELECT id, nip, name, unit, position FROM teachers').all();
const users = db.prepare('SELECT id, name, email, teacher_id FROM user').all();

const data = teachers.map((t, index) => {
  const orig = bakTeachers.find(b => b.id === t.id);
  const u = users.find(usr => usr.teacher_id === t.id);

  let category = 'Guru Pengajar';
  if (t.role === 'ADMIN' || t.id.includes('ADMIN')) {
    category = 'Administrator';
  } else if (t.role === 'KEUANGAN' || t.role === 'ADMIN_KEUANGAN' || t.id.includes('KEUANGAN')) {
    category = 'Staf Keuangan';
  } else if (t.role === 'STAFF' || t.id.includes('STAFF')) {
    category = 'Staf Operasional / Sarpras / Dapur';
  } else if (t.role === 'KETUA_SARPRAS' || t.position.toLowerCase().includes('sarpras')) {
    category = 'Ketua Sarpras & Non-Akademik';
  } else if (t.position.toLowerCase().includes('kepsek') || t.position.toLowerCase().includes('wakasek') || t.position.toLowerCase().includes('kepala')) {
    category = 'Pimpinan / Manajemen Sekolah';
  }

  return {
    'No': index + 1,
    'ID Sistem': t.id,
    'NIP HRIS': t.nip,
    'Nama Lengkap': orig ? orig.name : t.name,
    'Nama Alias / Tampilan KBM': t.name,
    'Kategori': category,
    'Jabatan': t.position,
    'Unit': t.unit,
    'Role Akses': t.role,
    'Username Login': t.username,
    'Email Akun': u ? u.email : (t.username.includes('@') ? t.username : `${t.username}@bqa.local`),
    'No. HP': t.phone || '-',
    'Status': t.is_active ? 'Aktif' : 'Non-Aktif',
    'Gaji Pokok (Rp)': t.base_salary,
    'Honor Per Jam (Rp)': t.hourly_rate,
    'Transport Harian (Rp)': t.daily_transport,
    'Transport Bulanan (Rp)': t.monthly_transport || 0,
    'Uang Makan Bulanan (Rp)': t.monthly_meal_allowance || 0
  };
});

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.json_to_sheet(data);

// Column widths
ws['!cols'] = [
  { wch: 5 },  // No
  { wch: 18 }, // ID Sistem
  { wch: 18 }, // NIP HRIS
  { wch: 32 }, // Nama Lengkap
  { wch: 26 }, // Nama Alias
  { wch: 30 }, // Kategori
  { wch: 28 }, // Jabatan
  { wch: 12 }, // Unit
  { wch: 18 }, // Role Akses
  { wch: 24 }, // Username
  { wch: 30 }, // Email
  { wch: 16 }, // No HP
  { wch: 10 }, // Status
  { wch: 16 }, // Gaji Pokok
  { wch: 16 }, // Honor Per Jam
  { wch: 18 }, // Transport Harian
  { wch: 20 }, // Transport Bulanan
  { wch: 22 }, // Uang Makan Bulanan
];

xlsx.utils.book_append_sheet(wb, ws, 'Master Data Guru & Staff');

const outputPath = path.join(__dirname, '..', 'DAFTAR_GURU_DAN_STAFF_HRIS_BQA.xlsx');
xlsx.writeFile(wb, outputPath);
console.log('[OK] Exported master teachers to:', outputPath);

const csvContent = xlsx.utils.sheet_to_csv(ws);
const csvPath = path.join(__dirname, '..', 'DAFTAR_GURU_DAN_STAFF_HRIS_BQA.csv');
require('fs').writeFileSync(csvPath, csvContent, 'utf-8');
console.log('[OK] Exported master teachers to:', csvPath);
