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
    const csv = await assetAuditRepo.exportCsv(id)
    // Look up audit for filename (parse auditNumber from first CSV line)
    const data = await assetAuditRepo.get(id)
    const auditNumber = data?.audit.auditNumber || id.slice(0, 8)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-${auditNumber}.csv"`,
      },
    })
  } catch (e) {
    const msg = String(e)
    const status = msg.includes('not found') ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
