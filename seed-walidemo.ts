import { auth } from './src/lib/auth';
import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq } from 'drizzle-orm';

async function seedWaliDemo() {
  try {
    console.log('Registering walidemo@bqa.local...');
    
    // Check if user exists and delete
    const existingUser = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, "walidemo@bqa.local")
    });

    if (existingUser) {
        console.log('User exists, deleting...');
        await db.delete(schema.account).where(eq(schema.account.userId, existingUser.id));
        await db.delete(schema.session).where(eq(schema.session.userId, existingUser.id));
        await db.delete(schema.user).where(eq(schema.user.id, existingUser.id));
    }

    // Better auth sign up requires email, password, name
    const user = await auth.api.signUpEmail({
      body: {
        email: "walidemo@bqa.local",
        password: "password123",
        name: "Wali Demo"
      }
    });

    console.log('User created:', user);
    
    // Check if parent record exists
    let parent = await db.query.parents.findFirst({
        where: (parents, { eq }) => eq(parents.userId, user.user.id)
    });
    
    if (!parent) {
        console.log('Creating parent record...');
        await db.insert(schema.parents).values({
            id: `PRT-DEMO`,
            userId: user.user.id,
            kkNumber: "1234567890",
            phone: "08123456789",
            address: "Jl. Demo No. 1"
        });
        console.log('Parent record created.');
    }

    console.log('Done seeding Wali Demo!');
  } catch (error) {
    console.error('Failed to create Wali Demo:', error);
  }
  process.exit(0);
}

seedWaliDemo();
