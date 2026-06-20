export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { assetBookingRepo } from '@/lib/repo'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const bookings = await assetBookingRepo.list({ limit: 1000 })
    const headers = ['Title', 'Asset Tag', 'Asset', 'Booked By', 'Status', 'Start Date', 'End Date', 'Purpose', 'Approved By', 'Approved At', 'Checked Out At', 'Checked In At', 'Notes', 'Created At']
    const rows = bookings.map((b) => [
      b.title, b.asset?.assetTag || '', b.asset ? `${b.asset.make || ''} ${b.asset.model || ''}`.trim() : '',
      b.bookedBy?.fullName || '', b.status, b.startDate, b.endDate, b.purpose || '',
      b.approvedBy?.fullName || '', b.approvedAt || '', b.checkedOutAt || '', b.checkedInAt || '',
      b.notes || '', b.createdAt,
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
