// Data Access Layer - thin helpers around node:sqlite
import { db, initDb, generateId } from './db'
import type {
  Asset,
  AssetType,
  Department,
  Location,
  Person,
  AssignmentHistory,
  AssetImage,
  DashboardStats,
  MaintenanceSchedule,
  ActivityLog,
  SoftwareLicense,
  AssetLicense,
  CheckoutRequest,
  DepreciationRule,
  DepreciationCalc,
  AppNotification,
  Vendor,
  PurchaseOrder,
  PurchaseOrderItem,
  AssetDisposal,
  AssetTag,
  AssetBooking,
  SavedReport,
  SavedReportConfig,
  VendorPerformance,
  LifecycleYoYPoint,
  ExpirationItem,
  ExpirationReport,
  ExpirationUrgency,
  UtilizationByBucket,
  UtilizationReport,
  IdleAsset,
  MaintenanceCostReport,
  AssetTimeline,
  TimelineEvent,
  POReceiveItemPayload,
  POReceiveResult,
  AssetLocationMapReport,
  LocationAssetSummary,
  CostForecastReport,
  CostForecastCategory,
  CostForecastPoint,
  ExpiryRenewPayload,
  ExpiryRenewResult,
  AssetAudit,
  AssetAuditItem,
  AssetAuditCreatePayload,
  AssetAuditScanPayload,
  AssetAuditScanResult,
  AuditScope,
  AuditStatus,
  AuditItemStatus,
  ExpiryBulkRenewPayload,
  ExpiryBulkRenewResult,
  ImportAlias,
} from './types'

// Ensure DB is initialized before any query
async function ensure() {
  await initDb()
}

function row<T = Record<string, unknown>>(r: unknown): T | null {
  if (!r) return null
  return r as T
}

function rows<T = Record<string, unknown>>(r: unknown[]): T[] {
  return (r || []) as T[]
}

function toBool(v: unknown) {
  return v != null && v !== 0 && v !== 'false' && v !== ''
}

// --- Local cache for reference data to avoid N+1 query overhead ---
let cache_assetTypes: any = null
let cache_assetTypes_time = 0
let cache_departments: any = null
let cache_departments_time = 0
let cache_locations: any = null
let cache_locations_time = 0
let cache_persons: any = null
let cache_persons_time = 0
let cache_dashboardStats: any = null
let cache_dashboardStats_time = 0

export function clearRepoCache() {
  cache_assetTypes = null
  cache_departments = null
  cache_locations = null
  cache_persons = null
  cache_dashboardStats = null
}

// ============ Asset Types ============
export const assetTypeRepo = {
  async list(): AssetType[] {
    await ensure()
    const nowTime = Date.now()
    if (cache_assetTypes && (nowTime - cache_assetTypes_time < 5000)) {
      return cache_assetTypes
    }
    const r = await db.prepare(`
      SELECT at.*, (SELECT COUNT(*) FROM Asset a WHERE a.assetTypeId = at.id) as _count_assets
      FROM AssetType at ORDER BY at.name
    `).all()
    const result = rows<AssetType & { _count_assets: number }>(r).map((t) => ({
      ...t,
      _count: { assets: t._count_assets },
    }))
    cache_assetTypes = result
    cache_assetTypes_time = nowTime
    return result
  },
  async get(id: string): AssetType | null {
    await ensure()
    return row<AssetType>(await db.prepare('SELECT * FROM AssetType WHERE id = ?').get(id))
  },
  async create(data: Partial<AssetType>): AssetType {
    await ensure()
    clearRepoCache()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      'INSERT INTO AssetType (id, name, description, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, data.name, data.description ?? null, data.icon ?? null, now, now)
    return await this.get(id)!
  },
  async update(id: string, data: Partial<AssetType>): AssetType | null {
    await ensure()
    clearRepoCache()
    const now = new Date().toISOString()
    const cur = await this.get(id)
    if (!cur) return null
    await db.prepare(
      'UPDATE AssetType SET name = ?, description = ?, icon = ?, updatedAt = ? WHERE id = ?'
    ).run(data.name ?? cur.name, data.description ?? cur.description, data.icon ?? cur.icon, now, id)
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    clearRepoCache()
    await db.prepare('DELETE FROM AssetType WHERE id = ?').run(id)
  },
}

