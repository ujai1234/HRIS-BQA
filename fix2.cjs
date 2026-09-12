const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');
let lines = content.split('\n');

const newContent = `  // ====== MIDDLEWARE: PORTAL SANTRI PARENT AUTH ======
  /**
   * requireParentAuth — verifikasi sesi Better-Auth dan temukan parent record.
   * Menambahkan req.authenticatedParent dan req.authenticatedUserId ke request.
   */
  const requireParentAuth = async (req, res, next) => {
    try {
      const headersObj = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) {
          headersObj.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }
      const session = await auth.api.getSession({ headers: headersObj });
      if (!session?.user) {
        res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali ke Portal Santri.' });
        return;
      }
      const parent = await db.query.parents.findFirst({
        where: eq(schema.parents.userId, session.user.id)
      });
      if (!parent) {
        res.status(403).json({ error: 'Akun ini bukan wali santri terdaftar.' });
        return;
      }
      req.authenticatedParent = parent;
      req.authenticatedUserId = session.user.id;
      next();
    } catch (error) {
      console.error('[requireParentAuth] error:', error);
      res.status(401).json({ error: 'Gagal memverifikasi sesi.' });
    }
  };

  /** verifyStudentOwnership — pastikan studentId benar-benar milik wali ini */
  const verifyStudentOwnership = async (parentId, studentId) => {
    const relation = await db.query.studentParents.findFirst({
      where: and(
        eq(schema.studentParents.parentId, parentId),
        eq(schema.studentParents.studentId, studentId)
      )
    });
    return !!relation;
  };

  // ====== PORTAL SANTRI (SIS) APIS ======
  app.get('/api/students', async (req, res) => {
    try {
      const allStudents = await db.query.students.findMany();
      res.json(allStudents);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  app.get('/api/parents', async (req, res) => {
    try {
      const allParents = await db.query.parents.findMany();
      res.json(allParents);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch parents' });
    }
  });

  app.post('/api/parents/auth', async (req, res) => {
    try {
      const { email, password } = req.body;
      const lowerEmail = email.toLowerCase();
      // Simple case-insensitive auth logic
      const authUser = await db.query.user.findFirst({
        where: eq(schema.user.email, lowerEmail)
      });
      
      if (!authUser) return res.status(401).json({ error: 'Email tidak terdaftar' });
      
      // Check demo password - in production use bcrypt/Better Auth properly
      if (password !== 'password123' && password !== 'admin') {
         return res.status(401).json({ error: 'Password salah' });
      }

      // Find parent record
      const parent = await db.query.parents.findFirst({
        where: eq(schema.parents.userId, authUser.id)
      });
      
      if (!parent) return res.status(404).json({ error: 'Data wali tidak ditemukan' });

      // Find linked students
      const relations = await db.query.studentParents.findMany({
        where: eq(schema.studentParents.parentId, parent.id)
      });
      
      let studentId = null;
      let studentName = null;
      if (relations.length > 0) {
        studentId = relations[0].studentId;
        const student = await db.query.students.findFirst({
          where: eq(schema.students.id, studentId)
        });
        if (student) studentName = student.name;
      }

      res.json({
        id: parent.id,
        name: authUser.name,
        role: 'WALI_SANTRI',
        studentId: studentId,
        studentName: studentName
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });`;

lines.splice(1556, 1821 - 1556, newContent);
fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Fixed server.ts');
