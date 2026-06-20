// ============================================================
// Database layer — PostgreSQL via `pg` Pool (async, server-side only)
//
// Exposes a synchronous-looking `db.prepare(sql).{all,get,run}()` API
// that matches the old node:sqlite interface so repo.ts needs no changes.
//
// HOW IT WORKS:
//   Each method runs the async pg query inside a sync-compatible wrapper
//   that uses `require('child_process').execSync` to run a tiny helper
//   — no, that's wrong. We use the real approach:
//
//   Next.js Route Handlers are async functions. We convert repo calls
//   to async by making db.prepare() return a promise-based statement
//   that gets awaited at the API layer.
//
//   But repo.ts calls are synchronous. So we use a different trick:
//   We keep a pg Pool on the module level and run queries with
//   `await pool.query()` which is called from the async route handlers.
//   The `prepare()` API returns an object whose methods return Promises,
//   but TypeScript sees them as `unknown` so they work when awaited.
//
//   IMPORTANT: All repo functions called from API routes must be awaited.
//   The db.prepare(...).all() etc. return Promises.
// ============================================================

import { Pool } from 'pg'
import { randomUUID } from 'crypto'

const CONN = process.env.DATABASE_URL ?? ''

// Singleton pool — reused across hot-reloads in dev
const globalForPg = globalThis as unknown as { _pgPool: Pool | undefined }

function getPool(): Pool {
  if (!globalForPg._pgPool) {
    globalForPg._pgPool = new Pool({
      connectionString: CONN,
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 60_000,
    })
    globalForPg._pgPool.on('error', (err) => {
      console.error('[pg pool error]', err.message)
    })
  }
  return globalForPg._pgPool
}

const TABLES = new Set([
  'Asset', 'Person', 'Location', 'Department',
  'AssetType', 'AssignmentHistory', 'AssetImage', 'ActivityLog',
  'MaintenanceSchedule', 'SoftwareLicense', 'AssetLicense', 'CheckoutRequest',
  'DepreciationRule', 'Notification', 'Vendor', 'PurchaseOrder',
  'PurchaseOrderItem', 'AssetDisposal', 'AssetTag', 'AssetTagLink',
  'AssetBooking', 'SavedReport', 'AssetAudit', 'AssetAuditItem', 'ImportAlias'
])

function processSqlCode(code: string): string {
  return code.replace(/\b[A-Za-z0-9_]+\b/g, (word) => {
    if (/^\d+$/.test(word)) return word
    
    const isTable = TABLES.has(word)
    const isCamelCase = /[a-z]+[A-Z]+/.test(word)
    const isPascalCase = /^[A-Z][a-z]+[A-Z]/.test(word)
    
    if (isTable || isCamelCase || isPascalCase) {
      return `"${word}"`
    }
    return word
  })
}

function rewriteSql(sql: string): string {
  // Pre-process SQLite COLLATE NOCASE to PostgreSQL compatible syntax
  let processed = sql
    .replace(/ORDER\s+BY\s+([A-Za-z0-9_.]+)\s+COLLATE\s+NOCASE/gi, 'ORDER BY LOWER($1)')
    .replace(/([A-Za-z0-9_.]+)\s*=\s*(\?)\s*COLLATE\s*NOCASE/gi, 'LOWER($1) = LOWER($2)')

  let result = ''
  let i = 0
  const n = processed.length
  
  while (i < n) {
    const char = processed[i]
    
    if (char === "'") {
      result += "'"
      i++
      while (i < n) {
        if (processed[i] === "'") {
          if (processed[i + 1] === "'") {
            result += "''"
            i += 2
          } else {
            result += "'"
            i++
            break
          }
        } else {
          result += processed[i]
          i++
        }
      }
    } else {
      let block = ''
      while (i < n && processed[i] !== "'") {
        block += processed[i]
        i++
      }
      result += processSqlCode(block)
    }
  }
  return result
}

/** Convert `?` placeholders to `$1, $2, …` for PostgreSQL */
function toPg(sql: string): string {
  let n = 0
  return sql.replace(/\?/g, () => `$${++n}`)
}

/** Map snake_case column names to camelCase */
function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

function convertRow(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(r)) {
    out[camel(k)] = v instanceof Date ? (v as Date).toISOString() : v
  }
  return out
}

async function execQuery(sql: string, params: unknown[] = []): Promise<{ rows: Record<string, unknown>[]; rowCount: number }> {
  const pool = getPool()
  const rewritten = rewriteSql(sql)
  const pgSql = toPg(rewritten)
  const res = await pool.query(pgSql, params as unknown[])
  return {
    rows: res.rows.map(convertRow),
    rowCount: res.rowCount ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — mirrors the old node:sqlite DatabaseSync interface
// All methods now return Promises. Callers in API routes must await them.
// ─────────────────────────────────────────────────────────────────────────────

interface AsyncStatement {
  run(...args: unknown[]): Promise<{ changes: number }>
  get(...args: unknown[]): Promise<unknown>
  all(...args: unknown[]): Promise<unknown[]>
}

export const db = {
  prepare(sql: string): AsyncStatement {
    return {
      async run(...args: unknown[]) {
        const r = await execQuery(sql, args.flat())
        return { changes: r.rowCount }
      },
      async get(...args: unknown[]) {
        const r = await execQuery(sql, args.flat())
        return r.rows[0] ?? null
      },
      async all(...args: unknown[]) {
        const r = await execQuery(sql, args.flat())
        return r.rows
      },
    }
  },
  async exec(sql: string) {
    await execQuery(sql)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Init — warm up the connection pool
// ─────────────────────────────────────────────────────────────────────────────

let _initialized = false

export async function initDb() {
  if (_initialized) return
  _initialized = true
  try {
    await execQuery('SELECT 1 AS ping')
    console.log('[db] Connected to Neon Postgres ✓')
  } catch (e) {
    console.error('[db] initDb connectivity check failed:', e)
  }
}

export function generateId(prefix = ''): string {
  return prefix ? `${prefix}_${randomUUID()}` : randomUUID()
}
