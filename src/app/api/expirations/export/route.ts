import { NextResponse } from 'next/server'
import { expirationRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET() {
  try {
    const { items, totals } = await expirationRepo.list()
    const header = [
      'Kind',
      'Name',
      'Subtitle',
      'EntityType',
      'EntityId',
      'ExpiryDate',
      'DaysUntilExpiry',
      'Urgency',
      'Cost',
      'Currency',
      'AssetTag',
      'AssetType',
      'Department',
      'Vendor',
      'Category',
      'Seats',
    ]
    const rows = items.map((it) => [
      it.kind,
      it.name,
      it.subtitle || '',
      it.entityType,
      it.entityId,
      it.expiryDate ? it.expiryDate.slice(0, 10) : '',
      it.daysUntilExpiry,
      it.urgency,
      it.cost != null ? it.cost.toFixed(2) : '',
      it.currency || '',
      it.meta?.assetTag || '',
      it.meta?.assetType || '',
      it.meta?.department || '',
      it.meta?.vendor || '',
      it.meta?.category || '',
      it.meta?.seats || '',
    ])

    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const summary = [
      '',
      `# Summary`,
      `# Total,${totals.total}`,
      `# Expired,${totals.expired}`,
      `# Within30Days,${totals.within30}`,
      `# Within60Days,${totals.within60}`,
      `# Within90Days,${totals.within90}`,
      `# Future,${totals.future}`,
      `# ExposedValue,${totals.exposedValue.toFixed(2)}`,
    ].join('\r\n')

    const body = csv + summary
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="expirations-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
