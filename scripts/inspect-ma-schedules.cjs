const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const rows = db.prepare("SELECT s.id, s.teacher_id, t.name, t.nip, s.subject, s.class_name, s.unit, s.day_of_week, s.start_time, s.end_time, s.hours FROM schedules s LEFT JOIN teachers t ON s.teacher_id = t.id WHERE s.unit IN ('MA', 'SMK')").all();
console.log('Current MA/SMK schedules in DB:', rows);
