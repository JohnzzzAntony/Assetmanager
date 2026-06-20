'use client'

import { AppShell } from '@/components/app-shell'
import { useNav } from '@/lib/nav'
import dynamic from 'next/dynamic'

const DashboardView = dynamic(() => import('@/components/views/dashboard-view').then((m) => m.DashboardView), { ssr: false })
const AssetsListView = dynamic(() => import('@/components/views/assets-list-view').then((m) => m.AssetsListView), { ssr: false })
const AssetDetailView = dynamic(() => import('@/components/views/asset-detail-view').then((m) => m.AssetDetailView), { ssr: false })
const AssetFormView = dynamic(() => import('@/components/views/asset-form-view').then((m) => m.AssetFormView), { ssr: false })
const OcrUploadView = dynamic(() => import('@/components/views/ocr-upload-view').then((m) => m.OcrUploadView), { ssr: false })
const DepartmentsView = dynamic(() => import('@/components/views/departments-view').then((m) => m.DepartmentsView), { ssr: false })
const LocationsView = dynamic(() => import('@/components/views/locations-view').then((m) => m.LocationsView), { ssr: false })
const PersonsView = dynamic(() => import('@/components/views/persons-view').then((m) => m.PersonsView), { ssr: false })
const AssetTypesView = dynamic(() => import('@/components/views/asset-types-view').then((m) => m.AssetTypesView), { ssr: false })
const ImportView = dynamic(() => import('@/components/views/import-view').then((m) => m.ImportView), { ssr: false })
const ReportsView = dynamic(() => import('@/components/views/reports-view').then((m) => m.ReportsView), { ssr: false })
const MaintenanceView = dynamic(() => import('@/components/views/maintenance-view').then((m) => m.MaintenanceView), { ssr: false })
const AuditLogView = dynamic(() => import('@/components/views/audit-log-view').then((m) => m.AuditLogView), { ssr: false })
const LicensesView = dynamic(() => import('@/components/views/licenses-view').then((m) => m.LicensesView), { ssr: false })
const AssetLabelsView = dynamic(() => import('@/components/views/asset-labels-view').then((m) => m.AssetLabelsView), { ssr: false })
const CheckoutsView = dynamic(() => import('@/components/views/checkouts-view').then((m) => m.CheckoutsView), { ssr: false })
const DepreciationView = dynamic(() => import('@/components/views/depreciation-view').then((m) => m.DepreciationView), { ssr: false })
const NotificationsView = dynamic(() => import('@/components/views/notifications-view').then((m) => m.NotificationsView), { ssr: false })
const VendorsView = dynamic(() => import('@/components/views/vendors-view').then((m) => m.VendorsView), { ssr: false })
const PurchaseOrdersView = dynamic(() => import('@/components/views/purchase-orders-view').then((m) => m.PurchaseOrdersView), { ssr: false })
const DisposalsView = dynamic(() => import('@/components/views/disposals-view').then((m) => m.DisposalsView), { ssr: false })
const TagsView = dynamic(() => import('@/components/views/tags-view').then((m) => m.TagsView), { ssr: false })
const BookingsView = dynamic(() => import('@/components/views/bookings-view').then((m) => m.BookingsView), { ssr: false })
const ExpirationsView = dynamic(() => import('@/components/views/expirations-view').then((m) => m.ExpirationsView), { ssr: false })
const UtilizationView = dynamic(() => import('@/components/views/utilization-view').then((m) => m.UtilizationView), { ssr: false })
const AssetMapView = dynamic(() => import('@/components/views/asset-map-view').then((m) => m.AssetMapView), { ssr: false })
const AssetTimelineView = dynamic(() => import('@/components/views/asset-timeline-view').then((m) => m.AssetTimelineView), { ssr: false })
const AuditsView = dynamic(() => import('@/components/views/audits-view').then((m) => m.AuditsView), { ssr: false })
import { useQuery } from '@tanstack/react-query'
import { assetsApi } from '@/lib/api'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { Database, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

function ViewRouter() {
  const { view, params } = useNav()

  // Database connectivity check
  const { error } = useQuery({
    queryKey: ['assets-db-check'],
    queryFn: () => assetsApi.list({ pageSize: 1 }),
    retry: false,
  })

  if (error) {
    return (
      <Alert variant="destructive">
        <Database className="h-4 w-4" />
        <AlertTitle>Database connection error</AlertTitle>
        <AlertDescription className="flex items-center gap-3">
          <span>{String(error)}</span>
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  switch (view) {
    case 'dashboard':
      return <DashboardView />
    case 'assets':
      return <AssetsListView />
    case 'asset-detail':
      return <AssetDetailView id={params.id} />
    case 'asset-new':
      return <AssetFormView mode="new" />
    case 'asset-edit':
      return <AssetFormView mode="edit" id={params.id} />
    case 'ocr-upload':
      return <OcrUploadView />
    case 'departments':
      return <DepartmentsView />
    case 'locations':
      return <LocationsView />
    case 'persons':
      return <PersonsView />
    case 'asset-types':
      return <AssetTypesView />
    case 'import':
      return <ImportView />
    case 'reports':
      return <ReportsView />
    case 'maintenance':
      return <MaintenanceView />
    case 'audit-log':
      return <AuditLogView />
    case 'licenses':
      return <LicensesView />
    case 'asset-labels':
      return <AssetLabelsView />
    case 'checkouts':
      return <CheckoutsView />
    case 'depreciation':
      return <DepreciationView />
    case 'notifications':
      return <NotificationsView />
    case 'vendors':
      return <VendorsView />
    case 'purchase-orders':
      return <PurchaseOrdersView />
    case 'disposals':
      return <DisposalsView />
    case 'tags':
      return <TagsView />
    case 'bookings':
      return <BookingsView />
    case 'expirations':
      return <ExpirationsView />
    case 'utilization':
      return <UtilizationView />
    case 'asset-map':
      return <AssetMapView />
    case 'asset-timeline':
      return <AssetTimelineView assetId={params.id} />
    case 'audits':
      return <AuditsView />
    default:
      return <DashboardView />
  }
}

export default function Home() {
  return (
    <AppShell>
      <ViewRouter />
    </AppShell>
  )
}
