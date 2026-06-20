import { NextRequest, NextResponse } from 'next/server'
import { assetTimelineRepo } from '@/lib/repo'

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

// GET /api/assets/[id]/timeline/export
// Returns the asset's full timeline as a CSV download.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await assetTimelineRepo.getForAsset(id)
    if (!data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const header = ['eventType', 'timestamp', 'title', 'description', 'actorName', 'entityName']
    const entityName = data.assetName
    const rows = data.events.map((ev) => [
      ev.type,
      ev.timestamp ? ev.timestamp.replace('T', ' ').slice(0, 19) : '',
      ev.title || '',
      ev.description || '',
      ev.actorName || '',
      entityName,
    ])

    const csvBody = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    const summary = [
      '',
      `# Asset Timeline — ${entityName}${data.assetTag ? ` (${data.assetTag})` : ''}`,
      `# AssetId,${data.assetId}`,
      `# TotalEvents,${data.stats.totalEvents}`,
      `# Assignments,${data.stats.assignmentCount}`,
      `# Maintenance,${data.stats.maintenanceCount}`,
      `# Bookings,${data.stats.bookingCount}`,
      `# Checkouts,${data.stats.checkoutCount ?? 0}`,
      `# Licenses,${data.stats.licenseCount ?? 0}`,
      `# Images,${data.stats.imageCount ?? 0}`,
      `# FirstEventAt,${data.stats.firstEventAt ? data.stats.firstEventAt.replace('T', ' ').slice(0, 19) : ''}`,
      `# LastEventAt,${data.stats.lastEventAt ? data.stats.lastEventAt.replace('T', ' ').slice(0, 19) : ''}`,
    ].join('\r\n')

    const body = csvBody + '\r\n' + summary
    const filename = `asset-timeline-${id.slice(0, 8)}.csv`
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
