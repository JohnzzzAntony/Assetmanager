import { NextRequest, NextResponse } from 'next/server'
import { poReceivingRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json({ error: 'Body must include `items` array' }, { status: 400 })
    }
    const result = await poReceivingRepo.receiveItems(id, body.items)
    if (!result) return NextResponse.json({ error: 'PO not found or has no items' }, { status: 404 })
    return NextResponse.json(result)
  } catch (e) {
    const msg = String(e)
    const status =
      msg.includes('must be in') ||
      msg.includes('No items were advanced') ||
      msg.includes('is required')
        ? 400
        : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
