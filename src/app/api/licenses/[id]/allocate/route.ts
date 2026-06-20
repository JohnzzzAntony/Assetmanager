import { NextRequest, NextResponse } from 'next/server'
import { licenseRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Allocate a license to an asset
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: licenseId } = await params
    const body = await req.json()
    if (!body.assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 })
    const lic = await licenseRepo.get(licenseId)
    if (!lic) return NextResponse.json({ error: 'License not found' }, { status: 404 })
    if (lic.seatsUsed >= lic.seatsTotal) {
      return NextResponse.json({ error: 'No available seats' }, { status: 400 })
    }
    const al = await licenseRepo.allocate(licenseId, body.assetId)
    return NextResponse.json(al, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
