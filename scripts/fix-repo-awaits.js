/**
 * fix-repo-awaits.js
 *
 * Fixes all places in repo.ts where `db.prepare(...)` is called WITHOUT `await`
 * at the start of the chain (i.e. the variable assignment has no leading `await`).
 *
 * Pattern 1: `const r = db\n      .prepare(` → `const r = await db\n      .prepare(`
 * Pattern 2: `const statusRows = db\n    .prepare(` → `const statusRows = await db\n    .prepare(`
 * etc.
 *
 * Also fixes the `row<T>(db\n            .prepare(` → `row<T>(await db\n            .prepare(` patterns.
 */

const fs = require('fs')
const path = require('path')

const FILE = path.resolve(__dirname, '../src/lib/repo.ts')
let src = fs.readFileSync(FILE, 'utf8')

// Strategy: find "= db\n...spaces....prepare(" blocks and add await
// This regex matches: `= db` followed by optional whitespace/newline, then `.prepare(`
// Lookbehind ensures we don't double-add await.
// Also match `( db` for row(..., db.prepare pattern

let count = 0

// ── Pattern A ─────────────────────────────────────────────────────────────
// `= db\n      .prepare(` becomes `= await db\n      .prepare(`
src = src.replace(/(=\s*)(db\s*\n\s*\.prepare\()/g, (match, eq, rest) => {
  // Already has await just before the `=`?
  // We'll check in post-processing. For now replace and count.
  count++
  return `${eq}await ${rest}`
})

// ── Pattern B ─────────────────────────────────────────────────────────────
// `( db\n            .prepare(` → `( await db\n            .prepare(`
// This covers: row<T>(  db\n            .prepare(
src = src.replace(/(\(\s*)(db\s*\n\s*\.prepare\()/g, (match, paren, rest) => {
  count++
  return `${paren}await ${rest}`
})

// ── Deduplicate double-awaits ─────────────────────────────────────────────
// In case something already had await, remove duplicates
src = src.replace(/\bawait\s+await\b/g, 'await')

console.log(`Fixed ${count} missing await(s) in repo.ts`)
fs.writeFileSync(FILE, src, 'utf8')
console.log('Done.')
