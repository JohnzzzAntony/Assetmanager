import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo, assetsApi } from '@/lib/repo'
import { assetRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const checkout = await checkoutRepo.get(id)
    if (!checkout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // Update asset status to "In Use"
    if (checkout.assetId) {
      await assetRepo.update(checkout.assetId, { status: 'In Use' })
    }
    const updated = await checkoutRepo.checkOut(id)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
