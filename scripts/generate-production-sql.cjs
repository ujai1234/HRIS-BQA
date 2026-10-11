const fs = require('fs');

const sql = `-- ========================================================================
-- SQL SCRIPT: Update Data Guru & Jadwal SMA/SMK BQA 2026-2027
-- Sesuai Struktur Timetable & Beban Mengajar Asatidz BQA
-- ========================================================================

-- 1. Penyesuaian Nama Pengajar di Data Guru (Tabel teachers)
UPDATE teachers SET name = 'Ust. Tofan', position = 'Kepsek MA', unit = 'MA' WHERE id = 'T-02' OR nip = 'PBQ-2018-002';
UPDATE teachers SET name = 'Ust. Akmal', position = 'Operator Sekolah & Guru', unit = 'UMUM' WHERE id = 'T-07' OR nip = 'PBQ-2020-007';
UPDATE teachers SET name = 'Ust. Fuad', position = 'Guru (Ust Muqim)', unit = 'PESANTREN' WHERE id = 'T-08' OR nip = 'PBQ-2020-008';
UPDATE teachers SET name = 'Ust. Masyitah', position = 'Guru MA & SMK', unit = 'MA' WHERE id = 'T-19' OR nip = 'PBQ-2022-019';
UPDATE teachers SET name = 'Ust. Saif', position = 'Guru (Ust Muqim)', unit = 'PESANTREN' WHERE id = 'T-10' OR nip = 'PBQ-2021-010';
UPDATE teachers SET name = 'Ustz. Mu''minah', position = 'Guru (Ustadzah Muqim)', unit = 'PESANTREN' WHERE id = 'T-14' OR nip = 'PBQ-2021-014';

-- Update nama di tabel akun user (Better-Auth)
UPDATE user SET name = 'Ust. Tofan' WHERE teacher_id = 'T-02';
UPDATE user SET name = 'Ust. Akmal' WHERE teacher_id = 'T-07';
UPDATE user SET name = 'Ust. Fuad' WHERE teacher_id = 'T-08';
UPDATE user SET name = 'Ust. Masyitah' WHERE teacher_id = 'T-19';
UPDATE user SET name = 'Ust. Saif' WHERE teacher_id = 'T-10';
UPDATE user SET name = 'Ustz. Mu''minah' WHERE teacher_id = 'T-14';

-- 2. Penambahan/Update Akun Ketua Sarpras: Ust Rusli RZ (PBQ-2026-026)
INSERT OR REPLACE INTO teachers (
  id, nip, name, position, unit, base_salary, hourly_rate, 
  daily_transport, role, phone, avatar_color, avatar_url, 
  is_active, username, password, monthly_transport, monthly_meal_allowance
) VALUES (
  'T-26', 'PBQ-2026-026', 'Ust Rusli RZ', 'Ketua Sarpras', 'UMUM', 2500000, 40000,
  10000, 'KETUA_SARPRAS', '081234567890', 'bg-emerald-700', NULL,
  1, 'daeng.rusli79@gmail.com', 'sarpras123', 250000, 375000
);

-- 3. Data Guru Pengajar: Ustz. Ayu (AYU)
INSERT OR REPLACE INTO teachers (
  id, nip, name, position, unit, base_salary, hourly_rate, 
  daily_transport, role, phone, avatar_color, avatar_url, 
  is_active, username, password, monthly_transport, monthly_meal_allowance
) VALUES (
  'T-27', 'PBQ-2026-027', 'Ustz. Ayu', 'Guru SMK (Perbankan)', 'SMK', 700000, 40000,
  10000, 'GURU', NULL, 'bg-teal-700', NULL,
  1, 'ustz.ayu', 'guru123', 250000, 375000
);
`;

fs.writeFileSync('update_sma_production.sql', sql, 'utf-8');
console.log('[OK] Generated update_sma_production.sql');
