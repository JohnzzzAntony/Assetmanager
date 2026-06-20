import { NextRequest, NextResponse } from 'next/server'
import { assetAuditRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await assetAuditRepo.complete(id)
    return NextResponse.json(result, { status: 200 })
  } catch (e) {
    const msg = String(e)
    const status = msg.includes('not found') || msg.includes('Cannot') || msg.includes('already') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
