import { NextRequest, NextResponse } from 'next/server'
import { disposalRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const assetId = sp.get('assetId') || undefined
    const method = sp.get('method') || undefined
    let data = await disposalRepo.list()
    if (assetId) data = data.filter((d) => d.assetId === assetId)
    if (method) data = data.filter((d) => d.method === method)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.assetId) {
      return NextResponse.json({ error: 'assetId required' }, { status: 400 })
    }
    const created = await disposalRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
