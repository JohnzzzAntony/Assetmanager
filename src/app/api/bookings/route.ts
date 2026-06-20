export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetBookingRepo } from '@/lib/repo'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const assetId = url.searchParams.get('assetId') || undefined
    const status = url.searchParams.get('status') || undefined
    const bookedById = url.searchParams.get('bookedById') || undefined
    const from = url.searchParams.get('from') || undefined
    const to = url.searchParams.get('to') || undefined
    const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : undefined
    const bookings = await assetBookingRepo.list({ assetId, status, bookedById, from, to, limit })
    return NextResponse.json(bookings)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 })
    if (!data.bookedById) return NextResponse.json({ error: 'bookedById is required' }, { status: 400 })
    if (!data.title || !String(data.title).trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
    if (!data.startDate || !data.endDate) return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    if (new Date(data.endDate) < new Date(data.startDate)) {
      return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 })
    }
    // Check for conflicts
    const conflicts = await assetBookingRepo.findConflicts(data.assetId, data.startDate, data.endDate)
    const created = await assetBookingRepo.create(data)
    return NextResponse.json({ ...created, _conflicts: conflicts }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
