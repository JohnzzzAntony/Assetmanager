/**
 * seed-from-xlsx.js
 *
 * Standalone script (no Next.js) that reads "IT Assets.xlsx" and bulk-inserts
 * every asset row directly into the Neon Postgres database.
 *
 * Usage:
 *   node scripts/seed-from-xlsx.js
 *   node scripts/seed-from-xlsx.js --dry-run    (just prints counts, no writes)
 *   node scripts/seed-from-xlsx.js --sheet Desktop  (import only that sheet)
 *
 * Requires:
 *   bun add xlsx pg   (both should already be installed)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const path = require('path')
const { Pool } = require('pg')
const XLSX = require('xlsx')
const { randomUUID } = require('crypto')

const DRY_RUN = process.argv.includes('--dry-run')
const CLEAR_DB = process.argv.includes('--clear')
const ONLY_SHEET = (() => {
  const idx = process.argv.indexOf('--sheet')
  return idx !== -1 ? process.argv[idx + 1] : null
})()
const FILE_PATH = (() => {
  const idx = process.argv.indexOf('--file')
  return idx !== -1 ? process.argv[idx + 1] : 'IT Assets.xlsx'
})()

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 })

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() { return randomUUID() }
function now() { return new Date().toISOString() }

function toPg(sql) {
  let n = 0
  return sql.replace(/\?/g, () => `$${++n}`)
}

async function query(sql, params = []) {
  const res = await pool.query(toPg(sql), params)
  return res
}

async function findOrCreate(table, nameField, nameVal) {
  // Use quoted identifiers for case-sensitive Postgres/Prisma tables
  const sel = await pool.query(
    `SELECT id FROM "${table}" WHERE LOWER("${nameField}") = LOWER($1)`,
    [nameVal]
  )
  if (sel.rows.length > 0) return sel.rows[0].id
  const id = genId()
  const n = now()
  if (!DRY_RUN) {
    await pool.query(
      `INSERT INTO "${table}" (id, "${nameField}", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [id, nameVal, n, n]
    )
  }
  console.log(`  [NEW] ${table}: ${nameVal}`)
  return id
}

// ─── Column mappings (header → field) ────────────────────────────────────────
const FIELD_MAP = {
  'sr no': null,
  'sl no': null,
  'sr. no': null,
  'purchase date': 'purchaseDate',
  'handover date': 'purchaseDate',
  'delivery date': 'purchaseDate',
  user: 'assignedToId',
  department: 'departmentId',
  dept: 'departmentId',
  'computer name': null,        // discard
  make: 'make',
  brand: 'make',
  model: 'model',
  'model number': 'modelNumber',
  'model no': 'modelNumber',
  'model #': 'modelNumber',
  'part number': 'partNumber',
  'part#': 'partNumber',
  'part #': 'partNumber',
  'part no': 'partNumber',
  's/n': 'serialNumber',
  'service tag(s/n)': 'serialNumber',
  'service tag': 'serialNumber',
  cpu: 'cpu',
  processor: 'cpu',
  gpu: 'gpu',
  ram: 'ram',
  storage: 'storage',
  hdd: 'storage',
  os: 'os',
  android: 'os',
  'os key': 'osKey',
  'office key': 'officeKey',
  'monitor make': 'monitorMake',
  'monitor model': 'monitorModel',
  'monitor s/n': 'monitorSn',
  'monitor part #': null,       // no column
  'monitor size': 'monitorSize',
  'keyboard make': 'keyboardMake',
  'keyboard model': 'keyboardModel',
  'keyboard s/n': 'keyboardSn',
  'mouse make': 'mouseMake',
  'mouse model': 'mouseModel',
  'mouse s/n': 'mouseSn',
  'mouse p/n': null,
  imei1: 'imei1',
  imei2: 'imei2',
  'imei(if 4g)': 'imei1',
  rom: 'rom',
  color: 'color',
  colour: 'color',
  'otp mobile number': 'otpMobileNumber',
  'google/apple account': 'googleAppleAccount',
  'gmail login': 'googleAppleAccount',
  location: 'locationId',
  'location/dept': 'locationId',
  'store name': 'locationId',
  cost: 'cost',
  status: 'status',
  remarks: 'comments',
  comments: 'comments',
  comment: 'comments',
  'fixed assets number': 'assetTag',
  'asset tag': 'assetTag',
  warranty: 'warrantyExpiry',
  'manufacture year': 'manufactureYear',
  'barcode scanner model': 'barcodeScannerModel',
  'barcode scanner s/n': 'barcodeScannerSn',
  'toners model': 'tonersModel',
  'ip address': 'ipAddress',
  qty: 'qty',
  'hdd installed date': 'hddInstalledDate',
  'hdd installed date 01': 'hddInstalledDate',
  'hdd installed date 02': 'hddInstalledDate2',
  'hdd installed date 2': 'hddInstalledDate2',
  'scale machine ip address': 'scaleMachineIpAddress',
  'computer name': 'computerName',
  'monitor part #': 'monitorPartNumber',
  'monitor part number': 'monitorPartNumber',
  'mouse p/n': 'mousePn',
  'mouse pn': 'mousePn',
}

const SHEET_TYPE = {
  Desktop: 'Desktop',
  Laptop: 'Laptop',
  MobileTablet: 'Mobile / Tablet',
  PrinterScanner: 'Printer / Scanner',
  PDT: 'PDT',
  Other: 'Other',
  POS: 'POS Terminal',
  'Bill printer': 'Bill Printer',
  'Weighing Scale': 'Weighing Scale',
  Biometric: 'Biometric Device',
  NVR: 'NVR',
  Firewall: 'Firewall',
  Router: 'Router',
  Switch: 'Network Switch',
}

// ─── Excel date serial helper ─────────────────────────────────────────────────
function excelDateToISO(val) {
  const str = String(val).trim()
  const num = Number(str)
  if (!isNaN(num) && num > 10000) {
    // Excel serial date (days since 1900-01-00, with off-by-2 bug for Lotus compat)
    const ms = Math.round((num - 25569) * 86400 * 1000)
    return new Date(ms).toISOString().slice(0, 10)
  }
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

// ─── Per-sheet importer ───────────────────────────────────────────────────────
async function importSheet(sheetName, wsRows, typeId, typeCache, deptCache, locCache, personCache) {
  // Find header row index (first row with ≥3 text cells)
  let headerIdx = 0
  for (let i = 0; i < Math.min(wsRows.length, 5); i++) {
    const textCount = wsRows[i].filter(c => typeof c === 'string' && isNaN(Number(c)) && c.trim()).length
    if (textCount >= 3) { headerIdx = i; break }
  }
  const headerRow = wsRows[headerIdx].map(h => String(h || '').trim().toLowerCase())
  const dataRows = wsRows.slice(headerIdx + 1)

  let imported = 0, skipped = 0, errors = []

  for (let ri = 0; ri < dataRows.length; ri++) {
    const row = dataRows[ri]
    // Skip blank rows and group-label rows (text in col 0, rest empty)
    const hasData = row.some((c, ci) => ci > 0 && String(c || '').trim())
    const firstCell = String(row[0] || '').trim()
    const firstIsLabel = firstCell && isNaN(Number(firstCell.replace(/[.,]/g, '')))
    if (!hasData || firstIsLabel) { skipped++; continue }

    try {
      const data = {}
      for (let ci = 0; ci < headerRow.length; ci++) {
        const hdr = headerRow[ci]
        if (!(hdr in FIELD_MAP)) continue
        const field = FIELD_MAP[hdr]
        if (!field) continue
        const raw = row[ci]
        if (raw === undefined || raw === null || String(raw).trim() === '') continue
        const val = String(raw).trim()

        if (field === 'assignedToId') {
          let pid = personCache[val.toLowerCase()]
          if (!pid) { pid = await findOrCreate('Person', 'fullName', val); personCache[val.toLowerCase()] = pid }
          data.assignedToId = pid
        } else if (field === 'departmentId') {
          let did = deptCache[val.toLowerCase()]
          if (!did) { did = await findOrCreate('Department', 'name', val); deptCache[val.toLowerCase()] = did }
          data.departmentId = did
        } else if (field === 'locationId') {
          let lid = locCache[val.toLowerCase()]
          if (!lid) { lid = await findOrCreate('Location', 'name', val); locCache[val.toLowerCase()] = lid }
          data.locationId = lid
        } else if (field === 'purchaseDate' || field === 'warrantyExpiry') {
          const iso = excelDateToISO(val)
          if (iso) data[field] = iso
        } else if (field === 'cost') {
          const n = parseFloat(val.replace(/[^0-9.]/g, ''))
          if (!isNaN(n)) data.cost = n
        } else {
          data[field] = val
        }
      }

      // Skip if no identifying info
      if (!data.serialNumber && !data.make && !data.model && !data.assetTag && !data.modelNumber) { skipped++; continue }

      const id = genId()
      const n = now()
      const cols = [
        'id', 'assetTypeId', 'assetTag', 'make', 'model', 'modelNumber', 'serialNumber', 'partNumber',
        'status', 'purchaseDate', 'cost', 'currency', 'warrantyExpiry', 'os', 'osKey', 'officeKey',
        'cpu', 'gpu', 'ram', 'storage', 'color', 'imei1', 'imei2', 'rom', 'otpMobileNumber',
        'googleAppleAccount', 'monitorMake', 'monitorModel', 'monitorSn', 'monitorSize',
        'monitorPartNumber', 'keyboardMake', 'keyboardModel', 'keyboardSn',
        'mouseMake', 'mouseModel', 'mouseSn', 'mousePn',
        'assignedToId', 'departmentId', 'locationId', 'comments',
        'computerName', 'manufactureYear', 'ipAddress', 'tonersModel', 'deviceType', 'qty',
        'barcodeScannerModel', 'barcodeScannerSn', 'scaleMachineIpAddress',
        'hddInstalledDate', 'hddInstalledDate2',
        'createdAt', 'updatedAt',
      ]
      const vals = [
        id, typeId,
        data.assetTag ?? null, data.make ?? null, data.model ?? null, data.modelNumber ?? null,
        data.serialNumber ?? null, data.partNumber ?? null,
        data.status ?? 'In Stock',
        data.purchaseDate ?? null, data.cost != null ? Number(data.cost) : null, 'USD',
        data.warrantyExpiry ?? null, data.os ?? null, data.osKey ?? null, data.officeKey ?? null,
        data.cpu ?? null, data.gpu ?? null, data.ram ?? null, data.storage ?? null,
        data.color ?? null, data.imei1 ?? null, data.imei2 ?? null, data.rom ?? null,
        data.otpMobileNumber ?? null, data.googleAppleAccount ?? null,
        data.monitorMake ?? null, data.monitorModel ?? null, data.monitorSn ?? null, data.monitorSize ?? null,
        data.monitorPartNumber ?? null,
        data.keyboardMake ?? null, data.keyboardModel ?? null, data.keyboardSn ?? null,
        data.mouseMake ?? null, data.mouseModel ?? null, data.mouseSn ?? null, data.mousePn ?? null,
        data.assignedToId ?? null, data.departmentId ?? null, data.locationId ?? null,
        data.comments ?? null,
        data.computerName ?? null, data.manufactureYear ?? null, data.ipAddress ?? null,
        data.tonersModel ?? null, data.deviceType ?? null, data.qty ?? null,
        data.barcodeScannerModel ?? null, data.barcodeScannerSn ?? null, data.scaleMachineIpAddress ?? null,
        data.hddInstalledDate ?? null, data.hddInstalledDate2 ?? null,
        n, n,
      ]
      const ph = vals.map((_, i) => `$${i + 1}`).join(', ')

      if (!DRY_RUN) {
        await pool.query(`INSERT INTO "Asset" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${ph})`, vals)
      }
      imported++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`  Row ${ri + headerIdx + 3}: ${msg}`)
    }
  }
  return { imported, skipped, errors }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const targetFile = FILE_PATH
  console.log(DRY_RUN ? '🔍 DRY RUN — no data will be written' : `🚀 Importing ${targetFile} → Neon Postgres...`)

  if (CLEAR_DB && !DRY_RUN) {
    console.log('🧹 Clearing existing database tables...')
    await pool.query('TRUNCATE TABLE "Asset", "Person", "Location", "Department", "AssetType", "AssignmentHistory", "AssetImage", "ActivityLog", "MaintenanceSchedule", "SoftwareLicense", "AssetLicense", "CheckoutRequest", "DepreciationRule", "Notification", "Vendor", "PurchaseOrder", "PurchaseOrderItem", "AssetDisposal", "AssetTag", "AssetTagLink", "AssetBooking", "SavedReport", "AssetAudit", "AssetAuditItem" CASCADE')
    console.log('✅ Database tables cleared.')
  }

  const filePath = path.resolve(__dirname, '..', targetFile)
  if (!require('fs').existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`)
    process.exit(1)
  }
  const wb = XLSX.readFile(filePath, { cellDates: false, raw: true })

  // Caches shared across sheets
  const typeCache = {}
  const deptCache = {}
  const locCache = {}
  const personCache = {}

  // Pre-load existing reference IDs
  const [existingTypes, existingDepts, existingLocs, existingPersons] = await Promise.all([
    pool.query('SELECT id, name FROM "AssetType"'),
    pool.query('SELECT id, name FROM "Department"'),
    pool.query('SELECT id, name FROM "Location"'),
    pool.query('SELECT id, "fullName" FROM "Person"'),
  ])
  existingTypes.rows.forEach(r => typeCache[r.name.toLowerCase()] = r.id)
  existingDepts.rows.forEach(r => deptCache[r.name.toLowerCase()] = r.id)
  existingLocs.rows.forEach(r => locCache[r.name.toLowerCase()] = r.id)
  existingPersons.rows.forEach(r => personCache[r.fullName.toLowerCase()] = r.id)

  let grandTotal = 0
  let grandSkipped = 0

  for (const sheetName of wb.SheetNames) {
    if (ONLY_SHEET && sheetName !== ONLY_SHEET) continue

    const typeName = SHEET_TYPE[sheetName] || sheetName
    let typeId = typeCache[typeName.toLowerCase()]
    if (!typeId) {
      typeId = await findOrCreate('AssetType', 'name', typeName)
      typeCache[typeName.toLowerCase()] = typeId
    }

    const ws = wb.Sheets[sheetName]
    const wsRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true })

    console.log(`\n📄 ${sheetName} (${wsRows.length} rows) → type: ${typeName}`)
    const { imported, skipped, errors } = await importSheet(
      sheetName, wsRows, typeId, typeCache, deptCache, locCache, personCache
    )
    console.log(`   ✅ Imported: ${imported}  ⏭  Skipped: ${skipped}  ❌ Errors: ${errors.length}`)
    errors.forEach(e => console.log(e))
    grandTotal += imported
    grandSkipped += skipped
  }

  console.log(`\n════════════════════════════════════`)
  console.log(`Total imported: ${grandTotal}`)
  console.log(`Total skipped:  ${grandSkipped}`)
  console.log(DRY_RUN ? '(DRY RUN — nothing was written)' : '✅ Done!')
  await pool.end()
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
