const xlsx = require('xlsx');
const wb = xlsx.readFile('Jadwal Pelajaran MA BQA 2026-2027.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
data.forEach((row, idx) => {
  console.log(`${idx}: ${JSON.stringify(row)}`);
});
