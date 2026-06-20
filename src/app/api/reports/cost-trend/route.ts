export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const months = Number(url.searchParams.get('months') || '12')
    const data = await assetRepo.costTrend(Math.min(Math.max(months, 1), 36))
    return NextResponse.json({ data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Cost trend report error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