// ============ Departments ============
export const departmentRepo = {
  async list(): Department[] {
    await ensure()
    const nowTime = Date.now()
    if (cache_departments && (nowTime - cache_departments_time < 5000)) {
      return cache_departments
    }
    const r = await db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM Asset a WHERE a.departmentId = d.id) as _count_assets,
        (SELECT COUNT(*) FROM Person p WHERE p.departmentId = d.id) as _count_persons
      FROM Department d ORDER BY d.name
    `).all()
    const result = rows<Department & { _count_assets: number; _count_persons: number }>(r).map((d) => ({
      ...d,
      _count: { assets: d._count_assets, persons: d._count_persons },
    }))
    cache_departments = result
    cache_departments_time = nowTime
    return result
  },
  async get(id: string): Department | null {
    await ensure()
    return row<Department>(await db.prepare('SELECT * FROM Department WHERE id = ?').get(id))
  },
  async create(data: Partial<Department>): Department {
    await ensure()
    clearRepoCache()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      'INSERT INTO Department (id, name, code, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.name, data.code ?? null, now, now)
    return await this.get(id)!
  },
  async update(id: string, data: Partial<Department>): Department | null {
    await ensure()
    clearRepoCache()
    const now = new Date().toISOString()
    const cur = await this.get(id)
    if (!cur) return null
    await db.prepare('UPDATE Department SET name = ?, code = ?, updatedAt = ? WHERE id = ?').run(
      data.name ?? cur.name,
      data.code ?? cur.code,
      now,
      id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    clearRepoCache()
    await db.prepare('DELETE FROM Department WHERE id = ?').run(id)
  },
}

// ============ Locations ============
export const locationRepo = {
  async list(): Location[] {
    await ensure()
    const nowTime = Date.now()
    if (cache_locations && (nowTime - cache_locations_time < 5000)) {
      return cache_locations
    }
    const r = await db.prepare(`
      SELECT l.*,
        (SELECT COUNT(*) FROM Asset a WHERE a.locationId = l.id) as _count_assets,
        (SELECT COUNT(*) FROM Person p WHERE p.locationId = l.id) as _count_persons
      FROM Location l ORDER BY l.name
    `).all()
    const result = rows<Location & { _count_assets: number; _count_persons: number }>(r).map((l) => ({
      ...l,
      _count: { assets: l._count_assets, persons: l._count_persons },
    }))
    cache_locations = result
    cache_locations_time = nowTime
    return result
  },
  async get(id: string): Location | null {
    await ensure()
    return row<Location>(await db.prepare('SELECT * FROM Location WHERE id = ?').get(id))
  },
  async create(data: Partial<Location>): Location {
    await ensure()
    clearRepoCache()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      'INSERT INTO Location (id, name, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.name, data.address ?? null, now, now)
    return await this.get(id)!
  },
  async update(id: string, data: Partial<Location>): Location | null {
    await ensure()
    clearRepoCache()
    const now = new Date().toISOString()
    const cur = await this.get(id)
    if (!cur) return null
    await db.prepare('UPDATE Location SET name = ?, address = ?, updatedAt = ? WHERE id = ?').run(
      data.name ?? cur.name,
      data.address ?? cur.address,
      now,
      id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    clearRepoCache()
    await db.prepare('DELETE FROM Location WHERE id = ?').run(id)
  },
}

// ============ Persons ============
export const personRepo = {
  async list(): Person[] {
    await ensure()
    const nowTime = Date.now()
    if (cache_persons && (nowTime - cache_persons_time < 5000)) {
      return cache_persons
    }
    const r = await db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM Asset a WHERE a.assignedToId = p.id) as _count_assets
      FROM Person p ORDER BY p.fullName
    `).all()
    const depts = await departmentRepo.list()
    const locs = await locationRepo.list()
    const result = rows<Person & { _count_assets: number }>(r).map((p) => ({
      ...p,
      department: depts.find((d) => d.id === p.departmentId) || null,
      location: locs.find((l) => l.id === p.locationId) || null,
      _count: { assets: p._count_assets },
    }))
    cache_persons = result
    cache_persons_time = nowTime
    return result
  },
  async get(id: string): Person | null {
    await ensure()
    const p = row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(id))
    if (!p) return null
    return p
  },
  async create(data: Partial<Person>): Person {
    await ensure()
    clearRepoCache()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO Person (id, fullName, email, phone, role, departmentId, locationId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.fullName,
      data.email ?? null,
      data.phone ?? null,
      data.role ?? null,
      data.departmentId ?? null,
      data.locationId ?? null,
      now,
      now
    )
    return await this.get(id)!
  },
  async update(id: string, data: Partial<Person>): Person | null {
    await ensure()
    clearRepoCache()
    const now = new Date().toISOString()
    const cur = await this.get(id)
    if (!cur) return null
    await db.prepare(
      `UPDATE Person SET fullName = ?, email = ?, phone = ?, role = ?, departmentId = ?, locationId = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.fullName ?? cur.fullName,
      data.email ?? cur.email,
      data.phone ?? cur.phone,
      data.role ?? cur.role,
      data.departmentId ?? cur.departmentId,
      data.locationId ?? cur.locationId,
      now,
      id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    clearRepoCache()
    await db.prepare('DELETE FROM Person WHERE id = ?').run(id)
  },
}

// ============ Assets ============
export interface AssetQueryOpts {
  search?: string
  assetTypeId?: string
  status?: string
  departmentId?: string
  locationId?: string
  assignedToId?: string
  os?: string
  tagIds?: string[]
  tagMatch?: 'any' | 'all'
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

const SORT_COLUMNS: Record<string, string> = {
  assetTag: 'a.assetTag',
  make: 'a.make',
  model: 'a.model',
  serialNumber: 'a.serialNumber',
  status: 'a.status',
  createdAt: 'a.createdAt',
  updatedAt: 'a.updatedAt',
  purchaseDate: 'a.purchaseDate',
  cost: 'a.cost',
  type: 't.name',
  department: 'd.name',
  location: 'l.name',
  person: 'p.fullName',
}

async function attachAssetRelations<T extends Asset>(asset: T): Promise<T> {
  if (!asset) return asset
  const types = await assetTypeRepo.list()
  const depts = await departmentRepo.list()
  const locs = await locationRepo.list()
  const persons = await personRepo.list()
  asset.assetType = types.find((t) => t.id === asset.assetTypeId) || undefined
  asset.department = depts.find((d) => d.id === asset.departmentId) || null
  asset.location = locs.find((l) => l.id === asset.locationId) || null
  asset.assignedTo = persons.find((p) => p.id === asset.assignedToId) || null
  asset.tags = await assetTagRepo.listForAsset(asset.id)
  return asset
}

export const assetRepo = {
  async list(opts: AssetQueryOpts = {}): { data: Asset[]; total: number; page: number; pageSize: number } {
    await ensure()
    const page = opts.page || 1
    const pageSize = Math.min(opts.pageSize || 20, 100)
    const offset = (page - 1) * pageSize
    const sortCol = SORT_COLUMNS[opts.sortBy || 'createdAt'] || 'a.createdAt'
    const sortDir = opts.sortDir === 'asc' ? 'ASC' : 'DESC'

    const where: string[] = []
    const params: unknown[] = []
    if (opts.search) {
      where.push(
        `(a.assetTag LIKE ? OR a.make LIKE ? OR a.model LIKE ? OR a.modelNumber LIKE ? OR a.serialNumber LIKE ? OR a.imei1 LIKE ? OR a.imei2 LIKE ? OR p.fullName LIKE ?)`
      )
      const s = `%${opts.search}%`
      params.push(s, s, s, s, s, s, s, s)
    }
    if (opts.assetTypeId) {
      where.push('a.assetTypeId = ?')
      params.push(opts.assetTypeId)
    }
    if (opts.status) {
      where.push('a.status = ?')
      params.push(opts.status)
    }
    if (opts.departmentId) {
      where.push('a.departmentId = ?')
      params.push(opts.departmentId)
    }
    if (opts.locationId) {
      where.push('a.locationId = ?')
      params.push(opts.locationId)
    }
    if (opts.assignedToId) {
      where.push('a.assignedToId = ?')
      params.push(opts.assignedToId)
    }
    if (opts.os) {
      where.push('a.os LIKE ?')
      params.push(`%${opts.os}%`)
    }
    // Tag filtering (any = OR, all = AND)
    if (opts.tagIds && opts.tagIds.length > 0) {
      const match = opts.tagMatch === 'all' ? 'all' : 'any'
      if (match === 'all') {
        // Asset must have ALL selected tags
        const placeholders = opts.tagIds.map(() => '?').join(',')
        where.push(
          `a.id IN (SELECT assetId FROM AssetTagLink WHERE tagId IN (${placeholders}) GROUP BY assetId HAVING COUNT(DISTINCT tagId) = ${opts.tagIds.length})`
        )
        params.push(...opts.tagIds)
      } else {
        // Asset must have ANY of the selected tags
        const placeholders = opts.tagIds.map(() => '?').join(',')
        where.push(`a.id IN (SELECT assetId FROM AssetTagLink WHERE tagId IN (${placeholders}))`)
        params.push(...opts.tagIds)
      }
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const countRow = await db
      .prepare(
        `SELECT COUNT(*) as c FROM Asset a
         LEFT JOIN Person p ON a.assignedToId = p.id
         ${whereSql}`
      )
      .get(...params) as { c: number }
    const total = countRow?.c || 0

    const r = await db
      .prepare(
        `SELECT a.*, t.name as typeName, d.name as deptName, l.name as locName, p.fullName as personName
         FROM Asset a
         LEFT JOIN AssetType t ON a.assetTypeId = t.id
         LEFT JOIN Department d ON a.departmentId = d.id
         LEFT JOIN Location l ON a.locationId = l.id
         LEFT JOIN Person p ON a.assignedToId = p.id
         ${whereSql}
         ORDER BY ${sortCol} ${sortDir}
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset)

    const assets = await Promise.all(
      rows<Asset & { typeName?: string; deptName?: string; locName?: string; personName?: string }>(
        r
      ).map((a) => {
        const { typeName, deptName, locName, personName, ...rest } = a
        return attachAssetRelations({
          ...rest,
          assetType: typeName ? ({ id: rest.assetTypeId, name: typeName } as AssetType) : undefined,
          department: deptName ? ({ id: rest.departmentId!, name: deptName } as Department) : null,
          location: locName ? ({ id: rest.locationId!, name: locName } as Location) : null,
          assignedTo: personName ? ({ id: rest.assignedToId!, fullName: personName } as Person) : null,
        } as Asset)
      })
    )

    return { data: assets, total, page, pageSize }
  },

  async get(id: string): Asset | null {
    await ensure()
    const a = row<Asset>(await db.prepare('SELECT * FROM Asset WHERE id = ?').get(id))
    if (!a) return null
    await attachAssetRelations(a)
    a.images = await imageRepo.listForAsset(id)
    a.history = await historyRepo.listForAsset(id)
    a.tags = await assetTagRepo.listForAsset(id)
    a._count = { images: a.images.length, history: a.history.length }
    return a
  },

  async create(data: Record<string, unknown>): Asset {
    await ensure()
    clearRepoCache()
    const id = generateId()
    const now = new Date().toISOString()
    const cols = [
      'id', 'assetTag', 'assetTypeId', 'make', 'model', 'modelNumber', 'serialNumber', 'partNumber',
      'status', 'purchaseDate', 'cost', 'currency', 'warrantyExpiry', 'os', 'osKey', 'officeKey',
      'cpu', 'gpu', 'ram', 'storage', 'color', 'imei1', 'imei2', 'rom', 'otpMobileNumber', 'googleAppleAccount',
      'monitorMake', 'monitorModel', 'monitorSn', 'monitorSize',
      'keyboardMake', 'keyboardModel', 'keyboardSn',
      'mouseMake', 'mouseModel', 'mouseSn',
      'computerName', 'manufactureYear', 'mousePn', 'monitorPartNumber', 'ipAddress', 'tonersModel',
      'deviceType', 'qty', 'barcodeScannerModel', 'barcodeScannerSn', 'scaleMachineIpAddress',
      'hddInstalledDate', 'hddInstalledDate2',
      'assignedToId', 'departmentId', 'locationId', 'comments', 'createdAt', 'updatedAt',
    ]
    const vals = [
      id,
      data.assetTag ?? null,
      data.assetTypeId,
      data.make ?? null,
      data.model ?? null,
      data.modelNumber ?? null,
      data.serialNumber ?? null,
      data.partNumber ?? null,
      data.status ?? 'In Stock',
      data.purchaseDate ?? null,
      data.cost != null ? Number(data.cost) : null,
      data.currency ?? 'USD',
      data.warrantyExpiry ?? null,
      data.os ?? null,
      data.osKey ?? null,
      data.officeKey ?? null,
      data.cpu ?? null,
      data.gpu ?? null,
      data.ram ?? null,
      data.storage ?? null,
      data.color ?? null,
      data.imei1 ?? null,
      data.imei2 ?? null,
      data.rom ?? null,
      data.otpMobileNumber ?? null,
      data.googleAppleAccount ?? null,
      data.monitorMake ?? null,
      data.monitorModel ?? null,
      data.monitorSn ?? null,
      data.monitorSize ?? null,
      data.keyboardMake ?? null,
      data.keyboardModel ?? null,
      data.keyboardSn ?? null,
      data.mouseMake ?? null,
      data.mouseModel ?? null,
      data.mouseSn ?? null,
      data.computerName ?? null,
      data.manufactureYear ?? null,
      data.mousePn ?? null,
      data.monitorPartNumber ?? null,
      data.ipAddress ?? null,
      data.tonersModel ?? null,
      data.deviceType ?? null,
      data.qty ?? null,
      data.barcodeScannerModel ?? null,
      data.barcodeScannerSn ?? null,
      data.scaleMachineIpAddress ?? null,
      data.hddInstalledDate ?? null,
      data.hddInstalledDate2 ?? null,
      data.assignedToId ?? null,
      data.departmentId ?? null,
      data.locationId ?? null,
      data.comments ?? null,
      now,
      now,
    ]
    const placeholders = cols.map(() => '?').join(', ')
    await db.prepare(`INSERT INTO Asset (${cols.join(', ')}) VALUES (${placeholders})`).run(...vals)

    // If assigned, create history
    if (data.assignedToId || data.departmentId || data.locationId) {
      const histId = generateId()
      await db.prepare(
        `INSERT INTO AssignmentHistory (id, assetId, personId, departmentId, locationId, assignedOn, reason, action, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        histId,
        id,
        data.assignedToId ?? null,
        data.departmentId ?? null,
        data.locationId ?? null,
        now,
        'Initial assignment',
        'Assigned',
        now
      )
    }
    await logAssetActivity('asset.created', id, `Created asset ${data.assetTag || data.serialNumber || id.slice(0, 8)}`)
    return await this.get(id)!
  },

  async update(id: string, data: Record<string, unknown>): Asset | null {
    await ensure()
    clearRepoCache()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    const updatable: Record<string, string> = {
      assetTag: 'assetTag',
      assetTypeId: 'assetTypeId',
      make: 'make',
      model: 'model',
      modelNumber: 'modelNumber',
      serialNumber: 'serialNumber',
      partNumber: 'partNumber',
      status: 'status',
      purchaseDate: 'purchaseDate',
      cost: 'cost',
      currency: 'currency',
      warrantyExpiry: 'warrantyExpiry',
      os: 'os',
      osKey: 'osKey',
      officeKey: 'officeKey',
      cpu: 'cpu',
      gpu: 'gpu',
      ram: 'ram',
      storage: 'storage',
      color: 'color',
      imei1: 'imei1',
      imei2: 'imei2',
      rom: 'rom',
      otpMobileNumber: 'otpMobileNumber',
      googleAppleAccount: 'googleAppleAccount',
      monitorMake: 'monitorMake',
      monitorModel: 'monitorModel',
      monitorSn: 'monitorSn',
      monitorSize: 'monitorSize',
      keyboardMake: 'keyboardMake',
      keyboardModel: 'keyboardModel',
      keyboardSn: 'keyboardSn',
      mouseMake: 'mouseMake',
      mouseModel: 'mouseModel',
      mouseSn: 'mouseSn',
      computerName: 'computerName',
      manufactureYear: 'manufactureYear',
      mousePn: 'mousePn',
      monitorPartNumber: 'monitorPartNumber',
      ipAddress: 'ipAddress',
      tonersModel: 'tonersModel',
      deviceType: 'deviceType',
      qty: 'qty',
      barcodeScannerModel: 'barcodeScannerModel',
      barcodeScannerSn: 'barcodeScannerSn',
      scaleMachineIpAddress: 'scaleMachineIpAddress',
      hddInstalledDate: 'hddInstalledDate',
      hddInstalledDate2: 'hddInstalledDate2',
      assignedToId: 'assignedToId',
      departmentId: 'departmentId',
      locationId: 'locationId',
      comments: 'comments',
    }
    const sets: string[] = []
    const vals: unknown[] = []
    for (const [k, col] of Object.entries(updatable)) {
      if (k in data) {
        sets.push(`${col} = ?`)
        vals.push(data[k] ?? null)
      }
    }
    if (sets.length === 0) return cur
    sets.push('updatedAt = ?')
    vals.push(now, id)
    await db.prepare(`UPDATE Asset SET ${sets.join(', ')} WHERE id = ?`).run(...vals)
    return await this.get(id)
  },

  async delete(id: string): void {
    await ensure()
    clearRepoCache()
    await db.prepare('DELETE FROM Asset WHERE id = ?').run(id)
  },

  // ===== Bulk operations =====
  async bulkSetStatus(ids: string[], status: string): number {
    await ensure()
    clearRepoCache()
    if (!ids.length) return 0
    const now = new Date().toISOString()
    const placeholders = ids.map(() => '?').join(',')
    const info = await db.prepare(`UPDATE Asset SET status = ?, updatedAt = ? WHERE id IN (${placeholders})`).run(status, now, ...ids)
    for (const id of ids) {
      await logAssetActivity('asset.updated', id, `Bulk: status changed to ${status}`)
    }
    return info.changes
  },

  async bulkDelete(ids: string[]): number {
    await ensure()
    clearRepoCache()
    if (!ids.length) return 0
    const placeholders = ids.map(() => '?').join(',')
    for (const id of ids) {
      await logAssetActivity('asset.deleted', id, `Bulk: deleted asset`)
    }
    const info = await db.prepare(`DELETE FROM Asset WHERE id IN (${placeholders})`).run(...ids)
    return info.changes
  },

  async bulkAssignTag(ids: string[], tagId: string): number {
    await ensure()
    if (!ids.length) return 0
    const now = new Date().toISOString()
    const tag = await assetTagRepo.get(tagId)
    if (!tag) return 0
    const ins = await db.prepare('INSERT OR IGNORE INTO AssetTagLink (id, assetId, tagId, createdAt) VALUES (?, ?, ?, ?)')
    let added = 0
    for (const id of ids) {
      const before = (await db.prepare('SELECT COUNT(*) as c FROM AssetTagLink WHERE assetId = ? AND tagId = ?').get(id, tagId) as { c: number }).c
      ins.run(generateId(), id, tagId, now)
      const after = (await db.prepare('SELECT COUNT(*) as c FROM AssetTagLink WHERE assetId = ? AND tagId = ?').get(id, tagId) as { c: number }).c
      if (after > before) added++
      await logAssetActivity('tag.attached', id, `Bulk: tagged with ${tag.name}`)
    }
    return added
  },

  async bulkRemoveTag(ids: string[], tagId: string): number {
    await ensure()
    if (!ids.length) return 0
    const tag = await assetTagRepo.get(tagId)
    if (!tag) return 0
    const placeholders = ids.map(() => '?').join(',')
    const info = await db.prepare(`DELETE FROM AssetTagLink WHERE tagId = ? AND assetId IN (${placeholders})`).run(tagId, ...ids)
    for (const id of ids) {
      await logAssetActivity('tag.detached', id, `Bulk: removed tag ${tag.name}`)
    }
    return info.changes
  },

  // ===== Asset lifecycle cost analysis =====
  async lifecycleCostByType(): {
    assetType: string
    assetCount: number
    purchaseCost: number
    maintenanceCost: number
    disposalCost: number
    residualValue: number
    netCost: number
  }[] {
    await ensure()
    // Aggregate purchase cost + maintenance cost by asset type
    const rows = await db.prepare(`
      SELECT
        t.name as assetType,
        COUNT(DISTINCT a.id) as assetCount,
        COALESCE(SUM(a.cost), 0) as purchaseCost,
        COALESCE((SELECT SUM(m.cost) FROM MaintenanceSchedule m WHERE m.assetId = a.id AND m.cost IS NOT NULL), 0) as maintenanceCost,
        COALESCE((SELECT SUM(d.disposalCost) FROM AssetDisposal d WHERE d.assetId = a.id), 0) as disposalCost,
        COALESCE((SELECT SUM(d.residualValue) FROM AssetDisposal d WHERE d.assetId = a.id), 0) as residualValue
      FROM Asset a
      JOIN AssetType t ON a.assetTypeId = t.id
      GROUP BY t.id
      ORDER BY purchaseCost DESC
    `).all() as {
      assetType: string
      assetCount: number
      purchaseCost: number
      maintenanceCost: number
      disposalCost: number
      residualValue: number
    }[]
    return rows.map((r) => ({
      assetType: r.assetType,
      assetCount: r.assetCount,
      purchaseCost: r.purchaseCost || 0,
      maintenanceCost: r.maintenanceCost || 0,
      disposalCost: r.disposalCost || 0,
      residualValue: r.residualValue || 0,
      netCost: (r.purchaseCost || 0) + (r.maintenanceCost || 0) + (r.disposalCost || 0) - (r.residualValue || 0),
    }))
  },

  // ===== Asset cost-over-time trend =====
  async costTrend(monthsBack = 12): { month: string; purchase: number; maintenance: number; disposal: number }[] {
    await ensure()
    const result: Record<string, { purchase: number; maintenance: number; disposal: number }> = {}
    const now = new Date()
    // Initialize last N months
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      result[key] = { purchase: 0, maintenance: 0, disposal: 0 }
    }
    // Asset purchases
    const assetRows = await db.prepare(`SELECT substr(purchaseDate, 1, 7) as month, COALESCE(SUM(cost), 0) as total FROM Asset WHERE purchaseDate IS NOT NULL GROUP BY month`).all() as { month: string; total: number }[]
    for (const r of assetRows) {
      if (result[r.month]) result[r.month].purchase = r.total
    }
    // Maintenance costs (by scheduledFor date)
    const maintRows = await db.prepare(`SELECT substr(scheduledFor, 1, 7) as month, COALESCE(SUM(cost), 0) as total FROM MaintenanceSchedule WHERE scheduledFor IS NOT NULL AND cost IS NOT NULL GROUP BY month`).all() as { month: string; total: number }[]
    for (const r of maintRows) {
      if (result[r.month]) result[r.month].maintenance = r.total
    }
    // Disposal costs
    const dispRows = await db.prepare(`SELECT substr(disposalDate, 1, 7) as month, COALESCE(SUM(disposalCost), 0) as total FROM AssetDisposal GROUP BY month`).all() as { month: string; total: number }[]
    for (const r of dispRows) {
      if (result[r.month]) result[r.month].disposal = r.total
    }
    return Object.entries(result)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))
  },

  async assign(
    id: string,
    data: { personId?: string; departmentId?: string; locationId?: string; reason?: string; action?: string }
  ): AssignmentHistory | null {
    await ensure()
    const now = new Date().toISOString()
    // Close any open assignment
    await db.prepare(
      `UPDATE AssignmentHistory SET unassignedOn = ? WHERE assetId = ? AND unassignedOn IS NULL`
    ).run(now, id)
    const histId = generateId()
    await db.prepare(
      `INSERT INTO AssignmentHistory (id, assetId, personId, departmentId, locationId, assignedOn, reason, action, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      histId,
      id,
      data.personId ?? null,
      data.departmentId ?? null,
      data.locationId ?? null,
      now,
      data.reason ?? null,
      data.action ?? 'Assigned',
      now
    )
    // Update asset assignment
    await db.prepare(
      `UPDATE Asset SET assignedToId = ?, departmentId = ?, locationId = ?, updatedAt = ? WHERE id = ?`
    ).run(data.personId ?? null, data.departmentId ?? null, data.locationId ?? null, now, id)
    return await historyRepo.get(histId)
  },
}

// ============ Assignment History ============
export const historyRepo = {
  async listForAsset(assetId: string): AssignmentHistory[] {
    await ensure()
    const r = await db
      .prepare(
        `SELECT h.*, p.fullName as personName, d.name as deptName, l.name as locName
         FROM AssignmentHistory h
         LEFT JOIN Person p ON h.personId = p.id
         LEFT JOIN Department d ON h.departmentId = d.id
         LEFT JOIN Location l ON h.locationId = l.id
         WHERE h.assetId = ? ORDER BY h.assignedOn DESC`
      )
      .all(assetId)
    return rows<AssignmentHistory & { personName?: string; deptName?: string; locName?: string }>(r).map(
      (h) => ({
        ...h,
        person: h.personName ? ({ id: h.personId!, fullName: h.personName } as Person) : null,
        department: h.deptName ? ({ id: h.departmentId!, name: h.deptName } as Department) : null,
        location: h.locName ? ({ id: h.locationId!, name: h.locName } as Location) : null,
      })
    )
  },
  async get(id: string): AssignmentHistory | null {
    await ensure()
    return row<AssignmentHistory>(await db.prepare('SELECT * FROM AssignmentHistory WHERE id = ?').get(id))
  },
  async recent(limit = 10): (AssignmentHistory & {
    asset?: { id: string; assetTag?: string | null; make?: string | null; model?: string | null }
  })[] {
    await ensure()
    const r = await db
      .prepare(
        `SELECT h.*, p.fullName as personName, a.id as assetId, a.assetTag, a.make, a.model
         FROM AssignmentHistory h
         LEFT JOIN Person p ON h.personId = p.id
         LEFT JOIN Asset a ON h.assetId = a.id
         ORDER BY h.assignedOn DESC LIMIT ?`
      )
      .all(limit)
    return rows<any>(r).map((h) => ({
      ...h,
      person: h.personName ? ({ id: h.personId, fullName: h.personName } as Person) : null,
      asset: { id: h.assetId, assetTag: h.assetTag, make: h.make, model: h.model },
    }))
  },
}

// ============ Asset Images ============
export const imageRepo = {
  async listForAsset(assetId: string): AssetImage[] {
    await ensure()
    return rows<AssetImage>(
      await db.prepare('SELECT * FROM AssetImage WHERE assetId = ? ORDER BY createdAt DESC').all(assetId)
    )
  },
  async get(id: string): AssetImage | null {
    await ensure()
    return row<AssetImage>(await db.prepare('SELECT * FROM AssetImage WHERE id = ?').get(id))
  },
  async create(data: Partial<AssetImage>): AssetImage {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO AssetImage (id, assetId, fileName, filePath, mimeType, fileSize, processedText, ocrStatus, ocrEngine, parsedFields, createdAt, processedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.assetId ?? null,
      data.fileName,
      data.filePath,
      data.mimeType,
      data.fileSize,
      data.processedText ?? null,
      data.ocrStatus ?? 'Pending',
      data.ocrEngine ?? null,
      data.parsedFields ?? null,
      now,
      data.processedAt ?? null
    )
    return await this.get(id)!
  },
  async update(id: string, data: Partial<AssetImage>): AssetImage | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE AssetImage SET processedText = ?, ocrStatus = ?, ocrEngine = ?, parsedFields = ?, processedAt = ? WHERE id = ?`
    ).run(
      data.processedText ?? cur.processedText,
      data.ocrStatus ?? cur.ocrStatus,
      data.ocrEngine ?? cur.ocrEngine,
      data.parsedFields ?? cur.parsedFields,
      data.processedAt ?? now,
      id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    await db.prepare('DELETE FROM AssetImage WHERE id = ?').run(id)
  },
}

// ============ Dashboard ============
export async function getDashboardStats(): Promise<DashboardStats> {
  await ensure()
  const nowTime = Date.now()
  if (cache_dashboardStats && (nowTime - cache_dashboardStats_time < 5000)) {
    return cache_dashboardStats
  }
  const totalRow = await db.prepare('SELECT COUNT(*) as c FROM Asset').get() as { c: number }
  const totalAssets = totalRow.c

  const statusRows = await db
    .prepare(
      `SELECT status, COUNT(*) as c FROM Asset GROUP BY status`
    )
    .all() as { status: string; c: number }[]
  const statusMap: Record<string, number> = {}
  for (const r of statusRows) statusMap[r.status] = r.c

  const typeRows = await db
    .prepare(
      `SELECT t.name, COUNT(a.id) as count FROM AssetType t LEFT JOIN Asset a ON a.assetTypeId = t.id GROUP BY t.id ORDER BY count DESC`
    )
    .all() as { name: string; count: number }[]
  const deptRows = await db
    .prepare(
      `SELECT d.name, COUNT(a.id) as count FROM Department d LEFT JOIN Asset a ON a.departmentId = d.id GROUP BY d.id ORDER BY count DESC`
    )
    .all() as { name: string; count: number }[]
  const locRows = await db
    .prepare(
      `SELECT l.name, COUNT(a.id) as count FROM Location l LEFT JOIN Asset a ON a.locationId = l.id GROUP BY l.id ORDER BY count DESC`
    )
    .all() as { name: string; count: number }[]

  const valueRow = await db.prepare('SELECT COALESCE(SUM(cost), 0) as v FROM Asset').get() as { v: number }
  const personsRow = await db.prepare('SELECT COUNT(*) as c FROM Person').get() as { c: number }
  const deptsRow = await db.prepare('SELECT COUNT(*) as c FROM Department').get() as { c: number }
  const locsRow = await db.prepare('SELECT COUNT(*) as c FROM Location').get() as { c: number }

  // Warranty expiring in 30 days
  const in30 = new Date()
  in30.setDate(in30.getDate() + 30)
  const in30Str = in30.toISOString()
  const warrantyRow = await db
    .prepare(
      `SELECT COUNT(*) as c FROM Asset WHERE warrantyExpiry IS NOT NULL AND warrantyExpiry <= ? AND warrantyExpiry > ?`
    )
    .get(in30Str, new Date().toISOString()) as { c: number }

  const result = {
    totalAssets,
    inUse: statusMap['In Use'] || 0,
    inStock: statusMap['In Stock'] || 0,
    repair: statusMap['Repair'] || 0,
    retired: statusMap['Retired'] || 0,
    lost: statusMap['Lost'] || 0,
    byType: typeRows.filter((r) => r.count > 0),
    byDepartment: deptRows.filter((r) => r.count > 0),
    byLocation: locRows.filter((r) => r.count > 0),
    byStatus: statusRows.map((r) => ({ status: r.status, count: r.c })),
    recentActivity: await historyRepo.recent(10),
    totalValue: valueRow.v,
    totalPersons: personsRow.c,
    totalDepartments: deptsRow.c,
    totalLocations: locsRow.c,
    warrantyExpiringSoon: warrantyRow.c,
    vendors: await vendorRepo.stats(),
    procurement: await purchaseOrderRepo.stats(),
    disposals: await disposalRepo.stats(),
    bookings: await assetBookingRepo.stats(),
    tags: await assetTagRepo.stats(),
  }
  cache_dashboardStats = result
  cache_dashboardStats_time = nowTime
  return result
}

// ============ Activity Log / Audit Log ============
export const activityLogRepo = {
  async log(action: string, entityType: string, entityId: string, details?: string, meta?: Record<string, unknown>): void {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO ActivityLog (id, action, entityType, entityId, details, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, action, entityType, entityId, details ?? null, now)
  },
  async list(opts: { limit?: number; entityType?: string; entityId?: string; action?: string } = {}): ActivityLog[] {
    await ensure()
    const limit = Math.min(opts.limit || 100, 500)
    const where: string[] = []
    const params: unknown[] = []
    if (opts.entityType) { where.push('entityType = ?'); params.push(opts.entityType) }
    if (opts.entityId) { where.push('entityId = ?'); params.push(opts.entityId) }
    if (opts.action) { where.push('action = ?'); params.push(opts.action) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const r = await db.prepare(
      `SELECT * FROM ActivityLog ${whereSql} ORDER BY createdAt DESC LIMIT ?`
    ).all(...params, limit)
    return rows<ActivityLog>(r)
  },
  async listForEntity(entityType: string, entityId: string): ActivityLog[] {
    return await this.list({ entityType, entityId, limit: 50 })
  },
  async recent(limit = 20): ActivityLog[] {
    return await this.list({ limit })
  },
  async count(): number {
    await ensure()
    const r = await db.prepare('SELECT COUNT(*) as c FROM ActivityLog').get() as { c: number }
    return r.c
  },
}

// ============ Maintenance Schedule ============
export interface MaintenanceQuery {
  assetId?: string
  status?: string
  type?: string
  from?: string
  to?: string
  limit?: number
}

export const maintenanceRepo = {
  async list(opts: MaintenanceQuery = {}): MaintenanceSchedule[] {
    await ensure()
    const limit = Math.min(opts.limit || 100, 500)
    const where: string[] = []
    const params: unknown[] = []
    if (opts.assetId) { where.push('m.assetId = ?'); params.push(opts.assetId) }
    if (opts.status) { where.push('m.status = ?'); params.push(opts.status) }
    if (opts.type) { where.push('m.type = ?'); params.push(opts.type) }
    if (opts.from) { where.push('m.scheduledFor >= ?'); params.push(opts.from) }
    if (opts.to) { where.push('m.scheduledFor <= ?'); params.push(opts.to) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const r = await db.prepare(
      `SELECT m.*, a.assetTag, a.make, a.model, a.serialNumber, t.name as typeName
       FROM MaintenanceSchedule m
       LEFT JOIN Asset a ON m.assetId = a.id
       LEFT JOIN AssetType t ON a.assetTypeId = t.id
       ${whereSql}
       ORDER BY m.scheduledFor DESC LIMIT ?`
    ).all(...params, limit)
    return rows<MaintenanceSchedule & { assetTag?: string; make?: string; model?: string; serialNumber?: string; typeName?: string }>(r).map((m) => ({
      ...m,
      asset: {
        id: m.assetId,
        assetTag: (m as any).assetTag ?? null,
        make: (m as any).make ?? null,
        model: (m as any).model ?? null,
        serialNumber: (m as any).serialNumber ?? null,
        assetType: (m as any).typeName ? { id: '', name: (m as any).typeName } : undefined,
      } as Asset,
    }))
  },
  async listForAsset(assetId: string): MaintenanceSchedule[] {
    return await this.list({ assetId, limit: 50 })
  },
  async get(id: string): MaintenanceSchedule | null {
    await ensure()
    return row<MaintenanceSchedule>(await db.prepare('SELECT * FROM MaintenanceSchedule WHERE id = ?').get(id))
  },
  async create(data: Partial<MaintenanceSchedule>): MaintenanceSchedule {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO MaintenanceSchedule (id, assetId, type, title, description, scheduledFor, completedAt, status, cost, performedBy, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.assetId,
      data.type ?? 'Preventive',
      data.title,
      data.description ?? null,
      data.scheduledFor,
      data.completedAt ?? null,
      data.status ?? 'Scheduled',
      data.cost != null ? Number(data.cost) : null,
      data.performedBy ?? null,
      data.notes ?? null,
      now,
      now
    )
    activityLogRepo.log('maintenance.created', 'Asset', data.assetId!, `Scheduled maintenance: ${data.title}`)
    return await this.get(id)!
  },
  async update(id: string, data: Partial<MaintenanceSchedule>): MaintenanceSchedule | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE MaintenanceSchedule SET type = ?, title = ?, description = ?, scheduledFor = ?, completedAt = ?, status = ?, cost = ?, performedBy = ?, notes = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.type ?? cur.type,
      data.title ?? cur.title,
      data.description ?? cur.description,
      data.scheduledFor ?? cur.scheduledFor,
      data.completedAt ?? cur.completedAt,
      data.status ?? cur.status,
      data.cost != null ? Number(data.cost) : cur.cost,
      data.performedBy ?? cur.performedBy,
      data.notes ?? cur.notes,
      now,
      id
    )
    if (data.status && data.status !== cur.status) {
      activityLogRepo.log('maintenance.updated', 'Asset', cur.assetId, `Maintenance "${cur.title}" status: ${cur.status} â†’ ${data.status}`)
    }
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    const m = await this.get(id)
    await db.prepare('DELETE FROM MaintenanceSchedule WHERE id = ?').run(id)
    if (m) activityLogRepo.log('maintenance.deleted', 'Asset', m.assetId, `Deleted maintenance: ${m.title}`)
  },
  async upcoming(days = 30): MaintenanceSchedule[] {
    await ensure()
    const now = new Date()
    const future = new Date(); future.setDate(now.getDate() + days)
    const r = await db.prepare(
      `SELECT m.*, a.assetTag, a.make, a.model
       FROM MaintenanceSchedule m
       LEFT JOIN Asset a ON m.assetId = a.id
       WHERE m.status IN ('Scheduled','In Progress','Overdue')
       AND m.scheduledFor <= ?
       ORDER BY m.scheduledFor ASC LIMIT 50`
    ).all(future.toISOString())
    return rows<MaintenanceSchedule & { assetTag?: string; make?: string; model?: string }>(r).map((m) => ({
      ...m,
      asset: { id: m.assetId, assetTag: (m as any).assetTag, make: (m as any).make, model: (m as any).model } as Asset,
    }))
  },
  async stats(): { total: number; scheduled: number; inProgress: number; completed: number; overdue: number } {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM MaintenanceSchedule').get() as { c: number }).c
    const scheduled = (await db.prepare(`SELECT COUNT(*) as c FROM MaintenanceSchedule WHERE status='Scheduled'`).get() as { c: number }).c
    const inProgress = (await db.prepare(`SELECT COUNT(*) as c FROM MaintenanceSchedule WHERE status='In Progress'`).get() as { c: number }).c
    const completed = (await db.prepare(`SELECT COUNT(*) as c FROM MaintenanceSchedule WHERE status='Completed'`).get() as { c: number }).c
    const now = new Date().toISOString()
    const overdue = (await db.prepare(`SELECT COUNT(*) as c FROM MaintenanceSchedule WHERE status IN ('Scheduled','In Progress') AND scheduledFor < ?`).get(now) as { c: number }).c
    return { total, scheduled, inProgress, completed, overdue }
  },
}

// ============ Software Licenses ============
export const licenseRepo = {
  async list(): SoftwareLicense[] {
    await ensure()
    const r = await db.prepare(`
      SELECT sl.*,
        (SELECT COUNT(*) FROM AssetLicense al WHERE al.licenseId = sl.id) as _count_alloc
      FROM SoftwareLicense sl ORDER BY sl.name
    `).all()
    return rows<SoftwareLicense & { _count_alloc: number }>(r).map((l) => ({
      ...l,
      _count: { allocations: l._count_alloc },
      availableSeats: Math.max(0, l.seatsTotal - l.seatsUsed),
    }))
  },
  async get(id: string): SoftwareLicense | null {
    await ensure()
    return row<SoftwareLicense>(await db.prepare('SELECT * FROM SoftwareLicense WHERE id = ?').get(id))
  },
  async create(data: Partial<SoftwareLicense>): SoftwareLicense {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO SoftwareLicense (id, name, vendor, key, seatsTotal, seatsUsed, purchaseDate, expiryDate, cost, currency, category, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.name, data.vendor ?? null, data.key ?? null,
      Number(data.seatsTotal ?? 1), Number(data.seatsUsed ?? 0),
      data.purchaseDate ?? null, data.expiryDate ?? null,
      data.cost != null ? Number(data.cost) : null,
      data.currency ?? 'USD', data.category ?? null, data.notes ?? null,
      now, now
    )
    return await this.get(id)!
  },
  async update(id: string, data: Partial<SoftwareLicense>): SoftwareLicense | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE SoftwareLicense SET name = ?, vendor = ?, key = ?, seatsTotal = ?, seatsUsed = ?, purchaseDate = ?, expiryDate = ?, cost = ?, currency = ?, category = ?, notes = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.name ?? cur.name, data.vendor ?? cur.vendor, data.key ?? cur.key,
      data.seatsTotal != null ? Number(data.seatsTotal) : cur.seatsTotal,
      data.seatsUsed != null ? Number(data.seatsUsed) : cur.seatsUsed,
      data.purchaseDate ?? cur.purchaseDate, data.expiryDate ?? cur.expiryDate,
      data.cost != null ? Number(data.cost) : cur.cost,
      data.currency ?? cur.currency, data.category ?? cur.category, data.notes ?? cur.notes,
      now, id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    await db.prepare('DELETE FROM SoftwareLicense WHERE id = ?').run(id)
  },
  async allocate(licenseId: string, assetId: string): AssetLicense {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO AssetLicense (id, assetId, licenseId, assignedAt, createdAt) VALUES (?, ?, ?, ?, ?)`
    ).run(id, assetId, licenseId, now, now)
    await db.prepare(
      `UPDATE SoftwareLicense SET seatsUsed = (SELECT COUNT(*) FROM AssetLicense WHERE licenseId = ?), updatedAt = ? WHERE id = ?`
    ).run(licenseId, now, licenseId)
    activityLogRepo.log('license.allocated', 'Asset', assetId, `License allocated to asset`)
    return row<AssetLicense>(await db.prepare('SELECT * FROM AssetLicense WHERE id = ?').get(id))!
  },
  async deallocate(assetLicenseId: string): void {
    await ensure()
    const al = row<AssetLicense>(await db.prepare('SELECT * FROM AssetLicense WHERE id = ?').get(assetLicenseId))
    if (!al) return
    await db.prepare('DELETE FROM AssetLicense WHERE id = ?').run(assetLicenseId)
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE SoftwareLicense SET seatsUsed = (SELECT COUNT(*) FROM AssetLicense WHERE licenseId = ?), updatedAt = ? WHERE id = ?`
    ).run(al.licenseId, now, al.licenseId)
    activityLogRepo.log('license.deallocated', 'Asset', al.assetId, `License removed from asset`)
  },
  async listForAsset(assetId: string): AssetLicense[] {
    await ensure()
    const r = await db.prepare(
      `SELECT al.*, sl.name as licName, sl.vendor as licVendor, sl.key as licKey, sl.category as licCategory, sl.expiryDate as licExpiry
       FROM AssetLicense al
       LEFT JOIN SoftwareLicense sl ON al.licenseId = sl.id
       WHERE al.assetId = ? ORDER BY al.assignedAt DESC`
    ).all(assetId)
    return rows<AssetLicense & { licName?: string; licVendor?: string; licKey?: string; licCategory?: string; licExpiry?: string }>(r).map((al) => ({
      ...al,
      license: al.licName ? {
        id: al.licenseId,
        name: al.licName,
        vendor: al.licVendor,
        key: al.licKey,
        category: al.licCategory,
        expiryDate: al.licExpiry,
      } as SoftwareLicense : undefined,
    }))
  },
  async stats(): { total: number; totalSeats: number; usedSeats: number; expiringSoon: number; totalValue: number } {
    await ensure()
    const r = await db.prepare(`
      SELECT
        COUNT(*) as total,
        COALESCE(SUM(seatsTotal), 0) as totalSeats,
        COALESCE(SUM(seatsUsed), 0) as usedSeats,
        COALESCE(SUM(cost), 0) as totalValue
      FROM SoftwareLicense
    `).get() as { total: number; totalSeats: number; usedSeats: number; totalValue: number }
    const in30 = new Date(); in30.setDate(in30.getDate() + 30)
    const expRow = await db.prepare(
      `SELECT COUNT(*) as c FROM SoftwareLicense WHERE expiryDate IS NOT NULL AND expiryDate <= ? AND expiryDate > ?`
    ).get(in30.toISOString(), new Date().toISOString()) as { c: number }
    return {
      total: r.total,
      totalSeats: r.totalSeats,
      usedSeats: r.usedSeats,
      totalValue: r.totalValue,
      expiringSoon: expRow.c,
    }
  },
}

// Hook activity logging into key asset operations
export async function logAssetActivity(action: string, assetId: string, details?: string) {
  try {
    await activityLogRepo.log(action, 'Asset', assetId, details)
  } catch {}
}

// ============ Checkout Requests ============
export interface CheckoutQuery {
  assetId?: string
  requestedById?: string
  status?: string
  requestType?: string
  limit?: number
}

export const checkoutRepo = {
  async list(opts: CheckoutQuery = {}): CheckoutRequest[] {
    await ensure()
    const limit = Math.min(opts.limit || 200, 500)
    const where: string[] = []
    const params: unknown[] = []
    if (opts.assetId) { where.push('c.assetId = ?'); params.push(opts.assetId) }
    if (opts.requestedById) { where.push('c.requestedById = ?'); params.push(opts.requestedById) }
    if (opts.status) { where.push('c.status = ?'); params.push(opts.status) }
    if (opts.requestType) { where.push('c.requestType = ?'); params.push(opts.requestType) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const r = await db.prepare(
      `SELECT c.*,
        a.assetTag, a.make, a.model, a.serialNumber, t.name as typeName,
        p.fullName as requesterName, p.email as requesterEmail,
        ap.fullName as approverName
       FROM CheckoutRequest c
       LEFT JOIN Asset a ON c.assetId = a.id
       LEFT JOIN AssetType t ON a.assetTypeId = t.id
       LEFT JOIN Person p ON c.requestedById = p.id
       LEFT JOIN Person ap ON c.approvedById = ap.id
       ${whereSql}
       ORDER BY c.createdAt DESC LIMIT ?`
    ).all(...params, limit)
    return rows<CheckoutRequest & {
      assetTag?: string; make?: string; model?: string; serialNumber?: string; typeName?: string
      requesterName?: string; requesterEmail?: string; approverName?: string
    }>(r).map((c) => ({
      ...c,
      asset: c.assetTag ? {
        id: c.assetId,
        assetTag: (c as any).assetTag,
        make: (c as any).make,
        model: (c as any).model,
        serialNumber: (c as any).serialNumber,
        assetType: (c as any).typeName ? { id: '', name: (c as any).typeName } : undefined,
      } as Asset : undefined,
      requestedBy: c.requesterName ? {
        id: c.requestedById,
        fullName: (c as any).requesterName,
        email: (c as any).requesterEmail,
      } as Person : undefined,
      approvedBy: (c as any).approverName ? {
        id: c.approvedById!,
        fullName: (c as any).approverName,
      } as Person : null,
    }))
  },
  async listForAsset(assetId: string): CheckoutRequest[] {
    return await this.list({ assetId, limit: 50 })
  },
  async get(id: string): CheckoutRequest | null {
    await ensure()
    return row<CheckoutRequest>(await db.prepare('SELECT * FROM CheckoutRequest WHERE id = ?').get(id))
  },
  async create(data: Partial<CheckoutRequest>): CheckoutRequest {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO CheckoutRequest (id, assetId, requestedById, requestType, status, reason, requestedStartDate, requestedReturnDate, approvedById, approvedAt, decisionNotes, checkedOutAt, checkedInAt, actualReturnDate, conditionAtReturn, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.assetId,
      data.requestedById,
      data.requestType ?? 'Checkout',
      data.status ?? 'Pending',
      data.reason ?? null,
      data.requestedStartDate ?? now,
      data.requestedReturnDate ?? null,
      data.approvedById ?? null,
      data.approvedAt ?? null,
      data.decisionNotes ?? null,
      data.checkedOutAt ?? null,
      data.checkedInAt ?? null,
      data.actualReturnDate ?? null,
      data.conditionAtReturn ?? null,
      now,
      now
    )
    activityLogRepo.log('checkout.created', 'Asset', data.assetId!, `New ${data.requestType || 'Checkout'} request`)
    return await this.get(id)!
  },
  async update(id: string, data: Partial<CheckoutRequest>): CheckoutRequest | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE CheckoutRequest SET status = ?, reason = ?, requestedReturnDate = ?, approvedById = ?, approvedAt = ?, decisionNotes = ?, checkedOutAt = ?, checkedInAt = ?, actualReturnDate = ?, conditionAtReturn = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.status ?? cur.status,
      data.reason ?? cur.reason,
      data.requestedReturnDate ?? cur.requestedReturnDate,
      data.approvedById ?? cur.approvedById,
      data.approvedAt ?? cur.approvedAt,
      data.decisionNotes ?? cur.decisionNotes,
      data.checkedOutAt ?? cur.checkedOutAt,
      data.checkedInAt ?? cur.checkedInAt,
      data.actualReturnDate ?? cur.actualReturnDate,
      data.conditionAtReturn ?? cur.conditionAtReturn,
      now,
      id
    )
    if (data.status && data.status !== cur.status) {
      activityLogRepo.log('checkout.updated', 'Asset', cur.assetId, `Checkout request status: ${cur.status} â†’ ${data.status}`)
    }
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    await db.prepare('DELETE FROM CheckoutRequest WHERE id = ?').run(id)
  },
  async approve(id: string, approverId: string, notes?: string): CheckoutRequest | null {
    return this.update(id, {
      status: 'Approved',
      approvedById: approverId,
      approvedAt: new Date().toISOString(),
      decisionNotes: notes,
    })
  },
  async reject(id: string, approverId: string, notes?: string): CheckoutRequest | null {
    return this.update(id, {
      status: 'Rejected',
      approvedById: approverId,
      approvedAt: new Date().toISOString(),
      decisionNotes: notes,
    })
  },
  async checkOut(id: string): CheckoutRequest | null {
    return this.update(id, {
      status: 'Checked Out',
      checkedOutAt: new Date().toISOString(),
    })
  },
  async checkIn(id: string, condition?: string): CheckoutRequest | null {
    return this.update(id, {
      status: 'Checked In',
      checkedInAt: new Date().toISOString(),
      actualReturnDate: new Date().toISOString(),
      conditionAtReturn: condition,
    })
  },
  async stats(): { total: number; pending: number; approved: number; checkedOut: number; overdue: number; rejected: number } {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM CheckoutRequest').get() as { c: number }).c
    const pending = (await db.prepare(`SELECT COUNT(*) as c FROM CheckoutRequest WHERE status='Pending'`).get() as { c: number }).c
    const approved = (await db.prepare(`SELECT COUNT(*) as c FROM CheckoutRequest WHERE status='Approved'`).get() as { c: number }).c
    const checkedOut = (await db.prepare(`SELECT COUNT(*) as c FROM CheckoutRequest WHERE status='Checked Out'`).get() as { c: number }).c
    const rejected = (await db.prepare(`SELECT COUNT(*) as c FROM CheckoutRequest WHERE status='Rejected'`).get() as { c: number }).c
    const now = new Date().toISOString()
    const overdue = (await db.prepare(
      `SELECT COUNT(*) as c FROM CheckoutRequest WHERE status='Checked Out' AND requestedReturnDate IS NOT NULL AND requestedReturnDate < ?`
    ).get(now) as { c: number }).c
    return { total, pending, approved, checkedOut, overdue, rejected }
  },
}

// ============ Depreciation Rules & Calculations ============
export const depreciationRepo = {
  async list(): DepreciationRule[] {
    await ensure()
    const r = await db.prepare(`
      SELECT d.*, t.name as typeName
      FROM DepreciationRule d
      LEFT JOIN AssetType t ON d.assetTypeId = t.id
      ORDER BY d.name
    `).all()
    return rows<DepreciationRule & { typeName?: string }>(r).map((d) => ({
      ...d,
      isActive: Boolean((d as any).isActive),
      assetType: (d as any).typeName ? { id: d.assetTypeId!, name: (d as any).typeName } : null,
    }))
  },
  async get(id: string): DepreciationRule | null {
    await ensure()
    const r = row<DepreciationRule & { typeName?: string }>(await db.prepare(`
      SELECT d.*, t.name as typeName FROM DepreciationRule d
      LEFT JOIN AssetType t ON d.assetTypeId = t.id WHERE d.id = ?
    `).get(id))
    if (!r) return null
    return { ...r, isActive: Boolean((r as any).isActive), assetType: (r as any).typeName ? { id: r.assetTypeId!, name: (r as any).typeName } : null }
  },
  async findByAssetType(assetTypeId: string): DepreciationRule | null {
    await ensure()
    // Look for asset-type-specific rule first, then fall back to global
    let r = row<DepreciationRule & { typeName?: string }>(await db.prepare(`
      SELECT d.*, t.name as typeName FROM DepreciationRule d
      LEFT JOIN AssetType t ON d.assetTypeId = t.id
      WHERE d.assetTypeId = ? AND d.isActive = 1
    `).get(assetTypeId))
    if (!r) {
      r = row<DepreciationRule & { typeName?: string }>(await db.prepare(`
        SELECT d.*, NULL as typeName FROM DepreciationRule d
        WHERE d.assetTypeId IS NULL AND d.isActive = 1
        ORDER BY d.createdAt ASC LIMIT 1
      `).get())
    }
    if (!r) return null
    return { ...r, isActive: Boolean((r as any).isActive), assetType: (r as any).typeName ? { id: r.assetTypeId!, name: (r as any).typeName } : null }
  },
  async create(data: Partial<DepreciationRule>): DepreciationRule {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO DepreciationRule (id, name, assetTypeId, method, usefulLifeYears, salvageValuePercent, description, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.name, data.assetTypeId ?? null, data.method ?? 'straight-line',
      Number(data.usefulLifeYears ?? 4), Number(data.salvageValuePercent ?? 0),
      data.description ?? null, data.isActive === false ? 0 : 1, now, now
    )
    return await this.get(id)!
  },
  async update(id: string, data: Partial<DepreciationRule>): DepreciationRule | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE DepreciationRule SET name = ?, assetTypeId = ?, method = ?, usefulLifeYears = ?, salvageValuePercent = ?, description = ?, isActive = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.name ?? cur.name, data.assetTypeId ?? cur.assetTypeId,
      data.method ?? cur.method,
      data.usefulLifeYears != null ? Number(data.usefulLifeYears) : cur.usefulLifeYears,
      data.salvageValuePercent != null ? Number(data.salvageValuePercent) : cur.salvageValuePercent,
      data.description ?? cur.description,
      data.isActive != null ? (data.isActive ? 1 : 0) : (cur.isActive ? 1 : 0),
      now, id
    )
    return await this.get(id)
  },
  async delete(id: string): void {
    await ensure()
    await db.prepare('DELETE FROM DepreciationRule WHERE id = ?').run(id)
  },
  async calculate(asset: Asset): DepreciationCalc | null {
    if (asset.cost == null || asset.cost <= 0 || !asset.purchaseDate) {
      return null
    }
    const rule = await this.findByAssetType(asset.assetTypeId)
    const usefulLifeYears = rule?.usefulLifeYears ?? 4
    const salvagePercent = rule?.salvageValuePercent ?? 0
    const method = rule?.method ?? 'straight-line'

    const purchaseCost = asset.cost
    const salvageValue = purchaseCost * (salvagePercent / 100)
    const depreciableAmount = purchaseCost - salvageValue

    const purchaseDate = new Date(asset.purchaseDate)
    const now = new Date()
    const yearsElapsed = Math.max(0, (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 3600 * 1000))
    const yearsElapsedRounded = Math.floor(yearsElapsed)
    const yearsRemaining = Math.max(0, usefulLifeYears - yearsElapsedRounded)

    let currentValue = purchaseCost
    let annualDepreciation = 0
    let depreciationPercent = 0

    if (method === 'straight-line') {
      annualDepreciation = depreciableAmount / usefulLifeYears
      const depreciation = Math.min(depreciableAmount, annualDepreciation * yearsElapsed)
      currentValue = purchaseCost - depreciation
      depreciationPercent = (depreciation / purchaseCost) * 100
    } else if (method === 'declining-balance') {
      // Double declining balance
      const rate = (2 / usefulLifeYears)
      let bookValue = purchaseCost
      let year = 0
      while (year < yearsElapsedRounded && bookValue > salvageValue) {
        const dep = Math.max(0, bookValue * rate)
        bookValue = Math.max(salvageValue, bookValue - dep)
        year++
      }
      currentValue = bookValue
      annualDepreciation = currentValue * rate
      depreciationPercent = ((purchaseCost - currentValue) / purchaseCost) * 100
    } else {
      // units-of-production: treat years as "units" (fallback simple straight-line)
      annualDepreciation = depreciableAmount / usefulLifeYears
      const depreciation = Math.min(depreciableAmount, annualDepreciation * yearsElapsed)
      currentValue = purchaseCost - depreciation
      depreciationPercent = (depreciation / purchaseCost) * 100
    }

    const depreciation = purchaseCost - currentValue
    const isFullyDepreciated = currentValue <= salvageValue || yearsElapsedRounded >= usefulLifeYears

    return {
      asset,
      rule,
      purchaseCost,
      currentValue: Math.round(currentValue * 100) / 100,
      depreciation: Math.round(depreciation * 100) / 100,
      depreciationPercent: Math.round(depreciationPercent * 100) / 100,
      yearsElapsed: Math.round(yearsElapsed * 100) / 100,
      yearsRemaining,
      annualDepreciation: Math.round(annualDepreciation * 100) / 100,
      salvageValue: Math.round(salvageValue * 100) / 100,
      method,
      isFullyDepreciated,
    }
  },
  async calculateForAll(): DepreciationCalc[] {
    await ensure()
    const assets = await db.prepare(`
      SELECT a.*, t.name as typeName FROM Asset a
      LEFT JOIN AssetType t ON a.assetTypeId = t.id
      WHERE a.cost IS NOT NULL AND a.cost > 0 AND a.purchaseDate IS NOT NULL
      ORDER BY a.assetTag
    `).all() as any[]
    const results: DepreciationCalc[] = []
    for (const a of assets) {
      const asset: Asset = {
        ...a,
        assetType: a.typeName ? { id: a.assetTypeId, name: a.typeName } : undefined,
      } as Asset
      const calc = await this.calculate(asset)
      if (calc) results.push(calc)
    }
    return results
  },
  async stats(): { totalAssets: number; totalPurchaseValue: number; totalCurrentValue: number; totalDepreciation: number; fullyDepreciatedCount: number } {
    const calcs = await this.calculateForAll()
    return {
      totalAssets: calcs.length,
      totalPurchaseValue: Math.round(calcs.reduce((s, c) => s + c.purchaseCost, 0) * 100) / 100,
      totalCurrentValue: Math.round(calcs.reduce((s, c) => s + c.currentValue, 0) * 100) / 100,
      totalDepreciation: Math.round(calcs.reduce((s, c) => s + c.depreciation, 0) * 100) / 100,
      fullyDepreciatedCount: calcs.filter((c) => c.isFullyDepreciated).length,
    }
  },
}

// ============ Notifications ============
export const notificationRepo = {
  async list(opts: { limit?: number; onlyUnread?: boolean; type?: string } = {}): AppNotification[] {
    await ensure()
    const limit = Math.min(opts.limit || 100, 500)
    const where: string[] = []
    const params: unknown[] = []
    if (opts.onlyUnread) { where.push('isRead = 0') }
    if (opts.type) { where.push('type = ?'); params.push(opts.type) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const r = await db.prepare(
      `SELECT * FROM Notification ${whereSql} ORDER BY createdAt DESC LIMIT ?`
    ).all(...params, limit)
    return rows<AppNotification>(r).map((n) => ({ ...n, isRead: Boolean((n as any).isRead) }))
  },
  async create(data: Partial<AppNotification>): AppNotification {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO Notification (id, type, severity, title, message, entityType, entityId, isRead, actionUrl, actionLabel, createdAt, readAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NULL)`
    ).run(
      id, data.type, data.severity ?? 'info', data.title, data.message,
      data.entityType ?? null, data.entityId ?? null,
      data.actionUrl ?? null, data.actionLabel ?? null, now
    )
    return row<AppNotification>(await db.prepare('SELECT * FROM Notification WHERE id = ?').get(id))!
  },
  async markRead(id: string): void {
    await ensure()
    await db.prepare('UPDATE Notification SET isRead = 1, readAt = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  },
  async markAllRead(): void {
    await ensure()
    await db.prepare('UPDATE Notification SET isRead = 1, readAt = ? WHERE isRead = 0')
      .run(new Date().toISOString())
  },
  async delete(id: string): void {
    await ensure()
    await db.prepare('DELETE FROM Notification WHERE id = ?').run(id)
  },
  async clearAll(): void {
    await ensure()
    await db.prepare('DELETE FROM Notification').run()
  },
  async count(opts: { onlyUnread?: boolean } = {}): number {
    await ensure()
    const sql = opts.onlyUnread ? `SELECT COUNT(*) as c FROM Notification WHERE isRead = 0` : `SELECT COUNT(*) as c FROM Notification`
    return (await db.prepare(sql).get() as { c: number }).c
  },
  // Generate notifications from system state (warranty, maintenance overdue, license expiring)
  async regenerateSystemNotifications(): { created: number; cleared: number } {
    await ensure()
    // Clear existing system notifications
    const cleared = (await db.prepare(`DELETE FROM Notification WHERE type IN ('warranty_expiring','maintenance_overdue','license_expiring','license_expired','low_stock')`).run() as any).changes || 0
    let created = 0
    const now = new Date()
    const in30 = new Date(); in30.setDate(now.getDate() + 30)
    const in7 = new Date(); in7.setDate(now.getDate() + 7)

    // Warranty expiring
    const warrantyRows = await db.prepare(`
      SELECT id, assetTag, make, model, warrantyExpiry FROM Asset
      WHERE warrantyExpiry IS NOT NULL AND warrantyExpiry > ? AND warrantyExpiry <= ?
    `).all(now.toISOString(), in30.toISOString()) as any[]
    for (const a of warrantyRows) {
      this.create({
        type: 'warranty_expiring',
        severity: 'warning',
        title: 'Warranty Expiring Soon',
        message: `${a.make} ${a.model} (${a.assetTag}) warranty expires soon`,
        entityType: 'Asset',
        entityId: a.id,
        actionUrl: 'asset-detail',
        actionLabel: 'View Asset',
      })
      created++
    }

    // Maintenance overdue
    const overdueMaint = await db.prepare(`
      SELECT m.id, m.title, m.scheduledFor, a.assetTag, a.make, a.model, a.id as assetId
      FROM MaintenanceSchedule m
      LEFT JOIN Asset a ON m.assetId = a.id
      WHERE m.status IN ('Scheduled','In Progress') AND m.scheduledFor < ?
    `).all(now.toISOString()) as any[]
    for (const m of overdueMaint) {
      this.create({
        type: 'maintenance_overdue',
        severity: 'critical',
        title: 'Maintenance Overdue',
        message: `"${m.title}" for ${m.make} ${m.model} (${m.assetTag}) was due ${new Date(m.scheduledFor).toLocaleDateString()}`,
        entityType: 'Asset',
        entityId: m.assetId,
        actionUrl: 'maintenance',
        actionLabel: 'View Maintenance',
      })
      created++
    }

    // License expiring soon
    const expiringLic = await db.prepare(`
      SELECT id, name, vendor, expiryDate FROM SoftwareLicense
      WHERE expiryDate IS NOT NULL AND expiryDate > ? AND expiryDate <= ?
    `).all(now.toISOString(), in30.toISOString()) as any[]
    for (const l of expiringLic) {
      this.create({
        type: 'license_expiring',
        severity: 'warning',
        title: 'License Expiring Soon',
        message: `${l.name} (${l.vendor || 'vendor'}) expires ${new Date(l.expiryDate).toLocaleDateString()}`,
        entityType: 'License',
        entityId: l.id,
        actionUrl: 'licenses',
        actionLabel: 'View Licenses',
      })
      created++
    }

    // License already expired
    const expiredLic = await db.prepare(`
      SELECT id, name, vendor, expiryDate FROM SoftwareLicense
      WHERE expiryDate IS NOT NULL AND expiryDate < ?
    `).all(now.toISOString()) as any[]
    for (const l of expiredLic) {
      this.create({
        type: 'license_expired',
        severity: 'critical',
        title: 'License Expired',
        message: `${l.name} (${l.vendor || 'vendor'}) expired ${new Date(l.expiryDate).toLocaleDateString()}`,
        entityType: 'License',
        entityId: l.id,
        actionUrl: 'licenses',
        actionLabel: 'View Licenses',
      })
      created++
    }

    return { created, cleared }
  },
}

// ============ Vendors ============
export const vendorRepo = {
  async list(): Vendor[] {
    await ensure()
    const r = await db.prepare(`
      SELECT v.*,
        (SELECT COUNT(*) FROM PurchaseOrder po WHERE po.vendorId = v.id) as _count_purchaseOrders,
        COALESCE((SELECT SUM(po.totalAmount) FROM PurchaseOrder po WHERE po.vendorId = v.id AND po.status NOT IN ('Draft','Cancelled')), 0) as _sum_totalSpent
      FROM Vendor v
      ORDER BY v.name
    `).all()
    return rows<Vendor & { _count_purchaseOrders: number; _sum_totalSpent: number }>(r).map((v) => ({
      ...v,
      isActive: toBool(v.isActive),
      rating: Number(v.rating) || 0,
      _count: { purchaseOrders: v._count_purchaseOrders },
      _sum: { totalSpent: v._sum_totalSpent },
    }))
  },
  async get(id: string): Vendor | null {
    await ensure()
    const r = row<Vendor>(await db.prepare('SELECT * FROM Vendor WHERE id = ?').get(id))
    if (!r) return null
    return { ...r, isActive: toBool(r.isActive), rating: Number(r.rating) || 0 }
  },
  async create(data: Partial<Vendor>): Vendor {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO Vendor (id, name, category, contactPerson, email, phone, website, address, taxId, paymentTerms, rating, isActive, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.name, data.category ?? null, data.contactPerson ?? null, data.email ?? null,
      data.phone ?? null, data.website ?? null, data.address ?? null, data.taxId ?? null,
      data.paymentTerms ?? null, data.rating ?? 0, data.isActive === false ? 0 : 1,
      data.notes ?? null, now, now
    )
    const v = await this.get(id)!
    activityLogRepo.log('vendor.created', 'Vendor', id, `Created vendor "${v.name}" (${v.category || 'Uncategorized'})`)
    return v
  },
  async update(id: string, data: Partial<Vendor>): Vendor | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(
      `UPDATE Vendor SET name = ?, category = ?, contactPerson = ?, email = ?, phone = ?, website = ?, address = ?, taxId = ?, paymentTerms = ?, rating = ?, isActive = ?, notes = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.name ?? cur.name, data.category ?? cur.category, data.contactPerson ?? cur.contactPerson,
      data.email ?? cur.email, data.phone ?? cur.phone, data.website ?? cur.website,
      data.address ?? cur.address, data.taxId ?? cur.taxId, data.paymentTerms ?? cur.paymentTerms,
      data.rating ?? cur.rating, data.isActive === false ? 0 : 1, data.notes ?? cur.notes, now, id
    )
    const updated = await this.get(id)!
    const changes: string[] = []
    if (data.name && data.name !== cur.name) changes.push(`name "${cur.name}" â†’ "${data.name}"`)
    if (data.category !== undefined && data.category !== cur.category) changes.push(`category changed`)
    if (data.isActive !== undefined && data.isActive !== cur.isActive) changes.push(`active: ${cur.isActive ? 'Yes' : 'No'} â†’ ${data.isActive ? 'Yes' : 'No'}`)
    if (data.rating !== undefined && Number(data.rating) !== cur.rating) changes.push(`rating ${cur.rating} â†’ ${data.rating}`)
    activityLogRepo.log('vendor.updated', 'Vendor', id, `Updated vendor "${updated.name}"${changes.length ? ': ' + changes.join(', ') : ''}`)
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM Vendor WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('vendor.deleted', 'Vendor', id, `Deleted vendor "${cur.name}"`)
  },
  async stats() {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM Vendor').get() as { c: number }).c
    const active = (await db.prepare('SELECT COUNT(*) as c FROM Vendor WHERE isActive = 1').get() as { c: number }).c
    return { total, active }
  },
}

// ============ Purchase Orders ============
export const purchaseOrderRepo = {
  async _attachRelations(po: PurchaseOrder): PurchaseOrder {
    if (!po) return po
    const vendor = row<Vendor>(await db.prepare('SELECT * FROM Vendor WHERE id = ?').get(po.vendorId))
    const requestedBy = po.requestedById
      ? row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(po.requestedById))
      : null
    const approvedBy = po.approvedById
      ? row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(po.approvedById))
      : null
    const items = rows<PurchaseOrderItem>(
      await db.prepare(`
        SELECT poi.*, at.name as _at_name, at.icon as _at_icon, at.description as _at_desc
        FROM PurchaseOrderItem poi
        LEFT JOIN AssetType at ON poi.assetTypeId = at.id
        WHERE poi.poId = ?
        ORDER BY poi.createdAt
      `).all(po.id)
    ).map((it: any) => ({
      ...it,
      assetType: it._at_name ? { id: it.assetTypeId, name: it._at_name, icon: it._at_icon, description: it._at_desc } : null,
    })) as PurchaseOrderItem[]
    return {
      ...po,
      vendor: vendor ? { ...vendor, isActive: toBool(vendor.isActive), rating: Number(vendor.rating) || 0 } : undefined,
      requestedBy: requestedBy || null,
      approvedBy: approvedBy || null,
      items,
      _count: { items: items.length },
    }
  },
  async list(): PurchaseOrder[] {
    await ensure()
    const r = rows<PurchaseOrder>(
      await db.prepare('SELECT * FROM PurchaseOrder ORDER BY orderDate DESC, createdAt DESC').all()
    )
    return r.map((po) => this._attachRelations(po))
  },
  async get(id: string): PurchaseOrder | null {
    await ensure()
    const po = row<PurchaseOrder>(await db.prepare('SELECT * FROM PurchaseOrder WHERE id = ?').get(id))
    if (!po) return null
    return this._attachRelations(po)
  },
  async create(data: Partial<PurchaseOrder> & { items?: Partial<PurchaseOrderItem>[] }): PurchaseOrder {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    const poNumber = data.poNumber || `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const orderDate = data.orderDate || now
    const subtotal = (data.items || []).reduce((s, it) => s + (Number(it.totalPrice) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0)
    const taxRate = Number(data.taxRate) || 0
    const taxAmount = (subtotal * taxRate) / 100
    const shippingCost = Number(data.shippingCost) || 0
    const totalAmount = subtotal + taxAmount + shippingCost
    await db.prepare(
      `INSERT INTO PurchaseOrder (id, poNumber, vendorId, status, orderDate, expectedDate, receivedDate, subtotal, taxRate, taxAmount, shippingCost, totalAmount, currency, requestedById, approvedById, approvedAt, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, poNumber, data.vendorId, data.status || 'Draft', orderDate,
      data.expectedDate ?? null, data.receivedDate ?? null, subtotal, taxRate, taxAmount, shippingCost,
      totalAmount, data.currency || 'USD', data.requestedById ?? null, data.approvedById ?? null,
      data.approvedAt ?? null, data.notes ?? null, now, now
    )
    // Insert items
    if (data.items && data.items.length > 0) {
      const insItem = await db.prepare(
        `INSERT INTO PurchaseOrderItem (id, poId, assetTypeId, description, quantity, unitPrice, totalPrice, receivedQuantity, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const it of data.items) {
        const qty = Number(it.quantity) || 1
        const unit = Number(it.unitPrice) || 0
        insItem.run(
          generateId(), id, it.assetTypeId ?? null, it.description || 'Item',
          qty, unit, Number(it.totalPrice) || qty * unit, Number(it.receivedQuantity) || 0,
          it.notes ?? null, now
        )
      }
    }
    const po = await this.get(id)!
    activityLogRepo.log('po.created', 'PurchaseOrder', id, `Created PO ${po.poNumber} for ${po.vendor?.name || 'vendor'} â€” $${po.totalAmount.toFixed(2)} (${po.status})`)
    return po
  },
  async update(id: string, data: Partial<PurchaseOrder> & { items?: Partial<PurchaseOrderItem>[] }): PurchaseOrder | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    const items = data.items !== undefined ? data.items : cur.items
    const subtotal = (items || []).reduce((s, it) => s + (Number(it.totalPrice) || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)), 0)
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : cur.taxRate
    const taxAmount = (subtotal * taxRate) / 100
    const shippingCost = data.shippingCost !== undefined ? Number(data.shippingCost) : cur.shippingCost
    const totalAmount = subtotal + taxAmount + shippingCost
    await db.prepare(
      `UPDATE PurchaseOrder SET vendorId = ?, status = ?, orderDate = ?, expectedDate = ?, receivedDate = ?, subtotal = ?, taxRate = ?, taxAmount = ?, shippingCost = ?, totalAmount = ?, currency = ?, requestedById = ?, approvedById = ?, approvedAt = ?, notes = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.vendorId ?? cur.vendorId, data.status ?? cur.status, data.orderDate ?? cur.orderDate,
      data.expectedDate ?? cur.expectedDate, data.receivedDate ?? cur.receivedDate,
      subtotal, taxRate, taxAmount, shippingCost, totalAmount,
      data.currency ?? cur.currency, data.requestedById ?? cur.requestedById,
      data.approvedById ?? cur.approvedById, data.approvedAt ?? cur.approvedAt,
      data.notes ?? cur.notes, now, id
    )
    if (data.items !== undefined) {
      await db.prepare('DELETE FROM PurchaseOrderItem WHERE poId = ?').run(id)
      const insItem = await db.prepare(
        `INSERT INTO PurchaseOrderItem (id, poId, assetTypeId, description, quantity, unitPrice, totalPrice, receivedQuantity, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      for (const it of data.items) {
        const qty = Number(it.quantity) || 1
        const unit = Number(it.unitPrice) || 0
        insItem.run(
          generateId(), id, it.assetTypeId ?? null, it.description || 'Item',
          qty, unit, Number(it.totalPrice) || qty * unit, Number(it.receivedQuantity) || 0,
          it.notes ?? null, now
        )
      }
    }
    const updated = await this.get(id)
    if (updated) {
      const statusChanged = data.status && data.status !== cur.status
      const detail = statusChanged
        ? `PO ${updated.poNumber} status: ${cur.status} â†’ ${data.status}`
        : `Updated PO ${updated.poNumber}`
      activityLogRepo.log('po.updated', 'PurchaseOrder', id, detail)
    }
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM PurchaseOrder WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('po.deleted', 'PurchaseOrder', id, `Deleted PO ${cur.poNumber}`)
  },
  async listForVendor(vendorId: string): PurchaseOrder[] {
    await ensure()
    const r = rows<PurchaseOrder>(
      await db.prepare('SELECT * FROM PurchaseOrder WHERE vendorId = ? ORDER BY orderDate DESC').all(vendorId)
    )
    return r.map((po) => this._attachRelations(po))
  },
  async stats() {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM PurchaseOrder').get() as { c: number }).c
    const pendingApproval = (await db.prepare(`SELECT COUNT(*) as c FROM PurchaseOrder WHERE status = 'Pending Approval'`).get() as { c: number }).c
    const open = (await db.prepare(`SELECT COUNT(*) as c FROM PurchaseOrder WHERE status IN ('Draft','Pending Approval','Approved','Ordered','Partially Received')`).get() as { c: number }).c
    const received = (await db.prepare(`SELECT COUNT(*) as c FROM PurchaseOrder WHERE status IN ('Received','Closed')`).get() as { c: number }).c
    const spent = (await db.prepare(`SELECT COALESCE(SUM(totalAmount), 0) as s FROM PurchaseOrder WHERE status NOT IN ('Draft','Cancelled')`).get() as { s: number }).s
    return { totalPOs: total, pendingApproval, open, received, totalSpent: spent }
  },
}

// ============ Asset Disposals ============
export const disposalRepo = {
  async _attachRelations(d: AssetDisposal): AssetDisposal {
    if (!d) return d
    const asset = row<Asset>(
      await db.prepare(`
        SELECT a.*, at.name as _at_name, at.icon as _at_icon
        FROM Asset a LEFT JOIN AssetType at ON a.assetTypeId = at.id
        WHERE a.id = ?
      `).get(d.assetId)
    ) as any
    if (asset) {
      asset.assetType = asset._at_name ? { id: asset.assetTypeId, name: asset._at_name, icon: asset._at_icon } : null
    }
    const approvedBy = d.approvedById
      ? row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(d.approvedById))
      : null
    return {
      ...d,
      environmentalCompliant: toBool(d.environmentalCompliant),
      residualValue: Number(d.residualValue) || 0,
      disposalCost: Number(d.disposalCost) || 0,
      netProceeds: Number(d.netProceeds) || 0,
      asset: asset || undefined,
      approvedBy: approvedBy || null,
    }
  },
  async list(): AssetDisposal[] {
    await ensure()
    const r = rows<AssetDisposal>(
      await db.prepare('SELECT * FROM AssetDisposal ORDER BY disposalDate DESC, createdAt DESC').all()
    )
    return r.map((d) => this._attachRelations(d))
  },
  async get(id: string): AssetDisposal | null {
    await ensure()
    const d = row<AssetDisposal>(await db.prepare('SELECT * FROM AssetDisposal WHERE id = ?').get(id))
    if (!d) return null
    return this._attachRelations(d)
  },
  async listForAsset(assetId: string): AssetDisposal[] {
    await ensure()
    const r = rows<AssetDisposal>(
      await db.prepare('SELECT * FROM AssetDisposal WHERE assetId = ? ORDER BY disposalDate DESC').all(assetId)
    )
    return r.map((d) => this._attachRelations(d))
  },
  async create(data: Partial<AssetDisposal>): AssetDisposal {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    const disposalNumber = data.disposalNumber || `DISP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
    const residualValue = Number(data.residualValue) || 0
    const disposalCost = Number(data.disposalCost) || 0
    const netProceeds = residualValue - disposalCost
    await db.prepare(
      `INSERT INTO AssetDisposal (id, assetId, disposalNumber, method, reason, disposalDate, residualValue, disposalCost, netProceeds, buyerRecipient, conditionAtDisposal, environmentalCompliant, certificateNumber, approvedById, approvedAt, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.assetId, disposalNumber, data.method || 'Sold', data.reason ?? null,
      data.disposalDate || now, residualValue, disposalCost, netProceeds,
      data.buyerRecipient ?? null, data.conditionAtDisposal ?? null,
      data.environmentalCompliant === false ? 0 : 1, data.certificateNumber ?? null,
      data.approvedById ?? null, data.approvedAt ?? null, data.notes ?? null, now, now
    )
    // Mark asset as Retired
    await db.prepare("UPDATE Asset SET status = 'Retired', updatedAt = ? WHERE id = ?").run(now, data.assetId!)
    const disposal = await this.get(id)!
    activityLogRepo.log('disposal.created', 'AssetDisposal', id, `Disposed asset via ${disposal.method} (net $${netProceeds.toFixed(2)}) â€” ${disposal.disposalNumber}`)
    activityLogRepo.log('asset.retired', 'Asset', data.assetId!, `Asset retired via disposal ${disposal.disposalNumber} (${disposal.method})`)
    return disposal
  },
  async update(id: string, data: Partial<AssetDisposal>): AssetDisposal | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    const residualValue = data.residualValue !== undefined ? Number(data.residualValue) : cur.residualValue
    const disposalCost = data.disposalCost !== undefined ? Number(data.disposalCost) : cur.disposalCost
    const netProceeds = residualValue - disposalCost
    await db.prepare(
      `UPDATE AssetDisposal SET method = ?, reason = ?, disposalDate = ?, residualValue = ?, disposalCost = ?, netProceeds = ?, buyerRecipient = ?, conditionAtDisposal = ?, environmentalCompliant = ?, certificateNumber = ?, approvedById = ?, approvedAt = ?, notes = ?, updatedAt = ? WHERE id = ?`
    ).run(
      data.method ?? cur.method, data.reason ?? cur.reason, data.disposalDate ?? cur.disposalDate,
      residualValue, disposalCost, netProceeds,
      data.buyerRecipient ?? cur.buyerRecipient, data.conditionAtDisposal ?? cur.conditionAtDisposal,
      data.environmentalCompliant === false ? 0 : 1, data.certificateNumber ?? cur.certificateNumber,
      data.approvedById ?? cur.approvedById, data.approvedAt ?? cur.approvedAt,
      data.notes ?? cur.notes, now, id
    )
    const updated = await this.get(id)
    if (updated) {
      const methodChanged = data.method && data.method !== cur.method
      activityLogRepo.log('disposal.updated', 'AssetDisposal', id, `${methodChanged ? `Method ${cur.method} â†’ ${data.method} â€” ` : ''}Updated disposal ${updated.disposalNumber}`)
    }
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM AssetDisposal WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('disposal.deleted', 'AssetDisposal', id, `Deleted disposal ${cur.disposalNumber}`)
  },
  async stats() {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM AssetDisposal').get() as { c: number }).c
    const recovered = (await db.prepare(`SELECT COALESCE(SUM(netProceeds), 0) as s FROM AssetDisposal WHERE method IN ('Sold','Trade-in','Recycled')`).get() as { s: number }).s
    const cost = (await db.prepare(`SELECT COALESCE(SUM(disposalCost), 0) as s FROM AssetDisposal`).get() as { s: number }).s
    const pending = (await db.prepare(`SELECT COUNT(*) as c FROM AssetDisposal WHERE approvedById IS NULL`).get() as { c: number }).c
    return { total, totalRecovered: recovered, totalCost: cost, pendingApproval: pending }
  },
}

