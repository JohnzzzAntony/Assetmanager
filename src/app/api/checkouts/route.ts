import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const data = await checkoutRepo.list({
      assetId: sp.get('assetId') || undefined,
      requestedById: sp.get('requestedById') || undefined,
      status: sp.get('status') || undefined,
      requestType: sp.get('requestType') || undefined,
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
    if (!body.assetId || !body.requestedById) {
      return NextResponse.json({ error: 'assetId and requestedById required' }, { status: 400 })
    }
    const created = await checkoutRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
