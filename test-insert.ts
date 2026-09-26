import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from './src/lib/auth';

async function test() {
  try {
     const teacherPayload = {
        id: 'T-TEST-' + Date.now(),
        nip: 'PBQ-2026-999',
        name: 'guru',
        position: 'Guru Pesantren',
        unit: 'PESANTREN',
        baseSalary: 800000,
        hourlyRate: 40000,
        dailyTransport: 10000,
        role: 'GURU',
        phone: null,
        avatarColor: 'bg-emerald-700',
        avatarUrl: null,
        isActive: true,
        username: 'guru999@bqa.local',
        password: 'guru1234',
      };
      console.log('Inserting...', teacherPayload);
      const result = await db.insert(schema.teachers).values(teacherPayload).returning();
      console.log('Inserted teacher:', result);
      
      const existingAuthUser = await db.query.user.findFirst({
        where: eq(schema.user.email, 'guru999@bqa.local')
      });
      if (!existingAuthUser) {
          console.log('Registering better auth...');
          await auth.api.signUpEmail({
              body: {
                email: 'guru999@bqa.local',
                password: 'guru1234',
                name: 'guru',
                teacherId: result[0].id
              },
              headers: new Headers({
                'host': 'localhost:3000',
                'origin': 'http://localhost:3000',
                'x-forwarded-host': 'localhost:3000'
              }),
              asResponse: true
          });
      }
      console.log('Success');
  } catch(e) {
      console.error('Error in DB:', e);
  }
}
test();