// ============ Asset Tags ============
export const assetTagRepo = {
  async _attachCount(t: AssetTag): AssetTag {
    const c = (await db.prepare('SELECT COUNT(*) as c FROM AssetTagLink WHERE tagId = ?').get(t.id) as { c: number }).c
    return { ...t, _count: { assets: c } }
  },
  async list(): AssetTag[] {
    await ensure()
    const r = rows<AssetTag>(await db.prepare('SELECT * FROM AssetTag ORDER BY name COLLATE NOCASE').all())
    return r.map((t) => this._attachCount(t))
  },
  async get(id: string): AssetTag | null {
    await ensure()
    const r = row<AssetTag>(await db.prepare('SELECT * FROM AssetTag WHERE id = ?').get(id))
    if (!r) return null
    return this._attachCount(r)
  },
  async getByName(name: string): AssetTag | null {
    await ensure()
    const r = row<AssetTag>(await db.prepare('SELECT * FROM AssetTag WHERE name = ? COLLATE NOCASE').get(name))
    if (!r) return null
    return this._attachCount(r)
  },
  async create(data: Partial<AssetTag>): AssetTag {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO AssetTag (id, name, color, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, data.name, data.color || 'slate', data.description ?? null, now, now)
    const t = await this.get(id)!
    activityLogRepo.log('tag.created', 'AssetTag', id, `Created tag "${t.name}"`)
    return t
  },
  async update(id: string, data: Partial<AssetTag>): AssetTag | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    await db.prepare(`UPDATE AssetTag SET name = ?, color = ?, description = ?, updatedAt = ? WHERE id = ?`).run(
      data.name ?? cur.name, data.color ?? cur.color, data.description ?? cur.description, now, id
    )
    const updated = await this.get(id)!
    activityLogRepo.log('tag.updated', 'AssetTag', id, `Updated tag "${updated.name}"`)
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM AssetTag WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('tag.deleted', 'AssetTag', id, `Deleted tag "${cur.name}"`)
  },
  async listForAsset(assetId: string): AssetTag[] {
    await ensure()
    const r = rows<AssetTag>(
      await db.prepare(`
        SELECT t.* FROM AssetTag t
        JOIN AssetTagLink l ON l.tagId = t.id
        WHERE l.assetId = ?
        ORDER BY t.name COLLATE NOCASE
      `).all(assetId)
    )
    return r
  },
  async attachToAsset(assetId: string, tagId: string): void {
    await ensure()
    const existing = await db.prepare('SELECT id FROM AssetTagLink WHERE assetId = ? AND tagId = ?').get(assetId, tagId)
    if (existing) return
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare('INSERT INTO AssetTagLink (id, assetId, tagId, createdAt) VALUES (?, ?, ?, ?)').run(id, assetId, tagId, now)
    const tag = await this.get(tagId)
    if (tag) activityLogRepo.log('tag.attached', 'Asset', assetId, `Tagged asset with "${tag.name}"`)
  },
  async detachFromAsset(assetId: string, tagId: string): void {
    await ensure()
    const tag = await this.get(tagId)
    await db.prepare('DELETE FROM AssetTagLink WHERE assetId = ? AND tagId = ?').run(assetId, tagId)
    if (tag) activityLogRepo.log('tag.detached', 'Asset', assetId, `Removed tag "${tag.name}" from asset`)
  },
  async setAssetTags(assetId: string, tagIds: string[]): void {
    await ensure()
    await db.prepare('DELETE FROM AssetTagLink WHERE assetId = ?').run(assetId)
    const now = new Date().toISOString()
    const ins = await db.prepare('INSERT INTO AssetTagLink (id, assetId, tagId, createdAt) VALUES (?, ?, ?, ?)')
    for (const tid of tagIds) {
      ins.run(generateId(), assetId, tid, now)
    }
  },
  async stats() {
    await ensure()
    const totalTags = (await db.prepare('SELECT COUNT(*) as c FROM AssetTag').get() as { c: number }).c
    const totalLinks = (await db.prepare('SELECT COUNT(*) as c FROM AssetTagLink').get() as { c: number }).c
    const topTags = rows<{ name: string; color: string; c: number }>(
      await db.prepare(`
        SELECT t.name, t.color, COUNT(l.id) as c
        FROM AssetTag t LEFT JOIN AssetTagLink l ON l.tagId = t.id
        GROUP BY t.id ORDER BY c DESC LIMIT 5
      `).all()
    )
    return { totalTags, totalLinks, topTags }
  },
}

