import { NextRequest, NextResponse } from 'next/server'
import { assetAuditRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    if (!body || (!body.assetId && !body.assetTag)) {
      return NextResponse.json(
        { error: 'Either assetId or assetTag is required' },
        { status: 400 }
      )
    }
    const result = await assetAuditRepo.scan(id, body)
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    const msg = String(e)
    const status =
      msg.includes('not found') ||
      msg.includes('required') ||
      msg.includes('Cannot scan')
        ? 400
        : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
