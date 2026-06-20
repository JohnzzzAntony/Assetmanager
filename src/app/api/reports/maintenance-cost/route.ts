import { NextRequest, NextResponse } from 'next/server'
import { maintenanceCostRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const months = sp.get('months') ? Number(sp.get('months')) : 12
    const data = await maintenanceCostRepo.report(months)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