// ============ Asset Bookings ============
export const assetBookingRepo = {
  async _attachRelations(b: AssetBooking): AssetBooking {
    if (!b) return b
    const asset = row<Asset>(
      await db.prepare(`
        SELECT a.*, at.name as _at_name, at.icon as _at_icon
        FROM Asset a LEFT JOIN AssetType at ON a.assetTypeId = at.id
        WHERE a.id = ?
      `).get(b.assetId)
    ) as any
    if (asset) {
      asset.assetType = asset._at_name ? { id: asset.assetTypeId, name: asset._at_name, icon: asset._at_icon } : null
    }
    const bookedBy = row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(b.bookedById))
    const approvedBy = b.approvedById
      ? row<Person>(await db.prepare('SELECT * FROM Person WHERE id = ?').get(b.approvedById))
      : null
    return { ...b, asset: asset || undefined, bookedBy: bookedBy || null, approvedBy }
  },
  async list(opts: { assetId?: string; status?: string; bookedById?: string; from?: string; to?: string; limit?: number } = {}): AssetBooking[] {
    await ensure()
    const limit = Math.min(opts.limit || 200, 1000)
    const where: string[] = []
    const params: unknown[] = []
    if (opts.assetId) { where.push('assetId = ?'); params.push(opts.assetId) }
    if (opts.status) { where.push('status = ?'); params.push(opts.status) }
    if (opts.bookedById) { where.push('bookedById = ?'); params.push(opts.bookedById) }
    if (opts.from) { where.push('endDate >= ?'); params.push(opts.from) }
    if (opts.to) { where.push('startDate <= ?'); params.push(opts.to) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const r = rows<AssetBooking>(
      await db.prepare(`SELECT * FROM AssetBooking ${whereSql} ORDER BY startDate DESC LIMIT ?`).all(...params, limit)
    )
    return r.map((b) => this._attachRelations(b))
  },
  async get(id: string): AssetBooking | null {
    await ensure()
    const b = row<AssetBooking>(await db.prepare('SELECT * FROM AssetBooking WHERE id = ?').get(id))
    if (!b) return null
    return this._attachRelations(b)
  },
  async listForAsset(assetId: string): AssetBooking[] {
    return await this.list({ assetId, limit: 100 })
  },
  // Check for overlapping active/approved bookings for the same asset
  async findConflicts(assetId: string, startDate: string, endDate: string, excludeId?: string): AssetBooking[] {
    await ensure()
    const params: unknown[] = [assetId, endDate, startDate]
    let excludeClause = ''
    if (excludeId) {
      excludeClause = ' AND id != ?'
      params.push(excludeId)
    }
    const r = rows<AssetBooking>(
      await db.prepare(`
        SELECT * FROM AssetBooking
        WHERE assetId = ?
          AND status IN ('Pending','Approved','Active')
          AND endDate >= ?
          AND startDate <= ?
          ${excludeClause}
        ORDER BY startDate
      `).all(...params)
    )
    return r.map((b) => this._attachRelations(b))
  },
  async create(data: Partial<AssetBooking>): AssetBooking {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      `INSERT INTO AssetBooking (id, assetId, bookedById, title, purpose, status, startDate, endDate, requestedById, approvedById, approvedAt, decisionNotes, checkedOutAt, checkedInAt, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.assetId, data.bookedById, data.title, data.purpose ?? null,
      data.status || 'Pending', data.startDate, data.endDate,
      data.requestedById ?? null, data.approvedById ?? null, data.approvedAt ?? null,
      data.decisionNotes ?? null, data.checkedOutAt ?? null, data.checkedInAt ?? null,
      data.notes ?? null, now, now
    )
    const b = await this.get(id)!
    activityLogRepo.log('booking.created', 'AssetBooking', id, `Booking "${b.title}" for asset ${b.asset?.assetTag || b.assetId} (${b.startDate} â†’ ${b.endDate})`)
    return b
  },
  async update(id: string, data: Partial<AssetBooking>): AssetBooking | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    const fields = ['title','purpose','status','startDate','endDate','approvedById','approvedAt','decisionNotes','checkedOutAt','checkedInAt','notes']
    const sets: string[] = []
    const params: unknown[] = []
    for (const f of fields) {
      if ((data as any)[f] !== undefined) {
        sets.push(`${f} = ?`)
        params.push((data as any)[f])
      }
    }
    sets.push('updatedAt = ?')
    params.push(now)
    params.push(id)
    await db.prepare(`UPDATE AssetBooking SET ${sets.join(', ')} WHERE id = ?`).run(...params)
    const updated = await this.get(id)!
    const statusChanged = data.status && data.status !== cur.status
    activityLogRepo.log('booking.updated', 'AssetBooking', id, `${statusChanged ? `Status ${cur.status} â†’ ${data.status} â€” ` : ''}Updated booking "${updated.title}"`)
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM AssetBooking WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('booking.deleted', 'AssetBooking', id, `Deleted booking "${cur.title}"`)
  },
  async stats() {
    await ensure()
    const total = (await db.prepare('SELECT COUNT(*) as c FROM AssetBooking').get() as { c: number }).c
    const pending = (await db.prepare(`SELECT COUNT(*) as c FROM AssetBooking WHERE status = 'Pending'`).get() as { c: number }).c
    const active = (await db.prepare(`SELECT COUNT(*) as c FROM AssetBooking WHERE status = 'Active'`).get() as { c: number }).c
    const approved = (await db.prepare(`SELECT COUNT(*) as c FROM AssetBooking WHERE status = 'Approved'`).get() as { c: number }).c
    const upcoming = (await db.prepare(`SELECT COUNT(*) as c FROM AssetBooking WHERE status IN ('Approved','Pending') AND startDate >= ?`).get(new Date().toISOString()) as { c: number }).c
    return { total, pending, active, approved, upcoming }
  },
}

// ============ Saved Reports (Round 5) ============
export const savedReportRepo = {
  async list(): SavedReport[] {
    await ensure()
    const r = rows<SavedReport & { config: string }>(
      await db.prepare('SELECT * FROM SavedReport ORDER BY updatedAt DESC').all()
    )
    return r.map((s) => ({
      ...s,
      config: safeParseConfig(s.config),
    }))
  },
  async get(id: string): SavedReport | null {
    await ensure()
    const r = row<SavedReport & { config: string }>(
      await db.prepare('SELECT * FROM SavedReport WHERE id = ?').get(id)
    )
    if (!r) return null
    return { ...r, config: safeParseConfig(r.config) }
  },
  async create(data: { name: string; description?: string; section?: string; config?: SavedReportConfig; createdBy?: string }): SavedReport {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    const cfg = JSON.stringify(data.config || {})
    await db.prepare(
      `INSERT INTO SavedReport (id, name, description, section, config, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.name, data.description ?? null, data.section ?? null, cfg, data.createdBy ?? null, now, now)
    const sr = await this.get(id)!
    activityLogRepo.log('savedreport.created', 'SavedReport', id, `Created saved report "${sr.name}"`)
    return sr
  },
  async update(id: string, data: Partial<{ name: string; description?: string | null; section?: string | null; config?: SavedReportConfig }>): SavedReport | null {
    await ensure()
    const cur = await this.get(id)
    if (!cur) return null
    const now = new Date().toISOString()
    const sets: string[] = []
    const params: unknown[] = []
    if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name) }
    if (data.description !== undefined) { sets.push('description = ?'); params.push(data.description) }
    if (data.section !== undefined) { sets.push('section = ?'); params.push(data.section) }
    if (data.config !== undefined) { sets.push('config = ?'); params.push(JSON.stringify(data.config)) }
    if (!sets.length) return cur
    sets.push('updatedAt = ?')
    params.push(now, id)
    await db.prepare(`UPDATE SavedReport SET ${sets.join(', ')} WHERE id = ?`).run(...params)
    const updated = await this.get(id)!
    activityLogRepo.log('savedreport.updated', 'SavedReport', id, `Updated saved report "${updated.name}"`)
    return updated
  },
  async delete(id: string): void {
    await ensure()
    const cur = await this.get(id)
    await db.prepare('DELETE FROM SavedReport WHERE id = ?').run(id)
    if (cur) activityLogRepo.log('savedreport.deleted', 'SavedReport', id, `Deleted saved report "${cur.name}"`)
  },
}

