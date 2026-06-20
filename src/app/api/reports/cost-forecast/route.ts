import { NextRequest, NextResponse } from 'next/server'
import { costForecastRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const history = sp.get('history') ? Number(sp.get('history')) : 12
    const forecast = sp.get('forecast') ? Number(sp.get('forecast')) : 6
    const data = await costForecastRepo.report(history, forecast)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
