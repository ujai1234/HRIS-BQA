const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

for (const t of tables) {
  if (['user', 'users', 'teachers'].includes(t.name)) {
    console.log(`Schema for ${t.name}:`, db.prepare(`PRAGMA table_info(${t.name})`).all().map(c => c.name));
  }
}

console.log('Search Ayu in teachers:');
console.log(db.prepare("SELECT * FROM teachers WHERE name LIKE '%Ayu%'").all());

console.log('Search Ayu in user:');
try {
  console.log(db.prepare("SELECT * FROM user WHERE name LIKE '%Ayu%' OR email LIKE '%ayu%'").all());
} catch (e) {
  console.log('user error', e.message);
}
