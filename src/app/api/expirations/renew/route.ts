import { NextRequest, NextResponse } from 'next/server'
import { expiryRenewRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || (!body.assetId && !body.licenseId)) {
      return NextResponse.json({ error: 'Either assetId or licenseId is required' }, { status: 400 })
    }
    if (!body.vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }
    const result = await expiryRenewRepo.renew(body)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const msg = String(e)
    const status = msg.includes('not found') || msg.includes('required') || msg.includes('must be') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
