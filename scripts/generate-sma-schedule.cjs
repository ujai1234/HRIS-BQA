const xlsx = require('xlsx');
const fs = require('fs');
const Database = require('better-sqlite3');

const db = new Database('sqlite.db');

// Map of teachers based on image:
// 1. Ust. Tofan (THM): PBQ-2018-002
// 2. Ust. Akmal (AMY): PBQ-2020-007
// 3. Ust. Fuad (FAM): PBQ-2020-008
// 4. Ust. Masyitah (MNH): PBQ-2022-019
// 5. Ust. Saif (SAM): PBQ-2021-010
// 6. Ustz. Mu'minah (MTH): PBQ-2021-014
// 7. Ustz. Ayu (AYU): PBQ-2026-026

const T_TOFAN = 'PBQ-2018-002';
const T_AKMAL = 'PBQ-2020-007';
const T_FUAD = 'PBQ-2020-008';
const T_MASYITAH = 'PBQ-2022-019';
const T_SAIF = 'PBQ-2021-010';
const T_MUMINAH = 'PBQ-2021-014';
const T_AYU = 'PBQ-2026-026';

// Headers
const headers = [
  'NIP Guru',
  'Mata Pelajaran',
  'Kelas',
  'Unit',
  'Hari',
  'Jam Mulai (HH:mm)',
  'Jam Selesai (HH:mm)',
  'Jumlah JP',
  'Ruangan',
  'Honor Per Sesi / Ekskul (Opsional)'
];

