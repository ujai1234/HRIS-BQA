const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const query = `
  SELECT 
    t.name as 'Nama Guru',
    t.nip as 'NIP',
    SUM(s.hours) as 'Total JP Terjadwal',
    GROUP_CONCAT(DISTINCT s.subject) as 'Mata Pelajaran'
  FROM schedules s
  JOIN teachers t ON s.teacher_id = t.id
  WHERE s.id LIKE 'SCH-SMA-%' AND s.subject != 'Apel Pekanan'
  GROUP BY t.id
  ORDER BY SUM(s.hours) DESC
`;

const res = db.prepare(query).all();
console.table(res);
