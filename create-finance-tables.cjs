const Database = require('better-sqlite3');
const db = new Database('./src/db/sqlite.db');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS finance_categories (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      name text NOT NULL,
      type text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      category_id integer,
      amount integer NOT NULL,
      date text NOT NULL,
      description text,
      reference_type text,
      reference_id text,
      created_at integer NOT NULL,
      FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON UPDATE no action ON DELETE no action
    );
  `);
  console.log("Finance tables created successfully!");
} catch (err) {
  console.error("Error creating tables:", err);
}
db.close();
