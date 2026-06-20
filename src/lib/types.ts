// IT Asset Manager - Core Types

export type AssetStatus = 'In Use' | 'In Stock' | 'Repair' | 'Retired' | 'Lost'

export const ASSET_STATUSES: AssetStatus[] = [
  'In Use',
  'In Stock',
  'Repair',
  'Retired',
  'Lost',
]

export const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; color: string; bg: string; text: string; dot: string }
> = {
  'In Use': {
    label: 'In Use',
    color: 'emerald',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'In Stock': {
    label: 'In Stock',
    color: 'slate',
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  Repair: {
    label: 'Repair',
    color: 'amber',
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Retired: {
    label: 'Retired',
    color: 'rose',
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  Lost: {
    label: 'Lost',
    color: 'red',
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
}

export const ASSET_TYPE_ICONS: Record<string, string> = {
  Desktop: 'Monitor',
  Laptop: 'Laptop',
  Mobile: 'Smartphone',
  Tablet: 'Tablet',
  Monitor: 'Display',
  Peripheral: 'Mouse',
  Other: 'Package',
}

export interface AssetType {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  _count?: { assets: number }
}

export interface Department {
  id: string
  name: string
  code?: string | null
  _count?: { assets: number; persons: number }
}

export interface Location {
  id: string
  name: string
  address?: string | null
  _count?: { assets: number; persons: number }
}

export interface Person {
  id: string
  fullName: string
  email?: string | null
  phone?: string | null
  role?: string | null
  departmentId?: string | null
  locationId?: string | null
  department?: Department | null
  location?: Location | null
  _count?: { assets: number }
}

export interface Asset {
  id: string
  assetTag?: string | null
  assetTypeId: string
  make?: string | null
  model?: string | null
  modelNumber?: string | null
  serialNumber?: string | null
  partNumber?: string | null
  status: string
  purchaseDate?: string | null
  cost?: number | null
  currency: string
  warrantyExpiry?: string | null
  os?: string | null
  osKey?: string | null
  officeKey?: string | null
  cpu?: string | null
  gpu?: string | null
  ram?: string | null
  storage?: string | null
  color?: string | null
  imei1?: string | null
  imei2?: string | null
  rom?: string | null
  otpMobileNumber?: string | null
  googleAppleAccount?: string | null
  monitorMake?: string | null
  monitorModel?: string | null
  monitorSn?: string | null
  monitorSize?: string | null
  keyboardMake?: string | null
  keyboardModel?: string | null
  keyboardSn?: string | null
  mouseMake?: string | null
  mouseModel?: string | null
  mouseSn?: string | null
  assignedToId?: string | null
  departmentId?: string | null
  locationId?: string | null
  computerName?: string | null
  manufactureYear?: string | null
  mousePn?: string | null
  monitorPartNumber?: string | null
  ipAddress?: string | null
  tonersModel?: string | null
  deviceType?: string | null
  qty?: string | null
  barcodeScannerModel?: string | null
  barcodeScannerSn?: string | null
  scaleMachineIpAddress?: string | null
  hddInstalledDate?: string | null
  hddInstalledDate2?: string | null
  comments?: string | null
  createdAt: string
  updatedAt: string
  assetType?: AssetType
  assignedTo?: Person | null
  department?: Department | null
  location?: Location | null
  images?: AssetImage[]
  history?: AssignmentHistory[]
  tags?: AssetTag[]
  _count?: { images: number; history: number }
}

export interface AssetImage {
  id: string
  assetId?: string | null
  fileName: string
  filePath: string
  mimeType: string
  fileSize: number
  processedText?: string | null
  ocrStatus: string
  ocrEngine?: string | null
  parsedFields?: string | null
  createdAt: string
  processedAt?: string | null
}

export interface AssignmentHistory {
  id: string
  assetId: string
  personId?: string | null
  departmentId?: string | null
  locationId?: string | null
  assignedOn: string
  unassignedOn?: string | null
  reason?: string | null
  action: string
  notes?: string | null
  person?: Person | null
  department?: Department | null
  location?: Location | null
}

export interface DashboardStats {
  totalAssets: number
  inUse: number
  inStock: number
  repair: number
  retired: number
  lost: number
  byType: { name: string; count: number }[]
  byDepartment: { name: string; count: number }[]
  byLocation: { name: string; count: number }[]
  byStatus: { status: string; count: number }[]
  recentActivity: (AssignmentHistory & {
    asset?: { id: string; assetTag?: string | null; make?: string | null; model?: string | null }
  })[]
  totalValue: number
  totalPersons: number
  totalDepartments: number
  totalLocations: number
  warrantyExpiringSoon: number
  maintenance?: {
    total: number
    scheduled: number
    inProgress: number
    completed: number
    overdue: number
  }
  licenses?: {
    total: number
    totalSeats: number
    usedSeats: number
    expiringSoon: number
    totalValue: number
  }
  auditLog?: ActivityLog[]
  checkouts?: {
    total: number
    pending: number
    checkedOut: number
    overdue: number
  }
  depreciation?: {
    totalAssets: number
    totalPurchaseValue: number
    totalCurrentValue: number
    totalDepreciation: number
    fullyDepreciatedCount: number
  }
  notifications?: {
    total: number
    unread: number
    critical: number
  }
  vendors?: {
    total: number
    active: number
  }
  procurement?: {
    totalPOs: number
    pendingApproval: number
    open: number
    received: number
    totalSpent: number
  }
  disposals?: {
    total: number
    totalRecovered: number
    totalCost: number
    pendingApproval: number
  }
  bookings?: {
    total: number
    pending: number
    active: number
    approved: number
    upcoming: number
  }
  tags?: {
    totalTags: number
    totalLinks: number
    topTags: { name: string; color: string; c: number }[]
  }
}

export interface OcrResult {
  rawText: string
  parsed: {
    make?: string
    model?: string
    modelNumber?: string
    serialNumber?: string
    imei1?: string
    imei2?: string
    os?: string
    assetType?: string
  }
  imageId?: string
}

// ============ Maintenance Schedule ============
export type MaintenanceType = 'Preventive' | 'Corrective' | 'Upgrade' | 'Inspection' | 'Cleaning'
export type MaintenanceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Cancelled'

export const MAINTENANCE_TYPES: MaintenanceType[] = [
  'Preventive',
  'Corrective',
  'Upgrade',
  'Inspection',
  'Cleaning',
]

export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
  'Scheduled',
  'In Progress',
  'Completed',
  'Overdue',
  'Cancelled',
]

export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { bg: string; text: string; dot: string }
> = {
  Scheduled: {
    bg: 'bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  'In Progress': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  Completed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  Overdue: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  Cancelled: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-700 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
}

export interface MaintenanceSchedule {
  id: string
  assetId: string
  type: MaintenanceType | string
  title: string
  description?: string | null
  scheduledFor: string
  completedAt?: string | null
  status: MaintenanceStatus | string
  cost?: number | null
  performedBy?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  asset?: Asset
}

// ============ Audit Log / Activity Log ============
export interface ActivityLog {
  id: string
  action: string
  entityType: string
  entityId: string
  details?: string | null
  createdAt: string
  meta?: Record<string, unknown>
}

// ============ Software License ============
export interface SoftwareLicense {
  id: string
  name: string
  vendor?: string | null
  key?: string | null
  seatsTotal: number
  seatsUsed: number
  purchaseDate?: string | null
  expiryDate?: string | null
  cost?: number | null
  currency: string
  category?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  _count?: { allocations: number }
  availableSeats?: number
}

export interface AssetLicense {
  id: string
  assetId: string
  licenseId: string
  assignedAt: string
  createdAt: string
  license?: SoftwareLicense
  asset?: Asset
}

// ============ Checkout Requests ============
export type CheckoutRequestType = 'Checkout' | 'Checkin' | 'Reserve'
export type CheckoutRequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Checked Out'
  | 'Checked In'
  | 'Cancelled'
  | 'Overdue'

export const CHECKOUT_STATUSES: CheckoutRequestStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Checked Out',
  'Checked In',
  'Cancelled',
  'Overdue',
]

export const CHECKOUT_STATUS_CONFIG: Record<
  CheckoutRequestStatus,
  { bg: string; text: string; dot: string }
> = {
  Pending: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  Approved: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
  Rejected: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  'Checked Out': { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Checked In': { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-400' },
  Overdue: { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
}

export interface CheckoutRequest {
  id: string
  assetId: string
  requestedById: string
  requestType: CheckoutRequestType | string
  status: CheckoutRequestStatus | string
  reason?: string | null
  requestedStartDate: string
  requestedReturnDate?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  decisionNotes?: string | null
  checkedOutAt?: string | null
  checkedInAt?: string | null
  actualReturnDate?: string | null
  conditionAtReturn?: string | null
  createdAt: string
  updatedAt: string
  asset?: Asset
  requestedBy?: Person
  approvedBy?: Person | null
}

// ============ Depreciation ============
export type DepreciationMethod = 'straight-line' | 'declining-balance' | 'units-of-production'

export const DEPRECIATION_METHODS: { value: DepreciationMethod; label: string; description: string }[] = [
  { value: 'straight-line', label: 'Straight Line', description: 'Equal depreciation each year' },
  { value: 'declining-balance', label: 'Declining Balance', description: 'Double declining balance (2x rate)' },
  { value: 'units-of-production', label: 'Units of Production', description: 'Based on usage' },
]

export interface DepreciationRule {
  id: string
  name: string
  assetTypeId?: string | null
  method: DepreciationMethod | string
  usefulLifeYears: number
  salvageValuePercent: number
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  assetType?: AssetType | null
}

export interface DepreciationCalc {
  asset: Asset
  rule?: DepreciationRule | null
  purchaseCost: number
  currentValue: number
  depreciation: number
  depreciationPercent: number
  yearsElapsed: number
  yearsRemaining: number
  annualDepreciation: number
  salvageValue: number
  method: string
  isFullyDepreciated: boolean
}

// ============ Notifications ============
export type NotificationType =
  | 'warranty_expiring'
  | 'maintenance_overdue'
  | 'maintenance_scheduled'
  | 'license_expiring'
  | 'license_expired'
  | 'checkout_request'
  | 'checkout_overdue'
  | 'low_stock'
  | 'asset_created'
  | 'system'

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success'

export const NOTIFICATION_SEVERITY_CONFIG: Record<
  NotificationSeverity,
  { bg: string; text: string; icon: string }
> = {
  info: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: 'Info' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: 'AlertTriangle' },
  critical: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: 'AlertOctagon' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: 'CheckCircle2' },
}

export interface AppNotification {
  id: string
  type: NotificationType | string
  severity: NotificationSeverity | string
  title: string
  message: string
  entityType?: string | null
  entityId?: string | null
  isRead: boolean
  actionUrl?: string | null
  actionLabel?: string | null
  createdAt: string
  readAt?: string | null
}

// ============ Vendor / Supplier ============
export type VendorCategory =
  | 'Hardware'
  | 'Software'
  | 'Networking'
  | 'Peripherals'
  | 'Services'
  | 'Office Supplies'
  | 'Other'

export const VENDOR_CATEGORIES: VendorCategory[] = [
  'Hardware',
  'Software',
  'Networking',
  'Peripherals',
  'Services',
  'Office Supplies',
  'Other',
]

export interface Vendor {
  id: string
  name: string
  category?: string | null
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
  taxId?: string | null
  paymentTerms?: string | null
  rating: number
  isActive: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
  _count?: { purchaseOrders: number }
  _sum?: { totalSpent: number }
}

// ============ Purchase Orders ============
export type PurchaseOrderStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Approved'
  | 'Ordered'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled'
  | 'Closed'

export const PO_STATUSES: PurchaseOrderStatus[] = [
  'Draft',
  'Pending Approval',
  'Approved',
  'Ordered',
  'Partially Received',
  'Received',
  'Cancelled',
  'Closed',
]

export const PO_STATUS_CONFIG: Record<
  PurchaseOrderStatus,
  { bg: string; text: string; dot: string }
> = {
  Draft: { bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-400' },
  'Pending Approval': { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  Approved: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', dot: 'bg-sky-500' },
  Ordered: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'Partially Received': { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
  Received: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', dot: 'bg-rose-500' },
  Closed: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500' },
}

export interface PurchaseOrderItem {
  id: string
  poId: string
  assetTypeId?: string | null
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity: number
  notes?: string | null
  createdAt: string
  assetType?: AssetType | null
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  status: PurchaseOrderStatus | string
  orderDate: string
  expectedDate?: string | null
  receivedDate?: string | null
  subtotal: number
  taxRate: number
  taxAmount: number
  shippingCost: number
  totalAmount: number
  currency: string
  requestedById?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  vendor?: Vendor
  requestedBy?: Person | null
  approvedBy?: Person | null
  items?: PurchaseOrderItem[]
  _count?: { items: number }
}

// ============ Asset Disposal ============
export type DisposalMethod =
  | 'Sold'
  | 'Recycled'
  | 'Donated'
  | 'Scrapped'
  | 'Returned to Vendor'
  | 'Trade-in'
  | 'Disposed'

export const DISPOSAL_METHODS: DisposalMethod[] = [
  'Sold',
  'Recycled',
  'Donated',
  'Scrapped',
  'Returned to Vendor',
  'Trade-in',
  'Disposed',
]

export const DISPOSAL_METHOD_CONFIG: Record<
  DisposalMethod,
  { bg: string; text: string; icon: string }
> = {
  Sold: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: 'DollarSign' },
  Recycled: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', icon: 'Recycle' },
  Donated: { bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-400', icon: 'Gift' },
  Scrapped: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', icon: 'Trash2' },
  'Returned to Vendor': { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', icon: 'Undo2' },
  'Trade-in': { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', icon: 'ArrowLeftRight' },
  Disposed: { bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', icon: 'Trash' },
}

export interface AssetDisposal {
  id: string
  assetId: string
  disposalNumber?: string | null
  method: DisposalMethod | string
  reason?: string | null
  disposalDate: string
  residualValue: number
  disposalCost: number
  netProceeds: number
  buyerRecipient?: string | null
  conditionAtDisposal?: string | null
  environmentalCompliant: boolean
  certificateNumber?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  asset?: Asset
  approvedBy?: Person | null
}

// ============ Asset Tags ============
export type TagColor =
  | 'slate' | 'emerald' | 'amber' | 'rose' | 'violet'
  | 'sky' | 'orange' | 'pink' | 'lime' | 'cyan'

export const TAG_COLORS: { value: TagColor; label: string; bg: string; text: string; dot: string; border: string }[] = [
  { value: 'slate', label: 'Slate', bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500', border: 'border-slate-500/30' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-500/30' },
  { value: 'amber', label: 'Amber', bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-500/30' },
  { value: 'rose', label: 'Rose', bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', border: 'border-rose-500/30' },
  { value: 'violet', label: 'Violet', bg: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500', border: 'border-violet-500/30' },
  { value: 'sky', label: 'Sky', bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', border: 'border-sky-500/30' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500', border: 'border-orange-500/30' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500/10', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500', border: 'border-pink-500/30' },
  { value: 'lime', label: 'Lime', bg: 'bg-lime-500/10', text: 'text-lime-700 dark:text-lime-300', dot: 'bg-lime-500', border: 'border-lime-500/30' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500', border: 'border-cyan-500/30' },
]

export function getTagColorConfig(color: string) {
  return TAG_COLORS.find((c) => c.value === color) || TAG_COLORS[0]
}

export interface AssetTag {
  id: string
  name: string
  color: TagColor | string
  description?: string | null
  createdAt: string
  updatedAt: string
  _count?: { assets: number }
}

// ============ Asset Bookings ============
export type BookingStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Active'
  | 'Completed'
  | 'Cancelled'

export const BOOKING_STATUSES: BookingStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Active',
  'Completed',
  'Cancelled',
]

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  Pending: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', label: 'Pending Approval' },
  Approved: { bg: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500', label: 'Approved' },
  Rejected: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500', label: 'Rejected' },
  Active: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Active (Checked Out)' },
  Completed: { bg: 'bg-zinc-500/10', text: 'text-zinc-700 dark:text-zinc-300', dot: 'bg-zinc-500', label: 'Completed' },
  Cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-400', dot: 'bg-slate-500', label: 'Cancelled' },
}

export interface AssetBooking {
  id: string
  assetId: string
  bookedById: string
  title: string
  purpose?: string | null
  status: BookingStatus | string
  startDate: string
  endDate: string
  requestedById?: string | null
  approvedById?: string | null
  approvedAt?: string | null
  decisionNotes?: string | null
  checkedOutAt?: string | null
  checkedInAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  asset?: Asset
  bookedBy?: Person | null
  approvedBy?: Person | null
  _conflicts?: AssetBooking[]
}

// ============ Saved Reports (Round 5) ============
export interface SavedReport {
  id: string
  name: string
  description?: string | null
  section?: string | null
  config: SavedReportConfig
  createdBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface SavedReportConfig {
  range?: 'all' | '30d' | '90d' | '365d' | 'custom'
  customStart?: string | null
  customEnd?: string | null
  months?: number
  // Reserved for future per-section filters
  filters?: Record<string, unknown>
}

// Vendor performance analytics result
export interface VendorPerformance {
  vendorId: string
  vendorName: string
  category?: string | null
  rating: number
  isActive: boolean
  totalPOs: number
  activePOs: number
  completedPOs: number
  cancelledPOs: number
  totalSpent: number
  avgDeliveryDays: number | null
  onTimeRate: number // 0..1
  lateDeliveries: number
}

// Asset lifecycle YoY comparison
export interface LifecycleYoYPoint {
  assetType: string
  currentYear: number
  previousYear: number
  delta: number
  deltaPct: number | null
}

// ============ Round 6: Expirations Center ============
export type ExpirationUrgency = 'expired' | '30d' | '60d' | '90d' | 'future'

export interface ExpirationItem {
  id: string
  kind: 'warranty' | 'license'
  name: string
  subtitle?: string | null
  entityId: string
  entityType: string
  expiryDate: string
  daysUntilExpiry: number
  urgency: ExpirationUrgency
  cost?: number | null
  currency?: string | null
  meta?: Record<string, string | null | undefined>
}

export interface ExpirationReport {
  items: ExpirationItem[]
  totals: {
    expired: number
    within30: number
    within60: number
    within90: number
    future: number
    total: number
    exposedValue: number // sum of cost for expired + within 90d
  }
}

// ============ Round 6: Utilization Dashboard ============
export interface UtilizationByBucket {
  bucketId: string
  bucketName: string
  total: number
  inUse: number
  inStock: number
  repair: number
  retired: number
  lost: number
  utilizationRate: number // 0..1 — inUse / (total - retired - lost)
  idleDays?: number | null
}

export interface IdleAsset {
  id: string
  assetTag: string | null
  name: string
  serialNumber: string | null
  status: string
  purchaseDate: string | null
  daysIdle: number
  departmentName?: string | null
  locationName?: string | null
}

export interface UtilizationReport {
  byDepartment: UtilizationByBucket[]
  byAssetType: UtilizationByBucket[]
  overall: {
    totalAssets: number
    inUse: number
    inStock: number
    repair: number
    retired: number
    lost: number
    utilizationRate: number
    idleCount: number
  }
  idleAssets: IdleAsset[]
}

// ============ Round 6: Maintenance Cost Analytics ============
export interface MaintenanceCostByType {
  assetType: string
  totalCost: number
  eventCount: number
  avgCost: number
  assetCount: number
}

export interface MaintenanceCostTrendPoint {
  month: string // YYYY-MM
  totalCost: number
  eventCount: number
}

export interface TopMaintenanceAsset {
  assetId: string
  assetTag: string | null
  assetName: string
  assetTypeName?: string | null
  totalCost: number
  eventCount: number
  lastMaintenanceAt: string | null
}

export interface MaintenanceCostReport {
  byType: MaintenanceCostByType[]
  trend: MaintenanceCostTrendPoint[]
  topAssets: TopMaintenanceAsset[]
  totals: {
    totalCost: number
    totalEvents: number
    avgCostPerEvent: number
    trendDeltaPct: number | null // current month vs previous month
  }
}

// ============ Round 7: Asset Timeline ============
export type TimelineEventType =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'unassigned'
  | 'maintenance.scheduled'
  | 'maintenance.completed'
  | 'maintenance.cancelled'
  | 'booking.created'
  | 'booking.completed'
  | 'license.allocated'
  | 'license.deallocated'
  | 'image.added'
  | 'disposal'
  | 'checkout'
  | 'checkin'

export interface TimelineEvent {
  id: string
  type: TimelineEventType | string
  timestamp: string
  title: string
  description?: string | null
  icon?: string
  actorName?: string | null
  meta?: Record<string, string | number | null | undefined>
}

export interface AssetTimeline {
  assetId: string
  assetTag: string | null
  assetName: string
  events: TimelineEvent[]
  stats: {
    totalEvents: number
    assignmentCount: number
    maintenanceCount: number
    bookingCount: number
    checkoutCount: number
    licenseCount: number
    imageCount: number
    firstEventAt: string | null
    lastEventAt: string | null
  }
}

// ============ Round 7: PO Receiving ============
export interface POReceiveItemPayload {
  itemId: string
  receivedQty: number
}

export interface POReceiveResult {
  po: PurchaseOrder
  receivedItems: { itemId: string; description: string; receivedNow: number; totalReceived: number; quantity: number; fullyReceived: boolean }[]
  allItemsReceived: boolean
  // Round 8: when an item has assetTypeId set, the receiver auto-creates Asset rows
  // one per received unit. Each entry contains the itemId + list of new assetIds.
  createdAssets?: { itemId: string; assetIds: string[]; assetTags: string[] }[]
}

// ============ Round 8: Expiry Renew Workflow ============
export interface ExpiryRenewPayload {
  // assetId for warranty, licenseId for software license
  assetId?: string
  licenseId?: string
  vendorId: string
  expectedDate?: string
  notes?: string
}

export interface ExpiryRenewResult {
  po: PurchaseOrder
  renewedItem: { expiryType: 'warranty' | 'license'; entityId: string; entityName: string; currentExpiry: string | null }
}

// ============ Round 8: Utilization Idle Threshold ============
export interface UtilizationReportOpts {
  idleThresholdDays?: 30 | 60 | 90 | 180
}

// ============ Round 7: Asset Location Map ============
export interface LocationAssetSummary {
  locationId: string
  locationName: string
  address?: string | null
  totalAssets: number
  inUse: number
  inStock: number
  repair: number
  retired: number
  lost: number
  utilizationRate: number
  totalValue: number
  byType: { assetType: string; count: number }[]
  topAssets: {
    id: string
    assetTag: string | null
    name: string
    status: string
    assetType: string
  }[]
}

export interface AssetLocationMapReport {
  locations: LocationAssetSummary[]
  totals: {
    totalLocations: number
    totalAssets: number
    totalValue: number
    avgUtilization: number
  }
  unassigned: {
    count: number
    value: number
  }
}

// ============ Round 7: Cost Forecast ============
export interface CostForecastPoint {
  month: string // YYYY-MM
  historical: number | null // null for future months
  forecast: number | null // null for past months
  lowerBound: number | null
  upperBound: number | null
}

export interface CostForecastCategory {
  category: 'purchase' | 'maintenance' | 'depreciation'
  history: { month: string; value: number }[]
  forecast: { month: string; value: number; lowerBound: number; upperBound: number }[]
  trendSlope: number // per month
  trendDirection: 'up' | 'down' | 'flat'
  totalHistorical: number
  totalForecast: number
  projectedAnnual: number
}

export interface CostForecastReport {
  categories: CostForecastCategory[]
  combined: CostForecastPoint[]
  totals: {
    historicalTotal: number
    forecastTotal: number
    projectedAnnual: number
    trendDirection: 'up' | 'down' | 'flat'
    trendPct: number | null
  }
}

// ============ Round 9: Asset Audit / Physical Inventory ============
export type AuditScope = 'all' | 'location' | 'department' | 'type'
export type AuditStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled'
export type AuditItemStatus = 'Pending' | 'Verified' | 'Missing' | 'Found' | 'Extra'

export interface AssetAudit {
  id: string
  auditNumber: string
  title: string
  scope: AuditScope
  scopeId?: string | null
  scopeName?: string | null
  status: AuditStatus
  startedAt?: string | null
  completedAt?: string | null
  startedById?: string | null
  startedByName?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  // Aggregated stats (computed when fetched via list/get)
  stats?: {
    total: number
    verified: number
    missing: number
    found: number
    extra: number
    pending: number
    accuracyPct: number // verified / (verified + missing) — excludes extras/pending
  }
}

export interface AssetAuditItem {
  id: string
  auditId: string
  assetId?: string | null
  assetTag?: string | null
  assetName?: string | null
  assetTypeName?: string | null
  status: AuditItemStatus
  expected: boolean
  scannedAt?: string | null
  scannedByName?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface AssetAuditCreatePayload {
  title: string
  scope: AuditScope
  scopeId?: string
  notes?: string
  startedById?: string
}

export interface AssetAuditScanPayload {
  // Identify the asset being scanned — must provide at least one identifier.
  assetId?: string
  assetTag?: string
  // Override status: defaults to Verified for expected assets, Extra for unexpected.
  status?: AuditItemStatus
  scannedByName?: string
  notes?: string
}

export interface AssetAuditScanResult {
  auditId: string
  item: AssetAuditItem
  // Whether this scan was on the expected list (true) or a brand-new Extra (false)
  wasExpected: boolean
  // Convenience flag — when true the asset was previously Pending and is now Verified
  newlyVerified: boolean
}

export interface ExpiryBulkRenewItem {
  // Either assetId (for warranty) or licenseId (for software license) must be set
  assetId?: string
  licenseId?: string
}

export interface ExpiryBulkRenewPayload {
  vendorId: string
  items: ExpiryBulkRenewItem[]
  expectedDate?: string
  notes?: string
}

export interface ExpiryBulkRenewResult {
  po: PurchaseOrder
  renewedItems: {
    expiryType: 'warranty' | 'license'
    entityId: string
    entityName: string
    currentExpiry: string | null
  }[]
}

export interface ImportAlias {
  id: string
  alias: string
  field: string
  createdAt: string
  updatedAt: string
}


