import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, and } from 'drizzle-orm';
import { INITIAL_TEACHERS, INITIAL_SCHEDULES } from './src/data/initialData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Authentication
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await db.query.teachers.findFirst({
        where: (teachers, { and, eq }) => and(
          eq(teachers.username, username),
          eq(teachers.password, password)
        )
      });
      
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: 'Username atau password salah' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Teachers
  app.get('/api/teachers', async (req, res) => {
    try {
      const teachers = await db.query.teachers.findMany();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teachers' });
    }
  });

  app.post('/api/teachers', async (req, res) => {
    try {
      const result = await db.insert(schema.teachers).values(req.body).returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create teacher' });
    }
  });

  app.patch('/api/teachers/:id', async (req, res) => {
    try {
      const result = await db.update(schema.teachers)
        .set(req.body)
        .where(eq(schema.teachers.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update teacher' });
    }
  });

  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      await db.delete(schema.teachers).where(eq(schema.teachers.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete teacher' });
    }
  });

  // Schedules
  app.get('/api/schedules', async (req, res) => {
    try {
      const { teacherId } = req.query;
      let whereClause = undefined;
      if (teacherId) {
        whereClause = eq(schema.schedules.teacherId, teacherId as string);
      }
      const schedules = await db.query.schedules.findMany({
        where: whereClause
      });
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch schedules' });
    }
  });

  app.post('/api/schedules', async (req, res) => {
    try {
      const result = await db.insert(schema.schedules).values(req.body).returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  });

  app.patch('/api/schedules/:id', async (req, res) => {
    try {
      const result = await db.update(schema.schedules)
        .set(req.body)
        .where(eq(schema.schedules.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  });

  app.delete('/api/schedules/:id', async (req, res) => {
    try {
      await db.delete(schema.schedules).where(eq(schema.schedules.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  });

  // Attendances
  app.get('/api/attendances', async (req, res) => {
    try {
      const { teacherId } = req.query;
      let whereClause = undefined;
      if (teacherId) {
        whereClause = eq(schema.attendances.teacherId, teacherId as string);
      }
      const attendances = await db.query.attendances.findMany({
        where: whereClause
      });
      // Also fetch journals for each attendance
      const records = await Promise.all(attendances.map(async (att) => {
        const journal = await db.query.journals.findFirst({
          where: eq(schema.journals.attendanceId, att.id as string)
        });
        return { ...att, journal };
      }));
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch attendances' });
    }
  });

  app.post('/api/attendances', async (req, res) => {
    try {
      const result = await db.insert(schema.attendances).values(req.body).returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create attendance' });
    }
  });

  // Journals
  app.post('/api/journals', async (req, res) => {
    try {
      const { attendanceId, ...journalData } = req.body;
      const result = await db.insert(schema.journals).values(req.body).returning();
      
      // Update attendance status to SELESAI
      await db.update(schema.attendances)
        .set({ status: 'SELESAI' })
        .where(eq(schema.attendances.id, attendanceId));
        
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create journal' });
    }
  });

  // Badal Assignments
  app.get('/api/badal', async (req, res) => {
    try {
      const badal = await db.query.badalAssignments.findMany();
      res.json(badal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch badal assignments' });
    }
  });

  app.post('/api/badal', async (req, res) => {
    try {
      const result = await db.insert(schema.badalAssignments).values(req.body).returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create badal assignment' });
    }
  });

  app.patch('/api/badal/:id', async (req, res) => {
    try {
      const result = await db.update(schema.badalAssignments)
        .set(req.body)
        .where(eq(schema.badalAssignments.id, req.params.id))
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update badal assignment' });
    }
  });

  // Seed Initial Data if empty or missing usernames
  app.post('/api/seed', async (req, res) => {
    try {
      const existingTeachers = await db.query.teachers.findMany();
      // If empty OR if the first teacher doesn't have a username (old schema)
      if (existingTeachers.length === 0 || !existingTeachers[0].username) {
        // Clear all first to be safe
        await db.delete(schema.journals);
        await db.delete(schema.attendances);
        await db.delete(schema.badalAssignments);
        await db.delete(schema.schedules);
        await db.delete(schema.teachers);

        await db.insert(schema.teachers).values(INITIAL_TEACHERS);
        await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
        res.json({ success: true, message: 'Database seeded with 23 teachers' });
      } else {
        res.json({ success: false, message: 'Database already has current data' });
      }
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  });

  app.post('/api/reset', async (req, res) => {
    try {
      await db.delete(schema.journals);
      await db.delete(schema.attendances);
      await db.delete(schema.badalAssignments);
      await db.delete(schema.schedules);
      await db.delete(schema.teachers);
      
      await db.insert(schema.teachers).values(INITIAL_TEACHERS);
      await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
      
      res.json({ success: true, message: 'Database reset successfully' });
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