// Schedule rows mapping
const scheduleRows = [
  // SENIN
  [T_TOFAN, 'Apel Pekanan', 'X (MA)', 'MA', 'Senin', '06:30', '07:30', 2, 'Kelas A', ''],
  [T_TOFAN, 'BAHASA INDONESIA', 'X (MA)', 'MA', 'Senin', '07:30', '08:30', 2, 'Kelas A', ''],
  [T_MUMINAH, 'MATEMATIKA', 'X (MA)', 'MA', 'Senin', '08:30', '09:30', 2, 'Kelas A', ''],
  [T_FUAD, 'KIMIA', 'X (MA)', 'MA', 'Senin', '10:00', '11:00', 2, 'Kelas A', ''],

  [T_TOFAN, 'Apel Pekanan', 'XI (SMK)', 'SMK', 'Senin', '06:30', '07:30', 2, 'Kelas B', ''],
  [T_SAIF, 'EKONOMI', 'XI (SMK)', 'SMK', 'Senin', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_MASYITAH, 'BAHASA INGGRIS', 'XI (SMK)', 'SMK', 'Senin', '08:30', '09:30', 2, 'Kelas B', ''],
  [T_TOFAN, 'BAHASA INDONESIA', 'XI (SMK)', 'SMK', 'Senin', '10:00', '11:00', 2, 'Kelas B', ''],

  [T_TOFAN, 'Apel Pekanan', 'XII (MA)', 'MA', 'Senin', '06:30', '07:30', 2, 'Kelas C', ''],
  [T_MUMINAH, 'FISIKA', 'XII (MA)', 'MA', 'Senin', '07:30', '08:30', 2, 'Kelas C', ''],
  [T_TOFAN, 'BAHASA INDONESIA', 'XII (MA)', 'MA', 'Senin', '08:30', '09:30', 2, 'Kelas C', ''],
  [T_SAIF, 'EKONOMI', 'XII (MA)', 'MA', 'Senin', '10:00', '11:00', 2, 'Kelas C', ''],

  // SELASA
  [T_SAIF, 'EKONOMI', 'X (MA)', 'MA', 'Selasa', '07:30', '08:30', 2, 'Kelas A', ''],
  [T_FUAD, 'BIOLOGI', 'X (MA)', 'MA', 'Selasa', '08:30', '09:30', 2, 'Kelas A', ''],
  [T_MUMINAH, 'FISIKA', 'X (MA)', 'MA', 'Selasa', '10:00', '11:00', 2, 'Kelas A', ''],

  [T_AKMAL, 'MATEMATIKA', 'XI (SMK)', 'SMK', 'Selasa', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_SAIF, 'DASAR-DASAR FOTOGRAFI', 'XI DKV (SMK)', 'SMK', 'Selasa', '08:30', '09:30', 2, 'Kelas B', ''],
  [T_AKMAL, 'KOMPOSISI TIPOGRAFI', 'XI DKV (SMK)', 'SMK', 'Selasa', '10:00', '11:00', 2, 'Kelas B', ''],

  [T_MUMINAH, 'FISIKA', 'XII (MA)', 'MA', 'Selasa', '07:30', '08:30', 2, 'Kelas C', ''],
  [T_MASYITAH, 'BAHASA INGGRIS', 'XII (MA)', 'MA', 'Selasa', '08:30', '09:30', 2, 'Kelas C', ''],
  [T_FUAD, 'ETIKA PROFESI', 'XI AKL (SMK)', 'SMK', 'Selasa', '10:00', '11:00', 2, 'Kelas B', ''],

  // RABU
  [T_FUAD, 'KIMIA', 'X (MA)', 'MA', 'Rabu', '07:30', '08:30', 2, 'Kelas A', ''],
  [T_MASYITAH, 'BAHASA INGGRIS', 'X (MA)', 'MA', 'Rabu', '08:30', '09:30', 2, 'Kelas A', ''],
  [T_MUMINAH, 'FISIKA', 'X (MA)', 'MA', 'Rabu', '10:00', '11:00', 2, 'Kelas A', ''],

  [T_AYU, 'PERBANKAN', 'XI AKL (SMK)', 'SMK', 'Rabu', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_AKMAL, 'SPREADSHEET', 'XI AKL (SMK)', 'SMK', 'Rabu', '08:30', '09:30', 2, 'Kelas B', ''],
  [T_TOFAN, 'PROJECT IPAS', 'XI (SMK)', 'SMK', 'Rabu', '10:00', '11:00', 2, 'Kelas B', ''],

  [T_AKMAL, 'MATEMATIKA', 'XII (MA)', 'MA', 'Rabu', '07:30', '08:30', 2, 'Kelas C', ''],
  [T_TOFAN, 'BIOLOGI', 'XII (MA)', 'MA', 'Rabu', '08:30', '09:30', 2, 'Kelas C', ''],
  [T_MASYITAH, 'BAHASA INGGRIS', 'XII (MA)', 'MA', 'Rabu', '10:00', '11:00', 2, 'Kelas C', ''],

  // KAMIS
  [T_TOFAN, 'BAHASA INDONESIA', 'X (MA)', 'MA', 'Kamis', '07:30', '08:30', 2, 'Kelas A', ''],
  [T_TOFAN, 'PROJEK IPAS BIOLOGI', 'X (MA)', 'MA', 'Kamis', '08:30', '09:30', 2, 'Kelas A', ''],
  [T_MUMINAH, 'MATEMATIKA', 'X (MA)', 'MA', 'Kamis', '10:00', '11:00', 2, 'Kelas A', ''],

  [T_MUMINAH, 'DASAR-DASAR DKV', 'XI DKV (SMK)', 'SMK', 'Kamis', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_MASYITAH, 'ADMINISTRASI UMUM', 'XI AKL (SMK)', 'SMK', 'Kamis', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_TOFAN, 'AKUNTANSI PASAR', 'XI AKL (SMK)', 'SMK', 'Kamis', '08:30', '09:30', 2, 'Kelas B', ''],
  [T_SAIF, 'SKETSA DAN ILUSTRASI', 'XI DKV (SMK)', 'SMK', 'Kamis', '08:30', '09:30', 2, 'Kelas B', ''],
  [T_TOFAN, 'BAHASA INDONESIA', 'XI (SMK)', 'SMK', 'Kamis', '10:00', '11:00', 2, 'Kelas B', ''],

  [T_TOFAN, 'BAHASA INDONESIA', 'XII (MA)', 'MA', 'Kamis', '07:30', '08:30', 2, 'Kelas C', ''],
  [T_AKMAL, 'MATEMATIKA', 'XII (MA)', 'MA', 'Kamis', '08:30', '09:30', 2, 'Kelas C', ''],
  [T_FUAD, 'KIMIA', 'XII (MA)', 'MA', 'Kamis', '10:00', '11:00', 2, 'Kelas C', ''],

  // JUM'AT
  [T_MASYITAH, 'SEJARAH', 'X (MA)', 'MA', 'Jumat', '07:30', '08:30', 2, 'Kelas A', ''],
  [T_MASYITAH, 'BAHASA INGGRIS', 'X (MA)', 'MA', 'Jumat', '08:30', '09:30', 2, 'Kelas A', ''],

  [T_AKMAL, 'MATEMATIKA', 'XI (SMK)', 'SMK', 'Jumat', '07:30', '08:30', 2, 'Kelas B', ''],
  [T_SAIF, 'SEJARAH', 'XI (SMK)', 'SMK', 'Jumat', '08:30', '09:30', 2, 'Kelas B', ''],

  [T_SAIF, 'SEJARAH', 'XII (MA)', 'MA', 'Jumat', '07:30', '08:30', 2, 'Kelas C', ''],
  [T_FUAD, 'KIMIA', 'XII (MA)', 'MA', 'Jumat', '08:30', '09:30', 2, 'Kelas C', '']
];

// Sheet 2: Data Guru dan Beban Mengajar (from image)
const teacherHeaders = [
  'Nama Guru',
  'Kode Guru',
  'NIP Guru',
  'No.',
  'Mata Pelajaran',
  'MA XII (JP)',
  'SMK XI AKL (JP)',
  'SMK XI DKV (JP)',
  'MA/SMK X (JP)',
  'Total Beban JP'
];

