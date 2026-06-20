import { NextRequest, NextResponse } from 'next/server'
import { expiryBulkRenewRepo } from '@/lib/repo'
import type { ExpiryBulkRenewPayload } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/expirations/renew-bulk
// Body: { vendorId: string, items: [{ assetId?: string, licenseId?: string }, ...], expectedDate?: string, notes?: string }
// Returns: { po: PurchaseOrder, renewedItems: [{ expiryType, entityId, entityName, currentExpiry }, ...] }
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExpiryBulkRenewPayload
    if (!body || !body.vendorId) {
      return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one renewal item is required' }, { status: 400 })
    }
    // Pre-flight check: each item must have exactly one of assetId / licenseId
    for (const [i, item] of body.items.entries()) {
      const hasAsset = !!item?.assetId
      const hasLicense = !!item?.licenseId
      if (hasAsset === hasLicense) {
        return NextResponse.json(
          { error: `Item #${i + 1} must specify exactly one of assetId or licenseId` },
          { status: 400 }
        )
      }
    }
    const result = await expiryBulkRenewRepo.renewBulk(body)
    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    const msg = String(e)
    const status = msg.includes('not found') || msg.includes('required') || msg.includes('must be')
      ? 400
      : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
