export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { purchaseOrderRepo } from '@/lib/repo'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const pos = await purchaseOrderRepo.list()
    const headers = ['PO Number', 'Vendor', 'Status', 'Order Date', 'Expected Date', 'Received Date', 'Subtotal', 'Tax Rate %', 'Tax Amount', 'Shipping', 'Total', 'Currency', 'Requested By', 'Approved By', 'Approved At', 'Item Count', 'Notes']
    const rows = pos.map((po) => [
      po.poNumber, po.vendor?.name || '', po.status, po.orderDate, po.expectedDate || '', po.receivedDate || '',
      po.subtotal.toFixed(2), po.taxRate, po.taxAmount.toFixed(2), po.shippingCost.toFixed(2), po.totalAmount.toFixed(2),
      po.currency, po.requestedBy?.fullName || '', po.approvedBy?.fullName || '', po.approvedAt || '',
      po._count?.items || 0, po.notes || '',
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="purchase-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
