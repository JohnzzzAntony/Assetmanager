import { NextRequest, NextResponse } from 'next/server'
import { depreciationRepo, assetRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/depreciation/calculate — calculate depreciation for all assets
// GET /api/depreciation/calculate?assetId=... — for a specific asset
// GET /api/depreciation/calculate?stats=true — just stats
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    if (sp.get('stats') === 'true') {
      return NextResponse.json(await depreciationRepo.stats())
    }
    if (sp.get('assetId')) {
      const asset = await assetRepo.get(sp.get('assetId')!)
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
      const calc = await depreciationRepo.calculate(asset)
      return NextResponse.json(calc)
    }
    return NextResponse.json(await depreciationRepo.calculateForAll())
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
