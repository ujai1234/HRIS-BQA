const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const oldSchedules = db.prepare("SELECT id, subject, class_name FROM schedules WHERE unit IN ('MA', 'SMK')").all();
console.log('Old MA/SMK schedules:', oldSchedules);

for (const s of oldSchedules) {
  const att = db.prepare("SELECT count(*) as c FROM attendances WHERE schedule_id = ?").get(s.id);
  console.log(`Schedule ${s.id} (${s.subject}): ${att.c} attendances`);
}
