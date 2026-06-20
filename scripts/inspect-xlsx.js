/**
 * inspect-xlsx.js
 * Reads the IT Assets.xlsx and dumps sheet names + first 5 rows.
 * Run after xlsx is installed: node scripts/inspect-xlsx.js
 */
const path = require('path')
const xlsx = require('xlsx')

const filePath = path.resolve(__dirname, '../IT Assets.xlsx')
const wb = xlsx.readFile(filePath)

console.log('Sheet names:', wb.SheetNames)

wb.SheetNames.forEach((name) => {
  const ws = wb.Sheets[name]
  const data = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' })
  console.log(`\n=== Sheet: ${name} (${data.length} rows) ===`)
  // Print headers (row 0)
  if (data.length > 0) {
    console.log('Headers:', JSON.stringify(data[0]))
  }
  // Print first 3 data rows
  for (let i = 1; i < Math.min(4, data.length); i++) {
    console.log(`Row ${i + 1}:`, JSON.stringify(data[i]))
  }
})
