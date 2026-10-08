const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const teachers = db.prepare("SELECT id, nip, name, unit, position FROM teachers ORDER BY id").all();
console.log('Teachers count:', teachers.length);
teachers.forEach(t => console.log(`${t.id} | ${t.nip} | ${t.name} | ${t.unit} | ${t.position}`));
