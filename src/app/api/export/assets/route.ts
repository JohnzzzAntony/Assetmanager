export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const { data: assets } = await assetRepo.list({ pageSize: 1000 })
    const headers = ['Asset Tag', 'Type', 'Make', 'Model', 'Model Number', 'Serial Number', 'Status', 'Purchase Date', 'Cost', 'Currency', 'Warranty Expiry', 'OS', 'CPU', 'RAM', 'Storage', 'IMEI 1', 'IMEI 2', 'Assigned To', 'Department', 'Location', 'Tags', 'Created At']
    const rows = assets.map((a) => [
      a.assetTag || '', a.assetType?.name || '', a.make || '', a.model || '', a.modelNumber || '',
      a.serialNumber || '', a.status, a.purchaseDate || '', a.cost || 0, a.currency,
      a.warrantyExpiry || '', a.os || '', a.cpu || '', a.ram || '', a.storage || '',
      a.imei1 || '', a.imei2 || '', a.assignedTo?.fullName || '',
      a.department?.name || '', a.location?.name || '',
      (a.tags?.map((t) => t.name).join('; ')) || '', a.createdAt,
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="assets-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
