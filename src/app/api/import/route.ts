export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetRepo, assetTypeRepo, departmentRepo, locationRepo, personRepo, importAliasRepo } from '@/lib/repo'

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let cur: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        inQuotes = false
      } else {
        field += c
      }
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') {
        cur.push(field)
        field = ''
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        cur.push(field)
        rows.push(cur)
        cur = []
        field = ''
      } else {
        field += c
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field)
    rows.push(cur)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

// ─── XLSX Parser ─────────────────────────────────────────────────────────────
async function parseXLSX(buffer: ArrayBuffer): Promise<{ sheetName: string; rows: string[][] }[]> {
  // Dynamic import to keep the bundle lean
  const XLSX = await import('xlsx')
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true })
  return wb.SheetNames.map((sheetName) => {
    const ws = wb.Sheets[sheetName]
    const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as unknown[][]
    const rows: string[][] = raw.map((r) =>
      (r as unknown[]).map((v) => {
        if (v === null || v === undefined) return ''
        if (v instanceof Date) return v.toISOString().slice(0, 10)
        return String(v).trim()
      })
    )
    return { sheetName, rows }
  })
}

// ─── Column header aliases → internal field names ────────────────────────────
const FIELD_ALIASES: Record<string, string> = {
  // Serial / S/N
  srno: 'serialNumber',
  serial: 'serialNumber',
  'serial number': 'serialNumber',
  's/n': 'serialNumber',
  sn: 'serialNumber',
  'service tag(s/n)': 'serialNumber',
  'service tag': 'serialNumber',
  // Make / brand
  make: 'make',
  brand: 'make',
  // Model
  model: 'model',
  // Model number
  'model number': 'modelNumber',
  'model no': 'modelNumber',
  modelno: 'modelNumber',
  modelnumber: 'modelNumber',
  'model #': 'modelNumber',
  // Part number
  'part number': 'partNumber',
  'part no': 'partNumber',
  'part#': 'partNumber',
  'part #': 'partNumber',
  // Asset type (sheet name is used as fallback)
  type: 'assetTypeId',
  assettype: 'assetTypeId',
  'asset type': 'assetTypeId',
  'device type': 'assetTypeId',
  // Status
  status: 'status',
  remarks: 'comments',
  // OS / Software
  os: 'os',
  android: 'os',
  'os key': 'osKey',
  oskey: 'osKey',
  'office key': 'officeKey',
  officekey: 'officeKey',
  // Hardware specs
  cpu: 'cpu',
  processor: 'cpu',
  ram: 'ram',
  storage: 'storage',
  hdd: 'storage',
  // Mobile
  imei: 'imei1',
  imei1: 'imei1',
  'imei(if 4g)': 'imei1',
  imei2: 'imei2',
  rom: 'rom',
  'otp mobile number': 'otpMobileNumber',
  otpmobilenumber: 'otpMobileNumber',
  'google/apple account': 'googleAppleAccount',
  'google account': 'googleAppleAccount',
  googleaccount: 'googleAppleAccount',
  'gmail login': 'googleAppleAccount',
  color: 'color',
  colour: 'color',
  // Peripherals: Monitor
  'monitor make': 'monitorMake',
  monitormake: 'monitorMake',
  'monitor model': 'monitorModel',
  monitormodel: 'monitorModel',
  'monitor s/n': 'monitorSn',
  monitorsn: 'monitorSn',
  'monitor size': 'monitorSize',
  monitorsize: 'monitorSize',
  'monitor part #': 'monitorPartNumber',
  // Peripherals: Keyboard
  'keyboard make': 'keyboardMake',
  keyboardmake: 'keyboardMake',
  'keyboard model': 'keyboardModel',
  keyboardmodel: 'keyboardModel',
  'keyboard s/n': 'keyboardSn',
  keyboardsn: 'keyboardSn',
  // Peripherals: Mouse
  'mouse make': 'mouseMake',
  mousemake: 'mouseMake',
  'mouse model': 'mouseModel',
  mousemodel: 'mouseModel',
  'mouse s/n': 'mouseSn',
  mousesn: 'mouseSn',
  // Assignment / location
  user: 'assignedToId',
  assignedto: 'assignedToId',
  department: 'departmentId',
  dept: 'departmentId',
  location: 'locationId',
  'location/dept': 'locationId',
  'store name': 'locationId',
  // Financial
  cost: 'cost',
  purchase: 'purchaseDate',
  'purchase date': 'purchaseDate',
  purchasedate: 'purchaseDate',
  'handover date': 'purchaseDate',
  'delivery date': 'purchaseDate',
  // Asset tag
  assettag: 'assetTag',
  'asset tag': 'assetTag',
  tag: 'assetTag',
  'fixed assets number': 'assetTag',
  // Comments / notes
  comments: 'comments',
  notes: 'comments',
  comment: 'comments',
  // Warranty
  warranty: 'warrantyExpiry',
  'warranty expiry': 'warrantyExpiry',
  warrantyexpiry: 'warrantyExpiry',
  // Computer name
  'computer name': 'computerName',
  computername: 'computerName',
  // Manufacture year
  'manufacture year': 'manufactureYear',
  manufactureyear: 'manufactureYear',
  // Mouse part number
  'mouse p/n': 'mousePn',
  'mouse pn': 'mousePn',
  'mouse part number': 'mousePn',
  mousepn: 'mousePn',
  // Monitor part number
  'monitor part #': 'monitorPartNumber',
  'monitor part number': 'monitorPartNumber',
  'monitor partno': 'monitorPartNumber',
  monitorpartnumber: 'monitorPartNumber',
  // IP Address
  'ip address': 'ipAddress',
  'ip addr': 'ipAddress',
  ipaddress: 'ipAddress',
  ip: 'ipAddress',
  // Toners Model
  'toners model': 'tonersModel',
  tonersmodel: 'tonersModel',
  // Device Type
  'device type': 'deviceType',
  devicetype: 'deviceType',
  // Qty
  qty: 'qty',
  quantity: 'qty',
  // Barcode scanner model
  'barcode scanner model': 'barcodeScannerModel',
  barcodescannermodel: 'barcodeScannerModel',
  // Barcode scanner sn
  'barcode scanner s/n': 'barcodeScannerSn',
  'barcode scanner sn': 'barcodeScannerSn',
  barcodescannersn: 'barcodeScannerSn',
  'barcode scanner serial': 'barcodeScannerSn',
  // Scale machine ip
  'scale machine ip address': 'scaleMachineIpAddress',
  scalemachineipaddress: 'scaleMachineIpAddress',
  'scale ip': 'scaleMachineIpAddress',
  // HDD installed dates
  'hdd installed date': 'hddInstalledDate',
  hddinstalleddate: 'hddInstalledDate',
  'hdd installed date 01': 'hddInstalledDate2',
  'hdd installed date 2': 'hddInstalledDate2',
  hddinstalleddate2: 'hddInstalledDate2',
}

