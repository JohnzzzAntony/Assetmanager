import { NextRequest, NextResponse } from 'next/server'
import { assetAuditRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await assetAuditRepo.get(id)
    if (!data) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