function safeParseConfig(s: string | null | undefined): SavedReportConfig {
  if (!s) return {}
  try { return JSON.parse(s) as SavedReportConfig } catch { return {} }
}

// ============ Vendor Performance Analytics (Round 5) ============
export const vendorPerformanceRepo = {
  async list(): VendorPerformance[] {
    await ensure()
    const vendors = rows<Vendor & { isActive: number; rating: number }>(
      await db.prepare('SELECT * FROM Vendor').all()
    )
    const result: VendorPerformance[] = []
    for (const v of vendors) {
      const pos = rows<PurchaseOrder & { receivedDate: string | null; expectedDate: string | null; status: string; totalAmount: number; orderDate: string }>(
        await db.prepare('SELECT status, totalAmount, orderDate, expectedDate, receivedDate FROM PurchaseOrder WHERE vendorId = ?').all(v.id)
      )
      const totalPOs = pos.length
      const activePOs = pos.filter((p) => ['Draft', 'Sent', 'Approved', 'Ordered', 'Partial'].includes(p.status)).length
      const completedPOs = pos.filter((p) => p.status === 'Received' || p.status === 'Closed').length
      const cancelledPOs = pos.filter((p) => p.status === 'Cancelled').length
      const totalSpent = pos
        .filter((p) => !['Draft', 'Cancelled'].includes(p.status))
        .reduce((s, p) => s + (Number(p.totalAmount) || 0), 0)

      // On-time delivery: receivedDate <= expectedDate (both must be present)
      const receivedWithExpected = pos.filter((p) => p.receivedDate && p.expectedDate)
      const onTime = receivedWithExpected.filter((p) => new Date(p.receivedDate!).getTime() <= new Date(p.expectedDate!).getTime())
      const lateDeliveries = receivedWithExpected.length - onTime.length
      const onTimeRate = receivedWithExpected.length ? onTime.length / receivedWithExpected.length : 0

      // Average delivery days (receivedDate - orderDate)
      const receivedWithOrder = pos.filter((p) => p.receivedDate && p.orderDate)
      const deliveryDays = receivedWithOrder.map((p) => {
        const diff = new Date(p.receivedDate!).getTime() - new Date(p.orderDate).getTime()
        return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
      })
      const avgDeliveryDays = deliveryDays.length
        ? Math.round(deliveryDays.reduce((s, d) => s + d, 0) / deliveryDays.length)
        : null

      result.push({
        vendorId: v.id,
        vendorName: v.name,
        category: v.category ?? null,
        rating: Number(v.rating) || 0,
        isActive: toBool(v.isActive),
        totalPOs,
        activePOs,
        completedPOs,
        cancelledPOs,
        totalSpent,
        avgDeliveryDays,
        onTimeRate,
        lateDeliveries,
      })
    }
    // Sort by total spent descending
    return result.sort((a, b) => b.totalSpent - a.totalSpent)
  },
}

// ============ Asset Lifecycle YoY Comparison (Round 5) ============
// Appended to assetRepo below via a separate export to avoid touching the giant assetRepo object.
export const assetLifecycleRepo = {
  async yoyByType(yearsBack = 2): LifecycleYoYPoint[] {
    await ensure()
    const now = new Date()
    const currentYear = now.getFullYear()
    const years: number[] = []
    for (let i = yearsBack - 1; i >= 0; i--) years.push(currentYear - i)
    // Build per-type/year purchase-cost map (use parameter binding for the IN clause)
    const placeholders = years.map(() => '?').join(',')
    const yearStrs = years.map((y) => String(y))
    const rows_ = rows<{ assetType: string; year: number; total: number }>(
      await db.prepare(`
        SELECT t.name as assetType, CAST(substr(a.purchaseDate, 1, 4) AS INTEGER) as year, COALESCE(SUM(a.cost), 0) as total
        FROM Asset a
        JOIN AssetType t ON a.assetTypeId = t.id
        WHERE a.purchaseDate IS NOT NULL
          AND substr(a.purchaseDate, 1, 4) IN (${placeholders})
        GROUP BY t.id, year
        ORDER BY t.name
      `).all(...yearStrs)
    )
    // Also enumerate all asset types so empty types still appear
    const types = rows<{ name: string }>(await db.prepare('SELECT name FROM AssetType ORDER BY name').all()).map((t) => t.name)
    const map = new Map<string, Record<number, number>>()
    for (const t of types) map.set(t, Object.fromEntries(years.map((y) => [y, 0])))
    for (const r of rows_) {
      if (!map.has(r.assetType)) map.set(r.assetType, Object.fromEntries(years.map((y) => [y, 0])))
      map.get(r.assetType)![r.year] = r.total
    }
    const curYear = years[years.length - 1]
    const prevYear = years[years.length - 2] ?? curYear
    const out: LifecycleYoYPoint[] = []
    for (const [assetType, yearMap] of map.entries()) {
      const currentYear_total = yearMap[curYear] || 0
      const previousYear_total = yearMap[prevYear] || 0
      const delta = currentYear_total - previousYear_total
      const deltaPct = previousYear_total > 0 ? delta / previousYear_total : null
      out.push({
        assetType,
        currentYear: currentYear_total,
        previousYear: previousYear_total,
        delta,
        deltaPct,
      })
    }
    return out
  },
}

// ============ Round 6: Expiration Center ============
function classifyUrgency(daysUntilExpiry: number): ExpirationUrgency {
  if (daysUntilExpiry < 0) return 'expired'
  if (daysUntilExpiry <= 30) return '30d'
  if (daysUntilExpiry <= 60) return '60d'
  if (daysUntilExpiry <= 90) return '90d'
  return 'future'
}

export const expirationRepo = {
  async list(): ExpirationReport {
    await ensure()
    const now = Date.now()
    const DAY_MS = 24 * 60 * 60 * 1000
    const items: ExpirationItem[] = []

    // Warranty expirations (Asset.warrantyExpiry)
    const warrantyRows = rows<{
      id: string; assetTag: string | null; make: string | null; model: string | null;
      serialNumber: string | null; warrantyExpiry: string; cost: number | null;
      currency: string; assetTypeId: string; assetTypeName: string;
      departmentId: string | null; departmentName: string | null;
    }>(
      await db.prepare(`
        SELECT a.id, a.assetTag, a.make, a.model, a.serialNumber, a.warrantyExpiry,
               a.cost, a.currency, a.assetTypeId, t.name as assetTypeName,
               a.departmentId, d.name as departmentName
        FROM Asset a
        LEFT JOIN AssetType t ON a.assetTypeId = t.id
        LEFT JOIN Department d ON a.departmentId = d.id
        WHERE a.warrantyExpiry IS NOT NULL AND a.warrantyExpiry != ''
          AND a.status NOT IN ('Retired', 'Lost')
        ORDER BY a.warrantyExpiry ASC
      `).all()
    )

    for (const r of warrantyRows) {
      const exp = new Date(r.warrantyExpiry).getTime()
      if (isNaN(exp)) continue
      const days = Math.floor((exp - now) / DAY_MS)
      items.push({
        id: `warr-${r.id}`,
        kind: 'warranty',
        name: `${r.make || ''} ${r.model || ''}`.trim() || r.assetTag || r.serialNumber || 'Asset',
        subtitle: r.serialNumber || r.assetTag,
        entityId: r.id,
        entityType: 'Asset',
        expiryDate: r.warrantyExpiry,
        daysUntilExpiry: days,
        urgency: classifyUrgency(days),
        cost: r.cost != null ? Number(r.cost) : null,
        currency: r.currency,
        meta: {
          assetTag: r.assetTag,
          assetType: r.assetTypeName,
          department: r.departmentName,
        },
      })
    }

    // License expirations (SoftwareLicense.expiryDate)
    const licenseRows = rows<{
      id: string; name: string; vendor: string | null; key: string | null;
      expiryDate: string; cost: number | null; currency: string;
      seatsTotal: number; seatsUsed: number; category: string | null;
    }>(
      await db.prepare(`
        SELECT id, name, vendor, key, expiryDate, cost, currency,
               seatsTotal, seatsUsed, category
        FROM SoftwareLicense
        WHERE expiryDate IS NOT NULL AND expiryDate != ''
        ORDER BY expiryDate ASC
      `).all()
    )

    for (const r of licenseRows) {
      const exp = new Date(r.expiryDate).getTime()
      if (isNaN(exp)) continue
      const days = Math.floor((exp - now) / DAY_MS)
      items.push({
        id: `lic-${r.id}`,
        kind: 'license',
        name: r.name,
        subtitle: r.vendor ? `Vendor: ${r.vendor}` : null,
        entityId: r.id,
        entityType: 'SoftwareLicense',
        expiryDate: r.expiryDate,
        daysUntilExpiry: days,
        urgency: classifyUrgency(days),
        cost: r.cost != null ? Number(r.cost) : null,
        currency: r.currency,
        meta: {
          vendor: r.vendor,
          category: r.category,
          seats: `${r.seatsUsed}/${r.seatsTotal}`,
        },
      })
    }

    // Sort by expiry date ascending
    items.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

    const totals = {
      expired: items.filter((i) => i.urgency === 'expired').length,
      within30: items.filter((i) => i.urgency === '30d').length,
      within60: items.filter((i) => i.urgency === '60d').length,
      within90: items.filter((i) => i.urgency === '90d').length,
      future: items.filter((i) => i.urgency === 'future').length,
      total: items.length,
      exposedValue: items
        .filter((i) => i.urgency !== 'future' && i.cost != null)
        .reduce((s, i) => s + (i.cost || 0), 0),
    }

    return { items, totals }
  },
}

