const Database = require('better-sqlite3');
const xlsx = require('xlsx');

const db = new Database('sqlite.db');

const wb = xlsx.readFile('Jadwal Pelajaran MA BQA 2026-2027.xlsx');
const sheet = wb.Sheets['Jadwal Pelajaran'];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

console.log('=== Inserting SMA Schedules into sqlite.db ===');

// Prepare insert statement
const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO schedules (
    id, teacher_id, subject, class_name, unit, day_of_week,
    start_time, end_time, hours, room, custom_rate
  ) VALUES (
    @id, @teacher_id, @subject, @class_name, @unit, @day_of_week,
    @start_time, @end_time, @hours, @room, @custom_rate
  )
`);

const teachers = db.prepare("SELECT * FROM teachers").all();

let inserted = 0;
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const nip = (row[0] || '').trim();
  const subject = (row[1] || '').trim();
  const className = (row[2] || '').trim();
  const unit = (row[3] || 'MA').trim();
  const day = (row[4] || 'Senin').trim();
  const start = (row[5] || '07:30').trim();
  const end = (row[6] || '08:50').trim();
  const hours = parseInt(row[7] || '2', 10);
  const room = (row[8] || '-').trim();
  const customRate = row[9] ? parseInt(String(row[9]).replace(/[^0-9]/g, ''), 10) : null;

  const teacher = teachers.find(t => t.nip === nip || t.id === nip);
  if (!teacher) {
    console.error(`Teacher not found for row ${i + 1}: ${nip}`);
    continue;
  }

  const schedId = `SCH-SMA-${String(i).padStart(2, '0')}`;

  insertStmt.run({
    id: schedId,
    teacher_id: teacher.id,
    subject,
    class_name: className,
    unit,
    day_of_week: day,
    start_time: start,
    end_time: end,
    hours,
    room,
    custom_rate: customRate
  });
  inserted++;
}

console.log(`[OK] Successfully inserted/updated ${inserted} SMA schedules in sqlite.db!`);

const countTotal = db.prepare("SELECT count(*) as total, unit FROM schedules GROUP BY unit").all();
console.table(countTotal);
