import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db';
import * as schema from './src/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { 
  INITIAL_TEACHERS, 
  INITIAL_SCHEDULES, 
  INITIAL_ATTENDANCES, 
  INITIAL_BADAL_ASSIGNMENTS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_LEARNING_NEEDS
} from './src/data/initialData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Health check for Cloud Run and monitoring
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

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
      const { unit } = req.query;
      let whereClause = undefined;
      if (unit && unit !== 'ALL' && unit !== 'undefined') {
        whereClause = eq(schema.teachers.unit, unit as any);
      }
      const teachers = await db.query.teachers.findMany({
        where: whereClause
      });
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

  app.post('/api/teachers/bulk', async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ error: 'Data guru kosong' });
      }
      const result = await db.insert(schema.teachers).values(list).returning();
      res.json(result);
    } catch (error) {
      console.error('Bulk teacher insertion error:', error);
      res.status(500).json({ error: 'Failed to bulk insert teachers' });
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
      const { teacherId, unit } = req.query;
      const conditions = [];

      if (teacherId && teacherId !== 'ALL' && teacherId !== 'undefined' && teacherId !== '') {
        conditions.push(eq(schema.schedules.teacherId, teacherId as string));
      }

      if (unit && unit !== 'ALL' && unit !== 'undefined' && unit !== '') {
        conditions.push(eq(schema.schedules.unit, unit as any));
      }

      let whereClause = undefined;
      if (conditions.length === 1) {
        whereClause = conditions[0];
      } else if (conditions.length > 1) {
        whereClause = and(...conditions);
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

  app.post('/api/schedules/bulk', async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({ error: 'Data jadwal kosong' });
      }
      const result = await db.insert(schema.schedules).values(list).returning();
      res.json(result);
    } catch (error) {
      console.error('Bulk schedule insertion error:', error);
      res.status(500).json({ error: 'Failed to bulk insert schedules' });
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
      const { teacherId, unit } = req.query;
      let attendances = await db.query.attendances.findMany();

      if (teacherId && teacherId !== 'ALL' && teacherId !== 'undefined' && teacherId !== '') {
        attendances = attendances.filter(a => a.teacherId === teacherId || a.actualTeacherId === teacherId);
      }

      if (unit && unit !== 'ALL' && unit !== 'undefined' && unit !== '') {
        // Find all schedule IDs for this unit
        const unitSchedules = await db.query.schedules.findMany({
          where: eq(schema.schedules.unit, unit as any)
        });
        const unitScheduleIds = new Set(unitSchedules.map(s => s.id));
        attendances = attendances.filter(a => unitScheduleIds.has(a.scheduleId as string));
      }

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
      const { scheduleId, date } = req.body;
      if (scheduleId && date) {
        const existing = await db.query.attendances.findFirst({
          where: (attendances, { and, eq }) => and(
            eq(attendances.scheduleId, scheduleId),
            eq(attendances.date, date)
          )
        });
        if (existing) {
          return res.json(existing);
        }
      }
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
      // Check if journal already exists for this attendance
      const existing = await db.query.journals.findFirst({
        where: eq(schema.journals.attendanceId, attendanceId)
      });
      let result;
      if (existing) {
        const updated = await db.update(schema.journals)
          .set(req.body)
          .where(eq(schema.journals.id, existing.id))
          .returning();
        result = updated;
      } else {
        result = await db.insert(schema.journals).values(req.body).returning();
      }
      
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
      const { unit } = req.query;
      let badal = await db.query.badalAssignments.findMany();

      if (unit && unit !== 'ALL' && unit !== 'undefined' && unit !== '') {
        const unitSchedules = await db.query.schedules.findMany({
          where: eq(schema.schedules.unit, unit as any)
        });
        const unitScheduleIds = new Set(unitSchedules.map(s => s.id));
        badal = badal.filter(b => unitScheduleIds.has(b.scheduleId as string));
      }

      res.json(badal);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch badal assignments' });
    }
  });

  app.post('/api/badal', async (req, res) => {
    try {
      const result = await db.insert(schema.badalAssignments).values(req.body).returning();
      const assignment = result[0];

      // Send WhatsApp to Badal Teacher
      try {
        const badalTeacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.id, assignment.badalTeacherId)
        });
        const originalTeacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.id, assignment.originalTeacherId)
        });
        const schedule = await db.query.schedules.findFirst({
          where: eq(schema.schedules.id, assignment.scheduleId)
        });

        if (badalTeacher?.phone && badalTeacher.phone.trim() !== '') {
          const message = `[JADWAL GURU BADAL]\nAssalamu'alaikum Wr. Wb. Ustadz/ah ${badalTeacher.name}.\n\nAnda ditugaskan sebagai GURU BADAL untuk:\n- Guru: ${originalTeacher?.name}\n- Mapel: ${schedule?.subject}\n- Kelas: ${schedule?.className}\n- Waktu: ${schedule?.startTime}\n- Tanggal: ${assignment.date}\n- Alasan: ${assignment.reason}\n\nMohon kehadirannya tepat waktu. Jazakumullah Khairan.\n- HRIS Baitul Qur'an Al-Ikhwan`;
          await sendWhatsApp(badalTeacher.phone, message);
        }
      } catch (waError) {
        console.error('Failed to send badal WA notification:', waError);
      }

      res.json(assignment);
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

  app.delete('/api/badal/:id', async (req, res) => {
    try {
      await db.delete(schema.badalAssignments).where(eq(schema.badalAssignments.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete badal assignment' });
    }
  });

  // Audit Logs
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await db.query.auditLogs.findMany({
        orderBy: (logs, { desc }) => [desc(logs.timestamp)],
      });
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const logData = {
        ...req.body,
        ipAddress: req.body.ipAddress || clientIp,
        timestamp: req.body.timestamp || new Date().toISOString(),
      };
      const result = await db.insert(schema.auditLogs).values(logData).returning();
      res.json(result[0]);
    } catch (error) {
      console.error('Audit log insertion error:', error);
      res.status(500).json({ error: 'Failed to create audit log' });
    }
  });

  // Seed Initial Data if empty or missing usernames
  app.post('/api/seed', async (req, res) => {
    try {
      const existingTeachers = await db.query.teachers.findMany();
      // If empty OR if the first teacher doesn't have a username (old schema)
      if (existingTeachers.length === 0 || !existingTeachers[0].username) {
        // Clear all first to be safe
        await db.delete(schema.learningNeedRequests);
        await db.delete(schema.auditLogs);
        await db.delete(schema.journals);
        await db.delete(schema.attendances);
        await db.delete(schema.badalAssignments);
        await db.delete(schema.schedules);
        await db.delete(schema.teachers);

        await db.insert(schema.teachers).values(INITIAL_TEACHERS);
        await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
        await db.insert(schema.attendances).values(INITIAL_ATTENDANCES.map(a => {
          const { journal, ...rest } = a;
          return rest;
        }));
        // Insert journals from attendances
        for (const a of INITIAL_ATTENDANCES) {
          if (a.journal) {
            const { studentAttendance, ...jRest } = a.journal;
            await db.insert(schema.journals).values({
              ...jRest,
              ...studentAttendance,
              filledAt: new Date(jRest.filledAt)
            });
          }
        }
        await db.insert(schema.badalAssignments).values(INITIAL_BADAL_ASSIGNMENTS.map(ba => ({
          ...ba,
          createdAt: new Date(ba.createdAt)
        })));
        await db.insert(schema.learningNeedRequests).values(INITIAL_LEARNING_NEEDS.map(r => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        })));
        await db.insert(schema.auditLogs).values(INITIAL_AUDIT_LOGS);
        res.json({ success: true, message: 'Database seeded with complete multi-role initial data' });
      } else {
        // Ensure learning needs and audit logs are present
        const existingLn = await db.query.learningNeedRequests.findMany();
        if (existingLn.length === 0) {
          await db.insert(schema.learningNeedRequests).values(INITIAL_LEARNING_NEEDS.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt)
          })));
        }
        const existingLogs = await db.query.auditLogs.findMany();
        if (existingLogs.length === 0) {
          await db.insert(schema.auditLogs).values(INITIAL_AUDIT_LOGS);
        }
        res.json({ success: false, message: 'Database already has current data' });
      }
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  });

  app.post('/api/reset', async (req, res) => {
    try {
      await db.delete(schema.learningNeedRequests);
      await db.delete(schema.auditLogs);
      await db.delete(schema.journals);
      await db.delete(schema.attendances);
      await db.delete(schema.badalAssignments);
      await db.delete(schema.schedules);
      await db.delete(schema.teachers);
      
      await db.insert(schema.teachers).values(INITIAL_TEACHERS);
      await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
      await db.insert(schema.attendances).values(INITIAL_ATTENDANCES.map(a => {
        const { journal, ...rest } = a;
        return rest;
      }));
      for (const a of INITIAL_ATTENDANCES) {
        if (a.journal) {
          const { studentAttendance, ...jRest } = a.journal;
          await db.insert(schema.journals).values({
            ...jRest,
            ...studentAttendance,
            filledAt: new Date(jRest.filledAt)
          });
        }
      }
      await db.insert(schema.badalAssignments).values(INITIAL_BADAL_ASSIGNMENTS.map(ba => ({
        ...ba,
        createdAt: new Date(ba.createdAt)
      })));
      await db.insert(schema.learningNeedRequests).values(INITIAL_LEARNING_NEEDS.map(r => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      })));
      await db.insert(schema.auditLogs).values(INITIAL_AUDIT_LOGS);
      
      res.json({ success: true, message: 'Database reset successfully' });
    } catch (error) {
      console.error('Reset error:', error);
      res.status(500).json({ error: 'Failed to reset data' });
    }
  });

  // WhatsApp Integration
  async function sendWhatsApp(target: string, message: string) {
    const apiKey = process.env.WA_GATEWAY_API_KEY;
    const url = process.env.WA_GATEWAY_URL || 'https://api.fonnte.com/send';

    if (!apiKey) {
      console.warn('WA_GATEWAY_API_KEY is not set. Skipping notification.');
      return { success: false, message: 'API Key missing' };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target,
          message,
          delay: '2',
          countryCode: '62'
        })
      });

      const result = await response.json();
      return { success: true, result };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error };
    }
  }

  app.post('/api/whatsapp/send', async (req, res) => {
    const { target, message } = req.body;
    if (!target || !message) {
      return res.status(400).json({ error: 'Target and message are required' });
    }
    const result = await sendWhatsApp(target, message);
    res.json(result);
  });

  // Automatic Reminder: Attendance (Check for missing clock-ins for today's current session)
  app.post('/api/whatsapp/reminders/attendance', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const daysIndo: Record<number, string> = { 0: 'Ahad', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };
      const currentDayIndo = daysIndo[new Date().getDay()];
      
      // Get all schedules for today
      const todaySchedules = await db.query.schedules.findMany({
        where: eq(schema.schedules.dayOfWeek, currentDayIndo as any)
      });

      const notificationsSent = [];

      for (const schedule of todaySchedules) {
        // Check if attendance already exists for this schedule today
        const existingAttendance = await db.query.attendances.findFirst({
          where: and(
            eq(schema.attendances.scheduleId, schedule.id),
            eq(schema.attendances.date, today)
          )
        });

        // If no attendance OR status is BELUM_HADIR
        if (!existingAttendance || existingAttendance.status === 'BELUM_HADIR') {
          const teacher = await db.query.teachers.findFirst({
            where: eq(schema.teachers.id, schedule.teacherId)
          });

          if (teacher?.phone && teacher.phone.trim() !== '') {
            const message = `[PENGINGAT ABSENSI]\nAssalamu'alaikum Wr. Wb. Ustadz/ah ${teacher.name}.\nMohon segera melakukan Absensi Masuk untuk jadwal ${schedule.subject} di kelas ${schedule.className} (${schedule.startTime}).\n\nJazakumullah Khairan.\n- HRIS Baitul Qur'an Al-Ikhwan`;
            await sendWhatsApp(teacher.phone, message);
            notificationsSent.push({ teacher: teacher.name, type: 'attendance' });
          }
        }
      }

      res.json({ success: true, sent: notificationsSent });
    } catch (error) {
      console.error('Attendance reminder error:', error);
      res.status(500).json({ error: 'Failed to send attendance reminders' });
    }
  });

  // Automatic Reminder: Journal (Check for missing journals for today)
  app.post('/api/whatsapp/reminders/journal', async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all attendances today that are HADIR but NO JOURNAL
      const attendances = await db.query.attendances.findMany({
        where: and(
          eq(schema.attendances.date, today),
          eq(schema.attendances.status, 'HADIR_JURNAL_KOSONG')
        )
      });

      const notificationsSent = [];

      for (const att of attendances) {
        const teacher = await db.query.teachers.findFirst({
          where: eq(schema.teachers.id, att.actualTeacherId || att.teacherId)
        });

        const schedule = await db.query.schedules.findFirst({
          where: eq(schema.schedules.id, att.scheduleId)
        });

        if (teacher?.phone && teacher.phone.trim() !== '') {
          const message = `[PENGINGAT JURNAL]\nAssalamu'alaikum Wr. Wb. Ustadz/ah ${teacher.name}.\nAnda telah melakukan absensi untuk ${schedule?.subject || 'KBM'}, namun Jurnal Mengajar belum diisi.\nMohon segera mengisi jurnal agar honor pengajaran dapat dihitung penuh.\n\nJazakumullah Khairan.\n- HRIS Baitul Qur'an Al-Ikhwan`;
          await sendWhatsApp(teacher.phone, message);
          notificationsSent.push({ teacher: teacher.name, type: 'journal' });
        }
      }

      res.json({ success: true, sent: notificationsSent });
    } catch (error) {
      console.error('Journal reminder error:', error);
      res.status(500).json({ error: 'Failed to send journal reminders' });
    }
  });

  // Learning Need Requests
  app.get('/api/learning-needs', async (req, res) => {
    try {
      const { teacherId } = req.query;
      let whereClause = undefined;
      if (teacherId && teacherId !== 'undefined' && teacherId !== '' && teacherId !== 'ALL') {
        whereClause = eq(schema.learningNeedRequests.teacherId, teacherId as string);
      }
      const requests = await db.query.learningNeedRequests.findMany({
        where: whereClause,
        orderBy: (reqs, { desc }) => [desc(reqs.createdAt)],
      });
      const serialized = requests.map(r => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : (r.createdAt || new Date().toISOString()),
        updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : (r.updatedAt || new Date().toISOString())
      }));
      res.json(serialized);
    } catch (error) {
      console.error('Failed to fetch learning needs:', error);
      res.status(500).json({ error: 'Failed to fetch learning needs' });
    }
  });

  app.post('/api/learning-needs', async (req, res) => {
    try {
      const { id, teacherId, title, description, category, status, adminComment, createdAt, updatedAt } = req.body;
      const newId = id || `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const result = await db.insert(schema.learningNeedRequests).values({
        id: newId,
        teacherId,
        title,
        description,
        category: category || 'Buku',
        status: status || 'PENDING',
        adminComment: adminComment || null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      }).returning();

      const created = result[0];
      const serialized = {
        ...created,
        createdAt: created.createdAt instanceof Date ? created.createdAt.toISOString() : (created.createdAt || new Date().toISOString()),
        updatedAt: created.updatedAt instanceof Date ? created.updatedAt.toISOString() : (created.updatedAt || new Date().toISOString())
      };
      res.json(serialized);
    } catch (error) {
      console.error('Failed to create learning need request:', error);
      res.status(500).json({ error: 'Failed to create learning need request' });
    }
  });

  app.patch('/api/learning-needs/:id', async (req, res) => {
    try {
      const { status, adminComment } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (status !== undefined) updateData.status = status;
      if (adminComment !== undefined) updateData.adminComment = adminComment;

      const result = await db.update(schema.learningNeedRequests)
        .set(updateData)
        .where(eq(schema.learningNeedRequests.id, req.params.id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const updated = result[0];
      const serialized = {
        ...updated,
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : (updated.createdAt || new Date().toISOString()),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : (updated.updatedAt || new Date().toISOString())
      };
      res.json(serialized);
    } catch (error) {
      console.error('Failed to update learning need request:', error);
      res.status(500).json({ error: 'Failed to update learning need request' });
    }
  });

  app.delete('/api/learning-needs/:id', async (req, res) => {
    try {
      await db.delete(schema.learningNeedRequests).where(eq(schema.learningNeedRequests.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to delete learning need request:', error);
      res.status(500).json({ error: 'Failed to delete learning need request' });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Auto-verify and seed database if the new demo accounts are missing on start
  try {
    console.log('Checking database state...');
    const existingTeachers = await db.query.teachers.findMany();
    const hasSmp = existingTeachers.some(t => t.username === 'kepseksmp');
    const hasMa = existingTeachers.some(t => t.username === 'kepsekma');
    const hasPesantren = existingTeachers.some(t => t.username === 'kepsekpesantren');

    if (existingTeachers.length === 0 || !hasSmp || !hasMa || !hasPesantren) {
      console.log('Database missing new Kepsek demo accounts. Re-seeding database...');
      // Clear all first to be safe
      await db.delete(schema.learningNeedRequests);
      await db.delete(schema.auditLogs);
      await db.delete(schema.journals);
      await db.delete(schema.attendances);
      await db.delete(schema.badalAssignments);
      await db.delete(schema.schedules);
      await db.delete(schema.teachers);

      await db.insert(schema.teachers).values(INITIAL_TEACHERS);
      await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
      await db.insert(schema.attendances).values(INITIAL_ATTENDANCES.map(a => {
        const { journal, ...rest } = a;
        return rest;
      }));
      // Insert journals from attendances
      for (const a of INITIAL_ATTENDANCES) {
        if (a.journal) {
          const { studentAttendance, ...jRest } = a.journal;
          await db.insert(schema.journals).values({
            ...jRest,
            ...studentAttendance,
            filledAt: new Date(jRest.filledAt)
          });
        }
      }
      await db.insert(schema.badalAssignments).values(INITIAL_BADAL_ASSIGNMENTS.map(ba => ({
        ...ba,
        createdAt: new Date(ba.createdAt)
      })));
      await db.insert(schema.learningNeedRequests).values(INITIAL_LEARNING_NEEDS.map(r => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt)
      })));
      await db.insert(schema.auditLogs).values(INITIAL_AUDIT_LOGS);
      console.log('Database successfully re-seeded with all required demo accounts!');
    } else {
      console.log('All required demo accounts (kepseksmp, kepsekma, kepsekpesantren) are present and integrated.');
    }
  } catch (error) {
    console.error('Database connection or verification failed on startup:', error);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
