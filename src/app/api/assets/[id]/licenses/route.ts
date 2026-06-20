import { NextRequest, NextResponse } from 'next/server'
import { licenseRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// List licenses allocated to an asset
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await licenseRepo.listForAsset(id))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Deallocate a license from this asset (by assetLicenseId in body)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: assetId } = await params
    const body = await req.json().catch(() => ({}))
    const assetLicenseId = body.assetLicenseId
    if (!assetLicenseId) return NextResponse.json({ error: 'assetLicenseId required' }, { status: 400 })
    await licenseRepo.deallocate(assetLicenseId)
    return NextResponse.json({ success: true, assetId })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
