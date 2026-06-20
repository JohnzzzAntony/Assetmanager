export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

export async function GET() {
  try {
    const data = await assetRepo.lifecycleCostByType()
    const totals = data.reduce(
      (acc, d) => {
        acc.purchaseCost += d.purchaseCost
        acc.maintenanceCost += d.maintenanceCost
        acc.disposalCost += d.disposalCost
        acc.residualValue += d.residualValue
        acc.netCost += d.netCost
        acc.assetCount += d.assetCount
        return acc
      },
      { purchaseCost: 0, maintenanceCost: 0, disposalCost: 0, residualValue: 0, netCost: 0, assetCount: 0 }
    )
    return NextResponse.json({ byType: data, totals })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Lifecycle cost report error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
