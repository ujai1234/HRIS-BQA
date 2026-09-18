import Database from 'better-sqlite3';

console.log('Menghubungkan ke database sqlite.db...');
const db = new Database('./sqlite.db');

const queries = [
  "ALTER TABLE parents ADD COLUMN ktp_url TEXT;",
  "ALTER TABLE parents ADD COLUMN kk_url TEXT;",
  "ALTER TABLE parents ADD COLUMN scholarship_doc_url TEXT;",
  "ALTER TABLE parents ADD COLUMN scholarship_type TEXT;"
];

let addedCount = 0;

for (const query of queries) {
  try {
    db.exec(query);
    console.log(`Berhasil: ${query}`);
    addedCount++;
  } catch (error: any) {
    if (error.message.includes('duplicate column name')) {
      console.log(`Melewati: Kolom sudah ada (${query})`);
    } else {
      console.error(`Gagal menjalankan ${query}:`, error.message);
    }
  }
}

console.log(`\nSelesai! ${addedCount} kolom baru berhasil ditambahkan.`);
db.close();
