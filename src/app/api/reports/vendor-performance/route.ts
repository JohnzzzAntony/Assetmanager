import { NextResponse } from 'next/server'
import { vendorPerformanceRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await vendorPerformanceRepo.list()
    const totals = {
      vendorCount: data.length,
      activeVendors: data.filter((v) => v.isActive).length,
      totalSpent: data.reduce((s, v) => s + v.totalSpent, 0),
      totalPOs: data.reduce((s, v) => s + v.totalPOs, 0),
      avgOnTimeRate: data.length
        ? data.reduce((s, v) => s + v.onTimeRate, 0) / data.length
        : 0,
      avgRating: data.length
        ? data.reduce((s, v) => s + v.rating, 0) / data.length
        : 0,
    }
    return NextResponse.json({ data, totals })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Vendor performance report error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