// ============ Round 6: Utilization Dashboard ============
function bucketFromRows(
  bucketId: string,
  bucketName: string,
  assetRows: Array<{ status: string; createdAt?: string | null; purchaseDate?: string | null }>
): UtilizationByBucket {
  const total = assetRows.length
  const inUse = assetRows.filter((a) => a.status === 'In Use').length
  const inStock = assetRows.filter((a) => a.status === 'In Stock').length
  const repair = assetRows.filter((a) => a.status === 'Repair').length
  const retired = assetRows.filter((a) => a.status === 'Retired').length
  const lost = assetRows.filter((a) => a.status === 'Lost').length
  const eligible = total - retired - lost
  // Idle days: oldest in-stock asset's days since createdAt
  let idleDays: number | null = null
  const stockRows = assetRows.filter((a) => a.status === 'In Stock' && (a.createdAt || a.purchaseDate))
  if (stockRows.length) {
    const oldest = stockRows.reduce((min, r) => {
      const d = new Date(r.createdAt || r.purchaseDate || '').getTime()
      return d < min ? d : min
    }, Date.now())
    idleDays = Math.max(0, Math.floor((Date.now() - oldest) / (24 * 60 * 60 * 1000)))
  }
  return {
    bucketId,
    bucketName,
    total,
    inUse,
    inStock,
    repair,
    retired,
    lost,
    utilizationRate: eligible > 0 ? inUse / eligible : 0,
    idleDays,
  }
}

export const utilizationRepo = {
  async report(idleThresholdDays: 30 | 60 | 90 | 180 = 30): UtilizationReport {
    await ensure()
    const allAssets = rows<{
      id: string; assetTag: string | null; make: string | null; model: string | null;
      serialNumber: string | null; status: string; purchaseDate: string | null;
      createdAt: string; assetTypeId: string; assetTypeName: string;
      departmentId: string | null; departmentName: string | null;
      locationId: string | null; locationName: string | null;
    }>(
      await db.prepare(`
        SELECT a.id, a.assetTag, a.make, a.model, a.serialNumber, a.status,
               a.purchaseDate, a.createdAt, a.assetTypeId,
               t.name as assetTypeName,
               a.departmentId, d.name as departmentName,
               a.locationId, l.name as locationName
        FROM Asset a
        LEFT JOIN AssetType t ON a.assetTypeId = t.id
        LEFT JOIN Department d ON a.departmentId = d.id
        LEFT JOIN Location l ON a.locationId = l.id
      `).all()
    )

    // Overall
    const overall = bucketFromRows('overall', 'All Assets', allAssets) as UtilizationByBucket & { idleCount?: number }

    // By Department
    const byDeptMap = new Map<string, UtilizationByBucket>()
    const depts = rows<{ id: string; name: string }>(await db.prepare('SELECT id, name FROM Department').all())
    for (const d of depts) {
      const rowsForDept = allAssets.filter((a) => a.departmentId === d.id)
      byDeptMap.set(d.id, bucketFromRows(d.id, d.name, rowsForDept))
    }

    // By Asset Type
    const byTypeMap = new Map<string, UtilizationByBucket>()
    const types = rows<{ id: string; name: string }>(await db.prepare('SELECT id, name FROM AssetType').all())
    for (const t of types) {
      const rowsForType = allAssets.filter((a) => a.assetTypeId === t.id)
      byTypeMap.set(t.id, bucketFromRows(t.id, t.name, rowsForType))
    }

    // Idle assets: In Stock for > idleThresholdDays (Round 8: configurable)
    const DAY_MS = 24 * 60 * 60 * 1000
    const idleAssets: IdleAsset[] = allAssets
      .filter((a) => a.status === 'In Stock')
      .map((a) => {
        const created = new Date(a.createdAt).getTime()
        const days = Math.floor((Date.now() - created) / DAY_MS)
        return {
          id: a.id,
          assetTag: a.assetTag,
          name: `${a.make || ''} ${a.model || ''}`.trim() || a.assetTag || a.serialNumber || 'Asset',
          serialNumber: a.serialNumber,
          status: a.status,
          purchaseDate: a.purchaseDate,
          daysIdle: isNaN(days) ? 0 : days,
          departmentName: a.departmentName,
          locationName: a.locationName,
        }
      })
      .filter((a) => a.daysIdle >= idleThresholdDays)
      .sort((a, b) => b.daysIdle - a.daysIdle)

    return {
      byDepartment: Array.from(byDeptMap.values()).sort((a, b) => b.utilizationRate - a.utilizationRate),
      byAssetType: Array.from(byTypeMap.values()).sort((a, b) => b.utilizationRate - a.utilizationRate),
      overall: {
        totalAssets: overall.total,
        inUse: overall.inUse,
        inStock: overall.inStock,
        repair: overall.repair,
        retired: overall.retired,
        lost: overall.lost,
        utilizationRate: overall.utilizationRate,
        idleCount: idleAssets.length,
      },
      idleAssets,
    }
  },
}

// ============ Round 6: Maintenance Cost Analytics ============
export const maintenanceCostRepo = {
  async report(monthsBack = 12): MaintenanceCostReport {
    await ensure()
    const now = new Date()
    const cutoff = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1)

    // All maintenance with cost
    const allMaint = rows<{
      id: string; assetId: string; type: string; title: string; status: string;
      scheduledFor: string; completedAt: string | null; cost: number | null;
      createdAt: string;
      assetTag: string | null; make: string | null; model: string | null;
      assetTypeName: string;
    }>(
      await db.prepare(`
        SELECT m.id, m.assetId, m.type, m.title, m.status, m.scheduledFor, m.completedAt,
               m.cost, m.createdAt,
               a.assetTag, a.make, a.model,
               t.name as assetTypeName
        FROM MaintenanceSchedule m
        JOIN Asset a ON m.assetId = a.id
        LEFT JOIN AssetType t ON a.assetTypeId = t.id
        WHERE m.cost IS NOT NULL AND m.cost > 0
      `).all()
    )

    // By type
    const byTypeMap = new Map<string, { totalCost: number; eventCount: number; assetCount: Set<string> }>()
    for (const m of allMaint) {
      const key = m.assetTypeName || 'Unknown'
      if (!byTypeMap.has(key)) byTypeMap.set(key, { totalCost: 0, eventCount: 0, assetCount: new Set() })
      const e = byTypeMap.get(key)!
      e.totalCost += Number(m.cost) || 0
      e.eventCount += 1
      e.assetCount.add(m.assetId)
    }
    const byType = Array.from(byTypeMap.entries())
      .map(([assetType, e]) => ({
        assetType,
        totalCost: e.totalCost,
        eventCount: e.eventCount,
        avgCost: e.eventCount ? e.totalCost / e.eventCount : 0,
        assetCount: e.assetCount.size,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)

    // Trend: by month (YYYY-MM)
    const trendMap = new Map<string, { totalCost: number; eventCount: number }>()
    // Build month buckets for the past N months
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      trendMap.set(k, { totalCost: 0, eventCount: 0 })
    }
    for (const m of allMaint) {
      const d = new Date(m.scheduledFor || m.completedAt || m.createdAt)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (trendMap.has(k)) {
        const e = trendMap.get(k)!
        e.totalCost += Number(m.cost) || 0
        e.eventCount += 1
      }
    }
    const trend = Array.from(trendMap.entries()).map(([month, e]) => ({
      month,
      totalCost: e.totalCost,
      eventCount: e.eventCount,
    }))

    // Top assets by maintenance cost
    const assetMap = new Map<string, { assetId: string; assetTag: string | null; assetName: string; assetTypeName: string; totalCost: number; eventCount: number; lastMaintenanceAt: number }>()
    for (const m of allMaint) {
      if (!assetMap.has(m.assetId)) {
        assetMap.set(m.assetId, {
          assetId: m.assetId,
          assetTag: m.assetTag,
          assetName: `${m.make || ''} ${m.model || ''}`.trim() || m.assetTag || m.assetId,
          assetTypeName: m.assetTypeName,
          totalCost: 0,
          eventCount: 0,
          lastMaintenanceAt: 0,
        })
      }
      const e = assetMap.get(m.assetId)!
      e.totalCost += Number(m.cost) || 0
      e.eventCount += 1
      const ts = new Date(m.scheduledFor || m.completedAt || m.createdAt).getTime()
      if (ts > e.lastMaintenanceAt) e.lastMaintenanceAt = ts
    }
    const topAssets = Array.from(assetMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 8)
      .map((a) => ({
        assetId: a.assetId,
        assetTag: a.assetTag,
        assetName: a.assetName,
        assetTypeName: a.assetTypeName,
        totalCost: a.totalCost,
        eventCount: a.eventCount,
        lastMaintenanceAt: a.lastMaintenanceAt ? new Date(a.lastMaintenanceAt).toISOString() : null,
      }))

    const totalCost = allMaint.reduce((s, m) => s + (Number(m.cost) || 0), 0)
    const totalEvents = allMaint.length
    const avgCostPerEvent = totalEvents ? totalCost / totalEvents : 0

    // Trend delta: last month vs previous month
    let trendDeltaPct: number | null = null
    if (trend.length >= 2) {
      const last = trend[trend.length - 1].totalCost
      const prev = trend[trend.length - 2].totalCost
      if (prev > 0) trendDeltaPct = (last - prev) / prev
    }

    return {
      byType,
      trend,
      topAssets,
      totals: {
        totalCost,
        totalEvents,
        avgCostPerEvent,
        trendDeltaPct,
      },
    }
  },
}


// ============ Round 7: Asset Timeline ============
export const assetTimelineRepo = {
  async getForAsset(assetId: string): AssetTimeline | null {
    await ensure()
    const asset = row<{ id: string; assetTag: string | null; make: string | null; model: string | null; serialNumber: string | null; createdAt: string; status: string }>(
      await db.prepare('SELECT id, assetTag, make, model, serialNumber, createdAt, status FROM Asset WHERE id = ?').get(assetId)
    )
    if (!asset) return null

    const events: TimelineEvent[] = []
    const assetName = `${asset.make || ''} ${asset.model || ''}`.trim() || asset.assetTag || asset.serialNumber || 'Asset'

    // 1. Creation event
    events.push({
      id: `created-${asset.id}`,
      type: 'created',
      timestamp: asset.createdAt,
      title: 'Asset added to inventory',
      description: `Initial registration${asset.status ? ` Â· status: ${asset.status}` : ''}`,
      icon: 'Plus',
    })

    // 2. Assignment history
    const history = rows<AssignmentHistory & { assignedToName: string | null; assignedToDept: string | null }>(
      await db.prepare(`
        SELECT h.*, p.fullName as assignedToName, d.name as assignedToDept
        FROM AssignmentHistory h
        LEFT JOIN Person p ON h.personId = p.id
        LEFT JOIN Department d ON h.departmentId = d.id
        WHERE h.assetId = ?
        ORDER BY h.assignedOn DESC
      `).all(assetId)
    )
    for (const h of history) {
      const isAssign = !!(h.personId || h.departmentId)
      events.push({
        id: `hist-${h.id}`,
        type: isAssign ? 'assigned' : 'unassigned',
        timestamp: h.assignedOn,
        title: isAssign ? `Assigned to ${h.assignedToName || h.assignedToDept || 'recipient'}` : 'Unassigned',
        description: h.notes || h.reason || (isAssign ? 'Asset allocated' : 'Asset returned to inventory'),
        icon: isAssign ? 'UserPlus' : 'UserMinus',
        actorName: h.assignedToName || h.assignedToDept,
        meta: { department: h.assignedToDept },
      })
    }

    // 3. Maintenance events
    const maint = rows<{ id: string; type: string; title: string; status: string; scheduledFor: string; completedAt: string | null; cost: number | null; performedBy: string | null; notes: string | null }>(
      await db.prepare(`
        SELECT id, type, title, status, scheduledFor, completedAt, cost, performedBy, notes
        FROM MaintenanceSchedule
        WHERE assetId = ?
        ORDER BY scheduledFor DESC
      `).all(assetId)
    )
    for (const m of maint) {
      let type: TimelineEvent['type'] = 'maintenance.scheduled'
      let title = `Maintenance scheduled: ${m.title}`
      if (m.status === 'Completed') {
        type = 'maintenance.completed'
        title = `Maintenance completed: ${m.title}`
      } else if (m.status === 'Cancelled') {
        type = 'maintenance.cancelled'
        title = `Maintenance cancelled: ${m.title}`
      }
      events.push({
        id: `maint-${m.id}`,
        type,
        timestamp: m.completedAt || m.scheduledFor,
        title,
        description: m.notes || `${m.type} maintenance Â· ${m.status}${m.cost ? ` Â· $${Number(m.cost).toFixed(2)}` : ''}`,
        icon: 'Wrench',
        actorName: m.performedBy,
        meta: { cost: m.cost, type: m.type, status: m.status },
      })
    }

    // 4. Bookings
    const bookings = rows<{ id: string; title: string; status: string; startDate: string; endDate: string; bookedByName: string | null }>(
      await db.prepare(`
        SELECT b.id, b.title, b.status, b.startDate, b.endDate, p.fullName as bookedByName
        FROM AssetBooking b
        LEFT JOIN Person p ON b.bookedById = p.id
        WHERE b.assetId = ?
        ORDER BY b.startDate DESC
      `).all(assetId)
    )
    for (const b of bookings) {
      const isCompleted = b.status === 'Completed' || b.status === 'Cancelled'
      events.push({
        id: `book-${b.id}`,
        type: isCompleted ? 'booking.completed' : 'booking.created',
        timestamp: isCompleted ? b.endDate : b.startDate,
        title: `${isCompleted ? 'Booking ended' : 'Booking created'}: ${b.title}`,
        description: `${b.startDate.slice(0, 10)} â†’ ${b.endDate.slice(0, 10)} Â· ${b.status}`,
        icon: 'CalendarClock',
        actorName: b.bookedByName,
      })
    }

    // 5. License allocations
    const allocs = rows<{ id: string; licenseId: string; licenseName: string; allocatedAt: string }>(
      await db.prepare(`
        SELECT al.id, al.licenseId, sl.name as licenseName, al.createdAt as allocatedAt
        FROM AssetLicense al
        JOIN SoftwareLicense sl ON al.licenseId = sl.id
        WHERE al.assetId = ?
        ORDER BY al.createdAt DESC
      `).all(assetId)
    )
    for (const a of allocs) {
      events.push({
        id: `lic-${a.id}`,
        type: 'license.allocated',
        timestamp: a.allocatedAt,
        title: `License allocated: ${a.licenseName}`,
        description: 'Software license assigned to this asset',
        icon: 'KeyRound',
      })
    }

    // 6. Images
    const images = rows<{ id: string; createdAt: string }>(
      await db.prepare('SELECT id, createdAt FROM AssetImage WHERE assetId = ? ORDER BY createdAt DESC').all(assetId)
    )
    for (const i of images) {
      events.push({
        id: `img-${i.id}`,
        type: 'image.added',
        timestamp: i.createdAt,
        title: 'Image uploaded',
        description: 'Asset photo added to gallery',
        icon: 'Image',
      })
    }

    // 7. Disposal (if any)
    const disposal = row<{ id: string; method: string; disposalDate: string; reason: string | null }>(
      await db.prepare('SELECT id, method, disposalDate, reason FROM AssetDisposal WHERE assetId = ?').get(assetId)
    )
    if (disposal) {
      events.push({
        id: `disp-${disposal.id}`,
        type: 'disposal',
        timestamp: disposal.disposalDate,
        title: `Asset disposed via ${disposal.method}`,
        description: disposal.reason || 'Asset removed from active inventory',
        icon: 'Trash2',
      })
    }

    // 8. Round 8: Checkout / Check-in events
    const checkouts = rows<{
      id: string
      requestType: string
      status: string
      reason: string | null
      requestedStartDate: string
      requestedReturnDate: string | null
      checkedOutAt: string | null
      checkedInAt: string | null
      actualReturnDate: string | null
      conditionAtReturn: string | null
      requesterName: string | null
    }>(
      await db.prepare(`
        SELECT c.id, c.requestType, c.status, c.reason, c.requestedStartDate, c.requestedReturnDate,
               c.checkedOutAt, c.checkedInAt, c.actualReturnDate, c.conditionAtReturn,
               p.fullName as requesterName
        FROM CheckoutRequest c
        LEFT JOIN Person p ON c.requestedById = p.id
        WHERE c.assetId = ?
        ORDER BY c.updatedAt DESC
      `).all(assetId)
    )
    for (const c of checkouts) {
      // Check-out event (when asset was actually checked out)
      if (c.checkedOutAt) {
        events.push({
          id: `co-out-${c.id}`,
          type: 'checkout',
          timestamp: c.checkedOutAt,
          title: `Checked out${c.requesterName ? ` to ${c.requesterName}` : ''}`,
          description: c.reason || `Return expected ${c.requestedReturnDate ? c.requestedReturnDate.slice(0, 10) : 'â€”'}`,
          icon: 'ArrowUpRight',
          actorName: c.requesterName,
        })
      }
      // Check-in event (when asset was returned / checked back in)
      if (c.checkedInAt || c.actualReturnDate) {
        events.push({
          id: `co-in-${c.id}`,
          type: 'checkin',
          timestamp: c.actualReturnDate || c.checkedInAt || c.requestedStartDate,
          title: `Checked in${c.requesterName ? ` from ${c.requesterName}` : ''}`,
          description: c.conditionAtReturn ? `Returned Â· condition: ${c.conditionAtReturn}` : 'Asset returned to inventory',
          icon: 'ArrowDownLeft',
          actorName: c.requesterName,
        })
      }
      // Pending / Approved / Rejected status events (only when no checkout happened yet)
      if (!c.checkedOutAt && (c.status === 'Pending' || c.status === 'Approved' || c.status === 'Rejected')) {
        events.push({
          id: `co-req-${c.id}`,
          type: 'checkout',
          timestamp: c.requestedStartDate,
          title: `${c.requestType} request ${c.status.toLowerCase()}`,
          description: c.reason || `Requester: ${c.requesterName || 'â€”'}`,
          icon: 'ClipboardList',
          actorName: c.requesterName,
        })
      }
    }

    // Sort all events by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const stats = {
      totalEvents: events.length,
      assignmentCount: events.filter((e) => e.type === 'assigned' || e.type === 'unassigned').length,
      maintenanceCount: events.filter((e) => String(e.type).startsWith('maintenance')).length,
      bookingCount: events.filter((e) => String(e.type).startsWith('booking')).length,
      checkoutCount: events.filter((e) => e.type === 'checkout' || e.type === 'checkin').length,
      licenseCount: events.filter((e) => String(e.type).startsWith('license')).length,
      imageCount: events.filter((e) => String(e.type).startsWith('image')).length,
      firstEventAt: events.length ? events[events.length - 1].timestamp : null,
      lastEventAt: events.length ? events[0].timestamp : null,
    }

    return {
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName,
      events,
      stats,
    }
  },
}

