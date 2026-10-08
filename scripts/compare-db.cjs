const Database = require('better-sqlite3');
const db = new Database('sqlite.db');
const dbBak = new Database('sqlite.db.bak');

console.log('teachers in db:');
const t1 = db.prepare("SELECT nip, name FROM teachers WHERE unit = 'SMP'").all();
console.log(t1);

console.log('schedules in db count:', db.prepare("SELECT count(*) as c FROM schedules").all());
console.log('schedules in dbBak count:', dbBak.prepare("SELECT count(*) as c FROM schedules").all());
