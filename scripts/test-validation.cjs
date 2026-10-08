const xlsx = require('xlsx');
const fs = require('fs');
const Database = require('better-sqlite3');

const db = new Database('sqlite.db');
const teachers = db.prepare("SELECT * FROM teachers").all();

const TEACHER_CODE_MAP = {
  'THM': 'PBQ-2018-002',
  'AMY': 'PBQ-2020-007',
  'FAM': 'PBQ-2020-008',
  'MNH': 'PBQ-2022-019',
  'SAM': 'PBQ-2021-010',
  'MTH': 'PBQ-2021-014',
  'AYU': 'PBQ-2026-026',
};

function testExcel() {
  console.log('=== Testing Jadwal Pelajaran MA BQA 2026-2027.xlsx ===');
  const wb = xlsx.readFile('Jadwal Pelajaran MA BQA 2026-2027.xlsx');
  console.log('Sheets:', wb.SheetNames);
  
  const sheet = wb.Sheets['Jadwal Pelajaran'];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(`Total rows in Jadwal Pelajaran sheet: ${rows.length}`);

  let valid = 0;
  let invalid = 0;

  for (let i = 1; i < rows.length; i++) {
    const rawCols = rows[i];
    const rawNip = rawCols[0] || '';
    const cleanNip = rawNip.trim().toUpperCase();
    const cleanName = rawNip.trim().toLowerCase();
    const mappedNip = TEACHER_CODE_MAP[cleanNip] || cleanNip;

    const teacher = teachers.find(t => 
      (t.nip && t.nip.trim().toUpperCase() === mappedNip) ||
      (t.nip && t.nip.trim().toUpperCase() === cleanNip) ||
      (t.name && t.name.trim().toLowerCase() === cleanName) ||
      (cleanName.length > 3 && t.name && t.name.trim().toLowerCase().includes(cleanName)) ||
      (t.name && cleanName.length > 3 && cleanName.includes(t.name.trim().toLowerCase()))
    );

    if (teacher) {
      valid++;
    } else {
      invalid++;
      console.log(`Row ${i + 1} INVALID teacher: ${rawNip}`);
    }
  }

  console.log(`Result: ${valid} VALID, ${invalid} INVALID\n`);
}

function testCsv() {
  console.log('=== Testing jadwal_sma_template.csv ===');
  const content = fs.readFileSync('jadwal_sma_template.csv', 'utf-8');
  const lines = content.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
  console.log(`Total lines in CSV: ${lines.length}`);
}

testExcel();
testCsv();
