const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const teachers = db.prepare("SELECT id, nip, name, username, password FROM teachers").all();
const users1 = db.prepare("SELECT id, name, email, teacher_id FROM user").all();
const users2 = db.prepare("SELECT id, username, nama, role FROM users").all();

console.log('teachers count:', teachers.length);
console.log('user (better-auth) count:', users1.length);
console.log('users (legacy/extra) count:', users2.length);

teachers.forEach(t => {
  const u1 = users1.find(u => u.teacher_id === t.id);
  const u2 = users2.find(u => u.username === t.username);
  console.log(`${t.id} (${t.name}) -> user: ${u1 ? u1.id : 'none'}, users: ${u2 ? u2.id : 'none'}`);
});
