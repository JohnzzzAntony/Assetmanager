import { NextRequest, NextResponse } from 'next/server'
import { activityLogRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const data = await activityLogRepo.list({
      limit: sp.get('limit') ? Number(sp.get('limit')) : 100,
      entityType: sp.get('entityType') || undefined,
      entityId: sp.get('entityId') || undefined,
      action: sp.get('action') || undefined,
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
