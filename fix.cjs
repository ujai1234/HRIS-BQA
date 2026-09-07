const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const correctBlock = `
        await db.delete(schema.curriculums);
        await db.delete(schema.schedules);
        
        // Better Auth tables
        await db.delete(schema.verification);
        await db.delete(schema.account);
        await db.delete(schema.session);
        await db.delete(schema.user);
        
        await db.delete(schema.teachers);

        await db.insert(schema.teachers).values(INITIAL_TEACHERS);
        
        // Create Better Auth users for all teachers
        for (const teacher of INITIAL_TEACHERS) {
          if (teacher.username) {
             const mockPassword = teacher.password && teacher.password.length >= 8 ? teacher.password : (teacher.password + '12345').substring(0, 8);
             try {
                await auth.api.signUpEmail({
                   body: {
                       email: \`\${teacher.username}@bqa.local\`,
                       password: mockPassword,
                       name: teacher.name,
                       teacherId: teacher.id
                   },
                   headers: new Headers()
                });
             } catch (err) {
                console.error(\`Failed to create better-auth user for \${teacher.username}\`, err);
             }
          }
        }

        await db.insert(schema.schedules).values(INITIAL_SCHEDULES);
        await db.insert(schema.students).values(INITIAL_STUDENTS);
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
`;

const targetRegex = /await db\.delete\(schema\.assignments\);([\s\S]*?)updatedAt: new Date\(r\.updatedAt\)\r?\n\s*\}\)\)\);/;
if (targetRegex.test(content)) {
  content = content.replace(targetRegex, 'await db.delete(schema.assignments);' + correctBlock);
  fs.writeFileSync('server.ts', content, 'utf8');
  console.log('Fixed successfully');
} else {
  console.log('Regex did not match');
}
