const sqlite = require('node:sqlite')
const path = require('path')
const fs = require('fs')

const dbPath = path.resolve(__dirname, '../prisma/db/asset.db')
const db = new sqlite.DatabaseSync(dbPath)

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()

let output = 'ALL TABLES IN SQLITE:\n'
for (const row of tables) {
  const table = row.name
  if (table.startsWith('sqlite_') || table.startsWith('_prisma_')) continue
  
  const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`).get(table)
  if (schema) {
    output += `\n============================================================\n`
    output += `Table: ${table}\n`
    output += `============================================================\n`
    output += schema.sql + '\n'
  }
}

fs.writeFileSync(path.resolve(__dirname, './sqlite-schema.txt'), output, 'utf8')
console.log('Wrote SQLite schema to scripts/sqlite-schema.txt')