// ============ Round 7: PO Receiving Workflow ============
export const poReceivingRepo = {
  async receiveItems(poId: string, items: POReceiveItemPayload[]): POReceiveResult | null {
    await ensure()
    const po = purchaseOrderRepo.get(poId)
    if (!po) return null
    if (!po.items || po.items.length === 0) return null
    if (!['Approved', 'Ordered', 'Partially Received'].includes(po.status)) {
      throw new Error(`PO must be in Approved, Ordered, or Partially Received state to receive items (current: ${po.status})`)
    }

    // Round 8 fix: validate that at least one item will be advanced with a positive qty.
    // Pre-filter the items so we can refuse empty/zero submissions before any DB writes.
    const effectiveItems = items
      .map((payload) => {
        const item = po.items!.find((i) => i.id === payload.itemId)
        if (!item) return null
        const receivedNow = Math.max(0, Math.floor(Number(payload.receivedQty) || 0))
        if (receivedNow === 0) return null
        // Clamp so we don't receive more than the line allows
        const newTotal = Math.min(item.quantity, item.receivedQuantity + receivedNow)
        const actuallyReceived = newTotal - item.receivedQuantity
        if (actuallyReceived <= 0) return null
        return { item, receivedNow, newTotal, actuallyReceived }
      })
      .filter((x): x is { item: typeof po.items[number]; receivedNow: number; newTotal: number; actuallyReceived: number } => x !== null)

    if (effectiveItems.length === 0) {
      throw new Error('No items were advanced. Provide at least one itemId with a positive receivedQty greater than the previously received quantity.')
    }

    const now = new Date().toISOString()
    const receivedItems: POReceiveResult['receivedItems'] = []
    const createdAssets: POReceiveResult['createdAssets'] = []
    let allReceived = true

    // Look up the AssetType for tag generation (each item may have its own assetTypeId)
    for (const { item, newTotal, actuallyReceived } of effectiveItems) {
      await db.prepare('UPDATE PurchaseOrderItem SET receivedQuantity = ? WHERE id = ?').run(newTotal, item.id)
      const fullyReceived = newTotal >= item.quantity
      if (!fullyReceived) allReceived = false

      // Round 8: auto-create Asset rows for items with an assetTypeId.
      // One Asset per newly received unit (NOT for previously received quantity).
      const newAssetIds: string[] = []
      const newAssetTags: string[] = []
      if (item.assetTypeId && actuallyReceived > 0) {
        const at = row<{ id: string; name: string }>(
          await db.prepare('SELECT id, name FROM AssetType WHERE id = ?').get(item.assetTypeId)
        )
        if (at) {
          for (let i = 0; i < actuallyReceived; i++) {
            const assetId = generateId()
            const tag = await generateSequentialAssetTag(at.name)
            const cols = [
              'id', 'assetTag', 'assetTypeId', 'make', 'model', 'status',
              'purchaseDate', 'cost', 'currency', 'comments', 'createdAt', 'updatedAt',
            ]
            const vals = [
              assetId,
              tag,
              item.assetTypeId,
              null,
              null,
              'In Stock',
              po.orderDate,
              item.unitPrice,
              po.currency || 'USD',
              `Auto-created from PO ${po.poNumber} Â· "${item.description}"`,
              now,
              now,
            ]
            const ph = cols.map(() => '?').join(', ')
            await db.prepare(`INSERT INTO Asset (${cols.join(', ')}) VALUES (${ph})`).run(...vals)
            await logAssetActivity('asset.created', assetId, `Auto-created from PO ${po.poNumber} (line item: ${item.description})`)
            newAssetIds.push(assetId)
            newAssetTags.push(tag)
          }
          activityLogRepo.log(
            'po.assets.created',
            'PurchaseOrder',
            poId,
            `PO ${po.poNumber} receiving auto-created ${newAssetIds.length} asset(s) for "${item.description}"`
          )
        }
      }

      receivedItems.push({
        itemId: item.id,
        description: item.description,
        receivedNow: actuallyReceived,
        totalReceived: newTotal,
        quantity: item.quantity,
        fullyReceived,
      })
      if (newAssetIds.length > 0) {
        createdAssets.push({ itemId: item.id, assetIds: newAssetIds, assetTags: newAssetTags })
      }
      activityLogRepo.log(
        'po.item.received',
        'PurchaseOrderItem',
        item.id,
        `Received ${actuallyReceived} of "${item.description}" (total ${newTotal}/${item.quantity}) for PO ${po.poNumber}${newAssetIds.length ? ` Â· created ${newAssetIds.length} asset(s)` : ''}`
      )
    }

    // Update PO status + receivedDate
    const newStatus = allReceived ? 'Received' : 'Partially Received'
    await db.prepare('UPDATE PurchaseOrder SET status = ?, receivedDate = ?, updatedAt = ? WHERE id = ?').run(
      newStatus,
      allReceived ? now : null,
      now,
      poId
    )
    activityLogRepo.log(
      'po.received',
      'PurchaseOrder',
      poId,
      allReceived
        ? `PO ${po.poNumber} fully received (${receivedItems.length} items${createdAssets.length ? `, ${createdAssets.reduce((s, c) => s + c.assetIds.length, 0)} assets auto-created` : ''})`
        : `PO ${po.poNumber} partially received (${receivedItems.length} items updated)`
    )

    const updatedPo = purchaseOrderRepo.get(poId)!
    return { po: updatedPo, receivedItems, allItemsReceived: allReceived, createdAssets }
  },
}

// ============ Round 8: helper â€” sequential asset tag generator ============
// Builds tags like LAPTOP-0007, MON-0012 etc. using AssetType.prefix (or name slug)
// and the current highest count for that type to keep tags sequential.
async function generateSequentialAssetTag(prefixOrName: string): Promise<string> {
  await ensure()
  const slug = (prefixOrName || 'ASSET')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8) || 'ASSET'
  // Count existing assets of any type whose assetTag starts with this slug + '-'
  const row = (await db
    .prepare("SELECT assetTag FROM Asset WHERE assetTag LIKE ? ORDER BY assetTag DESC LIMIT 1")
    .get(`${slug}-%`)) as { assetTag: string } | undefined
  let next = 1
  if (row && row.assetTag) {
    const m = row.assetTag.match(/(\d+)$/)
    if (m) next = parseInt(m[1], 10) + 1
  }
  return `${slug}-${String(next).padStart(4, '0')}`
}

// ============ Round 8: Expiry Renew Workflow ============
export const expiryRenewRepo = {
  /**
   * Creates a draft Purchase Order that represents the renewal of either:
   *   - an asset's warranty (assetId provided), or
   *   - a software license (licenseId provided)
   * Returns the new PO + the renewed item descriptor.
   */
  async renew(payload: ExpiryRenewPayload): ExpiryRenewResult {
    await ensure()
    if (!payload.vendorId) throw new Error('vendorId is required')
    if (!payload.assetId && !payload.licenseId) {
      throw new Error('Either assetId or licenseId must be provided')
    }

    let entityName = ''
    let currentExpiry: string | null = null
    let description = ''
    let unitPrice = 0
    let assetTypeId: string | null = null

    if (payload.assetId) {
      const asset = row<{ id: string; assetTag: string | null; make: string | null; model: string | null; warrantyExpiry: string | null; cost: number | null; assetTypeId: string }>(
        await db.prepare('SELECT id, assetTag, make, model, warrantyExpiry, cost, assetTypeId FROM Asset WHERE id = ?').get(payload.assetId)
      )
      if (!asset) throw new Error('Asset not found')
      entityName = `${asset.make || ''} ${asset.model || ''}`.trim() || asset.assetTag || asset.id.slice(0, 8)
      currentExpiry = asset.warrantyExpiry
      description = `Warranty renewal for ${entityName}${asset.assetTag ? ` (${asset.assetTag})` : ''}`
      unitPrice = Number(asset.cost) || 0
      assetTypeId = asset.assetTypeId
    } else if (payload.licenseId) {
      const lic = row<{ id: string; name: string; vendor: string | null; expiryDate: string | null; cost: number | null; seatsTotal: number }>(
        await db.prepare('SELECT id, name, vendor, expiryDate, cost, seatsTotal FROM SoftwareLicense WHERE id = ?').get(payload.licenseId)
      )
      if (!lic) throw new Error('Software license not found')
      entityName = lic.name
      currentExpiry = lic.expiryDate
      description = `License renewal for ${lic.name}`
      // Use total cost (cost Ã— seatsTotal) when available, otherwise fall back to flat cost
      unitPrice = Number(lic.cost) || 0
    }

    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    // Generate PO number: RENEW-YYYYMMDD-HHMMSS-XXXX (4-char random suffix prevents collision
    // when multiple renewals happen in the same second â€” Round 9 fix)
    const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const poNumber = `RENEW-${today.replace(/-/g, '')}-${now.slice(11, 19).replace(/:/g, '')}-${randSuffix}`

    const poId = generateId()
    const expectedDate = payload.expectedDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    await db.prepare(`
      INSERT INTO PurchaseOrder (id, poNumber, vendorId, status, orderDate, expectedDate, subtotal, taxRate, taxAmount, shippingCost, totalAmount, currency, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, 'Draft', ?, ?, ?, 0, 0, 0, ?, 'USD', ?, ?, ?)
    `).run(
      poId,
      poNumber,
      payload.vendorId,
      today,
      expectedDate,
      unitPrice,
      unitPrice,
      payload.notes || `${description}${currentExpiry ? ` Â· current expiry ${currentExpiry.slice(0, 10)}` : ''}`,
      now,
      now
    )

    // Create one line item describing the renewal
    const itemId = generateId()
    await db.prepare(`
      INSERT INTO PurchaseOrderItem (id, poId, assetTypeId, description, quantity, unitPrice, totalPrice, receivedQuantity, notes, createdAt)
      VALUES (?, ?, ?, ?, 1, ?, ?, 0, ?, ?)
    `).run(
      itemId,
      poId,
      assetTypeId,
      description,
      unitPrice,
      unitPrice,
      `Auto-generated renewal PO for ${payload.assetId ? 'warranty' : 'license'} expiry`,
      now
    )

    activityLogRepo.log(
      'po.renew.created',
      'PurchaseOrder',
      poId,
      `Renewal PO ${poNumber} drafted for ${payload.assetId ? 'asset warranty' : 'software license'}: ${entityName}`
    )

    const renewedItem: ExpiryRenewResult['renewedItem'] = {
      expiryType: payload.assetId ? 'warranty' : 'license',
      entityId: payload.assetId || payload.licenseId!,
      entityName,
      currentExpiry,
    }

    return {
      po: purchaseOrderRepo.get(poId)!,
      renewedItem,
    }
  },
}

// ============ Round 7: Asset Location Map ============
export const assetLocationMapRepo = {
  async report(): AssetLocationMapReport {
    await ensure()
    const locations = rows<{ id: string; name: string; address: string | null }>(
      await db.prepare('SELECT id, name, address FROM Location ORDER BY name').all()
    )
    const allAssets = rows<{
      id: string; assetTag: string | null; make: string | null; model: string | null; status: string;
      cost: number | null; locationId: string | null; assetTypeName: string;
    }>(
      await db.prepare(`
        SELECT a.id, a.assetTag, a.make, a.model, a.status, a.cost, a.locationId, t.name as assetTypeName
        FROM Asset a
        LEFT JOIN AssetType t ON a.assetTypeId = t.id
      `).all()
    )

    const locationSummaries: LocationAssetSummary[] = locations.map((loc) => {
      const assets = allAssets.filter((a) => a.locationId === loc.id)
      const total = assets.length
      const inUse = assets.filter((a) => a.status === 'In Use').length
      const inStock = assets.filter((a) => a.status === 'In Stock').length
      const repair = assets.filter((a) => a.status === 'Repair').length
      const retired = assets.filter((a) => a.status === 'Retired').length
      const lost = assets.filter((a) => a.status === 'Lost').length
      const eligible = total - retired - lost
      const totalValue = assets.reduce((s, a) => s + (Number(a.cost) || 0), 0)
      // By type
      const typeMap = new Map<string, number>()
      for (const a of assets) {
        const t = a.assetTypeName || 'Unknown'
        typeMap.set(t, (typeMap.get(t) || 0) + 1)
      }
      const byType = Array.from(typeMap.entries())
        .map(([assetType, count]) => ({ assetType, count }))
        .sort((a, b) => b.count - a.count)
      // Top assets (active first)
      const topAssets = assets
        .slice()
        .sort((a, b) => (a.status === 'In Use' ? -1 : 1) - (b.status === 'In Use' ? -1 : 1))
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          assetTag: a.assetTag,
          name: `${a.make || ''} ${a.model || ''}`.trim() || a.assetTag || a.id,
          status: a.status,
          assetType: a.assetTypeName || 'Unknown',
        }))
      return {
        locationId: loc.id,
        locationName: loc.name,
        address: loc.address,
        totalAssets: total,
        inUse,
        inStock,
        repair,
        retired,
        lost,
        utilizationRate: eligible > 0 ? inUse / eligible : 0,
        totalValue,
        byType,
        topAssets,
      }
    })

    // Unassigned assets (no locationId)
    const unassignedAssets = allAssets.filter((a) => !a.locationId)
    const unassignedValue = unassignedAssets.reduce((s, a) => s + (Number(a.cost) || 0), 0)

    const totalAssets = allAssets.length
    const totalValue = allAssets.reduce((s, a) => s + (Number(a.cost) || 0), 0)
    const totalEligible = totalAssets - allAssets.filter((a) => a.status === 'Retired' || a.status === 'Lost').length
    const totalInUse = allAssets.filter((a) => a.status === 'In Use').length
    const avgUtilization = totalEligible > 0 ? totalInUse / totalEligible : 0

    return {
      locations: locationSummaries,
      totals: {
        totalLocations: locations.length,
        totalAssets,
        totalValue,
        avgUtilization,
      },
      unassigned: {
        count: unassignedAssets.length,
        value: unassignedValue,
      },
    }
  },
}

// ============ Round 7: Cost Forecast Analytics ============
function linearRegression(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length
  if (n === 0) return { slope: 0, intercept: 0 }
  if (n === 1) return { slope: 0, intercept: ys[0] }
  const xs = ys.map((_, i) => i)
  const meanX = xs.reduce((s, x) => s + x, 0) / n
  const meanY = ys.reduce((s, y) => s + y, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

export const costForecastRepo = {
  async report(historyMonths = 12, forecastMonths = 6): CostForecastReport {
    await ensure()
    const now = new Date()
    // Build month buckets for history + forecast
    const historyStart = addMonths(now, -(historyMonths - 1))
    const allMonths: string[] = []
    for (let i = 0; i < historyMonths + forecastMonths; i++) {
      allMonths.push(monthKey(addMonths(historyStart, i)))
    }
    const historyKeys = new Set(allMonths.slice(0, historyMonths))
    const forecastKeys = new Set(allMonths.slice(historyMonths))

    // Purchase cost history (from Asset.purchaseDate)
    const purchaseRows = rows<{ month: string; total: number }>(
      await db.prepare(`
        SELECT substr(purchaseDate, 1, 7) as month, COALESCE(SUM(cost), 0) as total
        FROM Asset
        WHERE purchaseDate IS NOT NULL AND cost IS NOT NULL
          AND substr(purchaseDate, 1, 7) IN (${allMonths.map(() => '?').join(',')})
        GROUP BY month
      `).all(...allMonths)
    )
    const purchaseMap = new Map(purchaseRows.map((r) => [r.month, Number(r.total) || 0]))

    // Maintenance cost history (from MaintenanceSchedule)
    const maintRows = rows<{ month: string; total: number }>(
      await db.prepare(`
        SELECT substr(scheduledFor, 1, 7) as month, COALESCE(SUM(cost), 0) as total
        FROM MaintenanceSchedule
        WHERE cost IS NOT NULL AND cost > 0 AND scheduledFor IS NOT NULL
          AND substr(scheduledFor, 1, 7) IN (${allMonths.map(() => '?').join(',')})
        GROUP BY month
      `).all(...allMonths)
    )
    const maintMap = new Map(maintRows.map((r) => [r.month, Number(r.total) || 0]))

    // Depreciation cost (sum of depreciation per month â€” approximate using straight-line over 3 years)
    // Use DepreciationRule or just compute simple depreciation: cost / 36 per month for each active asset
    const activeAssets = rows<{ cost: number | null; purchaseDate: string | null; status: string }>(
      await db.prepare(`SELECT cost, purchaseDate, status FROM Asset WHERE cost IS NOT NULL AND cost > 0 AND status NOT IN ('Retired', 'Lost')`).all()
    )
    const deprMap = new Map<string, number>()
    for (const a of activeAssets) {
      if (!a.purchaseDate) continue
      const pd = new Date(a.purchaseDate)
      const monthlyDepr = (Number(a.cost) || 0) / 36 // 3-year straight-line
      // Apply depreciation for 36 months from purchase
      for (let i = 0; i < 36; i++) {
        const k = monthKey(addMonths(pd, i))
        if (historyKeys.has(k) || forecastKeys.has(k)) {
          deprMap.set(k, (deprMap.get(k) || 0) + monthlyDepr)
        }
      }
    }

    const buildCategory = (
      category: CostForecastCategory['category'],
      dataMap: Map<string, number>
    ): CostForecastCategory => {
      const history: { month: string; value: number }[] = []
      for (let i = 0; i < historyMonths; i++) {
        const k = allMonths[i]
        history.push({ month: k, value: dataMap.get(k) || 0 })
      }
      const ys = history.map((h) => h.value)
      const { slope, intercept } = linearRegression(ys)
      const trendDirection: CostForecastCategory['trendDirection'] = slope > 1 ? 'up' : slope < -1 ? 'down' : 'flat'
      const forecast: { month: string; value: number; lowerBound: number; upperBound: number }[] = []
      // Compute residual standard deviation for confidence interval
      const residuals = ys.map((y, i) => y - (slope * i + intercept))
      const residStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, residuals.length))
      for (let i = 0; i < forecastMonths; i++) {
        const idx = historyMonths + i
        const k = allMonths[idx]
        const v = Math.max(0, slope * idx + intercept)
        forecast.push({
          month: k,
          value: Math.round(v * 100) / 100,
          lowerBound: Math.max(0, Math.round((v - residStd * 1.5) * 100) / 100),
          upperBound: Math.round((v + residStd * 1.5) * 100) / 100,
        })
      }
      const totalHistorical = ys.reduce((s, y) => s + y, 0)
      const totalForecast = forecast.reduce((s, f) => s + f.value, 0)
      const projectedAnnual = totalForecast * (12 / forecastMonths)
      return {
        category,
        history,
        forecast,
        trendSlope: Math.round(slope * 100) / 100,
        trendDirection,
        totalHistorical: Math.round(totalHistorical * 100) / 100,
        totalForecast: Math.round(totalForecast * 100) / 100,
        projectedAnnual: Math.round(projectedAnnual * 100) / 100,
      }
    }

    const purchaseCat = buildCategory('purchase', purchaseMap)
    const maintCat = buildCategory('maintenance', maintMap)
    const deprCat = buildCategory('depreciation', deprMap)
    const categories = [purchaseCat, maintCat, deprCat]

    // Combined forecast points
    const combined: CostForecastPoint[] = allMonths.map((k, i) => {
      const isHist = i < historyMonths
      if (isHist) {
        const hist = (purchaseMap.get(k) || 0) + (maintMap.get(k) || 0) + (deprMap.get(k) || 0)
        return { month: k, historical: Math.round(hist * 100) / 100, forecast: null, lowerBound: null, upperBound: null }
      }
      const fcPurchase = purchaseCat.forecast.find((f) => f.month === k)
      const fcMaint = maintCat.forecast.find((f) => f.month === k)
      const fcDepr = deprCat.forecast.find((f) => f.month === k)
      const value = (fcPurchase?.value || 0) + (fcMaint?.value || 0) + (fcDepr?.value || 0)
      const lower = (fcPurchase?.lowerBound || 0) + (fcMaint?.lowerBound || 0) + (fcDepr?.lowerBound || 0)
      const upper = (fcPurchase?.upperBound || 0) + (fcMaint?.upperBound || 0) + (fcDepr?.upperBound || 0)
      return {
        month: k,
        historical: null,
        forecast: Math.round(value * 100) / 100,
        lowerBound: Math.round(lower * 100) / 100,
        upperBound: Math.round(upper * 100) / 100,
      }
    })

    const historicalTotal = categories.reduce((s, c) => s + c.totalHistorical, 0)
    const forecastTotal = categories.reduce((s, c) => s + c.totalForecast, 0)
    const projectedAnnual = categories.reduce((s, c) => s + c.projectedAnnual, 0)
    const slopes = categories.map((c) => c.trendSlope)
    const avgSlope = slopes.reduce((s, x) => s + x, 0) / Math.max(1, slopes.length)
    const trendDirection: CostForecastReport['totals']['trendDirection'] = avgSlope > 1 ? 'up' : avgSlope < -1 ? 'down' : 'flat'
    const trendPct = historicalTotal > 0 ? (forecastTotal - historicalTotal) / historicalTotal : null

    return {
      categories,
      combined,
      totals: {
        historicalTotal: Math.round(historicalTotal * 100) / 100,
        forecastTotal: Math.round(forecastTotal * 100) / 100,
        projectedAnnual: Math.round(projectedAnnual * 100) / 100,
        trendDirection,
        trendPct: trendPct != null ? Math.round(trendPct * 1000) / 1000 : null,
      },
    }
  },
}

