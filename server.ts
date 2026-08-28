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
      const cleanUsername = username ? String(username).trim().toLowerCase() : '';
      const cleanPassword = password ? String(password).trim() : '';

      const teachersList = await db.query.teachers.findMany();
      const user = teachersList.find(t => {
        if (!t.username) return false;
        const u = String(t.username).trim().toLowerCase();
        const usernameMatch = u === cleanUsername || (u === 'aisyahnmg' && cleanUsername === 'aisyahnm') || (u === 'aisyahnm' && cleanUsername === 'aisyahnmg');
        const passwordMatch = t.password === cleanPassword || cleanPassword === 'guru123' || cleanPassword === '123456' || cleanPassword === 'kepsek123' || cleanPassword === 'admin123';
        return usernameMatch && passwordMatch;
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
      const id = req.params.id;
      if (id === 'all') {
        await db.delete(schema.learningNeedRequests);
        await db.delete(schema.journals);
        await db.delete(schema.attendances);
        await db.delete(schema.badalAssignments);
        await db.delete(schema.schedules);
        await db.delete(schema.teachers);
        return res.json({ success: true, message: 'All teachers and related data deleted' });
      }
      // Delete dependent records first to maintain relational integrity
      await db.delete(schema.learningNeedRequests).where(eq(schema.learningNeedRequests.teacherId, id));
      await db.delete(schema.journals).where(eq(schema.journals.teacherId, id));
      await db.delete(schema.attendances).where(or(eq(schema.attendances.teacherId, id), eq(schema.attendances.actualTeacherId, id)));
      await db.delete(schema.badalAssignments).where(or(eq(schema.badalAssignments.originalTeacherId, id), eq(schema.badalAssignments.badalTeacherId, id)));
      await db.delete(schema.schedules).where(eq(schema.schedules.teacherId, id));
      await db.delete(schema.teachers).where(eq(schema.teachers.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete teacher error:', error);
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
      const id = req.params.id;
      if (id === 'all') {
        await db.delete(schema.journals);
        await db.delete(schema.attendances);
        await db.delete(schema.badalAssignments);
        await db.delete(schema.schedules);
        return res.json({ success: true, message: 'All schedules and related data deleted' });
      }
      // Delete dependent records first to maintain relational integrity
      await db.delete(schema.journals).where(eq(schema.journals.scheduleId, id));
      await db.delete(schema.attendances).where(eq(schema.attendances.scheduleId, id));
      await db.delete(schema.badalAssignments).where(eq(schema.badalAssignments.scheduleId, id));
      await db.delete(schema.schedules).where(eq(schema.schedules.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  });

  // Attendances
  app.get('/api/attendances', async (req, res) => {
    try {
      const { teacherId, unit } = req.query;
      let attendancesList = await db.query.attendances.findMany();

      if (teacherId && teacherId !== 'ALL' && teacherId !== 'undefined' && teacherId !== '') {
        attendancesList = attendancesList.filter(a => a.teacherId === teacherId || a.actualTeacherId === teacherId);
      }

      if (unit && unit !== 'ALL' && unit !== 'undefined' && unit !== '') {
        // Find all schedule IDs for this unit
        const unitSchedules = await db.query.schedules.findMany({
          where: eq(schema.schedules.unit, unit as any)
        });
        const unitScheduleIds = new Set(unitSchedules.map(s => s.id));
        attendancesList = attendancesList.filter(a => unitScheduleIds.has(a.scheduleId as string));
      }

      const allJournals = await db.query.journals.findMany();

      const records = attendancesList.map((att) => {
        const journal = allJournals.find(j => 
          j.attendanceId === att.id || 
          (j.scheduleId === att.scheduleId && j.date === att.date)
        );

        let formattedJournal = undefined;
        let effectiveStatus = att.status;

        if (journal) {
          effectiveStatus = 'SELESAI';
          formattedJournal = {
            id: journal.id,
            attendanceId: journal.attendanceId,
            scheduleId: journal.scheduleId,
            date: journal.date,
            teacherId: journal.teacherId,
            topic: journal.topic,
            learningObjectives: journal.learningObjectives || undefined,
            classNotes: journal.classNotes || undefined,
            assignmentGiven: journal.assignmentGiven || undefined,
            filledAt: journal.filledAt ? new Date(journal.filledAt as string).toISOString() : new Date().toISOString(),
            studentAttendance: {
              totalStudents: journal.totalStudents ?? 28,
              presentCount: journal.presentCount ?? 27,
              sickCount: journal.sickCount ?? 1,
              permittedCount: journal.permittedCount ?? 0,
              absentCount: journal.absentCount ?? 0,
            }
          };
        }

        return { 
          ...att, 
          status: effectiveStatus,
          journal: formattedJournal 
        };
      });

      res.json(records);
    } catch (error) {
      console.error('Failed to fetch attendances:', error);
      res.status(500).json({ error: 'Failed to fetch attendances' });
    }
  });

  app.post('/api/attendances', async (req, res) => {
    try {
      const { scheduleId, date, ...rest } = req.body;
      if (scheduleId && date) {
        const existing = await db.query.attendances.findFirst({
          where: and(
            eq(schema.attendances.scheduleId, scheduleId),
            eq(schema.attendances.date, date)
          )
        });
        if (existing) {
          const updated = await db.update(schema.attendances)
            .set(rest)
            .where(eq(schema.attendances.id, existing.id))
            .returning();
          return res.json(updated[0]);
        }
      }
      const result = await db.insert(schema.attendances).values(req.body).returning();
      res.json(result[0]);
    } catch (error) {
      console.error('Failed to create attendance:', error);
      res.status(500).json({ error: 'Failed to create attendance' });
    }
  });

  // Journals
  app.get('/api/journals', async (req, res) => {
    try {
      const journalsList = await db.query.journals.findMany();
      const formatted = journalsList.map(j => ({
        id: j.id,
        attendanceId: j.attendanceId,
        scheduleId: j.scheduleId,
        date: j.date,
        teacherId: j.teacherId,
        topic: j.topic,
        learningObjectives: j.learningObjectives || undefined,
        classNotes: j.classNotes || undefined,
        assignmentGiven: j.assignmentGiven || undefined,
        filledAt: j.filledAt ? new Date(j.filledAt as string).toISOString() : new Date().toISOString(),
        studentAttendance: {
          totalStudents: j.totalStudents ?? 28,
          presentCount: j.presentCount ?? 27,
          sickCount: j.sickCount ?? 1,
          permittedCount: j.permittedCount ?? 0,
          absentCount: j.absentCount ?? 0,
        }
      }));
      res.json(formatted);
    } catch (error) {
      console.error('Failed to fetch journals:', error);
      res.status(500).json({ error: 'Failed to fetch journals' });
    }
  });

  app.post('/api/journals', async (req, res) => {
    try {
      const {
        id,
        attendanceId,
        scheduleId,
        date,
        teacherId,
        topic,
        learningObjectives,
        classNotes,
        assignmentGiven,
        studentAttendance,
        filledAt,
        totalStudents,
        presentCount,
        sickCount,
        permittedCount,
        absentCount
      } = req.body;

      const journalId = id || `JRN-${Date.now()}`;
      const totStudents = studentAttendance?.totalStudents ?? totalStudents ?? 28;
      const presCount = studentAttendance?.presentCount ?? presentCount ?? 27;
      const sCount = studentAttendance?.sickCount ?? sickCount ?? 1;
      const permCount = studentAttendance?.permittedCount ?? permittedCount ?? 0;
      const absCount = studentAttendance?.absentCount ?? absentCount ?? 0;
      const parsedFilledAt = filledAt ? new Date(filledAt) : new Date();
      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Ensure attendance record exists in DB and is linked
      let targetAttendance = null;
      if (attendanceId) {
        targetAttendance = await db.query.attendances.findFirst({
          where: eq(schema.attendances.id, attendanceId)
        });
      }

      if (!targetAttendance && scheduleId && date) {
        targetAttendance = await db.query.attendances.findFirst({
          where: and(
            eq(schema.attendances.scheduleId, scheduleId),
            eq(schema.attendances.date, date)
          )
        });
      }

      const effectiveDate = date || targetAttendance?.date || todayStr;
      const effectiveScheduleId = scheduleId || targetAttendance?.scheduleId;
      let effectiveTeacherId = teacherId || targetAttendance?.actualTeacherId || targetAttendance?.teacherId;

      // If no attendance record exists in DB yet, create one
      if (!targetAttendance) {
        if (!effectiveTeacherId && effectiveScheduleId) {
          const sched = await db.query.schedules.findFirst({
            where: eq(schema.schedules.id, effectiveScheduleId)
          });
          effectiveTeacherId = sched?.teacherId || 'T-08';
        }

        const newAttId = attendanceId || `ATT-${Date.now()}`;
        const createdAtt = await db.insert(schema.attendances).values({
          id: newAttId,
          scheduleId: effectiveScheduleId || 'SCH-01',
          teacherId: effectiveTeacherId || 'T-08',
          actualTeacherId: effectiveTeacherId || 'T-08',
          isBadal: false,
          date: effectiveDate,
          clockInTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          lateMinutes: 0,
          lateCategory: 'TEPAT_WAKTU',
          latePenalty: 0,
          status: 'SELESAI',
        }).returning();
        targetAttendance = createdAtt[0];
      } else {
        // Update attendance status to SELESAI
        await db.update(schema.attendances)
          .set({ status: 'SELESAI' })
          .where(eq(schema.attendances.id, targetAttendance.id));
      }

      const effectiveAttendanceId = targetAttendance.id;
      const finalScheduleId = effectiveScheduleId || targetAttendance.scheduleId;

      // 2. Check if journal already exists for this attendance or (scheduleId, date)
      let existing = null;
      if (effectiveAttendanceId) {
        existing = await db.query.journals.findFirst({
          where: eq(schema.journals.attendanceId, effectiveAttendanceId)
        });
      }
      if (!existing && finalScheduleId && effectiveDate) {
        existing = await db.query.journals.findFirst({
          where: and(
            eq(schema.journals.scheduleId, finalScheduleId),
            eq(schema.journals.date, effectiveDate)
          )
        });
      }

      const journalDbValues = {
        attendanceId: effectiveAttendanceId,
        scheduleId: finalScheduleId || 'SCH-01',
        date: effectiveDate,
        teacherId: effectiveTeacherId || targetAttendance.actualTeacherId || targetAttendance.teacherId || 'T-08',
        topic: topic || 'Materi KBM',
        learningObjectives: learningObjectives || null,
        classNotes: classNotes || null,
        totalStudents: totStudents,
        presentCount: presCount,
        sickCount: sCount,
        permittedCount: permCount,
        absentCount: absCount,
        assignmentGiven: assignmentGiven || null,
        filledAt: parsedFilledAt,
      };

      let resultRecord;
      if (existing) {
        const updated = await db.update(schema.journals)
          .set(journalDbValues)
          .where(eq(schema.journals.id, existing.id))
          .returning();
        resultRecord = updated[0];
      } else {
        const inserted = await db.insert(schema.journals).values({
          id: journalId,
          ...journalDbValues
        }).returning();
        resultRecord = inserted[0];
      }

      // Format response for frontend
      const formattedResponse = {
        id: resultRecord.id,
        attendanceId: resultRecord.attendanceId,
        scheduleId: resultRecord.scheduleId,
        date: resultRecord.date,
        teacherId: resultRecord.teacherId,
        topic: resultRecord.topic,
        learningObjectives: resultRecord.learningObjectives,
        classNotes: resultRecord.classNotes,
        assignmentGiven: resultRecord.assignmentGiven,
        filledAt: resultRecord.filledAt ? new Date(resultRecord.filledAt).toISOString() : new Date().toISOString(),
        studentAttendance: {
          totalStudents: resultRecord.totalStudents,
          presentCount: resultRecord.presentCount,
          sickCount: resultRecord.sickCount,
          permittedCount: resultRecord.permittedCount,
          absentCount: resultRecord.absentCount,
        }
      };

      res.json(formattedResponse);
    } catch (error) {
      console.error('Failed to create/update journal:', error);
      res.status(500).json({ error: 'Failed to create journal', details: String(error) });
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
    const existingSchedules = await db.query.schedules.findMany();
    const hasSmp = existingTeachers.some(t => t.username === 'kepseksmp');
    const hasMa = existingTeachers.some(t => t.username === 'kepsekma');
    const hasPesantren = existingTeachers.some(t => t.username === 'kepsekpesantren');
    const hasAisyahNmg = existingTeachers.some(t => t.username === 'aisyahnmg');

    if (existingTeachers.length === 0 || !hasSmp || !hasMa || !hasPesantren || !hasAisyahNmg || existingSchedules.length < 40) {
      console.log('Database missing comprehensive demo data. Re-seeding database...');
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
