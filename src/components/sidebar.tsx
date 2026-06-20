'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useNav } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Package,
  ScanText,
  Building2,
  MapPin,
  Users,
  Layers,
  Upload,
  BarChart3,
  Boxes,
  Menu,
  ChevronRight,
  CircleDot,
  Wrench,
  ScrollText,
  KeyRound,
  QrCode,
  ArrowLeftRight,
  TrendingDown,
  Bell,
  Store,
  ShoppingCart,
  Trash2,
  Tag,
  CalendarClock,
  CalendarX2,
  Gauge,
  Map as MapIcon,
  GitBranch,
  ClipboardCheck,
} from 'lucide-react'
import type { ViewName } from '@/lib/nav'

interface NavItem {
  label: string
  view: ViewName
  icon: typeof LayoutDashboard
  group?: string
  badge?: 'new'
}

/** Footer summary card shown at the bottom of the sidebar (desktop + mobile). */
function SidebarFooter() {
  return (
    <div className="border-t px-3 py-3">
      <div className="glass-card-strong rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-foreground">System Status</span>
          <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Operational
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CircleDot className="h-3 w-3 text-emerald-500 animate-pulse" />
          <span>v2.6 · Round 9</span>
        </div>
      </div>
    </div>
  )
}

/** Visual ⌘K shortcut hint shown at the top of the mobile Sheet. */
function CmdkHint() {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      aria-hidden="true"
    >
      <span className="font-medium">Press</span>
      <span className="flex items-center gap-1.5">
        <kbd className="kbd-pill">⌘K</kbd>
        <span className="text-muted-foreground/60">or</span>
        <kbd className="kbd-pill">/</kbd>
        <span className="text-muted-foreground">to search</span>
      </span>
    </div>
  )
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Assets', view: 'assets', icon: Package, group: 'Overview' },
  { label: 'Utilization', view: 'utilization', icon: Gauge, group: 'Overview', badge: 'new' },
  { label: 'Expiry Center', view: 'expirations', icon: CalendarX2, group: 'Overview', badge: 'new' },
  { label: 'Location Map', view: 'asset-map', icon: MapIcon, group: 'Overview', badge: 'new' },
  { label: 'Reports', view: 'reports', icon: BarChart3, group: 'Overview' },
  { label: 'Audit Log', view: 'audit-log', icon: ScrollText, group: 'Overview', badge: 'new' },
  { label: 'Asset Audits', view: 'audits', icon: ClipboardCheck, group: 'Overview', badge: 'new' },
  { label: 'Notifications', view: 'notifications', icon: Bell, group: 'Overview', badge: 'new' },
  { label: 'Add Asset', view: 'asset-new', icon: Boxes, group: 'Create' },
  { label: 'Add via Image (OCR)', view: 'ocr-upload', icon: ScanText, group: 'Create' },
  { label: 'Import Excel', view: 'import', icon: Upload, group: 'Create' },
  { label: 'Print Asset Labels', view: 'asset-labels', icon: QrCode, group: 'Create', badge: 'new' },
  { label: 'Check-out Requests', view: 'checkouts', icon: ArrowLeftRight, group: 'Manage', badge: 'new' },
  { label: 'Maintenance', view: 'maintenance', icon: Wrench, group: 'Manage', badge: 'new' },
  { label: 'Depreciation', view: 'depreciation', icon: TrendingDown, group: 'Manage', badge: 'new' },
  { label: 'Software Licenses', view: 'licenses', icon: KeyRound, group: 'Manage', badge: 'new' },
  { label: 'Asset Disposals', view: 'disposals', icon: Trash2, group: 'Manage', badge: 'new' },
  { label: 'Asset Tags', view: 'tags', icon: Tag, group: 'Manage', badge: 'new' },
  { label: 'Asset Bookings', view: 'bookings', icon: CalendarClock, group: 'Manage', badge: 'new' },
  { label: 'Vendors', view: 'vendors', icon: Store, group: 'Procurement', badge: 'new' },
  { label: 'Purchase Orders', view: 'purchase-orders', icon: ShoppingCart, group: 'Procurement', badge: 'new' },
  { label: 'Departments', view: 'departments', icon: Building2, group: 'Manage' },
  { label: 'Locations', view: 'locations', icon: MapPin, group: 'Manage' },
  { label: 'Persons', view: 'persons', icon: Users, group: 'Manage' },
  { label: 'Asset Types', view: 'asset-types', icon: Layers, group: 'Manage' },
]

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { view, navigate } = useNav()
  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group || 'Other')))

  return (
    <nav className="flex flex-col gap-5 px-3 py-4">
      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 relative">
            <span className="relative z-10">{group}</span>
            <span className="absolute left-3 right-3 bottom-0 h-px section-divider opacity-50" />
          </div>
          {NAV_ITEMS.filter((i) => (i.group || 'Other') === group).map((item) => {
            const Icon = item.icon
            const active = view === item.view ||
              (item.view === 'assets' && (view === 'asset-detail' || view === 'asset-edit'))
            return (
              <button
                key={item.view}
                onClick={() => {
                  navigate(item.view)
                  onNavigate?.()
                }}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all min-h-[44px] sm:min-h-0',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm nav-active-glow'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0 transition-transform', active ? '' : 'text-muted-foreground/60 group-hover:text-foreground group-hover:scale-110')} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge === 'new' && (
                  <span className={cn(
                    'rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25'
                  )}>New</span>
                )}
                {active && <ChevronRight className="h-4 w-4 animate-slide-in-right" />}
              </button>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
        <Boxes className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight">Maylaa Assets</span>
        <span className="text-[10px] text-muted-foreground">Maylaa International</span>
      </div>
    </Link>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar/50 backdrop-blur-sm">
      <Brand />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <NavList />
      </div>
      <SidebarFooter />
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <Brand />
        <div className="overflow-y-auto h-[calc(100vh-65px)] scrollbar-thin flex flex-col">
          <div className="px-3 pt-3">
            <CmdkHint />
          </div>
          <div className="flex-1">
            <NavList onNavigate={() => setOpen(false)} />
          </div>
          <SidebarFooter />
        </div>
      </SheetContent>
    </Sheet>
  )
}
