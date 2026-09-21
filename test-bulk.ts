import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

const db = drizzle(new Database('sqlite.db'), { schema });

async function run() {
  const activeStudents = await db.query.students.findMany({
    where: eq(schema.students.status, 'AKTIF')
  });

  console.log(`Active students: ${activeStudents.length}`);

  const paymentsToInsert = activeStudents.map((student, index) => ({
    id: `PAY-${Date.now()}-${student.id}-${index}`,
    studentId: student.id,
    billingMonth: '2026-09',
    amount: Number(800000),
    status: 'BELUM_LUNAS',
    recordedBy: 'System'
  }));

  try {
    const result = await db.insert(schema.payments).values(paymentsToInsert).returning();
    console.log(`Inserted ${result.length} payments successfully`);
  } catch (error: any) {
    console.error('Error inserting payments:');
    console.error(error);
  }
}

run();