// Map sheet names to asset type names
const SHEET_TYPE_MAP: Record<string, string> = {
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

// ─── Shared import logic ─────────────────────────────────────────────────────
async function importRows(
  headerRow: string[],
  dataRows: string[][],
  defaultTypeName: string,
  types: Awaited<ReturnType<typeof assetTypeRepo.list>>,
  depts: Awaited<ReturnType<typeof departmentRepo.list>>,
  locs: Awaited<ReturnType<typeof locationRepo.list>>,
  persons: Awaited<ReturnType<typeof personRepo.list>>,
  aliasMap: Record<string, string>,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const headers = headerRow.map((h) =>
    String(h)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, ' ')
  )

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]

    // Skip completely blank rows and heading/section rows (text in col 0, rest blank)
    const hasData = row.some((c, ci) => ci > 0 && c.trim())
    // Also skip location label rows (Sr No = text or row is a group label)
    const firstCell = String(row[0] || '').trim()
    if (!hasData || /^[a-z]/i.test(firstCell)) {
      skipped++
      continue
    }

    try {
      const data: Record<string, unknown> = {}
      const colCount = Math.max(headers.length, row.length)

      for (let j = 0; j < colCount; j++) {
        const header = headers[j] || ''
        const field = aliasMap[header] || header
        const val = String(row[j] ?? '').trim()
        if (!val || val === '0' || field.startsWith('_') || field === '') continue

        // ── Reference resolution ──────────────────────────────────────────
        if (field === 'assetTypeId') {
          const t = types.find((x) => x.name.toLowerCase() === val.toLowerCase())
          if (t) data.assetTypeId = t.id
          else {
            const nt = await assetTypeRepo.create({ name: val })
            types.push(nt)
            data.assetTypeId = nt.id
          }
        } else if (field === 'departmentId') {
          let d = depts.find((x) => x.name.toLowerCase() === val.toLowerCase())
          if (!d) {
            d = await departmentRepo.create({ name: val })
            depts.push(d)
          }
          data.departmentId = d.id
        } else if (field === 'locationId') {
          let l = locs.find((x) => x.name.toLowerCase() === val.toLowerCase())
          if (!l) {
            l = await locationRepo.create({ name: val })
            locs.push(l)
          }
          data.locationId = l.id
        } else if (field === 'assignedToId') {
          let p = persons.find((x) => x.fullName.toLowerCase() === val.toLowerCase())
          if (!p) {
            p = await personRepo.create({ fullName: val })
            persons.push(p)
          }
          data.assignedToId = p.id
        } else if (field === 'cost') {
          const n = parseFloat(val.replace(/[^0-9.]/g, ''))
          if (!isNaN(n)) data.cost = n
        } else if (field === 'purchaseDate' || field === 'warrantyExpiry') {
          // Handle Excel serial dates (numbers) and ISO strings
          const num = Number(val)
          if (!isNaN(num) && num > 10000) {
            // Excel date serial → JS Date
            const date = new Date(Math.round((num - 25569) * 86400 * 1000))
            data[field] = date.toISOString().slice(0, 10)
          } else {
            const d = new Date(val)
            if (!isNaN(d.getTime())) data[field] = d.toISOString().slice(0, 10)
          }
        } else {
          data[field] = val
        }
      }

      // ── Ensure asset type is set ──────────────────────────────────────────
      if (!data.assetTypeId) {
        let t = types.find((x) => x.name.toLowerCase() === defaultTypeName.toLowerCase())
        if (!t) {
          t = await assetTypeRepo.create({ name: defaultTypeName })
          types.push(t)
        }
        data.assetTypeId = t.id
      }

      // ── Skip rows with no meaningful identifying data ─────────────────────
      const hasIdentifier = data.serialNumber || data.make || data.model || data.assetTag
      if (!hasIdentifier) {
        skipped++
        continue
      }

      await assetRepo.create(data)
      imported++
    } catch (err) {
      errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { imported, skipped, errors }
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    const isXlsx = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
    const isCSV = fileName.endsWith('.csv')

    if (!isXlsx && !isCSV) {
      return NextResponse.json({ error: 'Only .xlsx, .xls, or .csv files are supported' }, { status: 400 })
    }

    // Pre-load all reference data once
    const types = await assetTypeRepo.list()
    const depts = await departmentRepo.list()
    const locs = await locationRepo.list()
    const persons = await personRepo.list()

    // Load custom aliases and merge with FIELD_ALIASES
    const dbAliases = await importAliasRepo.list()
    const aliasMap = { ...FIELD_ALIASES }
    for (const item of dbAliases) {
      if (item.alias && item.field) {
        aliasMap[item.alias.toLowerCase().trim().replace(/[\s_]+/g, ' ')] = item.field
      }
    }

    let totalImported = 0
    let totalSkipped = 0
    const allErrors: string[] = []
    const summary: Array<{ sheet: string; imported: number; skipped: number }> = []

    if (isXlsx) {
      // ── XLSX: process each sheet ───────────────────────────────────────────
      const buffer = await file.arrayBuffer()
      const sheets = await parseXLSX(buffer)

      for (const { sheetName, rows } of sheets) {
        if (rows.length < 2) continue

        // Find the actual header row (skip empty rows and group label rows)
        let headerRowIdx = 0
        for (let i = 0; i < Math.min(rows.length, 5); i++) {
          const r = rows[i]
          // A header row has text in multiple cells
          const textCells = r.filter((c) => c.trim() && isNaN(Number(c))).length
          if (textCells >= 3) {
            headerRowIdx = i
            break
          }
        }
        const headerRow = rows[headerRowIdx]
        const dataRows = rows.slice(headerRowIdx + 1)

        const defaultType = SHEET_TYPE_MAP[sheetName] || sheetName
        const { imported, skipped, errors } = await importRows(
          headerRow,
          dataRows,
          defaultType,
          types,
          depts,
          locs,
          persons,
          aliasMap,
        )

        totalImported += imported
        totalSkipped += skipped
        allErrors.push(...errors.map((e) => `[${sheetName}] ${e}`))
        summary.push({ sheet: sheetName, imported, skipped })
      }
    } else {
      // ── CSV ────────────────────────────────────────────────────────────────
      const text = await file.text()
      const rows = parseCSV(text)
      if (rows.length < 2) {
        return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
      }
      const { imported, skipped, errors } = await importRows(
        rows[0],
        rows.slice(1),
        'Other',
        types,
        depts,
        locs,
        persons,
        aliasMap,
      )
      totalImported += imported
      totalSkipped += skipped
      allErrors.push(...errors)
      summary.push({ sheet: 'CSV', imported, skipped })
    }

    return NextResponse.json({
      imported: totalImported,
      skipped: totalSkipped,
      errors: allErrors.slice(0, 50), // cap error list
      summary,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[import] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
