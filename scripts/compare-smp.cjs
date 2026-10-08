const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const rows = db.prepare("SELECT s.id, s.teacher_id, t.nip, t.name, s.subject, s.class_name, s.unit FROM schedules s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE s.unit = 'SMP'").all();
console.log('SMP schedules count:', rows.length);
console.log('Teachers teaching SMP:', [...new Set(rows.map(r => `${r.teacher_id} | ${r.nip} | ${r.name}`))]);
