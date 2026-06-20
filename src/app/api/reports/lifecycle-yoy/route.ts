import { NextRequest, NextResponse } from 'next/server'
import { assetLifecycleRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const years = sp.get('years') ? Math.min(Math.max(Number(sp.get('years')) || 2, 2), 5) : 2
    const data = await assetLifecycleRepo.yoyByType(years)
    const totals = {
      currentYear: data.reduce((s, d) => s + d.currentYear, 0),
      previousYear: data.reduce((s, d) => s + d.previousYear, 0),
    }
    const delta = totals.currentYear - totals.previousYear
    const deltaPct = totals.previousYear > 0 ? delta / totals.previousYear : null
    return NextResponse.json({ data, totals: { ...totals, delta, deltaPct } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Lifecycle YoY report error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
