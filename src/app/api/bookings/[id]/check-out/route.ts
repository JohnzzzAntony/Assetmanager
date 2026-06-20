export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetBookingRepo } from '@/lib/repo'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updated = await assetBookingRepo.update(id, {
      status: 'Active',
      checkedOutAt: new Date().toISOString(),
    })
    if (!updated) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
