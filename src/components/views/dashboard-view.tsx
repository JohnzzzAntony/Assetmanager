'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardApi, assetsApi, maintenanceApi, auditLogApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useNav } from '@/lib/nav'
import { formatRelative, formatCurrency } from '@/lib/format'
import { STATUS_CONFIG } from '@/lib/types'
import {
  Package,
  CheckCircle2,
  Boxes,
  Wrench,
  Archive,
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  MapPin,
  Map as MapIcon,
  Sparkles,
  ArrowRight,
  ScanText,
  Upload,
  Plus,
  Activity,
  DollarSign,
  ShieldAlert,
  KeyRound,
  ScrollText,
  Clock,
  ArrowLeftRight,
  TrendingDown,
  Bell,
  BellRing,
  Store,
  ShoppingCart,
  Trash2,
  Recycle,
  Tag,
  CalendarClock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  'In Use': '#10b981',
  'In Stock': '#64748b',
  Repair: '#f59e0b',
  Retired: '#f43f5e',
  Lost: '#ef4444',
}

const CHART_COLORS = ['#0f172a', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
  onClick,
}: {
  label: string
  value: number | string
  icon: typeof Package
  trend?: string
  color: string
  onClick?: () => void
}) {
  return (
    <Card
      className="card-hover card-hover-lift stat-tile-gradient group cursor-pointer overflow-hidden border-l-4 shadow-soft relative hover-lift card-3d-tilt"
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundColor: `${color}14` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, ${color}08, transparent 70%)` }} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon className="h-4 w-4 transition-transform" style={{ color }} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-bold tracking-tight tabular-nums animate-count-pop animate-count-up">{value}</div>
        {trend && (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            <TrendingUp className="h-3 w-3" style={{ color }} />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  color,
}: {
  title: string
  description: string
  icon: typeof Package
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className="card-hover card-hover-lift hover-lift group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: `linear-gradient(135deg, ${color}10, transparent 70%)` }} />
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110 group-hover:-rotate-3 relative"
        style={{ backgroundColor: `${color}1a` }}
      >
        <Icon className="h-5 w-5 transition-transform" style={{ color }} />
      </div>
      <div className="flex flex-col gap-0.5 relative">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 relative">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    </button>
  )
}

export function DashboardView() {
  const { navigate } = useNav()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get(),
  })
  const { data: recentAssets } = useQuery({
    queryKey: ['recent-assets'],
    queryFn: () => assetsApi.list({ pageSize: 5, sortBy: 'createdAt', sortDir: 'desc' }),
  })
  const { data: maintData } = useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: () => maintenanceApi.upcoming(),
  })

  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-32 p-4 space-y-3">
            <CardContent className="p-0 space-y-2">
              <span className="skeleton-text" style={{ width: '40%', height: '0.625rem' }} />
              <span className="skeleton-text" style={{ width: '60%', height: '1.5rem' }} />
              <span className="skeleton-text" style={{ width: '30%', height: '0.625rem' }} />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalByStatus = stats.totalAssets || 1
  const statusData = stats.byStatus.map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#94a3b8',
  }))

  const typeData = stats.byType.map((t, i) => ({
    name: t.name,
    count: t.count,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 hover-lift dot-pattern-bg bg-radial-spotlight">
        <div className="absolute inset-0 hero-gradient opacity-100" />
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/5 blur-3xl animate-pulse-soft" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="live-dot" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">All systems operational</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                <Sparkles className="h-3 w-3" />
                Round 7
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome to Maylaa Assets <span className="inline-block animate-fade-in-up">👋</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              You have <span className="font-semibold text-foreground">{stats.totalAssets}</span> assets across{' '}
              <span className="font-semibold text-foreground">{stats.totalDepartments}</span> departments and{' '}
              <span className="font-semibold text-foreground">{stats.totalLocations}</span> locations.
              Total portfolio value:{' '}
              <span className="gradient-text-shine font-bold">{formatCurrency(stats.totalValue)}</span>.
              <span className="ml-2 inline-flex items-center gap-1 align-middle">
                <span className="status-pulse-dot" aria-hidden="true" />
                <span className="text-shimmer text-xs uppercase tracking-wider">Live</span>
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('ocr-upload')} className="bg-background/50 backdrop-blur-sm">
              <ScanText className="h-4 w-4 mr-1.5" /> Scan Image
            </Button>
            <Button size="sm" onClick={() => navigate('asset-new')}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Asset
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Assets"
          value={stats.totalAssets}
          icon={Package}
          color="#0f172a"
          onClick={() => navigate('assets')}
        />
        <StatCard
          label="In Use"
          value={stats.inUse}
          icon={CheckCircle2}
          color="#10b981"
          trend={`${Math.round((stats.inUse / totalByStatus) * 100)}% utilization`}
          onClick={() => navigate('assets', { status: 'In Use' })}
        />
        <StatCard
          label="In Stock"
          value={stats.inStock}
          icon={Boxes}
          color="#64748b"
          onClick={() => navigate('assets', { status: 'In Stock' })}
        />
        <StatCard
          label="In Repair"
          value={stats.repair}
          icon={Wrench}
          color="#f59e0b"
          onClick={() => navigate('assets', { status: 'Repair' })}
        />
        <StatCard
          label="Retired"
          value={stats.retired}
          icon={Archive}
          color="#f43f5e"
          onClick={() => navigate('assets', { status: 'Retired' })}
        />
        <StatCard
          label="Lost"
          value={stats.lost}
          icon={AlertTriangle}
          color="#ef4444"
          onClick={() => navigate('assets', { status: 'Lost' })}
        />
        <StatCard
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          icon={DollarSign}
          color="#8b5cf6"
        />
        <StatCard
          label="Warranty Expiring"
          value={stats.warrantyExpiringSoon}
          icon={ShieldAlert}
          color="#06b6d4"
          trend="within 30 days"
        />
        {/* Decorative "Needs Attention" heading using the warm gradient text utility. */}
        <div className="sr-only text-gradient-warm">Needs Attention</div>
      </div>

      {/* Operations Overview - new features stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Checkouts */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#8b5cf6' }}
          onClick={() => navigate('checkouts')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check-out Requests</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-transform group-hover:scale-110">
              <ArrowLeftRight className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.checkouts?.total ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-amber-600 font-medium">{stats.checkouts?.pending ?? 0} pending</span>
              <span className="text-violet-600 font-medium">{stats.checkouts?.checkedOut ?? 0} out</span>
              {(stats.checkouts?.overdue ?? 0) > 0 && (
                <span className="text-rose-600 font-medium">{stats.checkouts?.overdue} overdue</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Depreciation */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#10b981' }}
          onClick={() => navigate('depreciation')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Asset Value</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 transition-transform group-hover:scale-110">
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              {formatCurrency(stats.depreciation?.totalCurrentValue ?? 0)}
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>of {formatCurrency(stats.depreciation?.totalPurchaseValue ?? 0)} purchase</span>
              <span className="text-rose-600 font-medium">-{formatCurrency(stats.depreciation?.totalDepreciation ?? 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: (stats.notifications?.unread ?? 0) > 0 ? '#f43f5e' : '#0ea5e9' }}
          onClick={() => navigate('notifications')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notifications</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 transition-transform group-hover:scale-110">
              {(stats.notifications?.unread ?? 0) > 0 ? (
                <BellRing className="h-4 w-4 text-rose-600 animate-pulse" />
              ) : (
                <Bell className="h-4 w-4 text-sky-600" />
              )}
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              {stats.notifications?.unread ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">unread</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>{stats.notifications?.total ?? 0} total</span>
              {(stats.notifications?.critical ?? 0) > 0 && (
                <span className="text-rose-600 font-medium">{stats.notifications?.critical} critical</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick add new asset */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#0f172a' }}
          onClick={() => navigate('asset-new')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Add Asset</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
              <Plus className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-base font-medium leading-tight mt-1">Add a new asset to the inventory</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Click to start the asset creation form
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance & License Stats Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: '#0ea5e9' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground shimmer-underline">Maintenance Overview</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.maintenance?.total ?? 0}</span>
                <span className="text-xs text-muted-foreground">total records</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <Wrench className="h-4 w-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-md bg-sky-500/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Scheduled</p>
              <p className="text-lg font-bold text-sky-600">{stats.maintenance?.scheduled ?? 0}</p>
            </div>
            <div className="rounded-md bg-amber-500/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">In Progress</p>
              <p className="text-lg font-bold text-amber-600">{stats.maintenance?.inProgress ?? 0}</p>
            </div>
            <div className="rounded-md bg-rose-500/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Overdue</p>
              <p className="text-lg font-bold text-rose-600">{stats.maintenance?.overdue ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: '#8b5cf6' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground">Software Licenses</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.licenses?.total ?? 0}</span>
                <span className="text-xs text-muted-foreground">active licenses</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <KeyRound className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Seats Used</span>
              <span className="font-medium">
                {stats.licenses?.usedSeats ?? 0} / {stats.licenses?.totalSeats ?? 0}
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="progress-stripes h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{
                  width: `${stats.licenses?.totalSeats ? Math.min(100, ((stats.licenses.usedSeats || 0) / stats.licenses.totalSeats) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Total value: <span className="font-medium text-foreground">{formatCurrency(stats.licenses?.totalValue ?? 0)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: '#10b981' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-muted-foreground">Upcoming Maintenance</CardTitle>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{maintData?.upcoming.length ?? 0}</span>
                <span className="text-xs text-muted-foreground">in 30 days</span>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {maintData?.upcoming.length ? (
              <div className="space-y-1 max-h-16 overflow-y-auto scrollbar-thin">
                {maintData.upcoming.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[11px]">
                    <span className="truncate">{m.title}</span>
                    <span className="text-muted-foreground whitespace-nowrap ml-2">{formatRelative(m.scheduledFor)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Nothing scheduled</p>
            )}
            <Button variant="ghost" size="sm" className="mt-1 h-6 w-full text-xs" onClick={() => navigate('maintenance')}>
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 chart-bar-grow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base shimmer-underline">Assets by Type</CardTitle>
              <CardDescription>Distribution across asset categories</CardDescription>
            </div>
            <Badge variant="secondary">{stats.byType.length} types</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.7 0.01 240 / 0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid oklch(0.91 0.005 240)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status Breakdown</CardTitle>
            <CardDescription>Current asset status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid oklch(0.91 0.005 240)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-medium">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments & Locations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Assets by Department</CardTitle>
              <CardDescription>Department-wise distribution</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('departments')}>
              <Building2 className="h-4 w-4 mr-1" /> Manage
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byDepartment.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No departments yet</p>
            ) : (
              stats.byDepartment.slice(0, 6).map((d) => {
                const pct = Math.round((d.count / totalByStatus) * 100)
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground">
                        {d.count} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="progress-stripes h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base shimmer-underline">Assets by Location</CardTitle>
              <CardDescription>Location-wise distribution</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('locations')}>
              <MapPin className="h-4 w-4 mr-1" /> Manage
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byLocation.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No locations yet</p>
            ) : (
              stats.byLocation.slice(0, 6).map((l) => {
                const pct = Math.round((l.count / totalByStatus) * 100)
                return (
                  <div key={l.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-muted-foreground">
                        {l.count} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="progress-stripes h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickActionCard
            title="Add New Asset"
            description="Manually create an asset record"
            icon={Plus}
            onClick={() => navigate('asset-new')}
            color="#0f172a"
          />
          <QuickActionCard
            title="Add via Image (OCR)"
            description="Upload a photo and auto-extract details"
            icon={ScanText}
            onClick={() => navigate('ocr-upload')}
            color="#10b981"
          />
          <QuickActionCard
            title="Import from Excel"
            description="Bulk import assets from CSV/XLSX"
            icon={Upload}
            onClick={() => navigate('import')}
            color="#f59e0b"
          />
          <QuickActionCard
            title="View Reports"
            description="Analytics and export tools"
            icon={Activity}
            onClick={() => navigate('reports')}
            color="#8b5cf6"
          />
          <QuickActionCard
            title="Location Map"
            description="View assets by location"
            icon={MapIcon}
            onClick={() => navigate('asset-map')}
            color="#0ea5e9"
          />
        </div>
      </div>

      {/* Recent activity & recent assets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest assignment changes</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {stats.recentActivity.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="leading-tight">
                        <span className="font-medium">{a.action}</span>
                        {a.asset && (
                          <span className="text-muted-foreground">
                            {' '}
                            — {a.asset.assetTag || a.asset.model || a.asset.id.slice(0, 8)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.person?.fullName || 'Unassigned'} · {formatRelative(a.assignedOn)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recently Added Assets</CardTitle>
              <CardDescription>Latest entries in the system</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('assets')}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!recentAssets || recentAssets.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No assets yet</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {recentAssets.data.map((asset) => {
                  const cfg = STATUS_CONFIG[asset.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['In Stock']
                  return (
                    <button
                      key={asset.id}
                      onClick={() => navigate('asset-detail', { id: asset.id })}
                      className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-accent/50"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg}`}>
                        <Package className={`h-4 w-4 ${cfg.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">
                          {asset.make} {asset.model}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {asset.assetTag || asset.serialNumber || 'No tag'}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${cfg.bg} ${cfg.text} border-0`}>
                        {asset.status}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Audit Log</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('audit-log')}>
              All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!stats.auditLog || stats.auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No audit entries yet</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                {stats.auditLog.slice(0, 8).map((log) => (
                  <div key={log.id} className="flex items-start gap-2 rounded-md border p-2 text-xs hover:bg-accent/30">
                    <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{log.action}</p>
                      <p className="text-muted-foreground truncate">{log.details}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelative(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Procurement & Lifecycle Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Vendors card */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#0ea5e9' }}
          onClick={() => navigate('vendors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vendors</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 transition-transform group-hover:scale-110">
              <Store className="h-4 w-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.vendors?.total ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-emerald-600 font-medium">{stats.vendors?.active ?? 0} active</span>
              <span>Manage suppliers</span>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Orders card */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#8b5cf6' }}
          onClick={() => navigate('purchase-orders')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Purchase Orders</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-transform group-hover:scale-110">
              <ShoppingCart className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.procurement?.totalPOs ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-amber-600 font-medium">{stats.procurement?.pendingApproval ?? 0} pending</span>
              <span className="text-sky-600 font-medium">{stats.procurement?.open ?? 0} open</span>
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              Total spend: <span className="font-semibold text-foreground">{formatCurrency(stats.procurement?.totalSpent ?? 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Disposals card */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#10b981' }}
          onClick={() => navigate('disposals')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset Disposals</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 transition-transform group-hover:scale-110">
              <Recycle className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.disposals?.total ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-emerald-600 font-medium">+{formatCurrency(stats.disposals?.totalRecovered ?? 0)}</span>
              <span className="text-rose-600 font-medium">-{formatCurrency(stats.disposals?.totalCost ?? 0)}</span>
            </div>
            {(stats.disposals?.pendingApproval ?? 0) > 0 && (
              <div className="mt-1.5 text-[11px] text-amber-600 font-medium">
                {stats.disposals?.pendingApproval} awaiting approval
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bookings & Tags Overview */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bookings card */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#06b6d4' }}
          onClick={() => navigate('bookings')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset Bookings</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 transition-transform group-hover:scale-110">
              <CalendarClock className="h-4 w-4 text-cyan-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.bookings?.total ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-amber-600 font-medium">{stats.bookings?.pending ?? 0} pending</span>
              <span className="text-emerald-600 font-medium">{stats.bookings?.active ?? 0} active</span>
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              Upcoming: <span className="font-semibold text-foreground">{stats.bookings?.upcoming ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tags card */}
        <Card
          className="card-hover group cursor-pointer overflow-hidden border-l-4 shadow-soft relative"
          style={{ borderLeftColor: '#ec4899' }}
          onClick={() => navigate('tags')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset Tags</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10 transition-transform group-hover:scale-110">
              <Tag className="h-4 w-4 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight tabular-nums">{stats.tags?.totalTags ?? 0}</div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-pink-600 font-medium">{stats.tags?.totalLinks ?? 0} tag assignments</span>
            </div>
            {stats.tags?.topTags && stats.tags.topTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {stats.tags.topTags.slice(0, 3).map((t) => (
                  <span key={t.name} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium bg-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color === 'slate' ? '#64748b' : `var(--tw-${t.color}-500, ${t.color})` }} />
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Workflow Shortcuts */}
        <Card className="overflow-hidden border-l-4 shadow-soft" style={{ borderLeftColor: '#f59e0b' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => navigate('asset-new')}>
              <Plus className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> Add Asset
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => navigate('ocr-upload')}>
              <ScanText className="h-3.5 w-3.5 mr-1.5 text-violet-600" /> OCR Scan
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => navigate('bookings')}>
              <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-cyan-600" /> New Booking
            </Button>
            <Button variant="outline" size="sm" className="justify-start text-xs h-8" onClick={() => navigate('tags')}>
              <Tag className="h-3.5 w-3.5 mr-1.5 text-pink-600" /> Manage Tags
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
