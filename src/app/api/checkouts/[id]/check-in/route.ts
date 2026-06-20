import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo, assetRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const checkout = await checkoutRepo.get(id)
    if (!checkout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Update asset status to "In Stock"
    if (checkout.assetId) {
      await assetRepo.update(checkout.assetId, { status: 'In Stock' })
    }
    const updated = await checkoutRepo.checkIn(id, body.condition)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
