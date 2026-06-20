import { NextRequest, NextResponse } from 'next/server'
import { utilizationRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const raw = sp.get('idleThresholdDays')
    let idleThresholdDays: 30 | 60 | 90 | 180 = 30
    if (raw) {
      const n = parseInt(raw, 10)
      if (n === 30 || n === 60 || n === 90 || n === 180) idleThresholdDays = n
    }
    const data = await utilizationRepo.report(idleThresholdDays)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
