import { NextRequest, NextResponse } from 'next/server'
import { maintenanceRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const data = await maintenanceRepo.list({
      assetId: sp.get('assetId') || undefined,
      status: sp.get('status') || undefined,
      type: sp.get('type') || undefined,
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.assetId || !body.title || !body.scheduledFor) {
      return NextResponse.json({ error: 'assetId, title, scheduledFor required' }, { status: 400 })
    }
    const created = await maintenanceRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
