'use client'

import { Sidebar, MobileNav } from '@/components/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from '@/components/command-palette'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNav } from '@/lib/nav'
import {
  Search,
  Bell,
  Plus,
  ScanText,
  ArrowLeft,
  HelpCircle,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/lib/api'

function HeaderSearch() {
  const { navigate } = useNav()
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search assets, serial, IMEI..."
        className="pl-9 pr-9 sm:pr-14 h-9 bg-muted/50 border-0 focus-visible:ring-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value
            if (val.trim()) navigate('assets', { search: val.trim() })
          }
        }}
      />
      <kbd className="kbd-pill absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex pointer-events-none">
        ⌘K
      </kbd>
    </div>
  )
}

function QuickActions() {
  const { navigate } = useNav()
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={() => navigate('ocr-upload')}>
        <ScanText className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Add via Image</span>
      </Button>
      <Button size="sm" onClick={() => navigate('asset-new')}>
        <Plus className="h-4 w-4 mr-1.5" />
        <span className="hidden sm:inline">Add Asset</span>
      </Button>
    </div>
  )
}

function HeaderTitle() {
  const { view, params, back } = useNav()
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    assets: 'Assets',
    'asset-detail': 'Asset Detail',
    'asset-new': 'Add New Asset',
    'asset-edit': 'Edit Asset',
    'ocr-upload': 'Add via Image (OCR)',
    departments: 'Departments',
    locations: 'Locations',
    persons: 'Persons',
    'asset-types': 'Asset Types',
    import: 'Import Data',
    reports: 'Reports & Analytics',
    maintenance: 'Maintenance Schedule',
    'audit-log': 'Audit Log',
    licenses: 'Software Licenses',
    'asset-labels': 'Print Asset Labels',
    checkouts: 'Check-out Requests',
    depreciation: 'Asset Depreciation',
    notifications: 'Notifications',
    vendors: 'Vendors & Suppliers',
    'purchase-orders': 'Purchase Orders',
    disposals: 'Asset Disposals',
    tags: 'Asset Tags',
    bookings: 'Asset Bookings',
    expirations: 'Expiry Center',
    utilization: 'Asset Utilization',
    'asset-map': 'Asset Location Map',
    'asset-timeline': 'Asset Timeline',
    audits: 'Asset Audits',
  }
  const showBack = ['asset-detail', 'asset-edit'].includes(view)
  return (
    <div className="flex items-center gap-3">
      {showBack && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={back}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <div className="flex flex-col">
        <h1 className="text-base font-semibold leading-tight">{titles[view] || view}</h1>
        {params.id && (
          <span className="text-xs text-muted-foreground">ID: {params.id}</span>
        )}
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const { navigate } = useNav()
  const { data: stats } = useQuery({
    queryKey: ['dashboard-header'],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 60000,
  })
  const { data: notifData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => fetch('/api/notifications?unread=true&limit=200').then((r) => r.json()),
    refetchInterval: 30000,
  })
  const unreadCount = Array.isArray(notifData) ? notifData.length : 0

  return (
    <div className="flex min-h-screen w-full bg-background app-bg-gradient theme-transition">
      <CommandPalette />
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-6 sticky-elevated">
          {isMobile && <MobileNav />}
          <HeaderTitle />
          <div className="hidden md:flex flex-1 justify-center px-4">
            <HeaderSearch />
          </div>
          <div className="flex items-center gap-2 ml-auto md:ml-0">
            <QuickActions />
            <button
              onClick={() => navigate('notifications')}
              className="relative hidden sm:flex items-center gap-1.5 rounded-lg border bg-muted/30 px-3 py-1.5 hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group"
              title="View notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white animate-pop-in">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-9 w-9 hover:bg-accent">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-[1600px] p-4 lg:p-6">{children}</div>
        </main>
        <footer className="mt-auto border-t bg-background/80 px-4 py-3 backdrop-blur-sm lg:px-6">
          <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-foreground/80">Maylaa Assets</span>
              <span className="opacity-50">·</span>
              <span>Maylaa International v2.6</span>
              <span className="hidden sm:inline opacity-50">·</span>
              <span className="hidden sm:inline rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Round 9</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{stats ? `${stats.totalAssets} assets · ${stats.totalPersons} persons · ${stats.totalDepartments} depts` : 'Loading...'}</span>
              {stats?.procurement && (
                <>
                  <span className="hidden sm:inline opacity-50">·</span>
                  <span className="hidden sm:inline">{stats.procurement.totalPOs} POs · ${stats.procurement.totalSpent.toLocaleString()} spent</span>
                </>
              )}
              {stats?.bookings && stats.bookings.total > 0 && (
                <>
                  <span className="hidden md:inline opacity-50">·</span>
                  <span className="hidden md:inline">{stats.bookings.total} bookings · {stats.bookings.active} active</span>
                </>
              )}
              {stats?.tags && stats.tags.totalTags > 0 && (
                <>
                  <span className="hidden md:inline opacity-50">·</span>
                  <span className="hidden md:inline">{stats.tags.totalTags} tags</span>
                </>
              )}
              <span className="hidden sm:inline opacity-50">·</span>
              <span className="hidden sm:inline">{new Date().getFullYear()} · All systems operational</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
