import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';

async function syncStaffAccounts() {
  console.log('--- Starting Staff Accounts Sync ---');

  // 1. Ensure Ust Ahadiat Iqomatuddin (PBQ-2026-005) is in teachers table
  const ahadiatTeacher = await db.query.teachers.findFirst({
    where: or(
      eq(schema.teachers.nip, 'PBQ-2026-005'),
      eq(schema.teachers.username, 'iqomatuddin12@gmail.com'),
      eq(schema.teachers.id, 'T-06')
    )
  });

  const ahadiatPayload = {
    id: ahadiatTeacher?.id || 'PBQ-2026-005',
    nip: 'PBQ-2026-005',
    name: 'Ust Ahadiat Iqomatuddin',
    position: 'Wakil Kepesantrenan',
    unit: 'PESANTREN',
    baseSalary: 800000,
    hourlyRate: 40000,
    dailyTransport: 10000,
    role: 'KEPALA_PESANTREN',
    phone: null,
    avatarColor: 'bg-emerald-700',
    avatarUrl: null,
    isActive: true,
    username: 'iqomatuddin12@gmail.com',
    password: 'guru123',
  };

  if (ahadiatTeacher) {
    await db.update(schema.teachers)
      .set(ahadiatPayload)
      .where(eq(schema.teachers.id, ahadiatTeacher.id));
    console.log(`[OK] Updated teacher record: ${ahadiatPayload.name} (${ahadiatPayload.nip})`);
  } else {
    await db.insert(schema.teachers).values(ahadiatPayload);
    console.log(`[OK] Created teacher record: ${ahadiatPayload.name} (${ahadiatPayload.nip})`);
  }

  // 2. Sync Better-Auth user & credential account for all teachers
  const allTeachers = (await db.query.teachers.findMany()) as any[];
  console.log(`Found ${allTeachers.length} teachers to sync...`);

  let count = 0;
  for (const teacher of allTeachers) {
    const rawUsername = teacher.username ? teacher.username.trim() : '';
    const email = rawUsername.includes('@') 
      ? rawUsername.toLowerCase() 
      : `${(rawUsername || teacher.nip || teacher.id).toLowerCase()}@bqa.local`;
    const name = (teacher.name || '').trim();
    const plainPassword = teacher.password ? String(teacher.password).trim() : 'guru123';

    try {
      let existingUser = await db.query.user.findFirst({
        where: or(
          eq(schema.user.teacherId, teacher.id),
          eq(schema.user.email, email)
        )
      });

      const now = new Date();

      if (existingUser) {
        await db.update(schema.user).set({
          teacherId: teacher.id,
          email: email,
          name: name || existingUser.name,
          updatedAt: now
        }).where(eq(schema.user.id, existingUser.id));
      } else {
        const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const insertedUsers = await db.insert(schema.user).values({
          id: newUserId,
          name: name || 'Asatidz',
          email: email,
          emailVerified: true,
          teacherId: teacher.id,
          createdAt: now,
          updatedAt: now,
        }).returning();
        existingUser = insertedUsers[0];
      }

      if (plainPassword.length >= 6) {
        const hashedPassword = await hashPassword(plainPassword);
        const existingAccount = await db.query.account.findFirst({
          where: and(
            eq(schema.account.userId, existingUser.id),
            eq(schema.account.providerId, 'credential')
          )
        });

        if (existingAccount) {
          await db.update(schema.account).set({
            password: hashedPassword,
            issuer: 'local:credential',
            accountId: existingUser.id,
            updatedAt: now
          }).where(eq(schema.account.id, existingAccount.id));
        } else {
          const newAccountId = `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await db.insert(schema.account).values({
            id: newAccountId,
            accountId: existingUser.id,
            providerId: 'credential',
            userId: existingUser.id,
            password: hashedPassword,
            issuer: 'local:credential',
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      count++;
    } catch (err: any) {
      console.error(`[Error] Teacher ${teacher.name}:`, err.message);
    }
  }

  console.log(`[Success] Synced ${count} accounts.`);
  console.log('\nAkun Ust Ahadiat Iqomatuddin siap digunakan:');
  console.log('- Email: iqomatuddin12@gmail.com');
  console.log('- NIP / ID: PBQ-2026-005');
  console.log('- Password: guru123');
  console.log('- Hak Akses: Kepala Pesantren (role: KEPALA_PESANTREN)');
  console.log('- Google Login: otomatis terhubung ke iqomatuddin12@gmail.com');
  process.exit(0);
}

syncStaffAccounts().catch(console.error);
