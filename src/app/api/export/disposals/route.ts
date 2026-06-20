export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { disposalRepo } from '@/lib/repo'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const disposals = await disposalRepo.list()
    const headers = ['Disposal Number', 'Asset Tag', 'Asset', 'Method', 'Reason', 'Disposal Date', 'Residual Value', 'Disposal Cost', 'Net Proceeds', 'Buyer/Recipient', 'Condition', 'Environmental Compliant', 'Certificate #', 'Approved By', 'Approved At', 'Notes']
    const rows = disposals.map((d) => [
      d.disposalNumber || '', d.asset?.assetTag || '', d.asset ? `${d.asset.make || ''} ${d.asset.model || ''}`.trim() : '',
      d.method, d.reason || '', d.disposalDate, d.residualValue.toFixed(2), d.disposalCost.toFixed(2), d.netProceeds.toFixed(2),
      d.buyerRecipient || '', d.conditionAtDisposal || '', d.environmentalCompliant ? 'Yes' : 'No',
      d.certificateNumber || '', d.approvedBy?.fullName || '', d.approvedAt || '', d.notes || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="disposals-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
