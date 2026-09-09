const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regexToReplace = /app\.post\('\/api\/assignments\/:id\/grades'[\s\S]*?if \(!Array\.isArray\(list\)\) return res\.status\(400\)\.json\({ error: 'Invalid data' }\);/g;

const replacement = `app.post('/api/assignments/:id/grades', async (req, res) => {
    try {
      const assignmentId = req.params.id;
      const { grades } = req.body; // Array of { studentId, score, feedback }

      // Clear existing
      await db.delete(schema.studentGrades).where(eq(schema.studentGrades.assignmentId, assignmentId));
      
      if (grades && grades.length > 0) {
        const toInsert = grades.map((g: any) => ({
          id: \`GRD-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`,
          assignmentId,
          studentId: g.studentId,
          score: parseInt(g.score) || 0,
          feedback: g.feedback || null
        }));
        await db.insert(schema.studentGrades).values(toInsert);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save grades' });
    }
  });

  app.get('/api/students/:id/academics', async (req, res) => {
    try {
      const studentId = req.params.id;
      // Get all grades for student
      const grades = await db.query.studentGrades.findMany({
        where: eq(schema.studentGrades.studentId, studentId),
        with: { assignment: true }
      });
      // Get all attendances
      const attendances = await db.query.studentAttendances.findMany({
        where: eq(schema.studentAttendances.studentId, studentId),
        with: { journal: true }
      });
      res.json({ grades, attendances });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch academic record' });
    }
  });

  app.get('/api/students', async (req, res) => {
    try {
      const allStudents = await db.query.students.findMany();
      res.json({ data: allStudents });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  app.post('/api/students/bulk', async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list)) return res.status(400).json({ error: 'Invalid data' });`;

content = content.replace(regexToReplace, replacement);
fs.writeFileSync('server.ts', content, 'utf8');
console.log('Patched successfully');
