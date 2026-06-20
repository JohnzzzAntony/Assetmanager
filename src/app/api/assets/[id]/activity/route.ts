import { NextRequest, NextResponse } from 'next/server'
import { activityLogRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// List activity log entries for an asset
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await activityLogRepo.listForEntity('Asset', id))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
