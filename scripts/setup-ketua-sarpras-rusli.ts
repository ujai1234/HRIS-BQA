import Database from 'better-sqlite3';
import { hashPassword } from 'better-auth/crypto';

async function setupUstRusli() {
  const db = new Database('sqlite.db');
  db.pragma('foreign_keys = OFF'); // Temporarily off for smooth updates

  console.log('=== Setting up Ust Rusli RZ as Ketua Sarpras ===');

  // 1. Move Ustz. Ayu to T-27 / PBQ-2026-027
  const existingAyu = db.prepare("SELECT * FROM teachers WHERE id = 'T-26' OR nip = 'PBQ-2026-026'").get() as any;
  if (existingAyu && existingAyu.name.toLowerCase().includes('ayu')) {
    console.log('Found existing Ustz. Ayu at T-26. Migrating to T-27...');
    db.prepare(`
      INSERT OR REPLACE INTO teachers (
        id, nip, name, position, unit, base_salary, hourly_rate, 
        daily_transport, role, phone, avatar_color, avatar_url, 
        is_active, username, password, monthly_transport, monthly_meal_allowance
      ) VALUES (
        'T-27', 'PBQ-2026-027', 'Ustz. Ayu', 'Guru SMK (Perbankan)', 'SMK', 700000, 40000,
        10000, 'GURU', NULL, 'bg-teal-700', NULL,
        1, 'ustz.ayu', 'guru123', 250000, 375000
      )
    `).run();

    // Update schedules for Ayu to T-27
    db.prepare("UPDATE schedules SET teacher_id = 'T-27' WHERE teacher_id = 'T-26'").run();

    // Update or insert user for Ayu
    const ayuUser = db.prepare("SELECT * FROM user WHERE teacher_id = 'T-26'").get() as any;
    if (ayuUser) {
      db.prepare("UPDATE user SET teacher_id = 'T-27' WHERE id = ?").run(ayuUser.id);
    }
    console.log('[OK] Ustz. Ayu migrated to T-27 / PBQ-2026-027');
  }

  // 2. Remove placeholder T-SARPRAS-01
  const sarprasPlaceholder = db.prepare("SELECT * FROM user WHERE teacher_id = 'T-SARPRAS-01'").get() as any;
  if (sarprasPlaceholder) {
    db.prepare("DELETE FROM account WHERE user_id = ?").run(sarprasPlaceholder.id);
    db.prepare("DELETE FROM user WHERE id = ?").run(sarprasPlaceholder.id);
  }
  db.prepare("DELETE FROM teachers WHERE id = 'T-SARPRAS-01'").run();
  console.log('[OK] Cleaned placeholder T-SARPRAS-01');

  // 3. Insert or Update Ust Rusli RZ as T-26 / PBQ-2026-026
  db.prepare(`
    INSERT OR REPLACE INTO teachers (
      id, nip, name, position, unit, base_salary, hourly_rate, 
      daily_transport, role, phone, avatar_color, avatar_url, 
      is_active, username, password, monthly_transport, monthly_meal_allowance
    ) VALUES (
      'T-26', 'PBQ-2026-026', 'Ust Rusli RZ', 'Ketua Sarpras', 'UMUM', 2500000, 40000,
      10000, 'KETUA_SARPRAS', '081234567890', 'bg-emerald-700', NULL,
      1, 'daeng.rusli79@gmail.com', 'sarpras123', 250000, 375000
    )
  `).run();
  console.log('[OK] Ust Rusli RZ inserted/updated in teachers (T-26, PBQ-2026-026)');

  // 4. Create or Update Better-Auth user for Ust Rusli RZ
  const rusliEmail = 'daeng.rusli79@gmail.com';
  let userRusli = db.prepare("SELECT * FROM user WHERE email = ? OR teacher_id = 'T-26'").get(rusliEmail) as any;
  const now = Math.floor(Date.now() / 1000);

  if (userRusli) {
    db.prepare(`
      UPDATE user 
      SET email = ?, name = 'Ust Rusli RZ', teacher_id = 'T-26', email_verified = 1, updated_at = ?
      WHERE id = ?
    `).run(rusliEmail, now, userRusli.id);
    console.log('[OK] Updated existing Better-Auth user:', userRusli.id);
  } else {
    const newUserId = `usr_${Date.now()}_rusli`;
    db.prepare(`
      INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at, teacher_id)
      VALUES (?, 'Ust Rusli RZ', ?, 1, NULL, ?, ?, 'T-26')
    `).run(newUserId, rusliEmail, now, now);
    userRusli = { id: newUserId };
    console.log('[OK] Created new Better-Auth user for Ust Rusli RZ:', newUserId);
  }

  // 5. Hash password 'sarpras123' and save to account table
  const hashedPassword = await hashPassword('sarpras123');
  const existingAcc = db.prepare("SELECT * FROM account WHERE user_id = ? AND provider_id = 'credential'").get(userRusli.id) as any;

  if (existingAcc) {
    db.prepare(`
      UPDATE account 
      SET password = ?, updated_at = ?, account_id = ?
      WHERE id = ?
    `).run(hashedPassword, now, userRusli.id, existingAcc.id);
    console.log('[OK] Updated Better-Auth credential password for Ust Rusli RZ');
  } else {
    const accId = `acc_${Date.now()}_rusli`;
    db.prepare(`
      INSERT INTO account (
        id, account_id, provider_id, user_id, password, created_at, updated_at, issuer
      ) VALUES (
        ?, ?, 'credential', ?, ?, ?, ?, 'local:credential'
      )
    `).run(accId, userRusli.id, userRusli.id, hashedPassword, now, now);
    console.log('[OK] Created Better-Auth credential account for Ust Rusli RZ');
  }

  db.pragma('foreign_keys = ON');
  console.log('\n=== Verifikasi Akun Ketua Sarpras ===');
  const finalTeacher = db.prepare("SELECT id, nip, name, position, role, username FROM teachers WHERE nip = 'PBQ-2026-026'").get();
  console.log('Teacher:', finalTeacher);
  const finalUser = db.prepare("SELECT id, name, email, teacher_id FROM user WHERE email = ?").get(rusliEmail);
  console.log('User:', finalUser);
  const finalAccount = db.prepare("SELECT id, provider_id, user_id FROM account WHERE user_id = ?").get(userRusli.id);
  console.log('Account:', finalAccount);
}

setupUstRusli().catch(console.error);
