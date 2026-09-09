const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regexToReplace = /app\.get\('\/api\/students\/:id\/academics'[\s\S]*?res\.status\(500\)\.json\({ error: 'Failed to fetch students' }\);\s*\}\s*\}\);/g;

const replacement = `app.get('/api/students/:id/academics', async (req, res) => {
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
  });`;

content = content.replace(regexToReplace, replacement);

fs.writeFileSync('server.ts', content, 'utf8');
console.log('Patched successfully');
