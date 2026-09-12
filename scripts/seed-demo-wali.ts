import { db } from '../src/db';
import * as schema from '../src/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../src/lib/auth';

async function seed() {
  console.log('Seeding Demo Wali...');
  
  try {
    // 1. Check if user already exists
    const existing = await db.query.user.findFirst({ where: eq(schema.user.email, 'walidemo@bqa.local') });
    let userId = existing?.id;

    if (!existing) {
      console.log('Creating Better-Auth user for walidemo...');
      const appUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
      const urlObj = new URL(appUrl);
      const authRes = await auth.api.signUpEmail({
        body: { email: 'walidemo@bqa.local', password: 'password123', name: 'Demo Wali' },
        headers: new Headers({
            'host': urlObj.host,
            'origin': appUrl,
            'x-forwarded-host': urlObj.host
        })
      });
      if (authRes?.user) {
        userId = authRes.user.id;
        console.log('User created:', userId);
      } else {
        throw new Error('Failed to create user');
      }
    } else {
      console.log('User already exists:', userId);
    }

    // 2. Ensure parent record exists
    let parentId = 'P-DEMO-001';
    const parent = await db.query.parents.findFirst({ where: eq(schema.parents.userId, userId!) });
    if (!parent) {
      await db.insert(schema.parents).values({
        id: parentId,
        userId: userId!,
        phone: '081234567890',
        job: 'Pegawai Swasta'
      });
      console.log('Parent record created:', parentId);
    } else {
      parentId = parent.id;
      console.log('Parent record exists:', parentId);
    }

    // 3. Ensure student record exists
    let studentId = 'S-001'; // Default ID for demo student Abdullah Faqih
    const student = await db.query.students.findFirst({ where: eq(schema.students.id, studentId) });
    if (!student) {
      await db.insert(schema.students).values({
        id: studentId,
        nis: '1001',
        name: 'Abdullah Faqih',
        gender: 'L',
        className: 'X IPA 1'
      });
      console.log('Student record created:', studentId);
    } else {
      console.log('Student record exists:', studentId);
    }

    // 4. Ensure relation exists
    const rel = await db.query.studentParents.findFirst({
      where: and(eq(schema.studentParents.studentId, studentId), eq(schema.studentParents.parentId, parentId))
    });
    if (!rel) {
      await db.insert(schema.studentParents).values({
        id: 'REL-DEMO-001',
        studentId: studentId,
        parentId: parentId,
        relation: 'AYAH'
      });
      console.log('Relation created.');
    } else {
      console.log('Relation exists.');
    }

    console.log('Demo Wali seed completed successfully!');
  } catch (err: any) {
    console.error('Seeding failed:', err);
  }
}

seed();
