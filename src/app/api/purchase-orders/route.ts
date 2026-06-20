import { NextRequest, NextResponse } from 'next/server'
import { purchaseOrderRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const vendorId = sp.get('vendorId') || undefined
    const status = sp.get('status') || undefined
    let data = await purchaseOrderRepo.list()
    if (vendorId) data = data.filter((po) => po.vendorId === vendorId)
    if (status) data = data.filter((po) => po.status === status)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.vendorId) {
      return NextResponse.json({ error: 'vendorId required' }, { status: 400 })
    }
    const created = await purchaseOrderRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
