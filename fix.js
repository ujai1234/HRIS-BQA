const fs = require('fs');
const filepath = 'server.ts';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');
// Remove lines 2867 to 2937 (index 2866 to 2937)
lines.splice(2866, 71);
fs.writeFileSync(filepath, lines.join('\n'));
console.log('Removed duplicated lines.');