const teacherRows = [
  ['Ust. Tofan', 'THM', T_TOFAN, 1, 'Bahasa Indonesia', 2, 4, 4, 4, 18],
  ['Ust. Tofan', 'THM', T_TOFAN, 2, 'Projek IPAS Biologi', 2, 2, 2, 2, ''],
  ['Ust. Tofan', 'THM', T_TOFAN, 3, 'Akuntansi Pasar', '', 2, '', '', ''],
  ['Ust. Akmal', 'AMY', T_AKMAL, 4, 'Matematika', 4, 4, 4, '', 12],
  ['Ust. Akmal', 'AMY', T_AKMAL, 5, 'Spreadsheet', '', 2, '', '', ''],
  ['Ust. Akmal', 'AMY', T_AKMAL, 6, 'Komposisi Tipografi', '', '', 2, '', ''],
  ['Ust. Fuad', 'FAM', T_FUAD, 7, 'Projek IPAS Kimia', 4, '', '', 4, 12],
  ['Ust. Fuad', 'FAM', T_FUAD, 8, 'Etika Profesi', '', 2, '', '', ''],
  ['Ust. Fuad', 'FAM', T_FUAD, 9, 'Biologi', '', '', '', 2, ''],
  ['Ust. Masyitah', 'MNH', T_MASYITAH, 10, 'Sejarah', '', '', '', 2, 14],
  ['Ust. Masyitah', 'MNH', T_MASYITAH, 11, 'Bahasa Inggris', 4, 2, 2, 4, ''],
  ['Ust. Masyitah', 'MNH', T_MASYITAH, 12, 'Administrasi Umum', '', 2, '', '', ''],
  ['Ust. Saif', 'SAM', T_SAIF, 13, 'Ekonomi/Ekonomi Bisnis/Pendidikan Kewirausahaan', 2, 2, 2, 2, 14],
  ['Ust. Saif', 'SAM', T_SAIF, 14, 'Sejarah', 2, 2, 2, '', ''],
  ['Ust. Saif', 'SAM', T_SAIF, 15, 'Dasar-dasar Fotografi', '', '', 2, '', ''],
  ['Ust. Saif', 'SAM', T_SAIF, 16, 'Sketsa dan Ilustrasi', '', '', 2, '', ''],
  ["Ustz. Mu'minah", 'MTH', T_MUMINAH, 17, 'Projek IPAS Fisika', 4, '', '', 4, 14],
  ["Ustz. Mu'minah", 'MTH', T_MUMINAH, 18, 'Matematika', '', '', '', 4, ''],
  ["Ustz. Mu'minah", 'MTH', T_MUMINAH, 19, 'Dasar-dasar DKV', '', '', 2, '', ''],
  ['Ustz. Ayu', 'AYU', T_AYU, 20, 'Perbankan', '', 2, '', '', 2]
];

// 1. Create Excel Workbook
const wb = xlsx.utils.book_new();

// Sheet 1: Template Jadwal
const ws1Data = [headers, ...scheduleRows];
const ws1 = xlsx.utils.aoa_to_sheet(ws1Data);

// Set column widths
ws1['!cols'] = [
  { wch: 15 }, // NIP Guru
  { wch: 25 }, // Mata Pelajaran
  { wch: 15 }, // Kelas
  { wch: 8 },  // Unit
  { wch: 10 }, // Hari
  { wch: 18 }, // Jam Mulai
  { wch: 18 }, // Jam Selesai
  { wch: 10 }, // Jumlah JP
  { wch: 12 }, // Ruangan
  { wch: 25 }  // Honor
];

xlsx.utils.book_append_sheet(wb, ws1, 'Jadwal Pelajaran');

// Sheet 2: Data Guru & Beban Ajar
const ws2Data = [teacherHeaders, ...teacherRows];
const ws2 = xlsx.utils.aoa_to_sheet(ws2Data);
ws2['!cols'] = [
  { wch: 16 },
  { wch: 10 },
  { wch: 15 },
  { wch: 6 },
  { wch: 38 },
  { wch: 12 },
  { wch: 16 },
  { wch: 16 },
  { wch: 14 },
  { wch: 14 }
];
xlsx.utils.book_append_sheet(wb, ws2, 'Data Guru & Beban Ajar');

// Save Excel file
const excelPath = 'Jadwal Pelajaran MA BQA 2026-2027.xlsx';
xlsx.writeFile(wb, excelPath);
console.log(`[OK] Successfully wrote Excel file: ${excelPath}`);

// 2. Write CSV files for easy upload
const csvLines = [
  headers.join(','),
  ...scheduleRows.map(row => 
    row.map(val => {
      const str = String(val === null || val === undefined ? '' : val);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  )
];
const csvContent = '\uFEFF' + csvLines.join('\n');

fs.writeFileSync('jadwal_sma_template.csv', csvContent, 'utf-8');
fs.writeFileSync('JADWAL_SMA_2026_SIAP_UPLOAD.csv', csvContent, 'utf-8');
console.log(`[OK] Successfully wrote CSV: jadwal_sma_template.csv and JADWAL_SMA_2026_SIAP_UPLOAD.csv`);
