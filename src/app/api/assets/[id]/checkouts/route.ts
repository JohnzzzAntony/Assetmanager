import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// List checkout requests for an asset
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await checkoutRepo.listForAsset(id))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