// ============ Round 9: Asset Audit / Physical Inventory ============
function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export const assetAuditRepo = {
  /** List all audits with stats + scope name + startedBy name, newest first. */
  async list(): Promise<AssetAudit[]> {
    await ensure()
    const r = await db.prepare(`
      SELECT a.*,
             p.fullName AS startedByName
      FROM AssetAudit a
      LEFT JOIN Person p ON a.startedById = p.id
      ORDER BY a.createdAt DESC
    `).all()
    const audits = rows<AssetAudit & { startedByName?: string | null }>(r)
    return Promise.all(audits.map(async (a) => {
      let scopeName: string | null = null
      if (a.scopeId) {
        if (a.scope === 'location') {
          const loc = row<{ name: string }>(await db.prepare('SELECT name FROM Location WHERE id = ?').get(a.scopeId))
          scopeName = loc?.name ?? null
        } else if (a.scope === 'department') {
          const d = row<{ name: string }>(await db.prepare('SELECT name FROM Department WHERE id = ?').get(a.scopeId))
          scopeName = d?.name ?? null
        } else if (a.scope === 'type') {
          const t = row<{ name: string }>(await db.prepare('SELECT name FROM AssetType WHERE id = ?').get(a.scopeId))
          scopeName = t?.name ?? null
        }
      }
      const stats = await this.getStats(a.id)
      return { ...a, scopeName, stats }
    }))
  },

  /** Return one audit + all items joined with Asset + AssetType for display. */
  async get(id: string): { audit: AssetAudit; items: AssetAuditItem[] } | null {
    await ensure()
    const a = row<AssetAudit & { startedByName?: string | null }>(
      await db.prepare(`
        SELECT a.*, p.fullName AS startedByName
        FROM AssetAudit a
        LEFT JOIN Person p ON a.startedById = p.id
        WHERE a.id = ?
      `).get(id)
    )
    if (!a) return null
    let scopeName: string | null = null
    if (a.scopeId) {
      if (a.scope === 'location') {
        const loc = row<{ name: string }>(await db.prepare('SELECT name FROM Location WHERE id = ?').get(a.scopeId))
        scopeName = loc?.name ?? null
      } else if (a.scope === 'department') {
        const d = row<{ name: string }>(await db.prepare('SELECT name FROM Department WHERE id = ?').get(a.scopeId))
        scopeName = d?.name ?? null
      } else if (a.scope === 'type') {
        const t = row<{ name: string }>(await db.prepare('SELECT name FROM AssetType WHERE id = ?').get(a.scopeId))
        scopeName = t?.name ?? null
      }
    }
    const audit: AssetAudit = { ...a, scopeName, stats: await this.getStats(id) }

    const itemRows = await db.prepare(`
      SELECT i.*,
             ast.assetTag AS _assetTag2,
             ast.make AS _make,
             ast.model AS _model,
             ast.assetTypeId AS _assetTypeId,
             t.name AS _assetTypeName
      FROM AssetAuditItem i
      LEFT JOIN Asset ast ON i.assetId = ast.id
      LEFT JOIN AssetType t ON ast.assetTypeId = t.id
      WHERE i.auditId = ?
      ORDER BY CASE i.status
        WHEN 'Verified' THEN 0
        WHEN 'Extra' THEN 1
        WHEN 'Pending' THEN 2
        WHEN 'Found' THEN 3
        WHEN 'Missing' THEN 4
        ELSE 5
      END, i.assetTag
    `).all(id)
    const items: AssetAuditItem[] = rows<
      AssetAuditItem & {
        _assetTag2?: string | null
        _make?: string | null
        _model?: string | null
        _assetTypeId?: string | null
        _assetTypeName?: string | null
      }
    >(itemRows).map((it) => {
      const { _assetTag2, _make, _model, _assetTypeId, _assetTypeName, ...rest } = it
      void _assetTypeId
      const make = _make || ''
      const model = _model || ''
      const assetName = `${make} ${model}`.trim() || _assetTag2 || it.assetTag || ''
      return {
        ...rest,
        assetTag: it.assetTag || _assetTag2 || null,
        assetName,
        assetTypeName: _assetTypeName || null,
        expected: toBool(it.expected),
      } as AssetAuditItem
    })
    return { audit, items }
  },

  /** Create a new audit (status=Open) and auto-populate expected items per scope. */
  async create(payload: AssetAuditCreatePayload): AssetAudit {
    await ensure()
    if (!payload.title || !payload.title.trim()) throw new Error('Title is required')
    const scope: AuditScope = payload.scope || 'all'
    if (scope !== 'all' && !payload.scopeId) {
      throw new Error(`scopeId is required when scope is "${scope}"`)
    }

    const now = new Date().toISOString()
    const today = now.slice(0, 10).replace(/-/g, '')
    // AUD-YYYYMMDD-XXXX (4-char random suffix)
    const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const auditNumber = `AUD-${today}-${randSuffix}`
    const id = generateId()

    await db.prepare(`
      INSERT INTO AssetAudit (id, auditNumber, title, scope, scopeId, status, startedAt, completedAt, startedById, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'Open', ?, NULL, ?, ?, ?, ?)
    `).run(
      id,
      auditNumber,
      payload.title.trim(),
      scope,
      payload.scopeId ?? null,
      now,
      payload.startedById ?? null,
      payload.notes ?? null,
      now,
      now
    )

    // Auto-populate expected items: query matching active assets (exclude Retired/Lost)
    let scopeWhere = `status NOT IN ('Retired', 'Lost')`
    const scopeParams: unknown[] = []
    if (scope === 'location') {
      scopeWhere += ` AND locationId = ?`
      scopeParams.push(payload.scopeId)
    } else if (scope === 'department') {
      scopeWhere += ` AND departmentId = ?`
      scopeParams.push(payload.scopeId)
    } else if (scope === 'type') {
      scopeWhere += ` AND assetTypeId = ?`
      scopeParams.push(payload.scopeId)
    }
    const assetRows = await db.prepare(
      `SELECT id, assetTag FROM Asset WHERE ${scopeWhere} ORDER BY assetTag`
    ).all(...scopeParams)
    const assets = rows<{ id: string; assetTag: string | null }>(assetRows)

    const insItem = await db.prepare(`
      INSERT INTO AssetAuditItem (id, auditId, assetId, assetTag, status, expected, scannedAt, scannedByName, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, 'Pending', 1, NULL, NULL, NULL, ?, ?)
    `)
    for (const a of assets) {
      insItem.run(generateId(), id, a.id, a.assetTag ?? null, now, now)
    }

    activityLogRepo.log(
      'audit.created',
      'AssetAudit',
      id,
      `Created audit ${auditNumber} (${scope}${payload.scopeId ? `:${payload.scopeId}` : ''}) with ${assets.length} expected item(s)`
    )

    const created = await this.get(id)
    return created!.audit
  },

  /** Scan an asset during an audit â€” verify/extra/found logic. */
  async scan(auditId: string, payload: AssetAuditScanPayload): AssetAuditScanResult {
    await ensure()
    const audit = row<AssetAudit>(await db.prepare('SELECT * FROM AssetAudit WHERE id = ?').get(auditId))
    if (!audit) throw new Error('Audit not found')
    if (audit.status === 'Completed' || audit.status === 'Cancelled') {
      throw new Error(`Cannot scan: audit is ${audit.status}`)
    }

    // Find asset by assetId OR assetTag
    let asset: { id: string; assetTag: string | null } | null = null
    if (payload.assetId) {
      asset = row<{ id: string; assetTag: string | null }>(
        await db.prepare('SELECT id, assetTag FROM Asset WHERE id = ?').get(payload.assetId)
      )
    } else if (payload.assetTag) {
      asset = row<{ id: string; assetTag: string | null }>(
        await db.prepare('SELECT id, assetTag FROM Asset WHERE assetTag = ?').get(payload.assetTag)
      )
    }
    if (!asset) throw new Error('Asset not found')

    const now = new Date().toISOString()
    const scannedByName = payload.scannedByName ?? null

    const existing = row<AssetAuditItem>(
      await db.prepare('SELECT * FROM AssetAuditItem WHERE auditId = ? AND assetId = ?').get(auditId, asset.id)
    )

    let item: AssetAuditItem
    let wasExpected = false
    let newlyVerified = false

    if (existing) {
      wasExpected = toBool(existing.expected)
      const status = existing.status as AuditItemStatus
      let nextStatus: AuditItemStatus = status
      let setScannedAt = false
      if (payload.status) {
        nextStatus = payload.status
        if (payload.status !== 'Missing' && payload.status !== 'Pending') {
          setScannedAt = true
        }
      } else if (status === 'Pending') {
        nextStatus = 'Verified'
        newlyVerified = true
        setScannedAt = true
      } else if (status === 'Missing') {
        nextStatus = 'Found'
        setScannedAt = true
      }
      // Verified / Found / Extra â†’ no-op on status
      const finalScannedAt = setScannedAt ? now : existing.scannedAt
      const finalScannedBy = scannedByName ?? existing.scannedByName
      if (payload.notes != null && payload.notes.trim() !== '') {
        await db.prepare(`
          UPDATE AssetAuditItem
          SET status = ?, scannedAt = ?, scannedByName = ?, notes = ?, updatedAt = ?
          WHERE id = ?
        `).run(nextStatus, finalScannedAt, finalScannedBy, payload.notes, now, existing.id)
      } else {
        await db.prepare(`
          UPDATE AssetAuditItem
          SET status = ?, scannedAt = ?, scannedByName = ?, updatedAt = ?
          WHERE id = ?
        `).run(nextStatus, finalScannedAt, finalScannedBy, now, existing.id)
      }
      const refreshed = row<AssetAuditItem>(
        await db.prepare('SELECT * FROM AssetAuditItem WHERE id = ?').get(existing.id)
      )
      item = { ...refreshed!, expected: toBool(refreshed!.expected) }
    } else {
      // New "Extra" item â€” asset was not on expected list
      const newId = generateId()
      await db.prepare(`
        INSERT INTO AssetAuditItem (id, auditId, assetId, assetTag, status, expected, scannedAt, scannedByName, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 'Extra', 0, ?, ?, ?, ?, ?)
      `).run(newId, auditId, asset.id, asset.assetTag ?? null, now, scannedByName, payload.notes ?? null, now, now)
      const created = row<AssetAuditItem>(await db.prepare('SELECT * FROM AssetAuditItem WHERE id = ?').get(newId))
      item = { ...created!, expected: toBool(created!.expected) }
      wasExpected = false
      newlyVerified = false
    }

    // If audit is Open, transition to In Progress on first scan
    if (audit.status === 'Open') {
      await db.prepare(`UPDATE AssetAudit SET status = 'In Progress', updatedAt = ? WHERE id = ?`).run(now, auditId)
    }

    activityLogRepo.log(
      'audit.scan',
      'AssetAudit',
      auditId,
      `Scanned ${asset.assetTag || asset.id.slice(0, 8)} â†’ ${item.status}`
    )

    return { auditId, item, wasExpected, newlyVerified }
  },

  /** Mark an expected item as Missing (used during reconciliation). */
  async markMissing(auditId: string, assetId: string): AssetAuditItem | null {
    await ensure()
    const existing = row<AssetAuditItem>(
      await db.prepare('SELECT * FROM AssetAuditItem WHERE auditId = ? AND assetId = ?').get(auditId, assetId)
    )
    if (!existing) return null
    const now = new Date().toISOString()
    await db.prepare(`UPDATE AssetAuditItem SET status = 'Missing', updatedAt = ? WHERE id = ?`).run(now, existing.id)
    const refreshed = row<AssetAuditItem>(await db.prepare('SELECT * FROM AssetAuditItem WHERE id = ?').get(existing.id))
    return refreshed ? { ...refreshed, expected: toBool(refreshed.expected) } : null
  },

  /** Finalize: mark all remaining Pending as Missing, set status=Completed. */
  async complete(auditId: string): AssetAudit {
    await ensure()
    const audit = row<AssetAudit>(await db.prepare('SELECT * FROM AssetAudit WHERE id = ?').get(auditId))
    if (!audit) throw new Error('Audit not found')
    if (audit.status === 'Completed') throw new Error('Audit is already completed')
    if (audit.status === 'Cancelled') throw new Error('Cannot complete a cancelled audit')

    const now = new Date().toISOString()
    // Auto-reconcile: any Pending â†’ Missing
    await db.prepare(`
      UPDATE AssetAuditItem SET status = 'Missing', updatedAt = ?
      WHERE auditId = ? AND status = 'Pending'
    `).run(now, auditId)

    await db.prepare(`
      UPDATE AssetAudit SET status = 'Completed', completedAt = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, now, auditId)

    activityLogRepo.log(
      'audit.completed',
      'AssetAudit',
      auditId,
      `Completed audit ${audit.auditNumber}`
    )
    const refreshed = await this.get(auditId)
    return refreshed!.audit
  },

  /** Cancel: status=Cancelled, items remain as-is. */
  async cancel(auditId: string): AssetAudit {
    await ensure()
    const audit = row<AssetAudit>(await db.prepare('SELECT * FROM AssetAudit WHERE id = ?').get(auditId))
    if (!audit) throw new Error('Audit not found')
    if (audit.status === 'Completed') throw new Error('Cannot cancel a completed audit')
    if (audit.status === 'Cancelled') throw new Error('Audit is already cancelled')

    const now = new Date().toISOString()
    await db.prepare(`UPDATE AssetAudit SET status = 'Cancelled', updatedAt = ? WHERE id = ?`).run(now, auditId)
    activityLogRepo.log(
      'audit.cancelled',
      'AssetAudit',
      auditId,
      `Cancelled audit ${audit.auditNumber}`
    )
    const refreshed = await this.get(auditId)
    return refreshed!.audit
  },

  /** Compute stats (counts by status + accuracyPct). */
  async getStats(auditId: string): AssetAudit['stats'] {
    await ensure()
    const r = await db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Verified' THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN status = 'Missing' THEN 1 ELSE 0 END) AS missing,
        SUM(CASE WHEN status = 'Found' THEN 1 ELSE 0 END) AS found,
        SUM(CASE WHEN status = 'Extra' THEN 1 ELSE 0 END) AS extra,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
      FROM AssetAuditItem
      WHERE auditId = ?
    `).get(auditId) as
      | {
          total: number
          verified: number
          missing: number
          found: number
          extra: number
          pending: number
        }
      | null
    const total = r?.total || 0
    const verified = r?.verified || 0
    const missing = r?.missing || 0
    const found = r?.found || 0
    const extra = r?.extra || 0
    const pending = r?.pending || 0
    const denom = verified + missing
    const accuracyPct = denom > 0 ? Math.round((verified / denom) * 1000) / 10 : 0
    return { total, verified, missing, found, extra, pending, accuracyPct }
  },

  /** Build a CSV export of audit items + summary footer. */
  async exportCsv(auditId: string): string {
    await ensure()
    const data = await this.get(auditId)
    if (!data) throw new Error('Audit not found')
    const { audit, items } = data
    const header = [
      'auditNumber',
      'title',
      'assetTag',
      'assetName',
      'assetType',
      'expected',
      'status',
      'scannedAt',
      'scannedByName',
      'notes',
    ]
    const rowsOut = items.map((it) => [
      audit.auditNumber,
      audit.title,
      it.assetTag || '',
      it.assetName || '',
      it.assetTypeName || '',
      it.expected ? 'Yes' : 'No',
      it.status,
      it.scannedAt ? it.scannedAt.replace('T', ' ').slice(0, 19) : '',
      it.scannedByName || '',
      it.notes || '',
    ])
    const csv = [header, ...rowsOut].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const stats = audit.stats || await this.getStats(auditId)
    const summary = [
      '',
      `# Audit ${audit.auditNumber} â€” ${audit.title}`,
      `# Status,${audit.status}`,
      `# Scope,${audit.scope}${audit.scopeName ? ` (${audit.scopeName})` : ''}`,
      `# Total,${stats.total}`,
      `# Verified,${stats.verified}`,
      `# Missing,${stats.missing}`,
      `# Found,${stats.found}`,
      `# Extra,${stats.extra}`,
      `# Pending,${stats.pending}`,
      `# AccuracyPct,${stats.accuracyPct}`,
    ].join('\r\n')
    return csv + '\r\n' + summary
  },
}

// ============ Round 9-B: Expiry Center Bulk Renew ============
// Creates ONE Draft Purchase Order with multiple renewal line items (one per
// selected warranty or license). Mirrors expiryRenewRepo.renew but batches
// many expirations into a single PO with one line per item.
export const expiryBulkRenewRepo = {
  async renewBulk(payload: ExpiryBulkRenewPayload): ExpiryBulkRenewResult {
    await ensure()
    if (!payload.vendorId) throw new Error('vendorId is required')
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('At least one renewal item is required')
    }

    // Validate every item: assetId XOR licenseId must be set (exactly one).
    const renewedItems: ExpiryBulkRenewResult['renewedItems'] = []
    // Each line descriptor: { description, unitPrice, assetTypeId? }
    const lines: { description: string; unitPrice: number; assetTypeId?: string | null }[] = []

    for (const item of payload.items) {
      const hasAsset = !!item.assetId
      const hasLicense = !!item.licenseId
      if (hasAsset === hasLicense) {
        // Both set OR both unset â†’ invalid (must be exactly one)
        throw new Error('Each renewal item must specify exactly one of assetId or licenseId')
      }

      if (hasAsset) {
        const asset = row<{
          id: string
          assetTag: string | null
          make: string | null
          model: string | null
          warrantyExpiry: string | null
          cost: number | null
          assetTypeId: string
        }>(
          await db
            .prepare(
              'SELECT id, assetTag, make, model, warrantyExpiry, cost, assetTypeId FROM Asset WHERE id = ?'
            )
            .get(item.assetId)
        )
        if (!asset) throw new Error(`Asset not found: ${item.assetId}`)
        const entityName =
          `${asset.make || ''} ${asset.model || ''}`.trim() ||
          asset.assetTag ||
          asset.id.slice(0, 8)
        const description = `Warranty renewal for ${entityName}${asset.assetTag ? ` (${asset.assetTag})` : ''}`
        const unitPrice = Number(asset.cost) || 0
        lines.push({ description, unitPrice, assetTypeId: asset.assetTypeId })
        renewedItems.push({
          expiryType: 'warranty',
          entityId: asset.id,
          entityName,
          currentExpiry: asset.warrantyExpiry,
        })
      } else {
        const lic = row<{
          id: string
          name: string
          vendor: string | null
          expiryDate: string | null
          cost: number | null
          seatsTotal: number
        }>(
          await db
            .prepare(
              'SELECT id, name, vendor, expiryDate, cost, seatsTotal FROM SoftwareLicense WHERE id = ?'
            )
            .get(item.licenseId)
        )
        if (!lic) throw new Error(`Software license not found: ${item.licenseId}`)
        const description = `License renewal for ${lic.name}`
        const unitPrice = Number(lic.cost) || 0
        lines.push({ description, unitPrice, assetTypeId: null })
        renewedItems.push({
          expiryType: 'license',
          entityId: lic.id,
          entityName: lic.name,
          currentExpiry: lic.expiryDate,
        })
      }
    }

    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    // Generate PO number: RENEW-BULK-YYYYMMDD-HHMMSS-XXXX (4-char random suffix
    // prevents collision when multiple bulk renewals happen in the same second)
    const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase()
    const poNumber = `RENEW-BULK-${today.replace(/-/g, '')}-${now.slice(11, 19).replace(/:/g, '')}-${randSuffix}`

    const poId = generateId()
    const subtotal = lines.reduce((s, l) => s + (Number(l.unitPrice) || 0), 0)
    const expectedDate =
      payload.expectedDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const summaryLine = `${renewedItems.length} renewal item${renewedItems.length === 1 ? '' : 's'} Â· ${renewedItems.filter((r) => r.expiryType === 'warranty').length} warranty + ${renewedItems.filter((r) => r.expiryType === 'license').length} license`
    const notes = payload.notes?.trim()
      ? `${payload.notes.trim()}\n${summaryLine}`
      : `Auto-generated bulk renewal PO Â· ${summaryLine}`

    await db.prepare(`
      INSERT INTO PurchaseOrder (id, poNumber, vendorId, status, orderDate, expectedDate, subtotal, taxRate, taxAmount, shippingCost, totalAmount, currency, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, 'Draft', ?, ?, ?, 0, 0, 0, ?, 'USD', ?, ?, ?)
    `).run(
      poId,
      poNumber,
      payload.vendorId,
      today,
      expectedDate,
      subtotal,
      subtotal,
      notes,
      now,
      now
    )

    // Insert one line per renewal item
    for (const line of lines) {
      const itemId = generateId()
      await db.prepare(`
        INSERT INTO PurchaseOrderItem (id, poId, assetTypeId, description, quantity, unitPrice, totalPrice, receivedQuantity, notes, createdAt)
        VALUES (?, ?, ?, ?, 1, ?, ?, 0, ?, ?)
      `).run(
        itemId,
        poId,
        line.assetTypeId ?? null,
        line.description,
        line.unitPrice,
        line.unitPrice,
        'Auto-generated line item from bulk renewal',
        now
      )
    }

    activityLogRepo.log(
      'po.renew.bulk_created',
      'PurchaseOrder',
      poId,
      `Bulk renewal PO ${poNumber} drafted with ${renewedItems.length} line item(s) for vendor ${payload.vendorId}`
    )

    return {
      po: purchaseOrderRepo.get(poId)!,
      renewedItems,
    }
  },
}

export const importAliasRepo = {
  async list(): Promise<ImportAlias[]> {
    await ensure()
    const r = await db.prepare('SELECT * FROM ImportAlias ORDER BY alias').all()
    return rows<ImportAlias>(r)
  },
  async get(id: string): Promise<ImportAlias | null> {
    await ensure()
    return row<ImportAlias>(await db.prepare('SELECT * FROM ImportAlias WHERE id = ?').get(id))
  },
  async findByAlias(alias: string): Promise<ImportAlias | null> {
    await ensure()
    return row<ImportAlias>(await db.prepare('SELECT * FROM ImportAlias WHERE LOWER(alias) = LOWER(?)').get(alias))
  },
  async create(data: { alias: string; field: string }): Promise<ImportAlias> {
    await ensure()
    const id = generateId()
    const now = new Date().toISOString()
    await db.prepare(
      'INSERT INTO ImportAlias (id, alias, field, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
    ).run(id, data.alias.trim(), data.field.trim(), now, now)
    return (await this.get(id))!
  },
  async update(id: string, data: { alias?: string; field?: string }): Promise<ImportAlias | null> {
    await ensure()
    const now = new Date().toISOString()
    const cur = await this.get(id)
    if (!cur) return null
    await db.prepare('UPDATE ImportAlias SET alias = ?, field = ?, updatedAt = ? WHERE id = ?').run(
      data.alias?.trim() ?? cur.alias,
      data.field?.trim() ?? cur.field,
      now,
      id
    )
    return await this.get(id)
  },
  async delete(id: string): Promise<void> {
    await ensure()
    await db.prepare('DELETE FROM ImportAlias WHERE id = ?').run(id)
  },
}



